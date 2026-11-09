import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/apiClient';
import DashboardLayout from '../../../../layout/DashboardLayout';

const SwitchOrganization = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/IAmAPI/api/Organizations');
      setOrganizations(response.data);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async () => {
    if (!selectedOrgId) {
      alert('Please select an organization');
      return;
    }

    try {
      setSwitching(true);
      const response = await apiClient.post('/IAmAPI/api/auth/dev/switch-organization', {
        organization_id: parseInt(selectedOrgId)
      });
      
      alert('Organization switched successfully! Please logout and login again for the changes to take effect.');
      // Navigate back to organizations list or dashboard
      navigate('/developer-console/organizations');
    } catch (err) {
      console.error('Error switching organization:', err);
      alert('Failed to switch organization. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  const handleCancel = () => {
    navigate('/developer-console/organizations');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container-fluid mt-4">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading organizations...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container-fluid mt-4">
          <div className="alert alert-danger">
            <h5 className="alert-heading">Error</h5>
            <p>{error}</p>
            <button className="btn btn-danger" onClick={fetchOrganizations}>
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Switch Organization</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="organizationSelect" className="form-label">
                    Select Organization
                  </label>
                  <select
                    id="organizationSelect"
                    className="form-select"
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                  >
                    <option value="">Choose an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.legal_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleSwitch}
                    disabled={switching || !selectedOrgId}
                  >
                    {switching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Switching...
                      </>
                    ) : (
                      'Switch Organization'
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={switching}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SwitchOrganization;