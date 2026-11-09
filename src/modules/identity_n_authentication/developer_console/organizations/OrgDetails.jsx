import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/apiClient';
import DashboardLayout from '../../../../layout/DashboardLayout';

const OrgDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchOrganizationDetails();
    }
  }, [id]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/IAmAPI/api/Organizations/${id}`);
      setOrganization(response.data);
    } catch (err) {
      console.error('Error fetching organization details:', err);
      setError('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/developer-console/organizations');
  };

  const handleEdit = () => {
    navigate(`/developer-console/organizations/${id}/edit`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <p className="mt-3 text-muted">Loading organization details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !organization) {
    return (
      <DashboardLayout>
        <div className="container-fluid mt-4">
          <div className="alert alert-danger">
            <h5 className="alert-heading">Error</h5>
            <p>{error || 'Organization not found'}</p>
            <button className="btn btn-danger" onClick={handleBack}>
              Back to Organizations
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Organization Details</h5>
              <div className="btn-group">
                <button className="btn btn-outline-secondary" onClick={handleBack}>
                  <i className="ti ti-arrow-left me-2"></i>
                  Back
                </button>
                <button className="btn btn-warning" onClick={handleEdit}>
                  <i className="ti ti-edit me-2"></i>
                  Edit
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Status Badges */}
              <div className="mb-4">
                <span className={`badge ${organization.is_active ? 'bg-success' : 'bg-danger'} me-2`}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </span>
                {organization.is_trial && (
                  <span className="badge bg-warning text-dark">Trial Account</span>
                )}
              </div>

              {/* Basic Information */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2 mb-3">Basic Information</h6>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Organization ID</label>
                  <p className="fw-bold">{organization.id}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Organization Type</label>
                  <p className="fw-bold">{organization.organization_type || 'N/A'}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Organization Name</label>
                  <p className="fw-bold">{organization.name}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Legal Name</label>
                  <p className="fw-bold">{organization.legal_name}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Registration Number</label>
                  <p className="fw-bold">{organization.registration_number || 'N/A'}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Domain</label>
                  <p className="fw-bold">{organization.domain || 'N/A'}</p>
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label text-muted small">Website</label>
                  <p className="fw-bold">
                    {organization.website ? (
                      <a href={organization.website} target="_blank" rel="noopener noreferrer">
                        {organization.website} <i className="ti ti-external-link"></i>
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2 mb-3">Contact Information</h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Contact Person</label>
                  <p className="fw-bold">{organization.contact_person}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Contact Email</label>
                  <p className="fw-bold">
                    <a href={`mailto:${organization.contact_email}`}>{organization.contact_email}</a>
                  </p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Contact Phone</label>
                  <p className="fw-bold">{organization.contact_phone || 'N/A'}</p>
                </div>
              </div>

              {/* Address Information */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2 mb-3">Address Information</h6>
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label text-muted small">Address Line 1</label>
                  <p className="fw-bold">{organization.address_line1 || 'N/A'}</p>
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label text-muted small">Address Line 2</label>
                  <p className="fw-bold">{organization.address_line2 || 'N/A'}</p>
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">City</label>
                  <p className="fw-bold">{organization.city || 'N/A'}</p>
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">State/Province</label>
                  <p className="fw-bold">{organization.state || 'N/A'}</p>
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">Country</label>
                  <p className="fw-bold">{organization.country || 'N/A'}</p>
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">Postal Code</label>
                  <p className="fw-bold">{organization.postal_code || 'N/A'}</p>
                </div>
              </div>

              {/* Subscription Information */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2 mb-3">Subscription Information</h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Subscription Plan</label>
                  <p className="fw-bold">{organization.subscription_plan || 'N/A'}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Billing Frequency</label>
                  <p className="fw-bold">{organization.billing_frequency || 'N/A'}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Subscription Start Date</label>
                  <p className="fw-bold">{formatDate(organization.subscription_start_date)}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Subscription End Date</label>
                  <p className="fw-bold">{formatDate(organization.subscription_end_date)}</p>
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label text-muted small">Modules Subscribed</label>
                  <p className="fw-bold">{organization.modules_subscribed || 'N/A'}</p>
                </div>
              </div>

              {/* Trial Information */}
              {organization.is_trial && (
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Trial Information</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Trial End Date</label>
                    <p className="fw-bold">{formatDate(organization.trial_end_date)}</p>
                  </div>
                </div>
              )}

              {/* System Information */}
              <div className="row mb-4">
                <div className="col-12">
                  <h6 className="border-bottom pb-2 mb-3">System Information</h6>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Created At</label>
                  <p className="fw-bold">{formatDate(organization.created_at)}</p>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Last Updated</label>
                  <p className="fw-bold">{formatDate(organization.updated_at)}</p>
                </div>
              </div>

              {/* Metadata */}
              {organization.metadata && organization.metadata !== '{}' && (
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Metadata</h6>
                  </div>

                  <div className="col-md-12 mb-3">
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(JSON.parse(organization.metadata), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default OrgDetails;
