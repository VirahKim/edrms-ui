// src/modules/auth/UserRegistration.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";

const UserRegistration = () => {
  const [formData, setFormData] = useState({
    email_address: "",
    first_name: "",
    other_name: "",
    phone_number: "",
    requires_2fa: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await apiClient.post("/IAmAPI/api/users/applicants", formData, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("Registration successful:", response.data);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed");
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
              <div className="saprator my-3"><span>REGISTER</span></div>
              <h4 className="text-center f-w-500 mb-3">Create your account</h4>
              
              {success ? (
                <div className="alert alert-success" role="alert">
                  Registration successful! A temporary password has been sent to your email. 
                  Redirecting to login...
                </div>
              ) : (
                <>
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  
                  <div className="mb-3">
                    <input 
                      type="email" 
                      name="email_address"
                      value={formData.email_address} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Email Address"
                      required 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <input 
                      type="text" 
                      name="first_name"
                      value={formData.first_name} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="First Name"
                      required 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <input 
                      type="text" 
                      name="other_name"
                      value={formData.other_name} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Last Name"
                      required 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <input 
                      type="tel" 
                      name="phone_number"
                      value={formData.phone_number} 
                      onChange={handleChange} 
                      className="form-control" 
                      placeholder="Phone Number (e.g., +254712345678)"
                      required 
                    />
                  </div>
                  
                  <div className="form-check mb-3">
                    <input 
                      className="form-check-input input-primary" 
                      type="checkbox" 
                      name="requires_2fa"
                      checked={formData.requires_2fa}
                      onChange={handleChange}
                      id="requires2fa" 
                    />
                    <label className="form-check-label text-muted" htmlFor="requires2fa">
                      Enable Two-Factor Authentication (2FA)
                    </label>
                  </div>
                  
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </button>
                  </div>
                </>
              )}
              
              <div className="d-flex justify-content-center mt-4">
                <span className="text-muted">Already have an account?</span>
                <Link to="/login" className="link-primary ms-2">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
