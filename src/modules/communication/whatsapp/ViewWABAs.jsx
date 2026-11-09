import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import whatsappApi from "../../../api/whatsappApi";

/**
 * ViewWABAs - Manage WhatsApp Business Accounts
 */
export default function ViewWABAs() {
  const navigate = useNavigate();
  const [wabas, setWabas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  const [selectedWaba, setSelectedWaba] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    metaWabaId: "",
    businessName: "",
    timezone: "Africa/Nairobi",
    accessToken: ""
  });

  const [phoneFormData, setPhoneFormData] = useState({
    metaPhoneNumberId: "",
    displayPhoneNumber: "",
    verifiedName: "",
    qualityRating: "UNKNOWN",
    messagingLimit: 0,
    isActive: true
  });

  useEffect(() => {
    fetchWABAs();
  }, []);

  const fetchWABAs = async () => {
    try {
      const response = await whatsappApi.getWABAs();
      const data = response.data || [];

      // Normalize API response to camelCase so component can rely on consistent fields
      const normalized = data.map((w) => ({
        id: w.id ?? w.Id,
        metaWabaId: w.metaWabaId ?? w.MetaWabaId,
        businessName: w.businessName ?? w.BusinessName,
        timezone: w.timezone ?? w.Timezone,
        accessToken: w.accessToken ?? w.AccessToken ?? null,
        isActive: w.isActive ?? w.IsActive,
        createdAt: w.createdAt ?? w.CreatedAt,
        phoneNumbers: (w.phoneNumbers ?? w.PhoneNumbers ?? []).map((p) => ({
          id: p.id ?? p.Id,
          wabaId: p.wabaId ?? p.WabaId,
          metaPhoneNumberId: p.metaPhoneNumberId ?? p.MetaPhoneNumberId,
          displayPhoneNumber: p.displayPhoneNumber ?? p.DisplayPhoneNumber,
          verifiedName: p.verifiedName ?? p.VerifiedName,
          qualityRating: p.qualityRating ?? p.QualityRating ?? "UNKNOWN",
          messagingLimit: p.messagingLimit ?? p.MessagingLimit ?? 0,
          isActive: p.isActive ?? p.IsActive,
          createdAt: p.createdAt ?? p.CreatedAt,
        })),
      }));

      setWabas(normalized);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load WABAs:", err);
      setError("Failed to load WhatsApp Business Accounts");
      setLoading(false);
    }
  };

  const handleAddWaba = () => {
    setFormData({
      metaWabaId: "",
      businessName: "",
      timezone: "Africa/Nairobi"
    });
    setShowAddModal(true);
  };

  const handleEditWaba = (waba) => {
    setSelectedWaba(waba);
    setFormData({
      metaWabaId: waba.metaWabaId,
      businessName: waba.businessName,
      timezone: waba.timezone,
      accessToken: waba.accessToken ?? waba.AccessToken ?? "",
      isActive: waba.isActive ?? waba.IsActive ?? true
    });
    setShowEditModal(true);
  };

  const handleAddPhone = (waba) => {
    setSelectedWaba(waba);
    setPhoneFormData({
      metaPhoneNumberId: "",
      displayPhoneNumber: "",
      verifiedName: "",
      qualityRating: "UNKNOWN",
      messagingLimit: 0,
      isActive: true
    });
    setSelectedPhone(null);
    setShowAddPhoneModal(true);
  };

  const handleEditPhone = (waba, phone) => {
    setSelectedWaba(waba);
    setSelectedPhone(phone);
    setPhoneFormData({
      metaPhoneNumberId: phone.metaPhoneNumberId ?? phone.MetaPhoneNumberId ?? "",
      displayPhoneNumber: phone.displayPhoneNumber ?? phone.DisplayPhoneNumber ?? "",
      verifiedName: phone.verifiedName ?? phone.VerifiedName ?? "",
      qualityRating: phone.qualityRating ?? phone.QualityRating ?? "UNKNOWN",
      messagingLimit: phone.messagingLimit ?? phone.MessagingLimit ?? 0,
      isActive: phone.isActive ?? phone.IsActive ?? true
    });
    setShowEditPhoneModal(true);
  };

  const handleSubmitWaba = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (showEditModal) {
        await whatsappApi.updateWABA(selectedWaba.id, formData);
        setSuccess("WABA updated successfully");
      } else {
        await whatsappApi.createWABA(formData);
        setSuccess("WABA created successfully");
      }

      setShowAddModal(false);
      setShowEditModal(false);
      await fetchWABAs();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save WABA");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPhone = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const wabaId = selectedWaba?.id;

      if (!wabaId) {
        throw new Error("Missing WABA identifier. Cannot add phone number.");
      }
      
      const phoneData = {
        wabaId: wabaId,
        metaPhoneNumberId: phoneFormData.metaPhoneNumberId,
        displayPhoneNumber: phoneFormData.displayPhoneNumber,
        verifiedName: phoneFormData.verifiedName || phoneFormData.displayPhoneNumber,
        qualityRating: phoneFormData.qualityRating || "UNKNOWN",
        messagingLimit: parseInt(phoneFormData.messagingLimit) || 0,
        isActive: phoneFormData.isActive ?? true
      };
      
      if (showEditPhoneModal && selectedPhone) {
        // Update existing phone number
        if (whatsappApi.updatePhoneNumber) {
          await whatsappApi.updatePhoneNumber(wabaId, selectedPhone.id, phoneData);
        } else {
          setError("Phone number update not implemented in API");
          setSaving(false);
          return;
        }
        setSuccess("Phone number updated successfully");
      } else {
        // Create new phone number
        await whatsappApi.addPhoneNumber(wabaId, phoneData);
        setSuccess("Phone number added successfully");
      }
      setShowAddPhoneModal(false);
      setShowEditPhoneModal(false);
      setSelectedPhone(null);
      await fetchWABAs();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to save phone number:", err);
      setError(err.response?.data?.message || err.message || "Failed to save phone number");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncTemplates = async () => {
    try {
      setSaving(true);
      const response = await whatsappApi.syncTemplates();
      setSuccess(response.data?.message || "Templates synced successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sync templates");
    } finally {
      setSaving(false);
    }
  };

  const getQualityBadge = (rating) => {
    const badges = {
      GREEN: "badge bg-success",
      YELLOW: "badge bg-warning",
      RED: "badge bg-danger",
      UNKNOWN: "badge bg-secondary"
    };
    return badges[rating] || badges.UNKNOWN;
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  const maskToken = (t) => {
    if (!t) return "-";
    if (t.length <= 12) return t;
    return `${t.slice(0, 6)}...${t.slice(-4)}`;
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          {/* Page Header */}
          <div className="page-header mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">WhatsApp Business Accounts</h4>
                <p className="text-muted mb-0">
                  Manage your WhatsApp Business API accounts and phone numbers
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={handleSyncTemplates}
                  disabled={saving}
                >
                  <i className="ti ti-refresh me-2"></i>
                  Sync Templates
                </button>
                <button className="btn btn-primary" onClick={handleAddWaba}>
                  <i className="ti ti-plus me-2"></i>
                  Add WABA
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

          {/* WABAs List */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : wabas.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="ti ti-brand-whatsapp text-muted" style={{ fontSize: "64px" }}></i>
                <h5 className="mt-3">No WhatsApp Business Accounts</h5>
                <p className="text-muted">Get started by adding your first WABA</p>
                <button className="btn btn-primary" onClick={handleAddWaba}>
                  <i className="ti ti-plus me-2"></i>
                  Add Your First WABA
                </button>
              </div>
            </div>
          ) : (
            <div className="row">
              {wabas.map((waba) => (
                <div key={waba.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="card-title mb-1">{waba.businessName}</h5>
                          <span className={`badge ${waba.isActive ? "bg-success" : "bg-secondary"}`}>
                            {waba.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleEditWaba(waba)}
                          >
                            <i className="ti ti-edit me-1"></i>
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleAddPhone(waba)}
                          >
                            <i className="ti ti-phone-plus me-1"></i>
                            Add Phone
                          </button>

                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-light"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i className="ti ti-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleEditWaba(waba)}
                                >
                                  <i className="ti ti-edit me-2"></i>
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={() => handleAddPhone(waba)}
                                >
                                  <i className="ti ti-phone-plus me-2"></i>
                                  Add Phone
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">Meta WABA ID</small>
                        <code className="small">{waba.metaWabaId}</code>
                          <div className="small text-muted mt-1">Added: {formatDate(waba.createdAt)}</div>
                          <div className="small text-muted">Token: <code className="small">{maskToken(waba.accessToken)}</code></div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">Timezone</small>
                        <span>{waba.timezone}</span>
                      </div>

                      {/* Phone Numbers */}
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted fw-semibold">Phone Numbers</small>
                          <button
                            className="btn btn-sm btn-link p-0"
                            onClick={() => handleAddPhone(waba)}
                          >
                            <i className="ti ti-plus"></i>
                          </button>
                        </div>

                        {waba.phoneNumbers && waba.phoneNumbers.length > 0 ? (
                          <div className="list-group list-group-flush">
                            {waba.phoneNumbers.map((phone) => (
                              <div
                                key={phone.id}
                                className="list-group-item px-0 py-2 border-0 bg-transparent"
                              >
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <div className="fw-semibold">{phone.displayPhoneNumber}</div>
                                    <small className="text-muted">{phone.verifiedName}</small>
                                    <div className="mt-1">
                                      <div className="small text-muted">Meta Phone ID: <code className="small">{phone.metaPhoneNumberId}</code></div>
                                      <div className="small text-muted">Added: {formatDate(phone.createdAt)}</div>
                                      <div className="mt-1">
                                        <span className={getQualityBadge(phone.qualityRating)}>
                                          {phone.qualityRating}
                                        </span>
                                        <span className="ms-2 small text-muted">
                                          Limit: {phone.messagingLimit}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="d-flex flex-column align-items-end">
                                    <button
                                      className="btn btn-sm btn-outline-secondary mb-1"
                                      onClick={() => handleEditPhone(waba, phone)}
                                    >
                                      <i className="ti ti-edit me-1"></i>
                                      Edit
                                    </button>
                                    <span className={`badge ${phone.isActive ? "bg-success" : "bg-secondary"}`}>
                                      {phone.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted small">No phone numbers added</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit WABA Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showEditModal ? "Edit WABA" : "Add New WABA"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmitWaba}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Meta WABA ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.metaWabaId}
                      onChange={(e) => setFormData({ ...formData, metaWabaId: e.target.value })}
                      required
                      disabled={showEditModal}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Access Token</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.accessToken}
                      onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                      placeholder="Optional access token for this WABA"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Business Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Timezone *</label>
                    <select
                      className="form-select"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      required
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                      <option value="Africa/Lagos">Africa/Lagos</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                    </select>
                  </div>
                  
                  {showEditModal && (
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="wabaIsActive"
                          checked={formData.isActive ?? true}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="wabaIsActive">
                          Active
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Phone Number Modal */}
      {(showAddPhoneModal || showEditPhoneModal) && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showEditPhoneModal ? `Edit Phone Number for ${selectedWaba?.businessName}` : `Add Phone Number to ${selectedWaba?.businessName}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddPhoneModal(false);
                    setShowEditPhoneModal(false);
                    setSelectedPhone(null);
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmitPhone}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Meta Phone Number ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={phoneFormData.metaPhoneNumberId}
                      onChange={(e) => setPhoneFormData({ ...phoneFormData, metaPhoneNumberId: e.target.value })}
                      required
                      disabled={showEditPhoneModal}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Display Phone Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+1234567890"
                      value={phoneFormData.displayPhoneNumber}
                      onChange={(e) => setPhoneFormData({ ...phoneFormData, displayPhoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Verified Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={phoneFormData.verifiedName}
                      onChange={(e) => setPhoneFormData({ ...phoneFormData, verifiedName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Quality Rating</label>
                    <select
                      className="form-select"
                      value={phoneFormData.qualityRating}
                      onChange={(e) => setPhoneFormData({ ...phoneFormData, qualityRating: e.target.value })}
                    >
                      <option value="GREEN">GREEN</option>
                      <option value="YELLOW">YELLOW</option>
                      <option value="RED">RED</option>
                      <option value="UNKNOWN">UNKNOWN</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Messaging Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={phoneFormData.messagingLimit}
                      onChange={(e) => setPhoneFormData({ ...phoneFormData, messagingLimit: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="phoneIsActive"
                        checked={phoneFormData.isActive}
                        onChange={(e) => setPhoneFormData({ ...phoneFormData, isActive: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="phoneIsActive">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddPhoneModal(false);
                      setShowEditPhoneModal(false);
                      setSelectedPhone(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (showEditPhoneModal ? "Updating..." : "Adding...") : (showEditPhoneModal ? "Update Phone Number" : "Add Phone Number")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
