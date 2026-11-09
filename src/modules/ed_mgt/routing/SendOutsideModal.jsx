import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Select from "react-select";
import { toast } from "../components/EDMSToast";
import { listParties, sendOutside } from "../../../api/registersApi";
import { sendFileOutside } from "../../../api/fileRoutingApi";
import RoutingConfirmModal from "./RoutingConfirmModal";
import { getFileDocuments } from "../../../api/edmsApi";

const MODES = [
  { value: "HAND", label: "Hand delivery" },
  { value: "COURIER", label: "Courier" },
  { value: "POST", label: "Post" },
  { value: "EMAIL", label: "E-mail" },
  { value: "OTHER", label: "Other" },
];

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Send letters outside the organisation. Each one is entered in the Outward Mail Register (a report -
 * nobody types into it), to someone who is already a sender in the Inward Mail Register.
 *   letters     [{ id, title, folio }] to choose from; or
 *   fileId      load every letter of this file instead
 *   routingId   when sent from a file routing: the routing for those letters is closed too
 *   preselected letter ids ticked to start (default: all)
 */
const SendOutsideModal = ({ letters: given, fileId, routingId, preselected, onClose, onDone }) => {
  const [letters, setLetters] = useState(given || []);
  const [ticked, setTicked] = useState({});
  const [parties, setParties] = useState([]);
  const [partyId, setPartyId] = useState(null);
  const [mode, setMode] = useState("HAND");
  const [date, setDate] = useState(today());
  const [ourRef, setOurRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listParties("SOURCE")
      .then((r) => setParties(Array.isArray(r?.data) ? r.data : []))
      .catch(() => toast.error("Could not load the senders."));
  }, []);

  useEffect(() => {
    if (!fileId) return undefined;
    let cancelled = false;
    getFileDocuments(fileId, { page_size: 100 })
      .then((r) => {
        if (cancelled) return;
        const items = r?.data?.items || [];
        setLetters(items.map((d) => ({ id: d.id, title: d.title, folio: d.folio_label ?? d.folio_number })));
      })
      .catch(() => toast.error("Could not load the letters in this file."));
    return () => { cancelled = true; };
  }, [fileId]);

  useEffect(() => {
    setTicked(Object.fromEntries(letters.map((l) => [l.id, preselected ? preselected.includes(l.id) : true])));
  }, [letters, preselected]);

  const options = useMemo(() => parties.map((p) => ({ value: p.id, label: p.name })), [parties]);
  const chosen = letters.filter((l) => ticked[l.id]).map((l) => l.id);

  const [confirming, setConfirming] = useState(false);
  const partyName = options.find((o) => String(o.value) === String(partyId))?.label;

  const askToSend = () => {
    if (chosen.length === 0) { toast.error("Tick at least one letter."); return; }
    if (!partyId) { toast.error("Choose who it is being sent to."); return; }
    setConfirming(true);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const body = {
        document_ids: chosen, destination_party_id: partyId, dispatch_mode: mode,
        date_dispatched: date, our_ref_no: ourRef.trim() || null, remarks: remarks.trim() || null,
      };
      if (routingId) await sendFileOutside(routingId, body);
      else await sendOutside(body);
      toast.success("Sent outside and recorded in the Outward Mail Register.");
      onDone?.();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not record it.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return createPortal(
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="ti ti-send me-2"></i>Send outside the organisation</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={busy} />
          </div>
          <div className="modal-body">
            <p className="text-muted small">
              Recorded automatically in the <Link to="/ed-mgt/registers/outward">Outward Mail Register</Link>.
                {routingId ? " The letters are also closed in this routing." : ""}
            </p>

            <div className="mb-3">
              <label className="form-label fw-semibold small">Send to <span className="text-danger">*</span></label>
              <Select options={options} value={options.find((o) => o.value === partyId) || null}
                      onChange={(o) => setPartyId(o ? o.value : null)} isClearable placeholder="Search the senders…"
                      noOptionsMessage={() => "No senders yet - they are added when mail is filed in the Inward Mail Register"}
                      menuPortalTarget={document.body} styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
              <div className="form-text">Only people who are already senders in the Inward Mail Register. Add a name on the <Link to="/ed-mgt/registers/senders">Mail Senders</Link> page.</div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold small">How</label>
                <select className="form-select form-select-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
                  {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Date sent</label>
                <input type="date" className="form-control form-control-sm" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold small">Our reference</label>
                <input className="form-control form-control-sm" maxLength={100} value={ourRef} onChange={(e) => setOurRef(e.target.value)} />
              </div>
              <div className="col-12">
                <input className="form-control form-control-sm" maxLength={1000} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
            </div>

            <div className="fw-semibold small mb-1">Letters being sent</div>
            <div className="border rounded" style={{ maxHeight: 220, overflowY: "auto" }}>
              {letters.length === 0 && <div className="p-2 text-muted small">Loading…</div>}
              {letters.map((l) => (
                <label key={l.id} className="d-flex align-items-start gap-2 px-2 py-1 border-bottom mb-0" style={{ cursor: "pointer" }}>
                  <input type="checkbox" className="form-check-input mt-1" checked={!!ticked[l.id]}
                         onChange={(e) => setTicked((t) => ({ ...t, [l.id]: e.target.checked }))} />
                  <span className="small">{l.folio != null && l.folio !== "" ? <strong>{l.folio}. </strong> : null}{l.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={askToSend} disabled={busy || chosen.length === 0 || !partyId}>
              {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-send me-1"></i>}
              Send {chosen.length} letter{chosen.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
      <RoutingConfirmModal
        show={confirming}
        title="Send these letters outside the organisation?"
        destination={partyName || "The chosen recipient"}
        destinationNote="Each letter is recorded in the Outward Mail Register."
        letters={letters.filter((l) => ticked[l.id]).map((l) => ({ id: l.id, title: l.title, folio: l.folio }))}
        confirmLabel="Yes, send them"
        busy={busy}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      />
    </div>,
    document.body,
  );
};

export default SendOutsideModal;
