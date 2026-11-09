import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import EDMSPagination from "../../components/EDMSPagination";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import { getSLAReport } from "../../../../api/edmsApi";

const SLA_STATUSES = ["BREACHED", "AT_RISK", "ON_TRACK"];

const SLA_CLS = {
  BREACHED: "bg-danger",
  AT_RISK: "bg-warning text-dark",
  ON_TRACK: "bg-success",
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : "—";

const SLADashboard = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSLAReport({ page, page_size: pageSize, sla_status: statusFilter || undefined });
      const d = res?.data ?? res;
      setItems(Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch { toast.error("Failed to load SLA report."); }
    finally { setLoading(false); }
  }, [page, pageSize, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const breachedCount = items.filter((i) => i.sla_status === "BREACHED").length;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0"><i className="ti ti-alert-hexagon me-2 text-primary"></i>SLA Dashboard</h4>
        </div>

        <div className="alert alert-light border py-2 mb-3" style={{ fontSize: "0.85rem" }}>
          <i className="ti ti-info-circle me-1"></i>
          Read-only reporting on the 5-day approval SLA clock, measured from submission. There is no automatic
          escalation yet — breaches shown here need to be chased manually.
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom py-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <select className="form-select form-select-sm" style={{ width: "auto" }}
                value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All SLA Statuses</option>
                {SLA_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              {!loading && breachedCount > 0 && (
                <span className="badge bg-danger-subtle text-danger border">{breachedCount} breached on this page</span>
              )}
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Workflow Status</th>
                    <th>Submitted</th>
                    <th>SLA Due</th>
                    <th>SLA Status</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j}><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                        ))}
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="ti ti-circle-check" style={{ fontSize: 56, color: "#007bff" }}></i>
                          <h6 className="mt-3 mb-1">Nothing to show</h6>
                          <p className="small mb-0">No documents match this SLA filter right now.</p>
                        </div>
                      </td>
                    </tr>
                  ) : items.map((it) => (
                    <tr key={it.document_id}>
                      <td style={{ lineHeight: 1.3 }}>
                        <Link to={`/ed-mgt/documents/${it.document_id}`} className="text-decoration-none fw-semibold text-body d-block">
                          {it.document_title}
                        </Link>
                        <span className="fst-italic text-muted d-block" style={{ fontSize: "0.75rem" }}>{it.document_reference}</span>
                      </td>
                      <td><span className="text-muted">{it.document_type_name || "—"}</span></td>
                      <td><span className="badge bg-secondary">{it.workflow_status}</span></td>
                      <td className="text-muted">{fmtDate(it.submitted_at)}</td>
                      <td className="text-muted">{fmtDate(it.sla_due_at)}</td>
                      <td>
                        <span className={`badge ${SLA_CLS[it.sla_status] || "bg-secondary"}`}>{(it.sla_status || "").replace(/_/g, " ")}</span>
                        {it.hours_overdue > 0 && (
                          <span className="text-danger ms-2" style={{ fontSize: "0.78rem" }}>+{Math.round(it.hours_overdue)}h</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/ed-mgt/documents/${it.document_id}`} className="btn btn-sm btn-outline-primary border-0">
                          <i className="ti ti-arrow-right"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer bg-transparent border-top px-3 py-2">
            <EDMSPagination page={page} totalPages={totalPages} totalCount={total} pageSize={pageSize}
              onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SLADashboard;
