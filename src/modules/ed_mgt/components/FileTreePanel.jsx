import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FixedMenu from "./FixedMenu";
import useIsRegistryOfficer from "./useIsRegistryOfficer";
import SendOutsideModal from "../routing/SendOutsideModal";
import BringUpModal from "../routing/BringUpModal";

/* ── Scope colour map (used for default file tint) ── */
const SCOPE_STYLE = {
  ORGANIZATION: { icon: "ti-building", color: "#003d80", label: "Global Files" },
  DEPARTMENT:   { icon: "ti-users",    color: "#3395ff", label: "Department" },
  PERSONAL:     { icon: "ti-user",     color: "#007bff", label: "Personal" },
  SHARED:       { icon: "ti-share",    color: "#66b0ff", label: "Shared" },
};

// Every real file — regardless of scope — renders with this glyph so the
// browser reads unambiguously as files; only the tint varies (scope
// default, or the file's own custom color).
const FILE_ICON = "ti-folder";

/* ── File tree node ─────────────────────────────────────── */
const FileNode = ({
  file, depth, selected, readOnly,
  onSelect, onDelete, onNewChild, onViewDetails,
  onEdit, onMoveFile, onClone, onShare, onSubscribe, onPin, onStar,
}) => {
  // Never auto-expanded — even at the root — so nothing reveals its
  // contents until the user explicitly clicks the arrow (or, for a
  // container row, the row itself).
  const [expanded, setExpanded] = useState(false);
  const [registryModal, setRegistryModal] = useState(null); // "outside" | "bringup"
  const navigate = useNavigate();
  const isRegistryOfficer = useIsRegistryOfficer();
  const children = file.children || [];
  const style = SCOPE_STYLE[file.scope] || SCOPE_STYLE.ORGANIZATION;
  const isSelected = selected?.id === file.id;

  // Synthetic grouping rows (a department, or the current user's "Personal"
  // node) aren't real files — they exist only to hold real files
  // underneath. They have nothing to select, edit, move, or delete: clicking
  // one just expands/collapses to reveal what's inside, same as the arrow.
  const isContainer = !!file.isContainer;

  const handleRowClick = () => {
    if (isContainer) {
      if (children.length > 0) setExpanded((v) => !v);
    } else {
      onSelect(file);
    }
  };

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <div
        className={`d-flex align-items-start gap-2 px-2 py-1 rounded mb-1 ${
          isSelected ? "bg-primary bg-opacity-10 border border-primary border-opacity-25" : "hover-bg"
        }`}
        style={{ cursor: "pointer", minHeight: 34 }}
        onClick={handleRowClick}
      >
        {children.length > 0 ? (
          <i
            className={`ti ${expanded ? "ti-chevron-down" : "ti-chevron-right"} text-muted`}
            style={{ fontSize: "0.7rem", width: 14, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          />
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        <i
          className={`ti ${isContainer ? style.icon : FILE_ICON}`}
          style={{ color: file.color || style.color, fontSize: "1rem", flexShrink: 0 }}
        />
        <span className="flex-grow-1" style={{ minWidth: 0 }}>
          <span className="d-flex align-items-baseline gap-1">
            <span
              className={`${isSelected ? "fw-semibold text-primary" : ""} ${isContainer ? "fw-semibold" : ""}`}
              style={{ fontSize: "0.875rem", overflowWrap: "anywhere" }}
            >
              {file.name}
            </span>
            {file.is_starred && <i className="ti ti-star text-warning flex-shrink-0" style={{ fontSize: "0.7rem" }} title="Starred" />}
            {file.is_pinned && <i className="ti ti-pin text-warning flex-shrink-0" style={{ fontSize: "0.7rem" }} />}
          </span>
          {!isContainer && (file.reference_no || file.volume_no || file.last_activity_at) && (
            <span className="d-flex flex-wrap align-items-center gap-2 text-muted" style={{ fontSize: "0.7rem", lineHeight: 1.4 }}>
              {file.reference_no && <span title="Reference No.">{file.reference_no}</span>}
              {file.volume_no && <span title="Volume">Vol. {file.volume_no}</span>}
              {file.last_activity_at && (
                <span title={`Last activity ${new Date(file.last_activity_at).toLocaleString()}`}>
                  <i className="ti ti-clock me-1" />{fmtActivity(file.last_activity_at)}
                </span>
              )}
            </span>
          )}
        </span>
        {!isContainer && !readOnly && (
          <FixedMenu trigger={<i className="ti ti-dots-vertical" />}>
            {(close) => (<>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onViewDetails(file); }}>
                  <i className="ti ti-info-circle me-2 text-muted" />View Details
                </button>
              </li>
              {isRegistryOfficer && (
                <li>
                  <button className="dropdown-item" onClick={() => { close(); navigate(`/ed-mgt/file-routing/submit/${file.id}`); }}>
                    <i className="ti ti-send me-2 text-primary" />Submit to Marking Officer
                  </button>
                </li>
              )}
              {isRegistryOfficer && (
                <li>
                  <button className="dropdown-item" onClick={() => { close(); setRegistryModal("outside"); }}>
                    <i className="ti ti-mail-forward me-2 text-primary" />Send outside
                  </button>
                </li>
              )}
              {isRegistryOfficer && (
                <li>
                  <button className="dropdown-item" onClick={() => { close(); setRegistryModal("bringup"); }}>
                    <i className="ti ti-calendar-event me-2 text-warning" />Add to bring-up diary
                  </button>
                </li>
              )}
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onNewChild(file); }}>
                  <i className="ti ti-folder-plus me-2 text-success" />New Sub-File
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onEdit(file); }}>
                  <i className="ti ti-pencil me-2 text-primary" />Rename / Edit
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onMoveFile(file); }}>
                  <i className="ti ti-drag-drop me-2 text-primary" />Move File
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onClone(file); }}>
                  <i className="ti ti-copy me-2 text-primary" />Clone
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onShare(file); }}>
                  <i className="ti ti-share me-2 text-info" />Share
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onSubscribe(file); }}>
                  <i className="ti ti-bell me-2 text-warning" />Notifications
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onPin(file); }}>
                  <i className={`ti ${file.is_pinned ? "ti-pin-off" : "ti-pin"} me-2 text-warning`} />
                  {file.is_pinned ? "Unpin" : "Pin File"}
                </button>
              </li>
              <li>
                <button className="dropdown-item" onClick={() => { close(); onStar(file); }}>
                  <i className={`ti ${file.is_starred ? "ti-star-off" : "ti-star"} me-2 text-warning`} />
                  {file.is_starred ? "Unstar" : "Star File"}
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={() => { close(); onDelete(file); }} disabled={file.is_system_folder}>
                  <i className="ti ti-trash me-2" />Delete
                </button>
              </li>
            </>)}
          </FixedMenu>
        )}
      </div>
      {registryModal === "outside" && (
        <SendOutsideModal fileId={file.id} onClose={() => setRegistryModal(null)} />
      )}
      {registryModal === "bringup" && (
        <BringUpModal folderId={file.id} label={file.name} onClose={() => setRegistryModal(null)} />
      )}
      {expanded &&
        children.map((child) => (
          <FileNode
            key={child.id}
            file={child}
            depth={depth + 1}
            selected={selected}
            readOnly={readOnly}
            onSelect={onSelect}
            onDelete={onDelete}
            onNewChild={onNewChild}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onMoveFile={onMoveFile}
            onClone={onClone}
            onShare={onShare}
            onSubscribe={onSubscribe}
            onPin={onPin}
            onStar={onStar}
          />
        ))}
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */
// Most recent activity in a node or anything beneath it (a new document filed into a
// sub-file counts for its parents too).
const activityOf = (node) => {
  let t = node.last_activity_at ? new Date(node.last_activity_at).getTime() : 0;
  (node.children || []).forEach((c) => { t = Math.max(t, activityOf(c)); });
  return t;
};

// Lists the most recently affected files first - e.g. one that just received a document.
// Starred files stay on top, as before. Applied at every level of the tree.
const sortByRecentActivity = (nodes) =>
  [...nodes]
    .map((n) => (n.children?.length ? { ...n, children: sortByRecentActivity(n.children) } : n))
    .sort((a, b) =>
      (b.is_starred ? 1 : 0) - (a.is_starred ? 1 : 0)
      || activityOf(b) - activityOf(a)
      || String(a.name).localeCompare(String(b.name)));

const fmtActivity = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 43200) return `${Math.floor(mins / 1440)}d ago`;
  return new Date(iso).toLocaleDateString();
};

// Files are listed under the registry that keeps them, not by scope (global / department / personal).
// Files with no registry set come last. Sub-files stay nested under their parent file.
const NO_REGISTRY = "No registry";

function groupByRegistry(nodes) {
  const groups = new Map();
  nodes.forEach((n) => {
    const key = n.registry_name || NO_REGISTRY;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  });
  const keys = [...groups.keys()].sort((a, b) =>
    (a === NO_REGISTRY) - (b === NO_REGISTRY) || a.localeCompare(b));
  return Object.fromEntries(keys.map((k) => [k, groups.get(k)]));
}

function filterTreeByName(nodes, query) {
  const result = [];
  nodes.forEach((n) => {
    const filteredChildren = filterTreeByName(n.children || [], query);
    if (n.name.toLowerCase().includes(query) || filteredChildren.length > 0) {
      result.push({ ...n, children: filteredChildren });
    }
  });
  return result;
}

function filterTreeByStarred(nodes) {
  const result = [];
  nodes.forEach((n) => {
    const filteredChildren = filterTreeByStarred(n.children || []);
    if (n.is_starred || filteredChildren.length > 0) {
      result.push({ ...n, children: filteredChildren });
    }
  });
  return result;
}

/**
 * FileTreePanel — the "Files" left-hand file browser. Fully controlled:
 * the caller owns the tree data and all interaction state, so the exact same
 * panel (search, star filter, scope grouping, collapse-to-icon-rail) renders
 * identically wherever it's dropped in — FilesBrowser and FileView both use
 * this component rather than each rolling their own sidebar.
 *
 * Props:
 *   tree, treeLoading        — file tree data (GET /api/folders/tree) + loading flag
 *   selected, onSelect(file) — current selection + click handler
 *   collapsed, onToggleCollapsed(bool) — collapsed-to-rail state
 *   search, onSearchChange   — file name filter
 *   starredOnly, onToggleStarredOnly — starred-only filter
 *   readOnly                 — hides the "+" new-file button and each row's
 *                               action menu, for contexts that only browse
 *   onNewFile               — required unless readOnly
 *   onDelete/onNewChild/onViewDetails/onEdit/onMoveFile/onClone/onShare/onSubscribe/onPin/onStar
 *                             — file row actions, required unless readOnly
 */
const FileTreePanel = ({
  tree = [], treeLoading = false,
  selected = null, onSelect,
  collapsed = false, onToggleCollapsed,
  search = "", onSearchChange,
  starredOnly = false, onToggleStarredOnly,
  readOnly = false,
  onNewFile,
  onDelete, onNewChild, onViewDetails, onEdit, onMoveFile, onClone, onShare, onSubscribe, onPin, onStar,
  width = "23%", minWidth = 220, collapsedWidth = 64,
}) => {
  const nameFilteredTree = search.trim()
    ? filterTreeByName(tree, search.trim().toLowerCase())
    : tree;
  const filteredTree = starredOnly
    ? filterTreeByStarred(nameFilteredTree)
    : nameFilteredTree;
  const scopeGroups = groupByRegistry(sortByRecentActivity(filteredTree));

  return (
    <div
      className="h-100"
      style={{
        flex: collapsed ? `0 0 ${collapsedWidth}px` : `0 0 ${width}`,
        maxWidth: collapsed ? collapsedWidth : width,
        minWidth: collapsed ? collapsedWidth : minWidth,
        transition: "flex-basis .2s ease, max-width .2s ease",
      }}
    >
      {/* The tree scrolls on its own, with a scrollbar that is always drawn, apart from the page beside it. */}
      <style>{`
        .qb-scroll { scrollbar-width: thin; scrollbar-color: #c3c9d1 #eef1f3; }
        .qb-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
        .qb-scroll::-webkit-scrollbar-track { background: #eef1f3; border-radius: 6px; }
        .qb-scroll::-webkit-scrollbar-thumb { background-color: #c3c9d1; border-radius: 6px; border: 2px solid #eef1f3; }
        .qb-scroll::-webkit-scrollbar-thumb:hover { background-color: #a9b0ba; }
      `}</style>
      <div className="card border-0 shadow-sm h-100" style={{ overflow: "hidden" }}>
        <div className="card-header bg-transparent border-bottom py-2" style={{ flexShrink: 0 }}>
          {collapsed ? (
            <div className="d-flex justify-content-center">
              <button
                className="btn p-2 text-muted"
                title="Expand Files panel"
                onClick={() => onToggleCollapsed?.(false)}
              >
                <i className="ti ti-menu-2" style={{ fontSize: "1.15rem" }} />
              </button>
            </div>
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm p-0 px-1 text-muted"
                    title="Collapse Files panel"
                    onClick={() => onToggleCollapsed?.(true)}
                  >
                    <i className="ti ti-menu-2" style={{ fontSize: "0.95rem" }} />
                  </button>
                  <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>Files</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <button
                    className={`btn btn-sm p-0 px-1 ${starredOnly ? "text-warning" : "text-muted"}`}
                    title={starredOnly ? "Show all files" : "Show only starred files"}
                    onClick={() => onToggleStarredOnly?.(!starredOnly)}
                  >
                    <i className="ti ti-star" />
                  </button>
                  {!readOnly && (
                    <button
                      className="btn btn-link btn-sm p-0 text-primary"
                      title="New File"
                      onClick={onNewFile}
                    >
                      <i className="ti ti-plus" />
                    </button>
                  )}
                </div>
              </div>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-transparent border-end-0 px-2">
                  <i className="ti ti-search text-muted" style={{ fontSize: "0.8rem" }} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Filter files…"
                  value={search}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  style={{ fontSize: "0.8rem" }}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary btn-sm px-2"
                    type="button"
                    onClick={() => onSearchChange?.("")}
                  >
                    <i className="ti ti-x" style={{ fontSize: "0.75rem" }} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="card-body p-2 qb-scroll" style={{ overflowY: "auto", minHeight: 0, flex: "1 1 auto" }}>
          {collapsed ? (
            <div className="d-flex flex-column align-items-center gap-1">
              {Object.values(scopeGroups).map((nodes) => (
                nodes.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="btn p-0 border-0 bg-transparent"
                    style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                    title={f.name}
                    onClick={() => {
                      if (f.isContainer) { onToggleCollapsed?.(false); return; }
                      onSelect?.(f);
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bs-tertiary-bg, #f0f2f5)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <i
                      className={`ti ${f.isContainer ? (SCOPE_STYLE[f.scope] || SCOPE_STYLE.ORGANIZATION).icon : FILE_ICON}`}
                      style={{ color: f.color || (SCOPE_STYLE[f.scope] || SCOPE_STYLE.ORGANIZATION).color, fontSize: "1.1rem" }}
                    />
                  </button>
                ))
              ))}
            </div>
          ) : treeLoading ? (
            <div className="text-center py-4 text-muted">
              <span className="spinner-border spinner-border-sm" />
            </div>
          ) : tree.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="ti ti-folder-off" style={{ fontSize: 32 }} />
              <p className="mt-2 mb-0" style={{ fontSize: "0.8rem" }}>No files yet</p>
              {!readOnly && (
                <button className="btn btn-link btn-sm" onClick={onNewFile}>
                  Create one
                </button>
              )}
            </div>
          ) : filteredTree.length === 0 && starredOnly ? (
            <div className="text-center py-4 text-muted">
              <i className="ti ti-star-off" style={{ fontSize: 32 }} />
              <p className="mt-2 mb-0" style={{ fontSize: "0.8rem" }}>No starred files yet</p>
              <button className="btn btn-link btn-sm" onClick={() => onToggleStarredOnly?.(false)}>Show all files</button>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="ti ti-folder-search" style={{ fontSize: 32 }} />
              <p className="mt-2 mb-0" style={{ fontSize: "0.8rem" }}>No files match "{search}"</p>
              <button className="btn btn-link btn-sm" onClick={() => onSearchChange?.("")}>Clear filter</button>
            </div>
          ) : (
            Object.entries(scopeGroups).map(([scope, nodes]) => (
              <div key={scope} className="mb-2">
                <div
                  className="text-muted px-2 mb-1"
                  style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  <i className="ti ti-building-warehouse me-1" />{scope}
                </div>
                {nodes.map((f) => (
                  <FileNode
                    key={f.id}
                    file={f}
                    depth={0}
                    selected={selected}
                    readOnly={readOnly}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onNewChild={onNewChild}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onMoveFile={onMoveFile}
                    onClone={onClone}
                    onShare={onShare}
                    onSubscribe={onSubscribe}
                    onPin={onPin}
                    onStar={onStar}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTreePanel;
