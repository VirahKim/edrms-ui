import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";

const findFileById = (nodes, id) => {
  for (const n of nodes || []) {
    if (String(n.id) === String(id)) return n;
    const found = findFileById(n.children, id);
    if (found) return found;
  }
  return null;
};

// Keeps a node when its own name matches, or when any descendant matches —
// pruning the rest so a search only ever surfaces relevant branches.
const filterTree = (nodes, query) => {
  if (!query) return nodes || [];
  const q = query.toLowerCase();
  const walk = (list) =>
    (list || []).reduce((acc, n) => {
      const children = walk(n.children);
      if (n.name.toLowerCase().includes(q) || children.length) acc.push({ ...n, children });
      return acc;
    }, []);
  return walk(nodes);
};

/* ── One row + its expandable children ──────────────────────── */
// Root files render in the normal weight/size; every nested level is
// visually demoted (italic, muted, smaller) and hangs off a guide line so
// the hierarchy reads at a glance instead of just from a few px of indent.
const TreeNode = ({ node, isRoot, expandedIds, onToggle, onSelect, selectedId, forceExpanded }) => {
  const children = node.children || [];
  const isExpanded = forceExpanded || expandedIds.has(node.id);
  const isSelected = String(selectedId) === String(node.id);

  return (
    <div>
      <div
        className={`d-flex align-items-center gap-2 px-2 py-1 rounded ${isSelected ? "bg-primary bg-opacity-10" : "hover-bg"}`}
        style={{ cursor: "pointer", minHeight: 32 }}
        title={isRoot ? "File" : "Sub-File"}
        onClick={() => onSelect(node)}
      >
        {children.length > 0 ? (
          <i
            className={`ti ${isExpanded ? "ti-chevron-down" : "ti-chevron-right"} text-muted`}
            style={{ fontSize: "0.7rem", width: 14, flexShrink: 0 }}
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          />
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        <i
          className="ti ti-folder"
          style={{ color: node.color || "#007bff", fontSize: isRoot ? "0.9rem" : "0.78rem", flexShrink: 0 }}
        />
        <span
          className={`text-truncate ${isSelected ? "fw-semibold text-primary" : !isRoot ? "fst-italic text-secondary" : ""}`}
          style={{ fontSize: isRoot ? "0.875rem" : "0.8rem" }}
        >
          {node.name}
        </span>
      </div>
      {isExpanded && children.length > 0 && (
        <div style={{ marginLeft: 17, paddingLeft: 10, borderLeft: "1px dashed #ced4da" }}>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              isRoot={false}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * FileTreeSelect — a searchable dropdown, styled like react-select, whose
 * menu renders files as a collapsible tree instead of a flattened list.
 * Sub-files stay hidden under their parent's chevron until expanded, and
 * searching auto-expands only the branches that match.
 *
 * Props:
 *   files    array        — nested file tree (from GET /api/folders/tree)
 *   value     string|number|null — selected file id
 *   onChange  fn(id|null)
 *   placeholder string
 *   disabled  bool
 */
const FileTreeSelect = ({ files, value, onChange, placeholder = "Search or select file…", disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [coords, setCoords] = useState(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selectedFile = useMemo(() => (value ? findFileById(files, value) : null), [files, value]);
  const filteredTree = useMemo(() => filterTree(files, search), [files, search]);

  const updateCoords = () => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const handler = () => updateCoords();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (e.target.closest?.("[data-file-tree-panel]")) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (node) => {
    // Second arg (the full node) lets callers read file-level data — e.g.
    // auto-populating the Department field from a DEPARTMENT-scoped file's
    // department_id — without re-implementing the tree search themselves.
    // Existing single-arg callers are unaffected.
    onChange(node.id, node);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null, null);
    setSearch("");
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div
        className="form-control d-flex align-items-center justify-content-between"
        style={{
          cursor: disabled ? "not-allowed" : "text",
          minHeight: 38,
          borderColor: open ? "#007bff" : "#dee2e6",
          boxShadow: open ? "0 0 0 0.25rem rgba(2,115,92,.15)" : "none",
        }}
        onClick={openMenu}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            className="border-0 flex-grow-1 p-0"
            style={{ outline: "none", fontSize: "0.9rem" }}
            value={search}
            placeholder={selectedFile ? selectedFile.name : placeholder}
            onChange={(e) => setSearch(e.target.value)}
          />
        ) : (
          <span className={`text-truncate ${selectedFile ? "" : "text-muted"}`} style={{ fontSize: "0.9rem" }}>
            {selectedFile ? selectedFile.name : placeholder}
          </span>
        )}
        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
          {selectedFile && !disabled && (
            <i className="ti ti-x text-muted" style={{ cursor: "pointer" }} onClick={handleClear} title="Clear" />
          )}
          <i className="ti ti-chevron-down text-muted" style={{ fontSize: "0.8rem" }} />
        </div>
      </div>

      {open && coords && ReactDOM.createPortal(
        <div
          data-file-tree-panel
          className="border rounded shadow-sm"
          style={{
            backgroundColor: "var(--bs-card-bg, #fff)",
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            maxHeight: 320,
            overflowY: "auto",
            zIndex: 9999,
            padding: 6,
          }}
        >
          {filteredTree.length === 0 ? (
            <div className="text-center text-muted py-3" style={{ fontSize: "0.85rem" }}>No files found.</div>
          ) : (
            filteredTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                isRoot
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                onSelect={handleSelect}
                selectedId={value}
                forceExpanded={!!search}
              />
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default FileTreeSelect;
