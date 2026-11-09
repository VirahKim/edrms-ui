import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import DashboardLayout from "../../../layout/DashboardLayout";

export default function CreateNotificationTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    channel_id: "",
    template_code: "",
    name: "",
    language_code: "en",
    subject: "",
    body: "",
    provider_template_code: "",
    variables: []
  });

  const [newVariable, setNewVariable] = useState({
    variable_name: "",
    variable_order: 1,
    is_required: true
  });

  const fetchChannels = useCallback(async () => {
    try {
      const response = await apiClient.get("/CommunicationAPI/api/channels", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setChannels(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load channels:", err);
    }
  }, []);

  const fetchTemplate = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/CommunicationAPI/api/templates`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const template = response.data?.data?.find(t => t.id === parseInt(id));
      if (template) {
        setFormData({
          channel_id: template.channel_id,
          template_code: template.template_code,
          name: template.name,
          language_code: template.language_code,
          subject: template.subject || "",
          body: template.body,
          provider_template_code: template.provider_template_code || "",
          variables: JSON.parse(template.variables_json || "[]")
        });
      }
    } catch (err) {
      setError("Failed to load template");
      console.error("Error loading template:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChannels();
    if (isEdit) {
      fetchTemplate();
    }
  }, [fetchChannels, fetchTemplate, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVariable = () => {
    if (!newVariable.variable_name.trim()) {
      setError("Variable name is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const exists = formData.variables.some(v => v.variable_name === newVariable.variable_name);
    if (exists) {
      setError("Variable already exists");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { ...newVariable }]
    }));

    setNewVariable({
      variable_name: "",
      variable_order: formData.variables.length + 2,
      is_required: true
    });
  };

  const handleRemoveVariable = (index) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const handleVariableChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  const insertVariablePlaceholder = (variableName) => {
    const placeholder = `{{${variableName}}}`;
    setFormData(prev => ({
      ...prev,
      body: prev.body + placeholder
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.channel_id) {
      setError("Channel is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.template_code.trim()) {
      setError("Template code is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.name.trim()) {
      setError("Template name is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.body.trim()) {
      setError("Template body is required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        channel_id: parseInt(formData.channel_id),
        template_code: formData.template_code,
        name: formData.name,
        language_code: formData.language_code,
        subject: formData.subject,
        body: formData.body,
        provider_template_code: formData.provider_template_code,
        variables: formData.variables
      };

      if (isEdit) {
        await apiClient.put(
          `/CommunicationAPI/api/templates/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setSuccess("Template updated successfully");
      } else {
        await apiClient.post(
          "/CommunicationAPI/api/templates",
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setSuccess("Template created successfully");
      }

      setTimeout(() => {
        navigate('/communication/notifications/templates');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} template`);
    } finally {
      setSaving(false);
    }
  };

  const getChannelName = (channelId) => {
    const channel = channels.find(c => c.id === parseInt(channelId));
    return channel?.code || "";
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
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
          <h5 className="mb-0">
            {isEdit ? 'Edit' : 'Create'} Notification Template
          </h5>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Channel <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  name="channel_id"
                  value={formData.channel_id}
                  onChange={handleInputChange}
                  required
                  disabled={isEdit}
                >
                  <option value="">Select Channel</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
                <small className="text-muted">Cannot be changed after creation</small>
              </div>

              <div className="col-md-6">
                <label className="form-label">Template Code <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="template_code"
                  value={formData.template_code}
                  onChange={handleInputChange}
                  placeholder="e.g., PAYSLIP_READY"
                  required
                  disabled={isEdit}
                />
                <small className="text-muted">Unique identifier (cannot be changed after creation)</small>
              </div>

              <div className="col-md-8">
                <label className="form-label">Template Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Payslip Ready Notification"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Language Code <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="language_code"
                  value={formData.language_code}
                  onChange={handleInputChange}
                  placeholder="e.g., en, es, fr"
                  required
                  disabled={isEdit}
                />
                <small className="text-muted">ISO language code</small>
              </div>

              {getChannelName(formData.channel_id) === 'EMAIL' && (
                <div className="col-12">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Your Payslip is Ready"
                  />
                </div>
              )}

              <div className="col-12">
                <label className="form-label">Message Body <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Hello {{employee_name}}, your payslip for {{month}} {{year}} is ready."
                  required
                ></textarea>
                <small className="text-muted">
                  Use {`{{variable_name}}`} for dynamic content
                  {getChannelName(formData.channel_id) === 'WHATSAPP' && 
                    ' (For WhatsApp, use {{1}}, {{2}}, etc. in order)'
                  }
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">Provider Template Code</label>
                <input
                  type="text"
                  className="form-control"
                  name="provider_template_code"
                  value={formData.provider_template_code}
                  onChange={handleInputChange}
                  placeholder="e.g., payslip_notification_v1"
                />
                <small className="text-muted">Provider-specific template ID (optional)</small>
              </div>
            </div>

            {/* Variables Section */}
            <div className="mt-4">
              <h6>Template Variables</h6>
              <p className="text-muted small">
                Define variables that will be replaced with actual values when sending notifications
              </p>

              {formData.variables.length > 0 && (
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>Variable Name</th>
                        <th style={{width: "120px"}}>Order</th>
                        <th style={{width: "100px"}}>Required</th>
                        <th style={{width: "100px"}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variables.map((variable, index) => (
                        <tr key={index}>
                          <td>
                            <code>{`{{${variable.variable_name}}}`}</code>
                            <button
                              type="button"
                              className="btn btn-link btn-sm ms-2 p-0"
                              onClick={() => insertVariablePlaceholder(variable.variable_name)}
                              title="Insert into body"
                            >
                              <i className="ti ti-copy"></i>
                            </button>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={variable.variable_order}
                              onChange={(e) => handleVariableChange(index, 'variable_order', parseInt(e.target.value))}
                              min="1"
                            />
                          </td>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={variable.is_required}
                                onChange={(e) => handleVariableChange(index, 'is_required', e.target.checked)}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveVariable(index)}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Variable Form */}
              <div className="card bg-light">
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-md-5">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Variable name (e.g., employee_name)"
                        value={newVariable.variable_name}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, variable_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Order"
                        value={newVariable.variable_order}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, variable_order: parseInt(e.target.value) }))}
                        min="1"
                      />
                    </div>
                    <div className="col-md-3">
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={newVariable.is_required}
                          onChange={(e) => setNewVariable(prev => ({ ...prev, is_required: e.target.checked }))}
                        />
                        <label className="form-check-label">Required</label>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <button
                        type="button"
                        className="btn btn-success w-100"
                        onClick={handleAddVariable}
                      >
                        <i className="ti ti-plus me-1"></i>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-4 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-device-floppy me-1"></i>
                    {isEdit ? 'Update' : 'Create'} Template
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/communication/notifications/templates')}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
