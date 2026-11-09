// src/modules/auth/UserVerification.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authClient from "../../../api/authClient";

const UserVerification = () => {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from session storage (set during login)
    const storedEmail = sessionStorage.getItem("2fa_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email found, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  const handleRequestCode = async () => {
    setResending(true);
    setResendMessage("");
    setError("");

    try {
      await authClient.post("/IAmAPI/api/auth/request-2fa", {
        email_or_username: email
      }, {
        headers: { "Content-Type": "application/json" }
      });

      setResendMessage("A new verification code has been sent to your email.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await authClient.post("/IAmAPI/api/auth/verify-2fa", {
        email_or_username: email,
        code: code
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const data = response.data;
      console.log("2FA verification successful:", data);

      // Save JWT to localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh", data.refresh_token);
      localStorage.setItem("expires_at", data.expires_at);
      localStorage.setItem("user", JSON.stringify(data.user_profile));

      // Clear session storage
      sessionStorage.removeItem("2fa_email");

      setSuccess(true);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setCode(value);
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
              <div className="saprator my-3"><span>TWO-FACTOR AUTHENTICATION</span></div>
              <h4 className="text-center f-w-500 mb-3">Enter Verification Code</h4>
              
              {success ? (
                <div className="alert alert-success" role="alert">
                  Verification successful! Redirecting to dashboard...
                </div>
              ) : (
                <>
                  <p className="text-muted mb-4 text-center">
                    A 6-digit verification code has been sent to:<br />
                    <strong>{email}</strong>
                  </p>
                  
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  {resendMessage && <div className="alert alert-info" role="alert">{resendMessage}</div>}
                  
                  <div className="mb-4">
                    <input 
                      type="text" 
                      value={code} 
                      onChange={handleCodeChange} 
                      className="form-control text-center" 
                      style={{ fontSize: "24px", letterSpacing: "10px" }}
                      placeholder="000000"
                      maxLength={6}
                      required 
                      autoFocus
                    />
                    <small className="text-muted d-block text-center mt-2">
                      Code expires in 5 minutes
                    </small>
                  </div>
                  
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-muted mb-2">Didn't receive the code?</p>
                    <button 
                      type="button"
                      onClick={handleRequestCode}
                      className="btn btn-link"
                      disabled={resending}
                    >
                      {resending ? "Sending..." : "Resend Code"}
                    </button>
                  </div>
                </>
              )}
              
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

export default UserVerification;
