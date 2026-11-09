import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getHrDashboard } from "../../../api/hrApi";
import { toast } from "../../ed_mgt/components/EDMSToast";

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "");

// Compact stat tile: label and figure on one line.
const Kpi = ({ label, value, tone = "primary", to }) => {
  const navigate = useNavigate();
  return (
    <div className="col-6 col-xl-3 mb-2">
      <div className="card border-0 shadow-sm h-100" style={{ cursor: to ? "pointer" : "default" }}
        onClick={() => to && navigate(to)}>
        <div className="card-body py-2 px-3 d-flex align-items-center justify-content-between gap-2">
          <div className="text-muted" style={{ fontSize: "0.75rem" }}>{label}</div>
          <div className={`fw-semibold text-${tone}`} style={{ fontSize: "1rem" }}>{value ?? 0}</div>
        </div>
      </div>
    </div>
  );
};

const WaitingList = ({ title, items, emptyText, linkTo }) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-2 px-3">
      <span className="fw-semibold small">{title}</span>
      <Link to={linkTo} className="small text-decoration-none">Open</Link>
    </div>
    <div className="card-body p-2">
      {items.length === 0 ? <div className="text-muted small px-2 py-3">{emptyText}</div> : (
        <ul className="list-unstyled mb-0 small">
          {items.map((it) => (
            <li key={`${it.id}-${it.status}`} className="border-bottom py-2 px-2">
              <div className="fw-semibold">{it.title}</div>
              <div className="text-muted">
                {it.detail}{it.due_on ? ` · ${fmt(it.due_on)}` : ""} · <span className="badge text-bg-light border">{it.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

/** Landing page for the HR records unit (personnel files, requisitions, missing files, transfers, closure). */
const HrRecordsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getHrDashboard()
      .then((res) => { if (!cancelled) setData(res?.data ?? res); })
      .catch((err) => { if (!cancelled) toast.error(err?.response?.data?.message || "Failed to load the HR dashboard."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="pc-content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <span className="spinner-border text-primary" role="status" />
        </div>
      </DashboardLayout>
    );
  }

  const d = data || {};
  const hr = "/ed-mgt/hr-records";

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
          <div>
            <h5 className="fw-semibold mb-1">HR Records</h5>
            <div className="text-muted small">Personnel files, requisitions, missing files, transfers and closure.</div>
          </div>
          <div className="d-flex gap-2">
            <Link to={hr} className="btn btn-sm btn-primary"><i className="ti ti-users me-1" />HR Records</Link>
            <Link to="/ed-mgt/file-routing" className="btn btn-sm btn-outline-primary"><i className="ti ti-send me-1" />File Routing</Link>
          </div>
        </div>

        <div className="row">
          <Kpi label="Active personnel files" value={d.personnel_files_active} to={hr} />
          <Kpi label="Missing personnel files" value={d.personnel_files_missing} tone="danger" to={hr} />
          <Kpi label="Incoming this month" value={d.incoming_this_month} to={hr} />
          <Kpi label="Digit holders not assigned" value={d.digit_holders_unassigned} tone="warning" to={hr} />
          <Kpi label="Requisitions to verify" value={d.requisitions_to_verify} tone="warning" to={hr} />
          <Kpi label="Files out on requisition" value={d.requisitions_out} to={hr} />
          <Kpi label="Missing files open" value={d.missing_open} tone="danger" to={hr} />
          <Kpi label="TY awaiting approval" value={d.temporary_files_pending} tone="warning" to={hr} />
          <Kpi label="Transfers to dispatch" value={d.transfers_to_dispatch} tone="warning" to={hr} />
          <Kpi label="Transfers to acknowledge" value={d.transfers_to_acknowledge} to={hr} />
          <Kpi label="Received files to acknowledge" value={d.transfers_in_to_acknowledge} to={hr} />
          <Kpi label="Closures awaiting approval" value={d.closures_pending} tone="warning" to={hr} />
          <Kpi label="Bring-ups due" value={d.bring_ups_due} tone="danger" to="/ed-mgt/records/bring-ups" />
          <Kpi label="Missing files escalated" value={d.missing_escalated} tone="danger" to={hr} />
        </div>

        <div className="row g-2 mt-1">
          <div className="col-lg-6"><WaitingList title="Requisitions to verify" items={d.requisitions_waiting || []}
            emptyText="No requisitions waiting." linkTo={hr} /></div>
          <div className="col-lg-6"><WaitingList title="Missing files" items={d.missing_waiting || []}
            emptyText="No missing files open." linkTo={hr} /></div>
          <div className="col-lg-6"><WaitingList title="Transfers" items={d.transfers_waiting || []}
            emptyText="No transfers waiting." linkTo={hr} /></div>
          <div className="col-lg-6"><WaitingList title="Bring-ups due" items={d.bring_ups || []}
            emptyText="Nothing due." linkTo="/ed-mgt/records/bring-ups" /></div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HrRecordsDashboard;
