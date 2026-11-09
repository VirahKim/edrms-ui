import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import TablePreloader from "../../../components/TablePreloader";
import { formatDate } from "../../../utils/formatters";

export default function ViewNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    channel_id: "",
    status: "",
    from_date: "",
    to_date: "",
    recipient_address: ""
  });

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0
  });

  const channelOptions = [
    { id: 1, name: "Email" },
    { id: 2, name: "SMS" },
    { id: 3, name: "WhatsApp" }
  ];

  const statusOptions = ["pending", "processing", "sent", "delivered", "failed", "cancelled"];

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page, pagination.page_size]);

  const fetchNotifications = async (pageOverride) => {
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
      if (filters.recipient_address) params.append("recipient_address", filters.recipient_address);

      const response = await apiClient.get(`/CommunicationAPI/api/notifications?${params}`);

      const fetchedNotifications = response.data?.data || [];

      setNotifications(fetchedNotifications);
      setPagination(prev => ({
        ...prev,
        page,
        total: response.data?.pagination?.total_count ?? fetchedNotifications.length
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchNotifications(1);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getChannelBadge = (channelCode) => {
    const colorMap = {
      EMAIL: "primary",
      SMS: "success",
      WHATSAPP: "info"
    };
    const color = colorMap[channelCode] || "secondary";
    return `badge bg-${color}`;
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      pending: "warning",
      processing: "info",
      sent: "success",
      delivered: "success",
      failed: "danger",
      cancelled: "secondary"
    };
    const color = colorMap[status?.toLowerCase()] || "secondary";
    return `badge bg-${color}`;
  };

  const getPriorityBadge = (priority) => {
    if (priority >= 8) return "badge bg-danger";
    if (priority >= 5) return "badge bg-warning";
    return "badge bg-secondary";
  };

  const isStatus = (notification, value) => notification.status?.toLowerCase() === value;

  const totalPages = Math.ceil(pagination.total / pagination.page_size) || 0;

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

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Notification History</h5>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 mb-3">
            <div className="col-md-2">
              <label className="form-label">Channel</label>
              <select
                className="form-select"
                name="channel_id"
                value={filters.channel_id}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {channelOptions.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-control"
                name="from_date"
                value={filters.from_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-control"
                name="to_date"
                value={filters.to_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={handleSearch}>
                <i className="ti ti-search me-1"></i>
                Search
              </button>
            </div>

            <div className="col-12">
              <input
                type="text"
                className="form-control"
                name="recipient_address"
                value={filters.recipient_address}
                onChange={handleFilterChange}
                placeholder="Search by recipient address..."
              />
            </div>
          </div>

          {/* Stats Summary */}
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <div className="card bg-light">
                <div className="card-body py-2">
                  <small className="text-muted">Total</small>
                  <h5 className="mb-0">{pagination.total}</h5>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success-subtle">
                <div className="card-body py-2">
                  <small className="text-muted">Sent</small>
                  <h5 className="mb-0 text-success">
                    {notifications.filter(n => isStatus(n, "sent") || isStatus(n, "delivered")).length}
                  </h5>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger-subtle">
                <div className="card-body py-2">
                  <small className="text-muted">Failed</small>
                  <h5 className="mb-0 text-danger">
                    {notifications.filter(n => isStatus(n, "failed")).length}
                  </h5>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning-subtle">
                <div className="card-body py-2">
                  <small className="text-muted">Pending</small>
                  <h5 className="mb-0 text-warning">
                    {notifications.filter(n => isStatus(n, "pending") || isStatus(n, "processing")).length}
                  </h5>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <TablePreloader />
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-bell-off" style={{ fontSize: "3rem", color: "#ccc" }}></i>
              <p className="text-muted mt-2">No notifications found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Channel</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created</th>
                      <th>Sent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map(notification => (
                      <tr key={notification.id}>
                        <td>
                          <code className="small">{notification.recipient_address}</code>
                        </td>
                        <td>
                          <span className={getChannelBadge(notification.channel_code)}>
                            {notification.channel_name || notification.channel_code}
                          </span>
                        </td>
                        <td>
                          <div className="small text-truncate" style={{ maxWidth: "220px" }}>
                            {notification.subject || <span className="text-muted">-</span>}
                          </div>
                        </td>
                        <td>
                          <span className={getStatusBadge(notification.status)}>
                            {notification.status?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={getPriorityBadge(notification.priority)}>
                            {notification.priority}
                          </span>
                        </td>
                        <td>
                          <small>{formatDate(notification.created_at)}</small>
                        </td>
                        <td>
                          <small>
                            {notification.sent_at ? formatDate(notification.sent_at) : '-'}
                          </small>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/communication/notifications/details/${notification.id}`)}
                            title="View Details"
                          >
                            <i className="ti ti-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination pagination-sm justify-content-center">
                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </button>
                    </li>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                      ) {
                        return (
                          <li
                            key={page}
                            className={`page-item ${pagination.page === page ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      } else if (page === pagination.page - 2 || page === pagination.page + 2) {
                        return (
                          <li key={page} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                      return null;
                    })}

                    <li className={`page-item ${pagination.page === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
