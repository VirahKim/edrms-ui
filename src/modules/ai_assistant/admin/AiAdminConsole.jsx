import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";

const ADMIN_SECTIONS = [
  {
    to: "/ai-assistant/admin/policies",
    icon: "ti-route",
    color: "linear-gradient(135deg,#007bff,#3395ff)",
    title: "Routing Policies",
    desc: "Inspect the model routing policies exposed by the gateway — primary model and fallback chain per policy.",
  },
  {
    to: "/ai-assistant/monitoring",
    icon: "ti-activity",
    color: "linear-gradient(135deg,#667eea,#764ba2)",
    title: "Monitoring",
    desc: "Live gateway health, provider availability, and tenant budget consumption.",
  },
  {
    to: "/ai-assistant/admin/error-logs",
    icon: "ti-alert-triangle",
    color: "linear-gradient(135deg,#e35d6a,#c0392b)",
    title: "Error Logs",
    desc: "Full gateway error details (rate limits, exhausted fallback chains) captured from chat sessions.",
  },
  {
    to: "/ai-assistant/chat",
    icon: "ti-sparkles",
    color: "linear-gradient(135deg,#f7971e,#ffd200)",
    title: "Open Chat",
    desc: "Jump back into the assistant to try a policy or verify a fix.",
  },
];

const AiAdminConsole = () => (
  <DashboardLayout>
    <div className="pc-content">
      <div className="mb-3">
        <h5 className="mb-0">AI Assistant Administration</h5>
        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
          Configuration and observability for the Enterprise AI Gateway used by QBits AI.
        </p>
      </div>
      <div className="row g-3">
        {ADMIN_SECTIONS.map((s) => (
          <div key={s.to} className="col-md-4 col-lg-3">
            <Link to={s.to} className="text-decoration-none">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ transition: "transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div className="card-body">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                    style={{ width: 52, height: 52, background: s.color }}
                  >
                    <i className={`ti ${s.icon} text-white`} style={{ fontSize: "1.5rem" }} />
                  </div>
                  <h6 className="fw-semibold mb-1">{s.title}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>{s.desc}</p>
                </div>
                <div className="card-footer bg-transparent border-top py-2">
                  <span className="text-primary" style={{ fontSize: "0.78rem" }}>
                    <i className="ti ti-arrow-right me-1" />Open
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default AiAdminConsole;
