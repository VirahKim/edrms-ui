import React, { useState } from "react";

const ConfirmModal = ({ show, title, message, confirmLabel = "Confirm", dangerWord, onConfirm, onCancel, danger = false }) => {
  const [typed, setTyped] = useState("");

  if (!show) return null;
  const disabled = dangerWord ? typed !== dangerWord : false;

  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <div className={`avtar avtar-s ${danger ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning"}`}>
              <i className={`ti ${danger ? "ti-alert-triangle" : "ti-question-mark"} f-20`}></i>
            </div>
            <button className="btn-close ms-auto" onClick={onCancel}></button>
          </div>
          <div className="modal-body pt-2">
            <h5 className="mb-1">{title}</h5>
            <p className="text-muted mb-0">{message}</p>
            {dangerWord && (
              <div className="mt-3">
                <label className="form-label small text-muted">
                  Type <strong>{dangerWord}</strong> to confirm
                </label>
                <input className="form-control form-control-sm" value={typed}
                       onChange={(e) => setTyped(e.target.value)} placeholder={dangerWord} />
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-outline-secondary btn-sm" onClick={onCancel}>Cancel</button>
            <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
                    disabled={disabled} onClick={() => { setTyped(""); onConfirm(); }}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
