import React, { useCallback, useEffect, useState } from "react";
import { getFileCover, saveFileCover } from "../../../api/fileCoversApi";
import FileCoverView from "./FileCoverView";
import CoverColorPicker from "./CoverColorPicker";

const EditCover = ({ cover, onClose, onSaved }) => {
  const [form, setForm] = useState({
    department: cover.department || "", color: cover.color, header_line1: "", header_line2: "",
    differentHeader: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { department: form.department, color: form.color };
      if (form.differentHeader) { body.header_line1 = form.header_line1; body.header_line2 = form.header_line2; }
      onSaved(await saveFileCover(cover.folder_id, body));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save the cover.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 2000 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header py-2">
            <h6 className="modal-title mb-0">File cover</h6>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <label className="form-label fw-semibold small">Department</label>
            <input className="form-control mb-3" value={form.department} maxLength={200} placeholder="e.g. HQS - Administration"
                   onChange={(e) => set("department", e.target.value)} />
            <label className="form-label fw-semibold small">Cover colour</label>
            <div className="mb-3"><CoverColorPicker value={form.color} onChange={(c) => set("color", c)} /></div>
            <div className="form-check mb-2">
              <input id="diffHeader" type="checkbox" className="form-check-input" checked={form.differentHeader}
                     onChange={(e) => set("differentHeader", e.target.checked)} />
              <label htmlFor="diffHeader" className="form-check-label small">This file has a different header (for example a county government)</label>
            </div>
            {form.differentHeader && (
              <>
                <input className="form-control form-control-sm mb-2" value={form.header_line1} maxLength={200}
                       placeholder={`Top line (now: ${cover.header_line1})`} onChange={(e) => set("header_line1", e.target.value)} />
                <input className="form-control form-control-sm" value={form.header_line2} maxLength={200}
                       placeholder={`Second line (now: ${cover.header_line2})`} onChange={(e) => set("header_line2", e.target.value)} />
                <div className="form-text">Leave a line empty to use the organisation's wording.</div>
              </>
            )}
            {error && <div className="alert alert-danger py-2 mt-3 mb-0 small">{error}</div>}
          </div>
          <div className="modal-footer py-2">
            <button className="btn btn-sm btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save cover"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * The cover of a file, loaded from the server. size "card" shows it with Open / Edit buttons (onOpen opens the
 * contents); size "page" is the first page when reading the file.
 */
const FileCover = ({ folderId, size = "card", onOpen }) => {
  const [state, setState] = useState({ id: null, cover: null, failed: false });
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    getFileCover(folderId)
      .then((cover) => setState({ id: folderId, cover, failed: !cover }))
      .catch(() => setState({ id: folderId, cover: null, failed: true }));
  }, [folderId]);

  useEffect(() => { if (folderId) load(); }, [folderId, load]);

  const cover = state.id === folderId ? state.cover : null;
  if (!cover) {
    return state.id === folderId && state.failed
      ? <div className="text-muted small text-center py-4">The cover could not be loaded.</div>
      : <div className="text-center text-muted py-5"><span className="spinner-border spinner-border-sm me-2" />Loading cover…</div>;
  }

  return (
    <div>
      <FileCoverView cover={cover} size={size} onOpen={onOpen} />
      {size === "card" && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          {onOpen && <button className="btn btn-primary btn-sm" onClick={onOpen}><i className="ti ti-folder-open me-1" />Open file</button>}
          {cover.can_edit && <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(true)}><i className="ti ti-edit me-1" />Edit cover</button>}
        </div>
      )}
      {editing && <EditCover cover={cover} onClose={() => setEditing(false)} onSaved={(c) => { setEditing(false); if (c) setState({ id: folderId, cover: c, failed: false }); else load(); }} />}
    </div>
  );
};

export default FileCover;
