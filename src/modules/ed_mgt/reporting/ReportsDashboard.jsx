import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import EDMSToastProvider from "../components/EDMSToast";
import { getReportCounts } from "../../../api/edmsApi";
import { FONT_FAMILY } from "../constants/fonts";

// ── Stat card: the whole card is a link to the matching report/list ─────
const StatCard = ({ icon, label, value, iconClass, subtext, to, loading }) => {
  const navigate = useNavigate();
  return (
    <div
      className="card border-0 shadow-sm h-100"
      style={{ cursor: "pointer" }}
      role="link"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => { if (e.key === "Enter") navigate(to); }}
    >
      <div className="card-body py-3 px-3">
        <div
          className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-2 ${iconClass}`}
          style={{ width: 44, height: 44 }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: "1.25rem" }} />
        </div>
        {loading ? (
          <div className="placeholder-glow">
            <span className="placeholder col-4 rounded d-block mb-1" style={{ height: 24 }} />
            <span className="placeholder col-8 rounded d-block" style={{ height: 12 }} />
          </div>
        ) : (
          <>
            <h3 className="mb-0 fw-bold">{value ?? 0}</h3>
            <p className="mb-1 text-muted" style={{ fontSize: "0.85rem" }}>{label}</p>
            {subtext && (
              <span className="fw-semibold" style={{ fontSize: "0.75rem", color: "#007bff" }}>
                {subtext} <i className="ti ti-arrow-right" />
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────
const ReportsDashboard = () => {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getReportCounts();
      setCounts(res?.data ?? res);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Dashboard load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const cards = [
    { icon: "ti-folders",           iconClass: "bg-primary-subtle text-primary",   label: "Total Files",       value: counts?.total_files,                       subtext: "View files",       to: "/ed-mgt/files" },
    { icon: "ti-files",             iconClass: "bg-success-subtle text-success",   label: "Total Documents",   value: counts?.total_documents,         subtext: "View documents",   to: "/ed-mgt/documents" },
    { icon: "ti-checklist",         iconClass: "bg-warning-subtle text-warning",   label: "Pending Tasks",     value: counts?.pending_tasks_count,     subtext: "View tasks",       to: "/ed-mgt/records/due-for-action" },
    { icon: "ti-shield-exclamation", iconClass: "bg-danger-subtle text-danger",    label: "SLA Breaches",      value: counts?.sla_breach_count,        subtext: "View SLA",         to: "/ed-mgt/sla" },
    { icon: "ti-calendar-due",      iconClass: "bg-info-subtle text-info",         label: "Expiring Soon",     value: counts?.expiring_soon_count,     subtext: "Within 30 days",   to: "/ed-mgt/documents?expiring=30" },
    { icon: "ti-file-off",          iconClass: "bg-secondary-subtle text-secondary", label: "Missing Documents", value: counts?.missing_documents_count, subtext: "View documents",   to: "/ed-mgt/documents" },
    { icon: "ti-lock",              iconClass: "bg-danger-subtle text-danger",     label: "Under Legal Hold",  value: counts?.under_legal_hold_count,  subtext: "View legal holds", to: "/ed-mgt/records/legal-holds" },
    { icon: "ti-trash",             iconClass: "bg-purple-subtle text-purple",     label: "Awaiting Disposal", value: counts?.awaiting_disposal_count, subtext: "View schedules",   to: "/ed-mgt/records/schedules?phase=DISPOSAL_PENDING" },
    { icon: "ti-eye",               iconClass: "bg-primary-subtle text-primary",   label: "OCR Review",        value: counts?.ocr_manual_review_count, subtext: "Review OCR",       to: "/ed-mgt/ocr/review" },
    { icon: "ti-scan",              iconClass: "bg-info-subtle text-info",         label: "OCR Jobs",          value: counts?.ocr_jobs_total,                  subtext: "View OCR jobs",    to: "/ed-mgt/ocr/jobs" },
  ];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h4 className="mb-0">Reports</h4>
          <div className="d-flex align-items-center gap-2">
            {lastRefresh && (
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={load}
              disabled={loading}
            >
              <i className="ti ti-refresh" />
              Refresh
            </button>
          </div>
        </div>

        <div className="row g-3">
          {cards.map((c) => (
            <div key={c.label} className="col-6 col-md-4 col-xl-3">
              <StatCard {...c} loading={loading} />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsDashboard;
