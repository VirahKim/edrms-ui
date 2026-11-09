import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../../ed_mgt/components/EDMSToast";
import { getErrorLogs, removeErrorLog, clearErrorLogs } from "../errorLogStore";

const KIND_BADGE = {
  all_exhausted: { label: "All models exhausted", cls: "bg-danger-subtle text-danger-emphasis" },
  rate_limit: { label: "Rate limited", cls: "bg-warning-subtle text-warning-emphasis" },
  budget_exhausted: { label: "Budget exhausted", cls: "bg-warning-subtle text-warning-emphasis" },
  error: { label: "Error", cls: "bg-secondary-subtle text-secondary-emphasis" },
};

const LogEntry = ({ log, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const badge = KIND_BADGE[log.kind] || KIND_BADGE.error;

  return (
    <div className="card border-0 shadow-sm mb-2">
      <div className="card-body py-2 px-3">
        <div className="d-flex align-items-start gap-2">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className={`badge ${badge.cls}`} style={{ fontSize: "0.72rem" }}>{badge.label}</span>
              {log.policy && (
                <span className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>policy: {log.policy}</span>
              )}
              <small className="text-muted">{new Date(log.timestamp).toLocaleString()}</small>
            </div>
            <p className="mb-0 mt-1" style={{ fontSize: "0.85rem" }}>{log.message}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link p-0 text-muted"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand raw error"}
          >
            <i className={`ti ti-chevron-${expanded ? "up" : "down"} f-18`} />
          </button>
          <button type="button" className="btn btn-sm btn-link p-0 text-muted" onClick={() => onDismiss(log.id)} title="Dismiss">
            <i className="ti ti-x f-18" />
          </button>
        </div>
        {expanded && log.detail && (
          <pre
            className="mb-0 mt-2 p-2 bg-light rounded text-break"
            style={{ fontSize: "0.72rem", maxHeight: 280, overflowY: "auto", whiteSpace: "pre-wrap" }}
          >
            {log.detail}
          </pre>
        )}
      </div>
    </div>
  );
};

const AiErrorLogs = () => {
  const [logs, setLogs] = useState([]);

  const load = () => setLogs(getErrorLogs());

  useEffect(load, []);

  const handleDismiss = (id) => {
    removeErrorLog(id);
    load();
  };

  const handleClearAll = () => {
    clearErrorLogs();
    load();
    toast.success("Error log cleared.");
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content">
        <div className="d-flex align-items-center mb-3">
          <div className="flex-grow-1">
            <h5 className="mb-0">AI Gateway Error Logs</h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
              Full errors raised by the AI gateway (rate limits, exhausted fallback chains, etc), captured from chat sessions on this device.
            </p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={load}>
            <i className="ti ti-refresh me-1" />
            Refresh
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleClearAll} disabled={logs.length === 0}>
            <i className="ti ti-trash me-1" />
            Clear all
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="ti ti-file-off" style={{ fontSize: 36, color: "#cbd5e1" }} />
            <p className="mt-2 mb-0">No AI gateway errors logged on this device.</p>
          </div>
        ) : (
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} onDismiss={handleDismiss} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AiErrorLogs;
