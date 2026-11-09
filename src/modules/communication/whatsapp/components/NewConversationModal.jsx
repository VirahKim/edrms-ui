import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import whatsappApi from "../../../../api/whatsappApi";

/**
 * NewConversationModal - Modal for starting a new WhatsApp conversation
 * Allows sending text messages or templates to new contacts
 */
export default function NewConversationModal({ show, onClose, phoneNumberId, onConversationCreated }) {
  const [activeTab, setActiveTab] = useState("text"); // 'text' or 'template'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageText, setMessageText] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (show && activeTab === "template") {
      loadTemplates();
    }
  }, [show, activeTab]);

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize template parameters by parsing Components
      const params = {};
      
      selectedTemplate.components?.forEach((component) => {
        const componentType = component.Type || component.type;
        const componentText = component.Text || component.text;
        
        if (componentText) {
          // Extract variables like {{1}}, {{2}}, etc.
          const matches = componentText.match(/\{\{(\d+)\}\}/g);
          if (matches) {
            matches.forEach((match) => {
              const paramNumber = match.replace(/[{}]/g, '');
              const key = `${componentType.toLowerCase()}_${paramNumber}`;
              if (!params[key]) {
                params[key] = "";
              }
            });
          }
        }
      });
      
      setTemplateParams(params);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await whatsappApi.getTemplates({
        status: "APPROVED"
      });
      const data = response.data || [];
      
      // Normalize template data from API (PascalCase to camelCase)
      const normalized = data.map(t => ({
        id: t.Id || t.id,
        name: t.Name || t.name,
        languageCode: t.LanguageCode || t.languageCode,
        category: t.Category || t.category,
        status: t.Status || t.status,
        components: t.Components || t.components || [],
        metaTemplateId: t.MetaTemplateId || t.metaTemplateId
      }));
      
      setTemplates(normalized);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Should be between 10-15 digits
    if (cleaned.length < 10 || cleaned.length > 15) {
      return { valid: false, message: "Phone number must be 10-15 digits" };
    }
    
    return { valid: true, cleaned };
  };

  const handleSendText = async () => {
    setError("");

    // Validate inputs
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!messageText.trim()) {
      setError("Please enter a message");
      return;
    }

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setSending(true);

    try {
      const payload = {
        contactWaId: validation.cleaned,
        messageText: messageText.trim(),
        phoneNumberId: phoneNumberId
      };

      await whatsappApi.sendMessage(payload);

      // Success - notify parent and close modal
      if (onConversationCreated) {
        onConversationCreated();
      }
      
      handleClose();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async () => {
    setError("");

    // Validate inputs
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!selectedTemplate) {
      setError("Please select a template");
      return;
    }

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    // Validate template parameters
    const requiredParams = Object.keys(templateParams);
    for (const key of requiredParams) {
      if (!templateParams[key].trim()) {
        setError("Please fill in all template parameters");
        return;
      }
    }

    setSending(true);

    try {
      const payload = {
        contactWaId: validation.cleaned,
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.languageCode,
        phoneNumberId: phoneNumberId
      };

      // Add parameters if any
      const headerParams = Object.keys(templateParams)
        .filter(key => key.startsWith("header_"))
        .map(key => templateParams[key]);
      
      const bodyParams = Object.keys(templateParams)
        .filter(key => key.startsWith("body_"))
        .map(key => templateParams[key]);

      if (headerParams.length > 0) {
        payload.headerParameters = headerParams;
      }

      if (bodyParams.length > 0) {
        payload.bodyParameters = bodyParams;
      }

      await whatsappApi.sendTemplateMessage(payload);

      // Success - notify parent and close modal
      if (onConversationCreated) {
        onConversationCreated();
      }
      
      handleClose();
    } catch (err) {
      console.error("Failed to send template:", err);
      setError(err.response?.data?.message || "Failed to send template");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setPhoneNumber("");
    setMessageText("");
    setSelectedTemplate(null);
    setTemplateParams({});
    setError("");
    setActiveTab("text");
    onClose();
  };

  const handleTemplateParamChange = (key, value) => {
    setTemplateParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-message-plus me-2"></i>
              Start New Conversation
            </h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          <div className="modal-body">
            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError("")}></button>
              </div>
            )}

            {/* Phone Number Input */}
            <div className="mb-3">
              <label className="form-label">
                WhatsApp Phone Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., 254710822622 or +254710822622"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={sending}
              />
              <small className="text-muted">
                Enter phone number with country code (without + or spaces)
              </small>
            </div>

            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-3" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "text" ? "active" : ""}`}
                  onClick={() => setActiveTab("text")}
                  type="button"
                  disabled={sending}
                >
                  <i className="ti ti-message me-1"></i>
                  Text Message
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === "template" ? "active" : ""}`}
                  onClick={() => setActiveTab("template")}
                  type="button"
                  disabled={sending}
                >
                  <i className="ti ti-template me-1"></i>
                  Template Message
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Text Message Tab */}
              {activeTab === "text" && (
                <div className="tab-pane fade show active">
                  <div className="mb-3">
                    <label className="form-label">
                      Message <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="5"
                      placeholder="Type your message here..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sending}
                    ></textarea>
                    <small className="text-muted">
                      {messageText.length} characters
                    </small>
                  </div>
                </div>
              )}

              {/* Template Message Tab */}
              {activeTab === "template" && (
                <div className="tab-pane fade show active">
                  {loadingTemplates ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="ti ti-info-circle me-2"></i>
                      No approved templates available. Please create and approve templates first.
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">
                          Select Template <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedTemplate?.id || ""}
                          onChange={(e) => {
                            const template = templates.find(
                              t => t.id === parseInt(e.target.value)
                            );
                            setSelectedTemplate(template);
                          }}
                          disabled={sending}
                        >
                          <option value="">Choose a template...</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} 
                              {template.category && ` (${template.category})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Template Preview */}
                      {selectedTemplate && (() => {
                        const components = selectedTemplate.components || [];
                        const headerComp = components.find(c => (c.Type || c.type) === "HEADER");
                        const bodyComp = components.find(c => (c.Type || c.type) === "BODY");
                        const footerComp = components.find(c => (c.Type || c.type) === "FOOTER");
                        
                        return (
                          <div className="card mb-3">
                            <div className="card-header">
                              <h6 className="mb-0">Template Preview</h6>
                            </div>
                            <div className="card-body">
                              {headerComp && (
                                <div className="mb-2">
                                  <strong>Header:</strong>
                                  <p className="mb-0 mt-1 fw-bold">{headerComp.Text || headerComp.text}</p>
                                </div>
                              )}
                              {bodyComp && (
                                <div className="mb-2">
                                  <strong>Body:</strong>
                                  <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>{bodyComp.Text || bodyComp.text}</p>
                                </div>
                              )}
                              {footerComp && (
                                <div className="mb-2">
                                  <strong>Footer:</strong>
                                  <p className="mb-0 mt-1 text-muted small">
                                    {footerComp.Text || footerComp.text}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Template Parameters */}
                      {selectedTemplate && Object.keys(templateParams).length > 0 && (
                        <div className="card">
                          <div className="card-header">
                            <h6 className="mb-0">Template Parameters</h6>
                          </div>
                          <div className="card-body">
                            {Object.keys(templateParams).map((key) => (
                              <div key={key} className="mb-3">
                                <label className="form-label">
                                  {key.replace("_", " ").toUpperCase()} <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={templateParams[key]}
                                  onChange={(e) => handleTemplateParamChange(key, e.target.value)}
                                  placeholder={`Enter ${key.replace("_", " ")}`}
                                  disabled={sending}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={activeTab === "text" ? handleSendText : handleSendTemplate}
              disabled={sending}
            >
              {sending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Sending...
                </>
              ) : (
                <>
                  <i className="ti ti-send me-1"></i>
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

NewConversationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  phoneNumberId: PropTypes.number.isRequired,
  onConversationCreated: PropTypes.func
};

NewConversationModal.defaultProps = {
  onConversationCreated: null
};
