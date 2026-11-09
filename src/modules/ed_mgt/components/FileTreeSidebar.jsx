import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { toast } from "./EDMSToast";
import ConfirmModal from "./ConfirmModal";
import FileTreePanel from "./FileTreePanel";
import {
  getFileTree, deleteFile, moveFile, cloneFile, setFilePreferences, starFile, unstarFile,
} from "../../../api/edmsApi";
import NewFileModal from "../files/fileModals/NewFileModal";
import FileEditModal from "../files/fileModals/FileEditModal";
import FileDetailsModal from "../files/fileModals/FileDetailsModal";
import FilePickerModal from "../files/fileModals/FilePickerModal";
import FileSharesModal from "../files/fileModals/FileSharesModal";
import FileSubscriptionModal from "../files/fileModals/FileSubscriptionModal";

/* ── Inline clone modal ──────────────────────────────────── */
const CloneModal = ({ file, tree, onClose, onCloned }) => {
  const [name, setName] = useState(`${file.name} (Copy)`);
  const [targetFile, setTargetFile] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClone = async () => {
    if (!name.trim()) { toast.error("Name is required."); return; }
    setLoading(true);
    try {
      await cloneFile(file.id, {
        new_name: name.trim(),
        new_parent_folder_id: targetFile?.id ?? null,
      });
      toast.success(`File cloned as "${name}".`);
      onCloned();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to clone file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: showPicker ? 1030 : 1040 }} onClick={!showPicker ? onClose : undefined} />
      <div className="modal fade show d-block" style={{ zIndex: showPicker ? 1035 : 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-copy me-2 text-primary" />Clone File
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">New File Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label fw-semibold">Place in (optional)</label>
                <div className="d-flex align-items-center gap-2">
                  <div className="flex-grow-1 form-control form-control-sm text-muted" style={{ fontSize: "0.875rem" }}>
                    {targetFile ? targetFile.name : "Root (top level)"}
                  </div>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowPicker(true)}>
                    Browse
                  </button>
                  {targetFile && (
                    <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => setTargetFile(null)}>
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>
              </div>
              <small className="text-muted mt-2 d-block">
                Only file metadata is cloned — documents are not copied.
              </small>
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleClone} disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Cloning…</>
                ) : (
                  <><i className="ti ti-copy me-1" />Clone File</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showPicker && (
        <FilePickerModal
          title="Select File"
          tree={tree}
          excludeIds={[file.id]}
          confirmLabel="Place Here"
          onPick={(f) => { setTargetFile(f); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
          zBase={1060}
        />
      )}
    </>
  );
};

/**
 * FileTreeSidebar — the one Files sidebar, with every file action (new, rename, move, clone,
 * share, notifications, pin, star, delete, routing). It owns the tree data, the filter state and
 * the file modals, so the documents list and the document viewer render exactly the same thing.
 * The viewer just starts it collapsed to its icon rail.
 *
 * Props:
 *   selected, onSelect(file)   - current file + click handler
 *   defaultCollapsed           - start as the icon rail
 *   onTreeChange(tree)         - called whenever the tree is (re)loaded
 *   onCollapsedChange(bool)    - called when the user collapses / expands it
 *   onFileDeleted(file)        - called after a file is deleted
 *   width, minWidth, collapsedWidth - sizing, passed to FileTreePanel
 * Ref: openNewFile(parent) opens the New File dialog (for page-level buttons).
 */
const FileTreeSidebar = forwardRef(({
  selected = null, onSelect, defaultCollapsed = false,
  onTreeChange, onFileDeleted, onCollapsedChange,
  width, minWidth, collapsedWidth,
}, ref) => {
  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const [showNewFile, setShowNewFile] = useState(false);
  const [parentForNew, setParentForNew] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [subTarget, setSubTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTree = useCallback(() => {
    setTreeLoading(true);
    getFileTree()
      .then((r) => {
        const next = Array.isArray(r?.data) ? r.data : [];
        setTree(next);
        onTreeChange?.(next);
      })
      .catch(() => toast.error("Failed to load files."))
      .finally(() => setTreeLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  useImperativeHandle(ref, () => ({
    openNewFile: (parent = null) => { setParentForNew(parent); setShowNewFile(true); },
  }));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFile(deleteTarget.id);
      toast.success(`File "${deleteTarget.name}" deleted.`);
      onFileDeleted?.(deleteTarget);
      setDeleteTarget(null);
      loadTree();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete file.");
      setDeleteTarget(null);
    }
  };

  const handleMove = async (targetFile) => {
    if (!moveTarget) return;
    try {
      await moveFile(moveTarget.id, { new_parent_folder_id: targetFile.id });
      toast.success(`"${moveTarget.name}" moved to "${targetFile.name}".`);
      setMoveTarget(null);
      loadTree();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to move file.");
      setMoveTarget(null);
    }
  };

  const handlePin = async (file) => {
    const newPin = !file.is_pinned;
    try {
      await setFilePreferences(file.id, { is_pinned: newPin });
      toast.success(newPin ? `"${file.name}" pinned.` : `"${file.name}" unpinned.`);
      loadTree();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update pin.");
    }
  };

  const handleStar = async (file) => {
    const wasStarred = !!file.is_starred;
    try {
      if (wasStarred) await unstarFile(file.id);
      else await starFile(file.id);
      toast.success(wasStarred ? `"${file.name}" unstarred.` : `"${file.name}" starred.`);
      loadTree();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update star.");
    }
  };

  return (
    <>
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete File"
        message={`Delete file "${deleteTarget?.name}"? Documents inside will not be deleted.`}
        confirmLabel="Delete File"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {showNewFile && (
        <NewFileModal
          parentFile={parentForNew}
          tree={tree}
          onCreated={() => { setShowNewFile(false); setParentForNew(null); loadTree(); }}
          onClose={() => { setShowNewFile(false); setParentForNew(null); }}
        />
      )}
      {detailsTarget && (
        <FileDetailsModal file={detailsTarget} onClose={() => setDetailsTarget(null)} onEdit={setEditTarget} />
      )}
      {editTarget && (
        <FileEditModal
          file={editTarget}
          onUpdated={() => { setEditTarget(null); loadTree(); }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {moveTarget && (
        <FilePickerModal
          title={`Move "${moveTarget.name}" to…`}
          tree={tree}
          excludeIds={[moveTarget.id]}
          confirmLabel="Move Here"
          onPick={handleMove}
          onClose={() => setMoveTarget(null)}
        />
      )}
      {cloneTarget && (
        <CloneModal
          file={cloneTarget}
          tree={tree}
          onCloned={() => { setCloneTarget(null); loadTree(); }}
          onClose={() => setCloneTarget(null)}
        />
      )}
      {shareTarget && <FileSharesModal file={shareTarget} onClose={() => setShareTarget(null)} />}
      {subTarget && <FileSubscriptionModal file={subTarget} onClose={() => setSubTarget(null)} />}

      <FileTreePanel
        width={width}
        minWidth={minWidth}
        collapsedWidth={collapsedWidth}
        tree={tree}
        treeLoading={treeLoading}
        selected={selected}
        onSelect={onSelect}
        collapsed={collapsed}
        onToggleCollapsed={(c) => { setCollapsed(c); onCollapsedChange?.(c); }}
        search={search}
        onSearchChange={setSearch}
        starredOnly={starredOnly}
        onToggleStarredOnly={setStarredOnly}
        onNewFile={() => { setParentForNew(null); setShowNewFile(true); }}
        onDelete={setDeleteTarget}
        onNewChild={(parent) => { setParentForNew(parent); setShowNewFile(true); }}
        onViewDetails={setDetailsTarget}
        onEdit={setEditTarget}
        onMoveFile={setMoveTarget}
        onClone={setCloneTarget}
        onShare={setShareTarget}
        onSubscribe={setSubTarget}
        onPin={handlePin}
        onStar={handleStar}
      />
    </>
  );
});

export default FileTreeSidebar;
