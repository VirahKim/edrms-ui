import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import StatusBadge from "../components/StatusBadge";
import FixedMenu from "../components/FixedMenu";
import FileTreeSidebar from "../components/FileTreeSidebar";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import FilePickerModal from "./fileModals/FilePickerModal";
import DocumentSharesModal from "./documents/DocumentSharesModal";
import UploadVersionModal from "../components/UploadVersionModal";
import DocumentReferences from "../components/DocumentReferences";
import DocumentWithNotes from "../components/RoutingNotesOverlay";
import ComposeMessageModal from "../../communication/messages/ComposeMessageModal";
import {
  getDocument, getMetadataValues, getTypeFields, saveMetadataValues,
  getVersions, getDownloadUrl, promoteVersion, restoreVersion, addTag, removeTag,
  starDocument, unstarDocument,
  getFilesByDocument, getFileTree, linkDocumentToFile, unlinkDocumentFromFile,
  getComments, addComment, updateComment, deleteComment,
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
  const details = [
    ["Created by",     doc?.owner_user_name || (doc?.owner_user_id ? `User #${doc.owner_user_id}` : null)],
    ["Type",        doc?.document_type_name],
    ["Created",     fmtDate(doc?.created_at)],
    ["Expiry Date", doc?.expiry_date || "None"],
    doc?.submitted_by ? ["Submitted By", doc?.submitted_by_name || `User #${doc.submitted_by}`] : null,
    doc?.approved_by ? ["Approved By", doc?.approved_by_name || `User #${doc.approved_by}`] : null,
  ].filter(Boolean);

  return (
    <div>
      {/* Details strip up top — leaves the full card width below for the
          preview itself, instead of splitting the page into two narrow
          columns competing for space. */}
      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <div className="row row-cols-2 row-cols-md-3 g-2">
            {details.map(([k, v]) => (
              <div key={k}>
                <div className="text-uppercase text-muted" style={{ fontSize: "0.68rem", letterSpacing: 0.5 }}>{k}</div>
                <div className="fw-semibold text-truncate" style={{ fontSize: "0.85rem" }} title={v || "—"}>{v || "—"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="d-flex flex-wrap gap-4">
            <div style={{ minWidth: 160 }}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="text-uppercase text-muted" style={{ fontSize: "0.68rem", letterSpacing: 0.5 }}>Files</span>
                <button className="btn btn-sm btn-link p-0" style={{ fontSize: "0.75rem" }}
                        onClick={openFilePicker} disabled={fileActionLoading}>
                  <i className="ti ti-folder-plus me-1"></i>Add
                </button>
              </div>
              {filesLoading ? (
                <div className="placeholder-glow"><span className="placeholder col-6 rounded"></span></div>
              ) : files.length === 0 ? (
                <span className="text-muted small">Not filed in any file</span>
              ) : (
                <div className="d-flex flex-wrap gap-1">
                  {files.map((f) => (
                    <span key={f.id} className="badge bg-warning-subtle text-warning-emphasis d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                      <i className={`ti ${SCOPE_ICON[f.scope] || "ti-folder"}`}></i>
                      {f.name}
                      <button className="btn-close p-0 ms-1" style={{ fontSize: "0.5rem" }}
                              title={`Remove from "${f.name}"`}
                              onClick={() => handleRemoveFile(f)} disabled={fileActionLoading}></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ minWidth: 200 }}>
              <div className="text-uppercase text-muted mb-1" style={{ fontSize: "0.68rem", letterSpacing: 0.5 }}>Tags</div>
              <div className="d-flex flex-wrap gap-1 mb-1">
                {tags.map((tag) => (
                  <span key={tag} className="badge bg-primary-subtle text-primary d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                    #{tag}
                    <button className="btn-close p-0 ms-1" style={{ fontSize: "0.5rem" }}
                            onClick={() => handleRemoveTag(tag)} disabled={tagLoading}></button>
                  </span>
                ))}
                {tags.length === 0 && <span className="text-muted small">No tags</span>}
              </div>
              <input type="text" className="form-control form-control-sm" placeholder="Add tag, press Enter…"
                     value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                     onKeyDown={handleAddTag} disabled={tagLoading} style={{ maxWidth: 220 }} />
            </div>
          </div>
        </div>
      </div>

      {doc?.is_locked && (
        <div className="alert alert-warning d-flex gap-2 py-2">
          <i className="ti ti-lock"></i>
          <div><strong>Document is locked.</strong> No modifications permitted.{doc?.lock_reason && ` Reason: ${doc.lock_reason}`}</div>
        </div>
      )}

      {/* Full-width preview — the point of this tab, so it gets the room. */}
      {/* Routing comments, signatures and sticky notes are laid across the top of the letter. */}
      <DocumentWithNotes documentId={doc?.id} versionId={cv?.id} height={640} />

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
  const editable = ["LANDING", "RETURNED_FOR_REWORK"].includes(doc?.status);

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

/* ── Tab: Versions — view/download history, switch (roll back) to a prior
     version, and request restore of versions archived to cold storage. ── */
const VersionsTab = ({ doc, onChanged }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const isLocked = !!doc.is_locked;

  const loadVersions = useCallback(() => {
    setLoading(true);
    getVersions(doc.id)
      .then((res) => setVersions(res?.data || []))
      .catch(() => toast.error("Failed to load versions."))
      .finally(() => setLoading(false));
  }, [doc.id]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleDownload = async (v) => {
    try {
      const res = await getDownloadUrl(doc.id, v.id);
      const url = res?.data?.url;
      if (!url) { toast.error("Download link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get download link."); }
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    setRollingBack(true);
    try {
      await promoteVersion(doc.id, rollbackTarget.id);
      toast.success(`Rolled back to ${rollbackTarget.version_label || `v${rollbackTarget.version_number}`}.`);
      setRollbackTarget(null);
      loadVersions();
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to roll back version.");
    } finally {
      setRollingBack(false);
    }
  };

  const handleRestore = async (v) => {
    setRestoringId(v.id);
    try {
      const res = await restoreVersion(doc.id, v.id);
      toast.success(res?.message || "Glacier restore requested.");
      loadVersions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to request restore.");
    } finally {
      setRestoringId(null);
    }
  };

  const scanBadge = (status) => {
    const cfg = {
      CLEAN:    "bg-success",
      PENDING:  "bg-warning text-dark",
      INFECTED: "bg-danger",
    }[status] || "bg-secondary";
    return <span className={`badge ${cfg}`} style={{ fontSize: "0.7rem" }}>{status || "—"}</span>;
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <ConfirmModal
        show={!!rollbackTarget}
        title="Roll Back Version"
        message={`Make "${rollbackTarget?.version_label || `v${rollbackTarget?.version_number}`}" the current version of "${doc.title}"? Later versions stay in history and can be switched back to at any time.`}
        confirmLabel={rollingBack ? "Rolling back…" : "Roll Back"}
        onConfirm={handleRollback}
        onCancel={() => !rollingBack && setRollbackTarget(null)}
      />
      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
        <button className="btn btn-sm btn-primary" onClick={() => setShowUpload(true)}>
          <i className="ti ti-upload me-1"></i>Upload New Version
        </button>
      </div>
      {isLocked && (
        <div className="alert alert-warning py-2 px-3 mb-3" style={{ fontSize: "0.8rem" }}>
          <i className="ti ti-lock me-1"></i>This document is locked — rolling back is disabled until it is unlocked.
        </div>
      )}
      {showUpload && (
        <UploadVersionModal
          documentId={doc.id}
          documentTitle={doc.title}
          nextVersionNumber={(doc.current_version_number || versions.length || 0) + 1}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { loadVersions(); onChanged?.(); }}
        />
      )}
      <div className="table-responsive">
        <table className="table table-hover align-middle" style={{ fontSize: "0.875rem" }}>
          <thead className="table-light">
            <tr>
              <th>Version</th>
              <th>Filename</th>
              <th>Size</th>
              <th>Tier</th>
              <th>Uploaded By</th>
              <th>Uploaded At</th>
              <th>Scan</th>
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
                  {v.is_current && <span className="badge text-bg-primary ms-1">Current</span>}
                </td>
                <td><i className="ti ti-file me-1 text-muted"></i>{v.original_filename}</td>
                <td>{fmtSize(v.file_size_bytes)}</td>
                <td>
                  <span className="badge text-bg-secondary" style={{ fontSize: "0.7rem" }}>{v.storage_tier_label || v.storage_tier}</span>
                  {!v.is_available && (
                    <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                      {v.restore_requested_at ? "Restore requested" : "Archived"}
                    </div>
                  )}
                </td>
                <td>{v.uploaded_by_name || (v.uploaded_by ? `User #${v.uploaded_by}` : "—")}</td>
                <td title={fmtDate(v.uploaded_at)}>{fmtRelative(v.uploaded_at)}</td>
                <td>{scanBadge(v.virus_scan_status)}</td>
                <td>
                  <div className="d-flex gap-1">
                    {v.is_available ? (
                      <>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDownload(v)} title="Download">
                          <i className="ti ti-download"></i>
                        </button>
                        {!v.is_current && (
                          <button
                            className="btn btn-sm btn-outline-primary text-nowrap"
                            title="Make this the current version"
                            disabled={isLocked}
                            onClick={() => setRollbackTarget(v)}
                          >
                            <i className="ti ti-history me-1"></i>Roll Back
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-secondary text-nowrap"
                        title="Request restore from cold storage"
                        onClick={() => handleRestore(v)}
                        disabled={!!v.restore_requested_at || restoringId === v.id}
                      >
                        {restoringId === v.id ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <><i className="ti ti-cloud-download me-1"></i>{v.restore_requested_at ? "Restore requested" : "Request Restore"}</>
                        )}
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

/* ── Tab: References (cross-references + physical enclosures) ─ */
const RelatedTab = ({ doc }) => <DocumentReferences doc={doc} mode="manage" />;

/* ── Tab: Comments ─────────────────────────────────────────── */
// Threads are single-level: a reply always points at a top-level comment,
// so grouping is a one-pass bucket by parent_comment_id (no recursion needed).
const CommentBubble = ({ c, onEdit, onDelete, editing, editText, setEditText, savingEdit, deleting }) => (
  <div className="card border-0 bg-light p-2 px-3">
    <div className="d-flex justify-content-between align-items-start gap-2">
      <div className="flex-grow-1">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
            {c.created_by_name || `User #${c.created_by}`}
          </span>
          <span className="text-muted" style={{ fontSize: "0.75rem" }} title={fmtDate(c.created_at)}>
            {fmtRelative(c.created_at)}
          </span>
          {c.is_edited && <span className="text-muted fst-italic" style={{ fontSize: "0.72rem" }}>(edited)</span>}
        </div>
        {editing ? (
          <textarea className="form-control form-control-sm" rows={2} maxLength={2000}
            value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
        ) : (
          <div style={{ fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>{c.comment_text}</div>
        )}
      </div>
      {c.is_own_comment && !editing && (
        <div className="d-flex gap-1 flex-shrink-0">
          <button className="btn btn-sm btn-outline-secondary" title="Edit comment" onClick={() => onEdit(c)}>
            <i className="ti ti-pencil"></i>
          </button>
          <button className="btn btn-sm btn-outline-danger" title="Delete comment"
                  onClick={() => onDelete(c.id)} disabled={deleting}>
            {deleting ? <span className="spinner-border spinner-border-sm"></span> : <i className="ti ti-x"></i>}
          </button>
        </div>
      )}
    </div>
    {editing && (
      <div className="d-flex justify-content-end gap-2 mt-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(null)} disabled={savingEdit}>Cancel</button>
        <button className="btn btn-sm btn-primary" onClick={() => onEdit(c, true)} disabled={savingEdit || !editText.trim()}>
          {savingEdit ? <span className="spinner-border spinner-border-sm"></span> : "Save"}
        </button>
      </div>
    )}
  </div>
);

const CommentsTab = ({ doc }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getComments(doc.id);
      setComments(unwrapArray(res));
    } catch { toast.error("Failed to load comments."); }
    finally { setLoading(false); }
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);

  const handlePost = async () => {
    const text = commentText.trim();
    if (!text) return;
    setPosting(true);
    try {
      const res = await addComment(doc.id, text);
      const created = res?.data || res;
      setComments((c) => [...c, created]);
      setCommentText("");
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to add comment."); }
    finally { setPosting(false); }
  };

  const handleReply = async (parentId) => {
    const text = replyText.trim();
    if (!text) return;
    setPostingReply(true);
    try {
      const res = await addComment(doc.id, text, parentId);
      const created = res?.data || res;
      setComments((c) => [...c, created]);
      setReplyText("");
      setReplyingToId(null);
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to add reply."); }
    finally { setPostingReply(false); }
  };

  // Called with (comment, null) to start editing, (comment, true) to save, (null) to cancel.
  const handleEdit = async (c, save) => {
    if (c === null) { setEditingId(null); setEditText(""); return; }
    if (!save) { setEditingId(c.id); setEditText(c.comment_text); return; }
    const text = editText.trim();
    if (!text) return;
    setSavingEdit(true);
    try {
      const res = await updateComment(doc.id, c.id, text);
      const updated = res?.data || res;
      setComments((list) => list.map((x) => x.id === c.id
        ? { ...x, comment_text: text, is_edited: true, updated_at: updated?.updated_at || new Date().toISOString() }
        : x));
      setEditingId(null);
      setEditText("");
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to save comment."); }
    finally { setSavingEdit(false); }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      await deleteComment(doc.id, commentId);
      setComments((c) => c.filter((x) => x.id !== commentId));
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to delete comment."); }
    finally { setDeletingId(null); }
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  const roots = comments.filter((c) => !c.parent_comment_id);
  const repliesByParent = comments.reduce((m, c) => {
    if (c.parent_comment_id) (m[c.parent_comment_id] ||= []).push(c);
    return m;
  }, {});

  return (
    <div>
      <h6 className="mb-3"><i className="ti ti-message-circle me-2 text-primary"></i>Comments</h6>

      <div className="d-flex flex-column gap-2 mb-3">
        {roots.length === 0 && <div className="text-muted small">No comments yet.</div>}
        {roots.map((c) => {
          const replies = repliesByParent[c.id] || [];
          return (
            <div key={c.id}>
              <CommentBubble c={c} onEdit={handleEdit} onDelete={handleDelete}
                editing={editingId === c.id} editText={editText} setEditText={setEditText}
                savingEdit={savingEdit && editingId === c.id} deleting={deletingId === c.id} />

              {replies.length > 0 && (
                <div className="d-flex flex-column gap-2 mt-2 ms-4 ps-2 border-start">
                  {replies.map((r) => (
                    <CommentBubble key={r.id} c={r} onEdit={handleEdit} onDelete={handleDelete}
                      editing={editingId === r.id} editText={editText} setEditText={setEditText}
                      savingEdit={savingEdit && editingId === r.id} deleting={deletingId === r.id} />
                  ))}
                </div>
              )}

              <div className="ms-4 ps-2 mt-1">
                {replyingToId === c.id ? (
                  <div className="d-flex gap-2 align-items-start" style={{ maxWidth: 480 }}>
                    <textarea className="form-control form-control-sm" rows={1} maxLength={2000}
                      placeholder="Write a reply…" value={replyText}
                      onChange={(e) => setReplyText(e.target.value)} autoFocus />
                    <button className="btn btn-sm btn-primary text-nowrap" onClick={() => handleReply(c.id)}
                            disabled={postingReply || !replyText.trim()}>
                      {postingReply ? <span className="spinner-border spinner-border-sm"></span> : "Reply"}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setReplyingToId(null); setReplyText(""); }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-link p-0" style={{ fontSize: "0.78rem" }}
                          onClick={() => { setReplyingToId(c.id); setReplyText(""); }}>
                    <i className="ti ti-corner-down-right me-1"></i>Reply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card border-0 bg-light">
        <div className="card-body">
          <label className="form-label small mb-1">Add a comment</label>
          <textarea className="form-control form-control-sm mb-2" rows={2} maxLength={2000}
            placeholder="Write a comment…" value={commentText}
            onChange={(e) => setCommentText(e.target.value)} />
          <div className="d-flex justify-content-end">
            <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || !commentText.trim()}>
              {posting ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-send me-1"></i>Post Comment</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Left nav panel — the SAME Files sidebar used on the documents list
     (FileTreeSidebar, with all its file actions), just collapsed to its icon
     rail by default so it never disappears when a document is opened.
     Picking a file takes the user back to Files at that file. ── */
const FileNavPanel = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="d-flex flex-column gap-2 h-100" style={{ flex: collapsed ? "0 0 64px" : "0 0 260px", maxWidth: collapsed ? 64 : 260, minWidth: collapsed ? 64 : 220, transition: "flex-basis .2s ease, max-width .2s ease" }}>
      {!collapsed && (
        <button className="btn btn-sm btn-outline-secondary text-start" onClick={() => navigate("/ed-mgt/documents")}>
          <i className="ti ti-arrow-left me-1" />Back to Files
        </button>
      )}
      <div style={{ flex: "1 1 auto", minHeight: 0 }}>
        <FileTreeSidebar
          defaultCollapsed
          onCollapsedChange={setCollapsed}
          onSelect={(file) => navigate(`/ed-mgt/documents?folder_id=${file.id}`)}
          width="260px"
          minWidth={220}
          collapsedWidth={64}
        />
      </div>
    </div>
  );
};

/* ── Main FileView ─────────────────────────────────────────── */
const FileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [shareTarget, setShareTarget] = useState(null);
  const [showRequest, setShowRequest] = useState(false);

  const loadDoc = useCallback(async () => {
    try {
      const res = await getDocument(id);
      setDoc(res?.data || res);
    } catch { toast.error("Failed to load document."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadDoc(); }, [loadDoc]);

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
    { key: "overview", label: "Overview", icon: "ti-layout" },
    { key: "metadata", label: "Metadata", icon: "ti-tags" },
    { key: "versions", label: "Versions", icon: "ti-versions" },
    { key: "related",  label: "Cross-References", icon: "ti-affiliate" },
    { key: "comments", label: "Comments", icon: "ti-message-circle" },
  ];

  if (loading) return (
    <DashboardLayout>
      <div className="pc-content d-flex" style={{ fontFamily: FONT_FAMILY, minHeight: "calc(100vh - 160px)" }}>
        <FileNavPanel />
        <div className="d-flex justify-content-center align-items-center flex-grow-1" style={{ minHeight: 400 }}>
          <div className="spinner-border text-primary"></div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content d-flex gap-3" style={{ fontFamily: FONT_FAMILY, minHeight: "calc(100vh - 160px)" }}>
        <FileNavPanel />
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
        {/* Duplicate banner */}
        {doc?.duplicate_of_document_id ? (
          <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3">
            <i className="ti ti-copy"></i>
            <div>This document was flagged as a possible duplicate. <Link to={`/ed-mgt/documents/${doc.duplicate_of_document_id}`} className="fw-semibold">View the original document</Link>.</div>
          </div>
        ) : doc?.is_duplicate_flagged ? (
          <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mb-3">
            <i className="ti ti-copy"></i>
            <div>This document was flagged as a possible duplicate. <Link to={`/ed-mgt/documents/duplicate-check?title=${encodeURIComponent(doc.title || "")}`} className="fw-semibold">Review possible matches</Link>.</div>
          </div>
        ) : null}

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
              <FixedMenu trigger={<i className="ti ti-dots-vertical" />}>
                {(close) => (<>
                  <li>
                    <button className="dropdown-item" onClick={() => { close(); handleDownload(); }}>
                      <i className="ti ti-download me-2 text-secondary" />Download
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => { close(); setShareTarget(doc); }}>
                      <i className="ti ti-share me-2 text-info" />Share
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => { close(); setShowRequest(true); }}>
                      <i className="ti ti-message-circle me-2 text-primary" />Send a message regarding this Document/Letter
                    </button>
                  </li>
                </>)}
              </FixedMenu>
            </div>
          </div>

          {/* Tabs */}
          <div className="card-footer bg-transparent border-top-0 pt-0 px-3">
            <ul className="nav nav-tabs card-header-tabs border-0">
              {TABS.map((t) => (
                <li key={t.key} className="nav-item">
                  <button className={`nav-link border-0 ${activeTab === t.key ? "active fw-semibold" : t.highlight ? "text-primary fw-semibold" : "text-muted"}`}
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
            {doc && activeTab === "overview" && <OverviewTab doc={doc} />}
            {doc && activeTab === "metadata" && <MetadataTab doc={doc} />}
            {doc && activeTab === "versions" && <VersionsTab doc={doc} onChanged={loadDoc} />}
            {doc && activeTab === "related"  && <RelatedTab  doc={doc} />}
            {doc && activeTab === "comments" && <CommentsTab doc={doc} />}
          </div>
        </div>
        </div>
      </div>

      {shareTarget && (
        <DocumentSharesModal
          doc={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}

      {showRequest && (
        <ComposeMessageModal
          onClose={() => setShowRequest(false)}
          defaultSubject={`Regarding: ${doc?.title || doc?.document_reference || "a document"}`}
          defaultBody={`Hi,\n\nCould you take a look at "${doc?.title || doc?.document_reference}"?\n\n`}
          relatedEntityType="Document"
          relatedEntityId={doc?.id}
          relatedEntityLink={`${window.location.origin}/ed-mgt/documents/${id}`}
        />
      )}
    </DashboardLayout>
  );
};

export default FileView;
