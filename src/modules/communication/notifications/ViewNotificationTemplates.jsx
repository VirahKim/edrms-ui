import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import TablePreloader from "../../../components/TablePreloader";
import { formatDate } from "../../../utils/formatters";

export default function ViewNotificationTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [filters, setFilters] = useState({
    channel_id: "",
    language_code: "",
    is_active: "",
    search: ""
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();

      if (filters.channel_id) params.append("channel_id", filters.channel_id);
      if (filters.language_code) params.append("language_code", filters.language_code);
      if (filters.is_active !== "") params.append("is_active", filters.is_active);

      const response = await apiClient.get(`/CommunicationAPI/api/templates?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      let fetchedTemplates = response.data?.data || [];

      // Apply search filter on client side
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        fetchedTemplates = fetchedTemplates.filter(t => 
          t.name?.toLowerCase().includes(searchLower) ||
          t.code?.toLowerCase().includes(searchLower) ||
          t.subject_template?.toLowerCase().includes(searchLower) ||
          t.body_template?.toLowerCase().includes(searchLower)
        );
      }

      setTemplates(fetchedTemplates);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load templates");
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchTemplates();
  };

  const handleToggleStatus = async (templateId, currentStatus) => {
    try {
      const response = await apiClient.patch(
        `/CommunicationAPI/api/templates/${templateId}/status`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setSuccess(`Template ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchTemplates();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update template status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/CommunicationAPI/api/templates/${templateToDelete.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setSuccess("Template deleted successfully");
      setShowDeleteModal(false);
      setTemplateToDelete(null);
      fetchTemplates();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete template");
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
          <h5 className="mb-0">Notification Templates</h5>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/communication/notifications/templates/create')}
          >
            <i className="ti ti-plus me-1"></i>
            Create Template
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

            <div className="col-md-2">
              <label className="form-label">Language</label>
              <input
                type="text"
                className="form-control"
                name="language_code"
                value={filters.language_code}
                onChange={handleFilterChange}
                placeholder="e.g., en, es"
              />
            </div>

            <div className="col-md-2">
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

            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Template name, code..."
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
          ) : templates.length === 0 ? (
            <div className="text-center py-5">
              <i className="ti ti-mail-off" style={{ fontSize: "3rem", color: "#ccc" }}></i>
              <p className="text-muted mt-2">No templates found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Template Code</th>
                    <th>Name</th>
                    <th>Channel</th>
                    <th>Language</th>
                    <th>Subject/Body Preview</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(template => (
                    <tr key={template.id}>
                      <td>
                        <code>{template.code}</code>
                      </td>
                      <td>{template.name}</td>
                      <td>
                        <span className={getChannelBadge(template.channel_id)}>
                          {getChannelName(template.channel_id)}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{template.language_code || '-'}</span>
                      </td>
                      <td>
                        <div style={{ maxWidth: "300px" }}>
                          {template.subject_template ? (
                            <div className="small text-truncate">
                              <strong>Subject:</strong> {template.subject_template}
                            </div>
                          ) : null}
                          <div className="small text-truncate text-muted">
                            {template.body_template ? `${template.body_template.substring(0, 50)}...` : '-'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-info">{template.version ? `v${template.version}` : '—'}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${template.is_active ? 'success' : 'danger'}`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(template.created_at)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate(`/communication/notifications/templates/edit/${template.id}`)}
                            title="Edit"
                          >
                            <i className="ti ti-edit"></i>
                          </button>
                          <button
                            className={`btn btn-outline-${template.is_active ? 'warning' : 'success'}`}
                            onClick={() => handleToggleStatus(template.id, template.is_active)}
                            title={template.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`ti ti-${template.is_active ? 'ban' : 'check'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteClick(template)}
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
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the template:</p>
                <p className="fw-bold">{templateToDelete?.name}</p>
                <p className="text-danger small">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
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
                      Delete
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
