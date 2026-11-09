import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import StatusBadge from "../../components/StatusBadge";
import DocumentPreviewPanel from "../../components/DocumentPreviewPanel";
import FileTreeSelect from "../../components/FileTreeSelect";
import {
  getDocument, updateDocument, submitDocument,
  getOCRJob, acceptOCRJob, submitOCRJob,
  getAIResults, queueAIJob, reviewAIResult, applyAIClassification,
  getTypeFields, getMetadataValues, saveMetadataValues,
  getDocumentTypes, getFileTree, getFilesByDocument,
  linkDocumentToFile, unlinkDocumentFromFile,
} from "../../../../api/edmsApi";
import { getValidationQueue, clearValidationQueue } from "../../utils/validationQueue";

const unwrapArray = (r) =>
  Array.isArray(r) ? r
  : Array.isArray(r?.items) ? r.items
  : Array.isArray(r?.data) ? r.data
  : Array.isArray(r?.data?.items) ? r.data.items
  : [];

/* ── OCR summary card ─────────────────────────────────────── */
const OcrCard = ({ doc, onAccepted }) => {
  // Tracks whichever job is currently being viewed — starts at the document's
  // latest job, but a rerun points this at the freshly-created job instead of
  // waiting on the parent to refetch the whole document.
  const [activeJobId, setActiveJobId] = useState(doc.ocr_job_id);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => { setActiveJobId(doc.ocr_job_id); }, [doc.ocr_job_id]);

  const load = useCallback(async () => {
    if (!activeJobId) { setLoading(false); return; }
    try {
      const res = await getOCRJob(activeJobId);
      setJob(res?.data ?? res);
    } catch { /* card just stays empty */ }
    finally { setLoading(false); }
  }, [activeJobId]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    clearInterval(pollRef.current);
    const active = job?.status === "QUEUED" || job?.status === "PROCESSING";
    if (active) pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
  }, [job?.status, load]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptOCRJob(activeJobId);
      toast.success("OCR result accepted.");
      load();
      onAccepted?.();
    } catch { toast.error("Failed to accept OCR result."); }
    finally { setAccepting(false); }
  };

  // Doesn't touch the existing job — submits a brand-new OCR job for the same
  // document/version, exactly like a first-time OCR request. Since each rerun
  // is its own fresh job (attempt_number starts back at 0), there's no
  // max-attempts ceiling here — this can be clicked again after every result,
  // failed or not.
  const handleRerun = async () => {
    if (!doc.current_version?.id) { toast.error("No current version to run OCR on."); return; }
    setRerunning(true);
    try {
      const res = await submitOCRJob({
        document_id: doc.id,
        version_id: doc.current_version.id,
        template_id: job?.template_id || undefined,
      });
      const newJobId = res?.data?.id;
      toast.success("OCR rerun started.");
      setJob(null);
      setActiveJobId(newJobId);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to rerun OCR.");
    } finally {
      setRerunning(false);
    }
  };

  if (!doc.is_scanned_document) {
    return (
      <div className="card border-0 h-100" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
        <div className="card-body">
          <h6 className="mb-1"><i className="ti ti-scan me-2 text-primary"></i>OCR</h6>
          <p className="text-muted mb-0" style={{ fontSize: "0.82rem" }}>Not a scanned document — no OCR is needed.</p>
        </div>
      </div>
    );
  }

  const pct = job?.overall_confidence != null ? Math.round(job.overall_confidence * 100) : null;
  const canAccept = job && (job.status === "COMPLETED" || job.status === "MANUAL_REVIEW");
  const isRunning = job && (job.status === "QUEUED" || job.status === "PROCESSING");
  // Any settled job (or none at all) can be (re)run — since each rerun is a
  // fresh job rather than a retry-in-place, there's no attempt cap to hit.
  const canRerun = !loading && !isRunning;

  return (
    <div className="card border-0 h-100" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="mb-0"><i className="ti ti-scan me-2 text-primary"></i>OCR</h6>
          {activeJobId && (
            <Link to={`/ed-mgt/ocr/jobs/${activeJobId}`} className="btn btn-sm btn-outline-primary">
              <i className="ti ti-list-details me-1"></i>Review Fields
            </Link>
          )}
        </div>
        {loading ? (
          <div className="text-muted small">Loading…</div>
        ) : !job ? (
          <div className="text-muted small mb-2">No OCR job found for this document.</div>
        ) : (
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="badge bg-secondary">{job.status}</span>
              {pct != null && (
                <span className={`badge ${pct >= 85 ? "bg-success" : pct >= 65 ? "bg-warning text-dark" : "bg-danger"}`}>{pct}% confidence</span>
              )}
              {job.extracted_fields?.length > 0 && (
                <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                  {job.extracted_fields.length} field{job.extracted_fields.length !== 1 ? "s" : ""} extracted
                </span>
              )}
            </div>
            {job.status === "FAILED" && (
              <div className="alert alert-warning py-2 px-2 mb-2" style={{ fontSize: "0.78rem" }}>
                {job.last_error && <div className="mb-1">{job.last_error}</div>}
                <i className="ti ti-info-circle me-1"></i>
                OCR failed — you don&rsquo;t have to wait on it. Set the document type &amp; file manually in the card above, and fill in metadata by hand below.
              </div>
            )}
          </div>
        )}
        {(canAccept || canRerun) && (
          <div className="d-flex gap-2 flex-wrap">
            {canAccept && (
              <button className="btn btn-sm btn-success" onClick={handleAccept} disabled={accepting}>
                {accepting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-thumb-up me-1"></i>}
                Accept &amp; Promote to Metadata
              </button>
            )}
            {canRerun && (
              <button className="btn btn-sm btn-outline-secondary" onClick={handleRerun} disabled={rerunning}>
                {rerunning ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-repeat me-1"></i>}
                {job ? "Rerun OCR" : "Run OCR"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Manual override — always visible, so the type/file never depend on
   OCR or AI classification having run (or gotten it right). Saving here
   refreshes the whole page's document via onDocUpdated, which is what keeps
   OcrCard/ClassificationCard/MetadataForm all in sync afterward. ────────── */
const TypeAndFileCard = ({ doc, docTypes, files, onDocUpdated }) => {
  const [typeId, setTypeId] = useState(String(doc.document_type_id || ""));
  const [savingType, setSavingType] = useState(false);

  const [currentFiles, setCurrentFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [fileId, setFileId] = useState("");
  const [savingFile, setSavingFile] = useState(false);

  useEffect(() => { setTypeId(String(doc.document_type_id || "")); }, [doc.document_type_id]);

  const loadFiles = useCallback(() => {
    setLoadingFiles(true);
    getFilesByDocument(doc.id)
      .then((r) => {
        const list = r?.data || [];
        setCurrentFiles(list);
        // Pre-fill the picker with whatever's currently linked — same as the
        // Document Type <select> showing its current value — so both controls
        // line up on one row instead of file needing an extra badge line above it.
        setFileId(list[0]?.id ? String(list[0].id) : "");
      })
      .catch(() => setCurrentFiles([]))
      .finally(() => setLoadingFiles(false));
  }, [doc.id]);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  const typeChanged = typeId !== "" && Number(typeId) !== doc.document_type_id;
  const currentFileId = currentFiles[0]?.id ? String(currentFiles[0].id) : "";
  const fileChanged = fileId !== currentFileId;

  const handleSaveType = async () => {
    setSavingType(true);
    try {
      await updateDocument(doc.id, { document_type_id: Number(typeId) });
      toast.success("Document type updated — metadata fields below now match it.");
      onDocUpdated();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update document type.");
    } finally {
      setSavingType(false);
    }
  };

  const handleSaveFile = async () => {
    setSavingFile(true);
    try {
      // Single-file assignment, mirroring how Single/Bulk Upload treat
      // file at creation time — drop any existing links before adding the new one.
      await Promise.all(currentFiles.map((f) => unlinkDocumentFromFile(f.id, doc.id)));
      if (fileId) await linkDocumentToFile(Number(fileId), doc.id);
      toast.success("File updated.");
      loadFiles();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update file.");
    } finally {
      setSavingFile(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-transparent border-bottom">
        <h6 className="mb-0"><i className="ti ti-adjustments me-2 text-primary"></i>Document Type &amp; File</h6>
        <small className="text-muted">
          If OCR or AI classification hasn&rsquo;t run yet, or got this wrong, set it here directly.
        </small>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>Document Type</label>
            <div className="d-flex gap-2">
              <select className="form-select form-select-sm" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                <option value="">Select type…</option>
                {docTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {typeChanged && (
                <button className="btn btn-sm btn-primary text-nowrap" onClick={handleSaveType} disabled={savingType}>
                  {savingType ? <span className="spinner-border spinner-border-sm"></span> : "Save"}
                </button>
              )}
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>File</label>
            {loadingFiles ? (
              <div className="text-muted small">Loading…</div>
            ) : (
              <div className="d-flex gap-2">
                <div className="flex-grow-1">
                  <FileTreeSelect
                    files={files}
                    value={fileId}
                    onChange={(fid) => setFileId(fid ? String(fid) : "")}
                    placeholder="Not filed — search or select a file…"
                  />
                </div>
                {fileChanged && (
                  <button className="btn btn-sm btn-primary text-nowrap" onClick={handleSaveFile} disabled={savingFile}>
                    {savingFile ? <span className="spinner-border spinner-border-sm"></span> : "Save"}
                  </button>
                )}
              </div>
            )}
            {!loadingFiles && (
              <div className="text-muted mt-1" style={{ fontSize: "0.72rem" }}>
                Currently filed in: {currentFiles.length > 0 ? currentFiles.map((f) => f.name).join(", ") : "nowhere yet"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── One classification axis (document type OR file) within the card ──── */
const ClassificationSuggestion = ({ label, latest, onAccept, onApply }) => {
  let parsed = {};
  try { parsed = JSON.parse(latest.classification_suggestion || "{}"); } catch { /* show raw below */ }
  // NOTE: vFileName/vFile are keys in the AI service's own JSON payload
  // (FilesIntelService's classification_suggestion), not a frontend concept —
  // left as-is since this is a backend/AI data contract, not UI naming.
  const display = parsed.documentTypeName || parsed.documentType || parsed.vFileName || parsed.vFile || latest.classification_suggestion;

  return (
    <div className="mb-2">
      <div className="text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span className="fw-semibold">{display}</span>
        {latest.classification_confidence != null && (
          <span className="badge bg-primary-subtle text-primary">
            {/* classification_confidence has been observed both as a 0-1 fraction and
                as an already-scaled percentage — normalize rather than assume. */}
            {Math.round(latest.classification_confidence <= 1 ? latest.classification_confidence * 100 : latest.classification_confidence)}%
          </span>
        )}
        {!latest.is_reviewed && (
          <button className="btn btn-sm btn-success" onClick={() => onAccept(latest.id)}><i className="ti ti-thumb-up me-1"></i>Accept</button>
        )}
        {latest.is_reviewed && (
          <button className="btn btn-sm btn-primary" onClick={() => onApply(latest.id)}><i className="ti ti-check me-1"></i>Apply</button>
        )}
      </div>
    </div>
  );
};

/* ── Classification card ──────────────────────────────────── */
const ClassificationCard = ({ doc, onApplied }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [appliedResultIds, setAppliedResultIds] = useState(() => new Set());
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await getAIResults(doc.id);
      const all = unwrapArray(res);
      setResults(
        all.filter((r) => r.job_type === "CLASSIFY" || (r.result_type || "").startsWith("CLASSIFICATION"))
           .sort((a, b) => (b.id || 0) - (a.id || 0))
      );
    } catch { /* card just stays empty */ }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    clearInterval(pollRef.current);
    if (running) pollRef.current = setInterval(load, 3000);
    return () => clearInterval(pollRef.current);
  }, [running, load]);

  // Document type and file are independent suggestions from two separate FilesIntelService
  // jobs (see AiController.QueueJob) — a single "Run" queues both, so this card tracks and
  // reviews/applies each one on its own.
  const latestDocType = results.find((r) => r.result_type === "CLASSIFICATION_DOCTYPE");
  const latestFile = results.find((r) => r.result_type === "CLASSIFICATION_FOLDER");
  useEffect(() => { if (latestDocType && latestFile) setRunning(false); }, [latestDocType, latestFile]);

  // Same normalization as the confidence badge below — classification_confidence
  // has been observed both as a 0-1 fraction and as an already-scaled percentage.
  const normalizeConfidence = (c) => (c == null ? null : Math.round(c <= 1 ? c * 100 : c));
  const docTypeConfidence = latestDocType ? normalizeConfidence(latestDocType.classification_confidence) : null;
  const fileConfidence = latestFile ? normalizeConfidence(latestFile.classification_confidence) : null;
  const lowConfidence =
    (latestDocType && (docTypeConfidence == null || docTypeConfidence < 65)) ||
    (latestFile && (fileConfidence == null || fileConfidence < 65));

  const handleRun = async () => {
    setRunning(true);
    try {
      await queueAIJob({ document_id: doc.id, version_id: doc.current_version?.id, job_type: "CLASSIFY" });
      toast.success("Classification job queued.");
      setTimeout(load, 2000);
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to queue classification."); setRunning(false); }
  };

  const handleAccept = async (resultId) => {
    try { await reviewAIResult(resultId, { review_accepted: true }); toast.success("Suggestion accepted."); load(); }
    catch { toast.error("Failed to accept suggestion."); }
  };

  const handleApply = async (resultId) => {
    try {
      await applyAIClassification(resultId);
      toast.success("Suggestion applied.");
      load();
      onApplied?.();

      // Once every suggestion actually offered (type and/or file — a document with no
      // files in the org only ever gets a type suggestion) has been applied, the validation
      // work here is done — send the user to the document itself to confirm the result rather
      // than leaving them staring at this card.
      const appliedSoFar = new Set(appliedResultIds).add(resultId);
      const typeDone = !latestDocType || appliedSoFar.has(latestDocType.id);
      const fileDone = !latestFile || appliedSoFar.has(latestFile.id);
      setAppliedResultIds(appliedSoFar);
      if (typeDone && fileDone) {
        toast.success("All suggestions applied — opening document.");
        setTimeout(() => navigate(`/ed-mgt/documents/${doc.id}`), 800);
      }
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to apply suggestion."); }
  };

  return (
    <div className="card border-0 h-100" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="mb-0"><i className="ti ti-category-2 me-2 text-primary"></i>Classification</h6>
          <button className="btn btn-sm btn-outline-primary" onClick={handleRun} disabled={running}>
            {running ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-sparkles me-1"></i>Run</>}
          </button>
        </div>
        {loading ? null : !latestDocType && !latestFile ? (
          <div className="text-muted small">
            No results yet — run classification to get a document type and file suggestion, or set them manually in the card above.
          </div>
        ) : (
          <div>
            {latestDocType && (
              <ClassificationSuggestion label="Document Type" latest={latestDocType} onAccept={handleAccept} onApply={handleApply} />
            )}
            {latestFile && (
              <ClassificationSuggestion label="File" latest={latestFile} onAccept={handleAccept} onApply={handleApply} />
            )}
            {lowConfidence && (
              <div className="alert alert-warning py-2 px-2 mb-0 mt-1" style={{ fontSize: "0.78rem" }}>
                <i className="ti ti-alert-triangle me-1"></i>
                Not confident in this suggestion? Set the document type &amp; file manually in the card above instead of accepting it.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Metadata form ─────────────────────────────────────────── */
const MetadataForm = ({ doc, onMandatoryStatusChange }) => {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, vRes] = await Promise.all([getTypeFields(doc.document_type_id), getMetadataValues(doc.id)]);
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

  useEffect(() => {
    const missing = fields.some((f) => f.is_mandatory && !values[f.field_code]);
    onMandatoryStatusChange?.(!missing);
  }, [fields, values, onMandatoryStatusChange]);

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

  if (loading) return <div className="d-flex justify-content-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>;

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
                {f.field_label}{f.is_mandatory && <span className="text-danger ms-1">*</span>}
              </label>
              <input type={f.field_type === "DATE" ? "date" : f.field_type === "NUMBER" ? "number" : "text"}
                     className={`form-control form-control-sm ${missing ? "border-warning" : ""}`}
                     value={val}
                     onChange={(e) => setValues((m) => ({ ...m, [f.field_code]: e.target.value }))} />
              {missing && <div className="text-warning" style={{ fontSize: "0.78rem" }}>Mandatory — required before submission</div>}
            </div>
          );
        })}
      </div>
      {fields.length > 0 && (
        <div className="mt-3">
          <button className="btn btn-outline-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving…</> : <><i className="ti ti-device-floppy me-1"></i>Save Metadata</>}
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Page ──────────────────────────────────────────────────── */
const DocumentValidation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mandatoryMetOk, setMandatoryMetOk] = useState(true);
  const [approvalUpdating, setApprovalUpdating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [docTypes, setDocTypes] = useState([]);
  const [fileTree, setFileTree] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocument(id);
      setDoc(res?.data || res);
    } catch { toast.error("Failed to load document."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    getDocumentTypes().then((r) => setDocTypes(r?.data?.items || r?.data || [])).catch(() => {});
    getFileTree().then((r) => setFileTree(r?.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // A multi-document Bulk Upload / Import from Email hands off a queue of
  // freshly-created document ids here (sessionStorage — see
  // utils/validationQueue.js) so the user can page through validating each
  // one instead of being dropped back at the Landing Queue after every
  // single document. Read fresh each render rather than cached in state:
  // it's cheap, and correct whether this component mounts fresh per document
  // or is reused across the :id param changing.
  const queueIds = getValidationQueue();
  const queueIndex = queueIds.indexOf(Number(id));
  const inQueue = queueIndex !== -1 && queueIds.length > 1;
  const isLastInQueue = inQueue && queueIndex === queueIds.length - 1;

  const handleNextInQueue = () => {
    const nextId = queueIds[queueIndex + 1];
    if (nextId != null) {
      navigate(`/ed-mgt/documents/${nextId}/validate`);
      return;
    }
    clearValidationQueue();
    toast.success("All uploaded documents reviewed.");
    navigate("/ed-mgt/documents/my-queue?view=landing");
  };

  const handleSkipRemaining = () => {
    clearValidationQueue();
    navigate("/ed-mgt/documents/my-queue?view=landing");
  };

  // "Activate" and "Submit for Approval" are different actions, not just a
  // label swap on the same button. Submit-for-approval genuinely needs the
  // wizard page (attach supporting docs, then start the workflow). Activate
  // has none of that to do — requires_approval is already false, so
  // SubmitDocument on the backend flips the document straight to ACTIVE and
  // there's nothing left to review; routing it through the approval wizard
  // was the bug being reported.
  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await submitDocument(id);
      toast.success(res?.message || "Document activated.");
      navigate(`/ed-mgt/documents/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to activate document.");
    } finally {
      setActivating(false);
    }
  };

  const handleToggleApproval = async (checked) => {
    setApprovalUpdating(true);
    try {
      await updateDocument(id, { requires_approval: checked });
      setDoc((prev) => ({ ...prev, requires_approval: checked }));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update approval requirement.");
    } finally {
      setApprovalUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="pc-content d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>
      </DashboardLayout>
    );
  }

  if (!doc) {
    return (
      <DashboardLayout>
        <div className="pc-content"><div className="alert alert-danger"><i className="ti ti-alert-circle me-2"></i>Document not found.</div></div>
      </DashboardLayout>
    );
  }

  const cv = doc.current_version;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <div className="d-flex align-items-center gap-2">
            <h4 className="mb-0">{doc.title}</h4>
            <StatusBadge status={doc.status} />
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="form-check form-switch mb-0">
              <input className="form-check-input" type="checkbox" role="switch" id="requiresApprovalSwitch"
                     checked={!!doc.requires_approval} disabled={approvalUpdating}
                     onChange={(e) => handleToggleApproval(e.target.checked)} />
              <label className="form-check-label" htmlFor="requiresApprovalSwitch" style={{ fontSize: "0.82rem" }}>
                Requires approval
              </label>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => doc.requires_approval ? navigate("/ed-mgt/file-routing") : handleActivate()}
              disabled={!mandatoryMetOk || activating || doc.status === "ACTIVE"}
              title={
                doc.status === "ACTIVE" ? "Document is already active" :
                !mandatoryMetOk ? "Fill in all mandatory metadata fields first" : undefined
              }
            >
              {activating
                ? <span className="spinner-border spinner-border-sm me-1"></span>
                : <i className="ti ti-send me-1"></i>}
              {doc.requires_approval ? "Submit for Approval" : "Activate"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => { clearValidationQueue(); navigate("/ed-mgt/documents/my-queue"); }}
            >
              <i className="ti ti-arrow-left me-1"></i>Back to Queue
            </button>
          </div>
        </div>
        <p className="text-muted mb-3" style={{ fontSize: "0.82rem" }}>
          {doc.document_reference} — confirm the document type &amp; file (assign them manually if OCR/AI got it wrong
          or hasn&rsquo;t run), review OCR, confirm classification, and complete metadata before activating or submitting.
        </p>

        {inQueue && (
          <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 mb-3">
            <span>
              <i className="ti ti-list-numbers me-1"></i>
              Validating document {queueIndex + 1} of {queueIds.length} from your upload
            </span>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleSkipRemaining}>
                Skip remaining — do later
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleNextInQueue}>
                {isLastInQueue
                  ? <>Finish <i className="ti ti-check ms-1"></i></>
                  : <>Next Document <i className="ti ti-arrow-right ms-1"></i></>}
              </button>
            </div>
          </div>
        )}

        <div className="row g-3">
          <div className="col-lg-5">
            <DocumentPreviewPanel documentId={doc.id} versionId={cv?.id} mimeType={cv?.mime_type} filename={cv?.original_filename} />
          </div>
          <div className="col-lg-7">
            <TypeAndFileCard doc={doc} docTypes={docTypes} files={fileTree} onDocUpdated={load} />
            <div className="row g-3 mb-3">
              <div className="col-md-6"><OcrCard doc={doc} onAccepted={load} /></div>
              <div className="col-md-6"><ClassificationCard doc={doc} onApplied={load} /></div>
            </div>
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom">
                <h6 className="mb-0"><i className="ti ti-forms me-2 text-primary"></i>Metadata</h6>
                <small className="text-muted">Fields match whichever document type is set above.</small>
              </div>
              <div className="card-body">
                <MetadataForm doc={doc} onMandatoryStatusChange={setMandatoryMetOk} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentValidation;
