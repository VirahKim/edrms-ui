import React from "react";
import { Link } from "react-router-dom";

// One switcher shared by all three document-ingestion journeys (single upload,
// bulk upload, import from email) so moving between them feels like tabs on
// the same flow rather than three unrelated pages.
const TABS = [
  { key: "single", label: "Single Document",  icon: "ti-file",    to: "/ed-mgt/documents/upload" },
  { key: "bulk",    label: "Bulk Upload",      icon: "ti-stack-2", to: "/ed-mgt/documents/bulk-upload" },
  { key: "email",   label: "Import from Email", icon: "ti-mail",   to: "/ed-mgt/documents/import-email" },
];

const IngestionTabs = ({ active }) => (
  <div className="d-flex justify-content-center align-items-center gap-2 mb-2 flex-wrap">
    <div className="btn-group btn-group-sm" role="group">
      {TABS.map((t) => (
        t.key === active ? (
          <button key={t.key} type="button" className="btn btn-primary" disabled>
            <i className={`ti ${t.icon} me-1`}></i>{t.label}
          </button>
        ) : (
          <Link key={t.key} to={t.to} className="btn btn-outline-secondary">
            <i className={`ti ${t.icon} me-1`}></i>{t.label}
          </Link>
        )
      ))}
    </div>
  </div>
);

export default IngestionTabs;
