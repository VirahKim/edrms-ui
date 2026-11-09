import React, { useState } from "react";

const SCOPE_ICON = {
  ORGANIZATION: "ti-building",
  DEPARTMENT: "ti-users",
  PERSONAL: "ti-user",
  SHARED: "ti-share",
};

/* ── One row in the current level — always a file, never a preview of
     grandchildren, so "current location" and "its sub-files" never render
     with the same visual weight. ── */
const PickerRow = ({ node, disabled, isCurrent, onOpen }) => {
  const childCount = (node.children || []).length;
  return (
    <div
      className={`d-flex align-items-center gap-2 px-2 py-2 rounded mb-1 ${
        isCurrent
          ? "bg-primary bg-opacity-15 border border-primary border-opacity-25"
          : disabled
          ? "text-muted"
          : "hover-bg"
      }`}
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1 }}
      onClick={() => !disabled && onOpen(node)}
    >
      <i
        className={`ti ${SCOPE_ICON[node.scope] || "ti-folder"}`}
        style={{ color: node.color || "#007bff", fontSize: "1rem", flexShrink: 0 }}
      />
      <span className={`flex-grow-1 text-truncate ${isCurrent ? "fw-semibold text-primary" : ""}`} style={{ fontSize: "0.875rem" }}>
        {node.name}
      </span>
      {node.cached_document_count > 0 && (
        <span className="badge rounded-pill text-bg-secondary" style={{ fontSize: "0.68rem" }}>
          {node.cached_document_count}
        </span>
      )}
      {childCount > 0 && !disabled && (
        <i className="ti ti-chevron-right text-muted" style={{ fontSize: "0.8rem", flexShrink: 0 }} title="Has sub-files" />
      )}
    </div>
  );
};

/**
 * FilePickerModal — drill-down file browser (Google-Drive/OneDrive
 * "Move to…" style). Opening a file navigates INTO it, so the list always
 * shows only that file's direct sub-files — never mixed with the file
 * itself — while the breadcrumb above tracks where you currently are.
 *
 * Props:
 *   title       string   — modal title
 *   tree        array    — nested file tree (from GET /api/folders/tree)
 *   excludeIds  array    — file ids to disable (e.g. current file)
 *   confirmLabel string  — text on the confirm button
 *   onPick      fn(file) — called with the file currently drilled into
 *   onClose     fn
 *   zBase       number   — z-index base (default 1050), bump for stacked modals
 */
const FilePickerModal = ({
  title = "Select File",
  tree = [],
  excludeIds = [],
  confirmLabel = "Select",
  onPick,
  onClose,
  zBase = 1050,
}) => {
  // Breadcrumb trail of drilled-into files; [] means browsing the root list.
  const [path, setPath] = useState([]);

  const current = path[path.length - 1] || null;
  const levelNodes = current ? (current.children || []) : tree;

  const handleOpen = (node) => setPath((p) => [...p, node]);
  const jumpTo = (index) => setPath((p) => p.slice(0, index + 1));
  const jumpHome = () => setPath([]);

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: zBase }}
        onClick={onClose}
      />
      <div
        className="modal fade show d-block"
        style={{ zIndex: zBase + 10 }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-folder-open me-2 text-warning" />
                {title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            {/* Breadcrumb — the only place the current file's name appears;
                the list below never repeats it, so location vs. contents
                never look interchangeable. */}
            <div className="px-3 py-2 border-bottom" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
              <nav aria-label="File breadcrumb">
                <ol className="breadcrumb mb-0 flex-nowrap" style={{ fontSize: "0.82rem", whiteSpace: "nowrap", overflowX: "auto" }}>
                  <li
                    className={`breadcrumb-item d-inline-flex align-items-center gap-1 ${path.length === 0 ? "active fw-semibold" : ""}`}
                    style={{ cursor: path.length === 0 ? "default" : "pointer" }}
                    onClick={jumpHome}
                  >
                    <i className="ti ti-home" style={{ fontSize: "0.8rem" }} />
                    Home
                  </li>
                  {path.map((f, i) => {
                    const isLast = i === path.length - 1;
                    return (
                      <li
                        key={f.id}
                        className={`breadcrumb-item ${isLast ? "active fw-semibold" : ""}`}
                        style={{ cursor: isLast ? "default" : "pointer" }}
                        onClick={() => !isLast && jumpTo(i)}
                      >
                        {f.name}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>

            <div className="modal-body p-2" style={{ maxHeight: 360, overflowY: "auto" }}>
              {levelNodes.length === 0 ? (
                <div className="text-center py-4 text-muted" style={{ fontSize: "0.875rem" }}>
                  {current ? "No sub-files here." : "No files available."}
                </div>
              ) : (
                levelNodes.map((node) => (
                  <PickerRow
                    key={node.id}
                    node={node}
                    disabled={excludeIds.includes(node.id)}
                    isCurrent={false}
                    onOpen={handleOpen}
                  />
                ))
              )}
            </div>

            {current && (
              <div className="px-3 py-2 border-top" style={{ fontSize: "0.8rem", backgroundColor: "var(--bs-card-bg, #fff)" }}>
                <i className="ti ti-folder me-1 text-primary" />
                Currently viewing: <span className="fw-semibold text-primary">{current.name}</span>
              </div>
            )}

            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!current || excludeIds.includes(current.id)}
                onClick={() => current && onPick(current)}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilePickerModal;
