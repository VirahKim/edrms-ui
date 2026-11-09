import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import StatusBadge from "../components/StatusBadge";
import DocumentPreviewPanel from "../components/DocumentPreviewPanel";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import SubmitCommentModal from "../components/SubmitCommentModal";
import { FieldLabel } from "../components/Tooltip";
import FilePickerModal from "../files/fileModals/FilePickerModal";
import UploadVersionModal from "../components/UploadVersionModal";
import PhysicalEnclosuresPanel from "../components/PhysicalEnclosuresPanel";
import { isSubmittableStatus, isResubmission } from "../constants/documentStatus";
import {
  getDocument, getMetadataValues, getTypeFields, saveMetadataValues,
  getVersions, getDocumentHistory,
  getOCRJobs, submitOCRJob, acceptOCRJob, retryOCRJob,
  lockDocument,
  getDownloadUrl, addTag, removeTag,
  promoteVersion, restoreVersion,
  starDocument, unstarDocument,
  checkoutDocument, checkinDocument, declareRecord, unlockDocument,
  getRelationships, addRelationship, removeRelationship, getDocuments,
  getSchedules, getRetentionRules, scheduleRetention,
  updateDocument, getEffectivePermissions,
  getDocumentAccessPolicies, grantDocumentAccess, deleteDocumentAccessPolicy,
  queueAIJob, getAIResults, applyAIClassification, applyAITags, reviewAIResult,
  getConfidentialityLevels,
  getFilesByDocument, getFileTree, linkDocumentToFile, unlinkDocumentFromFile,
} from "../../../api/edmsApi";

// Response shapes vary by endpoint (raw array, {items}, {data}, {data:{items}}) — normalize defensively.
const unwrapArray = (r) =>
  Array.isArray(r) ? r
  : Array.isArray(r?.items) ? r.items
  : Array.isArray(r?.data) ? r.data
  : Array.isArray(r?.data?.items) ? r.data.items
  : [];

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
const fmtSize = (b) => {
  if (!b) return "—";
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const SCOPE_ICON = { ORGANIZATION: "ti-building", DEPARTMENT: "ti-users", PERSONAL: "ti-user", SHARED: "ti-share" };

/* ── Tab: Overview ─────────────────────────────────────────── */
const OverviewTab = ({ doc }) => {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(doc?.tags || []);
  const [tagLoading, setTagLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [fileTree, setFileTree] = useState([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileActionLoading, setFileActionLoading] = useState(false);

  const loadFiles = useCallback(() => {
    if (!doc?.id) return;
    setFilesLoading(true);
    getFilesByDocument(doc.id)
      .then((r) => setFiles(r?.data || []))
      .catch(() => {})
      .finally(() => setFilesLoading(false));
  }, [doc?.id]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const openFilePicker = async () => {
    if (fileTree.length === 0) {
      try {
        const r = await getFileTree();
        setFileTree(Array.isArray(r?.data) ? r.data : []);
      } catch { toast.error("Failed to load files."); return; }
    }
    setShowFilePicker(true);
  };

  const handleAssignFile = async (file) => {
    setFileActionLoading(true);
    try {
      await linkDocumentToFile(file.id, doc.id);
      toast.success(`Added to "${file.name}".`);
      setShowFilePicker(false);
      loadFiles();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to add to file.");
    } finally {
      setFileActionLoading(false);
    }
  };

  const handleRemoveFile = async (file) => {
    setFileActionLoading(true);
    try {
      await unlinkDocumentFromFile(file.id, doc.id);
      setFiles((f) => f.filter((x) => x.id !== file.id));
      toast.success(`Removed from "${file.name}".`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to remove from file.");
    } finally {
      setFileActionLoading(false);
    }
  };

  const handleAddTag = async (e) => {
    if (e.key !== "Enter" || !tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase();
    if (tags.includes(tag)) return;
    setTagLoading(true);
    try {
      await addTag(doc.id, tag);
      setTags((t) => [...t, tag]);
      setTagInput("");
    } catch { toast.error("Failed to add tag."); }
    finally { setTagLoading(false); }
  };

  const handleRemoveTag = async (tag) => {
    setTagLoading(true);
    try {
      await removeTag(doc.id, tag);
      setTags((t) => t.filter((x) => x !== tag));
    } catch { toast.error("Failed to remove tag."); }
    finally { setTagLoading(false); }
  };

  const cv = doc?.current_version;
  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <DocumentPreviewPanel documentId={doc?.id} versionId={cv?.id}
          mimeType={cv?.mime_type} filename={cv?.original_filename} />
      </div>
      <div className="col-lg-5">
        <div className="mb-3">
          <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: "0.72rem", letterSpacing: 1 }}>Document Details</h6>
          <table className="table table-sm table-borderless" style={{ fontSize: "0.875rem" }}>
            <tbody>
              {[
                ["Created by",     doc?.owner_user_name || (doc?.owner_user_id ? `User #${doc.owner_user_id}` : null)],
                ["Type",        doc?.document_type_name],
                ["Source",      doc?.source],
                ["Created",     fmtDate(doc?.created_at)],
                ["Expiry Date", doc?.expiry_date || "None"],
                doc?.submitted_by ? ["Submitted By", doc?.submitted_by_name || `User #${doc.submitted_by}`] : null,
                doc?.approved_by ? ["Approved By", doc?.approved_by_name || `User #${doc.approved_by}`] : null,
              ].filter(Boolean).map(([k, v]) => (
                <tr key={k}>
                  <td className="text-muted ps-0" style={{ width: "40%" }}>{k}</td>
                  <td className="fw-semibold pe-0">{v || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h6 className="text-uppercase text-muted mb-0" style={{ fontSize: "0.72rem", letterSpacing: 1 }}>Files</h6>
            <button className="btn btn-sm btn-link p-0" style={{ fontSize: "0.78rem" }}
                    onClick={openFilePicker} disabled={fileActionLoading}>
              <i className="ti ti-folder-plus me-1"></i>Add to File
            </button>
          </div>
          {filesLoading ? (
            <div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div>
          ) : files.length === 0 ? (
            <span className="text-muted small">Not filed in any file</span>
          ) : (
            <div className="d-flex flex-wrap gap-1">
              {files.map((f) => (
                <span key={f.id} className="badge bg-warning-subtle text-warning-emphasis d-flex align-items-center gap-1" style={{ fontSize: "0.78rem" }}>
                  <i className={`ti ${SCOPE_ICON[f.scope] || "ti-folder"}`}></i>
                  {f.name}
                  <button className="btn-close p-0 ms-1" style={{ fontSize: "0.55rem" }}
                          title={`Remove from "${f.name}"`}
                          onClick={() => handleRemoveFile(f)} disabled={fileActionLoading}></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-3">
          <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: "0.72rem", letterSpacing: 1 }}>Tags</h6>
          <div className="d-flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="badge bg-primary-subtle text-primary d-flex align-items-center gap-1">
                #{tag}
                <button className="btn-close p-0 ms-1" style={{ fontSize: "0.55rem" }}
                        onClick={() => handleRemoveTag(tag)} disabled={tagLoading}></button>
              </span>
            ))}
            {tags.length === 0 && <span className="text-muted small">No tags</span>}
          </div>
          <input type="text" className="form-control form-control-sm" placeholder="Add tag, press Enter…"
                 value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                 onKeyDown={handleAddTag} disabled={tagLoading} style={{ maxWidth: 220 }} />
        </div>

        {doc?.is_locked && (
          <div className="alert alert-warning d-flex gap-2 py-2">
            <i className="ti ti-lock"></i>
            <div><strong>Document is locked.</strong> No modifications permitted.{doc?.lock_reason && ` Reason: ${doc.lock_reason}`}</div>
          </div>
        )}
      </div>

      {showFilePicker && (
        <FilePickerModal
          title={`Add "${doc?.title}" to file…`}
          tree={fileTree}
          excludeIds={files.map((f) => f.id)}
          confirmLabel="Add Here"
          onPick={handleAssignFile}
          onClose={() => setShowFilePicker(false)}
        />
      )}
    </div>
  );
};

/* ── Tab: Metadata ─────────────────────────────────────────── */
const MetadataTab = ({ doc }) => {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editable = ["LANDING","RETURNED_FOR_REWORK"].includes(doc?.status);

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, vRes] = await Promise.all([
          getTypeFields(doc.document_type_id),
          getMetadataValues(doc.id),
        ]);
        setFields(fRes?.data || []);
        const map = {};
        (vRes?.data || []).forEach((v) => {
          map[v.field_code] = v.value_text ?? v.value_date ?? v.value_number ?? v.value_boolean ?? "";
        });
        setValues(map);
      } catch { toast.error("Failed to load metadata."); }
      finally { setLoading(false); }
    };
    if (doc?.document_type_id) load();
  }, [doc]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const vals = Object.entries(values).map(([code, val]) => {
        const field = fields.find((f) => f.field_code === code);
        const entry = { field_code: code, field_id: field?.id };
        switch (field?.field_type) {
          case "DATE": case "DATETIME": entry.value_date = val; break;
          case "NUMBER": entry.value_number = Number(val); break;
          case "BOOLEAN": entry.value_boolean = val; break;
          default: entry.value_text = String(val);
        }
        return entry;
      });
      await saveMetadataValues(doc.id, vals);
      toast.success("Metadata saved.");
    } catch { toast.error("Failed to save metadata."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      {fields.length === 0 && <p className="text-muted">No metadata fields defined for this document type.</p>}
      <div className="row g-3">
        {fields.map((f) => {
          const val = values[f.field_code] ?? "";
          const missing = f.is_mandatory && (val === "" || val === null || val === undefined);
          return (
            <div key={f.id} className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>
                {f.field_label}
                {f.is_mandatory && <span className="text-danger ms-1">*</span>}
              </label>
              {editable ? (
                <input type={f.field_type === "DATE" ? "date" : f.field_type === "NUMBER" ? "number" : "text"}
                       className={`form-control form-control-sm ${missing ? "border-warning" : ""}`}
                       value={val}
                       onChange={(e) => setValues((m) => ({ ...m, [f.field_code]: e.target.value }))} />
              ) : (
                <div className="form-control form-control-sm bg-light text-body">{val || <span className="text-muted">—</span>}</div>
              )}
              {missing && <div className="text-warning" style={{ fontSize: "0.78rem" }}>Mandatory — required before submission</div>}
            </div>
          );
        })}
      </div>
      {editable && fields.length > 0 && (
        <div className="mt-3">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</> : <><i className="ti ti-device-floppy me-1"></i>Save Metadata</>}
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Tab: Versions ─────────────────────────────────────────── */
const VersionsTab = ({ doc }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getVersions(doc.id);
      setVersions(res?.data || []);
    } catch { toast.error("Failed to load versions."); }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (v) => {
    try {
      const res = await getDownloadUrl(doc.id, v.id);
      const url = res?.data?.url;
      if (!url) { toast.error("Download link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get download link."); }
  };

  const handlePromote = async (v) => {
    try { await promoteVersion(doc.id, v.id); toast.success("Version promoted."); load(); }
    catch { toast.error("Promote failed."); }
  };

  const handleRestore = async (v) => {
    try { await restoreVersion(doc.id, v.id); toast.success("Restore requested."); load(); }
    catch { toast.error("Restore request failed."); }
  };

  const scanBadge = (status) => {
    const cfg = {
      CLEAN:    "bg-success",
      PENDING:  "bg-warning text-dark",
      INFECTED: "bg-danger",
    }[status] || "bg-secondary";
    return <span className={`badge ${cfg}`} style={{ fontSize: "0.7rem" }}>{status || "—"}</span>;
  };

  const tierBadge = (tier) => {
    const cfg = { HOT: "bg-primary", COLD: "bg-info", GLACIER: "bg-secondary" }[tier] || "bg-secondary";
    return <span className={`badge ${cfg}`} style={{ fontSize: "0.7rem" }}>{tier || "—"}</span>;
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <button className="btn btn-sm btn-primary" onClick={() => setShowUpload(true)}>
          <i className="ti ti-upload me-1"></i>Upload New Version
        </button>
      </div>
      {showUpload && (
        <UploadVersionModal
          documentId={doc.id}
          documentTitle={doc.title}
          nextVersionNumber={(doc.current_version_number || versions.length || 0) + 1}
          onClose={() => setShowUpload(false)}
          onUploaded={load}
        />
      )}
      <div className="table-responsive">
        <table className="table table-hover align-middle" style={{ fontSize: "0.875rem" }}>
          <thead className="table-light">
            <tr>
              <th>Version</th>
              <th>Filename</th>
              <th>Size</th>
              <th>Uploaded By</th>
              <th>Uploaded At</th>
              <th>Scan</th>
              <th>Tier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted py-4">No versions found.</td></tr>
            )}
            {versions.map((v) => (
              <tr key={v.id}>
                <td>
                  <span className="badge bg-secondary">{v.version_label || `v${v.version_number}`}</span>
                  {v.is_current && <span className="badge bg-success ms-1">Current</span>}
                </td>
                <td><i className="ti ti-file me-1 text-muted"></i>{v.original_filename}</td>
                <td>{fmtSize(v.file_size_bytes)}</td>
                <td>{v.uploaded_by_name || (v.uploaded_by ? `User #${v.uploaded_by}` : "—")}</td>
                <td title={fmtDate(v.uploaded_at)}>{fmtRelative(v.uploaded_at)}</td>
                <td>{scanBadge(v.virus_scan_status)}</td>
                <td>{tierBadge(v.storage_tier)}</td>
                <td>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDownload(v)} title="Download">
                      <i className="ti ti-download"></i>
                    </button>
                    {!v.is_current && v.is_available && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handlePromote(v)} title="Promote to current">
                        <i className="ti ti-arrow-up"></i>
                      </button>
                    )}
                    {["COLD","GLACIER"].includes(v.storage_tier) && (
                      <button className="btn btn-sm btn-outline-warning" onClick={() => handleRestore(v)} title="Restore">
                        <i className="ti ti-refresh"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Tab: OCR ──────────────────────────────────────────────── */
const OCR_STATUS_MAP = {
  QUEUED:        { label: "Queued",        cls: "bg-secondary" },
  PROCESSING:    { label: "Processing",    cls: "bg-primary" },
  COMPLETED:     { label: "Completed",     cls: "bg-success" },
  FAILED:        { label: "Failed",        cls: "bg-danger" },
  MANUAL_REVIEW: { label: "Manual Review", cls: "bg-warning text-dark" },
  ACCEPTED:      { label: "Accepted",      cls: "bg-info" },
  REJECTED:      { label: "Rejected",      cls: "bg-danger" },
};

const OCRTab = ({ doc }) => {
  const navigate = useNavigate();
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [versions, setVersions]       = useState([]);
  const [selectedVer, setSelectedVer] = useState("");
  const [priority, setPriority]       = useState(5);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getOCRJobs({ document_id: doc.id, page_size: 10 });
      setJobs(res?.data?.items || []);
    } catch { toast.error("Failed to load OCR data."); }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);

  // Load versions when modal opens
  useEffect(() => {
    if (!showModal) return;
    getVersions(doc.id).then((r) => {
      const vs = r?.data || [];
      setVersions(vs);
      const cur = vs.find((v) => v.is_current) || vs[0];
      if (cur) setSelectedVer(String(cur.id));
    }).catch(() => {});
  }, [showModal, doc.id]);

  // Poll every 4s while any job is active
  useEffect(() => {
    clearInterval(pollRef.current);
    const hasActive = jobs.some((j) => j.status === "QUEUED" || j.status === "PROCESSING");
    if (hasActive) pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [jobs, load]);

  const handleSubmit = async () => {
    if (!selectedVer) { toast.error("Select a file version."); return; }
    setSubmitting(true);
    try {
      await submitOCRJob({ document_id: doc.id, version_id: Number(selectedVer), priority });
      toast.success("OCR job submitted.");
      setShowModal(false);
      load();
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

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary"></div>
    </div>
  );

  const canRunNew = !jobs.some((j) => j.status === "QUEUED" || j.status === "PROCESSING");

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <i className="ti ti-scan me-2 text-primary"></i>OCR Jobs
          {jobs.length > 0 && (
            <span className="badge bg-secondary ms-2" style={{ fontSize: "0.68rem" }}>
              {jobs.length}
            </span>
          )}
        </h6>
        <div className="d-flex gap-2">
          {canRunNew && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <i className="ti ti-scan me-1"></i>Run OCR
            </button>
          )}
          <Link to="/ed-mgt/ocr/jobs" className="btn btn-outline-secondary btn-sm">
            <i className="ti ti-list me-1"></i>All Jobs
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="ti ti-scan-eye" style={{ fontSize: 48 }}></i>
          <p className="mt-2 mb-3">No OCR jobs for this document yet.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="ti ti-scan me-1"></i>Run OCR Now
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {jobs.map((job) => {
            const s = OCR_STATUS_MAP[job.status] || { label: job.status, cls: "bg-secondary" };
            const isActive = job.status === "QUEUED" || job.status === "PROCESSING";
            const pct = job.overall_confidence != null
              ? Math.round(job.overall_confidence * 100) : null;
            const confCls = pct == null ? "secondary"
              : pct >= 85 ? "success" : pct >= 65 ? "warning" : "danger";
            return (
              <div key={job.id} className="card border-0 bg-light">
                <div className="card-body py-2 px-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span className="fw-semibold text-primary me-2">Job #{job.id}</span>
                      <span className={`badge ${s.cls} me-1`} style={{ fontSize: "0.7rem" }}>
                        {s.label}
                      </span>
                      {job.engine && (
                        <span className="badge bg-light text-dark border ms-1"
                              style={{ fontSize: "0.65rem" }}>
                          {job.engine}
                        </span>
                      )}
                      {isActive && (
                        <span className="spinner-border spinner-border-sm ms-2 text-primary"
                              role="status"></span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {pct != null && (
                        <span className={`fw-semibold text-${confCls}`}
                              style={{ fontSize: "0.875rem" }}>
                          {pct}%
                        </span>
                      )}
                      <button
                        className="btn btn-sm btn-outline-primary border-0"
                        onClick={() => navigate(`/ed-mgt/ocr/jobs/${job.id}`)}
                        title="Open full job detail"
                      >
                        <i className="ti ti-external-link"></i>
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="progress mt-2" style={{ height: 2 }}>
                      <div className="progress-bar progress-bar-striped progress-bar-animated"
                           style={{ width: "100%" }}></div>
                    </div>
                  )}

                  {job.last_error && (
                    <small className="text-danger d-block mt-1">
                      <i className="ti ti-alert-circle me-1"></i>{job.last_error}
                    </small>
                  )}

                  <div className="d-flex gap-3 mt-1"
                       style={{ fontSize: "0.78rem", color: "#6c757d" }}>
                    {job.queued_at && (
                      <span>
                        <i className="ti ti-clock me-1"></i>
                        {new Date(job.queued_at).toLocaleString()}
                      </span>
                    )}
                    {job.page_count != null && (
                      <span><i className="ti ti-files me-1"></i>{job.page_count} pages</span>
                    )}
                    {job.original_filename && (
                      <span className="text-truncate" style={{ maxWidth: 220 }}>
                        <i className="ti ti-file me-1"></i>{job.original_filename}
                      </span>
                    )}
                  </div>

                  {/* Quick-action bar for reviewable jobs */}
                  {(job.status === "COMPLETED" || job.status === "MANUAL_REVIEW") && (
                    <div className="mt-2 d-flex gap-2">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={async () => {
                          try {
                            await acceptOCRJob(job.id);
                            toast.success("OCR result accepted. Metadata updated.");
                            load();
                          } catch { toast.error("Accept failed."); }
                        }}
                      >
                        <i className="ti ti-thumb-up me-1"></i>Accept
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => navigate(`/ed-mgt/ocr/jobs/${job.id}`)}
                      >
                        <i className="ti ti-eye me-1"></i>Review Fields
                      </button>
                    </div>
                  )}

                  {(job.status === "FAILED" || job.status === "MANUAL_REVIEW") &&
                   job.attempt_number < job.max_attempts && (
                    <div className="mt-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={async () => {
                          try {
                            await retryOCRJob(job.id);
                            toast.success("Job queued for retry.");
                            load();
                          } catch { toast.error("Retry failed."); }
                        }}
                      >
                        <i className="ti ti-refresh me-1"></i>Retry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit OCR Modal */}
      {showModal && (
        <div className="modal fade show d-block"
             style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ti ti-scan me-2 text-primary"></i>Run OCR
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    File Version <span className="text-danger">*</span>
                  </label>
                  {versions.length === 0 ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <div className="spinner-border spinner-border-sm"></div>
                      <small>Loading versions…</small>
                    </div>
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
                          {["COLD","GLACIER"].includes(v.storage_tier)
                            ? " ⚠ Archived" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  {versions.find((v) => String(v.id) === selectedVer &&
                    ["COLD","GLACIER"].includes(v.storage_tier)) && (
                    <div className="text-warning mt-1" style={{ fontSize: "0.8rem" }}>
                      <i className="ti ti-alert-triangle me-1"></i>
                      This version is archived. Restore it first before running OCR.
                    </div>
                  )}
                </div>
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
                <div className="alert alert-info py-2 d-flex gap-2 align-items-start mb-0"
                     style={{ fontSize: "0.82rem" }}>
                  <i className="ti ti-info-circle flex-shrink-0 mt-1"></i>
                  <span>
                    Only one active job per version is allowed. If a QUEUED or PROCESSING
                    job already exists for this version, the submission will be rejected.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary"
                        onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={submitting || !selectedVer ||
                    !!versions.find((v) => String(v.id) === selectedVer &&
                      ["COLD","GLACIER"].includes(v.storage_tier))}
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
      )}
    </div>
  );
};

/* ── Tab: Audit ─────────────────────────────────────────────── */
const AuditTab = ({ doc }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getDocumentHistory(doc.id, { page: 1, page_size: 50 })
      .then((r) => setEvents(r?.data?.items || []))
      .catch(() => toast.error("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [doc.id]);

  const CATEGORY_COLORS = {
    WORKFLOW: "bg-primary", ACCESS: "bg-info", CAPTURE: "bg-success",
    RECORDS: "bg-warning text-dark", ADMIN: "bg-secondary", SECURITY: "bg-danger",
  };

  const humanLabel = (type) => type?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || "—";

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;
  if (!events.length) return <div className="text-center py-4 text-muted"><i className="ti ti-history" style={{ fontSize: 48 }}></i><p className="mt-2">No audit events found.</p></div>;

  return (
    <div className="position-relative">
      <div style={{ borderLeft: "2px solid #dee2e6", paddingLeft: 24 }}>
        {events.map((e, i) => (
          <div key={e.id || i} className="mb-3 position-relative">
            <div className="position-absolute" style={{ left: -32, top: 6, width: 12, height: 12, borderRadius: "50%", background: "#007bff", border: "2px solid #fff", boxShadow: "0 0 0 2px #007bff" }}></div>
            <div className="card border-0 shadow-sm">
              <div className="card-body py-2 px-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className={`badge ${CATEGORY_COLORS[e.event_category] || "bg-secondary"} me-2`} style={{ fontSize: "0.68rem" }}>{e.event_category}</span>
                    <strong style={{ fontSize: "0.875rem" }}>{humanLabel(e.event_type)}</strong>
                  </div>
                  <small className="text-muted" title={fmtDate(e.occurred_at)}>{fmtRelative(e.occurred_at)}</small>
                </div>
                <small className="text-muted">{e.actor_name || `User #${e.actor_user_id}`}</small>
                {e.new_values && (
                  <div className="mt-1">
                    <button className="btn btn-sm btn-link p-0 text-muted" style={{ fontSize: "0.78rem" }}
                            onClick={() => setExpanded((x) => ({ ...x, [i]: !x[i] }))}>
                      {expanded[i] ? <><i className="ti ti-chevron-up me-1"></i>Hide details</> : <><i className="ti ti-chevron-down me-1"></i>Show details</>}
                    </button>
                    {expanded[i] && (
                      <pre className="bg-light rounded p-2 mt-1 text-wrap" style={{ fontSize: "0.75rem", maxHeight: 200, overflow: "auto" }}>
                        {JSON.stringify(e.new_values, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Tab: Retention ────────────────────────────────────────── */
const RetentionTab = ({ doc }) => {
  const [schedule, setSchedule] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ruleId, setRuleId] = useState("");
  const [triggerDate, setTriggerDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        getSchedules({ document_id: doc.id, page_size: 1 }),
        getRetentionRules({ is_active: true }),
      ]);
      setSchedule(unwrapArray(sRes)[0] || null);
      setRules(unwrapArray(rRes));
    } catch { toast.error("Failed to load retention data."); }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);

  const handleSchedule = async () => {
    if (!ruleId) { toast.error("Select a retention rule."); return; }
    setSaving(true);
    try {
      await scheduleRetention(doc.id, { retention_rule_id: Number(ruleId), trigger_date: triggerDate || undefined });
      toast.success("Retention schedule assigned.");
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to assign retention schedule."); }
    finally { setSaving(false); }
  };

  const PHASE_CLS = {
    ACTIVE: "bg-success", REVIEW_PENDING: "bg-warning text-dark",
    ARCHIVED: "bg-secondary", DISPOSAL_PENDING: "bg-orange", DISPOSED: "bg-dark",
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h6 className="mb-0"><i className="ti ti-clipboard-list me-2 text-primary"></i>Retention</h6>
      </div>

      {schedule ? (
        <div className="card border-0 bg-light">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <div className="fw-semibold">{schedule.retention_rule_name || `Rule #${schedule.retention_rule_id}`}</div>
                <small className="text-muted">Schedule #{schedule.id}</small>
              </div>
              <span className={`badge ${PHASE_CLS[schedule.current_phase] || "bg-secondary"}`}>
                {schedule.current_phase}
              </span>
            </div>
            <table className="table table-sm table-borderless mb-0" style={{ fontSize: "0.875rem" }}>
              <tbody>
                <tr><td className="text-muted ps-0" style={{ width: "40%" }}>Trigger Date</td><td className="fw-semibold">{fmtDate(schedule.trigger_date)}</td></tr>
                <tr><td className="text-muted ps-0">Action Due</td><td className="fw-semibold">{fmtDate(schedule.action_due_date)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-muted">No retention schedule assigned yet. Assigning one governs how long this document is kept and what happens to it afterward.</p>
          <div className="row g-3" style={{ maxWidth: 480 }}>
            <div className="col-12">
              <FieldLabel label="Retention Rule" required
                tooltip="Defines the retention period and disposal method that will apply once this document becomes a record." />
              <select className="form-select form-select-sm" value={ruleId} onChange={(e) => setRuleId(e.target.value)}>
                <option value="">Select rule…</option>
                {rules.map((r) => <option key={r.id} value={r.id}>{r.rule_name || r.name}</option>)}
              </select>
            </div>
            <div className="col-12">
              <FieldLabel label="Trigger Date" tooltip="When the retention clock starts. Leave blank to use today." />
              <input type="date" className="form-control form-control-sm" value={triggerDate} onChange={(e) => setTriggerDate(e.target.value)} />
            </div>
            <div className="col-12">
              <button className="btn btn-primary btn-sm" onClick={handleSchedule} disabled={saving || !ruleId}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Assigning…</> : <><i className="ti ti-clipboard-check me-1"></i>Assign Retention</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Tab: Access & Security ───────────────────────────────── */
const ACCESS_LEVELS = ["VIEW", "DOWNLOAD", "EDIT", "FULL"];

const AccessSecurityTab = ({ doc, onChanged }) => {
  const [perms, setPerms] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState(doc?.confidentiality_level || "INTERNAL");
  const [savingLevel, setSavingLevel] = useState(false);
  const [form, setForm] = useState({ grantee_type: "USER", grantee_id: "", access_level: "VIEW", expires_at: "" });
  const [granting, setGranting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const restricted = ["CONFIDENTIAL", "RESTRICTED", "SECRET"].includes(doc?.confidentiality_level);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, polRes] = await Promise.all([
        getEffectivePermissions(doc.id),
        getDocumentAccessPolicies(doc.id).catch(() => ({ data: [] })),
      ]);
      setPerms(pRes?.data || pRes);
      setPolicies(unwrapArray(polRes));
    } catch { toast.error("Failed to load access data."); }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getConfidentialityLevels()
      .then((r) => setConfidentialityLevels(unwrapArray(r)))
      .catch(() => {});
  }, []);

  const handleLevelChange = async () => {
    if (level === doc.confidentiality_level) return;
    setSavingLevel(true);
    try {
      await updateDocument(doc.id, { confidentiality_level: level });
      toast.success("Security classification updated.");
      onChanged?.();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to update classification."); }
    finally { setSavingLevel(false); }
  };

  const handleGrant = async () => {
    if (!form.grantee_id.trim()) { toast.error("Grantee is required."); return; }
    setGranting(true);
    try {
      await grantDocumentAccess(doc.id, {
        grantee_type: form.grantee_type,
        grantee_id: Number(form.grantee_id) || form.grantee_id,
        access_level: form.access_level,
        expires_at: form.expires_at || undefined,
      });
      toast.success("Access granted.");
      setForm((f) => ({ ...f, grantee_id: "" }));
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to grant access."); }
    finally { setGranting(false); }
  };

  const handleRevoke = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocumentAccessPolicy(doc.id, deleteTarget.id);
      toast.success("Access revoked.");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Failed to revoke access."); setDeleteTarget(null); }
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  const PERM_LABELS = [
    ["can_view", "View"], ["can_download", "Download"], ["can_edit", "Edit"],
    ["can_approve", "Approve"], ["can_archive", "Archive"], ["can_dispose", "Dispose"], ["can_manage_access", "Manage Access"],
  ];

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <h6 className="mb-0"><i className="ti ti-shield-lock me-2 text-primary"></i>Access & Security</h6>
      </div>

      <div className="mb-4" style={{ maxWidth: 420 }}>
        <FieldLabel label="Confidentiality Level"
          tooltip="PUBLIC and INTERNAL documents are visible org-wide by default. Only CONFIDENTIAL, RESTRICTED, or SECRET documents need explicit access grants below." />
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
            {confidentialityLevels.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button className="btn btn-outline-primary btn-sm" disabled={savingLevel || level === doc.confidentiality_level} onClick={handleLevelChange}>
            {savingLevel ? <span className="spinner-border spinner-border-sm"></span> : "Save"}
          </button>
        </div>
      </div>

      <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: "0.72rem", letterSpacing: 1 }}>Your Effective Permissions</h6>
      <div className="d-flex flex-wrap gap-2 mb-4">
        {PERM_LABELS.map(([k, label]) => (
          <span key={k} className={`badge d-flex align-items-center gap-1 ${perms?.[k] ? "bg-success-subtle text-success" : "bg-light text-muted border"}`}>
            <i className={`ti ${perms?.[k] ? "ti-check" : "ti-x"}`}></i>{label}
          </span>
        ))}
      </div>

      {restricted ? (
        <>
          <h6 className="text-uppercase text-muted mb-2" style={{ fontSize: "0.72rem", letterSpacing: 1 }}>Grant Access</h6>
          <div className="row g-2 align-items-end mb-3" style={{ maxWidth: 640 }}>
            <div className="col-auto">
              <label className="form-label small mb-1">Type</label>
              <select className="form-select form-select-sm" value={form.grantee_type} onChange={(e) => setForm((f) => ({ ...f, grantee_type: e.target.value }))}>
                <option value="USER">User</option>
                <option value="ROLE">Role</option>
                <option value="DEPARTMENT">Department</option>
              </select>
            </div>
            <div className="col-auto">
              <label className="form-label small mb-1">Grantee ID</label>
              <input className="form-control form-control-sm" style={{ width: 110 }} value={form.grantee_id}
                onChange={(e) => setForm((f) => ({ ...f, grantee_id: e.target.value }))} />
            </div>
            <div className="col-auto">
              <FieldLabel label="Access Level" tooltip="FULL includes manage-access rights. Prefer the narrowest level that gets the job done." />
              <select className="form-select form-select-sm" value={form.access_level} onChange={(e) => setForm((f) => ({ ...f, access_level: e.target.value }))}>
                {ACCESS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="col-auto">
              <label className="form-label small mb-1">Expires</label>
              <input type="date" className="form-control form-control-sm" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary btn-sm" onClick={handleGrant} disabled={granting}>
                {granting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-plus me-1"></i>Grant</>}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle" style={{ fontSize: "0.85rem" }}>
              <thead className="table-light"><tr><th>Grantee</th><th>Level</th><th>Expires</th><th></th></tr></thead>
              <tbody>
                {policies.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-3">No document-level grants yet.</td></tr>}
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td>{p.grantee_type}: {p.grantee_id}</td>
                    <td><span className="badge bg-primary-subtle text-primary">{p.access_level}</span></td>
                    <td>{p.expires_at ? fmtDate(p.expires_at) : "Never"}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(p)}><i className="ti ti-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="alert alert-light border py-2" style={{ fontSize: "0.85rem" }}>
          <i className="ti ti-info-circle me-1"></i>
          {level} documents are visible org-wide by default — no explicit grants needed. Raise the classification above to manage access here.
        </div>
      )}

      <ConfirmModal show={!!deleteTarget} title="Revoke Access?"
        message={deleteTarget ? `Revoke ${deleteTarget.access_level} access from ${deleteTarget.grantee_type} #${deleteTarget.grantee_id}?` : ""}
        confirmLabel="Revoke" danger onConfirm={handleRevoke} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

/* ── Tab: AI Assist ────────────────────────────────────────── */
const AIAssistCard = ({ doc, jobType, title, icon, tooltip, applyLabel, onApply, onApplyTags }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getAIResults(doc.id);
      const all = unwrapArray(res);
      setResults(all.filter((r) => r.job_type === jobType).sort((a, b) => (b.id || 0) - (a.id || 0)));
    } catch { /* silent — card just stays empty */ }
    finally { setLoading(false); }
  }, [doc.id, jobType]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    clearInterval(pollRef.current);
    if (running) pollRef.current = setInterval(load, 3000);
    return () => clearInterval(pollRef.current);
  }, [running, load]);

  const latest = results[0];

  const handleRun = async () => {
    setRunning(true);
    try {
      await queueAIJob({ document_id: doc.id, version_id: doc.current_version?.id, job_type: jobType });
      toast.success(`${title} job queued.`);
      setTimeout(load, 2000);
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to queue job."); setRunning(false); }
  };

  const handleAccept = async () => {
    try {
      await reviewAIResult(latest.id, { review_accepted: true });
      toast.success("Result accepted.");
      load();
    } catch { toast.error("Failed to accept result."); }
  };

  const handleApply = async () => {
    try {
      await onApply(latest.id);
      toast.success(`${applyLabel} applied.`);
      load();
    } catch { toast.error(`Failed to apply ${applyLabel.toLowerCase()}.`); }
  };

  const handleApplyTags = async () => {
    try {
      await onApplyTags(latest.id);
      toast.success("Suggested tags applied.");
      load();
    } catch { toast.error("Failed to apply tags."); }
  };

  useEffect(() => {
    if (latest && latest.classification_confidence != null) setRunning(false);
    if (latest && latest.extracted_entities != null) setRunning(false);
  }, [latest]);

  let suggestedTags = [];
  try { suggestedTags = latest?.suggested_tags ? JSON.parse(latest.suggested_tags) : []; } catch { /* not JSON */ }

  return (
    <div className="card border-0 bg-light h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="mb-0"><i className={`ti ${icon} me-2 text-primary`}></i>{title}</h6>
          <button className="btn btn-sm btn-outline-primary" onClick={handleRun} disabled={running}>
            {running ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-sparkles me-1"></i>Run</>}
          </button>
        </div>
        <p className="text-muted" style={{ fontSize: "0.8rem" }}>{tooltip}</p>

        {loading ? null : !latest ? (
          <div className="text-muted small">No results yet — run the job to get a suggestion.</div>
        ) : (
          <div>
            {latest.classification_suggestion && (
              <div className="mb-2">
                <span className="fw-semibold">{latest.classification_suggestion}</span>
                {latest.classification_confidence != null && (
                  <span className="badge bg-primary-subtle text-primary ms-2">{Math.round(latest.classification_confidence * 100)}%</span>
                )}
              </div>
            )}
            {suggestedTags.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mb-2">
                {suggestedTags.map((t) => <span key={t} className="badge bg-secondary-subtle text-secondary">#{t}</span>)}
              </div>
            )}
            {latest.extracted_entities && (
              <pre className="rounded p-2 mb-2" style={{ fontSize: "0.72rem", maxHeight: 140, overflow: "auto", backgroundColor: "var(--bs-card-bg, #fff)" }}>
                {(() => { try { return JSON.stringify(JSON.parse(latest.extracted_entities), null, 2); } catch { return latest.extracted_entities; } })()}
              </pre>
            )}
            <div className="d-flex gap-2">
              {!latest.is_reviewed && (
                <button className="btn btn-sm btn-success" onClick={handleAccept}><i className="ti ti-thumb-up me-1"></i>Accept</button>
              )}
              {latest.is_reviewed && onApply && (
                <button className="btn btn-sm btn-primary" onClick={handleApply}><i className="ti ti-check me-1"></i>Apply {applyLabel}</button>
              )}
              {latest.is_reviewed && onApplyTags && suggestedTags.length > 0 && (
                <button className="btn btn-sm btn-outline-primary" onClick={handleApplyTags}><i className="ti ti-tag me-1"></i>Apply Tags</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AIAssistTab = ({ doc }) => (
  <div>
    <div className="d-flex align-items-center gap-2 mb-3">
      <h6 className="mb-0"><i className="ti ti-brain me-2 text-primary"></i>AI Assist</h6>
    </div>
    <div className="row g-3">
      <div className="col-md-6">
        <AIAssistCard doc={doc} jobType="EXTRACT_ENTITIES" title="Auto Metadata Extraction" icon="ti-forms"
          tooltip="Extracts field values from the document text. Accepted values appear as AI-sourced suggestions on the Metadata tab."
          applyLabel={null} onApply={null} />
      </div>
      <div className="col-md-6">
        <AIAssistCard doc={doc} jobType="CLASSIFY" title="Classification" icon="ti-category-2"
          tooltip="Suggests a document type and tags. Applying writes the classification and/or tags onto this document."
          applyLabel="Classification" onApply={applyAIClassification} onApplyTags={applyAITags} />
      </div>
    </div>
  </div>
);

/* ── Tab: Related ──────────────────────────────────────────── */
const RELATIONSHIP_TYPES = ["SUPERSEDES", "AMENDS", "SUPPORTS", "REPLACES", "REFERENCES"];

const RelatedTab = ({ doc }) => {
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [relType, setRelType] = useState("REFERENCES");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getRelationships(doc.id);
      setRelations(unwrapArray(res));
    } catch { toast.error("Failed to load relationships."); }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      getDocuments({ text_query: search, page_size: 5 })
        .then((r) => setResults((r?.items || []).filter((d) => d.id !== doc.id)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search, doc.id]);

  const handleAdd = async () => {
    if (!targetId) { toast.error("Pick a document first."); return; }
    setAdding(true);
    try {
      await addRelationship(doc.id, { target_document_id: Number(targetId), relationship_type: relType });
      toast.success("Relationship added.");
      setSearch(""); setResults([]); setTargetId("");
      load();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to add relationship."); }
    finally { setAdding(false); }
  };

  const handleRemove = async (relId) => {
    try { await removeRelationship(doc.id, relId); toast.success("Relationship removed."); load(); }
    catch { toast.error("Failed to remove relationship."); }
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <h6 className="mb-3"><i className="ti ti-affiliate me-2 text-primary"></i>Related Documents</h6>

      <div className="d-flex flex-column gap-2 mb-3">
        {relations.length === 0 && <div className="text-muted small">No related documents yet.</div>}
        {relations.map((r) => (
          <div key={r.id} className="d-flex justify-content-between align-items-center card border-0 bg-light p-2 px-3">
            <div>
              <span className="badge bg-secondary me-2">{r.relationship_type}</span>
              <Link to={`/ed-mgt/admin/documents/${r.related_document_id}`}>{r.related_document_title || `Document #${r.related_document_id}`}</Link>
            </div>
            <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemove(r.id)}><i className="ti ti-x"></i></button>
          </div>
        ))}
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-5 position-relative">
              <label className="form-label small mb-1">Find document</label>
              <input className="form-control form-control-sm" placeholder="Search by title…" value={search}
                onChange={(e) => { setSearch(e.target.value); setTargetId(""); }} />
              {results.length > 0 && (
                <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10 }}>
                  {results.map((d) => (
                    <button key={d.id} type="button" className="list-group-item list-group-item-action py-1"
                      onClick={() => { setTargetId(String(d.id)); setSearch(d.title); setResults([]); }}>
                      {d.title} <small className="text-muted">({d.document_reference})</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="col-auto">
              <label className="form-label small mb-1">Relationship</label>
              <select className="form-select form-select-sm" value={relType} onChange={(e) => setRelType(e.target.value)}>
                {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding || !targetId}>
                {adding ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-plus me-1"></i>Add</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PhysicalEnclosuresPanel documentId={doc.id} />
    </div>
  );
};

/* ── Main Document Detail ─────────────────────────────────── */
const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [lockModal, setLockModal] = useState(false);
  const [lockReason, setLockReason] = useState("");

  const loadDoc = useCallback(async () => {
    try {
      const res = await getDocument(id);
      setDoc(res?.data || res);
    } catch { toast.error("Failed to load document."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadDoc(); }, [loadDoc]);

  const handleAction = async (action, payload = {}) => {
    setActionLoading(true);
    try {
      switch (action) {
        case "lock": await lockDocument(id, payload); toast.success("Document locked."); break;
        case "unlock": await unlockDocument(id, payload); toast.success("Document unlocked."); break;
        case "checkout": await checkoutDocument(id); toast.success("Checked out. It's yours to edit."); break;
        case "checkin": await checkinDocument(id); toast.success("Checked in."); break;
        case "declare": {
          await declareRecord(id);
          toast.success("Document declared an official record.");
          toast.info("Consider locking it now to prevent further edits.");
          break;
        }
      }
      loadDoc();
    } catch (e) { toast.error(e?.response?.data?.message || `${action} failed.`); }
    finally { setActionLoading(false); }
  };

  const handleDownload = async () => {
    try {
      const res = await getDownloadUrl(id, doc?.current_version?.id);
      const url = res?.data?.url;
      if (!url) { toast.error("Download link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get download link."); }
  };

  const handleToggleStar = async () => {
    if (!doc) return;
    const wasStarred = !!doc.is_starred;
    setDoc((d) => ({ ...d, is_starred: !wasStarred }));
    try {
      if (wasStarred) await unstarDocument(doc.id);
      else await starDocument(doc.id);
    } catch {
      setDoc((d) => ({ ...d, is_starred: wasStarred }));
      toast.error(wasStarred ? "Failed to unstar document." : "Failed to star document.");
    }
  };

  const TABS = [
    { key: "overview",  label: "Overview",  icon: "ti-layout" },
    { key: "metadata",  label: "Metadata",  icon: "ti-tags" },
    { key: "ai",        label: "AI Assist", icon: "ti-brain" },
    { key: "access",    label: "Access & Security", icon: "ti-shield-lock" },
    { key: "retention", label: "Retention", icon: "ti-clipboard-list" },
    { key: "versions",  label: "Versions",  icon: "ti-versions" },
    { key: "ocr",       label: "OCR",       icon: "ti-scan" },
    { key: "related",   label: "Related",   icon: "ti-affiliate" },
    { key: "audit",     label: "Audit",     icon: "ti-history" },
  ];

  if (loading) return (
    <DashboardLayout>
      <div className="pc-content d-flex justify-content-center align-items-center" style={{ minHeight: 400, fontFamily: FONT_FAMILY }}>
        <div className="spinner-border text-primary"></div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        {/* Duplicate banner */}
        {doc?.duplicate_of_document_id ? (
          <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3">
            <i className="ti ti-copy"></i>
            <div>This document was flagged as a possible duplicate. <Link to={`/ed-mgt/admin/documents/${doc.duplicate_of_document_id}`} className="fw-semibold">View the original document</Link>.</div>
          </div>
        ) : doc?.is_duplicate_flagged ? (
          <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3">
            <i className="ti ti-copy"></i>
            <div>This document was flagged as a possible duplicate. <Link to={`/ed-mgt/documents/duplicate-check?title=${encodeURIComponent(doc.title || "")}`} className="fw-semibold">Review possible matches</Link>.</div>
          </div>
        ) : null}

        {/* Header */}
        {/* Document header card */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <code className="text-primary" style={{ fontSize: "0.82rem" }}>{doc?.document_reference}</code>
                  <StatusBadge status={doc?.status} />
                  {doc?.confidentiality_level && (
                    <span className="badge bg-secondary-subtle text-secondary border">{doc.confidentiality_level}</span>
                  )}
                </div>
                <h4 className="mb-1 d-flex align-items-center gap-2">
                  {doc?.title}
                  <button className="btn btn-link p-0 border-0" title={doc?.is_starred ? "Unstar" : "Star"} onClick={handleToggleStar}>
                    <i className={`ti ti-star ${doc?.is_starred ? "text-warning" : "text-muted"}`} style={{ fontSize: "1.15rem" }}></i>
                  </button>
                </h4>
                <small className="text-muted">{doc?.document_type_name}</small>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={handleDownload}>
                  <i className="ti ti-download me-1"></i> Download
                </button>
                {isSubmittableStatus(doc?.status) && (
                  <button className="btn btn-sm btn-primary" onClick={() => setShowSubmitModal(true)} disabled={actionLoading}>
                    <i className="ti ti-send me-1"></i> {isResubmission(doc?.status) ? "Resubmit" : "Submit"}
                  </button>
                )}
                {!!doc?.workflow_id && ["SUBMITTED","PENDING_APPROVAL"].includes(doc?.status) && (
                  <button className="btn btn-sm btn-success" onClick={() => navigate(`/workflows/instances/${doc.workflow_id}`)} disabled={actionLoading}>
                    <i className="ti ti-clipboard-check me-1"></i> View / Act on Approval
                  </button>
                )}
                {["LANDING","RETURNED_FOR_REWORK"].includes(doc?.status) && !doc?.is_locked && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleAction("checkout")} disabled={actionLoading} title="Check out — reserve this document for editing">
                    <i className="ti ti-lock-open me-1"></i> Check Out
                  </button>
                )}
                {["LANDING","RETURNED_FOR_REWORK"].includes(doc?.status) && !doc?.is_locked && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleAction("checkin")} disabled={actionLoading} title="Check in — release without uploading a new version">
                    <i className="ti ti-lock-check me-1"></i> Check In
                  </button>
                )}
                {!doc?.is_official_record && (
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleAction("declare")} disabled={actionLoading} title="Declare as an official record">
                    <i className="ti ti-certificate me-1"></i> Declare Record
                  </button>
                )}
                {!doc?.is_locked ? (
                  <button className="btn btn-sm btn-outline-warning" onClick={() => { setLockReason(""); setLockModal(true); }} disabled={actionLoading}>
                    <i className="ti ti-lock me-1"></i> Lock
                  </button>
                ) : (
                  <button className="btn btn-sm btn-outline-warning" onClick={() => handleAction("unlock")} disabled={actionLoading}>
                    <i className="ti ti-lock-open me-1"></i> Unlock
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card-footer bg-transparent border-top-0 pt-0 px-3">
            <ul className="nav nav-tabs card-header-tabs border-0">
              {TABS.map((t) => (
                <li key={t.key} className="nav-item">
                  <button className={`nav-link border-0 ${activeTab === t.key ? "active fw-semibold" : "text-muted"}`}
                          onClick={() => setActiveTab(t.key)}>
                    <i className={`ti ${t.icon} me-1`}></i>{t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tab content */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {doc && activeTab === "overview"  && <OverviewTab  doc={doc} />}
            {doc && activeTab === "metadata"  && <MetadataTab  doc={doc} />}
            {doc && activeTab === "ai"        && <AIAssistTab  doc={doc} />}
            {doc && activeTab === "access"    && <AccessSecurityTab doc={doc} onChanged={loadDoc} />}
            {doc && activeTab === "retention" && <RetentionTab doc={doc} />}
            {doc && activeTab === "versions"  && <VersionsTab  doc={doc} />}
            {doc && activeTab === "ocr"       && <OCRTab       doc={doc} />}
            {doc && activeTab === "related"   && <RelatedTab   doc={doc} />}
            {doc && activeTab === "audit"     && <AuditTab     doc={doc} />}
          </div>
        </div>
      </div>

      {/* Submit / resubmit for approval */}
      {showSubmitModal && (
        <SubmitCommentModal
          documentId={id}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={loadDoc}
        />
      )}

      {/* Lock modal */}
      {lockModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="ti ti-lock me-2 text-warning"></i>Lock Document</h5>
                <button className="btn-close" onClick={() => setLockModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">Locking will prevent any further modifications to this document.</p>
                <label className="form-label fw-semibold">Lock Reason <span className="text-danger">*</span></label>
                <textarea className="form-control" rows={2} placeholder="Enter a reason for locking this document…"
                          value={lockReason} onChange={(e) => setLockReason(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setLockModal(false)}>Cancel</button>
                <button className="btn btn-warning" disabled={!lockReason.trim() || actionLoading}
                        onClick={() => { setLockModal(false); handleAction("lock", { lock_reason: lockReason.trim() }); }}>
                  {actionLoading ? <><span className="spinner-border spinner-border-sm me-1"></span>Locking…</> : "Lock Document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default DocumentDetail;
