// New accounts are created with a password the owner didn't choose (the one
// emailed to them) — the backend refuses to issue a session for those until
// it's replaced (AuthController.Login returns must_change_password: true,
// see applySessionResponse). This page is where that replacement happens.
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { applySessionResponse } from "../../../utils/session";
import PasswordInput from "../../../components/PasswordInput";

const FirstLoginPasswordChange = () => {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("first_login_email");
    if (!storedEmail) {
      navigate("/login");
      return;
    }
    setEmail(storedEmail);

    // Pre-fill with the password just typed on the login page, so the user
    // isn't asked to retype what they entered seconds ago — they can still
    // see and edit it, satisfying "put the current password" either way.
    const storedPassword = sessionStorage.getItem("first_login_password");
    if (storedPassword) setCurrentPassword(storedPassword);
    sessionStorage.removeItem("first_login_password");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/IAmAPI/api/auth/complete-first-login", {
        email_or_username: email,
        current_password: currentPassword,
        new_password: newPassword,
        device_info: ""
      }, {
        headers: { "Content-Type": "application/json" }
      });

      sessionStorage.removeItem("first_login_email");
      applySessionResponse(response.data, email);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password. Check your current password and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-main">
      <div className="auth-wrapper v1">
        <div className="auth-form">
          <div className="card my-5">
            <form onSubmit={handleSubmit} className="card-body">
              <div className="text-center">
                <a href="#"><img src="/QBITS_LOGO.png" height={60} alt="img" /></a>
              </div>
              <div className="saprator my-3"><span>SET YOUR PASSWORD</span></div>
              <h4 className="text-center f-w-500 mb-3">Change Your Password to Continue</h4>

              <p className="text-muted mb-4 text-center">
                For security, you must set your own password before continuing.
                Enter the temporary password you were emailed, then choose a new one.
              </p>

              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <div className="mb-3">
                <label className="form-label">Current (Temporary) Password</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="The password from your welcome email"
                  disabled={loading}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">New Password</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={loading}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="d-grid mt-4">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Setting Password..." : "Set Password & Continue"}
                </button>
              </div>

              <div className="d-flex justify-content-center mt-4">
                <Link to="/login" className="link-primary">
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPasswordChange;
