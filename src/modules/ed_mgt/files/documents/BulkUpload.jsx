import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FONT_FAMILY } from "../../constants/fonts";
import DashboardLayout from "../../../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import { FieldLabel } from "../../components/Tooltip";
import LocalFilePreview from "../../components/LocalFilePreview";
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
  getDocumentTypes, getFileTree, getConfidentialityLevels, deleteDocument, fileInwardDocument,
} from "../../../../api/edmsApi";

const BATCH_SIZE = 25; // cap files per request so one slow/huge batch can't block everything
const STEPS = ["Files", "Details"];

let rowKeyCounter = 0;

const STATUS_CFG = {
  importing: { icon: "ti-loader",       cls: "text-primary",  label: "Importing…" },
  imported:  { icon: "ti-circle-check", cls: "text-success",  label: "Imported" },
  saved:     { icon: "ti-checks",       cls: "text-success",  label: "Saved" },
  error:     { icon: "ti-alert-circle", cls: "text-danger",   label: "Failed" },
};

/* ── Main component ───────────────────────────────────────── */
const BulkUpload = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  const [files, setFiles] = useState([]);
  const [intakeType, setIntakeType] = useState(null);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);

  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");

  // rows: { key, file, status: importing|imported|saved|error, result, error }
  const [rows, setRows] = useState([]);
  const [forms, setForms] = useState({});          // rowKey -> inward form
  const [selectedKey, setSelectedKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const jobIds = useMemo(() => rows.map((r) => r.result?.ocr_job_id).filter(Boolean), [rows]);
  const jobStates = useIntakeSuggestions(jobIds);

  const loadFileTree = () => getFileTree().then((r) => setFiles(r?.data || [])).catch(() => {});

  useEffect(() => {
    getDocumentTypes().then((r) => setIntakeType(findIntakeType(r?.data?.items || r?.data || []))).catch(() => {});
    loadFileTree();
    getConfidentialityLevels().then((r) => setConfidentialityLevels(r?.data?.items || r?.data || [])).catch(() => {});
  }, []);

  const importedRows = rows.filter((r) => r.status === "imported" || r.status === "saved");
  const isImporting = rows.some((r) => r.status === "importing");
  const selectedRow = rows.find((r) => r.key === selectedKey) || null;

  // Imported-but-unsaved documents are stray LANDING records — remove them if the
  // user changes the destination file or drops a row.
  const discardRow = async (row) => {
    if (row?.result?.document_id && row.status !== "saved") {
      try { await deleteDocument(row.result.document_id); } catch { /* best effort */ }
    }
  };

  const selectFolder = async (id, node) => {
    if (String(id || "") !== String(folderId || "") && rowsRef.current.length > 0) {
      await Promise.all(rowsRef.current.map(discardRow));
      setRows([]);
      setForms({});
      setSelectedKey(null);
    }
    setFolderId(id ? String(id) : "");
    setFolderName(node?.name || "");
  };

  const handleFileCreated = (created) => {
    setShowNewFileModal(false);
    loadFileTree();
    if (created?.id) selectFolder(created.id, created);
  };

  /* ── Step 1: adding files imports them right away ── */
  const addFiles = async (fileList) => {
    if (!intakeType) { toast.error(MISSING_TYPE_MESSAGE); return; }
    const newRows = Array.from(fileList).map((file) => ({
      key: `row-${rowKeyCounter++}`, file, status: "importing", result: null,
    }));
    setRows((prev) => [...prev, ...newRows]);

    for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
      const batch = newRows.slice(i, i + BATCH_SIZE);
      let results = [];
      let batchError = null;
      try {
        results = await importIntakeFiles(batch.map((b) => b.file), folderId, intakeType.id);
      } catch (err) {
        batchError = err?.response?.status === 413
          ? "This batch is too large for the server to accept. Try fewer or smaller files."
          : (err?.response?.data?.message || "Import failed.");
      }
      const byName = Object.fromEntries(results.map((r) => [r.filename, r]));
      const batchKeys = new Set(batch.map((b) => b.key));
      setRows((prev) => prev.map((r) => {
        if (!batchKeys.has(r.key)) return r;
        const result = byName[r.file.name];
        if (!result?.success) return { ...r, status: "error", error: batchError || result?.error || "Not imported." };
        return { ...r, status: "imported", result };
      }));
      setForms((prev) => {
        const next = { ...prev };
        batch.forEach((b) => {
          const result = byName[b.file.name];
          if (result?.success) {
            next[b.key] = emptyInwardForm({ folio_no: result.folio_number != null ? String(result.folio_number) : "" });
          }
        });
        return next;
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (folderId && e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleRemoveRow = async (key) => {
    const row = rows.find((r) => r.key === key);
    setRows((prev) => prev.filter((r) => r.key !== key));
    setForms((prev) => { const n = { ...prev }; delete n[key]; return n; });
    await discardRow(row);
  };

  const handleNext = () => {
    if (importedRows.length === 0) { toast.error("Add at least one file that imports successfully."); return; }
    setSelectedKey((k) => (k && importedRows.some((r) => r.key === k) ? k : importedRows[0].key));
    setStep(2);
  };

  const handleCancel = async () => {
    await Promise.all(rowsRef.current.map(discardRow));
    navigate("/ed-mgt/documents");
  };

  /* ── Step 2: per-document details, then Save All ── */
  const patchForm = (key, patch) => setForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const applyToAll = () => {
    const src = forms[selectedKey];
    if (!src) return;
    setForms((prev) => {
      const next = { ...prev };
      importedRows.filter((r) => r.status !== "saved" && r.key !== selectedKey).forEach((r) => {
        next[r.key] = {
          ...next[r.key],
          date_received: src.date_received,
          source_name: src.source_name,
          confidentiality_level: src.confidentiality_level,
          restricted_user_ids: src.restricted_user_ids,
          restricted_role_ids: src.restricted_role_ids,
          _touched: { ...next[r.key]._touched, date_received: true, source_name: !!src.source_name },
        };
      });
      return next;
    });
    toast.success("Received From, Date Received and Confidentiality copied to the other documents.");
  };

  const handleSaveAll = async () => {
    const pending = importedRows.filter((r) => r.status === "imported");
    for (const row of pending) {
      const problem = validateInwardForm(forms[row.key]);
      if (problem) {
        setSelectedKey(row.key);
        toast.error(`${row.file.name}: ${problem}`);
        return;
      }
    }

    setSaving(true);
    let failed = 0;
    // In order, so S/NOs and folios follow the order the user sees.
    for (const row of pending) {
      try {
        await fileInwardDocument(toFilingPayload(row.result.document_id, forms[row.key]));
        setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, status: "saved", error: null } : r)));
      } catch (err) {
        failed++;
        const message = err?.response?.data?.message || "Failed to save.";
        setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, error: message } : r)));
      }
    }
    setSaving(false);

    if (failed === 0) {
      toast.success(`${pending.length} document${pending.length !== 1 ? "s" : ""} filed and entered in the Inward Register.`);
      setTimeout(() => navigate("/ed-mgt/registers/inward"), 900);
    } else {
      toast.error(`${failed} document${failed !== 1 ? "s" : ""} could not be saved — see the list, fix and Save again.`);
    }
  };

  const unsavedCount = importedRows.filter((r) => r.status === "imported").length;
  const selectedEntry = selectedRow?.result?.ocr_job_id ? jobStates[selectedRow.result.ocr_job_id] : null;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="row justify-content-center">
          <div className="col-lg-11">
            <IngestionTabs active="bulk" />
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <IngestionStepBar step={step} steps={STEPS} />

                {/* ── Step 1: File, then Documents ── */}
                {step === 1 && (
                  <div>
                    <div className="row g-4">
                      <div className="col-lg-6">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <FieldLabel label="1. Select a File" required
                            tooltip="Where this batch is filed. Pick it first — the file's registry, volume and the folios these documents will take are shown below." />
                          <button type="button" className="btn btn-outline-primary btn-sm text-nowrap"
                                  onClick={() => setShowNewFileModal(true)}>
                            <i className="ti ti-folder-plus me-1"></i> New File
                          </button>
                        </div>
                        <FileTreeSelect files={files} value={folderId} onChange={selectFolder} />
                        {files.length === 0 && (
                          <div className="form-text">
                            No files yet — use <strong>New File</strong> above to create one.
                          </div>
                        )}
                        <FileDetailsCard fileId={folderId} count={Math.max(1, importedRows.length)} />
                      </div>

                      <div className="col-lg-6">
                        <label className="form-label fw-semibold d-block">2. Add Documents</label>
                        <div className={`border-2 border-dashed rounded-3 p-4 text-center mb-3 ${!folderId ? "bg-light" : dragOver ? "border-primary bg-primary bg-opacity-5" : "border-secondary"}`}
                             style={{ cursor: folderId ? "pointer" : "not-allowed", transition: "all 0.2s", opacity: folderId ? 1 : 0.6 }}
                             onDragOver={(e) => { if (folderId) { e.preventDefault(); setDragOver(true); } }}
                             onDragLeave={() => setDragOver(false)}
                             onDrop={handleDrop}
                             onClick={() => { if (folderId) fileRef.current?.click(); }}>
                          <input ref={fileRef} type="file" multiple className="d-none" disabled={!folderId}
                                 onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
                                 accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                          {!folderId ? (
                            <div className="text-muted">
                              <i className="ti ti-lock" style={{ fontSize: 40 }}></i>
                              <p className="fw-semibold mt-2 mb-0">Select a File on the left first</p>
                            </div>
                          ) : (
                            <>
                              <i className="ti ti-cloud-upload text-muted" style={{ fontSize: 40 }}></i>
                              <p className="fw-semibold mt-2 mb-0">Drop files here or click to browse</p>
                              <small className="text-muted">Files are imported as soon as you add them; OCR and AI start right away.</small>
                            </>
                          )}
                        </div>

                        {rows.length === 0 ? (
                          <div className="text-center text-muted py-3">No files added yet.</div>
                        ) : (
                          <div style={{ maxHeight: 320, overflowY: "auto" }}>
                            {rows.map((row) => {
                              const cfg = STATUS_CFG[row.status] || STATUS_CFG.error;
                              return (
                                <div key={row.key} className="d-flex align-items-center gap-2 py-2 px-2 border-bottom">
                                  <i className={`ti ${cfg.icon} ${cfg.cls}`} style={{ fontSize: "1.1rem", width: 20 }} title={cfg.label}></i>
                                  <div className="flex-grow-1 min-w-0">
                                    <div className="text-truncate fw-semibold" style={{ fontSize: "0.85rem" }} title={row.file.name}>{row.file.name}</div>
                                    <div style={{ fontSize: "0.75rem" }} className={cfg.cls}>
                                      {row.status === "error" ? row.error : cfg.label}
                                      {row.status === "imported" && row.result?.is_duplicate && (
                                        <span className="text-warning ms-2"><i className="ti ti-copy me-1"></i>possible duplicate</span>
                                      )}
                                    </div>
                                  </div>
                                  {row.status !== "importing" && (
                                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleRemoveRow(row.key)}>
                                      <i className="ti ti-trash"></i>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button type="button" className="btn btn-outline-secondary" onClick={handleCancel} disabled={isImporting}>
                        <i className="ti ti-arrow-left me-1"></i> Cancel
                      </button>
                      <button className="btn btn-primary" disabled={importedRows.length === 0 || isImporting} onClick={handleNext}>
                        Next: Details <i className="ti ti-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Details, one document at a time ── */}
                {step === 2 && (
                  <div>
                    <div className="row g-4">
                      <div className="col-lg-5">
                        <LocalFilePreview file={selectedRow?.file} height={420} />
                        <div className="mt-3" style={{ maxHeight: 220, overflowY: "auto" }}>
                          {importedRows.map((row, i) => {
                            const cfg = STATUS_CFG[row.status];
                            return (
                              <div key={row.key}
                                   className={`d-flex align-items-center gap-2 py-2 px-2 border-bottom rounded ${row.key === selectedKey ? "bg-primary bg-opacity-10" : ""}`}
                                   style={{ cursor: "pointer" }} onClick={() => setSelectedKey(row.key)}>
                                <i className={`ti ${cfg.icon} ${cfg.cls}`} style={{ width: 20 }} title={cfg.label}></i>
                                <div className="flex-grow-1 min-w-0">
                                  <div className="text-truncate" style={{ fontSize: "0.85rem" }}>{i + 1}. {row.file.name}</div>
                                  {row.error && <div className="text-danger" style={{ fontSize: "0.72rem" }}>{row.error}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="col-lg-7">
                        {selectedRow && forms[selectedRow.key] && (
                          <>
                            <SuggestionNote state={suggestionState(selectedEntry, !!selectedRow.result?.ocr_job_id)} />
                            <InwardDetailsForm
                              key={selectedRow.key}
                              value={forms[selectedRow.key]}
                              onChange={(patch) => patchForm(selectedRow.key, patch)}
                              suggestions={selectedEntry?.suggestions}
                              confidentialityLevels={confidentialityLevels}
                              fileLabel={folderName}
                              documentId={selectedRow.result?.document_id}
                              fileId={folderId}
                              onChangeFile={() => setStep(1)}
                            />
                            {unsavedCount > 1 && (
                              <button type="button" className="btn btn-link btn-sm px-0 mt-3" onClick={applyToAll}>
                                <i className="ti ti-copy me-1"></i>Use this Received From, Date Received and Confidentiality for all the others
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={saving}>
                        <i className="ti ti-arrow-left me-1"></i> Back to Files
                      </button>
                      <button className="btn btn-success" disabled={saving || unsavedCount === 0} onClick={handleSaveAll}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                          : <><i className="ti ti-check me-1"></i> Save {unsavedCount > 1 ? `All (${unsavedCount})` : ""}</>}
                      </button>
                    </div>
                  </div>
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

export default BulkUpload;
