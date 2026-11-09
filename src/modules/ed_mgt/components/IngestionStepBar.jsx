import React from "react";

// Same two-step shape (pick the file(s) -> details & metadata) across all
// three ingestion journeys — only the step labels differ.
const IngestionStepBar = ({ step, steps }) => (
  <div className="d-flex align-items-center justify-content-center mb-4">
    {steps.map((label, i) => {
      const idx = i + 1;
      const active = idx === step;
      const completed = idx < step;
      return (
        <React.Fragment key={idx}>
          <div className="d-flex flex-column align-items-center">
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                 style={{ width: 36, height: 36, fontSize: "0.85rem",
                          background: completed ? "#43e97b" : active ? "#007bff" : "#e9ecef",
                          color: (completed || active) ? "#fff" : "#6c757d" }}>
              {completed ? <i className="ti ti-check"></i> : idx}
            </div>
            <small className={`mt-1 ${active ? "fw-semibold text-primary" : "text-muted"}`} style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
              {label}
            </small>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: completed ? "#43e97b" : "#e9ecef", margin: "0 8px", marginTop: -18 }}></div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default IngestionStepBar;
