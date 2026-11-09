import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import EDMSPagination from "../components/EDMSPagination";
import ConfirmModal from "../components/ConfirmModal";
import { getSchedules, reviewSchedule, initiateDisposal, confirmDisposal } from "../../../api/edmsApi";

const PHASE_BADGE = {
  ACTIVE:           "bg-secondary text-white",
  REVIEW_PENDING:   "bg-warning text-dark",
  ARCHIVED:         "bg-info text-white",
  DISPOSAL_PENDING: "bg-orange text-white",
  DISPOSED:         "bg-dark text-white",
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";

const daysOverdue = (date) => {
  if (!date) return null;
  return Math.floor((new Date() - new Date(date)) / 86400000);
};

const RetentionSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [phaseFilter, setPhaseFilter] = useState("");

  const [reviewModal, setReviewModal] = useState(null);
  const [reviewAction, setReviewAction] = useState("EXTEND");
  const [reviewDate, setReviewDate] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [disposeTarget, setDisposeTarget] = useState(null);
  const [disposeStep, setDisposeStep] = useState(1);
  const [disposing, setDisposing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (phaseFilter) params.phase = phaseFilter;
      const res = await getSchedules(params);
      const d = res?.data;
      setSchedules(d?.items || []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch { toast.error("Failed to load schedules."); }
    finally { setLoading(false); }
  }, [page, pageSize, phaseFilter]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      await reviewSchedule(reviewModal.id, { action: reviewAction, new_date: reviewDate, comment: reviewComment });
      toast.success("Schedule reviewed.");
      setReviewModal(null);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Review failed."); }
    finally { setReviewLoading(false); }
  };

  const handleDispose = async () => {
    if (!disposeTarget) return;
    setDisposing(true);
    try {
      if (disposeStep === 1) {
        await initiateDisposal(disposeTarget.id);
        setDisposeStep(2);
      } else {
        await confirmDisposal(disposeTarget.id, { confirmation: "DISPOSE" });
        toast.success("Disposal confirmed.");
        setDisposeTarget(null);
        setDisposeStep(1);
        load();
      }
    } catch (e) { toast.error(e?.response?.data?.message || "Disposal failed."); }
    finally { setDisposing(false); }
  };

  const PHASES = ["ACTIVE","REVIEW_PENDING","ARCHIVED","DISPOSAL_PENDING","DISPOSED"];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/ed-mgt/records" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left me-1"></i>Records
          </Link>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>Retention Schedules</span>
          <select className="form-select form-select-sm ms-auto" style={{ width: 200 }} value={phaseFilter}
            onChange={(e) => { setPhaseFilter(e.target.value); setPage(1); }}>
            <option value="">All phases</option>
            <option value="ACTIVE">Active</option>
            <option value="DISPOSAL_PENDING">Disposal pending</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
        <div className="alert alert-light border d-flex align-items-center gap-2 mb-3" style={{ fontSize: "0.85rem" }}>
          <i className="ti ti-info-circle flex-shrink-0"></i>
          <div>
            This list only shows documents that already have a schedule. To assign one for the first time, open the
            document and use its <strong>Retention</strong> tab.
          </div>
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
                    <th>Days</th>
                    <th>Created by</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                      ))}</tr>
                    ))
                  ) : schedules.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-5 text-muted">
                      <i className="ti ti-calendar-off" style={{ fontSize: 48 }}></i>
                      <p className="mt-2">No schedules found.</p>
                    </td></tr>
                  ) : schedules.map((s) => {
                    const days = daysOverdue(s.action_due_date);
                    return (
                      <tr key={s.id}>
                        <td><code className="text-primary" style={{ fontSize: "0.78rem" }}>{s.document_reference}</code></td>
                        <td><Link to={`/ed-mgt/documents/${s.document_id}`} className="text-decoration-none fw-semibold">{s.document_title || s.title}</Link></td>
                        <td><span className={`badge ${PHASE_BADGE[s.current_phase] || "bg-secondary"}`} style={{ fontSize: "0.72rem" }}>{s.current_phase?.replace(/_/g, " ")}</span></td>
                        <td>{fmtDate(s.action_due_date)}</td>
                        <td>
                          {days !== null && (
                            <span className={days > 0 ? "text-danger fw-semibold" : "text-muted"}>
                              {days > 0 ? `+${days} overdue` : days === 0 ? "Today" : `${Math.abs(days)}d left`}
                            </span>
                          )}
                        </td>
                        <td><span className="text-muted">{s.owner_name || "—"}</span></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-xs btn-outline-secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                                    onClick={() => setReviewModal(s)}>Review</button>
                            {["REVIEW_PENDING","DISPOSAL_PENDING"].includes(s.current_phase) && (
                              <button className="btn btn-xs btn-outline-danger" style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                                      onClick={() => { setDisposeTarget(s); setDisposeStep(1); }}>Dispose</button>
                            )}
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
              pageSize={pageSize} onPageChange={setPage} onPageSizeChange={() => {}} />
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Schedule</h5>
                <button className="btn-close" onClick={() => setReviewModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Action</label>
                  <select className="form-select" value={reviewAction} onChange={(e) => setReviewAction(e.target.value)}>
                    <option value="EXTEND">Extend</option>
                    <option value="ARCHIVE">Archive</option>
                    <option value="DISPOSE">Dispose</option>
                  </select>
                </div>
                {reviewAction === "EXTEND" && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">New Retention Date</label>
                    <input type="date" className="form-control" value={reviewDate}
                           onChange={(e) => setReviewDate(e.target.value)} />
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Comment</label>
                  <textarea className="form-control" rows={2} value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleReview} disabled={reviewLoading}>
                  {reviewLoading ? "Saving…" : "Save Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disposal two-step modal */}
      {disposeTarget && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-danger"><i className="ti ti-alert-triangle me-2"></i>Initiate Disposal</h5>
                <button className="btn-close" onClick={() => { setDisposeTarget(null); setDisposeStep(1); }}></button>
              </div>
              <div className="modal-body">
                {disposeStep === 1 ? (
                  <p>Are you sure you want to initiate disposal for <strong>{disposeTarget.document_title}</strong>?</p>
                ) : (
                  <div>
                    <p className="text-danger fw-semibold">This action is irreversible. The document will be permanently disposed.</p>
                    <p>Type <strong>DISPOSE</strong> to confirm:</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => { setDisposeTarget(null); setDisposeStep(1); }}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDispose} disabled={disposing}>
                  {disposing ? "Processing…" : disposeStep === 1 ? "Initiate Disposal" : "Confirm Disposal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RetentionSchedules;
