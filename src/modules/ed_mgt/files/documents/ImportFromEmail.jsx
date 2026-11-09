import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FONT_FAMILY } from "../../constants/fonts";
import DashboardLayout from "../../../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import { FieldLabel } from "../../components/Tooltip";
import FileTreeSelect from "../../components/FileTreeSelect";
import FileDetailsCard from "../../components/FileDetailsCard";
import InwardDetailsForm, { SuggestionNote } from "../../components/InwardDetailsForm";
import useIntakeSuggestions from "../../components/useIntakeSuggestions";
import NewFileModal from "../fileModals/NewFileModal";
import EmailAttachmentPreview from "../../components/EmailAttachmentPreview";
import IngestionTabs from "../../components/IngestionTabs";
import IngestionStepBar from "../../components/IngestionStepBar";
import {
  emptyInwardForm, findIntakeType, toFilingPayload, validateInwardForm, MISSING_TYPE_MESSAGE, suggestionState,
} from "../../utils/inwardIntake";
import {
  getDocumentTypes, getFileTree, getConfidentialityLevels, deleteDocument, fileInwardDocument,
  listEmailImportAccounts, searchEmailAttachments, importEmailAttachments, connectExternalAccount,
} from "../../../../api/edmsApi";

const STEPS = ["Find Emails", "Details"];

const PROVIDER_CFG = {
  GOOGLE:    { label: "Gmail",   icon: "ti-brand-google-drive" },
  MICROSOFT: { label: "Outlook", icon: "ti-brand-windows" },
};

const fmtSize = (b) => {
  if (!b) return "—";
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const STATUS_CFG = {
  imported: { icon: "ti-circle-check", cls: "text-success", label: "Imported" },
  saved:    { icon: "ti-checks",       cls: "text-success", label: "Saved" },
  error:    { icon: "ti-alert-circle", cls: "text-danger",  label: "Failed" },
};

const attachmentKey = (i) => `${i.messageId}:${i.attachmentId}`;

const ImportFromEmail = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  /* Mailbox — resolved automatically, never a step of its own */
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [connecting, setConnecting] = useState(null);

  const loadAccounts = useCallback(() => {
    setAccountsLoading(true);
    listEmailImportAccounts()
      .then((r) => setAccounts(r?.data || []))
      .catch(() => toast.error("Failed to load connected accounts."))
      .finally(() => setAccountsLoading(false));
  }, []);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const usableAccounts = accounts.filter((a) => a.has_mail_scope);
  const defaultAccount = usableAccounts.find((a) => a.is_default) || usableAccounts[0] || null;

  // Resolve the mailbox automatically — a lone connected mailbox is used as-is,
  // a marked default is preferred among several. Only re-resolves when the
  // current pick is missing or no longer usable (e.g. disconnected), so a
  // deliberate switch made below never gets silently overridden.
  useEffect(() => {
    if (selectedAccountId && usableAccounts.some((a) => a.id === selectedAccountId)) return;
    if (defaultAccount) setSelectedAccountId(defaultAccount.id);
  }, [accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async (provider) => {
    setConnecting(provider);
    try {
      const res = await connectExternalAccount(provider, "EMAIL_IMPORT");
      const url = res?.data?.redirect_url;
      if (!url) { toast.error("Could not start the connection."); return; }
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Complete the sign-in in the new tab, then click Refresh below.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start connection.");
    } finally {
      setConnecting(null);
    }
  };

  /* Step 1: search + select + preview */
  const [filters, setFilters] = useState({ subject: "", from: "", after: "", before: "" });
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedAttachments, setSelectedAttachments] = useState({}); // key -> {messageId, attachmentId, filename, mimeType, size}
  const [previewItem, setPreviewItem] = useState(null);

  const handleSearch = async () => {
    setSearching(true);
    setSearched(false);
    try {
      const res = await searchEmailAttachments({
        external_account_id: selectedAccountId,
        subject: filters.subject || undefined,
        from: filters.from || undefined,
        after: filters.after || undefined,
        before: filters.before || undefined,
      });
      const results = res?.data || [];
      setMessages(results);
      const firstAttachment = results[0]?.attachments?.[0];
      setPreviewItem(firstAttachment ? {
        messageId: results[0].message_id, attachmentId: firstAttachment.attachment_id,
        filename: firstAttachment.filename, mimeType: firstAttachment.mime_type, size: firstAttachment.size_bytes,
      } : null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Search failed.");
      setMessages([]);
      setPreviewItem(null);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  };

  const previewAttachment = (messageId, att) => setPreviewItem({
    messageId, attachmentId: att.attachment_id, filename: att.filename, mimeType: att.mime_type, size: att.size_bytes,
  });

  const toggleAttachment = (messageId, att) => {
    const key = `${messageId}:${att.attachment_id}`;
    setSelectedAttachments((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { messageId, attachmentId: att.attachment_id, filename: att.filename, mimeType: att.mime_type, size: att.size_bytes };
      return next;
    });
  };

  const selectedList = Object.values(selectedAttachments);

  /* Details state */
  const [files, setFiles] = useState([]);
  const [intakeType, setIntakeType] = useState(null);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState({}); // attachment key -> { status, result, error }
  const [forms, setForms] = useState({});     // attachment key -> inward form
  const [saving, setSaving] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  const loadFileTree = () => getFileTree().then((r) => setFiles(r?.data || [])).catch(() => {});

  useEffect(() => {
    getDocumentTypes().then((r) => setIntakeType(findIntakeType(r?.data?.items || r?.data || []))).catch(() => {});
    loadFileTree();
    getConfidentialityLevels().then((r) => setConfidentialityLevels(r?.data?.items || r?.data || [])).catch(() => {});
  }, []);

  const jobIds = Object.values(results).map((r) => r.result?.ocr_job_id).filter(Boolean);
  const jobStates = useIntakeSuggestions(jobIds);

  const importedItems = selectedList.filter((i) => ["imported", "saved"].includes(results[attachmentKey(i)]?.status));
  const hasUnsaved = importedItems.some((i) => results[attachmentKey(i)]?.status === "imported");

  const discardImported = async () => {
    await Promise.all(Object.values(results).map(async (r) => {
      if (r.status === "imported" && r.result?.document_id) {
        try { await deleteDocument(r.result.document_id); } catch { /* best effort */ }
      }
    }));
  };

  const selectFolder = async (id, node) => {
    if (String(id || "") !== String(folderId || "") && Object.keys(results).length > 0) {
      await discardImported();
      setResults({});
      setForms({});
    }
    setFolderId(id ? String(id) : "");
    setFolderName(node?.name || "");
  };

  const handleFileCreated = (created) => {
    setShowNewFileModal(false);
    loadFileTree();
    if (created?.id) selectFolder(created.id, created);
  };

  const handleCancel = async () => {
    await discardImported();
    navigate("/ed-mgt/documents");
  };

  /* Next: importing the selected attachments starts OCR and AI straight away; the
     details form then opens pre-filled from the e-mail (sender, subject, date). */
  const handleImport = async () => {
    if (!folderId) { toast.error("A file is required — every document must be filed somewhere."); return; }
    if (selectedList.length === 0) { toast.error("Select at least one attachment."); return; }
    if (!intakeType) { toast.error(MISSING_TYPE_MESSAGE); return; }

    // Already imported earlier (user came back to step 1) — nothing new to import.
    const todo = selectedList.filter((i) => !["imported", "saved"].includes(results[attachmentKey(i)]?.status));
    if (todo.length === 0) { setPreviewItem(importedItems[0] || previewItem); setStep(2); return; }

    setImporting(true);
    try {
      const res = await importEmailAttachments({
        external_account_id: selectedAccountId,
        items: todo.map((i) => ({ message_id: i.messageId, attachment_id: i.attachmentId, filename: i.filename, mime_type: i.mimeType })),
        document_type_id: intakeType.id,
        folder_id: Number(folderId),
        confidentiality_level: "INTERNAL",
        requires_approval: false,
      });
      const items = (res?.data ?? res)?.results || [];
      const nextResults = {};
      const nextForms = {};
      todo.forEach((item, idx) => {
        const key = attachmentKey(item);
        const r = items[idx];
        if (!r?.success) {
          nextResults[key] = { status: "error", error: r?.error || "Not imported." };
          return;
        }
        nextResults[key] = { status: "imported", result: r };
        const message = messages.find((m) => m.message_id === item.messageId);
        nextForms[key] = emptyInwardForm({
          folio_no: r.folio_number != null ? String(r.folio_number) : "",
          source_name: message?.from_address || "",
          subject: message?.subject || "",
          date_received: message?.received_at ? new Date(message.received_at).toISOString().slice(0, 10) : undefined,
          _touched: { source_name: !!message?.from_address, subject: !!message?.subject },
        });
        if (!nextForms[key].date_received) nextForms[key].date_received = emptyInwardForm().date_received;
      });
      const failed = Object.values(nextResults).filter((r) => r.status === "error").length;
      setResults((prev) => ({ ...prev, ...nextResults }));
      setForms((prev) => ({ ...prev, ...nextForms }));
      if (failed > 0) toast.error(`${failed} attachment${failed !== 1 ? "s" : ""} could not be imported.`);
      const firstOk = todo.find((i) => nextResults[attachmentKey(i)]?.status === "imported");
      if (firstOk) { setPreviewItem(firstOk); setStep(2); }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const patchForm = (key, patch) => setForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleSaveAll = async () => {
    const pending = importedItems.filter((i) => results[attachmentKey(i)]?.status === "imported");
    for (const item of pending) {
      const problem = validateInwardForm(forms[attachmentKey(item)]);
      if (problem) { setPreviewItem(item); toast.error(`${item.filename}: ${problem}`); return; }
    }
    setSaving(true);
    let failed = 0;
    for (const item of pending) {
      const key = attachmentKey(item);
      try {
        await fileInwardDocument(toFilingPayload(results[key].result.document_id, forms[key], { item_type: "EMAIL" }));
        setResults((prev) => ({ ...prev, [key]: { ...prev[key], status: "saved", error: null } }));
      } catch (err) {
        failed++;
        setResults((prev) => ({ ...prev, [key]: { ...prev[key], error: err?.response?.data?.message || "Failed to save." } }));
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

  const currentKey = previewItem ? attachmentKey(previewItem) : null;
  const currentEntry = currentKey ? results[currentKey] : null;
  const currentJob = currentEntry?.result?.ocr_job_id ? jobStates[currentEntry.result.ocr_job_id] : null;

  const activeAccountEmail = accounts.find((a) => a.id === selectedAccountId)?.provider_account_email;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="row justify-content-center">
          <div className="col-lg-11">
            <IngestionTabs active="email" />
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <IngestionStepBar step={step} steps={STEPS} />

                {/* ── Step 1: find + select + preview ── */}
                {step === 1 && (
                  <div>
                    {/* 1. Select a File first — the search below is gated on this */}
                    <div className="mb-4">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <FieldLabel label="1. Select a File" required
                          tooltip="Where these documents are filed for browsing and (for department/organization files) access. Every document must be filed in a file — pick it first so you know where the import is headed." />
                        <button type="button" className="btn btn-outline-primary btn-sm text-nowrap"
                                onClick={() => setShowNewFileModal(true)}>
                          <i className="ti ti-folder-plus me-1"></i> New File
                        </button>
                      </div>
                      <FileTreeSelect
                        files={files}
                        value={folderId}
                        onChange={selectFolder}
                      />
                      <FileDetailsCard fileId={folderId} count={Math.max(1, selectedList.length)} />
                      {files.length === 0 && (
                        <div className="form-text">
                          No files yet — use <strong>New File</strong> above to create one.
                        </div>
                      )}
                    </div>

                    <label className="form-label fw-semibold d-block">2. Find Emails</label>
                    {accountsLoading ? (
                      <div className="text-center py-4"><span className="spinner-border spinner-border-sm"></span></div>
                    ) : usableAccounts.length === 0 ? (
                      <div>
                        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                          Connect a mailbox to search it for attachments. Only what you search for is read —
                          nothing else in your inbox is touched, and nothing is ever sent or modified.
                        </p>
                        <div className="row g-3 mb-3">
                          {["GOOGLE", "MICROSOFT"].map((provider) => {
                            const cfg = PROVIDER_CFG[provider];
                            const account = accounts.find((a) => a.provider === provider);
                            return (
                              <div key={provider} className="col-md-6">
                                <div className="card border h-100">
                                  <div className="card-body d-flex align-items-center gap-3">
                                    <i className={`ti ${cfg.icon}`} style={{ fontSize: "1.6rem" }}></i>
                                    <div className="flex-grow-1">
                                      <div className="fw-semibold">{cfg.label}</div>
                                      {account ? (
                                        <div className="text-warning small">Connected, but needs email access</div>
                                      ) : (
                                        <div className="text-muted small">Not connected</div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary text-nowrap"
                                      disabled={connecting === provider}
                                      onClick={() => handleConnect(provider)}
                                    >
                                      {connecting === provider
                                        ? <span className="spinner-border spinner-border-sm" />
                                        : (account ? "Reconnect" : "Connect")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={loadAccounts}>
                          <i className="ti ti-refresh me-1" />Refresh
                        </button>
                      </div>
                    ) : !folderId ? (
                      <div className="border-2 border-dashed rounded-3 p-5 text-center bg-light text-muted">
                        <i className="ti ti-lock" style={{ fontSize: 40 }}></i>
                        <p className="fw-semibold mt-2 mb-0">Select a File above first</p>
                      </div>
                    ) : (
                      <div className="row g-4">
                        <div className="col-lg-6">
                          <EmailAttachmentPreview accountId={selectedAccountId} item={previewItem} height={440}
                            emptyHint="Search a mailbox, then click an attachment to preview it here." />
                          {selectedList.length > 0 && (
                            <div className="form-text mt-2 text-center">Click an attachment below to preview it.</div>
                          )}
                        </div>

                        <div className="col-lg-6">
                          <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                            <small className="text-muted">
                              <i className="ti ti-mail me-1" />Searching <strong>{activeAccountEmail}</strong>
                            </small>
                            {usableAccounts.length > 1 && (
                              <select
                                className="form-select form-select-sm"
                                style={{ width: "auto" }}
                                value={selectedAccountId || ""}
                                onChange={(e) => { setSelectedAccountId(Number(e.target.value)); setSearched(false); setMessages([]); }}
                              >
                                {usableAccounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {PROVIDER_CFG[a.provider]?.label || a.provider} — {a.provider_account_email}{a.is_default ? " (default)" : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-md-6">
                              <label className="form-label small mb-1">Subject contains</label>
                              <input className="form-control form-control-sm" value={filters.subject}
                                onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
                                placeholder="e.g. invoice" />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small mb-1">Sent By</label>
                              <input className="form-control form-control-sm" value={filters.from}
                                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                                placeholder="sender@example.com" />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small mb-1">After</label>
                              <input type="date" className="form-control form-control-sm" value={filters.after}
                                onChange={(e) => setFilters((f) => ({ ...f, after: e.target.value }))} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label small mb-1">Before</label>
                              <input type="date" className="form-control form-control-sm" value={filters.before}
                                onChange={(e) => setFilters((f) => ({ ...f, before: e.target.value }))} />
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Only emails with attachments are shown. Results are capped at 25 emails.</small>
                            <button className="btn btn-sm btn-primary" onClick={handleSearch} disabled={searching}>
                              {searching ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-search me-1"></i>}
                              Search
                            </button>
                          </div>

                          <div style={{ maxHeight: 300, overflowY: "auto" }}>
                            {searched && messages.length === 0 && (
                              <div className="text-center text-muted py-4">No matching emails with attachments found.</div>
                            )}
                            {messages.map((m) => (
                              <div key={m.message_id} className="card border-0 bg-light mb-2">
                                <div className="card-body py-2 px-3">
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{m.subject || "(no subject)"}</div>
                                    <small className="text-muted text-nowrap ms-2">{m.received_at ? new Date(m.received_at).toLocaleDateString() : ""}</small>
                                  </div>
                                  <div className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>Sent by {m.from_address}</div>
                                  <div className="d-flex flex-column gap-1">
                                    {m.attachments.map((a) => {
                                      const key = `${m.message_id}:${a.attachment_id}`;
                                      const isPreviewed = previewItem && attachmentKey(previewItem) === key;
                                      return (
                                        <div key={key}
                                          className={`d-flex align-items-center gap-2 rounded px-1 py-1 ${isPreviewed ? "bg-primary bg-opacity-10" : ""}`}
                                          style={{ fontSize: "0.82rem", cursor: "pointer" }}
                                          onClick={() => previewAttachment(m.message_id, a)}
                                        >
                                          <input type="checkbox" className="form-check-input m-0"
                                            checked={!!selectedAttachments[key]}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => toggleAttachment(m.message_id, a)} />
                                          <i className="ti ti-paperclip text-muted"></i>
                                          <span>{a.filename}</span>
                                          <span className="text-muted">({fmtSize(a.size_bytes)})</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                      <button type="button" className="btn btn-outline-secondary" onClick={handleCancel} disabled={importing}>
                        <i className="ti ti-arrow-left me-1"></i> Cancel
                      </button>
                      <button className="btn btn-primary" disabled={selectedList.length === 0 || !folderId || importing} onClick={handleImport}>
                        {importing
                          ? <><span className="spinner-border spinner-border-sm me-2"></span>Importing…</>
                          : <>Next: Details ({selectedList.length}) <i className="ti ti-arrow-right ms-1"></i></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Details (the Inward Register entry) ── */}
                {step === 2 && (
                  <div>
                    <div className="row g-4">
                      <div className="col-lg-5">
                        <EmailAttachmentPreview accountId={selectedAccountId} item={previewItem} height={420} />
                        <div className="mt-3" style={{ maxHeight: 220, overflowY: "auto" }}>
                          {importedItems.map((item, i) => {
                            const key = attachmentKey(item);
                            const entry = results[key];
                            const cfg = STATUS_CFG[entry.status];
                            return (
                              <div key={key}
                                   className={`d-flex align-items-center gap-2 py-2 px-2 border-bottom rounded ${key === currentKey ? "bg-primary bg-opacity-10" : ""}`}
                                   style={{ cursor: "pointer" }} onClick={() => setPreviewItem(item)}>
                                <i className={`ti ${cfg.icon} ${cfg.cls}`} style={{ width: 20 }} title={cfg.label}></i>
                                <div className="flex-grow-1 min-w-0">
                                  <div className="text-truncate" style={{ fontSize: "0.85rem" }}>{i + 1}. {item.filename}</div>
                                  {entry.error && <div className="text-danger" style={{ fontSize: "0.72rem" }}>{entry.error}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="col-lg-7">
                        {currentKey && forms[currentKey] && (
                          <>
                            <SuggestionNote state={suggestionState(currentJob, !!currentEntry?.result?.ocr_job_id)} />
                            <InwardDetailsForm
                              key={currentKey}
                              value={forms[currentKey]}
                              onChange={(patch) => patchForm(currentKey, patch)}
                              suggestions={currentJob?.suggestions}
                              confidentialityLevels={confidentialityLevels}
                              fileLabel={folderName}
                              documentId={currentEntry?.result?.document_id}
                              fileId={folderId}
                              onChangeFile={() => setStep(1)}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                      <button className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={saving}>
                        <i className="ti ti-arrow-left me-1"></i> Back
                      </button>
                      <button className="btn btn-success" disabled={saving || !hasUnsaved} onClick={handleSaveAll}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                          : <><i className="ti ti-check me-1"></i> Save</>}
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

export default ImportFromEmail;
