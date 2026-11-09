import React, { useState, useEffect } from "react";
import DashboardLayout from "../../../../layout/DashboardLayout";
import apiClient from "../../../../api/apiClient";
import TablePreloader from "../../../../components/TablePreloader";

const LoginAttempts = () => {
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    user_id: "",
    status: "",
    from: "",
    to: "",
    page: 1
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1
  });

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    blocked: 0
  });

  useEffect(() => {
    fetchLoginAttempts();
  }, [filters.page, filters.status, filters.from, filters.to]);

  const fetchLoginAttempts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.page > 1) params.append("page", filters.page);

      const queryString = params.toString();
      const url = `/IAmAPI/api/audits/login-attempts${queryString ? `?${queryString}` : ""}`;

      const response = await apiClient.get(url);
      
      if (response.data) {
        setLoginAttempts(response.data.data || response.data);
        
        // Handle pagination if present
        if (response.data.meta) {
          setPagination({
            total: response.data.meta.total || 0,
            per_page: response.data.meta.per_page || 20,
            current_page: response.data.meta.current_page || 1,
            last_page: response.data.meta.last_page || 1
          });
        }

        // Calculate stats
        const attempts = response.data.data || response.data;
        calculateStats(attempts);
      }
    } catch (err) {
      console.error("Error fetching login attempts:", err);
      setError(err.response?.data?.message || "Failed to fetch login attempts");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attempts) => {
    const stats = {
      total: attempts.length,
      success: attempts.filter(a => a.status === "SUCCESS").length,
      failed: attempts.filter(a => a.status === "FAILED").length,
      blocked: attempts.filter(a => a.status === "BLOCKED").length
    };
    setStats(stats);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value // Reset to page 1 when filters change
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLoginAttempts();
  };

  const clearFilters = () => {
    setFilters({
      user_id: "",
      status: "",
      from: "",
      to: "",
      page: 1
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      SUCCESS: "bg-success",
      FAILED: "bg-danger",
      BLOCKED: "bg-warning text-dark"
    };
    return badges[status] || "bg-secondary";
  };

  const getStatusIcon = (status) => {
    const icons = {
      SUCCESS: "ti-check",
      FAILED: "ti-x",
      BLOCKED: "ti-lock"
    };
    return icons[status] || "ti-help";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="row">
        <div className="col-12">
          {/* Cyber Security Header */}
          <div className="page-header mb-4">
            <div className="page-block">
              <div className="row align-items-center">
                <div className="col-md-12">
                  <div className="d-flex align-items-center">
                    <div className="avtar avtar-s bg-danger rounded-2 me-2">
                      <i className="ti ti-shield-lock text-white"></i>
                    </div>
                    <div>
                      <h5 className="m-b-5">Security Audit</h5>
                      <p className="text-muted m-0">
                        <i className="ti ti-activity me-1"></i>
                        Login Attempts Monitor & Analysis
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-white-50 mb-1">
                        <i className="ti ti-list-check me-1"></i>Total Attempts
                      </p>
                      <h3 className="mb-0 text-white">{stats.total}</h3>
                    </div>
                    <div className="avtar avtar-xl">
                      <i className="ti ti-activity fs-1 opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-white-50 mb-1">
                        <i className="ti ti-check me-1"></i>Successful
                      </p>
                      <h3 className="mb-0 text-white">{stats.success}</h3>
                    </div>
                    <div className="avtar avtar-xl">
                      <i className="ti ti-shield-check fs-1 opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-white-50 mb-1">
                        <i className="ti ti-x me-1"></i>Failed
                      </p>
                      <h3 className="mb-0 text-white">{stats.failed}</h3>
                    </div>
                    <div className="avtar avtar-xl">
                      <i className="ti ti-shield-x fs-1 opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-white-50 mb-1">
                        <i className="ti ti-lock me-1"></i>Blocked
                      </p>
                      <h3 className="mb-0 text-white">{stats.blocked}</h3>
                    </div>
                    <div className="avtar avtar-xl">
                      <i className="ti ti-lock-off fs-1 opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-dark text-white">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">
                  <i className="ti ti-filter me-2"></i>Advanced Filters
                </h6>
                <span className="badge bg-danger">
                  <i className="ti ti-shield me-1"></i>Security Monitor
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">
                    <i className="ti ti-user me-1"></i>User ID
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter User ID"
                    value={filters.user_id}
                    onChange={(e) => handleFilterChange("user_id", e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">
                    <i className="ti ti-status-change me-1"></i>Status
                  </label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">
                    <i className="ti ti-calendar me-1"></i>From Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.from}
                    onChange={(e) => handleFilterChange("from", e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">
                    <i className="ti ti-calendar me-1"></i>To Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={filters.to}
                    onChange={(e) => handleFilterChange("to", e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <i className="ti ti-search me-1"></i>
                  Apply Filters
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                  disabled={loading}
                >
                  <i className="ti ti-refresh me-1"></i>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Alert Banner */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="ti ti-alert-triangle me-2 fs-4"></i>
              <div>{error}</div>
            </div>
          )}

          {/* Login Attempts Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark text-white">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="mb-0">
                  <i className="ti ti-list-details me-2"></i>Login Attempts Log
                </h6>
                <span className="badge bg-light text-dark">
                  {pagination.total} Total Records
                </span>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4">
                  <TablePreloader />
                </div>
              ) : loginAttempts.length === 0 ? (
                <div className="text-center py-5">
                  <div className="avtar avtar-xl bg-light-secondary rounded-circle mx-auto mb-3">
                    <i className="ti ti-database-off fs-1 text-secondary"></i>
                  </div>
                  <h5 className="text-muted">No Login Attempts Found</h5>
                  <p className="text-muted">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th><i className="ti ti-hash me-1"></i>ID</th>
                        <th><i className="ti ti-user me-1"></i>User</th>
                        <th><i className="ti ti-mail me-1"></i>Email/Username</th>
                        <th><i className="ti ti-world me-1"></i>IP Address</th>
                        <th><i className="ti ti-device-desktop me-1"></i>User Agent</th>
                        <th><i className="ti ti-status-change me-1"></i>Status</th>
                        <th><i className="ti ti-clock me-1"></i>Timestamp</th>
                        <th><i className="ti ti-info-circle me-1"></i>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginAttempts.map((attempt, index) => (
                        <tr key={attempt.id || index} className="align-middle">
                          <td>
                            <span className="badge bg-light-secondary">
                              #{attempt.id || index + 1}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avtar avtar-s bg-light-primary rounded-circle me-2">
                                <i className="ti ti-user fs-6"></i>
                              </div>
                              <span className="fw-semibold">
                                {attempt.user_id || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">
                              {attempt.email_or_username || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light-info">
                              <i className="ti ti-map-pin me-1"></i>
                              {attempt.source_ip || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted text-truncate d-block" style={{ maxWidth: "200px" }}>
                              {attempt.user_agent || "Not Available"}
                            </small>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(attempt.status)}`}>
                              <i className={`ti ${getStatusIcon(attempt.status)} me-1`}></i>
                              {attempt.status || "UNKNOWN"}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              <i className="ti ti-calendar-time me-1"></i>
                              {formatDateTime(attempt.attempt_time)}
                            </small>
                          </td>
                          <td>
                            {attempt.failure_reason && (
                              <span className="badge bg-light-danger" title={attempt.failure_reason}>
                                <i className="ti ti-alert-circle me-1"></i>
                                {attempt.failure_reason.substring(0, 20)}
                                {attempt.failure_reason.length > 20 && "..."}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && loginAttempts.length > 0 && pagination.last_page > 1 && (
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    <small>
                      Showing page {pagination.current_page} of {pagination.last_page}
                      {" "}({pagination.total} total records)
                    </small>
                  </div>
                  <div className="btn-group" role="group">
                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => handleFilterChange("page", filters.page - 1)}
                      disabled={filters.page === 1}
                    >
                      <i className="ti ti-chevron-left"></i>
                    </button>
                    {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          className={`btn btn-sm ${
                            pageNum === filters.page ? "btn-dark" : "btn-outline-dark"
                          }`}
                          onClick={() => handleFilterChange("page", pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => handleFilterChange("page", filters.page + 1)}
                      disabled={filters.page === pagination.last_page}
                    >
                      <i className="ti ti-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="alert alert-dark border-0 mt-4 shadow-sm" role="alert">
            <div className="d-flex align-items-start">
              <div className="avtar avtar-s bg-dark rounded-circle me-3 flex-shrink-0">
                <i className="ti ti-shield-lock text-white"></i>
              </div>
              <div>
                <h6 className="alert-heading mb-2">
                  <i className="ti ti-info-circle me-1"></i>Security Monitoring
                </h6>
                <p className="mb-0 small">
                  This audit log tracks all authentication attempts to the system. 
                  Multiple failed attempts from the same IP address may indicate a security threat. 
                  Administrators should regularly monitor this log for suspicious activity and take 
                  appropriate action to protect the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LoginAttempts;
