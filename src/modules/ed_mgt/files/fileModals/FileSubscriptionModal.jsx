import React, { useState, useEffect } from "react";
import {
  getFileSubscriptions,
  subscribeFileNotifications,
  unsubscribeFromFile,
} from "../../../../api/edmsApi";
import { toast } from "../../components/EDMSToast";

const FileSubscriptionModal = ({ file, onClose }) => {
  const [prefs, setPrefs] = useState({
    notify_on_add: true,
    notify_on_update: false,
    notify_on_remove: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getFileSubscriptions(file.id)
      .then((r) => {
        const list = Array.isArray(r?.data) ? r.data : [];
        if (list.length > 0) {
          const sub = list[0];
          setIsSubscribed(true);
          setPrefs({
            notify_on_add: sub.notify_on_add ?? true,
            notify_on_update: sub.notify_on_update ?? false,
            notify_on_remove: sub.notify_on_remove ?? false,
          });
        } else {
          setIsSubscribed(false);
        }
      })
      .catch(() => toast.error("Failed to load subscription."))
      .finally(() => setLoading(false));
  }, [file.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await subscribeFileNotifications(file.id, prefs);
      setIsSubscribed(true);
      toast.success(isSubscribed ? "Subscription updated." : "Subscribed to file.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    try {
      await unsubscribeFromFile(file.id);
      setIsSubscribed(false);
      setPrefs({ notify_on_add: true, notify_on_update: false, notify_on_remove: false });
      toast.success("Unsubscribed from file.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unsubscribe.");
    } finally {
      setUnsubscribing(false);
    }
  };

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-bell me-2 text-primary" />
                File Notifications              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-muted" />
                </div>
              ) : (
                <>
                  <p className="mb-1" style={{ fontSize: "0.875rem" }}>
                    File: <strong>{file.name}</strong>
                  </p>
                  {isSubscribed && (
                    <div className="alert alert-success py-1 px-2 mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.8rem" }}>
                      <i className="ti ti-check-circle" />
                      You are currently subscribed to this file.
                    </div>
                  )}

                  <p className="fw-semibold mb-2" style={{ fontSize: "0.875rem" }}>
                    Notify me when:
                  </p>

                  {[
                    { key: "notify_on_add", icon: "ti-file-plus", label: "A document is added" },
                    { key: "notify_on_update", icon: "ti-file-pencil", label: "A document is updated" },
                    { key: "notify_on_remove", icon: "ti-file-minus", label: "A document is removed" },
                  ].map(({ key, icon, label }) => (
                    <div
                      key={key}
                      className={`d-flex align-items-center justify-content-between p-2 rounded mb-2 border ${prefs[key] ? "border-primary bg-primary bg-opacity-5" : "border-light"}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggle(key)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className={`ti ${icon} ${prefs[key] ? "text-primary" : "text-muted"}`} />
                        <span style={{ fontSize: "0.875rem" }}>{label}</span>
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={prefs[key]}
                          readOnly
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="modal-footer border-top d-flex justify-content-between">
              {isSubscribed ? (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleUnsubscribe}
                  disabled={unsubscribing || loading}
                >
                  {unsubscribing ? (
                    <><span className="spinner-border spinner-border-sm me-1" />Unsubscribing…</>
                  ) : (
                    <><i className="ti ti-bell-off me-1" />Unsubscribe</>
                  )}
                </button>
              ) : (
                <span />
              )}
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                  ) : isSubscribed ? (
                    <><i className="ti ti-check me-1" />Update</>
                  ) : (
                    <><i className="ti ti-bell me-1" />Subscribe</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FileSubscriptionModal;
