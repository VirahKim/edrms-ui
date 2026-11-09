import React from "react";
import { createPortal } from "react-dom";

/**
 * "Are you sure this is where it should go?" - shown before a file or letters are sent on, so a wrong
 * person or step is caught before it happens. It spells out what is moving, where it is going and
 * which letters go with it.
 *   title         e.g. "Send this file to the Action Officer?"
 *   fileLabel     the file's name and reference
 *   destination   who or where it goes - shown large
 *   destinationNote  small text under it (e.g. "anyone holding this role can pick it up")
 *   letters       [{ id, title, folio }] the letters that go with it
 *   confirmLabel  the button, e.g. "Yes, send it"
 *   busy          disables the buttons while the step runs
 */
const RoutingConfirmModal = ({ show, title, fileLabel, destination, destinationNote, letters = [], confirmLabel = "Yes, continue", busy = false, onConfirm, onCancel }) => {
  if (!show) return null;
  return createPortal(
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9500 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <div className="avtar avtar-s bg-warning-subtle text-warning">
              <i className="ti ti-question-mark f-20"></i>
            </div>
            <button type="button" className="btn-close ms-auto" onClick={onCancel} disabled={busy} />
          </div>
          <div className="modal-body pt-2">
            <h5 className="mb-3">{title}</h5>

            {fileLabel && (
              <div className="mb-2 small">
                <span className="text-muted">File</span>
                <div className="fw-semibold"><i className="ti ti-folder text-warning me-1"></i>{fileLabel}</div>
              </div>
            )}

            <div className="rounded-3 border border-primary bg-primary bg-opacity-10 p-3 mb-3">
              <div className="small text-muted">It will go to</div>
              <div className="fw-bold fs-5 text-primary">{destination}</div>
              {destinationNote && <div className="small text-muted">{destinationNote}</div>}
            </div>

            {letters.length > 0 && (
              <>
                <div className="small text-muted mb-1">{letters.length} letter{letters.length === 1 ? "" : "s"} go with it</div>
                <ul className="list-unstyled small mb-0 border rounded p-2" style={{ maxHeight: 150, overflowY: "auto" }}>
                  {letters.map((l) => (
                    <li key={l.id} className="py-1 border-bottom text-truncate">
                      {l.folio != null && l.folio !== "" && <span className="text-muted me-2">Folio {l.folio}</span>}{l.title}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="small text-muted mt-3">
              <i className="ti ti-info-circle me-1"></i>Check this is the right place before you confirm.
            </div>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>Go back</button>
            <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
              {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-check me-1"></i>}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RoutingConfirmModal;
