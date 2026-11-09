import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import EDMSPagination from "../components/EDMSPagination";
import { getLegalHolds, releaseHold } from "../../../api/edmsApi";

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";

const LegalHolds = () => {
  const [holds, setHolds]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [releaseNotes, setReleaseNotes]   = useState("");
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLegalHolds({ page, page_size: 25 });
      const d = res?.data;
      setHolds(d?.items || []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch { toast.error("Failed to load legal holds."); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleRelease = async () => {
    if (!releaseTarget || !releaseNotes.trim()) { toast.error("Release notes are required."); return; }
    setReleasing(true);
    try {
      await releaseHold(releaseTarget.id, { notes: releaseNotes });
      toast.success("Legal hold released.");
      setReleaseTarget(null);
      setReleaseNotes("");
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Release failed."); }
    finally { setReleasing(false); }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/ed-mgt/records" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left me-1"></i>Records
          </Link>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>Legal Holds</span>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Hold Name</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    <th>Expected Release</th>
                    <th>Documents</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                      ))}</tr>
                    ))
                  ) : holds.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-5 text-muted">
                      <i className="ti ti-shield-off" style={{ fontSize: 48 }}></i>
                      <p className="mt-2">No legal holds found.</p>
                    </td></tr>
                  ) : holds.map((h) => (
                    <tr key={h.id}>
                      <td className="fw-semibold">{h.hold_name || h.name}</td>
                      <td className="text-muted">{h.created_by_name || h.created_by}</td>
                      <td>{fmtDate(h.created_at)}</td>
                      <td>{fmtDate(h.expected_release_date)}</td>
                      <td><span className="badge bg-secondary-subtle text-secondary">{h.document_count ?? "—"}</span></td>
                      <td>
                        <span className={`badge ${h.status === "ACTIVE" ? "bg-danger" : "bg-secondary"}`} style={{ fontSize: "0.72rem" }}>
                          {h.status}
                        </span>
                      </td>
                      <td>
                        {h.status === "ACTIVE" && (
                          <button className="btn btn-xs btn-outline-warning" style={{ padding: "2px 10px", fontSize: "0.75rem" }}
                                  onClick={() => setReleaseTarget(h)}>Release Hold</button>
                        )}
                      </td>
                    </tr>
                  ))}
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

      {releaseTarget && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Release Legal Hold</h5>
                <button className="btn-close" onClick={() => { setReleaseTarget(null); setReleaseNotes(""); }}></button>
              </div>
              <div className="modal-body">
                <p>Release hold: <strong>{releaseTarget.hold_name || releaseTarget.name}</strong></p>
                <p className="text-muted small">All documents under this hold will have their hold status lifted.</p>
                <div>
                  <label className="form-label fw-semibold">Release Notes <span className="text-danger">*</span></label>
                  <textarea className="form-control" rows={3} value={releaseNotes}
                            onChange={(e) => setReleaseNotes(e.target.value)}
                            placeholder="Explain the reason for releasing this hold…" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => { setReleaseTarget(null); setReleaseNotes(""); }}>Cancel</button>
                <button className="btn btn-warning" onClick={handleRelease} disabled={releasing || !releaseNotes.trim()}>
                  {releasing ? "Releasing…" : "Release Hold"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LegalHolds;
