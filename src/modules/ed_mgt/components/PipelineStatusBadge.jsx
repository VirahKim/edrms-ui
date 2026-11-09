import React from "react";

// Documents in the Landing Queue all share the same top-level status
// (LANDING) — this derives a more useful badge from the automated OCR/AI
// pipeline's own per-stage status instead, so the queue shows *why* a
// document is still sitting there (still running, failed, needs a human
// look) rather than one generic "Landing" badge for every row. Mirrors
// StatusBadge's visual language (rounded-pill, border + text color, icon).
const derive = ({ ocrStatus, aiStatus, virusScanStatus }) => {
  if (virusScanStatus === "INFECTED")
    return { label: "Threat Detected", cls: "border border-danger text-danger", icon: "ti-shield-x" };
  if (virusScanStatus === "PENDING")
    return { label: "Scanning for Viruses", cls: "border border-secondary text-secondary", icon: "ti-shield-half-filled" };

  if (ocrStatus === "FAILED")
    return { label: "Failed OCR", cls: "border border-danger text-danger", icon: "ti-alert-triangle" };
  if (aiStatus === "FAILED")
    return { label: "Failed Classification", cls: "border border-danger text-danger", icon: "ti-alert-triangle" };
  if (ocrStatus === "REJECTED")
    return { label: "OCR Rejected", cls: "border border-danger text-danger", icon: "ti-circle-x" };

  if (ocrStatus === "PENDING" || ocrStatus === "QUEUED" || ocrStatus === "PROCESSING")
    return { label: "Extracting Metadata", cls: "border border-info text-info", icon: "ti-scan" };
  if (aiStatus === "PENDING" || aiStatus === "PROCESSING")
    return { label: "Classifying", cls: "border border-info text-info", icon: "ti-sparkles" };

  if (ocrStatus === "MANUAL_REVIEW")
    return { label: "OCR Needs Review", cls: "border border-warning text-warning", icon: "ti-eye-search" };

  // OCR/AI are done (or never applied) — nothing left but a human to validate.
  return { label: "Awaiting Validation", cls: "border border-primary text-primary", icon: "ti-clipboard-check" };
};

const PipelineStatusBadge = ({ ocrStatus, aiStatus, virusScanStatus, className = "" }) => {
  const cfg = derive({ ocrStatus, aiStatus, virusScanStatus });
  return (
    <span className={`badge rounded-pill d-inline-flex align-items-center gap-1 px-2 py-1 ${cfg.cls} ${className}`}
          style={{ fontSize: "0.72rem", fontWeight: 600 }}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: "0.8rem" }} aria-hidden="true"></i>
      {cfg.label}
    </span>
  );
};

export default PipelineStatusBadge;
