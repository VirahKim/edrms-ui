import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import {
  listPhysicalFiles, receivePhysicalFile, returnPhysicalFile, acknowledgePhysicalReturn, handOverPhysicalFile,
} from "../../../api/registersApi";
import { listFiles } from "../../../api/recordsApi";
import { getFileDocuments } from "../../../api/edmsApi";
import UserSelect from "../../communication/components/UserSelect";
import { toast } from "../components/EDMSToast";

// Each tab is one stage of a paper file's custody. "open" is everything not yet closed.
const TABS = [
  { key: "open", label: "Open", filter: (r) => r.status !== "CLOSED" },
  { key: "SENT", label: "Waiting for receipt", filter: (r) => r.status === "SENT" },
  { key: "RECEIVED", label: "With holders", filter: (r) => r.status === "RECEIVED" },
  { key: "RETURNED", label: "Returned, to acknowledge", filter: (r) => r.status === "RETURNED" },
  { key: "CLOSED", label: "Closed", filter: (r) => r.status === "CLOSED" },
];

const STATUS_TONES = { SENT: "warning", RECEIVED: "primary", RETURNED: "info", CLOSED: "success" };

const SCOPE_LABELS = { FILE: "Whole file", DOCUMENT: "Single document" };

const EMPTY_HANDOVER = { folder_id: "", scope: "FILE", document_id: "", to_kind: "user", to_user_id: null, to_location: "", purpose: "" };

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

/**
 * File Movement Register: where each physical file is, who holds it, and the
 * acknowledgements that move it on. The server checks who may press each button.
 */
const PhysicalFilesPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState([]);
  const [fileDocs, setFileDocs] = useState([]);
  const [form, setForm] = useState(EMPTY_HANDOVER);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listPhysicalFiles()
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch((err) => toast.error(err?.response?.data?.message || "Could not load the File Movement Register."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, request, message) => {
    setBusyId(id);
    try {
      await request(id);
      toast.success(message);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "The action could not be completed.");
    } finally {
      setBusyId(null);
    }
  };

  // The files to choose from, loaded when the form is first opened.
  useEffect(() => {
    if (!showForm || files.length > 0) return;
    listFiles()
      .then((res) => setFiles(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch(() => toast.error("Could not load the physical files."));
  }, [showForm, files.length]);

  // The documents filed in the chosen file, for sending a single document.
  useEffect(() => {
    setFileDocs([]);
    if (!form.folder_id || form.scope !== "DOCUMENT") return;
    getFileDocuments(form.folder_id, { page: 1, page_size: 200 })
      .then((res) => {
        const body = res?.data ?? res;
        setFileDocs(Array.isArray(body) ? body : body?.items || body?.documents || body?.data || []);
      })
      .catch(() => toast.error("Could not load the documents in this file."));
  }, [form.folder_id, form.scope]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const canHandOver = Boolean(form.folder_id)
    && (form.scope === "FILE" || Boolean(form.document_id))
    && (form.to_kind === "user" ? form.to_user_id != null : form.to_location.trim() !== "");

  const handOver = async () => {
    setSaving(true);
    try {
      await handOverPhysicalFile({
        folder_id: Number(form.folder_id),
        document_id: form.scope === "DOCUMENT" ? Number(form.document_id) : null,
        to_user_id: form.to_kind === "user" ? form.to_user_id : null,
        to_location: form.to_kind === "location" ? form.to_location.trim() : null,
        purpose: form.purpose.trim() || null,
      });
      toast.success(form.scope === "DOCUMENT" ? "Document handed over. Waiting for receipt." : "File handed over. Waiting for receipt.");
      setForm(EMPTY_HANDOVER);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "The handover could not be recorded.");
    } finally {
      setSaving(false);
    }
  };

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];
  const visible = rows.filter(activeTab.filter);

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">File Movement Register</h5>
            <div className="text-muted small">
              Physical files, and single documents taken out of them, and where they are. Each handover is
              acknowledged by the person who receives it, and each return is acknowledged by the Registry Officer.
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowForm((s) => !s)}>
            <i className={`ti ${showForm ? "ti-x" : "ti-arrows-exchange"} me-1`} />{showForm ? "Close" : "Hand over"}
          </button>
        </div>

        {showForm && (
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Physical file <span className="text-danger">*</span></label>
                  <select className="form-select form-select-sm" value={form.folder_id}
                    onChange={(e) => setForm((f) => ({ ...f, folder_id: e.target.value, document_id: "" }))}>
                    <option value="">Select a file…</option>
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>{f.reference_no} — {f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">What is being handed over</label>
                  <div className="d-flex gap-3 pt-1">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="handover-scope" id="handover-file"
                        checked={form.scope === "FILE"} onChange={() => setForm((f) => ({ ...f, scope: "FILE", document_id: "" }))} />
                      <label className="form-check-label small" htmlFor="handover-file">Whole file, with all its documents</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="handover-scope" id="handover-doc"
                        checked={form.scope === "DOCUMENT"} onChange={() => setForm((f) => ({ ...f, scope: "DOCUMENT" }))} />
                      <label className="form-check-label small" htmlFor="handover-doc">A single document</label>
                    </div>
                  </div>
                </div>
                {form.scope === "DOCUMENT" && (
                  <div className="col-md-12">
                    <label className="form-label small fw-semibold">Document <span className="text-danger">*</span></label>
                    <select className="form-select form-select-sm" value={form.document_id} onChange={setField("document_id")}
                      disabled={!form.folder_id}>
                      <option value="">{form.folder_id ? "Select a document in this file…" : "Choose the file first"}</option>
                      {fileDocs.map((d) => (
                        <option key={d.id ?? d.document_id} value={d.id ?? d.document_id}>
                          {d.document_reference ? `${d.document_reference} — ` : ""}{d.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Hand over to <span className="text-danger">*</span></label>
                  <div className="d-flex gap-3 mb-1">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="handover-to" id="handover-user"
                        checked={form.to_kind === "user"} onChange={() => setForm((f) => ({ ...f, to_kind: "user" }))} />
                      <label className="form-check-label small" htmlFor="handover-user">An officer</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="handover-to" id="handover-location"
                        checked={form.to_kind === "location"} onChange={() => setForm((f) => ({ ...f, to_kind: "location" }))} />
                      <label className="form-check-label small" htmlFor="handover-location">A room or office</label>
                    </div>
                  </div>
                  {form.to_kind === "user" ? (
                    <UserSelect value={form.to_user_id} onChange={(id) => setForm((f) => ({ ...f, to_user_id: id }))} />
                  ) : (
                    <input className="form-control form-control-sm" value={form.to_location} onChange={setField("to_location")}
                      placeholder="Room or office" maxLength={200} />
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Purpose</label>
                  <input className="form-control form-control-sm" value={form.purpose} onChange={setField("purpose")} maxLength={500} />
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={handOver} disabled={!canHandOver || saving}>
                  {saving ? "Saving…" : "Hand over"}
                </button>
              </div>
            </div>
          </div>
        )}

        <ul className="nav nav-pills small mb-3">
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button type="button" className={`nav-link py-1 ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                {t.label} <span className="ms-1 badge text-bg-light">{rows.filter(t.filter).length}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {loading ? (
              <div className="text-muted small">Loading…</div>
            ) : visible.length === 0 ? (
              <div className="text-muted small">Nothing here.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Physical file</th>
                      <th>Moving</th>
                      <th>Document</th>
                      <th>Status</th>
                      <th>With</th>
                      <th>Sent</th>
                      <th>Returned</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="fw-semibold">{r.file_reference}</div>
                          <div className="text-muted small">{r.file_name}</div>
                        </td>
                        <td>
                          <span className={`badge text-bg-${r.scope === "DOCUMENT" ? "info" : "light border text-dark"}`}>
                            {SCOPE_LABELS[r.scope] || "Whole file"}
                          </span>
                        </td>
                        <td>
                          {r.scope === "FILE" && !r.hop_id ? (
                            <span className="text-muted">All documents in the file</span>
                          ) : r.document_id ? (
                            <button type="button" className="btn btn-link btn-sm p-0 text-start"
                              onClick={() => navigate(`/ed-mgt/documents/${r.document_id}`)}>
                              {r.document_title || `Document #${r.document_id}`}
                            </button>
                          ) : <span className="text-muted">Not routed</span>}
                        </td>
                        <td><span className={`badge text-bg-${STATUS_TONES[r.status] || "secondary"}`}>{r.status}</span></td>
                        <td>
                          {r.to_user_name || r.to_role_code || r.to_location || "—"}
                          {r.status === "RECEIVED" && r.received_at && (
                            <div className="small text-muted">Received {formatDate(r.received_at)}</div>
                          )}
                        </td>
                        <td>
                          {formatDate(r.sent_at)}
                          <div className="small text-muted">by {r.sent_by_name || "—"}</div>
                        </td>
                        <td>
                          {r.returned_at ? formatDate(r.returned_at) : "—"}
                          {r.return_acknowledged_at && (
                            <div className="small text-muted">Acknowledged {formatDate(r.return_acknowledged_at)}</div>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          {r.status === "SENT" && (
                            <button className="btn btn-sm btn-warning" disabled={busyId === r.id}
                              onClick={() => act(r.id, receivePhysicalFile, "Receipt acknowledged.")}>
                              Acknowledge receipt
                            </button>
                          )}
                          {r.status === "RECEIVED" && (
                            <button className="btn btn-sm btn-outline-primary" disabled={busyId === r.id}
                              onClick={() => act(r.id, returnPhysicalFile, "Returned to records.")}>
                              Return to records
                            </button>
                          )}
                          {r.status === "RETURNED" && (
                            <button className="btn btn-sm btn-success" disabled={busyId === r.id}
                              onClick={() => act(r.id, (id) => acknowledgePhysicalReturn(id, window.prompt("Rack or shelf where the file is kept (optional):") || ""), "Return acknowledged.")}>
                              Acknowledge return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PhysicalFilesPage;
