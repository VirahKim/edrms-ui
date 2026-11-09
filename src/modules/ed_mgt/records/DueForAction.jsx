import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import EDMSPagination from "../components/EDMSPagination";
import { getDueForAction, reviewSchedule, initiateDisposal } from "../../../api/edmsApi";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";

const DueForAction = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDueForAction({ page, page_size: 25 });
      const d = res?.data;
      setItems(d?.items || []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch { toast.error("Failed to load due-for-action queue."); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action) => {
    setActionLoading((a) => ({ ...a, [id]: action }));
    try {
      if (action === "ARCHIVE") await reviewSchedule(id, { action: "ARCHIVE" });
      else if (action === "DISPOSE") await initiateDisposal(id);
      else await reviewSchedule(id, { action: "EXTEND" });
      toast.success(`${action} action applied.`);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Action failed."); }
    finally { setActionLoading((a) => ({ ...a, [id]: null })); }
  };

  const daysOverdue = (date) => date ? Math.floor((new Date() - new Date(date)) / 86400000) : null;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/ed-mgt/records" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left me-1"></i>Records
          </Link>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>Due for Action</span>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>Title</th>
                    <th>Phase</th>
                    <th>Action Due</th>
                    <th>Days Overdue</th>
                    <th style={{ width: 200 }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                      ))}</tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-5 text-muted">
                      <i className="ti ti-circle-check text-success" style={{ fontSize: 48 }}></i>
                      <p className="mt-2">No items require action right now.</p>
                    </td></tr>
                  ) : items.map((item) => {
                    const days = daysOverdue(item.action_due_date);
                    const busy = actionLoading[item.id];
                    return (
                      <tr key={item.id} className={days > 0 ? "table-danger-soft" : ""}>
                        <td><code className="text-primary" style={{ fontSize: "0.78rem" }}>{item.document_reference}</code></td>
                        <td>
                          <Link to={`/ed-mgt/documents/${item.document_id}`} className="text-decoration-none fw-semibold">
                            {item.document_title || item.title}
                          </Link>
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark" style={{ fontSize: "0.72rem" }}>
                            {item.current_phase?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>{fmtDate(item.action_due_date)}</td>
                        <td>
                          <span className={`fw-semibold ${days > 0 ? "text-danger" : days === 0 ? "text-warning" : "text-success"}`}>
                            {days > 0 ? `+${days}` : days === 0 ? "Today" : `${Math.abs(days)}d left`}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-outline-secondary" disabled={!!busy} onClick={() => doAction(item.id, "REVIEW")}>
                              {busy === "REVIEW" ? <span className="spinner-border spinner-border-sm"></span> : "Review"}
                            </button>
                            <button className="btn btn-outline-info" disabled={!!busy} onClick={() => doAction(item.id, "ARCHIVE")}>
                              {busy === "ARCHIVE" ? <span className="spinner-border spinner-border-sm"></span> : "Archive"}
                            </button>
                            <button className="btn btn-outline-danger" disabled={!!busy} onClick={() => doAction(item.id, "DISPOSE")}>
                              {busy === "DISPOSE" ? <span className="spinner-border spinner-border-sm"></span> : "Dispose"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-transparent px-4 py-3">
            <EDMSPagination page={page} totalPages={totalPages} totalCount={total}
              pageSize={25} onPageChange={setPage} onPageSizeChange={() => {}} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DueForAction;
