import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import TablePreloader from "../../../components/TablePreloader";
import { formatDate } from "../../../utils/formatters";

export default function ViewNotificationSenders() {
  const navigate = useNavigate();
  const [senders, setSenders] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [filters, setFilters] = useState({
    channel_id: "",
    is_active: "",
    search: ""
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [senderToDelete, setSenderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchSenders();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await apiClient.get("/CommunicationAPI/api/channels", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setChannels(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load channels:", err);
    }
  };

  const fetchSenders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();

      if (filters.channel_id) params.append("channel_id", filters.channel_id);
      if (filters.is_active !== "") params.append("is_active", filters.is_active);

      const response = await apiClient.get(`/CommunicationAPI/api/senders?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      let fetchedSenders = response.data?.data || [];

      // Apply search filter on client side
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        fetchedSenders = fetchedSenders.filter(s =>
          s.sender_name?.toLowerCase().includes(searchLower) ||
          s.sender_address?.toLowerCase().includes(searchLower) ||
          s.provider?.toLowerCase().includes(searchLower)
        );
      }

      setSenders(fetchedSenders);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load senders");
      console.error("Error loading senders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchSenders();
  };

  const handleToggleStatus = async (senderId, currentStatus) => {
    try {
      const response = await apiClient.patch(
        `/CommunicationAPI/api/senders/${senderId}/status`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setSuccess(`Sender ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchSenders();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update sender status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteClick = (sender) => {
    setSenderToDelete(sender);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!senderToDelete) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/CommunicationAPI/api/senders/${senderToDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setSuccess("Sender deleted successfully");
      setShowDeleteModal(false);
      setSenderToDelete(null);
      fetchSenders();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete sender");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const getChannelName = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.name || channelId;
  };

  const getChannelBadge = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    const colorMap = {
      EMAIL: 'primary',
      SMS: 'success',
      WHATSAPP: 'info'
    };
    const color = colorMap[channel?.code] || 'secondary';
    return `badge bg-${color}`;
  };

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
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Notification Senders</h5>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/communication/notifications/senders/add')}
          >
            <i className="ti ti-plus me-1"></i>
            Add Sender
          </button>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <label className="form-label">Channel</label>
              <select
                className="form-select"
                name="channel_id"
                value={filters.channel_id}
                onChange={handleFilterChange}
              >
                <option value="">All Channels</option>
                {channels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="is_active"
                value={filters.is_active}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Sender name, address, provider..."
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={handleSearch}>
                <i className="ti ti-search me-1"></i>
                Search
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <TablePreloader />
          ) : senders.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-send-off" style={{ fontSize: "3rem", color: "#ccc" }}></i>
              <p className="text-muted mt-2">No senders found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Sender Name</th>
                    <th>Channel</th>
                    <th>Sender Address</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {senders.map(sender => (
                    <tr key={sender.id}>
                      <td>
                        <strong>{sender.sender_name}</strong>
                      </td>
                      <td>
                        <span className={getChannelBadge(sender.channel_id)}>
                          {getChannelName(sender.channel_id)}
                        </span>
                      </td>
                      <td>
                        <code>{sender.sender_address}</code>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{sender.provider}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${sender.is_active ? 'success' : 'danger'}`}>
                          {sender.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(sender.created_at)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate(`/communication/notifications/senders/edit/${sender.id}`)}
                            title="Edit"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className={`btn btn-outline-${sender.is_active ? 'warning' : 'success'}`}
                            onClick={() => handleToggleStatus(sender.id, sender.is_active)}
                            title={sender.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`ti ti-${sender.is_active ? 'ban' : 'check'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteClick(sender)}
                            title="Delete"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-danger" style={{ boxShadow: '0 0 30px rgba(220, 53, 69, 0.5)' }}>
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="ti ti-alert-triangle me-2"></i>
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-danger mb-3">
                  <i className="ti ti-exclamation-circle me-2"></i>
                  <strong>Warning:</strong> This action cannot be undone!
                </div>
                <p className="mb-2">Are you sure you want to permanently delete this sender?</p>
                <div className="card mt-3" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  <div className="card-body">
                    <p className="mb-1"><strong>Sender Name:</strong></p>
                    <p className="fw-bold text-primary">{senderToDelete?.sender_name}</p>
                    <p className="mb-1"><strong>Sender Address:</strong></p>
                    <p><code className="fs-6">{senderToDelete?.sender_address}</code></p>
                    <p className="mb-1"><strong>Provider:</strong></p>
                    <p><span className="badge bg-secondary">{senderToDelete?.provider}</span></p>
                  </div>
                </div>
                <div className="alert alert-warning mt-3 mb-0">
                  <small>
                    <i className="ti ti-info-circle me-1"></i>
                    All provider configurations associated with this sender will also be deleted.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  <i className="ti ti-x me-1"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-trash me-1"></i>
                      Yes, Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
