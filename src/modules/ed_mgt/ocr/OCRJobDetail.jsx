import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import DocumentPreviewPanel from "../components/DocumentPreviewPanel";
import {
  getOCRJob,
  cancelOCRJob,
  retryOCRJob,
  acceptOCRJob,
  rejectOCRJob,
  updateOCRField,
} from "../../../api/edmsApi";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
const fmtMs = (ms) => (ms != null ? `${(ms / 1000).toFixed(1)}s` : "—");

const STATUS_MAP = {
  QUEUED:        { label: "Queued",         cls: "bg-secondary",       icon: "ti-clock" },
  PROCESSING:    { label: "Processing",     cls: "bg-primary",         icon: "ti-loader" },
  COMPLETED:     { label: "Completed",      cls: "bg-success",         icon: "ti-circle-check" },
  FAILED:        { label: "Failed",         cls: "bg-danger",          icon: "ti-alert-circle" },
  MANUAL_REVIEW: { label: "Manual Review",  cls: "bg-warning text-dark", icon: "ti-eye" },
  ACCEPTED:      { label: "Accepted",       cls: "bg-info",            icon: "ti-thumb-up" },
  REJECTED:      { label: "Rejected",       cls: "bg-danger",          icon: "ti-thumb-down" },
};

const confidenceStyle = (score) => {
  if (score == null) return { cls: "secondary", pct: null };
  const pct = Math.round(score * 100);
  const cls = score >= 0.85 ? "success" : score >= 0.65 ? "warning" : "danger";
  return { cls, pct };
};

const OCRJobDetail = () => {
  const { jobId } = useParams();
  const navigate  = useNavigate();

  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("fields");
  const [fieldEdits, setFieldEdits] = useState({});
  const [savingField, setSavingField] = useState({});
  const [accepting, setAccepting]   = useState(false);
  const [rejecting, setRejecting]   = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying]     = useState(false);
  const pollRef = useRef(null);

  const fetchJob = useCallback(async () => {
    try {
      const res = await getOCRJob(jobId);
      const data = res?.data ?? res;
      setJob(data);
      return data;
    } catch {
      toast.error("Failed to load OCR job.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  // Poll every 4s while QUEUED or PROCESSING
  useEffect(() => {
    if (!job) return;
    const isActive = job.status === "QUEUED" || job.status === "PROCESSING";
    if (!isActive) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const updated = await fetchJob();
      if (updated && updated.status !== "QUEUED" && updated.status !== "PROCESSING") {
        clearInterval(pollRef.current);
      }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [job?.status, fetchJob]);

  // Seed editable field values when job loads
  useEffect(() => {
    if (!job?.extracted_fields) return;
    setFieldEdits((prev) => {
      const init = { ...prev };
      job.extracted_fields.forEach((f) => {
        if (!(f.id in init)) {
          init[f.id] = f.corrected_value ?? f.extracted_value ?? "";
        }
      });
      return init;
    });
  }, [job?.extracted_fields]);

  const handleFieldBlur = async (fieldId) => {
    const current = fieldEdits[fieldId];
    const field   = job.extracted_fields.find((f) => f.id === fieldId);
    if (!field) return;
    const original = field.corrected_value ?? field.extracted_value ?? "";
    if (current === original) return;

    setSavingField((s) => ({ ...s, [fieldId]: true }));
    try {
      await updateOCRField(jobId, fieldId, { corrected_value: current });
      setJob((prev) => ({
        ...prev,
        extracted_fields: prev.extracted_fields.map((f) =>
          f.id === fieldId ? { ...f, corrected_value: current, is_validated: true } : f
        ),
      }));
      toast.success("Field correction saved.");
    } catch {
      toast.error("Failed to save field correction.");
    } finally {
      setSavingField((s) => ({ ...s, [fieldId]: false }));
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptOCRJob(jobId);
      toast.success("OCR result accepted. Document metadata updated.");
      setJob((prev) => ({ ...prev, status: "ACCEPTED" }));
    } catch {
      toast.error("Failed to accept OCR result.");
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectOCRJob(jobId, { notes: rejectNotes });
      toast.success("OCR result rejected.");
      setJob((prev) => ({ ...prev, status: "REJECTED", last_error: rejectNotes }));
      setShowRejectModal(false);
      setRejectNotes("");
    } catch {
      toast.error("Failed to reject OCR result.");
    } finally {
      setRejecting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOCRJob(jobId);
      toast.success("Job cancelled.");
      setJob((prev) => ({ ...prev, status: "CANCELLED" }));
    } catch {
      toast.error("Failed to cancel job.");
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryOCRJob(jobId);
      toast.success("Job queued for retry.");
      await fetchJob();
    } catch {
      toast.error("Failed to retry job.");
    } finally {
      setRetrying(false);
    }
  };

  const isActive        = job && (job.status === "QUEUED" || job.status === "PROCESSING");
  const canAcceptReject = job && (job.status === "COMPLETED" || job.status === "MANUAL_REVIEW");
  const canCancel       = job && job.status === "QUEUED";
  const canRetry        = job &&
    (job.status === "FAILED" || job.status === "MANUAL_REVIEW") &&
    job.attempt_number < job.max_attempts;
  const maxAttemptsReached =
    job &&
    (job.status === "FAILED" || job.status === "MANUAL_REVIEW") &&
    job.attempt_number >= job.max_attempts;

  const statusInfo = job
    ? STATUS_MAP[job.status] || { label: job.status, cls: "bg-secondary", icon: "ti-question-mark" }
    : null;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        {/* Header */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : !job ? (
          <div className="alert alert-danger">
            <i className="ti ti-alert-circle me-2"></i>Job not found.
          </div>
        ) : (
          <>
            {/* Job summary card */}
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex flex-wrap gap-3 align-items-start justify-content-between">
                  <div>
                    <h4 className="mb-2">
                      {job.document_title || `Job #${job.id}`}
                    </h4>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className={`badge ${statusInfo.cls}`}>
                        <i className={`ti ${statusInfo.icon} me-1`}></i>
                        {statusInfo.label}
                      </span>
                      {job.document_reference && (
                        <span className="badge bg-light text-dark border">
                          {job.document_reference}
                        </span>
                      )}
                      {job.document_type_name && (
                        <span className="badge bg-light text-dark border">
                          {job.document_type_name}
                        </span>
                      )}
                      {job.engine && (
                        <span className="badge bg-light text-dark border">
                          <i className="ti ti-cpu me-1"></i>{job.engine}
                        </span>
                      )}
                      {job.template_name && (
                        <span className="badge bg-light text-dark border">
                          <i className="ti ti-template me-1"></i>{job.template_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-1">
                    {job.overall_confidence != null && (() => {
                      const { cls, pct } = confidenceStyle(job.overall_confidence);
                      return (
                        <div className="text-center px-3 border-end">
                          <div className={`fw-bold fs-5 text-${cls}`}>{pct}%</div>
                          <small className="text-muted">Confidence</small>
                        </div>
                      );
                    })()}
                    <div className="text-center px-3 border-end">
                      <div className="fw-bold fs-5">{job.page_count ?? "—"}</div>
                      <small className="text-muted">Pages</small>
                    </div>
                    <div className="text-center px-3 border-end">
                      <div className="fw-bold fs-5">
                        {job.attempt_number + 1}/{job.max_attempts}
                      </div>
                      <small className="text-muted">Attempts</small>
                    </div>
                    <div className="text-center px-3">
                      <div className="fw-bold fs-5">{fmtMs(job.processing_duration_ms)}</div>
                      <small className="text-muted">Duration</small>
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center gap-2 text-primary mb-1">
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      <small>
                        {job.status === "QUEUED"
                          ? "Waiting in queue — will refresh automatically…"
                          : "Processing document — will refresh automatically…"}
                      </small>
                    </div>
                    <div className="progress" style={{ height: 3 }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                )}

                {job.last_error && (
                  <div className="alert alert-danger mt-3 mb-0 py-2 d-flex align-items-center gap-2">
                    <i className="ti ti-alert-circle flex-shrink-0"></i>
                    <small>{job.last_error}</small>
                  </div>
                )}

                <div className="mt-3 d-flex gap-2 flex-wrap" style={{ fontSize: "0.8rem" }}>
                  {job.queued_at && (
                    <span className="text-muted">
                      <i className="ti ti-clock me-1"></i>Queued: {fmtDate(job.queued_at)}
                    </span>
                  )}
                  {job.started_at && (
                    <span className="text-muted">
                      <i className="ti ti-player-play me-1"></i>Started: {fmtDate(job.started_at)}
                    </span>
                  )}
                  {job.completed_at && (
                    <span className="text-muted">
                      <i className="ti ti-circle-check me-1"></i>Completed: {fmtDate(job.completed_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main two-column layout */}
            <div className="row g-3">
              {/* Left: Document preview */}
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm" style={{ minHeight: 500 }}>
                  <div className="card-header bg-transparent border-bottom">
                    <h6 className="mb-0">
                      <i className="ti ti-file me-2 text-primary"></i>Document Preview
                    </h6>
                  </div>
                  <div className="card-body p-2" style={{ minHeight: 460 }}>
                    <DocumentPreviewPanel
                      documentId={job.document_id}
                      versionId={job.version_id}
                      filename={job.original_filename}
                    />
                  </div>
                  {job.document_id && (
                    <div className="card-footer bg-transparent text-end">
                      <Link
                        to={`/ed-mgt/documents/${job.document_id}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="ti ti-external-link me-1"></i>Open Document
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Extracted data + actions */}
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent border-bottom">
                    <ul className="nav nav-tabs card-header-tabs">
                      <li className="nav-item">
                        <button
                          className={`nav-link ${tab === "fields" ? "active" : ""}`}
                          onClick={() => setTab("fields")}
                        >
                          <i className="ti ti-list-details me-1"></i>
                          Extracted Fields
                          {job.extracted_fields?.length > 0 && (
                            <span
                              className="badge bg-secondary ms-1"
                              style={{ fontSize: "0.65rem" }}
                            >
                              {job.extracted_fields.length}
                            </span>
                          )}
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link ${tab === "pages" ? "active" : ""}`}
                          onClick={() => setTab("pages")}
                        >
                          <i className="ti ti-file-text me-1"></i>
                          Page Text
                          {job.pages?.length > 0 && (
                            <span
                              className="badge bg-secondary ms-1"
                              style={{ fontSize: "0.65rem" }}
                            >
                              {job.pages.length}
                            </span>
                          )}
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="card-body p-0" style={{ minHeight: 380 }}>
                    {/* ── Extracted Fields tab ── */}
                    {tab === "fields" && (
                      <>
                        {!job.extracted_fields || job.extracted_fields.length === 0 ? (
                          <div className="text-center py-5 text-muted">
                            {isActive ? (
                              <>
                                <div className="spinner-border spinner-border-sm mb-2" role="status"></div>
                                <p className="mb-0">Extracting fields…</p>
                              </>
                            ) : (
                              <>
                                <i className="ti ti-database-off" style={{ fontSize: 40 }}></i>
                                <p className="mt-2 mb-0">No fields extracted.</p>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table
                              className="table align-middle mb-0"
                              style={{ fontSize: "0.875rem" }}
                            >
                              <thead className="table-light">
                                <tr>
                                  <th>Field</th>
                                  <th>Value</th>
                                  <th style={{ width: 90 }}>Confidence</th>
                                  <th style={{ width: 40 }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {job.extracted_fields.map((f) => {
                                  const { cls, pct } = confidenceStyle(f.confidence);
                                  const needsReview  = f.confidence != null && f.confidence < 0.8 && !f.corrected_value;
                                  return (
                                    <tr key={f.id} className={needsReview ? "table-warning" : ""}>
                                      <td>
                                        <div className="fw-semibold">{f.field_label}</div>
                                        <small
                                          className="text-muted font-monospace"
                                          style={{ fontSize: "0.72rem" }}
                                        >
                                          {f.field_code}
                                        </small>
                                        {f.is_validated && (
                                          <span
                                            className="badge bg-info ms-1"
                                            style={{ fontSize: "0.6rem" }}
                                          >
                                            corrected
                                          </span>
                                        )}
                                        {needsReview && (
                                          <span
                                            className="badge bg-warning text-dark ms-1"
                                            style={{ fontSize: "0.6rem" }}
                                          >
                                            review
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        {canAcceptReject ? (
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={fieldEdits[f.id] ?? ""}
                                            onChange={(e) =>
                                              setFieldEdits((prev) => ({
                                                ...prev,
                                                [f.id]: e.target.value,
                                              }))
                                            }
                                            onBlur={() => handleFieldBlur(f.id)}
                                            style={{ minWidth: 130 }}
                                          />
                                        ) : (
                                          <span>
                                            {f.corrected_value ?? f.extracted_value ?? "—"}
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        {pct != null ? (
                                          <div>
                                            <small className={`d-block fw-semibold text-${cls}`}>
                                              {pct}%
                                            </small>
                                            <div className="progress" style={{ height: 3 }}>
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
                                        {savingField[f.id] && (
                                          <div
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                          ></div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Pages tab ── */}
                    {tab === "pages" && (
                      <div style={{ maxHeight: 500, overflowY: "auto" }}>
                        {!job.pages || job.pages.length === 0 ? (
                          <div className="text-center py-5 text-muted">
                            {isActive ? (
                              <>
                                <div className="spinner-border spinner-border-sm mb-2" role="status"></div>
                                <p className="mb-0">Processing pages…</p>
                              </>
                            ) : (
                              <>
                                <i className="ti ti-file-text" style={{ fontSize: 40 }}></i>
                                <p className="mt-2 mb-0">No page data available.</p>
                              </>
                            )}
                          </div>
                        ) : (
                          job.pages.map((pg) => {
                            const { cls, pct } = confidenceStyle(pg.page_confidence);
                            return (
                              <div key={pg.id} className="border-bottom p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-semibold">Page {pg.page_number}</span>
                                  <div className="d-flex gap-2 align-items-center">
                                    {pg.language_detected && (
                                      <span className="badge bg-light text-dark border">
                                        {pg.language_detected}
                                      </span>
                                    )}
                                    {pct != null && (
                                      <span
                                        className={`badge bg-${cls} bg-opacity-15 text-${cls} border border-${cls}`}
                                        style={{ fontSize: "0.7rem" }}
                                      >
                                        {pct}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <pre
                                  className="bg-light rounded p-2 mb-0"
                                  style={{
                                    fontSize: "0.78rem",
                                    whiteSpace: "pre-wrap",
                                    maxHeight: 200,
                                    overflow: "auto",
                                  }}
                                >
                                  {pg.extracted_text || "(no text extracted)"}
                                </pre>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action bar */}
                  <div className="card-footer bg-transparent d-flex gap-2 flex-wrap justify-content-end py-3">
                    {canCancel && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={cancelling}
                        onClick={handleCancel}
                      >
                        {cancelling ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="ti ti-x me-1"></i>
                        )}
                        Cancel Job
                      </button>
                    )}
                    {canRetry && (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        disabled={retrying}
                        onClick={handleRetry}
                      >
                        {retrying ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="ti ti-refresh me-1"></i>
                        )}
                        Retry
                      </button>
                    )}
                    {maxAttemptsReached && (
                      <button className="btn btn-outline-secondary btn-sm" disabled>
                        <i className="ti ti-refresh me-1"></i>Max Attempts Reached
                      </button>
                    )}
                    {canAcceptReject && (
                      <>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setShowRejectModal(true)}
                        >
                          <i className="ti ti-thumb-down me-1"></i>Reject
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={accepting}
                          onClick={handleAccept}
                        >
                          {accepting ? (
                            <span className="spinner-border spinner-border-sm me-1"></span>
                          ) : (
                            <i className="ti ti-thumb-up me-1"></i>
                          )}
                          Accept &amp; Promote
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ti ti-thumb-down me-2 text-danger"></i>Reject OCR Result
                </h5>
                <button
                  className="btn-close"
                  onClick={() => { setShowRejectModal(false); setRejectNotes(""); }}
                ></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Rejection Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe why this OCR result is being rejected…"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => { setShowRejectModal(false); setRejectNotes(""); }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={rejecting}
                  onClick={handleReject}
                >
                  {rejecting && (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  )}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OCRJobDetail;
