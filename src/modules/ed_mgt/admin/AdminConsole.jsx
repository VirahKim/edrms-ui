import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";

const ADMIN_SECTIONS = [
  {
    to: "/ed-mgt/admin/documents",
    icon: "ti-files",
    color: "linear-gradient(135deg,#003d80,#1a8cff)",
    title: "All Documents",
    desc: "Full document register with governance actions: approvals, locking, retention, access grants, OCR, and AI assist.",
  },
  {
    to: "/ed-mgt/admin/document-types",
    icon: "ti-file-description",
    color: "linear-gradient(135deg,#003d80,#007bff)",
    title: "Document Types",
    desc: "Define document types, metadata fields, OCR settings, and workflow process codes.",
  },
  {
    to: "/ed-mgt/admin/retention-rules",
    icon: "ti-calendar-time",
    color: "linear-gradient(135deg,#007bff,#66b0ff)",
    title: "Retention Rules",
    desc: "Define retention periods, triggers, and disposal methods that can be assigned to documents.",
  },
  {
    to: "/ed-mgt/admin/locations",
    icon: "ti-building-warehouse",
    color: "linear-gradient(135deg,#3d5a80,#98c1d9)",
    title: "Physical Locations",
    desc: "Define the Registries, Cabinets, and Shelves used to track where paper files are physically stored.",
  },
  {
    to: "/ed-mgt/letter-templates",
    icon: "ti-file-type-docx",
    color: "linear-gradient(135deg,#0b5ed7,#6ea8fe)",
    title: "Letter Templates",
    desc: "Create or upload the templates officers write replies on: official letters, memos, circulars, notices and minutes, with the logo, letterhead, signature and stamp sections.",
  },
  {
    to: "/ed-mgt/settings/external-accounts",
    icon: "ti-cloud",
    color: "linear-gradient(135deg,#0056b3,#4da3ff)",
    title: "Connected Accounts",
    desc: "Connect a Microsoft or Google account to enable cloud co-editing of documents in Word Online or Google Docs.",
  },
  {
    to: "/ed-mgt/settings/file-covers",
    icon: "ti-notebook",
    color: "linear-gradient(135deg,#0b5ea8,#4aa3f0)",
    title: "File Covers",
    desc: "Set the wording printed on every file cover (Republic of Kenya, the ministry) and the default cover colour.",
  },
  {
    to: "/ed-mgt/settings/org-stamps",
    icon: "ti-stamp",
    color: "linear-gradient(135deg,#7c4a02,#d99a3d)",
    title: "Org Stamps",
    desc: "Create org-owned digital stamps (e.g. Records Office) and manage who is authorized to apply each one.",
  },
  {
    to: "/ed-mgt/settings/esign-security",
    icon: "ti-shield-lock",
    color: "linear-gradient(135deg,#5b21b6,#a78bfa)",
    title: "Signing & Stamping Security",
    desc: "Require an emailed one-time code before a signature or stamp is accepted on a document — on or off, org-wide.",
  },
];

const AdminConsole = () => {
  return (
  <DashboardLayout>
    <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h4 className="mb-0">Admin Console</h4>
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
};

export default AdminConsole;
