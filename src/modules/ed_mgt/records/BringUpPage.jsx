import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { createBringUp, listBringUps, clearBringUp, listFiles } from "../../../api/recordsApi";
import ReasonSelect from "../components/ReasonSelect";
import { toast } from "../components/EDMSToast";

const errorOf = (err, fallback) => err?.response?.data?.message || fallback;
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Bring-up diary (BU): items to bring back up on a date. A registry officer records a
 * document or file here while it is being peruced, and clears the entry once it is
 * brought up.
 */
const BringUpPage = () => {
  const [openOnly, setOpenOnly] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, rows: [] });
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ target: "file", folder_id: "", document_id: "", bring_up_date: today(), reason_code: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const key = `${openOnly}:${attempt}`;
  useEffect(() => {
    let cancelled = false;
    listBringUps(openOnly)
      .then((res) => { if (!cancelled) setResult({ key, rows: Array.isArray(res?.data) ? res.data : res?.data?.data || [] }); })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorOf(err, "Could not load the diary."));
        setResult({ key, rows: [] });
      });
    return () => { cancelled = true; };
  }, [key, openOnly]);

  const loading = result.key !== key;
  const items = loading ? [] : result.rows;
  const load = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    listFiles("OPEN").then((res) => setFiles(Array.isArray(res?.data) ? res.data : res?.data?.data || [])).catch(() => {});
  }, []);

  const add = async () => {
    try {
      await createBringUp({
        folder_id: form.target === "file" ? Number(form.folder_id) : null,
        document_id: form.target === "document" ? Number(form.document_id) : null,
        bring_up_date: form.bring_up_date,
        reason_code: form.reason_code,
      });
      toast.success("Entered in the bring-up diary.");
      setForm({ target: "file", folder_id: "", document_id: "", bring_up_date: today(), reason_code: "" });
      load();
    } catch (err) {
      toast.error(errorOf(err, "The entry could not be saved."));
    }
  };

  const clear = async (id) => {
    try {
      await clearBringUp(id);
      load();
    } catch (err) {
      toast.error(errorOf(err, "The entry could not be cleared."));
    }
  };

  const canAdd = form.reason_code && (form.target === "file" ? form.folder_id : form.document_id);

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="mb-3">
          <h5 className="fw-semibold mb-1">Bring-up diary (BU)</h5>
          <div className="text-muted small">Record each item to bring back up on a date. Overdue items are highlighted.</div>
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-2">
                <label className="form-label small fw-semibold">For</label>
                <select className="form-select form-select-sm" value={form.target} onChange={set("target")}>
                  <option value="file">A file</option>
                  <option value="document">A document</option>
                </select>
              </div>
              <div className="col-md-3">
                {form.target === "file" ? (
                  <>
                    <label className="form-label small fw-semibold">File</label>
                    <select className="form-select form-select-sm" value={form.folder_id} onChange={set("folder_id")}>
                      <option value="">Select…</option>
                      {files.map((f) => <option key={f.id} value={f.id}>{f.reference_no} — {f.name}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="form-label small fw-semibold">Document ID</label>
                    <input className="form-control form-control-sm" inputMode="numeric" value={form.document_id} onChange={set("document_id")} />
                  </>
                )}
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Bring up on</label>
                <input type="date" className="form-control form-control-sm" value={form.bring_up_date} onChange={set("bring_up_date")} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Reason</label>
                <ReasonSelect context="BRING_UP" value={form.reason_code}
                              onChange={(code) => setForm((f) => ({ ...f, reason_code: code }))} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary btn-sm w-100" onClick={add} disabled={!canAdd}>Add</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-end mb-2">
              <div className="form-check form-switch small">
                <input className="form-check-input" type="checkbox" id="bu-open" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
                <label className="form-check-label" htmlFor="bu-open">Show only items not yet cleared</label>
              </div>
            </div>
            {loading ? <div className="text-muted small">Loading…</div> : items.length === 0 ? (
              <div className="text-muted small">Nothing in the diary.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
                  <thead className="table-light">
                    <tr><th>Bring up on</th><th>For</th><th>Reason</th><th>Entered by</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className={i.is_overdue ? "table-danger" : ""}>
                        <td className={i.is_overdue ? "fw-semibold text-danger" : ""}>
                          {new Date(i.bring_up_date).toLocaleDateString()}{i.is_overdue ? " (overdue)" : ""}
                        </td>
                        <td>
                          {i.folder_reference ? <>{i.folder_reference}</> : null}
                          {i.document_title ? <div className="small text-muted">{i.document_title}</div> : null}
                          {!i.folder_reference && !i.document_title && "—"}
                        </td>
                        <td>{i.reason}</td>
                        <td>{i.created_by_name || "—"}</td>
                        <td>{i.cleared_at ? <span className="badge text-bg-success">Brought up</span> : <span className="badge text-bg-warning">Waiting</span>}</td>
                        <td className="text-end">
                          {!i.cleared_at && <button className="btn btn-sm btn-outline-success" onClick={() => clear(i.id)}>Mark brought up</button>}
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

export default BringUpPage;
