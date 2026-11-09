import React, { useEffect } from "react";

let _setToasts = null;
let _id = 0;

// Errors stay long enough to read and act on, then go away on their own.
const ERROR_TOAST_MS = 30000;

export const toast = {
  success: (msg) => _addToast("success", msg),
  error:   (msg) => _addToast("danger",  msg, ERROR_TOAST_MS),
  info:    (msg) => _addToast("info",    msg),
  warning: (msg) => _addToast("warning", msg),
};

function _addToast(type, message, duration = 4000) {
  if (!_setToasts) return;
  const id = ++_id;
  _setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
  setTimeout(() => _removeToast(id), duration);
}

function _removeToast(id) {
  if (_setToasts) _setToasts((prev) => prev.filter((t) => t.id !== id));
}

const ICONS = { success: "ti-circle-check", danger: "ti-circle-x", info: "ti-info-circle", warning: "ti-alert-triangle" };

const EDMSToastProvider = () => {
  const [toasts, setToasts] = React.useState([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);

  if (!toasts.length) return null;

  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11000 }}>
      {toasts.map((t) => (
        <div key={t.id} className={`toast show text-white bg-${t.type} border-0 mb-2`}
             role="alert" style={{ minWidth: 300, maxWidth: 380 }}>
          <div className="d-flex align-items-start">
            <div className="toast-body d-flex align-items-start gap-2 flex-grow-1"
                 style={{ maxHeight: 220, overflowY: "auto", wordBreak: "break-word" }}>
              <i className={`ti ${ICONS[t.type] || "ti-bell"} mt-1 flex-shrink-0`}></i>
              <span>{t.message}</span>
            </div>
            <button className="btn-close btn-close-white me-2 mt-2 flex-shrink-0" onClick={() => _removeToast(t.id)}></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EDMSToastProvider;
