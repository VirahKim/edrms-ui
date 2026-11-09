import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/apiClient';
import DashboardLayout from '../../../../layout/DashboardLayout';

const NewOrg = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orgTypes, setOrgTypes] = useState([]);
  const [fetchingTypes, setFetchingTypes] = useState(true);
  
  const [formData, setFormData] = useState({
    type_id: '',
    name: '',
    legal_name: '',
    registration_number: '',
    domain: '',
    website: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    country: '',
    state: '',
    city: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    subscription_plan: '',
    subscription_start_date: '',
    subscription_end_date: '',
    billing_frequency: 'monthly',
    is_trial: false,
    trial_end_date: '',
    modules_subscribed: '',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  // Fetch organization types on component mount
  useEffect(() => {
    fetchOrgTypes();
  }, []);

  const fetchOrgTypes = async () => {
    try {
      setFetchingTypes(true);
      const response = await apiClient.get('/IAmAPI/api/Organizations/types');
      setOrgTypes(response.data);
    } catch (error) {
      console.error('Error fetching organization types:', error);
      alert('Failed to fetch organization types');
    } finally {
      setFetchingTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.type_id) newErrors.type_id = 'Organization type is required';
    if (!formData.name) newErrors.name = 'Organization name is required';
    if (!formData.legal_name) newErrors.legal_name = 'Legal name is required';
    if (!formData.contact_email) newErrors.contact_email = 'Contact email is required';
    if (!formData.contact_person) newErrors.contact_person = 'Contact person is required';
    
    // Email validation
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    // Website validation (optional but if provided should be valid)
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website should start with http:// or https://';
    }

    // Trial date validation
    if (formData.is_trial && !formData.trial_end_date) {
      newErrors.trial_end_date = 'Trial end date is required when is_trial is checked';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare payload - only send non-empty values
      const payload = {
        type_id: parseInt(formData.type_id),
        name: formData.name,
        legal_name: formData.legal_name,
        registration_number: formData.registration_number || null,
        domain: formData.domain || null,
        website: formData.website || null,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || null,
        country: formData.country || null,
        state: formData.state || null,
        city: formData.city || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        postal_code: formData.postal_code || null,
        subscription_plan: formData.subscription_plan || null,
        subscription_start_date: formData.subscription_start_date || null,
        subscription_end_date: formData.subscription_end_date || null,
        billing_frequency: formData.billing_frequency || null,
        is_trial: formData.is_trial,
        trial_end_date: formData.is_trial ? formData.trial_end_date : null,
        modules_subscribed: formData.modules_subscribed || null,
        is_active: formData.is_active
      };

      await apiClient.post('/IAmAPI/api/Organizations', payload);
      
      alert('Organization created successfully!');
      navigate('/developer-console/organizations');
    } catch (error) {
      console.error('Error creating organization:', error);
      alert(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/developer-console/organizations');
  };

  if (fetchingTypes) {
    return (
      <DashboardLayout>
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
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
            <div className="card-header">
              <h5 className="card-title mb-0">Create New Organization</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Basic Information</h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="type_id" className="form-label">
                      Organization Type <span className="text-danger">*</span>
                    </label>
                    <select
                      id="type_id"
                      name="type_id"
                      className={`form-select ${errors.type_id ? 'is-invalid' : ''}`}
                      value={formData.type_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select organization type</option>
                      {orgTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.display_name}
                        </option>
                      ))}
                    </select>
                    {errors.type_id && <div className="invalid-feedback">{errors.type_id}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="name" className="form-label">
                      Organization Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="legal_name" className="form-label">
                      Legal Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="legal_name"
                      name="legal_name"
                      className={`form-control ${errors.legal_name ? 'is-invalid' : ''}`}
                      value={formData.legal_name}
                      onChange={handleChange}
                      required
                    />
                    {errors.legal_name && <div className="invalid-feedback">{errors.legal_name}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="registration_number" className="form-label">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      id="registration_number"
                      name="registration_number"
                      className="form-control"
                      value={formData.registration_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="domain" className="form-label">
                      Domain
                    </label>
                    <input
                      type="text"
                      id="domain"
                      name="domain"
                      className="form-control"
                      value={formData.domain}
                      onChange={handleChange}
                      placeholder="example.com"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="website" className="form-label">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      className={`form-control ${errors.website ? 'is-invalid' : ''}`}
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                    />
                    {errors.website && <div className="invalid-feedback">{errors.website}</div>}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Contact Information</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact_person" className="form-label">
                      Contact Person <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact_person"
                      name="contact_person"
                      className={`form-control ${errors.contact_person ? 'is-invalid' : ''}`}
                      value={formData.contact_person}
                      onChange={handleChange}
                      required
                    />
                    {errors.contact_person && <div className="invalid-feedback">{errors.contact_person}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact_email" className="form-label">
                      Contact Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      className={`form-control ${errors.contact_email ? 'is-invalid' : ''}`}
                      value={formData.contact_email}
                      onChange={handleChange}
                      required
                    />
                    {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="contact_phone" className="form-label">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="contact_phone"
                      name="contact_phone"
                      className="form-control"
                      value={formData.contact_phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Address Information</h6>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="address_line1" className="form-label">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      id="address_line1"
                      name="address_line1"
                      className="form-control"
                      value={formData.address_line1}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="address_line2" className="form-label">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="address_line2"
                      name="address_line2"
                      className="form-control"
                      value={formData.address_line2}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="state" className="form-label">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      className="form-control"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      className="form-control"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="postal_code" className="form-label">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      className="form-control"
                      value={formData.postal_code}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Subscription Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Subscription Information</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="subscription_plan" className="form-label">
                      Subscription Plan
                    </label>
                    <input
                      type="text"
                      id="subscription_plan"
                      name="subscription_plan"
                      className="form-control"
                      value={formData.subscription_plan}
                      onChange={handleChange}
                      placeholder="e.g., Basic, Pro, Enterprise"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="billing_frequency" className="form-label">
                      Billing Frequency
                    </label>
                    <select
                      id="billing_frequency"
                      name="billing_frequency"
                      className="form-select"
                      value={formData.billing_frequency}
                      onChange={handleChange}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="subscription_start_date" className="form-label">
                      Subscription Start Date
                    </label>
                    <input
                      type="date"
                      id="subscription_start_date"
                      name="subscription_start_date"
                      className="form-control"
                      value={formData.subscription_start_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="subscription_end_date" className="form-label">
                      Subscription End Date
                    </label>
                    <input
                      type="date"
                      id="subscription_end_date"
                      name="subscription_end_date"
                      className="form-control"
                      value={formData.subscription_end_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="modules_subscribed" className="form-label">
                      Modules Subscribed
                    </label>
                    <input
                      type="text"
                      id="modules_subscribed"
                      name="modules_subscribed"
                      className="form-control"
                      value={formData.modules_subscribed}
                      onChange={handleChange}
                      placeholder="e.g., HR, Accounting, Inventory"
                    />
                    <small className="form-text text-muted">
                      Enter comma-separated module names
                    </small>
                  </div>
                </div>

                {/* Trial and Status */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">Trial and Status</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="is_trial"
                        name="is_trial"
                        className="form-check-input"
                        checked={formData.is_trial}
                        onChange={handleChange}
                      />
                      <label htmlFor="is_trial" className="form-check-label">
                        Is Trial Account
                      </label>
                    </div>
                  </div>

                  {formData.is_trial && (
                    <div className="col-md-6 mb-3">
                      <label htmlFor="trial_end_date" className="form-label">
                        Trial End Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        id="trial_end_date"
                        name="trial_end_date"
                        className={`form-control ${errors.trial_end_date ? 'is-invalid' : ''}`}
                        value={formData.trial_end_date}
                        onChange={handleChange}
                      />
                      {errors.trial_end_date && <div className="invalid-feedback">{errors.trial_end_date}</div>}
                    </div>
                  )}

                  <div className="col-md-6 mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        className="form-check-input"
                        checked={formData.is_active}
                        onChange={handleChange}
                      />
                      <label htmlFor="is_active" className="form-check-label">
                        Is Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating...
                          </>
                        ) : (
                          'Create Organization'
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default NewOrg;
