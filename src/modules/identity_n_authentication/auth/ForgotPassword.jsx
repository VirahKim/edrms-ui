// src/modules/auth/ForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import authClient from "../../../api/authClient";

const ForgotPassword = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await authClient.post("/IAmAPI/api/auth/request-password-reset", {
        email_or_username: emailOrUsername
      }, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("Password reset requested:", response.data);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to request password reset");
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
              <div className="saprator my-3"><span>FORGOT PASSWORD</span></div>
              <h4 className="text-center f-w-500 mb-3">Reset your password</h4>
              
              {success ? (
                <div className="alert alert-success" role="alert">
                  Password reset link has been sent to your email. Please check your inbox and use the link to reset your password.                  
                </div>
              ) : (
                <>
                  <p className="text-muted mb-4">
                    Enter your email address or username and we'll send you a verification link to reset your password.
                  </p>
                  
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  
                  <div className="mb-3">
                    <input 
                      type="text" 
                      value={emailOrUsername} 
                      onChange={e => setEmailOrUsername(e.target.value)} 
                      className="form-control" 
                      placeholder="Email Address or Username"
                      required 
                    />
                  </div>
                  
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
