import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/apiClient';
import DashboardLayout from '../../../../layout/DashboardLayout';
import ModulesActivationPanel from './ModulesActivationPanel';

const OrgsList = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [filterTrial, setFilterTrial] = useState('all'); // all, trial, non-trial
  const [showModulesPanel, setShowModulesPanel] = useState(false);
  const [selectedOrgForModules, setSelectedOrgForModules] = useState(null);

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

  const handleCreateNew = () => {
    navigate('/developer-console/organizations/new');
  };

  const handleSwitchOrg = () => {
    navigate('/developer-console/organizations/switch');
  };

  const handleViewDetails = (id) => {
    navigate(`/developer-console/organizations/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/developer-console/organizations/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      await apiClient.delete(`/IAmAPI/api/Organizations/${id}`);
      alert('Organization deleted successfully');
      fetchOrganizations();
    } catch (err) {
      console.error('Error deleting organization:', err);
      alert('Failed to delete organization');
    }
  };

  const handleManageModules = (org) => {
    setSelectedOrgForModules(org);
    setShowModulesPanel(true);
  };

  const handleCloseModulesPanel = () => {
    setShowModulesPanel(false);
    setSelectedOrgForModules(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter organizations based on search and filters
  const filteredOrganizations = organizations.filter(org => {
    // Search filter
    const matchesSearch = 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && org.is_active) ||
      (filterStatus === 'inactive' && !org.is_active);

    // Trial filter
    const matchesTrial =
      filterTrial === 'all' ||
      (filterTrial === 'trial' && org.is_trial) ||
      (filterTrial === 'non-trial' && !org.is_trial);

    return matchesSearch && matchesStatus && matchesTrial;
  });

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
        {/* Modules Activation Panel */}
        {showModulesPanel && selectedOrgForModules && (
          <div className="row mb-4">
            <div className="col-12">
              <ModulesActivationPanel 
                organizationId={selectedOrgForModules.id}
                organizationName={selectedOrgForModules.name}
                onClose={handleCloseModulesPanel}
              />
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Organizations</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-secondary" onClick={handleSwitchOrg}>
                  <i className="ti ti-switch me-2"></i>
                  Switch Organization
                </button>
                <button className="btn btn-primary" onClick={handleCreateNew}>
                  <i className="ti ti-plus me-2"></i>
                  Create New Organization
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filters and Search */}
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <select
                    className="form-select"
                    value={filterTrial}
                    onChange={(e) => setFilterTrial(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="trial">Trial</option>
                    <option value="non-trial">Non-Trial</option>
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <button 
                    className="btn btn-outline-secondary w-100"
                    onClick={fetchOrganizations}
                  >
                    <i className="ti ti-refresh me-2"></i>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-3">
                <p className="text-muted mb-0">
                  Showing {filteredOrganizations.length} of {organizations.length} organizations
                </p>
              </div>

              {/* Organizations Table */}
              {filteredOrganizations.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-building text-muted" style={{ fontSize: '4rem' }}></i>
                  <p className="text-muted mt-3">No organizations found</p>
                  {searchTerm && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Organization Name</th>
                        <th>Legal Name</th>
                        <th>Contact Person</th>
                        <th>Contact Email</th>
                        <th>Domain</th>
                        <th>Subscription Plan</th>
                        <th>Status</th>
                        <th>Trial</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrganizations.map((org) => (
                        <tr key={org.id}>
                          <td>{org.id}</td>
                          <td>
                            <strong>{org.name}</strong>
                            {org.organization_type && (
                              <div className="small text-muted">{org.organization_type}</div>
                            )}
                          </td>
                          <td>{org.legal_name}</td>
                          <td>{org.contact_person}</td>
                          <td>
                            <a href={`mailto:${org.contact_email}`} className="text-decoration-none">
                              {org.contact_email}
                            </a>
                            {org.contact_phone && (
                              <div className="small text-muted">{org.contact_phone}</div>
                            )}
                          </td>
                          <td>
                            {org.domain && (
                              <div>
                                <div>{org.domain}</div>
                                {org.website && (
                                  <a 
                                    href={org.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="small text-decoration-none"
                                  >
                                    <i className="ti ti-external-link me-1"></i>
                                    Visit
                                  </a>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {org.subscription_plan || 'N/A'}
                            {org.billing_frequency && (
                              <div className="small text-muted">{org.billing_frequency}</div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${org.is_active ? 'bg-success' : 'bg-danger'}`}>
                              {org.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {org.is_trial ? (
                              <span className="badge bg-warning text-dark">
                                Trial
                                {org.trial_end_date && (
                                  <div className="small">{formatDate(org.trial_end_date)}</div>
                                )}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">Regular</span>
                            )}
                          </td>
                          <td>{formatDate(org.created_at)}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleViewDetails(org.id)}
                                title="View Details"
                              >
                                <i className="ti ti-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-info"
                                onClick={() => handleManageModules(org)}
                                title="Manage Modules"
                              >
                                <i className="ti ti-package"></i>
                              </button>
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => handleEdit(org.id)}
                                title="Edit"
                              >
                                <i className="ti ti-edit"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(org.id)}
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

            {/* Summary Cards */}
            {organizations.length > 0 && (
              <div className="card-footer">
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="border-end">
                      <h5 className="mb-0">{organizations.length}</h5>
                      <p className="text-muted small mb-0">Total Organizations</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border-end">
                      <h5 className="mb-0 text-success">
                        {organizations.filter(o => o.is_active).length}
                      </h5>
                      <p className="text-muted small mb-0">Active</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="border-end">
                      <h5 className="mb-0 text-warning">
                        {organizations.filter(o => o.is_trial).length}
                      </h5>
                      <p className="text-muted small mb-0">Trial Accounts</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div>
                      <h5 className="mb-0 text-danger">
                        {organizations.filter(o => !o.is_active).length}
                      </h5>
                      <p className="text-muted small mb-0">Inactive</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default OrgsList;
