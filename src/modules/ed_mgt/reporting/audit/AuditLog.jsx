import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import EDMSPagination from "../../components/EDMSPagination";
import { getAuditLogs } from "../../../../api/edmsApi";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : "—";
const fmtRelative = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const CATEGORY_COLORS = {
  WORKFLOW:    "bg-primary",
  ACCESS:      "bg-info",
  CAPTURE:     "bg-success",
  RECORDS:     "bg-warning text-dark",
  ADMIN:       "bg-secondary",
  SECURITY:    "bg-danger",
  OCR:         "bg-purple",
  INTEGRATION: "bg-teal",
};

const humanLabel = (type) => type?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "—";

const CATEGORIES = ["CAPTURE","ACCESS","WORKFLOW","RECORDS","ADMIN","SECURITY","OCR","INTEGRATION"];

const AuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pageSize]            = useState(25);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded]     = useState({});
  const [catFilter, setCatFilter]   = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [docFilter, setDocFilter]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (catFilter)   params.event_category = catFilter;
      if (actorFilter) params.actor = actorFilter;
      if (docFilter)   params.document = docFilter;
      const res = await getAuditLogs(params);
      const d = res?.data;
      setLogs(d?.items || []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch { toast.error("Failed to load audit logs."); }
    finally { setLoading(false); }
  }, [page, pageSize, catFilter, actorFilter, docFilter]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const params = new URLSearchParams({ format: "csv" });
    if (catFilter)   params.set("event_category", catFilter);
    window.location.href = `/EDMSApi/api/audit/export?${params}`;
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0">Audit Log</h4>
        </div>
        {/* Filters */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body py-2">
            <div className="row g-2 align-items-center">
              <div className="col-md-3">
                <select className="form-select form-select-sm" value={catFilter}
                        onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <input type="text" className="form-control form-control-sm" placeholder="Filter by actor…"
                       value={actorFilter} onChange={(e) => { setActorFilter(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-3">
                <input type="text" className="form-control form-control-sm" placeholder="Filter by document…"
                       value={docFilter} onChange={(e) => { setDocFilter(e.target.value); setPage(1); }} />
              </div>
              <div className="col-md-3 d-flex gap-2 justify-content-end align-items-center">
                {(catFilter || actorFilter || docFilter) && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setCatFilter(""); setActorFilter(""); setDocFilter(""); setPage(1); }}>
                    <i className="ti ti-filter-off me-1"></i> Clear
                  </button>
                )}
                <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={handleExport}>
                  <i className="ti ti-download me-1"></i>Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Timestamp</th>
                    <th>Category</th>
                    <th>Event</th>
                    <th>Actor</th>
                    <th>Document</th>
                    <th>IP Address</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                      ))}</tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-5 text-muted">
                      <i className="ti ti-history" style={{ fontSize: 48 }}></i>
                      <p className="mt-2">No audit events found.</p>
                    </td></tr>
                  ) : logs.map((log, i) => (
                    <React.Fragment key={log.id || i}>
                      <tr>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span className="d-block" style={{ fontSize: "0.82rem" }}>{fmtRelative(log.occurred_at)}</span>
                          <small className="text-muted" style={{ fontSize: "0.72rem" }}>{fmtDate(log.occurred_at)}</small>
                        </td>
                        <td>
                          <span className={`badge ${CATEGORY_COLORS[log.event_category] || "bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
                            {log.event_category}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold">{humanLabel(log.event_type)}</div>
                          {log.event_description && (
                            <small className="text-muted">{log.event_description}</small>
                          )}
                          {log.version_id && (
                            <small className="text-muted d-block">Version #{log.version_id}</small>
                          )}
                        </td>
                        <td>
                          <span className="text-muted">{log.actor_name || `User #${log.actor_user_id}`}</span>
                          {log.actor_service && (
                            <small className="text-muted d-block">{log.actor_service}</small>
                          )}
                        </td>
                        <td>
                          {log.document_id ? (
                            <div>
                              <button className="btn btn-sm btn-link p-0 text-primary fw-semibold"
                                      onClick={() => navigate(`/ed-mgt/documents/${log.document_id}`)}>
                                {log.document_reference || `Doc #${log.document_id}`}
                              </button>
                              {log.document_title && (
                                <small className="text-muted d-block text-truncate" style={{ maxWidth: 160 }}>{log.document_title}</small>
                              )}
                            </div>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {log.actor_ip_address
                            ? <code style={{ fontSize: "0.75rem" }}>{log.actor_ip_address}</code>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {(log.new_values || log.old_values) && (
                            <button className="btn btn-sm btn-outline-secondary border-0"
                                    onClick={() => setExpanded((x) => ({ ...x, [i]: !x[i] }))}>
                              <i className={`ti ${expanded[i] ? "ti-chevron-up" : "ti-chevron-down"}`}></i>
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded[i] && (log.new_values || log.old_values) && (
                        <tr>
                          <td colSpan={7} className="bg-light">
                            <div className="p-3 d-flex gap-3 flex-wrap">
                              {log.old_values && (
                                <div style={{ flex: 1, minWidth: 200 }}>
                                  <small className="fw-semibold text-muted d-block mb-1">Before</small>
                                  <pre className="mb-0 rounded p-2 border" style={{ fontSize: "0.75rem", maxHeight: 160, overflow: "auto", backgroundColor: "var(--bs-card-bg, #fff)" }}>
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div style={{ flex: 1, minWidth: 200 }}>
                                  <small className="fw-semibold text-muted d-block mb-1">After</small>
                                  <pre className="mb-0 rounded p-2 border" style={{ fontSize: "0.75rem", maxHeight: 160, overflow: "auto", backgroundColor: "var(--bs-card-bg, #fff)" }}>
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-transparent px-4 py-3">
            <EDMSPagination page={page} totalPages={totalPages} totalCount={total}
              pageSize={pageSize} onPageChange={setPage} onPageSizeChange={() => {}} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLog;
