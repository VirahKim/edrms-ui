import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider from "../components/EDMSToast";

const StatCard = ({ icon, label, to, color, description }) => (
  <div className="col-md-3">
    <Link to={to} className="text-decoration-none">
      <div className="card border-0 shadow-sm h-100 hover-shadow" style={{ transition: "box-shadow 0.2s" }}>
        <div className="card-body text-center py-4">
          <div className={`avtar avtar-xl mx-auto mb-3 ${color}`}>
            <i className={`ti ${icon} f-28`}></i>
          </div>
          <h6 className="fw-semibold mb-1">{label}</h6>
          <small className="text-muted">{description}</small>
        </div>
      </div>
    </Link>
  </div>
);

const RecordsDashboard = () => {
  return (
  <DashboardLayout>
    <EDMSToastProvider />
    <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">Records Management</h4>
          <Link to="/ed-mgt/documents/duplicate-check" className="btn btn-sm btn-outline-secondary text-nowrap" title="Manually search for duplicate documents">
            <i className="ti ti-copy me-1" />Check Duplicates
          </Link>
        </div>
        <div className="alert alert-light border d-flex align-items-center gap-2 mb-3" style={{ fontSize: "0.85rem" }}>
          <i className="ti ti-info-circle flex-shrink-0"></i>
          <div>
            This section reviews retention schedules that already exist. To <strong>assign a new schedule</strong> to a
            document for the first time, open that document and use its <strong>Retention</strong> tab —
            {" "}<Link to="/ed-mgt/documents">go to Documents</Link> to pick one.
          </div>
        </div>
        <div className="row g-3">
          <StatCard icon="ti-calendar"           label="Retention Schedules" to="/ed-mgt/records/schedules"    color="bg-primary-subtle text-primary"  description="View and manage document retention schedules" />
          <StatCard icon="ti-alert-triangle"     label="Due for Action"      to="/ed-mgt/records/due-for-action" color="bg-danger-subtle text-danger"  description="Documents requiring immediate attention" />
          <StatCard icon="ti-lock"               label="Legal Holds"         to="/ed-mgt/records/legal-holds"  color="bg-warning-subtle text-warning"  description="Active and released legal holds" />
        </div>
    </div>
  </DashboardLayout>
  );
};

export default RecordsDashboard;
