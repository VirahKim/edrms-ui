import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { formatDate } from "../../../utils/formatters";

const CHANNEL_ICON = {
  EMAIL: "ti-mail",
  SMS: "ti-message-2",
  WHATSAPP: "ti-brand-whatsapp"
};

const CHANNEL_COLOR = {
  EMAIL: "primary",
  SMS: "success",
  WHATSAPP: "success"
};

const STATUS_META = {
  pending: { label: "Sending", badge: "bg-light-warning" },
  processing: { label: "Sending", badge: "bg-light-info" },
  sent: { label: "Delivered", badge: "bg-light-success" },
  delivered: { label: "Delivered", badge: "bg-light-success" },
  failed: { label: "Not delivered", badge: "bg-light-danger" },
  cancelled: { label: "Cancelled", badge: "bg-light-secondary" }
};

/**
 * Reader-facing view of a single notification. Shows only what the
 * recipient needs (subject, message, channel, status, date) — no
 * admin controls like retry/cancel or raw provider error details.
 * Use ReadNotification for that.
 */
export default function ReadNotification({ notificationId, onBack, onRead }) {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (notificationId) {
      fetchNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationId]);

  const fetchNotification = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/CommunicationAPI/api/notifications/${notificationId}`);
      setNotification(response.data?.data || null);
      onRead?.(notificationId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load this message");
      console.error("Error loading notification:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
        <i className="ti ti-mail-off" style={{ fontSize: "2.5rem", color: "#ccc" }}></i>
        <p className="text-muted mt-2 mb-0">{error || "This message could not be found"}</p>
        {onBack && (
          <button className="btn btn-link btn-sm mt-2 d-md-none" onClick={onBack}>
            Back to inbox
          </button>
        )}
      </div>
    );
  }

  const status = notification.status?.toLowerCase();
  const statusMeta = STATUS_META[status] || { label: notification.status, badge: "bg-light-secondary" };
  const channelIcon = CHANNEL_ICON[notification.channel_code] || "ti-bell";
  const channelColor = CHANNEL_COLOR[notification.channel_code] || "secondary";
  const deliveredAt = notification.sent_at || notification.created_at;

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="border-bottom p-3 d-flex align-items-center gap-2">
        {onBack && (
          <button className="btn btn-sm btn-light d-md-none" onClick={onBack} title="Back to inbox">
            <i className="ti ti-arrow-left"></i>
          </button>
        )}
        <div
          className={`rounded-circle d-flex align-items-center justify-content-center bg-${channelColor} bg-opacity-10 text-${channelColor} flex-shrink-0`}
          style={{ width: 44, height: 44 }}
        >
          <i className={`ti ${channelIcon}`} style={{ fontSize: "1.2rem" }}></i>
        </div>
        <div className="flex-grow-1 text-truncate">
          <div className="fw-semibold text-truncate">
            {notification.subject || "(no subject)"}
          </div>
          <small className="text-muted text-truncate d-block">
            {notification.channel_name} &middot; {notification.recipient_address}
          </small>
        </div>
        <span className={`badge rounded-pill px-3 py-2 fw-semibold ${statusMeta.badge} flex-shrink-0`}>{statusMeta.label}</span>
      </div>

      {/* Body */}
      <div className="flex-grow-1 overflow-auto p-3 p-md-4">
        {status === "failed" && (
          <div className="alert alert-warning d-flex align-items-center gap-2 py-2">
            <i className="ti ti-alert-triangle"></i>
            <span>This message could not be delivered. No action is needed on your part.</span>
          </div>
        )}
        {(status === "pending" || status === "processing") && (
          <div className="alert alert-info d-flex align-items-center gap-2 py-2">
            <i className="ti ti-clock-hour-3"></i>
            <span>This message is still being sent.</span>
          </div>
        )}

        <div className="p-3 bg-light rounded-3" style={{ maxWidth: 720 }}>
          <div dangerouslySetInnerHTML={{ __html: notification.message }} />
        </div>

        <div className="text-muted small mt-3">
          <i className="ti ti-clock me-1"></i>
          {notification.sent_at
            ? `Delivered ${formatDate(deliveredAt, "MMMM dd, yyyy")}`
            : `Received ${formatDate(deliveredAt, "MMMM dd, yyyy")}`}
        </div>
      </div>
    </div>
  );
}
