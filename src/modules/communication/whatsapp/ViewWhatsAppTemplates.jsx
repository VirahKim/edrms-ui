import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import whatsappApi from "../../../api/whatsappApi";

/**
 * ViewWhatsAppTemplates - Manage WhatsApp message templates
 */
export default function ViewWhatsAppTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      // Templates are now organization-scoped automatically by the API
      const response = await whatsappApi.getTemplates();
      const data = response.data || [];
      
      // Normalize API response from PascalCase to camelCase
      const normalized = data.map((t) => {
        const components = t.Components || t.components || [];
        
        // Parse components into structured format
        const parsedComponents = {
          header: components.find(c => (c.type || c.Type) === "HEADER"),
          body: components.find(c => (c.type || c.Type) === "BODY"),
          footer: components.find(c => (c.type || c.Type) === "FOOTER"),
          buttons: components.filter(c => (c.type || c.Type) === "BUTTONS")
        };
        
        return {
          id: t.Id ?? t.id,
          metaTemplateId: t.MetaTemplateId ?? t.metaTemplateId,
          name: t.Name ?? t.name,
          languageCode: t.LanguageCode ?? t.languageCode,
          category: t.Category ?? t.category,
          status: t.Status ?? t.status,
          components: parsedComponents,
          rawComponents: components, // Keep raw for detailed view
          variablesInfo: t.VariablesInfo ?? t.variablesInfo ?? [],
          createdAt: t.CreatedAt ?? t.createdAt
        };
      });
      
      setTemplates(normalized);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError(err.response?.data?.message || "Failed to load WhatsApp templates");
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.syncTemplates();
      setSuccess(response.data?.message || "Templates synced successfully");
      await fetchTemplates();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sync templates");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (template) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: "bg-success",
      pending: "bg-warning",
      rejected: "bg-danger",
      disabled: "bg-secondary"
    };
    return badges[status?.toLowerCase()] || "bg-secondary";
  };

  const getCategoryBadge = (category) => {
    const badges = {
      MARKETING: "bg-primary",
      UTILITY: "bg-info",
      AUTHENTICATION: "bg-warning"
    };
    return badges[category] || "bg-secondary";
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === "" ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
      template.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="row">
        <div className="col-12">
          {/* Page Header */}
          <div className="page-header mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">WhatsApp Message Templates</h4>
                <p className="text-muted mb-0">
                  Manage your approved WhatsApp message templates
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={handleSync}
                  disabled={loading}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Sync from Meta
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/communication/whatsapp/templates/create")}
                >
                  <i className="ti ti-plus me-2"></i>
                  Create Template
                </button>
              </div>
            </div>
          </div>

          {/* Alerts */}
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

          {/* Filters */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <div className="text-muted">
                    Showing {filteredTemplates.length} of {templates.length} templates
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-template text-muted" style={{ fontSize: "64px" }}></i>
                <h5 className="mt-3">No Templates Found</h5>
                <p className="text-muted">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Get started by creating your first template"}
                </p>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="flex-grow-1">
                          <h6 className="card-title mb-1">{template.name}</h6>
                          <div className="d-flex gap-2 mb-2">
                            <span className={`badge ${getStatusBadge(template.status)}`}>
                              {template.status}
                            </span>
                            <span className={`badge ${getCategoryBadge(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                          <div className="small text-muted">
                            Language: {template.languageCode}
                          </div>
                        </div>
                      </div>

                      {/* Template Preview */}
                      {template.components && (
                        <div className="template-preview bg-light p-3 rounded mb-3">
                          {/* Header */}
                          {template.components.header && (
                            <div className="mb-2 fw-semibold">
                              {template.components.header.text || 
                               template.components.header.format || "Header"}
                            </div>
                          )}

                          {/* Body */}
                          {template.components.body && (
                            <div className="small mb-2" style={{ whiteSpace: "pre-wrap" }}>
                              {template.components.body.text?.substring(0, 100) || "Body content"}
                              {template.components.body.text?.length > 100 && "..."}
                            </div>
                          )}

                          {/* Footer */}
                          {template.components.footer && (
                            <div className="small text-muted">
                              {template.components.footer.text}
                            </div>
                          )}

                          {/* Buttons */}
                          {template.components.buttons && template.components.buttons.length > 0 && (
                            <div className="mt-2 d-flex gap-1 flex-wrap">
                              {template.components.buttons.map((btn, idx) => (
                                <span key={idx} className="badge bg-primary small">
                                  {btn.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Variables Info */}
                      {template.variablesInfo && template.variablesInfo.length > 0 && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">Variables:</small>
                          <div className="d-flex gap-1 flex-wrap">
                            {template.variablesInfo.map((variable, idx) => (
                              <code key={idx} className="small">{variable}</code>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Meta Template ID */}
                      <div className="mb-3">
                        <small className="text-muted d-block">Meta Template ID</small>
                        <code className="small">{template.metaTemplateId}</code>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() => handleViewDetails(template)}
                        >
                          <i className="ti ti-eye me-1"></i>
                          View Details
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => navigate(`/communication/whatsapp/templates/send/${template.id}`)}
                          disabled={template.status?.toLowerCase() !== "approved"}
                        >
                          <i className="ti ti-send"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Details Modal */}
      {showDetailsModal && selectedTemplate && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Template Details: {selectedTemplate.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Status:</strong>
                    <span className={`badge ${getStatusBadge(selectedTemplate.status)} ms-2`}>
                      {selectedTemplate.status}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>Category:</strong>
                    <span className={`badge ${getCategoryBadge(selectedTemplate.category)} ms-2`}>
                      {selectedTemplate.category}
                    </span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Language:</strong> {selectedTemplate.languageCode}
                  </div>
                  <div className="col-md-6">
                    <strong>Meta Template ID:</strong>
                    <code className="ms-2">{selectedTemplate.metaTemplateId}</code>
                  </div>
                </div>

                <hr />

                <h6>Template Content</h6>
                <div className="p-3 rounded" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  {selectedTemplate.components && (
                    <div>
                      {selectedTemplate.components.header && (
                        <div className="mb-3">
                          <strong>Header:</strong>
                          <div className="mt-1">
                            {selectedTemplate.components.header.text ||
                             selectedTemplate.components.header.format ||
                             "Header content"}
                          </div>
                        </div>
                      )}

                      {selectedTemplate.components.body && (
                        <div className="mb-3">
                          <strong>Body:</strong>
                          <div className="mt-1" style={{ whiteSpace: "pre-wrap" }}>
                            {selectedTemplate.components.body.text}
                          </div>
                        </div>
                      )}

                      {selectedTemplate.components.footer && (
                        <div className="mb-3">
                          <strong>Footer:</strong>
                          <div className="mt-1 text-muted small">
                            {selectedTemplate.components.footer.text}
                          </div>
                        </div>
                      )}

                      {selectedTemplate.components.buttons && selectedTemplate.components.buttons.length > 0 && (
                        <div>
                          <strong>Buttons:</strong>
                          <div className="mt-1">
                            {selectedTemplate.components.buttons.map((btn, idx) => (
                              <div key={idx} className="badge bg-primary me-2 mb-1">
                                {btn.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedTemplate.variablesInfo && selectedTemplate.variablesInfo.length > 0 && (
                  <div className="mt-3">
                    <h6>Required Variables</h6>
                    <ul>
                      {selectedTemplate.variablesInfo.map((variable, idx) => (
                        <li key={idx}><code>{variable}</code></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
                {selectedTemplate.status?.toLowerCase() === "approved" && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      setShowDetailsModal(false);
                      navigate(`/communication/whatsapp/templates/send/${selectedTemplate.id}`);
                    }}
                  >
                    <i className="ti ti-send me-2"></i>
                    Send This Template
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
