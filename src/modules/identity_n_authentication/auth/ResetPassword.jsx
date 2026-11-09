// src/modules/auth/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authClient from "../../../api/authClient";
import PasswordInput from "../../../components/PasswordInput";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const validatePassword = (pwd) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    return pwd.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      setError("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character");
      setLoading(false);
      return;
    }

    try {
      const response = await authClient.post("/IAmAPI/api/auth/reset-password-with-token", {
        token: token,
        new_password: newPassword
      }, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("Password reset successful:", response.data);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid || !token) {
    return (
      <div className="auth-main">
        <div className="auth-wrapper v1">
          <div className="auth-form">
            <div className="card my-5">
              <div className="card-body text-center">
                <div className="text-center">
                  <a href="#"><img src="/QBITS_LOGO.png" height={60} alt="img" /></a>
                </div>
                <div className="saprator my-3"><span>INVALID LINK</span></div>
                <h4 className="text-center f-w-500 mb-3">Invalid Reset Link</h4>
                <p className="text-muted mb-4">
                  The password reset link is invalid or has expired.
                </p>
                <Link to="/forgot-password" className="btn btn-primary">
                  Request New Reset Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-main">
      <div className="auth-wrapper v1">
        <div className="auth-form">
          <div className="card my-5">
            <form onSubmit={handleSubmit} className="card-body">
              <div className="text-center">
                <a href="#"><img src="/QBITS_LOGO.png" height={60} alt="img" /></a>
              </div>
              <div className="saprator my-3"><span>RESET PASSWORD</span></div>
              <h4 className="text-center f-w-500 mb-3">Create new password</h4>
              
              {success ? (
                <div className="alert alert-success" role="alert">
                  Password has been reset successfully! Redirecting to login...
                </div>
              ) : (
                <>
                  <p className="text-muted mb-4">
                    Enter your new password below.
                  </p>
                  
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  
                  <div className="mb-3">
                    <PasswordInput
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      required
                    />
                    <small className="text-muted">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </small>
                  </div>
                  
                  <div className="mb-3">
                    <PasswordInput
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      required
                    />
                  </div>
                  
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
