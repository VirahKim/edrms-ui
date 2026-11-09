import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import DashboardLayout from "../../../layout/DashboardLayout";

export default function AddNotificationSender() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState({});

  const [formData, setFormData] = useState({
    channel_id: "",
    sender_name: "",
    sender_address: "",
    provider: "",
    is_active: true
  });

  const [configData, setConfigData] = useState({});

  // Mapping between backend provider values and frontend display values
  const PROVIDER_BACKEND_TO_FRONTEND = {
    'GMAILSMTP': 'Gmail SMTP',
    'GMAIL': 'Gmail SMTP',
    'SMTP': 'SMTP',
    'SendGrid': 'SendGrid',
    'AWSSES': 'AWS SES',
    'AWS SES': 'AWS SES',
    'Mailgun': 'Mailgun',
    'Twilio': 'Twilio',
    'AFRICASTALKING': 'Africa\'s Talking',
    'Africa\'s Talking': 'Africa\'s Talking',
    'Nexmo': 'Nexmo',
    'AWSSNS': 'AWS SNS',
    'AWS SNS': 'AWS SNS',
    'Meta': 'Meta',
    'META': 'Meta',
    'MessageBird': 'MessageBird',
    'MESSAGEBIRD': 'MessageBird'
  };

  const PROVIDER_FRONTEND_TO_BACKEND = {
    'Gmail SMTP': 'GMAILSMTP',
    'SMTP': 'SMTP',
    'SendGrid': 'SendGrid',
    'AWS SES': 'AWSSES',
    'Mailgun': 'Mailgun',
    'Twilio': 'Twilio',
    'Africa\'s Talking': 'AFRICASTALKING',
    'Nexmo': 'Nexmo',
    'AWS SNS': 'AWSSNS',
    'Meta': 'META',
    'MessageBird': 'MESSAGEBIRD'
  };

  // Provider options based on channel type
  const providerOptions = {
    EMAIL: ['SendGrid', 'AWS SES', 'Mailgun', 'SMTP', 'Gmail SMTP'],
    SMS: ['Twilio', 'Africa\'s Talking', 'Nexmo', 'AWS SNS'],
    WHATSAPP: ['Meta', 'Twilio', 'MessageBird']
  };

  // Provider configuration templates
  const PROVIDER_CONFIG_TEMPLATES = {
    'Gmail SMTP': [
      { key: 'SmtpHost', label: 'SMTP Host', defaultValue: 'smtp.gmail.com', type: 'text', required: true },
      { key: 'SmtpPort', label: 'SMTP Port', defaultValue: '587', type: 'number', required: true },
      { key: 'SmtpUsername', label: 'Username (Email)', defaultValue: '', type: 'email', required: true },
      { key: 'SmtpPassword', label: 'App Password', defaultValue: '', type: 'password', required: true },
      { key: 'SmtpUseSsl', label: 'Use SSL/TLS', defaultValue: 'true', type: 'boolean', required: true }
    ],
    'SMTP': [
      { key: 'SmtpHost', label: 'SMTP Host', defaultValue: '', type: 'text', required: true },
      { key: 'SmtpPort', label: 'SMTP Port', defaultValue: '587', type: 'number', required: true },
      { key: 'SmtpUsername', label: 'Username', defaultValue: '', type: 'text', required: true },
      { key: 'SmtpPassword', label: 'Password', defaultValue: '', type: 'password', required: true },
      { key: 'SmtpUseSsl', label: 'Use SSL/TLS', defaultValue: 'true', type: 'boolean', required: true }
    ],
    'SendGrid': [
      { key: 'ApiKey', label: 'API Key', defaultValue: '', type: 'password', required: true },
      { key: 'FromEmail', label: 'From Email', defaultValue: '', type: 'email', required: true },
      { key: 'FromName', label: 'From Name', defaultValue: '', type: 'text', required: false }
    ],
    'AWS SES': [
      { key: 'AccessKeyId', label: 'AWS Access Key ID', defaultValue: '', type: 'text', required: true },
      { key: 'SecretAccessKey', label: 'AWS Secret Access Key', defaultValue: '', type: 'password', required: true },
      { key: 'Region', label: 'AWS Region', defaultValue: 'us-east-1', type: 'text', required: true }
    ],
    'Mailgun': [
      { key: 'ApiKey', label: 'API Key', defaultValue: '', type: 'password', required: true },
      { key: 'Domain', label: 'Domain', defaultValue: '', type: 'text', required: true }
    ],
    'Twilio': [
      { key: 'AccountSid', label: 'Account SID', defaultValue: '', type: 'text', required: true },
      { key: 'AuthToken', label: 'Auth Token', defaultValue: '', type: 'password', required: true },
      { key: 'PhoneNumber', label: 'Twilio Phone Number', defaultValue: '', type: 'text', required: false }
    ],
    'Africa\'s Talking': [
      { key: 'ApiKey', label: 'API Key', defaultValue: '', type: 'password', required: true },
      { key: 'Username', label: 'Username', defaultValue: '', type: 'text', required: true },
      { key: 'ShortCode', label: 'Short Code', defaultValue: '', type: 'text', required: false }
    ],
    'Meta': [
      { key: 'ApiKey', label: 'API Key', defaultValue: '', type: 'password', required: true },
      { key: 'PhoneNumberId', label: 'Phone Number ID', defaultValue: '', type: 'text', required: true },
      { key: 'BusinessAccountId', label: 'Business Account ID', defaultValue: '', type: 'text', required: true },
      { key: 'WebhookVerifyToken', label: 'Webhook Verify Token', defaultValue: '', type: 'password', required: false }
    ],
    'MessageBird': [
      { key: 'ApiKey', label: 'API Key', defaultValue: '', type: 'password', required: true },
      { key: 'Originator', label: 'Originator', defaultValue: '', type: 'text', required: false }
    ]
  };

  useEffect(() => {
    fetchChannels();
    if (isEdit) {
      fetchSender();
    }
  }, [id]);

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

  const fetchSender = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/CommunicationAPI/api/senders/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const sender = response.data?.data;
      if (sender) {
        // Normalize provider value from backend to frontend format
        const normalizedProvider = PROVIDER_BACKEND_TO_FRONTEND[sender.provider] || sender.provider;
        
        setFormData({
          channel_id: sender.channel_id,
          sender_name: sender.sender_name,
          sender_address: sender.sender_address,
          provider: normalizedProvider,
          is_active: sender.is_active
        });

        // Fetch existing configurations
        fetchConfigs(parseInt(id));
      }
    } catch (err) {
      setError("Failed to load sender");
      console.error("Error loading sender:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async (senderId) => {
    try {
      const response = await apiClient.get(
        `/CommunicationAPI/api/senders/${senderId}/configs`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const existingConfigs = response.data?.data || [];
      const configObj = {};
      existingConfigs.forEach(config => {
        configObj[config.config_key] = config.config_value;
      });
      setConfigData(configObj);
    } catch (err) {
      console.error("Failed to load configs:", err);
      // Don't set error state here, configs might not exist yet
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset config data when provider changes
    if (name === 'provider') {
      const template = PROVIDER_CONFIG_TEMPLATES[value] || [];
      const newConfigData = {};
      template.forEach(field => {
        newConfigData[field.key] = configData[field.key] || field.defaultValue;
      });
      setConfigData(newConfigData);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfigData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getChannelCode = (channelId) => {
    const channel = channels.find(c => c.id === parseInt(channelId));
    return channel?.code || "";
  };

  const getAvailableProviders = () => {
    const channelCode = getChannelCode(formData.channel_id);
    return providerOptions[channelCode] || [];
  };

  const getCurrentProviderTemplate = () => {
    return PROVIDER_CONFIG_TEMPLATES[formData.provider] || [];
  };

  const getAddressPlaceholder = () => {
    const channelCode = getChannelCode(formData.channel_id);
    const placeholders = {
      EMAIL: 'e.g., noreply@company.com',
      SMS: 'e.g., +1234567890',
      WHATSAPP: 'e.g., +1234567890'
    };
    return placeholders[channelCode] || 'Enter sender address';
  };

  const getAddressLabel = () => {
    const channelCode = getChannelCode(formData.channel_id);
    const labels = {
      EMAIL: 'Email Address',
      SMS: 'Phone Number',
      WHATSAPP: 'WhatsApp Number'
    };
    return labels[channelCode] || 'Sender Address';
  };

  const validateForm = () => {
    if (!formData.channel_id) {
      setError("Channel is required");
      return false;
    }

    if (!formData.sender_name.trim()) {
      setError("Sender name is required");
      return false;
    }

    if (!formData.sender_address.trim()) {
      setError("Sender address is required");
      return false;
    }

    if (!formData.provider) {
      setError("Provider is required");
      return false;
    }

    const channelCode = getChannelCode(formData.channel_id);

    // Validate email format
    if (channelCode === 'EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.sender_address)) {
        setError("Invalid email address");
        return false;
      }
    }

    // Validate phone number format (simple check)
    if (channelCode === 'SMS' || channelCode === 'WHATSAPP') {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.sender_address.replace(/\s/g, ''))) {
        setError("Invalid phone number format. Use international format (e.g., +1234567890)");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSaving(true);
    setError("");

    try {
      // Convert provider from frontend format to backend format
      const backendProvider = PROVIDER_FRONTEND_TO_BACKEND[formData.provider] || formData.provider;

      const payload = {
        channel_id: parseInt(formData.channel_id),
        sender_name: formData.sender_name,
        sender_address: formData.sender_address,
        provider: backendProvider,
        is_active: formData.is_active
      };

      let senderId = id;

      if (isEdit) {
        await apiClient.put(
          `/CommunicationAPI/api/senders/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setSuccess('Sender updated successfully');
        setTimeout(() => navigate('/communication/notifications/senders'), 1200);
      } else {
        const response = await apiClient.post(
          "/CommunicationAPI/api/senders",
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        senderId = response.data?.id || response.data?.data?.id;
        setSuccess('Sender created successfully');
        // Redirect to dedicated configs page so user can add provider credentials
        setTimeout(() => navigate(`/communication/notifications/senders/${senderId}/configs`), 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} sender`);
    } finally {
      setSaving(false);
    }
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
            {isEdit ? 'Edit' : 'Add'} Notification Sender
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
                {isEdit && (
                  <small className="text-muted">Channel cannot be changed after creation</small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Provider <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.channel_id}
                >
                  <option value="">Select Provider</option>
                  {getAvailableProviders().map(provider => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
                {!formData.channel_id && (
                  <small className="text-muted">Select a channel first</small>
                )}
              </div>

              <div className="col-12">
                <label className="form-label">Sender Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="sender_name"
                  value={formData.sender_name}
                  onChange={handleInputChange}
                  placeholder="e.g., HRMS System, Company Notifications"
                  required
                />
                <small className="text-muted">Friendly name for this sender configuration</small>
              </div>

              <div className="col-12">
                <label className="form-label">
                  {getAddressLabel()} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="sender_address"
                  value={formData.sender_address}
                  onChange={handleInputChange}
                  placeholder={getAddressPlaceholder()}
                  required
                  disabled={!formData.channel_id || isEdit}
                />
                {isEdit && (
                  <small className="text-muted">Sender address cannot be changed after creation</small>
                )}
                {!isEdit && formData.channel_id && (
                  <small className="text-muted">
                    {getChannelCode(formData.channel_id) === 'EMAIL' && "Must be a verified email address with your provider"}
                    {getChannelCode(formData.channel_id) === 'SMS' && "Use international format (e.g., +254712345678)"}
                    {getChannelCode(formData.channel_id) === 'WHATSAPP' && "Use international format (e.g., +254712345678)"}
                  </small>
                )}
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label">
                    Active
                  </label>
                </div>
                <small className="text-muted">Only active senders can be used to send notifications</small>
              </div>
            </div>

            {/* Provider Configuration Section - moved to dedicated page */}
            {isEdit ? (
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2">
                  <button type="button" className="btn btn-outline-primary" onClick={() => navigate(`/communication/notifications/senders/${id}/configs`)}>
                    Manage Configurations
                  </button>
                  <small className="text-muted">Manage provider credentials on the dedicated configurations page.</small>
                </div>
              </div>
            ) : (
              formData.provider && (
                <div className="mt-3">
                  <div className="alert alert-info">After creating the sender you'll be redirected to the configurations page to add provider credentials.</div>
                </div>
              )
            )}

            {/* Information Box */}
            <div className="alert alert-info mt-4">
              <h6 className="alert-heading">
                <i className="ti ti-info-circle me-2"></i>
                Important Information
              </h6>
              <ul className="mb-0 small">
                <li>Ensure the sender address is verified with your selected provider</li>
                <li>All provider credentials must be configured for the sender to work properly</li>
                <li>Multiple senders can be configured for the same channel</li>
                <li>Only one sender per organization can use the same address for a channel</li>
                <li>Inactive senders cannot be used for sending notifications</li>
                <li>Configuration changes will take effect immediately</li>
              </ul>
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
                    {isEdit ? 'Update' : 'Add'} Sender
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/communication/notifications/senders')}
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
