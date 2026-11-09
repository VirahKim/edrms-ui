import React, { useState } from "react";
import authClient from "../api/authClient";
import { logout } from "../api/apiClient";
import PasswordInput from "./PasswordInput";

const SessionExpiredOverlay = ({ onReauthenticated }) => {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const applySession = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refresh", data.refresh_token);
    localStorage.setItem("expires_at", data.expires_at);
    localStorage.setItem("2fa", data.requires_2fa);
    localStorage.setItem("user", JSON.stringify(data.user_profile));

    setPassword("");
    setCode("");
    setAwaitingCode(false);
    onReauthenticated?.();
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const username = localStorage.getItem("username");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const email = user?.email || "";
      const identifier = email || username;

      if (!identifier) {
        setError("Missing user information. Please log in again.");
        return;
      }

      // Call login API with email/username and password for re-authentication
      const response = await authClient.post("/IAmAPI/api/auth/login", {
        email_or_username: identifier,
        password,
        device_info: ""
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const data = response.data;

      if (data && data.access_token) {
        applySession(data);
      } else if (data && data.requires_2fa) {
        // A code was just emailed by the login call above — switch to code
        // entry instead of leaving the user to blindly retry the password,
        // which would silently re-trigger a fresh code on every attempt.
        setEmailOrUsername(identifier);
        setAwaitingCode(true);
      } else {
        setError("Failed to extend session. Please try again.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authClient.post("/IAmAPI/api/auth/verify-2fa", {
        email_or_username: emailOrUsername,
        code
      }, {
        headers: { "Content-Type": "application/json" }
      });

      applySession(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setCode(value);
  };

  return (
    <div className="session-expired-overlay" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div className="card" style={{
        width: "100%",
        maxWidth: "400px",
        padding: "2rem",
      }}>
        {/* Icon & Title */}
        <div className="text-center mb-4">
          <div className="avtar avtar-lg bg-light-warning mx-auto mb-3">
            <i className="ti ti-lock f-24 text-warning" />
          </div>
          <h5 className="mb-2">Session Expired</h5>
          <p className="text-muted f-12 mb-0">
            {awaitingCode
              ? "Enter the verification code just emailed to you to continue."
              : "Your session has expired. Please enter your password to continue."}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3 f-12">
            <i className="ti ti-alert-circle f-16" />
            {error}
          </div>
        )}

        {awaitingCode ? (
          <form onSubmit={handleCodeSubmit}>
            <div className="mb-3">
              <label className="form-label f-12 fw-bold text-muted">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                className="form-control text-center"
                style={{ fontSize: "20px", letterSpacing: "8px" }}
                placeholder="000000"
                maxLength={6}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <i className="ti ti-loader-2 spin me-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <i className="ti ti-login me-2" />
                  Continue
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-3">
              <label className="form-label f-12 fw-bold text-muted">Password</label>
              <PasswordInput
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <i className="ti ti-loader-2 spin me-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <i className="ti ti-login me-2" />
                  Continue
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-3">
          <p className="text-muted f-11 mb-2">
            Click logout bellow yo start a new session.
          </p>
          <a href="#!" onClick={logout} className="bg-light-primary text-primary py-2 px-3 rounded-pill">
            <i className="ti ti-power" /> Logout
          </a>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredOverlay;