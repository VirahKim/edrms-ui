import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import { FieldLabel } from "../../components/Tooltip";
import LocalFilePreview from "../../components/LocalFilePreview";
import DocumentPreviewPanel from "../../components/DocumentPreviewPanel";
import LetterSigner from "../../routing/LetterSigner";
import FileTreeSelect from "../../components/FileTreeSelect";
import FileDetailsCard from "../../components/FileDetailsCard";
import InwardDetailsForm, { SuggestionNote } from "../../components/InwardDetailsForm";
import useIntakeSuggestions from "../../components/useIntakeSuggestions";
import NewFileModal from "../fileModals/NewFileModal";
import IngestionTabs from "../../components/IngestionTabs";
import IngestionStepBar from "../../components/IngestionStepBar";
import {
  emptyInwardForm, findIntakeType, importIntakeFiles, toFilingPayload, validateInwardForm, MISSING_TYPE_MESSAGE, suggestionState,
} from "../../utils/inwardIntake";
import {
  getDocumentTypes, getFileTree, getConfidentialityLevels, deleteDocument, fileInwardDocument, getDocument,
} from "../../../../api/edmsApi";

const STEPS = ["File & Document", "Details"];

const fmtFileSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

/* ── Main component ───────────────────────────────────────── */
const DocumentUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef  = useRef(null);

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [intakeType, setIntakeType] = useState(null);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);

  // Step 1: the file (folder) and the document
  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(null); // { document_id, document_reference, folio_number, ocr_job_id, is_duplicate }
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const preselected = useRef(false);

  // Step 2: sign / stamp the imported document before it is filed
  const [signing, setSigning] = useState(false);
  const [signedVersionId, setSignedVersionId] = useState(null);   // set once signed or stamped: the signed copy is shown

  // Step 2: details
  const [form, setForm] = useState(() => emptyInwardForm());
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  const jobStates = useIntakeSuggestions([imported?.ocr_job_id]);
  const jobEntry = imported?.ocr_job_id ? jobStates[imported.ocr_job_id] : null;

  const loadFileTree = () => getFileTree().then((r) => {
    const tree = r?.data || [];
    setFiles(tree);
    // Arriving from a file's Upload button (?folder_id=12): that file is already chosen.
    const wanted = searchParams.get("folder_id");
    if (wanted && !preselected.current) {
      preselected.current = true;
      const find = (nodes) => nodes.reduce((hit, n) => hit || (String(n.id) === wanted ? n : find(n.children || [])), null);
      const node = find(tree);
      if (node) { setFolderId(String(node.id)); setFolderName(node.name || ""); }
    }
  }).catch(() => {});

  useEffect(() => {
    getDocumentTypes().then((r) => setIntakeType(findIntakeType(r?.data?.items || r?.data || []))).catch(() => {});
    loadFileTree();
    getConfidentialityLevels().then((r) => setConfidentialityLevels(r?.data?.items || r?.data || [])).catch(() => {});
  }, []);

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  // An imported-but-unsaved document is a stray LANDING record — remove it when the
  // user swaps the file, changes the destination file, or cancels.
  const discardImported = async (doc = imported) => {
    if (!doc?.document_id) return;
    try { await deleteDocument(doc.document_id); } catch { /* best effort */ }
  };

  const selectFile = async (id, node) => {
    if (String(id || "") !== String(folderId || "")) {
      if (imported && !savedRef.current) { await discardImported(); }
      setImported(null);
      setFile(null);
      setSigning(false); setSignedVersionId(null);
    }
    setFolderId(id ? String(id) : "");
    setFolderName(node?.name || "");
  };

  const handleFileCreated = (created) => {
    setShowNewFileModal(false);
    loadFileTree();
    if (created?.id) selectFile(created.id, created);
  };

  /* ── Step 1: choosing the document imports it straight away ── */
  const handleFileSelect = async (event) => {
    event?.preventDefault?.();
    setDragOver(false);
    const selected = event?.target?.files?.[0] || event?.dataTransfer?.files?.[0];
    if (event?.target) event.target.value = "";
    if (!selected) return;
    if (!intakeType) { toast.error(MISSING_TYPE_MESSAGE); return; }

    if (imported) { await discardImported(); setImported(null); }
    setSigning(false); setSignedVersionId(null);
    setFile(selected);
    setImporting(true);
    try {
      const [result] = await importIntakeFiles([selected], folderId, intakeType.id);
      if (!result?.success) {
        setFile(null);
        toast.error(result?.error || "The document could not be imported.");
        return;
      }
      setImported(result);
      setForm(emptyInwardForm({ folio_no: result.folio_number != null ? String(result.folio_number) : "" }));
      if (result.is_duplicate) toast.warning?.("This looks like a duplicate of a document already in the system.");
    } catch (err) {
      setFile(null);
      toast.error(err?.response?.status === 413
        ? "File is too large for the server to accept. Try a smaller file or contact support to raise the upload limit."
        : (err?.response?.data?.message || "The document could not be imported."));
    } finally {
      setImporting(false);
    }
  };

  // After signing or stamping, the document has a new version: show that one instead of the local copy.
  const handleSigned = async () => {
    try {
      const res = await getDocument(imported.document_id);
      const cv = (res?.data || res)?.current_version;
      if (cv?.id) setSignedVersionId(cv.id);
    } catch { /* the signed copy is saved either way */ }
    setSigning(false);
    toast.success("Signed or stamped. The signed copy will be filed.");
  };

  const handleCancel = async () => {
    if (imported && !savedRef.current) await discardImported();
    navigate("/ed-mgt/documents");
  };

  /* ── Step 2: save = file it. OCR/AI already ran during import — nothing else to do. ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateInwardForm(form);
    if (problem) { toast.error(problem); return; }
    setSaving(true);
    try {
      const res = await fileInwardDocument(toFilingPayload(imported.document_id, form));
      const entry = res?.data;
      savedRef.current = true;
      toast.success(entry ? `Filed — Inward Register S/NO ${entry.serial_no}/${entry.register_year}.` : "Document filed.");
      setTimeout(() => navigate("/ed-mgt/registers/inward"), 800);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save the document.");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      {/* Each half of the page scrolls on its own, with a scrollbar that is always drawn. */}
      <style>{`
        .qb-pane { max-height: calc(100vh - 330px); min-height: 360px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #c3c9d1 #eef1f3; }
        .qb-pane::-webkit-scrollbar { width: 10px; }
        .qb-pane::-webkit-scrollbar-track { background: #eef1f3; border-radius: 6px; }
        .qb-pane::-webkit-scrollbar-thumb { background-color: #c3c9d1; border-radius: 6px; border: 2px solid #eef1f3; }
        .qb-pane::-webkit-scrollbar-thumb:hover { background-color: #a9b0ba; }
      `}</style>
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <IngestionTabs active="single" />
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <IngestionStepBar step={step} steps={STEPS} />

                {/* ── Step 1: File, then Document ── */}
                {step === 1 && (
                  <div>
                    <div className="row g-4">
                      {/* 1. Select a File first — its details appear right below */}
                      <div className="col-lg-6 qb-pane">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <FieldLabel label="1. Select a File" required
                            tooltip="Where this document is filed. Pick it first — the file's registry, volume and the folio this document will take are shown below." />
                          <button type="button" className="btn btn-outline-primary btn-sm text-nowrap"
                                  onClick={() => setShowNewFileModal(true)}>
                            <i className="ti ti-folder-plus me-1"></i> New File
                          </button>
                        </div>
                        <FileTreeSelect files={files} value={folderId} onChange={selectFile} />
                        {files.length === 0 && (
                          <div className="form-text">
                            No files yet — use <strong>New File</strong> above to create one.
                          </div>
                        )}
                        <FileDetailsCard fileId={folderId} />
                      </div>

                      {/* 2. Add the document — disabled until a File is selected */}
                      <div className="col-lg-6 qb-pane">
                        <label className="form-label fw-semibold d-block">2. Add Document</label>
                        <div className={`border-2 border-dashed rounded-3 p-5 text-center ${!folderId ? "bg-light" : dragOver ? "border-primary bg-primary bg-opacity-5" : "border-secondary"}`}
                             style={{ cursor: folderId && !importing ? "pointer" : "not-allowed", transition: "all 0.2s", opacity: folderId ? 1 : 0.6 }}
                             onDragOver={(e) => { if (folderId && !importing) { e.preventDefault(); setDragOver(true); } }}
                             onDragLeave={() => setDragOver(false)}
                             onDrop={(e) => { e.preventDefault(); if (folderId && !importing) handleFileSelect(e); }}
                             onClick={() => { if (folderId && !importing) fileRef.current?.click(); }}>
                          <input ref={fileRef} type="file" className="d-none" onChange={handleFileSelect} disabled={!folderId || importing}
                                 accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                          {!folderId ? (
                            <div className="text-muted">
                              <i className="ti ti-lock" style={{ fontSize: 48 }}></i>
                              <p className="fw-semibold mt-2 mb-0">Select a File on the left first</p>
                            </div>
                          ) : importing ? (
                            <div className="text-primary">
                              <span className="spinner-border" style={{ width: 40, height: 40 }}></span>
                              <p className="fw-semibold mt-3 mb-0">Importing {file?.name}…</p>
                              <small className="text-muted">OCR and AI start as soon as the import finishes.</small>
                            </div>
                          ) : imported && file ? (
                            <div>
                              <i className="ti ti-file-check text-success" style={{ fontSize: 48 }}></i>
                              <p className="fw-semibold mt-2 mb-0">{file.name}</p>
                              <small className="text-muted">{fmtFileSize(file.size)} · imported — click to replace</small>
                            </div>
                          ) : (
                            <div className="text-muted">
                              <i className="ti ti-cloud-upload" style={{ fontSize: 48 }}></i>
                              <p className="fw-semibold mt-2 mb-1">Drop file here or click to browse</p>
                              <small>PDF, DOCX, XLSX, PNG, JPG up to 100 MB</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button type="button" className="btn btn-outline-secondary" onClick={handleCancel} disabled={importing}>
                        <i className="ti ti-arrow-left me-1"></i> Cancel
                      </button>
                      <button type="button" className="btn btn-primary" disabled={!imported || importing} onClick={() => setStep(2)}>
                        Next: Details <i className="ti ti-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Details (the Inward Register entry) ── */}
                {step === 2 && imported && (
                  <form onSubmit={handleSubmit}>
                    <div className="row g-4">
                      <div className="col-lg-6 qb-pane">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fw-semibold small">
                            {signedVersionId ? <><i className="ti ti-circle-check text-success me-1"></i>Signed / stamped copy</> : "The document"}
                          </span>
                          {signing ? (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSigning(false)}>
                              Back to the document
                            </button>
                          ) : (
                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => setSigning(true)} disabled={saving}>
                              <i className="ti ti-signature me-1"></i>{signedVersionId ? "Sign or stamp again" : "Sign or stamp"}
                            </button>
                          )}
                        </div>
                        {signing ? (
                          <LetterSigner documentId={imported.document_id} onSigned={handleSigned} />
                        ) : signedVersionId ? (
                          <DocumentPreviewPanel documentId={imported.document_id} versionId={signedVersionId} height={520} />
                        ) : (
                          <LocalFilePreview file={file} height={520} />
                        )}
                      </div>

                      <div className="col-lg-6 qb-pane">
                        <SuggestionNote state={suggestionState(jobEntry, !!imported.ocr_job_id)} />
                        <InwardDetailsForm
                          value={form}
                          onChange={patchForm}
                          suggestions={jobEntry?.suggestions}
                          confidentialityLevels={confidentialityLevels}
                          fileLabel={folderName}
                          documentId={imported.document_id}
                          fileId={folderId}
                          onChangeFile={() => setStep(1)}
                        />
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={saving}>
                        <i className="ti ti-arrow-left me-1"></i> Back
                      </button>
                      <button type="submit" className="btn btn-success" disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                          : <><i className="ti ti-check me-1"></i> Save</>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewFileModal && (
        <NewFileModal
          tree={files}
          onCreated={handleFileCreated}
          onClose={() => setShowNewFileModal(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default DocumentUpload;
