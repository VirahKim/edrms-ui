import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import EDMSPagination from "../components/EDMSPagination";
import { getManualReviewQueue, getDocumentTypes } from "../../../api/edmsApi";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const confidenceColor = (score) => {
  if (score == null) return "secondary";
  if (score >= 0.85) return "success";
  if (score >= 0.65) return "warning";
  return "danger";
};

const OCRReviewQueue = () => {
  const navigate = useNavigate();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [docTypes, setDocTypes] = useState([]);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    getDocumentTypes({ page_size: 200 })
      .then((r) => setDocTypes(r?.data?.items || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (typeFilter) params.document_type_id = typeFilter;
      const res = await getManualReviewQueue(params);
      const d = res?.data;
      setItems(d?.items || []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch {
      toast.error("Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0">OCR Manual Review</h4>
        </div>
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 py-2">
          <i className="ti ti-alert-triangle flex-shrink-0"></i>
          <small>
            Jobs are sorted by lowest confidence first. Review and correct any extracted
            fields before accepting so metadata is accurate.
          </small>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body py-2">
            <div className="row g-2 align-items-center">
              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Document Types</option>
                  {docTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-9 d-flex gap-2 justify-content-end align-items-center">
                {typeFilter && (
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => { setTypeFilter(""); setPage(1); }}
                  >
                    <i className="ti ti-filter-off me-1"></i>Clear
                  </button>
                )}
                <span className="text-muted ms-auto" style={{ fontSize: "0.875rem" }}>
                  {total} item{total !== 1 ? "s" : ""} pending review
                </span>
                <Link to="/ed-mgt/ocr/jobs" className="btn btn-outline-secondary btn-sm">
                  <i className="ti ti-list me-1"></i>All Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table
                className="table table-hover align-middle mb-0"
                style={{ fontSize: "0.875rem" }}
              >
                <thead className="table-light">
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Confidence</th>
                    <th>Fields to Review</th>
                    <th>Queued At</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j}>
                            <div className="placeholder-glow">
                              <span className="placeholder col-8 rounded"></span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <i
                          className="ti ti-circle-check"
                          style={{ fontSize: 48, color: "#28a745" }}
                        ></i>
                        <p className="mt-2 mb-1 fw-semibold text-success">
                          Review queue is empty
                        </p>
                        <small className="text-muted">
                          All OCR results have been reviewed.
                        </small>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const pct =
                        item.overall_confidence != null
                          ? Math.round(item.overall_confidence * 100)
                          : null;
                      const cls = confidenceColor(item.overall_confidence);
                      return (
                        <tr
                          key={item.job_id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/ed-mgt/ocr/jobs/${item.job_id}`)}
                        >
                          <td>
                            <div className="fw-semibold">
                              {item.document_title || "—"}
                            </div>
                            <small className="text-muted">{item.document_reference}</small>
                          </td>
                          <td>
                            <span className="text-muted">{item.document_type_name}</span>
                          </td>
                          <td>
                            {pct != null ? (
                              <div style={{ minWidth: 110 }}>
                                <div className="d-flex justify-content-between mb-1">
                                  <small className={`fw-semibold text-${cls}`}>{pct}%</small>
                                </div>
                                <div className="progress" style={{ height: 4 }}>
                                  <div
                                    className={`progress-bar bg-${cls}`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                item.fields_needing_review > 0
                                  ? "bg-warning text-dark"
                                  : "bg-success"
                              }`}
                            >
                              {item.fields_needing_review} field
                              {item.fields_needing_review !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">{fmtDate(item.queued_at)}</small>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => navigate(`/ed-mgt/ocr/jobs/${item.job_id}`)}
                            >
                              <i className="ti ti-eye me-1"></i>Review
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-transparent px-4 py-3">
            <EDMSPagination
              page={page}
              totalPages={totalPages}
              totalCount={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(ps) => { setPageSize(ps); setPage(1); }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OCRReviewQueue;
