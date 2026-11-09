import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import { listAccessRequests, decideAccessRequest } from "../../../api/accessRequestsApi";

const STATUS_BADGE = { PENDING: "text-bg-warning", GRANTED: "text-bg-success", DECLINED: "text-bg-danger", CANCELLED: "text-bg-secondary" };
const FILTERS = [
  { key: "PENDING", label: "Waiting" },
  { key: "GRANTED", label: "Granted" },
  { key: "DECLINED", label: "Declined" },
  { key: "", label: "All" },
];
const DURATIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "No end date" },
];

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

/**
 * Registry Officer: who has asked for which file or letter, and the answer. Granting opens the
 * letter (or every letter in the file) to that person - read-only - until the chosen date.
 */
const AccessRequestsPage = () => {
  const [filter, setFilter] = useState("PENDING");
  const [rows, setRows] = useState(null);
  const [days, setDays] = useState({});   // request id -> chosen duration
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() =>
    listAccessRequests({ mine: false, status: filter || undefined })
      .then((r) => setRows(Array.isArray(r?.data) ? r.data : []))
      .catch((e) => { toast.error(e?.response?.data?.message || "Could not load the requests."); setRows([]); }), [filter]);

  useEffect(() => { load(); }, [load]);

  const decide = async (row, grant) => {
    setBusyId(row.id);
    try {
      const chosen = days[row.id] ?? 30;
      await decideAccessRequest(row.id, { grant, note: (notes[row.id] || "").trim() || null, valid_days: grant && chosen > 0 ? chosen : null });
      toast.success(grant ? "Access granted." : "Request declined.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That did not work.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="mb-3">
          <h5 className="fw-semibold mb-1">Access Requests</h5>
          <div className="text-muted small">Officers ask the Central Registry for files and letters they cannot open. Grant or decline each one.</div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                    className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-outline-secondary"}`}>{f.label}</button>
          ))}
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {rows === null ? <div className="text-muted small">Loading…</div>
              : rows.length === 0 ? <div className="text-muted small">Nothing here.</div>
              : rows.map((r) => (
                <div key={r.id} className="border-bottom py-3">
                  <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div className="min-w-0">
                      <div className="fw-semibold">
                        <i className={`ti ${r.document_id ? "ti-file" : "ti-folder"} text-warning me-1`}></i>{r.target_title}
                        <span className={`badge ms-2 ${STATUS_BADGE[r.status]}`}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</span>
                      </div>
                      <div className="text-muted small">
                        {r.document_id ? "Letter" : "Whole file"}{r.target_reference ? ` · ${r.target_reference}` : ""} ·
                        asked by <strong className="text-dark">{r.requested_by_name || `user #${r.requested_by}`}</strong> · {fmt(r.created_at)}
                      </div>
                      {r.reason && <div className="small mt-1">"{r.reason}"</div>}
                      {r.status !== "PENDING" && (
                        <div className="text-muted small mt-1">
                          {r.decided_at ? `Answered ${fmt(r.decided_at)}` : ""}
                          {r.access_expires_at ? ` · access until ${new Date(r.access_expires_at).toLocaleDateString()}` : ""}
                          {r.decision_note ? ` · ${r.decision_note}` : ""}
                        </div>
                      )}
                    </div>

                    {r.status === "PENDING" && (
                      <div style={{ minWidth: 320 }}>
                        <input className="form-control form-control-sm mb-1" placeholder="Note to them (optional)" maxLength={1000}
                               value={notes[r.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                        <div className="d-flex gap-1">
                          <select className="form-select form-select-sm" style={{ maxWidth: 130 }} value={days[r.id] ?? 30}
                                  onChange={(e) => setDays((d) => ({ ...d, [r.id]: Number(e.target.value) }))}>
                            {DURATIONS.map((d) => <option key={d.days} value={d.days}>{d.label}</option>)}
                          </select>
                          <button type="button" className="btn btn-sm btn-success" disabled={busyId === r.id} onClick={() => decide(r, true)}>
                            <i className="ti ti-check me-1"></i>Grant
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" disabled={busyId === r.id} onClick={() => decide(r, false)}>
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccessRequestsPage;
