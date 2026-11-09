import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import DetailsPreloader from "../../../components/DetailsPreloader";
import { formatDate } from "../../../utils/formatters";

export default function ViewNotificationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [notification, setNotification] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNotificationDetails();
      fetchNotificationLogs();
    }
  }, [id]);

  const fetchNotificationDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/CommunicationAPI/api/notifications/${id}`);

      setNotification(response.data?.data || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotification(null);
      } else {
        setError(err.response?.data?.message || "Failed to load notification details");
      }
      console.error("Error loading notification:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await apiClient.get(`/CommunicationAPI/api/notifications/${id}/logs`);

      // API returns logs newest-first; reverse for a chronological (oldest-first) timeline
      setLogs([...(response.data?.data || [])].reverse());
    } catch (err) {
      console.error("Error loading notification logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const parseJsonSafe = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const handleRetry = async () => {
    if (!notification) return;

    const status = notification.status?.toLowerCase();

    if (status === 'sent' || status === 'delivered' || status === 'cancelled') {
      setError(`Cannot retry ${status} notification`);
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (notification.retry_count >= notification.max_retries) {
      setError("Maximum retry attempts reached");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await apiClient.post(
        `/CommunicationAPI/api/admin/notifications/${id}/retry`,
        {}
      );

      setSuccess("Notification queued for retry");
      fetchNotificationDetails();
      fetchNotificationLogs();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to retry notification");
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!notification) return;

    const status = notification.status?.toLowerCase();

    if (status === 'sent' || status === 'delivered') {
      setError("Cannot cancel sent notification");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (status === 'processing') {
      setError("Cannot cancel notification that is currently processing");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this notification?")) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await apiClient.post(
        `/CommunicationAPI/api/admin/notifications/${id}/cancel`,
        {}
      );

      setSuccess("Notification cancelled successfully");
      fetchNotificationDetails();
      fetchNotificationLogs();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel notification");
      setTimeout(() => setError(""), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      pending: 'warning',
      processing: 'info',
      sent: 'success',
      delivered: 'success',
      failed: 'danger',
      cancelled: 'secondary'
    };
    const color = colorMap[status?.toLowerCase()] || 'secondary';
    return `badge bg-${color}`;
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 8) return 'badge bg-danger';
    if (priority >= 5) return 'badge bg-warning';
    return 'badge bg-secondary';
  };

  const notificationStatus = notification?.status?.toLowerCase();

  const canRetry = notification &&
    (notificationStatus === 'failed' || notificationStatus === 'pending') &&
    notification.retry_count < notification.max_retries;

  const canCancel = notification &&
    (notificationStatus === 'pending' || notificationStatus === 'failed');

  if (loading) {
    return <DetailsPreloader />;
  }

  if (!notification) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle" style={{ fontSize: "3rem", color: "#ccc" }}></i>
          <p className="text-muted mt-2">Notification not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/communication/notifications/history')}>
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Notification Details</h5>
              <div className="d-flex gap-2">
                {canRetry && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={handleRetry}
                    disabled={actionLoading}
                  >
                    <i className="ti ti-refresh me-1"></i>
                    Retry
                  </button>
                )}
                {canCancel && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <i className="ti ti-ban me-1"></i>
                    Cancel
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/communication/notifications/history')}
                >
                  <i className="ti ti-arrow-left me-1"></i>
                  Back
                </button>
              </div>
            </div>

            <div className="card-body">
              <div className="row g-3">
                {/* Basic Information */}
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-3 text-muted">Basic Information</h6>
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{width: "40%"}}>Notification ID:</td>
                            <td><strong>#{notification.id}</strong></td>
                          </tr>
                          <tr>
                            <td className="text-muted">Channel:</td>
                            <td>
                              <span className="badge bg-primary">{notification.channel_name}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Status:</td>
                            <td>
                              <span className={getStatusBadge(notification.status)}>
                                {notification.status?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Priority:</td>
                            <td>
                              <span className={getPriorityBadge(notification.priority)}>
                                {notification.priority}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sender & Recipient */}
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-3 text-muted">Sender & Recipient</h6>
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{width: "40%"}}>Sender:</td>
                            <td><strong>{notification.sender_name}</strong></td>
                          </tr>
                          <tr>
                            <td className="text-muted">From:</td>
                            <td><code>{notification.sender_address}</code></td>
                          </tr>
                          <tr>
                            <td className="text-muted">Recipient:</td>
                            <td><code>{notification.recipient_address}</code></td>
                          </tr>
                          <tr>
                            <td className="text-muted">Template:</td>
                            <td>
                              {notification.template_name}
                              <br />
                              <small className="text-muted">({notification.template_code})</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="col-12">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-3 text-muted">Message Content</h6>

                      {notification.subject && (
                        <div className="mb-3">
                          <label className="form-label fw-bold">Subject:</label>
                          <div className="p-2 rounded" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                            {notification.subject}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="form-label fw-bold">Message:</label>
                        <div className="p-3 rounded" style={{ whiteSpace: 'pre-wrap', backgroundColor: "var(--bs-card-bg, #fff)" }}>
                          {notification.message}
                        </div>
                      </div>

                      {notification.template_data && (
                        <div className="mt-3">
                          <label className="form-label fw-bold">Template Data:</label>
                          <pre className="p-2 rounded" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                            {JSON.stringify(parseJsonSafe(notification.template_data), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-3 text-muted">Delivery Information</h6>
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{width: "50%"}}>Created At:</td>
                            <td>{formatDate(notification.created_at)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Scheduled At:</td>
                            <td>{notification.scheduled_at ? formatDate(notification.scheduled_at) : 'Immediate'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Sent At:</td>
                            <td>{notification.sent_at ? formatDate(notification.sent_at) : '-'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Retry Attempts:</td>
                            <td>
                              {notification.retry_count} / {notification.max_retries}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Provider Information */}
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-3 text-muted">Provider Information</h6>
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{width: "50%"}}>Provider Message ID:</td>
                            <td>
                              {notification.provider_message_id ? (
                                <code>{notification.provider_message_id}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Error Message:</td>
                            <td>
                              {notification.error_message ? (
                                <span className="text-danger">{notification.error_message}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Status Logs */}
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Status History</h6>
                    </div>
                    <div className="card-body">
                      {logsLoading ? (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : logs.length === 0 ? (
                        <p className="text-muted text-center mb-0">No logs available</p>
                      ) : (
                        <div className="timeline">
                          {logs.map((log, index) => (
                            <div key={log.id} className="timeline-item mb-3">
                              <div className="d-flex">
                                <div className="me-3">
                                  <div className={`rounded-circle bg-${getStatusBadge(log.status).split('bg-')[1]} p-2`} 
                                       style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="ti ti-circle-check text-white"></i>
                                  </div>
                                  {index < logs.length - 1 && (
                                    <div style={{ width: '2px', height: '40px', backgroundColor: '#dee2e6', marginLeft: '19px' }}></div>
                                  )}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between">
                                    <div>
                                      <span className={getStatusBadge(log.status)}>
                                        {log.status?.toUpperCase()}
                                      </span>
                                    </div>
                                    <small className="text-muted">
                                      {formatDate(log.created_at)}
                                    </small>
                                  </div>
                                  {log.response_payload && (
                                    <pre className="mt-2 p-2 bg-light rounded small mb-0">
                                      {JSON.stringify(parseJsonSafe(log.response_payload), null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
