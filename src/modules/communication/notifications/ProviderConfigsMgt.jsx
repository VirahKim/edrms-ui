import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import DashboardLayout from '../../../layout/DashboardLayout';

export default function ProviderConfigsMgt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [provider, setProvider] = useState('');
  const [configs, setConfigs] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [secretKeys, setSecretKeys] = useState({});

  useEffect(() => {
    if (id) fetchSenderAndConfigs();
  }, [id]);

  const fetchSenderAndConfigs = async () => {
    setLoading(true);
    try {
      const senderResp = await apiClient.get(`/CommunicationAPI/api/senders/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const sender = senderResp.data?.data;
      setProvider(sender?.provider || '');

      const resp = await apiClient.get(`/CommunicationAPI/api/senders/${id}/configs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConfigs(resp.data?.data || []);
    } catch (err) {
      console.error('Failed to load configs or sender:', err);
      setError('Failed to load sender or configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setConfigs(prev => {
      const found = prev.find(c => c.config_key === key);
      if (found) {
        return prev.map(c => c.config_key === key ? { ...c, config_value: value } : c);
      }
      return [...prev, { sender_id: parseInt(id), config_key: key, config_value: value }];
    });
  };

  const markSecretKey = (key, isSecret) => {
    setSecretKeys(prev => ({ ...prev, [key]: Boolean(isSecret) }));
  };

  const isSecretKey = (key) => {
    if (!key) return false;
    const k = key.toLowerCase();
    return k.includes('key') || k.includes('secret') || k.includes('token') || k.includes('password') || k.includes('auth');
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { configs: configs.map(c => ({ config_key: c.config_key, config_value: c.config_value })) };
      await apiClient.put(`/CommunicationAPI/api/senders/${id}/configs`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Configurations saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save configs:', err);
      setError(err.response?.data?.message || 'Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (configKey) => {
    if (!confirm(`Delete config '${configKey}'?`)) return;
    try {
      await apiClient.delete(`/CommunicationAPI/api/senders/${id}/configs/${configKey}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConfigs(prev => prev.filter(c => c.config_key !== configKey));
      setSuccess('Config deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to delete config:', err);
      setError(err.response?.data?.message || 'Failed to delete config');
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Provider Configurations for Sender #{id}</h5>
        </div>
        <div className="card-body">
          <p className="small text-muted">Provider: <strong>{provider}</strong></p>

          <div className="row g-3">
            {configs.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">No configurations found. Add keys and values below then click Save.</div>
              </div>
            )}

            {configs.map(cfg => {
              const key = cfg.config_key;
              const secret = secretKeys[key] || isSecretKey(key);
              return (
                <div key={key} className="col-md-6">
                  <label className="form-label">{key}</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      type={secret && !showPasswords[key] ? 'password' : 'text'}
                      value={cfg.config_value || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    {secret && (
                      <button type="button" className="btn btn-outline-secondary" onClick={() => togglePasswordVisibility(key)}>
                        <i className={`ti ti-${showPasswords[key] ? 'eye-off' : 'eye'}`}></i>
                      </button>
                    )}
                    <button type="button" className="btn btn-outline-danger" onClick={() => handleDelete(key)}>Delete</button>
                  </div>
                </div>
              );
            })}

            {/* Quick add new config row */}
            <AddConfigRow onAdd={(k, v, s) => { handleChange(k, v); if (s) markSecretKey(k, true); }} />
          </div>

          <div className="mt-4 d-flex gap-2">
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? (<><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>) : 'Save Configurations'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/communication/notifications/senders')}>Back to Senders</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AddConfigRow({ onAdd }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [secret, setSecret] = useState(false);

  const add = () => {
    if (!key.trim()) return;
    onAdd(key.trim(), value, secret);
    setKey(''); setValue(''); setSecret(false);
  };

  return (
    <div className="col-12 mt-3">
      <div className="input-group">
        <input className="form-control" placeholder="Config key" value={key} onChange={(e) => setKey(e.target.value)} />
        <input className="form-control" placeholder="Config value" value={value} onChange={(e) => setValue(e.target.value)} />
        <div className="input-group-text d-flex align-items-center">
          <input className="form-check-input me-2" type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
          <small className="text-muted">Secret</small>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={add}>Add</button>
      </div>
    </div>
  );
}
