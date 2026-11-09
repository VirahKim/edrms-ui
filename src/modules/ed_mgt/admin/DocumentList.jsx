import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import StatusBadge from "../components/StatusBadge";
import EDMSPagination from "../components/EDMSPagination";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import SubmitCommentModal from "../components/SubmitCommentModal";
import FilePickerModal from "../files/fileModals/FilePickerModal";
import DocumentSharesModal from "../files/documents/DocumentSharesModal";
import { isSubmittableStatus } from "../constants/documentStatus";
import {
  getDocuments, getDocumentTypes,
  getVersions, getDownloadUrl, deleteDocument,
  starDocument, unstarDocument,
  getFileTree, linkDocumentToFile,
} from "../../../api/edmsApi";

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

const DocumentList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [docs, setDocs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [docTypes, setDocTypes]   = useState([]);
  const [fileTree, setFileTree] = useState([]);
  const [selected, setSelected]   = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [fileTarget, setFileTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos]       = useState(null);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const page     = Number(searchParams.get("page")      || 1);
  const pageSize = Number(searchParams.get("page_size") || 25);
  const status   = searchParams.get("status")   || "";
  const typeId   = searchParams.get("type_id")  || "";
  const query    = searchParams.get("q")        || "";
  const starredOnly = searchParams.get("starred_only") === "true";

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.set("page", "1");
    setSearchParams(p);
  };

  const setPage = (n) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", n);
    setSearchParams(p);
  };

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDocuments({ page, page_size: pageSize, status: status || undefined, document_type_id: typeId || undefined, text_query: query || undefined, starred_only: starredOnly || undefined });
      setDocs(res?.items || []);
      setTotal(res?.total_count || 0);
      setTotalPages(res?.total_pages || 1);
    } catch {
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, typeId, query, starredOnly]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  useEffect(() => {
    getDocumentTypes().then((r) => setDocTypes(r?.data || [])).catch(() => {});
    getFileTree().then((r) => setFileTree(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const close = () => { setOpenMenuId(null); setMenuPos(null); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const onSearchChange = (val) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", val), 300);
  };

  const activeFilters = [
    status  && { key: "status",  label: `Status: ${status}`,   onRemove: () => setParam("status", "") },
    typeId  && { key: "type_id", label: `Type: ${docTypes.find((t) => String(t.id) === typeId)?.name || typeId}`, onRemove: () => setParam("type_id", "") },
    query   && { key: "q",       label: `Search: "${query}"`,  onRemove: () => { setParam("q", ""); if (searchRef.current) searchRef.current.value = ""; } },
    starredOnly && { key: "starred_only", label: "Starred only", onRemove: () => setParam("starred_only", "") },
  ].filter(Boolean);

  const handleToggleStar = async (doc) => {
    const wasStarred = !!doc.is_starred;
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_starred: !wasStarred } : d)));
    try {
      if (wasStarred) await unstarDocument(doc.id);
      else await starDocument(doc.id);
    } catch {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_starred: wasStarred } : d)));
      toast.error(wasStarred ? "Failed to unstar document." : "Failed to star document.");
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === docs.length ? [] : docs.map((d) => d.id));

  const handleDownload = async (doc) => {
    try {
      const versionsRes = await getVersions(doc.id);
      const versions = versionsRes?.items || (Array.isArray(versionsRes) ? versionsRes : []);
      const version = versions.find((v) => v.version_number === doc.current_version_number) || versions[0];
      if (!version?.id) { toast.error("No downloadable version found."); return; }
      const res = await getDownloadUrl(doc.id, version.id);
      const url = res?.presigned_url || res?.download_url || res?.url;
      if (!url) { toast.error("Download link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get download link."); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteDocument(deleteTarget.id);
      toast.success("Document deleted.");
      setDeleteTarget(null);
      loadDocs();
    } catch (e) { toast.error(e?.response?.data?.message || "Delete failed."); }
    finally { setActionLoading(false); }
  };

  const handleAssignFile = async (file) => {
    if (!fileTarget) return;
    try {
      await linkDocumentToFile(file.id, fileTarget.id);
      toast.success(`Document added to "${file.name}".`);
      setFileTarget(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to assign file.");
      setFileTarget(null);
    }
  };

  const STATUSES = ["LANDING","DRAFT","SUBMITTED","PENDING_APPROVAL","APPROVED","REJECTED","RETURNED_FOR_REWORK","LOCKED","ARCHIVED"];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0">Documents · Admin</h4>
        </div>
        {/* Header */}
        <div className="card border-0 shadow-sm">
          {/* Filter Bar */}
          <div className="card-header bg-transparent border-bottom py-2">
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <div className="input-group input-group-sm" style={{ width: 240 }}>
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="ti ti-search text-muted"></i>
                  </span>
                  <input ref={searchRef} type="text" className="form-control border-start-0"
                         placeholder="Search documents…" defaultValue={query}
                         onChange={(e) => onSearchChange(e.target.value)} />
                </div>
                <select className="form-select form-select-sm" style={{ width: 150 }} value={status} onChange={(e) => setParam("status", e.target.value)}>
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                <select className="form-select form-select-sm" style={{ width: 150 }} value={typeId} onChange={(e) => setParam("type_id", e.target.value)}>
                  <option value="">All Types</option>
                  {docTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button
                  className={`btn btn-sm text-nowrap ${starredOnly ? "btn-warning" : "btn-outline-secondary"}`}
                  title="Show only starred documents"
                  onClick={() => setParam("starred_only", starredOnly ? "" : "true")}
                >
                  <i className="ti ti-star me-1"></i>Starred
                </button>
                {activeFilters.length > 0 && (
                  <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => setSearchParams({})}>
                    <i className="ti ti-filter-off me-1"></i> Clear
                  </button>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <Link to="/ed-mgt/documents/duplicate-check" className="btn btn-sm btn-outline-secondary text-nowrap" title="Manually search for duplicate documents">
                  <i className="ti ti-copy me-1"></i>Check Duplicates
                </Link>
                <Link to="/ed-mgt/documents/bulk-upload" className="btn btn-sm btn-outline-secondary text-nowrap" title="Upload multiple files at once">
                  <i className="ti ti-stack-2 me-1"></i>Bulk Upload
                </Link>
                <Link to="/ed-mgt/documents/upload" className="btn btn-sm btn-primary text-nowrap">
                  <i className="ti ti-upload me-1"></i>Upload
                </Link>
              </div>
            </div>

            {/* Active filter chips */}
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

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="card-header bg-primary-subtle border-bottom d-flex align-items-center gap-3 py-2">
              <span className="fw-semibold text-primary">{selected.length} selected</span>
              <button className="btn btn-sm btn-outline-primary">
                <i className="ti ti-send me-1"></i> Submit Selected
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelected([])}>
                <i className="ti ti-x me-1"></i> Deselect
              </button>
            </div>
          )}

          {/* Table */}
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" className="form-check-input"
                             checked={docs.length > 0 && selected.length === docs.length}
                             onChange={toggleAll} />
                    </th>
                    <th style={{ width: 32 }}></th>
                    <th>Document Title</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Modified</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j}>
                            <div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : docs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className={`ti ${starredOnly ? "ti-star-off" : "ti-files-off"}`} style={{ fontSize: 56 }}></i>
                          <h6 className="mt-3 mb-1">
                            {starredOnly ? "No starred documents" : activeFilters.length ? "No documents match your filters" : "No documents yet"}
                          </h6>
                          <p className="small mb-3">
                            {starredOnly ? "Star documents to find them here." : activeFilters.length ? "Try adjusting your search filters." : "Upload your first document to get started."}
                          </p>
                          {starredOnly ? (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setParam("starred_only", "")}>
                              Show All Documents
                            </button>
                          ) : activeFilters.length ? (
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSearchParams({})}>
                              Clear Filters
                            </button>
                          ) : (
                            <Link to="/ed-mgt/documents/upload" className="btn btn-sm btn-primary">
                              <i className="ti ti-upload me-1"></i> Upload Document
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : docs.map((doc) => {
                    return (
                      <tr key={doc.id} className={selected.includes(doc.id) ? "table-primary" : ""}>
                        <td>
                          <input type="checkbox" className="form-check-input"
                                 checked={selected.includes(doc.id)}
                                 onChange={() => toggleSelect(doc.id)} />
                        </td>
                        <td>
                          <button className="btn btn-sm btn-link p-0 border-0" title={doc.is_starred ? "Unstar" : "Star"}
                                  onClick={(e) => { e.stopPropagation(); handleToggleStar(doc); }}>
                            <i className={`ti ti-star ${doc.is_starred ? "text-warning" : "text-muted"}`}></i>
                          </button>
                        </td>
                        <td style={{ maxWidth: "25ch", whiteSpace: "normal", wordBreak: "break-word" }}>
                          <Link to={`/ed-mgt/admin/documents/${doc.id}`} className="text-decoration-none fw-semibold text-body">
                            {doc.title}
                          </Link>
                        </td>
                        <td>
                          <span
                            className="fst-italic text-muted"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigator.clipboard?.writeText(doc.document_reference)}
                            title="Click to copy"
                          >
                            {doc.document_reference}
                          </span>
                        </td>
                        <td><span className="text-muted">{doc.document_type_name || "—"}</span></td>
                        <td><StatusBadge status={doc.status} /></td>
                        <td>
                          <span className="text-muted" title={doc.updated_at || doc.created_at}>{fmtRelative(doc.updated_at || doc.created_at)}</span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-secondary border-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openMenuId === doc.id) { setOpenMenuId(null); setMenuPos(null); return; }
                                    const r = e.currentTarget.getBoundingClientRect();
                                    setMenuPos({ top: r.bottom, right: window.innerWidth - r.right });
                                    setOpenMenuId(doc.id);
                                  }}>
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          {openMenuId === doc.id && menuPos && (
                            <ul className="dropdown-menu shadow-sm show"
                                style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 1055 }}
                                onClick={(e) => e.stopPropagation()}>
                              <li>
                                <button className="dropdown-item" onClick={() => { setOpenMenuId(null); navigate(`/ed-mgt/admin/documents/${doc.id}`); }}>
                                  <i className="ti ti-eye me-2 text-primary"></i> View
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => { setOpenMenuId(null); setFileTarget(doc); }}>
                                  <i className="ti ti-folder me-2 text-secondary"></i> Assign to File
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => { setOpenMenuId(null); setShareTarget(doc); }}>
                                  <i className="ti ti-share me-2 text-info"></i> Share
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => { setOpenMenuId(null); handleDownload(doc); }}>
                                  <i className="ti ti-download me-2 text-secondary"></i> Download
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => { setOpenMenuId(null); handleToggleStar(doc); }}>
                                  <i className={`ti ${doc.is_starred ? "ti-star-off" : "ti-star"} me-2 text-warning`}></i>
                                  {doc.is_starred ? "Unstar" : "Star"}
                                </button>
                              </li>
                              {isSubmittableStatus(doc.status) && (
                                <li>
                                  <button className="dropdown-item" onClick={() => { setOpenMenuId(null); setSubmitTarget(doc); }} disabled={actionLoading}>
                                    <i className="ti ti-send me-2 text-success"></i> {doc.status === "ACTIVE" ? "Resubmit" : "Submit"}
                                  </button>
                                </li>
                              )}
                              <li><hr className="dropdown-divider" /></li>
                              {doc.status === "LANDING" && (
                                <li>
                                  <button className="dropdown-item text-danger"
                                          onClick={() => { setOpenMenuId(null); setDeleteTarget(doc); }}>
                                    <i className="ti ti-trash me-2"></i> Delete
                                  </button>
                                </li>
                              )}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="card-footer bg-transparent border-top px-3 py-2">
            <EDMSPagination page={page} totalPages={totalPages} totalCount={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(n) => { const p = new URLSearchParams(searchParams); p.set("page_size", n); p.set("page", "1"); setSearchParams(p); }} />
          </div>
        </div>
      </div>

      {fileTarget && (
        <FilePickerModal
          title={`Assign "${fileTarget.title}" to file…`}
          tree={fileTree}
          confirmLabel="Assign Here"
          onPick={handleAssignFile}
          onClose={() => setFileTarget(null)}
        />
      )}

      {shareTarget && (
        <DocumentSharesModal
          doc={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}

      {submitTarget && (
        <SubmitCommentModal
          documentId={submitTarget.id}
          onClose={() => setSubmitTarget(null)}
          onSubmitted={loadDocs}
        />
      )}

      <ConfirmModal show={!!deleteTarget} danger title="Delete Document?"
        message={`This will permanently remove "${deleteTarget?.title}" from the system. This action cannot be undone.`}
        confirmLabel="Delete Document" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </DashboardLayout>
  );
};

export default DocumentList;
