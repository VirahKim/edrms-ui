import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import {
  submitFileRequest, listFileRequests, cancelFileRequest, listFiles, listFileRegister,
  downloadFileRegisterExcel, getRecordsStatistics,
} from "../../../api/recordsApi";
import { toast } from "../components/EDMSToast";
import ReasonSelect from "../components/ReasonSelect";

const TABS = [
  { key: "requests", label: "Requests" },
  { key: "files", label: "Files" },
  { key: "registers", label: "Registers" },
  { key: "statistics", label: "Statistics" },
];

const REQUEST_TYPES = [
  { value: "OPEN", label: "Open a new temporary file" },
  { value: "CLOSE", label: "Close a file" },
  { value: "DISPOSE", label: "Dispose of a closed file" },
];

const REQUEST_STATUS = {
  SUBMITTED: { label: "Awaiting approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "secondary" },
  FAILED: { label: "Could not be applied", tone: "danger" },
};

const REGISTERS = [
  { key: "OPENING", label: "File opening" },
  { key: "CLOSING", label: "File closing" },
  { key: "DISPOSAL", label: "File disposal" },
];

const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");
const list = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data || res?.data || []);
const errorOf = (err, fallback) => err?.response?.data?.message || fallback;

// A printable cover for a file. A closed file is shown with CLOSED in bold, as the procedure requires.
function printCover(file) {
  const closed = file.file_status === "CLOSED";
  const disposed = file.file_status === "DISPOSED";
  const status = disposed ? "<b>DISPOSED</b>" : closed ? "<b>CLOSED</b>" : "OPEN";
  const html = `<!doctype html><html><head><title>${file.reference_no}</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#000}
    h1{font-size:28px;margin:0 0 12px}.row{font-size:18px;margin:10px 0}</style></head><body>
    <h1>${file.reference_no}</h1>
    <div class="row"><b>Subject:</b> ${file.name}</div>
    <div class="row"><b>Opened:</b> ${new Date(file.created_at).toLocaleDateString()}</div>
    ${closed || disposed ? `<div class="row"><b>Closed:</b> ${file.closed_at ? new Date(file.closed_at).toLocaleDateString() : "—"}</div>` : ""}
    ${closed || disposed ? `<div class="row"><b>Last folio:</b> ${file.last_folio ?? "—"}</div>` : ""}
    <div class="row"><b>Status:</b> ${status}</div>
    <div class="row"><b>Location:</b> ${file.current_rack || "—"}</div>
    </body></html>`;
  const win = window.open("", "_blank", "width=800,height=600");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

const RequestForm = ({ files, onSubmitted }) => {
  const [form, setForm] = useState({ request_type: "OPEN", folder_id: "", series_prefix: "", proposed_subject: "", reason_code: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Close needs an open file; dispose needs a closed one.
  const eligible = files.filter((f) => (form.request_type === "CLOSE" ? f.file_status === "OPEN"
    : form.request_type === "DISPOSE" ? f.file_status === "CLOSED" : false));

  const canSubmit = Boolean(form.reason_code) && (form.request_type === "OPEN"
    ? form.series_prefix.trim() && form.proposed_subject.trim()
    : Boolean(form.folder_id));
  const reasonContext = { OPEN: "FILE_OPEN_TEMP", CLOSE: "FILE_CLOSE", DISPOSE: "FILE_DISPOSE" }[form.request_type];

  const submit = async () => {
    setSaving(true);
    try {
      await submitFileRequest({
        request_type: form.request_type,
        folder_id: form.request_type === "OPEN" ? null : Number(form.folder_id),
        series_prefix: form.request_type === "OPEN" ? form.series_prefix.trim() : null,
        proposed_subject: form.request_type === "OPEN" ? form.proposed_subject.trim() : null,
        reason_code: form.reason_code,
      });
      toast.success("Sent for approval.");
      setForm({ request_type: "OPEN", folder_id: "", series_prefix: "", proposed_subject: "", reason_code: "" });
      onSubmitted();
    } catch (err) {
      toast.error(errorOf(err, "The request could not be sent."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label small fw-semibold">What do you want to do?</label>
            <select className="form-select form-select-sm" value={form.request_type} onChange={set("request_type")}>
              {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {form.request_type === "OPEN" ? (
            <>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Reference series <span className="text-danger">*</span></label>
                <input className="form-control form-control-sm" placeholder="e.g. MOH/ADM/1/1" value={form.series_prefix} onChange={set("series_prefix")} maxLength={100} />
                <div className="form-text">The next number in this series is given on approval.</div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Subject of the file <span className="text-danger">*</span></label>
                <input className="form-control form-control-sm" value={form.proposed_subject} onChange={set("proposed_subject")} maxLength={255} />
              </div>
            </>
          ) : (
            <div className="col-md-8">
              <label className="form-label small fw-semibold">File <span className="text-danger">*</span></label>
              <select className="form-select form-select-sm" value={form.folder_id} onChange={set("folder_id")}>
                <option value="">Select a file…</option>
                {eligible.map((f) => <option key={f.id} value={f.id}>{f.reference_no} — {f.name}</option>)}
              </select>
            </div>
          )}
          <div className="col-12">
            <label className="form-label small fw-semibold">Reason <span className="text-danger">*</span></label>
            <ReasonSelect context={reasonContext} value={form.reason_code}
                          onChange={(code) => setForm((f) => ({ ...f, reason_code: code }))} />
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={!canSubmit || saving}>
            {saving ? "Sending…" : "Send for approval"}
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestsTab = ({ files, reloadKey, onChanged }) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, rows: [] });
  const key = `${reloadKey}:${attempt}`;

  useEffect(() => {
    let cancelled = false;
    listFileRequests()
      .then((res) => { if (!cancelled) setResult({ key, rows: list(res) }); })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorOf(err, "Could not load requests."));
        setResult({ key, rows: [] });
      });
    return () => { cancelled = true; };
  }, [key]);

  const loading = result.key !== key;
  const requests = loading ? [] : result.rows;
  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  const cancel = async (id) => {
    try {
      await cancelFileRequest(id);
      toast.success("Request cancelled.");
      reload();
      onChanged();
    } catch (err) {
      toast.error(errorOf(err, "The request could not be cancelled."));
    }
  };

  return (
    <>
      <RequestForm files={files} onSubmitted={() => { reload(); onChanged(); }} />
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? <div className="text-muted small">Loading…</div> : requests.length === 0 ? (
            <div className="text-muted small">No requests yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Request</th><th>File</th><th>Status</th><th>Submitted</th><th>Decision</th><th />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const st = REQUEST_STATUS[r.status] || { label: r.status, tone: "secondary" };
                    const typeLabel = REQUEST_TYPES.find((t) => t.value === r.request_type)?.label || r.request_type;
                    return (
                      <tr key={r.id}>
                        <td>
                          {typeLabel}
                          {r.source === "RETENTION" && <div><span className="badge bg-info-subtle text-info">From retention rule</span></div>}
                        </td>
                        <td>
                          {r.file_reference ? <><div className="fw-semibold">{r.file_reference}</div><div className="text-muted small">{r.file_subject}</div></>
                            : r.outcome_reference ? <><div className="fw-semibold">{r.outcome_reference}</div><div className="text-muted small">{r.proposed_subject}</div></>
                            : <span className="text-muted">{r.proposed_subject}</span>}
                          {r.reason && <div className="small text-muted">{r.reason}</div>}
                          {r.request_type === "DISPOSE" && r.destination_label && (
                            <div className="small text-muted"><i className="ti ti-arrow-right me-1"></i>Moves to {r.destination_label}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge text-bg-${st.tone}`}>{st.label}</span>
                          {r.request_type === "OPEN" && r.status === "APPROVED" && (
                            <div className="small mt-1" style={{ color: r.outcome_folder_id ? "#198754" : "#b45309" }}>
                              {r.outcome_folder_id ? "File created" : "Ready - create the file with New File"}
                            </div>
                          )}
                        </td>
                        <td>{fmt(r.submitted_at)}<div className="small text-muted">by {r.submitted_by_name || "—"}</div></td>
                        <td>{r.decided_at ? fmt(r.decided_at) : "—"}{r.decision_note && <div className="small text-danger">{r.decision_note}</div>}</td>
                        <td className="text-end">
                          {r.status === "SUBMITTED" && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(r.id)}>Cancel</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const FilesTab = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  // The result is kept with the filter it answers, so a stale list is never shown.
  const [result, setResult] = useState({ key: null, rows: [] });

  useEffect(() => {
    let cancelled = false;
    listFiles(status || undefined)
      .then((res) => { if (!cancelled) setResult({ key: status, rows: list(res) }); })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorOf(err, "Could not load files."));
        setResult({ key: status, rows: [] });
      });
    return () => { cancelled = true; };
  }, [status]);

  const loading = result.key !== status;
  const files = loading ? [] : result.rows;

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <select className="form-select form-select-sm w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All files</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
        {loading ? <div className="text-muted small">Loading…</div> : files.length === 0 ? (
          <div className="text-muted small">No files.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
              <thead className="table-light">
                <tr><th>Reference</th><th>Subject</th><th>State</th><th>Location</th><th>Documents</th><th>Last folio</th><th /></tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td className="fw-semibold">{f.reference_no}</td>
                    <td>{f.name}</td>
                    <td>
                      {f.file_status === "OPEN" ? <span className="badge text-bg-success">Open</span>
                        : <span className="fw-bold">{f.file_status === "DISPOSED" ? "DISPOSED" : "CLOSED"}</span>}
                    </td>
                    <td>{f.current_rack || "—"}</td>
                    <td>{f.document_count}</td>
                    <td>{f.last_folio ?? "—"}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => printCover(f)}>
                        <i className="ti ti-printer me-1" />Cover
                      </button>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/ed-mgt/records/files/${f.id}/mark-grid`)}>
                        Mark grid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const RegistersTab = () => {
  const [register, setRegister] = useState("OPENING");
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState({ key: null, rows: [] });
  const key = `${register}:${year}`;

  useEffect(() => {
    let cancelled = false;
    listFileRegister(register, year)
      .then((res) => { if (!cancelled) setResult({ key, rows: list(res) }); })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorOf(err, "Could not load the register."));
        setResult({ key, rows: [] });
      });
    return () => { cancelled = true; };
  }, [register, year, key]);

  const loading = result.key !== key;
  const rows = loading ? [] : result.rows;

  const exportExcel = () => downloadFileRegisterExcel(register, year)
    .catch((err) => toast.error(errorOf(err, "The Excel file could not be created.")));

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div className="d-flex gap-2">
            <select className="form-select form-select-sm" value={register} onChange={(e) => setRegister(e.target.value)}>
              {REGISTERS.map((r) => <option key={r.key} value={r.key}>{r.label} register</option>)}
            </select>
            <input type="number" className="form-control form-control-sm" style={{ width: 110 }} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <button className="btn btn-sm btn-outline-success" onClick={exportExcel}>
            <i className="ti ti-file-spreadsheet me-1" />Download Excel
          </button>
        </div>
        {loading ? <div className="text-muted small">Loading…</div> : rows.length === 0 ? (
          <div className="text-muted small">No entries for {year}.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
              <thead className="table-light">
                <tr>
                  <th>S/No</th><th>Reference</th><th>Subject</th><th>Date</th>
                  {register === "CLOSING" && <th>Last folio</th>}
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.serial_no}/{r.register_year}</td>
                    <td><Link to={`/ed-mgt/records/files/${r.folder_id}/mark-grid`}>{r.reference_no}</Link></td>
                    <td>{r.subject}</td>
                    <td>{fmt(r.date)}</td>
                    {register === "CLOSING" && <td>{r.last_folio ?? "—"}</td>}
                    <td>{r.by_name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatisticsTab = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getRecordsStatistics(year)
      .then((res) => { if (!cancelled) setStats(res?.data ?? res); })
      .catch((err) => { if (!cancelled) toast.error(errorOf(err, "Could not load statistics.")); });
    return () => { cancelled = true; };
  }, [year]);

  const tiles = stats ? [
    ["Inward mail", stats.inward_total], ["Internal", stats.inward_internal], ["External", stats.inward_external],
    ["Inward uploaded to EDMS", stats.inward_uploaded_to_edms], ["Outward mail", stats.outward_total],
    ["Outward uploaded to EDMS", stats.outward_uploaded_to_edms], ["Files opened", stats.files_opened],
    ["Files closed", stats.files_closed], ["Files disposed", stats.files_disposed],
    ["Open files now", stats.files_open_now], ["Closed files now", stats.files_closed_now],
    ["Awaiting approval", stats.requests_awaiting_approval], ["Bring-ups overdue", stats.bring_ups_overdue],
  ] : [];

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <input type="number" className="form-control form-control-sm" style={{ width: 110 }} value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      {!stats ? <div className="text-muted small">Loading…</div> : (
        <>
          <div className="row g-2 mb-3">
            {tiles.map(([label, value]) => (
              <div key={label} className="col-6 col-md-3 col-xl-2">
                <div className="card border-0 shadow-sm h-100"><div className="card-body py-2 px-3">
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>{label}</div>
                  <div className="fw-semibold" style={{ fontSize: "1.1rem" }}>{value}</div>
                </div></div>
              </div>
            ))}
          </div>
          <div className="row g-3">
            {[["Inward mail by month", stats.inward_by_month], ["Outward mail by month", stats.outward_by_month]].map(([title, rows]) => (
              <div key={title} className="col-md-6">
                <div className="card border-0 shadow-sm"><div className="card-header bg-transparent small fw-semibold">{title}</div>
                  <div className="card-body p-2">
                    {rows.length === 0 ? <div className="text-muted small">No entries.</div> : (
                      <table className="table table-sm mb-0" style={{ fontSize: "0.82rem" }}>
                        <tbody>{rows.sort((a, b) => a.month - b.month).map((m) => (
                          <tr key={m.month}><td>{new Date(2000, m.month - 1, 1).toLocaleString(undefined, { month: "long" })}</td><td className="text-end">{m.count}</td></tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/** Central Records: file requests, files and their covers, the registers, and statistics. */
const RecordsFilesPage = () => {
  const [tab, setTab] = useState("requests");
  const [files, setFiles] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listFiles().then((res) => setFiles(list(res))).catch(() => {});
  }, [reloadKey]);

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">Files and records</h5>
            <div className="text-muted small">Open, close and dispose of files. Each one is approved before it takes effect.</div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/ed-mgt/records/census" className="btn btn-sm btn-outline-primary">File census</Link>
            <Link to="/ed-mgt/records/bring-ups" className="btn btn-sm btn-outline-primary">Bring-up diary</Link>
          </div>
        </div>

        <ul className="nav nav-pills small mb-3">
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button type="button" className={`nav-link py-1 ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
            </li>
          ))}
        </ul>

        {tab === "requests" && <RequestsTab files={files} reloadKey={reloadKey} onChanged={() => setReloadKey((k) => k + 1)} />}
        {tab === "files" && <FilesTab />}
        {tab === "registers" && <RegistersTab />}
        {tab === "statistics" && <StatisticsTab />}
      </div>
    </DashboardLayout>
  );
};

export default RecordsFilesPage;
