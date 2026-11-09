import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "../components/EDMSToast";
import { createBringUp } from "../../../api/recordsApi";
import ReasonSelect from "../components/ReasonSelect";

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const QUICK = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
];

/**
 * Record in the bring-up diary that a file (or a letter) will be needed again on a date. Works for any file,
 * not only ones that have been through routing.
 *   folderId / documentId   what to bring up
 *   label                   its name, shown in the heading
 */
const BringUpModal = ({ folderId, documentId, label, onClose, onDone }) => {
  const [date, setDate] = useState(inDays(14));
  const [reasonCode, setReasonCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reasonCode) { toast.error("Choose why it will be needed."); return; }
    setBusy(true);
    try {
      await createBringUp({
        folder_id: folderId || null,
        document_id: folderId ? null : documentId || null,
        bring_up_date: date,
        reason_code: reasonCode,
      });
      toast.success("Entered in the bring-up diary.");
      onDone?.();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not enter it in the diary.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="ti ti-calendar-event me-2"></i>Bring up later</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={busy} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-3">
              Note that <strong>{label || "this file"}</strong> will be needed again. It appears in the{" "}
              <Link to="/ed-mgt/records/bring-ups">bring-up diary</Link>, and is marked overdue when the date passes.
            </p>
            <label className="form-label fw-semibold small">Needed again on</label>
            <input type="date" className="form-control mb-2" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="d-flex flex-wrap gap-1 mb-3">
              {QUICK.map((q) => (
                <button key={q.days} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDate(inDays(q.days))}>{q.label}</button>
              ))}
            </div>
            <label className="form-label fw-semibold small">Why</label>
            <ReasonSelect context="BRING_UP" className="form-select" value={reasonCode} onChange={setReasonCode} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy || !reasonCode || !date}>
              {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-calendar-plus me-1"></i>}
              Add to the diary
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default BringUpModal;
