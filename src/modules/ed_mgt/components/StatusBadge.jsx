import React from "react";

const STATUS_MAP = {
  LANDING:              { label: "Landing",              cls: "border border-info text-info",                                icon: "ti ti-inbox-in" },
  DRAFT:                { label: "Draft",                cls: "border border-secondary text-secondary",                     icon: "ti ti-file" },
  SUBMITTED:            { label: "Submitted",            cls: "border border-primary text-primary",                         icon: "ti ti-send" },
  PENDING_APPROVAL:     { label: "Pending Approval",     cls: "border border-warning text-warning",                         icon: "ti ti-clock" },
  APPROVED:             { label: "Approved",             cls: "border border-success text-success",                        icon: "ti ti-circle-check" },
  ACTIVE:               { label: "Active",               cls: "border border-success text-success",                        icon: "ti ti-circle-check" },
  REJECTED:             { label: "Rejected",             cls: "border border-danger text-danger",                          icon: "ti ti-circle-x" },
  RETURNED_FOR_REWORK:  { label: "Returned for Rework",  cls: "border",  style: { borderColor: "var(--bs-orange)", color: "var(--bs-orange)" }, icon: "ti ti-rotate-clockwise" },
  LOCKED:               { label: "Locked",               cls: "border border-secondary text-secondary",                     icon: "ti ti-lock" },
  UNDER_LEGAL_HOLD:     { label: "Under Legal Hold",     cls: "border border-warning text-warning",                         icon: "ti ti-lock" },
  ARCHIVED:             { label: "Archived",             cls: "border border-secondary text-muted",                        icon: "ti ti-archive" },
  DISPOSED:             { label: "Disposed",             cls: "border border-secondary text-muted text-decoration-line-through", icon: "ti ti-trash" },
  DELETED:              { label: "Deleted",              cls: "border border-danger text-danger",                          icon: "ti ti-trash" },
  REVIEW_PENDING:       { label: "Review Pending",       cls: "border border-warning text-warning",                         icon: "ti ti-clock" },
  DISPOSAL_PENDING:     { label: "Disposal Pending",     cls: "border",  style: { borderColor: "var(--bs-orange)", color: "var(--bs-orange)" }, icon: "ti ti-alert-triangle" },
};

const StatusBadge = ({ status, className = "" }) => {
  const cfg = STATUS_MAP[status] || { label: status || "—", cls: "border border-secondary text-secondary", icon: "ti ti-point" };
  return (
    <span className={`badge rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1 ${cfg.cls} ${className}`}
          style={{ fontSize: "0.72rem", fontWeight: 600, ...(cfg.style || {}) }}>
      <i className={cfg.icon} style={{ fontSize: "0.8rem" }} aria-hidden="true"></i>
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
