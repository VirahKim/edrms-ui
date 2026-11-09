import React, { useEffect, useState } from "react";
import recruitmentApi from "../../../api/recruitmentApi";
import apiClient from "../../../api/apiClient";
import PasswordInput from "../../../components/PasswordInput";

const DEFAULT_FORM = {
  first_name: "",
  last_name: "",
  other_names: "",
  email_address: "",
  phone_number: "",
  nationality: "",
  date_of_birth: "",
  gender: "",
  password: "",
  confirm_password: ""
};

const CandidateRegistration = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [accountMessage, setAccountMessage] = useState("");
  const [recentCandidate, setRecentCandidate] = useState(null);

  useEffect(() => {
    const authKeys = ["token", "refresh", "expires_at", "2fa", "user"];
    authKeys.forEach((key) => localStorage.removeItem(key));
  }, []);

  const setFieldValue = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const handleEmailChange = (value) => {
    setFieldValue("email_address", value);
  };

  const validateForm = () => {
    const email = form.email_address.trim();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      return "First name and last name are required.";
    }
    if (!email || !email.includes("@")) {
      return "Provide a valid email address.";
    }
    if (!form.password || form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (form.password !== form.confirm_password) {
      return "Passwords do not match.";
    }
    return "";
  };

  const createApplicantAccount = async () => {
    const payload = {
      first_name: form.first_name.trim(),
      other_name: form.other_names.trim() || null,
      phone_number: form.phone_number.trim() || null,
      email_address: form.email_address.trim(),
      password: form.password,
      requires_2fa: false
    };

    const response = await apiClient.post("/IAmAPI/api/users/applicants", payload, {
      headers: { "Content-Type": "application/json" }
    });

    const userId = response?.data?.id ?? response?.data?.user_id;
    if (!userId) {
      throw new Error("User account created but no identifier was returned.");
    }
    return userId;
  };

  const createCandidateRecord = async (userId) => {
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      other_names: form.other_names.trim() || null,
      email_address: form.email_address.trim(),
      phone_number: form.phone_number.trim() || null,
      nationality: form.nationality.trim() || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      user_id: userId
    };

    const response = await recruitmentApi.createCandidate(payload);
    return response;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    setAccountMessage("");
    const validationMessage = validateForm();
    if (validationMessage) {
      setAlert({ type: "danger", message: validationMessage });
      return;
    }

    setLoading(true);
    const formSnapshot = { ...form };
    let userId = null;

    try {
      userId = await createApplicantAccount();
      const candidateResponse = await createCandidateRecord(userId);
      const candidateRecord = typeof candidateResponse === "object" ? candidateResponse : { id: candidateResponse };
      const candidateId = candidateRecord.id || candidateRecord.candidate_id;
      const candidateRef = candidateRecord.candidate_code || candidateId;

      setAlert({
        type: "success",
        message: candidateRef
          ? `Account created successfully. Candidate reference ${candidateRef} is ready.`
          : "Account created successfully. Candidate profile is ready."
      });
      setAccountMessage("You can now log in using your email to continue the application wizard. Your username will be provided after account creation.");
      setRecentCandidate({
        id: candidateId,
        code: candidateRecord.candidate_code,
        email: candidateRecord.email_address || formSnapshot.email_address,
        name: `${formSnapshot.first_name} ${formSnapshot.last_name}`.trim()
      });
      resetForm();
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      if (userId) {
        setAlert({
          type: "warning",
          message: backendMessage || "Login created but candidate profile could not be saved. Please log in to finish profile setup."
        });
        setAccountMessage("Your login account is ready. Sign in and the system will prompt you to complete your candidate profile.");
      } else {
        setAlert({ type: "danger", message: backendMessage || "Unable to create your login account." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-main">
      <div className="auth-wrapper v1">
        <div className="container py-5">
          <div className="text-center mb-4">
            <a href="/">
              <img src="/QBITS_LOGO.png" height={60} alt="Logo" />
            </a>
            <div className="mt-3">
              <h4 className="mb-1">Candidate Intake</h4>
              <p className="text-muted mb-0">Create your login and minimal profile before launching the application wizard.</p>
            </div>
          </div>

          <div className="row justify-content-center g-4">
            <div className="col-xl-7 col-lg-8">
              <div className="card h-100 shadow-sm">
                <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <h5 className="mb-1">Register a Candidate</h5>
                    <small className="text-muted">Step 1 of 2: Login + minimal profile.</small>
                  </div>
                  <small className="text-muted">Already registered? <a href="/">Sign in</a>.</small>
                </div>
                <div className="card-body">
                  {alert.message && (
                    <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                      {alert.message}
                      <button type="button" className="btn-close" onClick={() => setAlert({ type: "", message: "" })}></button>
                    </div>
                  )}
                  {accountMessage && (
                    <div className="alert alert-info alert-dismissible fade show" role="alert">
                      {accountMessage}
                      <button type="button" className="btn-close" onClick={() => setAccountMessage("")}></button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="row g-4">
                    <div className="col-12">
                      <h6 className="text-muted text-uppercase small mb-2">Personal Details</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">First Name *</label>
                          <input type="text" className="form-control" value={form.first_name} onChange={(e) => setFieldValue("first_name", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Last Name *</label>
                          <input type="text" className="form-control" value={form.last_name} onChange={(e) => setFieldValue("last_name", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Other Names</label>
                          <input type="text" className="form-control" value={form.other_names} onChange={(e) => setFieldValue("other_names", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Phone Number</label>
                          <input type="text" className="form-control" value={form.phone_number} onChange={(e) => setFieldValue("phone_number", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Gender</label>
                          <select className="form-select" value={form.gender} onChange={(e) => setFieldValue("gender", e.target.value)}>
                            <option value="">Prefer not to say</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Date of Birth</label>
                          <input type="date" className="form-control" value={form.date_of_birth} onChange={(e) => setFieldValue("date_of_birth", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Nationality</label>
                          <input type="text" className="form-control" value={form.nationality} onChange={(e) => setFieldValue("nationality", e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <h6 className="text-muted text-uppercase small mb-2">Account Credentials</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Email Address *</label>
                          <input
                            type="email"
                            className="form-control"
                            value={form.email_address}
                            onChange={(e) => handleEmailChange(e.target.value)}
                          />
                          <small className="text-muted">Used for verification and notifications.</small>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Password *</label>
                          <PasswordInput value={form.password} onChange={(e) => setFieldValue("password", e.target.value)} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Confirm Password *</label>
                          <PasswordInput
                            value={form.confirm_password}
                            onChange={(e) => setFieldValue("confirm_password", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="alert alert-light border small" role="alert">
                        By registering you consent to us storing your details for recruitment purposes. Existing staff should use their company credentials instead of registering twice.
                      </div>
                    </div>

                    <div className="col-12 d-flex justify-content-between flex-wrap gap-2">
                      <button type="button" className="btn btn-light" onClick={resetForm} disabled={loading}>
                        Clear Form
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Registering..." : "Register & Create Profile"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-lg-4">
              {recentCandidate && (
                <div className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <h6 className="text-muted text-uppercase small">Latest Registration</h6>
                    <p className="mb-1 fw-semibold">{recentCandidate.name || "Unnamed Candidate"}</p>
                    <p className="mb-1">
                      <strong>Candidate ID:</strong> {recentCandidate.code || recentCandidate.id}
                    </p>
                    <p className="mb-0 text-muted">{recentCandidate.email}</p>
                    <div className="mt-3">
                      <small className="text-muted d-block">
                        Next step: <a href="/">sign in</a> and complete the full profile.
                      </small>
                    </div>
                  </div>
                </div>
              )}

              <div className="card shadow-sm">
                <div className="card-body">
                  <h6 className="text-muted text-uppercase small">Intake Checklist</h6>
                  <ul className="mb-0 small">
                    <li>This form creates both a login account and a candidate placeholder.</li>
                    <li>Internal employees should use their corporate login instead of registering twice.</li>
                    <li>Keep your candidate ID handy—it is required when resuming applications.</li>
                    <li>You can upload documents and expand your profile after signing in.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateRegistration;
