import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import EDMSPagination from "../components/EDMSPagination";
import {
  getOCRJobs, getDocumentTypes, getDocuments, submitOCRJob, getVersions,
} from "../../../api/edmsApi";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const STATUS_MAP = {
  QUEUED:        { label: "Queued",         cls: "bg-secondary" },
  PROCESSING:    { label: "Processing",     cls: "bg-primary" },
  COMPLETED:     { label: "Completed",      cls: "bg-success" },
  FAILED:        { label: "Failed",         cls: "bg-danger" },
  MANUAL_REVIEW: { label: "Manual Review",  cls: "bg-warning text-dark" },
  ACCEPTED:      { label: "Accepted",       cls: "bg-info" },
  REJECTED:      { label: "Rejected",       cls: "bg-danger" },
};

const STATUSES = ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "MANUAL_REVIEW", "ACCEPTED", "REJECTED"];

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-secondary" };
  return (
    <span className={`badge ${s.cls}`} style={{ fontSize: "0.7rem" }}>
      {s.label}
    </span>
  );
};

const ConfidenceCell = ({ score }) => {
  if (score == null) return <span className="text-muted">—</span>;
  const pct = Math.round(score * 100);
  const cls = score >= 0.85 ? "success" : score >= 0.65 ? "warning" : "danger";
  return <span className={`fw-semibold text-${cls}`}>{pct}%</span>;
};

/* ── Submit OCR Job Modal ─────────────────────────────────── */
const SubmitJobModal = ({ onClose, onSubmitted }) => {
  const [documents, setDocuments]     = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docSearch, setDocSearch]     = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [versions, setVersions]       = useState([]);
  const [loadingVers, setLoadingVers] = useState(false);
  const [selectedVer, setSelectedVer] = useState("");
  const [priority, setPriority]       = useState(5);
  const [submitting, setSubmitting]   = useState(false);

  // Load documents once on open
  useEffect(() => {
    getDocuments({ page_size: 200, page: 1 })
      .then((r) => {
        // API returns either { items: [] } or { data: { items: [] } }
        const items = r?.items ?? r?.data?.items ?? [];
        setDocuments(items);
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, []);

  // Load versions whenever a document is selected
  useEffect(() => {
    if (!selectedDocId) { setVersions([]); setSelectedVer(""); return; }
    setLoadingVers(true);
    setVersions([]);
    setSelectedVer("");
    getVersions(Number(selectedDocId))
      .then((r) => {
        const vs = r?.data || [];
        setVersions(vs);
        const cur = vs.find((v) => v.is_current) || vs[0];
        if (cur) setSelectedVer(String(cur.id));
      })
      .catch(() => {})
      .finally(() => setLoadingVers(false));
  }, [selectedDocId]);

  const filteredDocs = docSearch.trim()
    ? documents.filter((d) => {
        const q = docSearch.toLowerCase();
        return (
          (d.title || "").toLowerCase().includes(q) ||
          (d.document_reference || "").toLowerCase().includes(q) ||
          (d.document_type_name || "").toLowerCase().includes(q)
        );
      })
    : documents;

  const selectedDoc = documents.find((d) => String(d.id) === selectedDocId);

  const handleSubmit = async () => {
    if (!selectedVer) { toast.error("Select a file version."); return; }
    setSubmitting(true);
    try {
      const res = await submitOCRJob({
        document_id: Number(selectedDocId),
        version_id: Number(selectedVer),
        priority,
      });
      toast.success(`OCR job #${res?.data?.id ?? ""} submitted.`);
      onSubmitted();
      onClose();
    } catch (e) {
      if (e?.response?.status === 409) {
        toast.error("An active OCR job already exists for this version.");
      } else {
        toast.error(e?.response?.data?.message || "Failed to submit OCR job.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVersion = versions.find((v) => String(v.id) === selectedVer);
  const isArchived = ["COLD", "GLACIER"].includes(selectedVersion?.storage_tier);

  return (
    <div className="modal fade show d-block"
         style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-scan me-2 text-primary"></i>New OCR Job
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">

            {/* Step 1: Document */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Document <span className="text-danger">*</span>
              </label>

              {/* Search filter */}
              <div className="input-group input-group-sm mb-1">
                <span className="input-group-text bg-transparent">
                  <i className="ti ti-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by title, reference, or type…"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                />
                {docSearch && (
                  <button className="btn btn-outline-secondary"
                          onClick={() => setDocSearch("")}>
                    <i className="ti ti-x"></i>
                  </button>
                )}
              </div>

              {loadingDocs ? (
                <div className="d-flex align-items-center gap-2 text-muted py-2">
                  <div className="spinner-border spinner-border-sm"></div>
                  <small>Loading documents…</small>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="border rounded text-muted small p-3 text-center">
                  No documents match your search.
                </div>
              ) : (
                <div className="border rounded"
                     style={{ maxHeight: 200, overflowY: "auto" }}>
                  {filteredDocs.map((d, i) => {
                    const isSelected = String(d.id) === selectedDocId;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDocId(String(d.id))}
                        style={{
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          padding: "7px 12px",
                          borderBottom: i < filteredDocs.length - 1
                            ? "1px solid #f0f0f0" : "none",
                          background: isSelected ? "#0d6efd" : "transparent",
                          color: isSelected ? "#fff" : "inherit",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {d.title || "Untitled"}
                        </span>
                        {d.document_reference && (
                          <span style={{
                            marginLeft: 8,
                            fontSize: "0.78rem",
                            opacity: isSelected ? 0.85 : 0.6,
                          }}>
                            {d.document_reference}
                          </span>
                        )}
                        {d.document_type_name && (
                          <span style={{
                            marginLeft: 6,
                            fontSize: "0.75rem",
                            opacity: isSelected ? 0.85 : 0.55,
                          }}>
                            · {d.document_type_name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Version */}
            {selectedDocId && (
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  File Version <span className="text-danger">*</span>
                </label>
                {loadingVers ? (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <div className="spinner-border spinner-border-sm"></div>
                    <small>Loading versions…</small>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-muted small">No versions available for this document.</div>
                ) : (
                  <select
                    className="form-select form-select-sm"
                    value={selectedVer}
                    onChange={(e) => setSelectedVer(e.target.value)}
                  >
                    <option value="">Select version…</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.version_label || `v${v.version_number}`}
                        {" — "}{v.original_filename}
                        {v.is_current ? " (Current)" : ""}
                        {["COLD","GLACIER"].includes(v.storage_tier) ? " ⚠ Archived" : ""}
                      </option>
                    ))}
                  </select>
                )}
                {isArchived && (
                  <div className="text-warning mt-1" style={{ fontSize: "0.8rem" }}>
                    <i className="ti ti-alert-triangle me-1"></i>
                    This version is archived. Restore it before running OCR.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Priority */}
            {selectedDocId && selectedVer && (
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Priority:{" "}
                  <span className="badge bg-primary">{priority}</span>
                  <small className="text-muted ms-2">(1 = lowest, 10 = highest)</small>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min={1} max={10}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>
            )}

            <div className="alert alert-info py-2 d-flex gap-2 align-items-start mb-0"
                 style={{ fontSize: "0.82rem" }}>
              <i className="ti ti-info-circle flex-shrink-0 mt-1"></i>
              <span>
                Only one active job per version is allowed. A 409 response means a
                QUEUED or PROCESSING job already exists for the selected version.
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={submitting || !selectedVer || !selectedDocId || isArchived}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>Submitting…</>
              ) : (
                <><i className="ti ti-scan me-1"></i>Submit OCR Job</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── OCR Job List ─────────────────────────────────────────── */
const OCRJobList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [docTypes, setDocTypes] = useState([]);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    getDocumentTypes({ page_size: 200 })
      .then((r) => setDocTypes(r?.data?.items || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter)   params.document_type_id = typeFilter;
      const res = await getOCRJobs(params);
      const d = res?.data;
      setJobs(d?.items || []);
      setTotal(d?.total_count || 0);
      setTotalPages(d?.total_pages || 1);
    } catch {
      toast.error("Failed to load OCR jobs.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setStatusFilter(""); setTypeFilter(""); setPage(1); };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0">OCR Jobs</h4>
        </div>
        {/* Filters */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body py-2">
            <div className="row g-2 align-items-center">
              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>
                  ))}
                </select>
              </div>
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
              <div className="col-md-6 d-flex gap-2 justify-content-end align-items-center">
                {(statusFilter || typeFilter) && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>
                    <i className="ti ti-filter-off me-1"></i>Clear
                  </button>
                )}
                <span className="text-muted ms-auto" style={{ fontSize: "0.875rem" }}>
                  {total} job{total !== 1 ? "s" : ""}
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => setShowSubmitModal(true)}>
                  <i className="ti ti-scan me-1"></i>New OCR Job
                </button>
                <Link to="/ed-mgt/ocr/review" className="btn btn-warning btn-sm">
                  <i className="ti ti-eye me-1"></i>Review Queue
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0"
                     style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Job</th>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Confidence</th>
                    <th>Engine</th>
                    <th>Queued At</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j}>
                            <div className="placeholder-glow">
                              <span className="placeholder col-8 rounded"></span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <i className="ti ti-scan" style={{ fontSize: 48 }}></i>
                        <p className="mt-2 mb-2">No OCR jobs found.</p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowSubmitModal(true)}
                        >
                          <i className="ti ti-scan me-1"></i>Submit Your First OCR Job
                        </button>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr
                        key={job.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/ed-mgt/ocr/jobs/${job.id}`)}
                      >
                        <td>
                          <span className="fw-semibold text-primary">#{job.id}</span>
                          {job.attempt_number > 0 && (
                            <small className="text-muted d-block">
                              Attempt {job.attempt_number + 1}/{job.max_attempts}
                            </small>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold text-truncate" style={{ maxWidth: 180 }}>
                            {job.document_title || "—"}
                          </div>
                          <small className="text-muted">{job.document_reference || ""}</small>
                        </td>
                        <td>
                          <span className="text-muted">{job.document_type_name || "—"}</span>
                        </td>
                        <td>
                          <StatusBadge status={job.status} />
                          {job.requires_manual_review && job.status !== "MANUAL_REVIEW" && (
                            <span className="badge bg-warning text-dark ms-1"
                                  style={{ fontSize: "0.6rem" }}>
                              review
                            </span>
                          )}
                        </td>
                        <td>
                          <ConfidenceCell score={job.overall_confidence} />
                        </td>
                        <td>
                          <span className="text-muted">{job.engine || "—"}</span>
                        </td>
                        <td>
                          <small className="text-muted">{fmtDate(job.queued_at)}</small>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-outline-primary border-0"
                            onClick={() => navigate(`/ed-mgt/ocr/jobs/${job.id}`)}
                            title="View job"
                          >
                            <i className="ti ti-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))
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

      {showSubmitModal && (
        <SubmitJobModal
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={load}
        />
      )}
    </DashboardLayout>
  );
};

export default OCRJobList;
