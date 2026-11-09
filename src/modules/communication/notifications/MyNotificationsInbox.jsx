import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import ReadNotification from "./ReadNotification";

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

// Soft "light" pill (tinted background + matching text) — the app-wide
// convention for status pills (see Users.jsx etc.), and one that actually
// renders: the bare bg-success/bg-danger/... classes have no background of
// their own in this theme, only white-on-transparent text.
const STATUS_META = {
  pending: { label: "Sending", badge: "bg-light-warning" },
  processing: { label: "Sending", badge: "bg-light-info" },
  sent: { label: "Delivered", badge: "bg-light-success" },
  delivered: { label: "Delivered", badge: "bg-light-success" },
  failed: { label: "Not delivered", badge: "bg-light-danger" },
  cancelled: { label: "Cancelled", badge: "bg-light-secondary" }
};
const STATUS_BADGE_CLASS = "badge rounded-pill px-3 py-2 fw-semibold";

const channelOptions = [
  { id: 1, name: "Email" },
  { id: 2, name: "SMS" },
  { id: 3, name: "WhatsApp" }
];

function listTimestamp(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MyNotificationsInbox() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [readFilter, setReadFilter] = useState("all"); // all | unread | read
  const [filters, setFilters] = useState({
    channel_id: "",
    status: "",
    from_date: "",
    to_date: ""
  });

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMyNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  // Deep-link from the navbar's notification hover preview — open straight
  // into whichever notification the user clicked there.
  useEffect(() => {
    if (location.state?.openNotificationId) {
      setSelectedId(location.state.openNotificationId);
    }
  }, [location.state]);

  const fetchMyNotifications = async (pageOverride) => {
    const page = pageOverride ?? pagination.page;

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page,
        page_size: pagination.page_size
      });

      if (filters.channel_id) params.append("channel_id", filters.channel_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);

      const response = await apiClient.get(`/CommunicationAPI/api/notifications/me?${params}`);

      const fetchedNotifications = response.data?.data || [];

      setNotifications(fetchedNotifications);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.data?.pagination?.total_count ?? fetchedNotifications.length
      }));
      setUnreadCount(
        response.data?.pagination?.unread_count
          ?? fetchedNotifications.filter(n => !n.is_read).length
      );

      setSelectedId(prevId => {
        if (prevId && fetchedNotifications.some(n => n.id === prevId)) return prevId;
        return null;
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your notifications");
      console.error("Error loading inbox notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchMyNotifications(1);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectNotification = (notification) => {
    setSelectedId(notification.id);
    markAsReadLocally(notification.id);
  };

  const markAsReadLocally = (id) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (!target || target.is_read) return prev;
      setUnreadCount(count => Math.max(0, count - 1));
      return prev.map(n => (n.id === id ? { ...n, is_read: true } : n));
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.page_size) || 0;

  // Read/unread is filtered client-side against the current page — there's
  // no is_read param on the list endpoint — same pattern as the search box.
  const visibleNotifications = notifications
    .filter(n => {
      if (readFilter === "unread") return !n.is_read;
      if (readFilter === "read") return n.is_read;
      return true;
    })
    .filter(n =>
      !searchTerm.trim() || (n.subject || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

  const readCount = Math.max(0, pagination.total - unreadCount);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      <div className="card mb-0" style={{ height: "75vh", minHeight: 520 }}>
        <div className="card-body p-0 d-flex h-100" style={{ overflow: "hidden" }}>
          {/* Sidebar: notification list */}
          <div
            className={`border-end d-flex flex-column ${selectedId ? "d-none d-md-flex" : "d-flex"}`}
            style={{ width: 340, minWidth: 280, flexShrink: 0, height: "100%" }}
          >
            <div className="p-2 border-bottom" style={{ flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Inbox</span>
                {unreadCount > 0 && (
                  <span className="badge rounded-pill bg-primary">{unreadCount} unread</span>
                )}
              </div>
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="button"
                  className={`btn btn-sm ${activeFilterCount ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setShowFilters(prev => !prev)}
                  title="Filters"
                >
                  <i className="ti ti-filter"></i>
                  {activeFilterCount > 0 && (
                    <span
                      className="badge rounded-pill ms-1"
                      style={{ background: "#fff", color: "var(--bs-primary, #007bff)" }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Read / unread segmented filter */}
              <div className="btn-group btn-group-sm w-100 mt-2" role="group" aria-label="Read status">
                {[
                  { key: "all", label: "All", count: pagination.total },
                  { key: "unread", label: "Unread", count: unreadCount },
                  { key: "read", label: "Read", count: readCount }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`btn ${readFilter === tab.key ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setReadFilter(tab.key)}
                  >
                    {tab.label}
                    <span
                      className={`badge rounded-pill ms-1 ${readFilter === tab.key ? "" : "bg-light-secondary"}`}
                      style={readFilter === tab.key ? { background: "#fff", color: "var(--bs-primary, #007bff)" } : undefined}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {showFilters && (
                <div className="mt-2 d-flex flex-column gap-2">
                  <select
                    className="form-select form-select-sm"
                    name="channel_id"
                    value={filters.channel_id}
                    onChange={handleFilterChange}
                  >
                    <option value="">All channels</option>
                    {channelOptions.map(channel => (
                      <option key={channel.id} value={channel.id}>{channel.name}</option>
                    ))}
                  </select>

                  <select
                    className="form-select form-select-sm"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All statuses</option>
                    <option value="sent">Delivered</option>
                    <option value="delivered">Delivered</option>
                    <option value="pending">Sending</option>
                    <option value="processing">Sending</option>
                    <option value="failed">Not delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <div className="d-flex gap-2">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="from_date"
                      value={filters.from_date}
                      onChange={handleFilterChange}
                    />
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="to_date"
                      value={filters.to_date}
                      onChange={handleFilterChange}
                    />
                  </div>

                  <button className="btn btn-primary btn-sm" onClick={handleApplyFilters}>
                    Apply filters
                  </button>
                </div>
              )}
            </div>

            <div className="flex-grow-1 overflow-auto">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="ti ti-bell-off" style={{ fontSize: "2.5rem", color: "#ccc" }}></i>
                  <p className="text-muted mt-2 mb-0">
                    {searchTerm || activeFilterCount
                      ? "No messages match your search"
                      : readFilter === "unread"
                      ? "No unread messages"
                      : readFilter === "read"
                      ? "No read messages yet"
                      : "Your inbox is empty"}
                  </p>
                </div>
              ) : (
                visibleNotifications.map(notification => {
                  const status = notification.status?.toLowerCase();
                  const statusMeta = STATUS_META[status] || { label: notification.status, badge: "bg-light-secondary" };
                  const channelIcon = CHANNEL_ICON[notification.channel_code] || "ti-bell";
                  const channelColor = CHANNEL_COLOR[notification.channel_code] || "secondary";
                  const isActive = selectedId === notification.id;
                  const isUnread = !notification.is_read;

                  let backgroundColor = "transparent";
                  if (isActive) backgroundColor = "rgba(13,110,253,0.08)";
                  else if (isUnread) backgroundColor = "rgba(13,110,253,0.03)";

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      className="btn qs-notif-row w-100 text-start d-flex align-items-start gap-2 border-0 border-bottom rounded-0 px-3 py-2"
                      style={{ backgroundColor }}
                      onClick={() => handleSelectNotification(notification)}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center bg-${channelColor} bg-opacity-10 text-${channelColor} flex-shrink-0 position-relative`}
                        style={{ width: 38, height: 38 }}
                      >
                        <i className={`ti ${channelIcon}`}></i>
                        {isUnread && (
                          <span
                            className="rounded-circle bg-primary position-absolute"
                            style={{ width: 9, height: 9, top: -1, right: -1, border: "2px solid #fff" }}
                            title="Unread"
                          ></span>
                        )}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex justify-content-between">
                          <span className={`text-truncate ${isUnread ? "fw-bold" : "fw-normal text-body-secondary"}`}>
                            {notification.subject || <span className="text-muted fw-normal">(no subject)</span>}
                          </span>
                          <small className={`ms-2 flex-shrink-0 ${isUnread ? "text-primary fw-semibold" : "text-muted"}`}>
                            {listTimestamp(notification.sent_at || notification.created_at)}
                          </small>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <span className="d-flex align-items-center gap-1 text-truncate">
                            <small className="text-muted text-truncate">{notification.channel_name}</small>
                            <small className="text-muted">&middot;</small>
                            {isUnread ? (
                              <small className="text-primary fw-semibold d-flex align-items-center gap-1">
                                <i className="ti ti-point-filled" style={{ fontSize: 10 }}></i>
                                Unread
                              </small>
                            ) : (
                              <small className="text-muted d-flex align-items-center gap-1">
                                <i className="ti ti-checks" style={{ fontSize: 11 }}></i>
                                Read
                              </small>
                            )}
                          </span>
                          <span className={`${STATUS_BADGE_CLASS} ${statusMeta.badge} flex-shrink-0`}>{statusMeta.label}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-2 border-top" style={{ flexShrink: 0 }}>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <i className="ti ti-chevron-left"></i>
                </button>
                <small className="text-muted">Page {pagination.page} of {totalPages}</small>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={pagination.page === totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  <i className="ti ti-chevron-right"></i>
                </button>
              </div>
            )}
          </div>

          {/* Reading pane */}
          <div className={`flex-grow-1 ${selectedId ? "d-flex" : "d-none d-md-flex"} flex-column`} style={{ minWidth: 0 }}>
            {selectedId ? (
              <ReadNotification
                notificationId={selectedId}
                onBack={() => setSelectedId(null)}
                onRead={markAsReadLocally}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
                <i className="ti ti-message-circle-2" style={{ fontSize: "3rem", color: "#ccc" }}></i>
                <p className="text-muted mt-2 mb-0">Select a message to read</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
