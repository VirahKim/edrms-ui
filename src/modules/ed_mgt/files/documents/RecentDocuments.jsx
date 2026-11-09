import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import StatusBadge from "../../components/StatusBadge";
import EDMSPagination from "../../components/EDMSPagination";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import FixedMenu from "../../components/FixedMenu";
import {
  getDocuments, getVersions, getDownloadUrl,
  starDocument, unstarDocument, submitDocument,
} from "../../../../api/edmsApi";

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

// Sorting happens server-side (GET /api/documents?sort_field=...) rather than
// client-side, since the list is paginated — sorting only the current page's
// items in the browser would silently give the wrong order across pages.
const SORT_OPTIONS = [
  { key: "updated_at", label: "Last Updated", icon: "ti-edit-circle" },
  { key: "created_at", label: "Date Created",  icon: "ti-calendar-plus" },
];

// Shared by both the Recent (`mode="recent"`) and Starred (`mode="starred"`)
// document lists — same sortable/paginated table, just a different source
// filter and a different meaning for "unstar" (see handleToggleStar below).
const RecentDocuments = ({ mode = "recent" }) => {
  const isStarredView = mode === "starred";
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("updated_at");
  const [sortDir, setSortDir] = useState("desc");

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, page_size: pageSize, sort_field: sortField, sort_direction: sortDir };
    if (isStarredView) params.starred_only = true;
    getDocuments(params)
      .then((res) => {
        setDocs(Array.isArray(res?.items) ? res.items : []);
        setTotal(res?.total_count || 0);
        setTotalPages(res?.total_pages || 1);
      })
      .catch(() => toast.error(`Failed to load ${isStarredView ? "starred" : "recent"} documents.`))
      .finally(() => setLoading(false));
  }, [page, pageSize, sortField, sortDir, isStarredView]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [sortField, sortDir]);

  // On the Starred view, this list IS the star filter — unstarring a document
  // means it no longer belongs here, so it's optimistically dropped from the
  // list entirely rather than just flipping the icon in place (which is what
  // the Recent/plain-list behavior below still does, since star status there
  // is just a badge, not a filter).
  const handleToggleStar = async (doc) => {
    const wasStarred = !!doc.is_starred;

    if (isStarredView && wasStarred) {
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setTotal((t) => Math.max(0, t - 1));
      try {
        await unstarDocument(doc.id);
      } catch {
        toast.error("Failed to unstar document.");
        load(); // resync — the optimistic removal may no longer be correct
      }
      return;
    }

    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_starred: !wasStarred } : d)));
    try {
      if (wasStarred) await unstarDocument(doc.id);
      else await starDocument(doc.id);
    } catch {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, is_starred: wasStarred } : d)));
      toast.error(wasStarred ? "Failed to unstar document." : "Failed to star document.");
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

  const handleSubmitDoc = async (doc) => {
    try {
      const res = await submitDocument(doc.id);
      toast.success(res?.data?.status === "ACTIVE" ? "Document activated — no approval required." : "Document submitted for approval.");
      load();
    } catch (err) { toast.error(err?.response?.data?.message || "Submit failed."); }
  };

  const activeSort = SORT_OPTIONS.find((s) => s.key === sortField) || SORT_OPTIONS[0];
  const timeField = sortField === "created_at" ? "created_at" : "updated_at";

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <h4 className="mb-0">{isStarredView ? "Starred Documents" : "Recent Documents"}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom py-2">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <p className="text-muted mb-0" style={{ fontSize: "0.82rem" }}>
                Sorted by {activeSort.label.toLowerCase()}, {sortDir === "desc" ? "newest" : "oldest"} first.
              </p>
              <div className="d-flex align-items-center gap-2">
                <div className="btn-group btn-group-sm" role="group">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`btn ${sortField === s.key ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setSortField(s.key)}
                    >
                      <i className={`ti ${s.icon} me-1`}></i>{s.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  title={sortDir === "desc" ? "Newest first" : "Oldest first"}
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                >
                  <i className={`ti ${sortDir === "desc" ? "ti-sort-descending" : "ti-sort-ascending"}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Reference</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Created by</th>
                    <th>Status</th>
                    <th>{activeSort.label}</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j}><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                        ))}
                      </tr>
                    ))
                  ) : docs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className={`ti ${isStarredView ? "ti-star-off" : "ti-clock-off"}`} style={{ fontSize: 56 }}></i>
                          <h6 className="mt-3 mb-1">{isStarredView ? "No starred documents" : "No documents yet"}</h6>
                          <p className="small mb-0">
                            {isStarredView
                              ? "Star a document to pin it here for quick access."
                              : "Documents you create or edit will show up here."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : docs.map((doc) => (
                    <tr
                      key={doc.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/ed-mgt/documents/${doc.id}`)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-sm btn-link p-0 border-0" title={doc.is_starred ? "Unstar" : "Star"}
                                onClick={() => handleToggleStar(doc)}>
                          <i className={`ti ti-star ${doc.is_starred ? "text-warning" : "text-muted"}`}></i>
                        </button>
                      </td>
                      <td><code className="text-body" style={{ fontSize: "0.78rem" }}>{doc.document_reference}</code></td>
                      <td style={{ maxWidth: "28ch", whiteSpace: "normal", wordBreak: "break-word" }} onClick={(e) => e.stopPropagation()}>
                        <Link to={`/ed-mgt/documents/${doc.id}`} className="text-decoration-none fw-semibold text-body">
                          {doc.title}
                        </Link>
                      </td>
                      <td className="text-muted">{doc.document_type_name || "—"}</td>
                      <td className="text-muted">{doc.owner_user_name || (doc.owner_user_id ? `User #${doc.owner_user_id}` : "—")}</td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td>
                        <span className="text-muted" title={doc[timeField]}>{fmtRelative(doc[timeField])}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <FixedMenu trigger={<i className="ti ti-dots-vertical" />}>
                          {(close) => (<>
                            <li>
                              <button className="dropdown-item" onClick={() => { close(); navigate(`/ed-mgt/documents/${doc.id}`); }}>
                                <i className="ti ti-eye me-2 text-primary" />View
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => { close(); handleDownload(doc); }}>
                                <i className="ti ti-download me-2 text-secondary" />Download
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item" onClick={() => { close(); handleToggleStar(doc); }}>
                                <i className={`ti ${doc.is_starred ? "ti-star-off" : "ti-star"} me-2 text-warning`} />
                                {doc.is_starred ? "Unstar" : "Star"}
                              </button>
                            </li>
                            {doc.status === "LANDING" && (
                              <li>
                                <button className="dropdown-item" onClick={() => { close(); handleSubmitDoc(doc); }}>
                                  <i className="ti ti-send me-2 text-success" />Submit
                                </button>
                              </li>
                            )}
                          </>)}
                        </FixedMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer bg-transparent border-top px-3 py-2">
            <EDMSPagination
              page={page}
              pageSize={pageSize}
              totalCount={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RecentDocuments;
