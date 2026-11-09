//This page is for creating a new user account directly.
//There is another create user page (CreateUserAccForEmployee.jsx) which is for creating a user from an existing emeployee
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { uploadUserSignature } from "../../../../api/signaturesApi";
import SignaturePad from "./SignaturePad";
import UserRegistrySelect from "./UserRegistrySelect";
import { setUserRegistries } from "../../../../api/edmsApi";

const CreateUser = () => {
  const [form, setForm] = useState({
    first_name: "",
    other_name: "",
    user_name: "",
    phone_number: "",
    email_address: "",
    requires_2fa: true,
    role_id: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [signatureMode, setSignatureMode] = useState("upload");
  const [registryIds, setRegistryIds] = useState([]);   // optional: the registries this user works in
  const navigate = useNavigate();

  // Load roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Build/revoke an object URL preview whenever the chosen signature file changes
  useEffect(() => {
    if (!signatureFile) {
      setSignaturePreview(null);
      return;
    }
    const url = URL.createObjectURL(signatureFile);
    setSignaturePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [signatureFile]);

  const fetchRoles = async () => {
    try {
      const res = await apiClient.get("/IAmAPI/api/roles", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setRoles(res.data || []);
    } catch (err) {
      console.error("Error loading roles:", err);
      setError("Error loading roles");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!form.email_address || !form.email_address.includes('@')) {
      setError("Valid email address is required.");
      return false;
    }

    if (!form.user_name || form.user_name.length < 3) {
      setError("Username must be at least 3 characters.");
      return false;
    }

    if (!form.role_id) {
      setError("Please select a role.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setSaving(true);
    try {
      // No password field: the backend auto-generates a strong temporary
      // password and emails it to the user (username, email, and password)
      // when none is supplied here.
      const payload = {
        first_name: form.first_name,
        other_name: form.other_name,
        user_name: form.user_name,
        phone_number: form.phone_number,
        email_address: form.email_address,
        requires_2fa: form.requires_2fa,
        role_id: parseInt(form.role_id, 10)
      };

      const userResponse = await apiClient.post("/IAmAPI/api/users", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      const newUserId = userResponse.data?.id || userResponse.data?.user_id;

      if (signatureFile && newUserId) {
        try {
          await uploadUserSignature(newUserId, signatureFile);
        } catch (sigErr) {
          console.warn("User created but signature upload failed:", sigErr);
        }
      }

      let registryNote = "";
      if (registryIds.length > 0 && newUserId) {
        try {
          await setUserRegistries(newUserId, registryIds);
        } catch (regErr) {
          registryNote = ` The registry could not be saved (${regErr?.response?.data?.message || "try again from Edit User"}).`;
        }
      }

      setSuccess("User account created successfully! A temporary password has been emailed to the user along with their username and login email." + registryNote);

      // Navigate to user list after short delay
      setTimeout(() => {
        navigate("/users");
      }, 1500);
    } catch (err) {
      const resp = err.response?.data;
      let message = "Error creating user account";

      if (resp) {
        if (typeof resp === 'string') {
          message = resp;
        } else if (resp.details) {
          message = resp.details;
        } else if (resp.detail) {
          message = resp.detail;
        } else if (resp.message) {
          message = resp.message;
        } else if (resp.error) {
          // include both error and details if both exist
          message = resp.details ? `${resp.error} - ${resp.details}` : resp.error;
        } else {
          try {
            message = JSON.stringify(resp);
          } catch (e) {
            message = err.message || message;
          }
        }
      } else {
        message = err.message || message;
      }

      setError(message);
      console.error("Save error:", err.response?.data || err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/users");
  };

  return (
    <DashboardLayout>
      <div className="row">
        <div className="col-lg-8 col-md-10 mx-auto">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5>Create User Account</h5>
                <p className="text-muted mb-0">Create a new user account</p>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancel}
                aria-label="Go back"
              >
                <i className="ti ti-arrow-left me-1"></i> Back
              </button>
            </div>

            <div className="card-body">
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

              {loadingRoles ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Other Names</label>
                      <input
                        type="text"
                        className="form-control"
                        name="other_name"
                        value={form.other_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Username <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="user_name"
                        value={form.user_name}
                        onChange={handleChange}
                        required
                        minLength="3"
                      />
                      <small className="text-muted">Must be unique, at least 3 characters</small>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email Address <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control"
                        name="email_address"
                        value={form.email_address}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone_number"
                      value={form.phone_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="alert alert-info">
                    <i className="ti ti-key me-2"></i>
                    A strong temporary password will be generated automatically and emailed
                    to the user along with their username and login email once the account is created.
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Role <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      name="role_id"
                      value={form.role_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.role_name || role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <UserRegistrySelect value={registryIds} onChange={setRegistryIds} disabled={saving} />

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="requires_2fa"
                      name="requires_2fa"
                      checked={form.requires_2fa}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="requires_2fa">
                      Require Two-Factor Authentication (2FA)
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Signature (optional)</label>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      {signaturePreview && (
                        <img
                          src={signaturePreview}
                          alt="Signature preview"
                          className="border rounded"
                          style={{ height: 60, background: "#fff", padding: 4 }}
                        />
                      )}
                      <input
                        type="file"
                        className="form-control"
                        style={{ maxWidth: 320 }}
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        className={`btn btn-sm ${signatureMode === "draw" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setSignatureMode(signatureMode === "draw" ? "upload" : "draw")}
                      >
                        <i className="ti ti-signature me-1"></i>Draw Instead
                      </button>
                    </div>
                    {signatureMode === "draw" && (
                      <div className="mt-3" style={{ maxWidth: 420 }}>
                        <small className="text-muted d-block mb-1">
                          Draw with your mouse, finger, or stylus
                        </small>
                        <SignaturePad
                          onSave={(file) => { setSignatureFile(file); setSignatureMode("upload"); }}
                          saving={false}
                        />
                      </div>
                    )}
                    <small className="text-muted">PNG, JPEG or SVG. Can also be added later from Edit User.</small>
                  </div>

                  <div className="alert alert-info">
                    <i className="ti ti-info-circle me-2"></i>
                    <strong>Note:</strong> If the person you are adding is already an employee, create the user account from the Staff List page in the HR module instead.
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-user-plus me-1"></i> Create User Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateUser;
