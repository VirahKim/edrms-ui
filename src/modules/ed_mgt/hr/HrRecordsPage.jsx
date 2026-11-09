import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import UserSelect from "../../communication/components/UserSelect";
import { toast } from "../components/EDMSToast";
import {
  listPersonnelFiles, createPersonnelFile, getPersonnelFile, linkPersonnelDocument, requestPersonnelClosure,
  listDigitHolders, setDigitHolder, recordHrIncoming, listHrIncoming,
  createRequisition, listRequisitions, verifyRequisition, issueRequisition,
  reportMissing, listMissing, addMissingSearch, escalateMissing, resolveMissingFound, reconstructMissing,
  requestTemporaryFile, listTemporaryFiles,
  authorizeTransferOut, listTransfersOut, dispatchTransferOut, acknowledgeTransferOut,
  registerTransferIn, listTransfersIn, acknowledgeTransferIn,
} from "../../../api/hrApi";

const TABS = [
  { key: "personnel", label: "Personnel files" },
  { key: "incoming", label: "Incoming register" },
  { key: "requisitions", label: "Requisitions" },
  { key: "missing", label: "Missing files" },
  { key: "transfers", label: "Transfers" },
  { key: "digits", label: "Digit holders" },
];

const CHECKLIST_OUT = ["PSC2", "GP24", "CONF", "LPC", "CLEAR", "VOLS"];
const CHECKLIST_LABELS = {
  PSC2: "PSC 2 form", GP24: "GP 24", CONF: "Confirmation letter", LPC: "LPC",
  CLEAR: "Clearance form (checked by the digit holder)", VOLS: "All volumes intact",
};
const SEARCH_STEPS = [
  { value: "REGISTRY_RECORDS", label: "Registry records checked" },
  { value: "MOVEMENT_RECORDS", label: "Movement records checked" },
  { value: "PHYSICAL_SEARCH", label: "Physical search" },
  { value: "DOCUMENT_SEARCH", label: "Document search" },
  { value: "OTHER", label: "Other" },
];
const CLOSURE_REASONS = ["Retirement", "Resignation", "Termination", "Death", "Transfer", "Accumulation of documents"];

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const errorOf = (err, fallback) => err?.response?.data?.message || fallback;
const list = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data || []);
const today = () => new Date().toISOString().slice(0, 10);

// Loads a list. The result is kept with the request it answers, so loading is derived.
function useList(fetcher) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, rows: [] });
  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((res) => { if (!cancelled) setResult({ key: attempt, rows: list(res) }); })
      .catch((err) => {
        if (cancelled) return;
        toast.error(errorOf(err, "Could not load the list."));
        setResult({ key: attempt, rows: [] });
      });
    return () => { cancelled = true; };
    // The fetcher is recreated on each render; the attempt counter is what triggers a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
  return {
    rows: result.key === attempt ? result.rows : [],
    loading: result.key !== attempt,
    reload: () => setAttempt((a) => a + 1),
  };
}

// Runs an action, shows the result, and reloads.
async function run(action, success, reload) {
  try {
    await action();
    toast.success(success);
    reload?.();
  } catch (err) {
    toast.error(errorOf(err, "The action could not be completed."));
  }
}

// ── Personnel files ───────────────────────────────────────────────────────

const PersonnelFileDetail = ({ id, onBack }) => {
  const [data, setData] = useState(null);
  const [docId, setDocId] = useState("");
  const [closure, setClosure] = useState({ reason: "Retirement", separation_date: today(), closure_authority_ref: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPersonnelFile(id)
      .then((res) => { if (!cancelled) setData(res?.data ?? res); })
      .catch((err) => { if (!cancelled) toast.error(errorOf(err, "Could not open the personnel file.")); });
    return () => { cancelled = true; };
  }, [id, attempt]);

  if (!data) return <div className="text-muted small">Loading…</div>;
  const { file, documents = [], movements = [] } = data;
  const reload = () => setAttempt((a) => a + 1);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <button className="btn btn-sm btn-link p-0 mb-1" onClick={onBack}>← All personnel files</button>
            <div className="fw-semibold">{file.employee_name} — P/NO {file.personal_number}</div>
            <div className="small text-muted">
              {file.job_cadre || "—"} · last digit {file.last_digit} · digit holder: {file.digit_holder_name || "not assigned"}
            </div>
          </div>
          <span className="badge text-bg-secondary">{file.status}</span>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="fw-semibold small mb-2">Documents in the file</div>
            <div className="input-group input-group-sm mb-2">
              <input className="form-control" inputMode="numeric" placeholder="Document ID"
                value={docId} onChange={(e) => setDocId(e.target.value)} />
              <button className="btn btn-outline-primary" disabled={!docId}
                onClick={() => run(() => linkPersonnelDocument(id, Number(docId)), "Document filed.", () => { setDocId(""); reload(); })}>
                File it
              </button>
            </div>
            {documents.length === 0 ? <div className="text-muted small">No documents yet.</div> : (
              <table className="table table-sm mb-0" style={{ fontSize: "0.82rem" }}>
                <tbody>{documents.map((d) => (
                  <tr key={d.document_id}><td>{d.folio_number ?? "—"}</td><td>{d.title}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>

          <div className="col-md-6">
            <div className="fw-semibold small mb-2">Movements of the file</div>
            {movements.length === 0 ? <div className="text-muted small">No movements yet.</div> : (
              <table className="table table-sm mb-0" style={{ fontSize: "0.82rem" }}>
                <tbody>{movements.map((m) => (
                  <tr key={m.id}>
                    <td>{fmt(m.sent_at)}</td>
                    <td>{m.to_user_name || m.to_location || m.to_role_code || "—"}</td>
                    <td>{m.purpose || ""}</td>
                    <td><span className="badge text-bg-light border">{m.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>

        {file.status === "ACTIVE" && (
          <div className="border rounded p-3 mt-3">
            <div className="fw-semibold small mb-2">Close this personnel file (sent for approval)</div>
            <div className="row g-2">
              <div className="col-md-4">
                <select className="form-select form-select-sm" value={closure.reason}
                  onChange={(e) => setClosure((c) => ({ ...c, reason: e.target.value }))}>
                  {CLOSURE_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <input type="date" className="form-control form-control-sm" value={closure.separation_date}
                  onChange={(e) => setClosure((c) => ({ ...c, separation_date: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <input className="form-control form-control-sm" placeholder="Supporting document"
                  value={closure.closure_authority_ref} onChange={(e) => setClosure((c) => ({ ...c, closure_authority_ref: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-sm btn-outline-danger w-100" disabled={!closure.closure_authority_ref}
                  onClick={() => run(() => requestPersonnelClosure(id, {
                    reason: closure.reason, separation_date: closure.separation_date || null,
                    closure_authority_ref: closure.closure_authority_ref,
                  }), "Closure sent for approval.", reload)}>
                  Request closure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PersonnelPanel = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ personal_number: "", employee_name: "", job_cadre: "", is_confidential: false });
  const list = useList(() => listPersonnelFiles({ search: search || undefined }));

  if (selected) return <PersonnelFileDetail id={selected} onBack={() => setSelected(null)} />;

  const create = () => run(
    () => createPersonnelFile(form),
    "Personnel file opened.",
    () => { setForm({ personal_number: "", employee_name: "", job_cadre: "", is_confidential: false }); list.reload(); },
  );

  return (
    <>
      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="fw-semibold small mb-2">Open a personnel file</div>
        <div className="row g-2 align-items-end">
          <div className="col-md-2"><input className="form-control form-control-sm" placeholder="P/NO" value={form.personal_number}
            onChange={(e) => setForm((f) => ({ ...f, personal_number: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control form-control-sm" placeholder="Employee name" value={form.employee_name}
            onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control form-control-sm" placeholder="Job cadre" value={form.job_cadre}
            onChange={(e) => setForm((f) => ({ ...f, job_cadre: e.target.value }))} /></div>
          <div className="col-md-2"><div className="form-check small">
            <input className="form-check-input" type="checkbox" id="hr-conf" checked={form.is_confidential}
              onChange={(e) => setForm((f) => ({ ...f, is_confidential: e.target.checked }))} />
            <label className="form-check-label" htmlFor="hr-conf">Confidential</label></div></div>
          <div className="col-md-2"><button className="btn btn-primary btn-sm w-100" disabled={!form.personal_number || !form.employee_name} onClick={create}>Open file</button></div>
        </div>
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body">
        <div className="d-flex gap-2 mb-3">
          <input className="form-control form-control-sm" placeholder="Search P/NO or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-sm btn-outline-secondary" onClick={list.reload}>Search</button>
        </div>
        {list.loading ? <div className="text-muted small">Loading…</div> : list.rows.length === 0 ? (
          <div className="text-muted small">No personnel files.</div>
        ) : (
          <div className="table-responsive"><table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
            <thead className="table-light"><tr><th>P/NO</th><th>Name</th><th>Cadre</th><th>Digit</th><th>Digit holder</th><th>Status</th><th>With</th><th>Docs</th><th /></tr></thead>
            <tbody>{list.rows.map((f) => (
              <tr key={f.id}>
                <td className="fw-semibold">{f.personal_number}</td>
                <td>{f.employee_name}{f.is_confidential && <span className="badge text-bg-danger ms-1">Confidential</span>}</td>
                <td>{f.job_cadre || "—"}</td>
                <td>{f.last_digit}</td>
                <td>{f.digit_holder_name || "—"}</td>
                <td><span className="badge text-bg-light border">{f.status}</span></td>
                <td>{f.current_holder || "In records"}</td>
                <td>{f.document_count}</td>
                <td className="text-end"><button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(f.id)}>Open</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div></div>
    </>
  );
};

// ── Digit holders ─────────────────────────────────────────────────────────

const DigitHoldersPanel = () => {
  const [picked, setPicked] = useState({});
  const list = useList(() => listDigitHolders());
  return (
    <div className="card border-0 shadow-sm"><div className="card-body">
      <div className="small text-muted mb-3">
        Incoming personnel mail is distributed by the last digit of the P/NO. Assign one officer to each digit.
      </div>
      <div className="row g-2">
        {list.rows.map((h) => (
          <div key={h.digit} className="col-md-6">
            <div className="border rounded p-2 d-flex align-items-center gap-2">
              <span className="fw-bold fs-5" style={{ width: 32 }}>{h.digit}</span>
              <div className="flex-grow-1">
                <UserSelect value={picked[h.digit] ?? h.user_id ?? null} onChange={(uid) => setPicked((p) => ({ ...p, [h.digit]: uid }))} />
                <div className="small text-muted">Current: {h.user_name || "not assigned"}</div>
              </div>
              <button className="btn btn-sm btn-outline-primary" disabled={!picked[h.digit]}
                onClick={() => run(() => setDigitHolder(h.digit, picked[h.digit]), `Digit ${h.digit} assigned.`, list.reload)}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div></div>
  );
};

// ── Incoming register ─────────────────────────────────────────────────────

const IncomingPanel = () => {
  const [form, setForm] = useState({
    date_received: today(), personal_number: "", employee_name: "", subject: "",
    document_id: "", create_file_if_missing: false, is_confidential: false, remarks: "",
  });
  const [filter, setFilter] = useState({ search: "" });
  const list = useList(() => listHrIncoming({ search: filter.search || undefined }));

  const record = () => run(() => recordHrIncoming({
    date_received: form.date_received, personal_number: form.personal_number, employee_name: form.employee_name,
    subject: form.subject, document_id: form.document_id ? Number(form.document_id) : null,
    create_file_if_missing: form.create_file_if_missing, is_confidential: form.is_confidential,
    remarks: form.remarks || null,
  }), "Entered in the incoming register.", () => {
    setForm((f) => ({ ...f, personal_number: "", employee_name: "", subject: "", document_id: "", remarks: "" }));
    list.reload();
  });

  return (
    <>
      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="row g-2 align-items-end">
          <div className="col-md-2"><label className="form-label small fw-semibold">Date</label>
            <input type="date" className="form-control form-control-sm" value={form.date_received} onChange={(e) => setForm((f) => ({ ...f, date_received: e.target.value }))} /></div>
          <div className="col-md-2"><label className="form-label small fw-semibold">P/NO</label>
            <input className="form-control form-control-sm" value={form.personal_number} onChange={(e) => setForm((f) => ({ ...f, personal_number: e.target.value }))} /></div>
          <div className="col-md-3"><label className="form-label small fw-semibold">Name</label>
            <input className="form-control form-control-sm" value={form.employee_name} onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))} /></div>
          <div className="col-md-5"><label className="form-label small fw-semibold">Subject</label>
            <input className="form-control form-control-sm" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
          <div className="col-md-2"><label className="form-label small fw-semibold">Document ID</label>
            <input className="form-control form-control-sm" inputMode="numeric" value={form.document_id} onChange={(e) => setForm((f) => ({ ...f, document_id: e.target.value }))} /></div>
          <div className="col-md-4"><div className="form-check small mt-4">
            <input className="form-check-input" type="checkbox" id="hr-create" checked={form.create_file_if_missing}
              onChange={(e) => setForm((f) => ({ ...f, create_file_if_missing: e.target.checked }))} />
            <label className="form-check-label" htmlFor="hr-create">Open a personnel file if none exists</label></div></div>
          <div className="col-md-2"><button className="btn btn-primary btn-sm w-100 mt-3" disabled={!form.personal_number || !form.employee_name || !form.subject} onClick={record}>Record</button></div>
        </div>
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body">
        <div className="d-flex gap-2 mb-3">
          <input className="form-control form-control-sm" placeholder="Search" value={filter.search} onChange={(e) => setFilter({ search: e.target.value })} />
          <button className="btn btn-sm btn-outline-secondary" onClick={list.reload}>Search</button>        </div>
        {list.loading ? <div className="text-muted small">Loading…</div> : list.rows.length === 0 ? (
          <div className="text-muted small">Nothing in the incoming register.</div>
        ) : (
          <div className="table-responsive"><table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
            <thead className="table-light"><tr><th>S/No</th><th>Date</th><th>P/NO</th><th>Name</th><th>Subject</th><th>Digit</th><th>Digit holder</th><th>Recorded by</th></tr></thead>
            <tbody>{list.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.serial_no}/{r.register_year}</td><td>{fmt(r.date_received)}</td><td>{r.personal_number}</td>
                <td>{r.employee_name}</td><td>{r.subject}</td><td>{r.digit}</td><td>{r.digit_holder_name || "—"}</td><td>{r.recorded_by_name || "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div></div>
    </>
  );
};

// ── Requisitions ──────────────────────────────────────────────────────────

const RequisitionsPanel = () => {
  const [form, setForm] = useState({ personal_number: "", purpose: "", requisitioner_name: "", designation: "", room_number: "", head_signed: false });
  const list = useList(() => listRequisitions());

  const submit = () => run(() => createRequisition(form), "Requisition recorded.", () => {
    setForm({ personal_number: "", purpose: "", requisitioner_name: "", designation: "", room_number: "", head_signed: false });
    list.reload();
  });

  return (
    <>
      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="fw-semibold small mb-2">New requisition</div>
        <div className="row g-2 align-items-end">
          <div className="col-md-2"><input className="form-control form-control-sm" placeholder="P/NO" value={form.personal_number} onChange={(e) => setForm((f) => ({ ...f, personal_number: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control form-control-sm" placeholder="Purpose" value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} /></div>
          <div className="col-md-2"><input className="form-control form-control-sm" placeholder="Requisitioning officer" value={form.requisitioner_name} onChange={(e) => setForm((f) => ({ ...f, requisitioner_name: e.target.value }))} /></div>
          <div className="col-md-2"><input className="form-control form-control-sm" placeholder="Designation" value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} /></div>
          <div className="col-md-1"><input className="form-control form-control-sm" placeholder="Room" value={form.room_number} onChange={(e) => setForm((f) => ({ ...f, room_number: e.target.value }))} /></div>
          <div className="col-md-2"><button className="btn btn-primary btn-sm w-100" disabled={!form.head_signed || !form.personal_number || !form.purpose || !form.requisitioner_name || !form.room_number} onClick={submit}>Record</button></div>
          <div className="col-12"><div className="form-check small">
            <input className="form-check-input" type="checkbox" id="hr-signed" checked={form.head_signed} onChange={(e) => setForm((f) => ({ ...f, head_signed: e.target.checked }))} />
            <label className="form-check-label" htmlFor="hr-signed">Signed by the head of section or alternate</label></div></div>
        </div>
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body">
        {list.loading ? <div className="text-muted small">Loading…</div> : list.rows.length === 0 ? (
          <div className="text-muted small">No requisitions.</div>
        ) : (
          <div className="table-responsive"><table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
            <thead className="table-light"><tr><th>S/No</th><th>Date</th><th>P/NO</th><th>Name</th><th>Purpose</th><th>Room</th><th>Status</th><th>Where the file is</th><th /></tr></thead>
            <tbody>{list.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.serial_no}/{r.register_year}</td><td>{fmt(r.requested_on)}</td><td>{r.personal_number}</td><td>{r.employee_name}</td>
                <td>{r.purpose}<div className="small text-muted">{r.requisitioner_name}</div></td><td>{r.room_number}</td>
                <td><span className="badge text-bg-light border">{r.status}</span>{r.rejected_reason && <div className="small text-danger">{r.rejected_reason}</div>}</td>
                <td>{r.movement_status || "—"}</td>
                <td className="text-end text-nowrap">
                  {r.status === "REQUESTED" && <>
                    <button className="btn btn-sm btn-outline-success me-1" onClick={() => run(() => verifyRequisition(r.id, { approve: true }), "Verified.", list.reload)}>Verify</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => {
                      const reason = window.prompt("Reason for rejecting this requisition:");
                      if (reason) run(() => verifyRequisition(r.id, { approve: false, rejected_reason: reason }), "Rejected.", list.reload);
                    }}>Reject</button>
                  </>}
                  {r.status === "VERIFIED" && <button className="btn btn-sm btn-primary" onClick={() => run(() => issueRequisition(r.id), "File issued to the room.", list.reload)}>Issue file</button>}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        <div className="small text-muted mt-2">
          Once a file is issued, acknowledge its receipt and its return in the File Movement Register.
        </div>
      </div></div>
    </>
  );
};

// ── Missing files, search log and TY ──────────────────────────────────────

const MissingPanel = () => {
  const [report, setReport] = useState({ personal_file_id: "", last_known_holder: "" });
  const [openOnly, setOpenOnly] = useState(true);
  const [search, setSearch] = useState({ step: "REGISTRY_RECORDS", findings: "" });
  const [active, setActive] = useState(null);
  const [ty, setTy] = useState({ reason: "", ippd_confirmed: false, ippd_details: "" });
  const [report2, setReport2] = useState("");
  const list = useList(() => listMissing(openOnly));
  const tys = useList(() => listTemporaryFiles());

  const reportFile = () => run(() => reportMissing({
    personal_file_id: Number(report.personal_file_id), last_known_holder: report.last_known_holder || null,
  }), "Reported as missing.", () => { setReport({ personal_file_id: "", last_known_holder: "" }); list.reload(); });

  return (
    <>
      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="fw-semibold small mb-2">Report a personnel file as missing</div>
        <div className="row g-2 align-items-end">
          <div className="col-md-3"><input className="form-control form-control-sm" placeholder="Personnel file ID" inputMode="numeric"
            value={report.personal_file_id} onChange={(e) => setReport((r) => ({ ...r, personal_file_id: e.target.value }))} /></div>
          <div className="col-md-5"><input className="form-control form-control-sm" placeholder="Last known holder (optional)"
            value={report.last_known_holder} onChange={(e) => setReport((r) => ({ ...r, last_known_holder: e.target.value }))} /></div>
          <div className="col-md-4"><button className="btn btn-danger btn-sm w-100" disabled={!report.personal_file_id} onClick={reportFile}>Report missing</button></div>
        </div>
      </div></div>

      <div className="form-check form-switch small mb-2">
        <input className="form-check-input" type="checkbox" id="hr-open" checked={openOnly} onChange={(e) => { setOpenOnly(e.target.checked); list.reload(); }} />
        <label className="form-check-label" htmlFor="hr-open">Show only incidents still open</label>
      </div>

      {list.loading ? <div className="text-muted small">Loading…</div> : list.rows.length === 0 ? (
        <div className="text-muted small">No missing files.</div>
      ) : list.rows.map((m) => (
        <div key={m.id} className="card border-0 shadow-sm mb-3"><div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="fw-semibold">{m.employee_name} — P/NO {m.personal_number}</div>
              <div className="small text-muted">Reported {fmt(m.reported_at)} by {m.reported_by_name || "—"} · last known holder: {m.last_known_holder || "unknown"}</div>
            </div>
            <span className="badge text-bg-warning">{m.status}</span>
          </div>

          {m.searches.length > 0 && (
            <ul className="small mt-2 mb-2">
              {m.searches.map((s, i) => (
                <li key={i}><b>{SEARCH_STEPS.find((x) => x.value === s.step)?.label || s.step}</b> — {s.findings} <span className="text-muted">({fmt(s.searched_at)})</span></li>
              ))}
            </ul>
          )}

          {!["RECONSTRUCTED", "RESOLVED_FOUND", "CLOSED"].includes(m.status) && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              <button className="btn btn-sm btn-outline-primary" onClick={() => setActive(active === m.id ? null : m.id)}>Record a search</button>
              {m.status === "OPEN" && <button className="btn btn-sm btn-outline-warning" onClick={() => run(() => escalateMissing(m.id), "Reported to the Director Records.", list.reload)}>Report to the Director Records</button>}
              {["OPEN", "ESCALATED"].includes(m.status) && <button className="btn btn-sm btn-outline-success" onClick={() => run(() => resolveMissingFound(m.id), "File found.", list.reload)}>File found</button>}
              {m.status === "ESCALATED" && !m.temporary_file_id && <button className="btn btn-sm btn-outline-secondary" onClick={() => setActive(active === -m.id ? null : -m.id)}>Request a temporary file (TY)</button>}
              {m.status === "TY_OPEN" && <button className="btn btn-sm btn-success" onClick={() => setActive(active === -m.id ? null : -m.id)}>Reconstruct the file and close the incident</button>}
            </div>
          )}

          {active === m.id && (
            <div className="border rounded p-2 mt-2">
              <div className="row g-2">
                <div className="col-md-3"><select className="form-select form-select-sm" value={search.step} onChange={(e) => setSearch((s) => ({ ...s, step: e.target.value }))}>
                  {SEARCH_STEPS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div className="col-md-7"><input className="form-control form-control-sm" placeholder="What was found or not found" value={search.findings}
                  onChange={(e) => setSearch((s) => ({ ...s, findings: e.target.value }))} /></div>
                <div className="col-md-2"><button className="btn btn-sm btn-primary w-100" disabled={!search.findings}
                  onClick={() => run(() => addMissingSearch(m.id, search), "Search recorded.", () => { setSearch({ step: "REGISTRY_RECORDS", findings: "" }); list.reload(); })}>Save</button></div>
              </div>
            </div>
          )}

          {active === -m.id && m.status === "ESCALATED" && (
            <div className="border rounded p-2 mt-2">
              <div className="fw-semibold small mb-2">Request a temporary file (TY) — approved by the Director Records</div>
              <textarea className="form-control form-control-sm mb-2" rows={2} placeholder="Reason" value={ty.reason} onChange={(e) => setTy((t) => ({ ...t, reason: e.target.value }))} />
              <div className="form-check small mb-2">
                <input className="form-check-input" type="checkbox" id={`ippd-${m.id}`} checked={ty.ippd_confirmed} onChange={(e) => setTy((t) => ({ ...t, ippd_confirmed: e.target.checked }))} />
                <label className="form-check-label" htmlFor={`ippd-${m.id}`}>Officer details confirmed with IPPD</label>
              </div>
              {ty.ippd_confirmed && <input className="form-control form-control-sm mb-2" placeholder="IPPD details" value={ty.ippd_details} onChange={(e) => setTy((t) => ({ ...t, ippd_details: e.target.value }))} />}
              <button className="btn btn-sm btn-primary" disabled={!ty.reason} onClick={() => run(() => requestTemporaryFile({
                missing_file_id: m.id, reason: ty.reason, ippd_confirmed: ty.ippd_confirmed, ippd_details: ty.ippd_details || null,
              }), "Sent to the Director Records for approval.", () => { setActive(null); list.reload(); tys.reload(); })}>Send for approval</button>
            </div>
          )}

          {active === -m.id && m.status === "TY_OPEN" && (
            <div className="border rounded p-2 mt-2">
              <div className="fw-semibold small mb-2">Reconstruction report</div>
              <textarea className="form-control form-control-sm mb-2" rows={3} placeholder="Circumstances, searches, outcome, corrective action. Only verified documents are used."
                value={report2} onChange={(e) => setReport2(e.target.value)} />
              <button className="btn btn-sm btn-success" disabled={!report2.trim()} onClick={() => run(() => reconstructMissing(m.id, { closure_report: report2 }),
                "File reconstructed and the incident closed.", () => { setActive(null); setReport2(""); list.reload(); tys.reload(); })}>Close the incident</button>
            </div>
          )}
        </div></div>
      ))}

      <div className="card border-0 shadow-sm mt-3"><div className="card-body">
        <div className="fw-semibold small mb-2">Temporary files (TY)</div>
        {tys.rows.length === 0 ? <div className="text-muted small">None.</div> : (
          <table className="table table-sm mb-0" style={{ fontSize: "0.82rem" }}><tbody>{tys.rows.map((t) => (
            <tr key={t.id}><td>{t.personal_number}</td><td>{t.employee_name}</td><td>{t.reason}</td><td>{t.ippd_confirmed ? "IPPD confirmed" : ""}</td>
              <td><span className="badge text-bg-light border">{t.status === "APPROVED" ? "APPROVED - open the file from New File" : t.status}</span></td><td>{fmt(t.requested_at)}</td></tr>
          ))}</tbody></table>
        )}
      </div></div>
    </>
  );
};

// ── Transfers ─────────────────────────────────────────────────────────────

const ChecklistInputs = ({ value, onChange, codes }) => (
  <div className="row g-1">
    {codes.map((code) => (
      <div className="col-md-6" key={code}>
        <div className="form-check small">
          <input className="form-check-input" type="checkbox" id={`cl-${code}`}
            checked={Boolean(value[code])} onChange={(e) => onChange({ ...value, [code]: e.target.checked })} />
          <label className="form-check-label" htmlFor={`cl-${code}`}>{CHECKLIST_LABELS[code]}</label>
        </div>
      </div>
    ))}
  </div>
);

const TransfersPanel = () => {
  const [outForm, setOutForm] = useState({ personal_file_id: "", receiving_body: "", transfer_authority_ref: "" });
  const [outChecks, setOutChecks] = useState({});
  const [inForm, setInForm] = useState({ received_on: today(), personal_number: "", employee_name: "", source_body: "", transfer_letter_ref: "", forwarding_letter_ref: "", condition_notes: "" });
  const [inChecks, setInChecks] = useState({});
  const outs = useList(() => listTransfersOut());
  const ins = useList(() => listTransfersIn());

  const authorize = () => run(() => authorizeTransferOut({
    personal_file_id: Number(outForm.personal_file_id), receiving_body: outForm.receiving_body,
    transfer_authority_ref: outForm.transfer_authority_ref,
    checklist: CHECKLIST_OUT.map((code) => ({ item_code: code, present: Boolean(outChecks[code]) })),
  }), "Transfer authorised.", () => { setOutForm({ personal_file_id: "", receiving_body: "", transfer_authority_ref: "" }); setOutChecks({}); outs.reload(); });

  const registerIn = () => run(() => registerTransferIn({
    ...inForm, received_on: inForm.received_on,
    checklist: CHECKLIST_OUT.map((code) => ({ item_code: code, present: Boolean(inChecks[code]) })),
  }), "Received files registered.", () => { setInChecks({}); ins.reload(); });

  return (
    <>
      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="fw-semibold small mb-2">Transfer out (to another ministry or institution)</div>
        <div className="row g-2 mb-2">
          <div className="col-md-2"><input className="form-control form-control-sm" placeholder="Personnel file ID" inputMode="numeric" value={outForm.personal_file_id} onChange={(e) => setOutForm((f) => ({ ...f, personal_file_id: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control form-control-sm" placeholder="Receiving ministry or institution" value={outForm.receiving_body} onChange={(e) => setOutForm((f) => ({ ...f, receiving_body: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control form-control-sm" placeholder="Transfer letter reference" value={outForm.transfer_authority_ref} onChange={(e) => setOutForm((f) => ({ ...f, transfer_authority_ref: e.target.value }))} /></div>
          <div className="col-md-2"><button className="btn btn-primary btn-sm w-100" disabled={!outForm.personal_file_id || !outForm.receiving_body || !outForm.transfer_authority_ref} onClick={authorize}>Authorise</button></div>
        </div>
        <ChecklistInputs value={outChecks} onChange={setOutChecks} codes={CHECKLIST_OUT} />
      </div></div>

      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        {outs.rows.length === 0 ? <div className="text-muted small">No transfers out.</div> : (
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
            <thead className="table-light"><tr><th>P/NO</th><th>Name</th><th>To</th><th>Status</th><th>Dispatch (GP 54)</th><th>Received by</th><th /></tr></thead>
            <tbody>{outs.rows.map((t) => (
              <tr key={t.id}><td>{t.personal_number}</td><td>{t.employee_name}</td><td>{t.receiving_body}<div className="small text-muted">{t.transfer_authority_ref}</div></td>
                <td><span className="badge text-bg-light border">{t.status}</span></td><td>{t.dispatch_ref || "—"}</td><td>{t.acknowledged_by_name || "—"}</td>
                <td className="text-end text-nowrap">
                  {t.status === "AUTHORIZED" && <button className="btn btn-sm btn-outline-primary" onClick={() => {
                    const ref = window.prompt("GP 54 dispatch reference:"); if (ref) run(() => dispatchTransferOut(t.id, { dispatch_ref: ref }), "Files dispatched.", outs.reload);
                  }}>Dispatch</button>}
                  {t.status === "DISPATCHED" && <button className="btn btn-sm btn-outline-success" onClick={() => {
                    const name = window.prompt("Name of the officer who signed at the receiving body:"); if (name) run(() => acknowledgeTransferOut(t.id, { received_by_name: name }), "Receipt recorded.", outs.reload);
                  }}>Record receipt</button>}
                </td></tr>
            ))}</tbody>
          </table>
        )}
      </div></div>

      <div className="card border-0 shadow-sm mb-3"><div className="card-body">
        <div className="fw-semibold small mb-2">Transfer in (received from a county, ministry or institution)</div>
        <div className="row g-2 mb-2">
          <div className="col-md-2"><input type="date" className="form-control form-control-sm" value={inForm.received_on} onChange={(e) => setInForm((f) => ({ ...f, received_on: e.target.value }))} /></div>
          <div className="col-md-2"><input className="form-control form-control-sm" placeholder="P/NO" value={inForm.personal_number} onChange={(e) => setInForm((f) => ({ ...f, personal_number: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control form-control-sm" placeholder="Name" value={inForm.employee_name} onChange={(e) => setInForm((f) => ({ ...f, employee_name: e.target.value }))} /></div>
          <div className="col-md-3"><input className="form-control form-control-sm" placeholder="Source county, ministry or institution" value={inForm.source_body} onChange={(e) => setInForm((f) => ({ ...f, source_body: e.target.value }))} /></div>
          <div className="col-md-2"><button className="btn btn-primary btn-sm w-100" disabled={!inForm.personal_number || !inForm.employee_name || !inForm.source_body} onClick={registerIn}>Register</button></div>
          <div className="col-md-4"><input className="form-control form-control-sm" placeholder="Transfer letter reference" value={inForm.transfer_letter_ref} onChange={(e) => setInForm((f) => ({ ...f, transfer_letter_ref: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control form-control-sm" placeholder="Forwarding letter reference" value={inForm.forwarding_letter_ref} onChange={(e) => setInForm((f) => ({ ...f, forwarding_letter_ref: e.target.value }))} /></div>
          <div className="col-md-4"><input className="form-control form-control-sm" placeholder="Condition of the file" value={inForm.condition_notes} onChange={(e) => setInForm((f) => ({ ...f, condition_notes: e.target.value }))} /></div>
        </div>
        <ChecklistInputs value={inChecks} onChange={setInChecks} codes={CHECKLIST_OUT} />
      </div></div>

      <div className="card border-0 shadow-sm"><div className="card-body">
        {ins.rows.length === 0 ? <div className="text-muted small">No transfers in.</div> : (
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.84rem" }}>
            <thead className="table-light"><tr><th>S/No</th><th>Date</th><th>P/NO</th><th>Name</th><th>From</th><th>Digit</th><th>Recorded by</th><th>Acknowledged</th><th /></tr></thead>
            <tbody>{ins.rows.map((t) => (
              <tr key={t.id}><td>{t.serial_no}/{t.register_year}</td><td>{fmt(t.received_on)}</td><td>{t.personal_number}</td><td>{t.employee_name}</td>
                <td>{t.source_body}</td><td>{t.digit}</td><td>{t.recorded_by_name || "—"}</td><td>{t.acknowledged ? "Yes" : "No"}</td>
                <td className="text-end">{!t.acknowledged && <button className="btn btn-sm btn-outline-success" onClick={() => run(() => acknowledgeTransferIn(t.id), "Acknowledged.", ins.reload)}>Acknowledge</button>}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div></div>
    </>
  );
};

/** Human Resource Record Management Unit. Works alongside the Central Registry. */
const HrRecordsPage = () => {
  const [tab, setTab] = useState("personnel");
  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="mb-3">
          <h5 className="fw-semibold mb-1">Human Resource Records</h5>
          <div className="text-muted small">
            Personnel files, incoming mail distributed by digit, requisitions, missing files, transfers and closure.
            HR mail is received through the Central Registry first.
          </div>
        </div>
        <ul className="nav nav-pills small mb-3">
          {TABS.map((t) => (
            <li className="nav-item" key={t.key}>
              <button type="button" className={`nav-link py-1 ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
            </li>
          ))}
        </ul>
        {tab === "personnel" && <PersonnelPanel />}
        {tab === "incoming" && <IncomingPanel />}
        {tab === "requisitions" && <RequisitionsPanel />}
        {tab === "missing" && <MissingPanel />}
        {tab === "transfers" && <TransfersPanel />}
        {tab === "digits" && <DigitHoldersPanel />}
      </div>
    </DashboardLayout>
  );
};

export default HrRecordsPage;
