// src/modules/auth/Login.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import authClient from "../../../api/authClient";
import { msalInstance, loginRequest, msalReady } from "./msalConfig";
import { formatErrorDisplay } from "../../../utils/errorHandler";
import { applySessionResponse } from "../../../utils/session";
import PasswordInput from "../../../components/PasswordInput";

// ── Info modal tab content ────────────────────────────────────────────────────

const PrivacyPolicy = () => (
  <div>
    <h6 className="fw-bold mb-3">Privacy Policy</h6>
    <p className="text-muted small">Last updated: January 2025</p>
    <p className="small">Q-BITS Systems is committed to protecting your personal information. This policy describes how we collect, use, and safeguard data within the Q-BITS EDMS platform.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>Data We Collect</h6>
    <p className="small text-muted">We collect information you provide when registering an account, uploading documents, or contacting support — including your name, email address, organisation details, and document metadata.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>How We Use Your Data</h6>
    <p className="small text-muted">Your data is used solely to provide and improve the EDMS service, enforce security policies, and respond to support requests. We do not sell or share your data with third parties.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>Data Retention</h6>
    <p className="small text-muted">Document records and audit logs are retained for the period specified in your organisation's archiving policy. Account data is removed within 30 days of account closure upon request.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>Your Rights</h6>
    <p className="small text-muted">You have the right to access, correct, or request deletion of your personal data. Contact your system administrator or reach us via the Support tab.</p>
  </div>
);

const TermsAndConditions = () => (
  <div>
    <h6 className="fw-bold mb-3">Terms &amp; Conditions</h6>
    <p className="text-muted small">Effective: January 2025</p>
    <p className="small">By accessing the Q-BITS EDMS platform you agree to be bound by these terms. Please read them carefully before use.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>1. Acceptable Use</h6>
    <p className="small text-muted">You may only use the platform for lawful business purposes within your organisation. Uploading malicious files, attempting unauthorised access, or circumventing security controls is strictly prohibited.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>2. Account Responsibility</h6>
    <p className="small text-muted">You are responsible for maintaining the confidentiality of your credentials. Any activity performed under your account is your responsibility.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>3. Intellectual Property</h6>
    <p className="small text-muted">The platform software, design, and branding are the intellectual property of Q-BITS Systems. Documents you upload remain your organisation's property.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>4. Limitation of Liability</h6>
    <p className="small text-muted">Q-BITS Systems shall not be liable for indirect or consequential losses arising from use of the platform. Maximum liability is limited to fees paid in the preceding three months.</p>
    <h6 className="fw-semibold mt-4 mb-2" style={{ fontSize: "0.85rem" }}>5. Changes to Terms</h6>
    <p className="small text-muted">We may update these terms with reasonable notice. Continued use of the platform after changes constitutes acceptance.</p>
  </div>
);

const SupportForm = () => (
  <div>
    <h6 className="fw-bold mb-1">Contact Support</h6>
    <p className="text-muted small mb-4">Fill in the form below and our team will get back to you within one business day.</p>
    <div className="mb-3">
      <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ letterSpacing: "0.05em" }}>Full name</label>
      <input className="form-control" placeholder="Your name" disabled />
    </div>
    <div className="mb-3">
      <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ letterSpacing: "0.05em" }}>Email address</label>
      <input type="email" className="form-control" placeholder="you@company.com" disabled />
    </div>
    <div className="mb-3">
      <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ letterSpacing: "0.05em" }}>Subject</label>
      <select className="form-select" disabled>
        <option>Select a topic…</option>
        <option>Login / Access issues</option>
        <option>Document upload</option>
        <option>Permissions</option>
        <option>Other</option>
      </select>
    </div>
    <div className="mb-4">
      <label className="form-label small fw-semibold text-uppercase text-secondary" style={{ letterSpacing: "0.05em" }}>Message</label>
      <textarea className="form-control" rows={4} placeholder="Describe your issue…" disabled />
    </div>
    <button className="btn w-100 fw-semibold" style={{ background: "#007bff", color: "#fff" }} disabled>
      Send message <span className="ms-1 badge bg-secondary fw-normal" style={{ fontSize: "0.7rem" }}>Coming soon</span>
    </button>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const Login = () => {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [showInfo, setShowInfo]   = useState(false);
  const [activeTab, setActiveTab] = useState("privacy");

  const completeMicrosoftLogin = async (idToken, fallbackEmail) => {
    // TEMP: local API has no "/IAmAPI" prefix (that's an IIS reverse-proxy
    // path used only in prod) and prod doesn't have this endpoint deployed yet.
    // Revert to authClient.post("/IAmAPI/api/auth/microsoft-login", ...) once
    // this is deployed to the live backend (apis.qbits.africa).
    const response = await authClient.post("https://localhost:7092/api/auth/microsoft-login", {
      id_token: idToken,
      device_info: navigator.userAgent
    }, {
      headers: { "Content-Type": "application/json" }
    });

    applySessionResponse(response.data, fallbackEmail);
  };

  // Picks up the response after loginRedirect() has navigated away to
  // Microsoft and back — MSAL resolves this on the same page load that
  // returns from Entra ID; it's a no-op (returns null) on a normal visit.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await msalReady;
        const result = await msalInstance.handleRedirectPromise();
        if (!result || cancelled) return;

        setMsLoading(true);
        await completeMicrosoftLogin(result.idToken, result.account?.username || "");
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(formatErrorDisplay(err));
      } finally {
        if (!cancelled) setMsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authClient.post("/IAmAPI/api/auth/login", {
        email_or_username: email,
        password,
        device_info: "",
      }, {
        headers: { "Content-Type": "application/json" }
      });

      // Passing the password too lets the next page (first-login password
      // change) pre-fill "Current Password" if this account turns out to
      // need one — see applySessionResponse in utils/session.js.
      applySessionResponse(response.data, email, password);
    } catch (err) {
      console.error(err);
      setError(formatErrorDisplay(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setMsLoading(true);
    setError("");

    try {
      await msalReady;
      // Navigates the whole tab to Microsoft; the app reloads once it comes
      // back, and the useEffect above picks up the result via handleRedirectPromise().
      await msalInstance.loginRedirect(loginRequest);
    } catch (err) {
      console.error(err);
      setError(formatErrorDisplay(err));
      setMsLoading(false);
    }
  };

  const tabs = [
    { id: "privacy", label: "Privacy Policy" },
    { id: "terms",   label: "Terms & Conditions" },
    { id: "support", label: "Support" },
  ];

  const glassInput = {
    background: "rgba(255,255,255,0.28)",
    border: "none",
    color: "#fff",
    borderRadius: 999,
    padding: "0.8rem 1.2rem",
  };

  return (
    <div
      className="min-vh-100 position-relative d-flex align-items-center justify-content-center overflow-hidden p-3"
      style={{
        backgroundImage: "url(/login-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>{`
        .edrms-input::placeholder { color: rgba(255,255,255,0.85); }
        .edrms-input:focus { background: rgba(255,255,255,0.4) !important; color: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.5); }
      `}</style>

      {/* Info icon — top right */}
      <button
        className="btn border-0 bg-transparent position-absolute top-0 end-0 p-4 d-flex align-items-center gap-1"
        style={{ zIndex: 20, color: "#fff" }}
        onClick={() => { setShowInfo(true); setActiveTab("privacy"); }}
        title="Privacy, Terms & Support"
      >
        <i className="ti ti-info-circle" style={{ fontSize: 22 }} />
        <span className="small fw-medium d-none d-md-inline">Help</span>
      </button>

      {/* ── Sign-in panel ── */}
      {!showInfo && (
        <div
          className="d-flex flex-column flex-md-row position-relative w-100"
          style={{
            maxWidth: 1080,
            minHeight: 620,
            zIndex: 10,
            borderRadius: 40,
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 12px 60px rgba(0,0,0,0.45)",
            overflow: "hidden",
          }}
        >
          {/* Left — branding */}
          <div
            className="d-flex flex-column align-items-center text-center text-white p-4 p-md-5"
            style={{ background: "#007bff", flex: "0 0 52%", borderRadius: 40 }}
          >
            <img src="/MOH_LOGO.png" alt="Ministry of Health" style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain" }} />
            <div className="flex-grow-1 d-flex align-items-center justify-content-center w-100">
              <h2 className="fw-semibold m-0 text-center" style={{ fontSize: "1.35rem", lineHeight: 1.4, color: "#fff" }}>
                State Department for Medical Services
                <br />
                <br />
                Electronic Document and Records Management System (EDRMS)
              </h2>
            </div>

            <div className="pt-4 w-100 d-flex flex-column align-items-center gap-2">
              <img src="/QBITS_ICON_PRIMARY.png" alt="Q-BITS Documents" height={40} />
              <span style={{ fontSize: "0.8rem" }}>Powered by Q-BITS AI Agents</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>A product of CodexAI Company Limited</span>
            </div>
          </div>

          {/* Right — form */}
          <div className="d-flex flex-column justify-content-center flex-grow-1 text-white p-4 p-md-5">
            <h1 className="fw-bold mb-2" style={{ fontSize: "2.2rem", color: "#fff" }}>Sign in to EDRMS</h1>
            <p className="mb-4" style={{ opacity: 0.9 }}>
              EDRMS uses your Q-BITS ERP account. Your role, department and data scope come from the ERP.
            </p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <input
                type="email"
                className="form-control edrms-input mb-3"
                style={glassInput}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Work Email"
                required
              />

              <PasswordInput
                className="edrms-input mb-2"
                style={{ ...glassInput, paddingRight: "2.8rem" }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
              />

              <div className="d-flex justify-content-end mb-3">
                <Link to="/forgot-password" className="small text-decoration-none fw-medium text-white">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn w-100 fw-semibold mb-3"
                disabled={loading}
                style={{ background: "#fff", color: "#007bff", borderRadius: 999, padding: "0.8rem" }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            <div className="d-flex align-items-center gap-2 mb-3">
              <hr className="flex-grow-1 m-0 border-light" />
              <span style={{ fontSize: "0.78rem", whiteSpace: "nowrap", opacity: 0.85 }}>or continue with</span>
              <hr className="flex-grow-1 m-0 border-light" />
            </div>

            <button
              type="button"
              className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ borderRadius: 999, padding: "0.7rem" }}
              onClick={handleMicrosoftLogin}
              disabled={msLoading}
            >
              <img src="/microsoft-logo.svg" height={18} alt="" />
              {msLoading ? "Signing in…" : "Continue with Microsoft"}
            </button>
          </div>
        </div>
      )}

      {/* ── Info overlay (replaces login card) ── */}
      {showInfo && (
        <div
          className="card border-0 rounded-4 position-relative"
          style={{
            width: 620,
            maxHeight: "82vh",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 40px rgba(0, 123, 255,0.12), 0 1px 12px rgba(0,0,0,0.07)",
          }}
        >
          {/* Modal header */}
          <div className="card-header bg-white border-bottom-0 d-flex align-items-center justify-content-between pt-4 px-5 pb-0 rounded-top-4">
            <ul className="nav nav-tabs border-0 gap-1">
              {tabs.map(t => (
                <li className="nav-item" key={t.id}>
                  <button
                    className={`nav-link border-0 fw-medium small px-3 py-2 rounded-3 ${activeTab === t.id ? "active text-white" : "text-muted bg-transparent"}`}
                    style={activeTab === t.id ? { background: "#007bff" } : {}}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="btn-close ms-3"
              onClick={() => setShowInfo(false)}
              title="Back to login"
              aria-label="Close"
            />
          </div>

          {/* Modal body — scrollable */}
          <div className="card-body px-5 py-4 overflow-auto">
            {activeTab === "privacy"  && <PrivacyPolicy />}
            {activeTab === "terms"    && <TermsAndConditions />}
            {activeTab === "support"  && <SupportForm />}
          </div>

          {/* Modal footer */}
          <div className="card-footer bg-white border-top rounded-bottom-4 px-5 py-3 d-flex justify-content-between align-items-center">
            <span className="text-muted" style={{ fontSize: "0.76rem" }}>
              © {new Date().getFullYear()} Q-BITS Systems
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowInfo(false)}
            >
              <i className="ti ti-arrow-left me-1" />
              Back to login
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
