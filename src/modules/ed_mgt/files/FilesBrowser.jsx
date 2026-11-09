import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import StatusBadge from "../components/StatusBadge";
import EDMSPagination from "../components/EDMSPagination";
import ConfirmModal from "../components/ConfirmModal";
import FixedMenu from "../components/FixedMenu";
import FileTreeSidebar from "../components/FileTreeSidebar";
import GlobalSearch from "../components/GlobalSearch";
import FileCover from "../components/FileCover";
import {
  getFileDocuments,
  unlinkDocumentFromFile,
  bulkUnlinkDocuments,
  moveDocumentToFile,
  copyDocumentToFile,
  starDocument,
  unstarDocument,
  getDocuments,
  getDocumentTypes,
  getVersions,
  getDownloadUrl,
  deleteDocument,
  linkDocumentToFile,
  bulkLinkDocuments,
} from "../../../api/edmsApi";
import FilePickerModal from "./fileModals/FilePickerModal";
import DocumentSharesModal from "./documents/DocumentSharesModal";
import DocumentVersionsModal from "./documents/DocumentVersionsModal";

const STATUSES = ["LANDING", "DRAFT", "SUBMITTED", "PENDING_APPROVAL", "APPROVED", "REJECTED", "RETURNED_FOR_REWORK", "LOCKED", "ARCHIVED"];

const fmtRelative = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

/* ── Main FilesBrowser ───────────────────────────────────── */
const FilesBrowser = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Set once the ?folder_id= from the URL (e.g. "back to Files" from a
  // document's nav panel) has been applied, so a later tree reload — from an
  // unrelated file action — doesn't keep snapping selection back to it.
  const appliedFileParam = useRef(false);

  /* tree (middle pane) */
  const [tree, setTree] = useState([]);
  const sidebarRef = useRef(null);

  /* selection: null = root (uncategorized files), else a real file node */
  const [selected, setSelected] = useState(null);
  // Opening a file shows its cover first; opening the cover (or Open file) shows what is inside.
  const [openedId, setOpenedId] = useState(null);

  /* documents (main canvas) */
  const [docs, setDocs]                 = useState([]);
  const [docsLoading, setDocsLoading]   = useState(false);
  const [docsTotal, setDocsTotal]       = useState(0);
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(20);
  const [docTypes, setDocTypes]         = useState([]);

  /* document filters */
  const [docSearch, setDocSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]   = useState("");
  const [docStarredOnly, setDocStarredOnly] = useState(false);
  const searchDebounce = useRef(null);

  /* bulk doc selection */
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());

  /* doc modals */
  const [moveDocTarget, setMoveDocTarget]   = useState(null);
  const [copyDocTarget, setCopyDocTarget]   = useState(null);
  const [assignDocTarget, setAssignDocTarget] = useState(null); // single doc, at root/category
  const [assignMode, setAssignMode] = useState("move"); // "move" | "copy" — labeling only; a root doc has no source file, so both link it the same way
  const [bulkAssignConfirm, setBulkAssignConfirm] = useState(false); // multi docs, at root/category
  const [bulkAssignMode, setBulkAssignMode] = useState("move");
  const [unlinkTarget, setUnlinkTarget]     = useState(null);
  const [bulkUnlinkConfirm, setBulkUnlinkConfirm] = useState(false);
  const [shareDocTarget, setShareDocTarget] = useState(null);
  const [versionsDocTarget, setVersionsDocTarget] = useState(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);

  const isRoot = selected === null;
  const isFileNode = !!selected;
  const showCover = isFileNode && openedId !== selected.id;

  /* ── Data loaders ── */

  // Land on the requested file when arriving via ?folder_id= (e.g. the
  // "back to Files" link from a document's collapsed nav panel).
  useEffect(() => {
    if (appliedFileParam.current || tree.length === 0) return;
    const fileId = searchParams.get("folder_id");
    if (fileId) {
      const node = flattenTree(tree)[Number(fileId)];
      if (node) setSelected(node);
    }
    appliedFileParam.current = true;
  }, [tree, searchParams]);

  useEffect(() => {
    getDocumentTypes().then((r) => setDocTypes(r?.data || [])).catch(() => {});
  }, []);

  const loadDocs = useCallback(() => {
    // Every document lives in a file, so the root has no loose documents to list - it shows
    // the recently affected files instead.
    if (!isFileNode) { setDocs([]); setDocsTotal(0); setDocsLoading(false); return; }
    setDocsLoading(true);

    if (isFileNode) {
      const params = { page, page_size: pageSize };
      if (docSearch.trim()) params.text_query = docSearch.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.document_type_id = typeFilter;
      if (docStarredOnly) params.starred_only = true;

      getFileDocuments(selected.id, params)
        .then((r) => {
          setDocs(r?.data?.items || []);
          setDocsTotal(r?.data?.total_count || 0);
        })
        .catch(() => toast.error("Failed to load file documents."))
        .finally(() => setDocsLoading(false));
      return;
    }

    // Root — loose / uncategorized documents only.
    const params = { page, page_size: pageSize, unassigned_only: true };
    if (docSearch.trim()) params.text_query = docSearch.trim();
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.document_type_id = typeFilter;
    if (docStarredOnly) params.starred_only = true;

    getDocuments(params)
      .then((r) => {
        setDocs(r?.items || []);
        setDocsTotal(r?.total_count || 0);
      })
      .catch(() => toast.error("Failed to load documents."))
      .finally(() => setDocsLoading(false));
  }, [selected, isFileNode, page, pageSize, docSearch, statusFilter, typeFilter, docStarredOnly]);

  useEffect(() => { setPage(1); setSelectedDocIds(new Set()); }, [selected]);
  useEffect(() => { loadDocs(); }, [loadDocs]);

  /* ── Document actions ── */
  const handleUnlink = async () => {
    if (!unlinkTarget || !isFileNode) return;
    try {
      await unlinkDocumentFromFile(selected.id, unlinkTarget.id);
      toast.success("Document removed from file.");
      setUnlinkTarget(null);
      setSelectedDocIds((s) => { const n = new Set(s); n.delete(unlinkTarget.id); return n; });
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove document.");
      setUnlinkTarget(null);
    }
  };

  const handleMoveDoc = async (targetFile) => {
    if (!moveDocTarget || !isFileNode) return;
    try {
      await moveDocumentToFile(selected.id, moveDocTarget.id, { target_folder_id: targetFile.id });
      toast.success(`Document moved to "${targetFile.name}".`);
      setMoveDocTarget(null);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to move document.");
      setMoveDocTarget(null);
    }
  };

  const handleCopyDoc = async (targetFile) => {
    if (!copyDocTarget || !isFileNode) return;
    try {
      await copyDocumentToFile(selected.id, copyDocTarget.id, { target_folder_id: targetFile.id });
      toast.success(`Document copied to "${targetFile.name}".`);
      setCopyDocTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to copy document.");
      setCopyDocTarget(null);
    }
  };

  const handleAssignDoc = async (targetFile) => {
    if (!assignDocTarget) return;
    const verb = assignMode === "copy" ? "copied" : "moved";
    try {
      await linkDocumentToFile(targetFile.id, assignDocTarget.id);
      toast.success(`Document ${verb} to "${targetFile.name}".`);
      setAssignDocTarget(null);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign file.");
      setAssignDocTarget(null);
    }
  };

  const handleBulkAssign = async (targetFile) => {
    if (selectedDocIds.size === 0) return;
    const verb = bulkAssignMode === "copy" ? "copied" : "moved";
    try {
      const ids = Array.from(selectedDocIds);
      const res = await bulkLinkDocuments(targetFile.id, ids);
      toast.success(res?.message || `${ids.length} document(s) ${verb} to "${targetFile.name}".`);
      setSelectedDocIds(new Set());
      setBulkAssignConfirm(false);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk assign failed.");
      setBulkAssignConfirm(false);
    }
  };

  const handleBulkUnlink = async () => {
    if (!isFileNode || selectedDocIds.size === 0) return;
    try {
      const ids = Array.from(selectedDocIds);
      await bulkUnlinkDocuments(selected.id, ids);
      toast.success(`${ids.length} document(s) removed from file.`);
      setSelectedDocIds(new Set());
      setBulkUnlinkConfirm(false);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk remove failed.");
      setBulkUnlinkConfirm(false);
    }
  };

  const handleToggleDocStar = async (doc) => {
    const wasStarred = !!doc.is_starred;
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_starred: !wasStarred } : d)));
    try {
      if (wasStarred) await unstarDocument(doc.id);
      else await starDocument(doc.id);
    } catch (err) {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_starred: wasStarred } : d)));
      toast.error(err?.response?.data?.message || "Failed to update star.");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const versionsRes = await getVersions(doc.id);
      const versions = versionsRes?.data || (Array.isArray(versionsRes) ? versionsRes : []);
      const version = versions.find((v) => v.is_current) || versions.find((v) => v.version_number === doc.current_version_number) || versions[0];
      if (!version?.id) { toast.error("No downloadable version found."); return; }
      const res = await getDownloadUrl(doc.id, version.id);
      const url = res?.data?.url;
      if (!url) { toast.error("Download link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get download link."); }
  };

  const handleBulkDownload = async () => {
    const selectedDocs = docs.filter((d) => selectedDocIds.has(d.id));
    for (const doc of selectedDocs) {
      await handleDownload(doc);
    }
  };

  const handleBulkStar = async () => {
    const targets = docs.filter((d) => selectedDocIds.has(d.id) && !d.is_starred);
    if (targets.length === 0) { toast.success("Selected document(s) already starred."); return; }
    try {
      await Promise.all(targets.map((d) => starDocument(d.id)));
      toast.success(`${targets.length} document(s) starred.`);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to star selected documents.");
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDocTarget) return;
    try {
      await deleteDocument(deleteDocTarget.id);
      toast.success("Document deleted.");
      setDeleteDocTarget(null);
      loadDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed.");
      setDeleteDocTarget(null);
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.has(docId) ? next.delete(docId) : next.add(docId);
      return next;
    });
  };

  const toggleAllDocs = () => {
    if (selectedDocIds.size === docs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(docs.map((d) => d.id)));
    }
  };

  // Kept as its own function (instead of inline in the FixedMenu render prop)
  // purely so the action list reads clearly on its own.
  const renderDocActions = (doc, close) => (
    <>
      <li>
        <button className="dropdown-item" onClick={() => { close(); navigate(`/ed-mgt/documents/${doc.id}`); }}>
          <i className="ti ti-eye me-2" />View
        </button>
      </li>
      <li><hr className="dropdown-divider" /></li>
      {isFileNode ? (
        <>
          <li>
            <button className="dropdown-item" onClick={() => { close(); setMoveDocTarget(doc); }}>
              <i className="ti ti-drag-drop me-2 text-primary" />Move to File
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={() => { close(); setCopyDocTarget(doc); }}>
              <i className="ti ti-copy me-2 text-primary" />Copy to File
            </button>
          </li>
        </>
      ) : (
        <>
          <li>
            <button className="dropdown-item" onClick={() => { close(); setAssignMode("move"); setAssignDocTarget(doc); }}>
              <i className="ti ti-folder-symlink me-2 text-secondary" />Move to File
            </button>
          </li>
          <li>
            <button className="dropdown-item" onClick={() => { close(); setAssignMode("copy"); setAssignDocTarget(doc); }}>
              <i className="ti ti-copy me-2 text-secondary" />Copy to File
            </button>
          </li>
        </>
      )}
      <li>
        <button className="dropdown-item" onClick={() => { close(); setShareDocTarget(doc); }}>
          <i className="ti ti-share me-2 text-info" />Share
        </button>
      </li>
      <li>
        <button className="dropdown-item" onClick={() => { close(); setVersionsDocTarget(doc); }}>
          <i className="ti ti-versions me-2 text-primary" />Version History
        </button>
      </li>
      <li>
        <button className="dropdown-item" onClick={() => { close(); handleDownload(doc); }}>
          <i className="ti ti-download me-2 text-secondary" />Download
        </button>
      </li>
      <li>
        <button className="dropdown-item" onClick={() => { close(); handleToggleDocStar(doc); }}>
          <i className={`ti ${doc.is_starred ? "ti-star-off" : "ti-star"} me-2 text-warning`} />
          {doc.is_starred ? "Unstar" : "Star"}
        </button>
      </li>
      <li><hr className="dropdown-divider" /></li>
      {isFileNode && (
        <li>
          <button className="dropdown-item text-danger" onClick={() => { close(); setUnlinkTarget(doc); }}>
            <i className="ti ti-folder-minus me-2" />Remove from File
          </button>
        </li>
      )}
      {doc.status === "LANDING" && (
        <li>
          <button className="dropdown-item text-danger" onClick={() => { close(); setDeleteDocTarget(doc); }}>
            <i className="ti ti-trash me-2" />Delete
          </button>
        </li>
      )}
    </>
  );

  const onSearchChange = (val) => {
    setDocSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setPage(1), 300);
  };

  const activeFilters = [
    statusFilter  && { key: "status",  label: `Status: ${statusFilter}`, onRemove: () => { setStatusFilter(""); setPage(1); } },
    typeFilter    && { key: "type",    label: `Type: ${docTypes.find((t) => String(t.id) === typeFilter)?.name || typeFilter}`, onRemove: () => { setTypeFilter(""); setPage(1); } },
    docSearch     && { key: "q",       label: `Search: "${docSearch}"`, onRemove: () => { setDocSearch(""); setPage(1); } },
    docStarredOnly && { key: "starred", label: "Starred only", onRemove: () => { setDocStarredOnly(false); setPage(1); } },
  ].filter(Boolean);

  /* ── Flatten tree for breadcrumb resolution ── */
  const flatTree = flattenTree(tree);
  // The tree endpoint doesn't return parent_folder_id/folder_path on each
  // node, so the only way to walk "up" (for the back button and a full
  // breadcrumb chain) is to derive parent pointers from the tree's own
  // nesting.
  const parentMap = buildParentMap(tree);

  /* ── Recently affected files (shown at Home) ── */
  const recentFiles = Object.values(flatTree)
    .filter((f) => f.last_activity_at)
    .sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at))
    .slice(0, 15);
  const pathOf = (f) => {
    const names = [];
    let pid = parentMap[f.id];
    while (pid != null && flatTree[pid]) { names.unshift(flatTree[pid].name); pid = parentMap[pid]; }
    return names.join(" / ");
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <style>{`
        .qb-doc-row { cursor: pointer; transition: background-color 0.12s ease; }
        .qb-doc-row:hover { background-color: var(--bs-tertiary-bg, #f5f7f9); }

        /* The table's horizontal scrollbar otherwise only paints while actively
           scrolling (Chromium's fluent overlay scrollbars, and Firefox's default
           overlay mode) — styling it at all switches it to the classic, always-
           rendered style instead, so it's visible up front as a navigation cue. */
        .table-responsive, .qb-scroll { scrollbar-width: thin; scrollbar-color: #c3c9d1 #eef1f3; }
        .table-responsive::-webkit-scrollbar, .qb-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
        .table-responsive::-webkit-scrollbar-track, .qb-scroll::-webkit-scrollbar-track { background: #eef1f3; border-radius: 6px; }
        .table-responsive::-webkit-scrollbar-thumb, .qb-scroll::-webkit-scrollbar-thumb { background-color: #c3c9d1; border-radius: 6px; border: 2px solid #eef1f3; }
        .table-responsive::-webkit-scrollbar-thumb:hover, .qb-scroll::-webkit-scrollbar-thumb:hover { background-color: #a9b0ba; }
      `}</style>

      {/* ── Doc confirms ── */}
      <ConfirmModal
        show={!!unlinkTarget}
        title="Remove Document from File"
        message={`Remove "${unlinkTarget?.title}" from this file? The document itself will not be deleted.`}
        confirmLabel="Remove"
        danger
        onConfirm={handleUnlink}
        onCancel={() => setUnlinkTarget(null)}
      />
      <ConfirmModal
        show={bulkUnlinkConfirm}
        title="Remove Selected Documents"
        message={`Remove ${selectedDocIds.size} document(s) from this file? The documents themselves will not be deleted.`}
        confirmLabel={`Remove ${selectedDocIds.size} Document(s)`}
        danger
        onConfirm={handleBulkUnlink}
        onCancel={() => setBulkUnlinkConfirm(false)}
      />
      <ConfirmModal
        show={!!deleteDocTarget}
        title="Delete Document"
        message={`This will permanently remove "${deleteDocTarget?.title}" from the system. This action cannot be undone.`}
        confirmLabel="Delete Document"
        danger
        onConfirm={handleDeleteDoc}
        onCancel={() => setDeleteDocTarget(null)}
      />

      {/* ── Doc move / copy / assign pickers ── */}
      {moveDocTarget && (
        <FilePickerModal
          title={`Move "${moveDocTarget.title}" to…`}
          tree={tree}
          excludeIds={isFileNode ? [selected.id] : []}
          confirmLabel="Move Here"
          onPick={handleMoveDoc}
          onClose={() => setMoveDocTarget(null)}
        />
      )}
      {copyDocTarget && (
        <FilePickerModal
          title={`Copy "${copyDocTarget.title}" to…`}
          tree={tree}
          excludeIds={isFileNode ? [selected.id] : []}
          confirmLabel="Copy Here"
          onPick={handleCopyDoc}
          onClose={() => setCopyDocTarget(null)}
        />
      )}
      {assignDocTarget && (
        <FilePickerModal
          title={`${assignMode === "copy" ? "Copy" : "Move"} "${assignDocTarget.title}" to…`}
          tree={tree}
          confirmLabel={assignMode === "copy" ? "Copy Here" : "Move Here"}
          onPick={handleAssignDoc}
          onClose={() => setAssignDocTarget(null)}
        />
      )}
      {bulkAssignConfirm && (
        <FilePickerModal
          title={`${bulkAssignMode === "copy" ? "Copy" : "Move"} ${selectedDocIds.size} Document(s) to…`}
          tree={tree}
          confirmLabel={bulkAssignMode === "copy" ? "Copy Here" : "Move Here"}
          onPick={handleBulkAssign}
          onClose={() => setBulkAssignConfirm(false)}
        />
      )}
      {shareDocTarget && (
        <DocumentSharesModal
          doc={shareDocTarget}
          onClose={() => setShareDocTarget(null)}
        />
      )}
      {versionsDocTarget && (
        <DocumentVersionsModal
          doc={versionsDocTarget}
          onChanged={loadDocs}
          onClose={() => setVersionsDocTarget(null)}
        />
      )}
      {/* ── Page layout ── */}
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center gap-2">
            <h4 className="mb-0">Files</h4>
          </div>
          <div className="d-flex gap-2">
            <Link
              to="/ed-mgt/documents/my-queue?view=landing"
              className="btn btn-outline-primary btn-sm"
              title="Documents you've recently uploaded, still awaiting OCR/classification or validation"
            >
              <i className="ti ti-inbox-in me-1" />Landing Queue
            </Link>
            <Link
              to={isFileNode ? `/ed-mgt/documents/upload?folder_id=${selected.id}` : "/ed-mgt/documents/upload"}
              className="btn btn-primary btn-sm"
            >
              <i className="ti ti-upload me-1" />Upload
            </Link>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => sidebarRef.current?.openNewFile(isFileNode ? selected : null)}
            >
              <i className="ti ti-folder-plus me-1" />New File
            </button>
          </div>
        </div>

        {/* ── Global search: any letter or file in every registry, with where it is and what it links to ── */}
        <GlobalSearch
          onOpenFile={(folderId) => {
            const node = flatTree[folderId];
            if (node) setSelected(node);
            else toast.error("That file is not open to you. Use Ask for access.");
          }}
        />

        <div className="d-flex" style={{ height: "calc(100vh - 230px)", minHeight: 420, gap: "1rem" }}>
          {/* ── Middle pane: file tree ── */}
          <FileTreeSidebar
            ref={sidebarRef}
            width="32%"
            minWidth={300}
            selected={isFileNode ? selected : null}
            onSelect={setSelected}
            onTreeChange={setTree}
            onFileDeleted={(f) => setSelected((cur) => (cur?.id === f.id ? null : cur))}
          />

          {/* ── Right: main canvas (mixed sub-files + documents) ── */}
          <div className="h-100" style={{ flex: "1 1 0%", minWidth: 0 }}>
            {isRoot ? (
              <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
                <div className="card-header bg-transparent border-bottom py-2" style={{ flexShrink: 0 }}>
                  <span className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                    <i className="ti ti-history me-2 text-primary" />Recently Affected Files
                  </span>
                  <small className="text-muted d-block">Files that last received a document or movement. Pick one to see its documents.</small>
                </div>
                <div className="card-body p-2 qb-scroll" style={{ overflowY: "auto", minHeight: 0 }}>
                  {recentFiles.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="ti ti-files-off" style={{ fontSize: 48, color: "#dee2e6" }} />
                      <h6 className="mt-3 text-muted">No file activity yet</h6>
                      <p style={{ fontSize: "0.875rem" }}>Upload a document into a file to get started.</p>
                      <Link to="/ed-mgt/documents/upload" className="btn btn-primary btn-sm">
                        <i className="ti ti-upload me-1" />Upload Document
                      </Link>
                    </div>
                  ) : recentFiles.map((f) => (
                    <div key={f.id} className="d-flex align-items-start gap-3 px-3 py-2 rounded hover-bg border-bottom"
                         style={{ cursor: "pointer" }} onClick={() => setSelected(f)}>
                      <i className="ti ti-folder mt-1" style={{ color: f.color || "#003d80", fontSize: "1.2rem" }} />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-semibold" style={{ fontSize: "0.9rem", overflowWrap: "anywhere" }}>{f.name}</div>
                        <div className="text-muted d-flex flex-wrap gap-2 align-items-center" style={{ fontSize: "0.75rem" }}>
                          {f.reference_no && <span>{f.reference_no}</span>}
                          {f.volume_no && <span>Vol. {f.volume_no}</span>}
                          {f.registry_name && <span className="badge bg-light text-secondary border">{f.registry_name}</span>}
                          {pathOf(f) && <span><i className="ti ti-corner-down-right me-1" />{pathOf(f)}</span>}
                        </div>
                      </div>
                      <span className="text-muted text-nowrap" style={{ fontSize: "0.75rem" }} title={new Date(f.last_activity_at).toLocaleString()}>
                        <i className="ti ti-clock me-1" />{fmtRelative(f.last_activity_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
            <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
              {/* Card header */}
              <div className="card-header bg-transparent border-bottom py-2" style={{ flexShrink: 0 }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <span className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                      {isFileNode ? selected.name : "All Files"}
                    </span>
                    {isFileNode && selected.description && (
                      <small className="text-muted d-block">{selected.description}</small>
                    )}
                  </div>
                  {isFileNode && !showCover && (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setOpenedId(null)} title="Back to the file cover">
                      <i className="ti ti-notebook me-1" />Cover
                    </button>
                  )}
                  {isFileNode && (
                    <Link to={`/ed-mgt/documents/upload?folder_id=${selected.id}`} className="btn btn-sm btn-primary"
                          title={`Upload a document into ${selected.name}`}>
                      <i className="ti ti-upload me-1" />Upload to this file
                    </Link>
                  )}
                  <div className={`d-flex gap-2 align-items-center flex-wrap ${isFileNode && showCover ? "d-none" : ""}`}>
                    <div className="input-group input-group-sm" style={{ width: 200 }}>
                      <span className="input-group-text bg-transparent border-end-0">
                        <i className="ti ti-search text-muted" style={{ fontSize: "0.85rem" }} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search documents…"
                        value={docSearch}
                        onChange={(e) => onSearchChange(e.target.value)}
                      />
                      {docSearch && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          type="button"
                          onClick={() => { setDocSearch(""); setPage(1); }}
                        >
                          <i className="ti ti-x" style={{ fontSize: "0.75rem" }} />
                        </button>
                      )}
                    </div>
                    <select className="form-select form-select-sm" style={{ width: 130 }} value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                      <option value="">All Statuses</option>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                    <select className="form-select form-select-sm" style={{ width: 130 }} value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                      <option value="">All Types</option>
                      {docTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button
                      className={`btn btn-sm text-nowrap ${docStarredOnly ? "btn-warning" : "btn-outline-secondary"}`}
                      title="Show only starred documents"
                      onClick={() => { setDocStarredOnly((v) => !v); setPage(1); }}
                    >
                      <i className="ti ti-star" />
                    </button>
                  </div>
                </div>
                {activeFilters.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2 mb-0">
                    {activeFilters.map((f) => (
                      <span key={f.key} className="badge bg-primary-subtle text-primary d-flex align-items-center gap-1 py-1 px-2"
                            style={{ fontSize: "0.78rem" }}>
                        {f.label}
                        <button className="btn-close btn-close-sm p-0 ms-1" style={{ fontSize: "0.6rem" }} onClick={f.onRemove}></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-body p-3 flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflow: "hidden" }}>
                {/* Documents — sub-files live in the tree on the left only;
                    listing them again here as cards duplicated navigation.

                    Scrolling lives on .table-responsive itself (both axes), not
                    on this card-body — that way its horizontal scrollbar sits at
                    the bottom of the visible card at all times. Nesting the
                    x-scroll inside a separately y-scrolling ancestor (the
                    previous layout) meant the horizontal scrollbar travelled
                    down with the content and only became reachable once
                    scrolled all the way to the last row. */}
                    {isFileNode && showCover ? (
                      <div className="flex-grow-1 py-3 px-1" style={{ minHeight: 0, overflowY: "auto" }}>
                        <FileCover folderId={selected.id} size="card" onOpen={() => setOpenedId(selected.id)} />
                      </div>
                    ) : (<>
                    {/* Bulk toolbar */}
                    {selectedDocIds.size > 0 && (() => {
                      const single = selectedDocIds.size === 1
                        ? docs.find((d) => selectedDocIds.has(d.id))
                        : null;
                      return (
                      <div className="px-2 py-2 mb-2 border rounded bg-body-tertiary d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                          {selectedDocIds.size} selected
                        </span>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => single && navigate(`/ed-mgt/documents/${single.id}`)}
                          disabled={!single}
                          title="View (select one document)"
                        >
                          <i className="ti ti-eye me-1" />View
                        </button>
                        {isFileNode ? (
                          <>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => single && setMoveDocTarget(single)}
                              disabled={!single}
                              title="Move (select one document)"
                            >
                              <i className="ti ti-drag-drop me-1" />Move
                            </button>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => single && setCopyDocTarget(single)}
                              disabled={!single}
                              title="Copy to file (select one document)"
                            >
                              <i className="ti ti-copy me-1" />Copy to File
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => setBulkUnlinkConfirm(true)}
                            >
                              <i className="ti ti-folder-minus me-1" />Remove from File
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => { setBulkAssignMode("move"); setBulkAssignConfirm(true); }}
                            >
                              <i className="ti ti-folder-symlink me-1" />Move
                            </button>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => { setBulkAssignMode("copy"); setBulkAssignConfirm(true); }}
                            >
                              <i className="ti ti-copy me-1" />Copy to File
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => single && setShareDocTarget(single)}
                          disabled={!single}
                          title="Share (select one document)"
                        >
                          <i className="ti ti-share me-1" />Share
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => single && setVersionsDocTarget(single)}
                          disabled={!single}
                          title="Version history (select one document)"
                        >
                          <i className="ti ti-versions me-1" />Version History
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleBulkDownload}
                          title="Download selected document(s)"
                        >
                          <i className="ti ti-download me-1" />Download
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleBulkStar}
                          title="Star selected document(s)"
                        >
                          <i className="ti ti-star me-1" />Star
                        </button>
                        <button
                          className="btn btn-link btn-sm text-muted ms-auto p-0"
                          onClick={() => setSelectedDocIds(new Set())}
                          title="Clear selection"
                        >
                          <i className="ti ti-x" />
                        </button>
                      </div>
                      );
                    })()}

                    {docsLoading ? (
                      <div className="text-center py-5 text-muted">
                        <span className="spinner-border" />
                      </div>
                    ) : docs.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className={`ti ${activeFilters.length ? "ti-zoom-cancel" : "ti-files-off"}`} style={{ fontSize: 48, color: "#dee2e6" }} />
                        <h6 className="mt-3 text-muted">
                          {activeFilters.length
                            ? "No documents match your filters"
                            : isRoot
                            ? "No uncategorized documents"
                            : "No documents in this file"}
                        </h6>
                        {activeFilters.length ? (
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                            setDocSearch(""); setStatusFilter(""); setTypeFilter(""); setDocStarredOnly(false); setPage(1);
                          }}>
                            Clear Filters
                          </button>
                        ) : (
                          <>
                            <p style={{ fontSize: "0.875rem" }}>Upload a document to get started.</p>
                            <Link
                              to={isFileNode ? `/ed-mgt/documents/upload?folder_id=${selected.id}` : "/ed-mgt/documents/upload"}
                              className="btn btn-primary btn-sm"
                            >
                              <i className="ti ti-upload me-1" />Upload Document
                            </Link>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
                        <table className="table align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: 36 }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={docs.length > 0 && selectedDocIds.size === docs.length}
                                  onChange={toggleAllDocs}
                                />
                              </th>
                              <th style={{ width: 32 }}></th>
                              <th style={{ fontSize: "0.8rem" }}>Title</th>
                              <th style={{ fontSize: "0.8rem" }}>Reference</th>
                              <th style={{ fontSize: "0.8rem" }}>Folio</th>
                              <th style={{ fontSize: "0.8rem" }}>Type</th>
                              <th style={{ fontSize: "0.8rem" }}>Created by</th>
                              <th style={{ fontSize: "0.8rem" }}>Status</th>
                              <th style={{ fontSize: "0.8rem" }}>Confidentiality</th>
                              <th style={{ fontSize: "0.8rem" }}>v</th>
                              <th style={{ fontSize: "0.8rem" }}>Modified</th>
                              <th style={{ fontSize: "0.8rem" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {docs.map((doc) => (
                              <tr
                                key={doc.id}
                                className={`qb-doc-row ${selectedDocIds.has(doc.id) ? "table-active" : ""}`}
                                onClick={() => navigate(`/ed-mgt/documents/${doc.id}`)}
                              >
                                <td onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedDocIds.has(doc.id)}
                                    onChange={() => toggleDocSelection(doc.id)}
                                  />
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <button className="btn btn-sm btn-link p-0 border-0" title={doc.is_starred ? "Unstar" : "Star"}
                                          onClick={() => handleToggleDocStar(doc)}>
                                    <i className={`ti ti-star ${doc.is_starred ? "text-warning" : "text-muted"}`}></i>
                                  </button>
                                </td>
                                <td onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.8rem" }}>
                                  <Link
                                    to={`/ed-mgt/documents/${doc.id}`}
                                    className="text-decoration-none text-primary"
                                  >
                                    {doc.title}
                                  </Link>
                                </td>
                                <td style={{ fontSize: "0.8rem" }}>
                                  <code className="text-primary" style={{ fontSize: "0.76rem", fontWeight: 600 }}>
                                    {doc.document_reference || "—"}
                                  </code>
                                </td>
                                <td style={{ fontSize: "0.8rem" }}>
                                  <span className="badge border border-secondary text-secondary" style={{ fontSize: "0.72rem" }}>
                                    {doc.folio_number != null ? `Folio ${doc.folio_number}` : "—"}
                                  </span>
                                </td>
                                <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                                  {doc.document_type_name || "—"}
                                </td>
                                <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                                  {doc.owner_user_name || (doc.owner_user_id ? `User #${doc.owner_user_id}` : "—")}
                                </td>
                                <td><StatusBadge status={doc.status} /></td>
                                <td>
                                  <span className="badge border border-secondary text-secondary" style={{ fontSize: "0.72rem" }}>
                                    {doc.confidentiality_level}
                                  </span>
                                </td>
                                <td onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.8rem" }}>
                                  <button
                                    className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                                    style={{ fontSize: "inherit" }}
                                    title="View version history"
                                    onClick={() => setVersionsDocTarget(doc)}
                                  >
                                    v{doc.current_version_number}
                                  </button>
                                </td>
                                <td style={{ fontSize: "0.8rem" }}>
                                  <span className="text-muted" title={doc.created_at}>{fmtRelative(doc.created_at)}</span>
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <FixedMenu trigger={<i className="ti ti-dots-vertical" />}>
                                    {(close) => renderDocActions(doc, close)}
                                  </FixedMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {docs.length > 0 && (
                      <div className="pt-2">
                        <EDMSPagination
                          page={page}
                          pageSize={pageSize}
                          totalCount={docsTotal}
                          totalPages={Math.ceil(docsTotal / pageSize)}
                          onPageChange={setPage}
                          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
                        />
                      </div>
                    )}
                    </>)}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */
function flattenTree(nodes, acc = {}) {
  nodes.forEach((n) => {
    acc[n.id] = n;
    if (n.children?.length) flattenTree(n.children, acc);
  });
  return acc;
}

// Maps file id -> its parent's id (root files map to null). The tree
// endpoint never returns parent_folder_id on individual nodes, so this is
// the only way to walk "up" the tree.
function buildParentMap(nodes, parentId = null, map = {}) {
  nodes.forEach((n) => {
    map[n.id] = parentId;
    if (n.children?.length) buildParentMap(n.children, n.id, map);
  });
  return map;
}

export default FilesBrowser;
