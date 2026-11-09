import React, { useEffect, useState } from "react";
import Select from "react-select";
import { getChainPeople } from "../../../api/fileRoutingApi";
import NoteSignature from "./NoteSignature";
import { toRoman } from "../utils/routingNotes";

const selectStyles = { menuPortal: (b) => ({ ...b, zIndex: 9999 }) };

/**
 * Sticky notes: open (anyone in the chain can read them) or private (only the people named).
 *   documents     [{ id, title }] the note can be stuck on (empty = the whole file only)
 *   placingIndex  index of the note whose pin is being placed on the preview, or null
 *   onPlace(i)    start placing note i's pin (the page shows that letter and listens for a click)
 */
export const StickyNotesEditor = ({ notes, onChange, documents = [], placingIndex = null, onPlace, defaultDocumentId = null }) => {
  const [people, setPeople] = useState([]);
  useEffect(() => {
    getChainPeople().then((r) => setPeople(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
  }, []);
  const options = people.map((p) => ({ value: p.user_id, label: `${p.name} (${p.role_label})` }));

  const update = (i, patch) => onChange(notes.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));

  return (
    <div>
      {notes.map((n, i) => (
        <div key={i} className="border rounded-3 p-2 mb-2" style={{ background: "#fff8d6" }}>
          <textarea className="form-control form-control-sm mb-2" rows={2} maxLength={2000}
                    placeholder="Sticky note…" value={n.text} onChange={(e) => update(i, { text: e.target.value })} />
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={n.visibility}
                      onChange={(e) => update(i, { visibility: e.target.value })}>
                <option value="OPEN">Open - anyone in the chain can read it</option>
                <option value="PRIVATE">Private - only the people I name</option>
              </select>
            </div>
            {documents.length > 0 && (
              <div className="col-md-4">
                <select className="form-select form-select-sm" value={n.document_id || ""}
                        onChange={(e) => update(i, { document_id: e.target.value ? Number(e.target.value) : null, pin_x: null, pin_y: null })}>
                  <option value="">On the whole file</option>
                  {documents.map((d) => <option key={d.id} value={d.id}>On: {d.title}</option>)}
                </select>
              </div>
            )}
            <div className="col text-end text-nowrap">
              {onPlace && n.document_id && (
                <button type="button" className={`btn btn-sm me-1 ${placingIndex === i ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => onPlace(i)}>
                  <i className="ti ti-pin me-1"></i>
                  {placingIndex === i ? "Click the letter…" : n.pin_x != null ? "Move pin" : "Pin on the letter"}
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onChange(notes.filter((_, idx) => idx !== i))}>
                <i className="ti ti-trash"></i>
              </button>
            </div>
          </div>
          {n.visibility === "PRIVATE" && (
            <div className="mt-2">
              <Select isMulti options={options} styles={selectStyles} menuPortalTarget={document.body}
                      placeholder="Who is it for?" value={options.filter((o) => n.recipient_user_ids.includes(o.value))}
                      onChange={(sel) => update(i, { recipient_user_ids: (sel || []).map((o) => o.value) })} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-outline-warning btn-sm"
              onClick={() => onChange([...notes, {
                text: "", visibility: "OPEN", recipient_user_ids: [],
                document_id: documents.some((d) => d.id === defaultDocumentId) ? defaultDocumentId : null,
              }])}>
        <i className="ti ti-note me-1"></i>Add a sticky note
      </button>
    </div>
  );
};

/**
 * The comment and sticky notes that go with a routing step.
 *   value / onChange   see emptyNotes
 *   commentLabel       what the comment is called ("Comment written on the letters")
 *   placingIndex/onPlace  see StickyNotesEditor
 */
const RoutingNotesComposer = ({ value, onChange, documents, commentLabel = "Comment", placingIndex, onPlace, defaultDocumentId, nextNumber = null, allowComment = true }) => (
  <div>
    {allowComment && (
      <>
        <label className="form-label fw-semibold small mb-1">
          {nextNumber ? <span className="badge bg-primary me-2">{toRoman(nextNumber)}</span> : null}{commentLabel}
        </label>
        <textarea className="form-control mb-2" rows={3} maxLength={2000} value={value.comment}
                  onChange={(e) => onChange({ ...value, comment: e.target.value })} />
        <NoteSignature signed={!!value.signed} onSigned={(signed) => onChange({ ...value, signed })} />
      </>
    )}

    <label className="form-label fw-semibold small mb-1">Sticky notes <span className="text-muted fw-normal">(optional)</span></label>
    <StickyNotesEditor notes={value.notes} onChange={(notes) => onChange({ ...value, notes })} documents={documents}
                        placingIndex={placingIndex} onPlace={onPlace} defaultDocumentId={defaultDocumentId} />
  </div>
);

export default RoutingNotesComposer;
