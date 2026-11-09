import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../../constants/fonts";
import PipelineStatusBadge from "../../components/PipelineStatusBadge";
import EDMSPagination from "../../components/EDMSPagination";
import EDMSToastProvider, { toast } from "../../components/EDMSToast";
import Tooltip from "../../components/Tooltip";
import FilePickerModal from "../fileModals/FilePickerModal";
import { getFileRoutingMe } from "../../../../api/fileRoutingApi";
import { FileRoutingTable } from "../../routing/FileRoutingList";
import PinPlacementLayer from "../../components/PinPlacementLayer";
import DocumentPreviewPanel from "../../components/DocumentPreviewPanel";
import apiClient from "../../../../api/apiClient";
import {
  getDocuments, getDocument,
  starDocument, unstarDocument, getVersions, getDownloadUrl,
  getFileTree, linkDocumentToFile,
} from "../../../../api/edmsApi";
import { getPendingApprovals, getWorkflowEnums, getWorkflowInstances, getApprovalHistory } from "../../../../api/workflowsApi";
import { isDocumentEntityType } from "../../../../utils/entityType";
import { FILE_REQUEST_VERBS, resolveApprovalEntityDetails } from "../../../../utils/approvalEntityDetails";

// Records requests (entity_id is the file request id), and the verb each one shows.

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

// First tab for the Marking and Action Officers: the files waiting on them.
const ACT_ON_VIEW = { key: "act-on", label: "Files to Act On", icon: "ti-checks",
  blurb: "Files sent to you that are waiting for your marking or action." };

// First tab for the Registry Officer: the files in routing (see /ed-mgt/file-routing).
const ROUTING_VIEW = { key: "routing", label: "File Routing/Movement", icon: "ti-send",
  blurb: "Files sent for marking or action, where each one is now, and the ones back for you to route or file away." };

const VIEWS = [
  { key: "approvals", label: "Pending Approvals", icon: "ti-clock-check",
    blurb: "Workflow steps currently waiting on your review and approval." },
  { key: "landing", label: "Landing Queue", status: "LANDING", icon: "ti-inbox-in",
    blurb: "Newly received documents, org-wide, waiting to be picked up and worked." },
  { key: "submissions", label: "My Submissions", icon: "ti-send",
    blurb: "Everything you've sent for approval, of any type — track status and see reviewer feedback." },
];

// Mirrors the bucket values DocumentsController.ListDocuments computes
// server-side (pipeline_status query param) and PipelineStatusBadge.jsx
// derives for display — keep the three in sync.
const PIPELINE_FILTER_OPTIONS = [
  { value: "",             label: "All Statuses" },
  { value: "FAILED",       label: "Failed" },
  { value: "PROCESSING",   label: "Processing" },
  { value: "NEEDS_REVIEW", label: "Needs Review" },
  { value: "SCANNING",     label: "Scanning for Viruses" },
  { value: "VIRUS",        label: "Threat Detected" },
  { value: "READY",        label: "Awaiting Validation" },
];

const ACTION_LABEL = {
  SUBMIT: "Submitted",
  APPROVE: "Approved",
  REJECT: "Rejected",
  SEND_BACK: "Sent back",
  RESUBMIT: "Resubmitted",
  CANCEL: "Cancelled",
  DELEGATE: "Delegated",
};

const ACTION_BADGE_CLASS = {
  SUBMIT: "bg-info",
  APPROVE: "bg-success",
  REJECT: "bg-danger",
  SEND_BACK: "bg-warning text-dark",
  RESUBMIT: "bg-primary",
  CANCEL: "bg-secondary",
  DELEGATE: "bg-dark",
};

// Mirrors ApprovalWindow.jsx's CommentDisplay — a plain-text comment renders
// as an italic quote, a sticky-note comment renders as a small pinned-note
// block, with an optional "View placement" link to see where it was pinned
// on the actual document (onViewPlacement).
const HistoryComment = ({ comment, commentStyle, pinX, pinY, onViewPlacement }) => {
  if (!comment) return null;
  if (commentStyle === "STICKY_NOTE") {
    const hasPin = pinX != null && pinY != null;
    return (
      <div className="mt-1 p-2 rounded" style={{ backgroundColor: "#fff9db", border: "1px solid #ffe066", fontSize: "0.85rem", maxWidth: 360 }}>
        <div className="d-flex align-items-start gap-1">
          <i className="ti ti-pin text-warning mt-1"></i>
          <div>
            <div className="mb-1">{comment}</div>
            {hasPin && (
              <button type="button" className="btn btn-sm btn-link p-0" onClick={onViewPlacement}>
                <i className="ti ti-map-pin me-1"></i>View
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  return <p className="mb-0 mt-1 text-muted small fst-italic">&ldquo;{comment}&rdquo;</p>;
};

const INSTANCE_STATUS_BADGE = {
  IN_PROGRESS: "bg-warning text-dark",
  APPROVED: "bg-success",
  REJECTED: "bg-danger",
  CANCELLED: "bg-secondary",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getDueDateBadge = (dateStr) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return <span className="badge bg-danger ms-1">Overdue</span>;
  if (daysLeft === 0) return <span className="badge bg-warning text-dark ms-1">Due Today</span>;
  if (daysLeft <= 3) return <span className="badge bg-warning text-dark ms-1">{daysLeft}d left</span>;
  return null;
};

const getStepsProgress = (pending, total) => {
  if (!total) return 0;
  return Math.round(((total - pending) / total) * 100);
};

// entity_snapshot is whatever the caller passed as entity_data when the
// workflow was started — for DOCUMENT submissions that's { title,
// document_reference, ... }, captured at submit time. Reading it here
// labels a submission with zero extra API calls, and — unlike a live
// GetDocument lookup — it can't fail on a permissions/organization mismatch.
const parseSnapshot = (item) => {
  if (!item?.entity_snapshot) return null;
  try { return JSON.parse(item.entity_snapshot); } catch { return null; }
};

const MyQueue = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const [routingRoles, setRoutingRoles] = useState({});
  useEffect(() => {
    getFileRoutingMe().then((r) => setRoutingRoles(r?.data || {})).catch(() => {});
  }, []);
  const isRegistryOfficer = !!routingRoles.is_registry_officer;
  // Stages of the files waiting on this user as Marking / Action Officer.
  const actOnStages = [
    routingRoles.is_marking_officer && "MARKING",
    routingRoles.is_action_officer && "ACTION",
  ].filter(Boolean);
  const views = [
    ...(isRegistryOfficer ? [ROUTING_VIEW] : []),
    ...(actOnStages.length ? [ACT_ON_VIEW] : []),
    ...VIEWS,
  ];
  const [view, setView] = useState(VIEWS.some((v) => v.key === requestedView) ? requestedView : "approvals");
  // The role resolves after first render; a Registry Officer lands on the routing tab unless another view was asked for.
  useEffect(() => {
    if (requestedView && requestedView !== "routing" && requestedView !== "act-on") return;
    if (requestedView === "act-on" ? actOnStages.length : requestedView === "routing" ? isRegistryOfficer : true) {
      if (requestedView === "act-on" || (!isRegistryOfficer && actOnStages.length)) setView("act-on");
      else if (isRegistryOfficer) setView("routing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegistryOfficer, actOnStages.join(","), requestedView]);
  const [docs, setDocs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [entityTypes, setEntityTypes] = useState([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [approvalCount, setApprovalCount] = useState(0);
  // Keyed by `${entity_type}:${entity_id}` — entity_id is only unique within
  // its own entity type (a TENDER #5 and a DOCUMENT #5 can coexist), so a
  // bare entity_id key would let one type's details leak onto the other.
  const [entityDetailMap, setEntityDetailMap] = useState({});
  const [fileTree, setFileTree] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [fileTarget, setFileTarget] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [feedbackHistoryLoading, setFeedbackHistoryLoading] = useState(false);
  const [feedbackHistoryError, setFeedbackHistoryError] = useState("");
  const [historyPinPreview, setHistoryPinPreview] = useState(null);
  const [pinPreviewDoc, setPinPreviewDoc] = useState(null);

  // Workflow user_ids (submitter, approvers) have no name attached
  // server-side — WorkflowsAPI only knows ids. Same workaround
  // CreateWorkflowDefinition.jsx already uses: load the org's user list from
  // IAmAPI once and resolve names client-side.
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    apiClient.get("/IAmAPI/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUsers(res.data || []))
      .catch(() => {});
  }, []);
  const getUserName = (userId) => {
    if (userId == null) return null;
    const u = users.find((x) => x.id === userId);
    return u ? `${u.first_name} ${u.other_name}`.trim() : null;
  };

  // Full workflow history (every SUBMIT/APPROVE/REJECT/SEND_BACK/RESUBMIT
  // action, with comments) for whichever submission's feedback modal is open
  // — the modal used to only show `feedbackTarget.steps` (current approver
  // state), which misses the submission comment and any resubmit history.
  useEffect(() => {
    if (!feedbackTarget) { setFeedbackHistory([]); return; }
    setFeedbackHistoryLoading(true);
    setFeedbackHistoryError("");
    getApprovalHistory(feedbackTarget.id)
      .then((res) => setFeedbackHistory(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setFeedbackHistoryError("Failed to load approval history."))
      .finally(() => setFeedbackHistoryLoading(false));
  }, [feedbackTarget]);

  // Fetches the document once, only when a sticky-note "View placement" link
  // is actually clicked — most submissions never need this.
  useEffect(() => {
    if (!historyPinPreview) { setPinPreviewDoc(null); return; }
    if (!isDocumentEntityType(feedbackTarget.entity_type)) { setPinPreviewDoc(null); return; }
    getDocument(feedbackTarget.entity_id)
      .then((res) => setPinPreviewDoc(res?.data || res))
      .catch(() => setPinPreviewDoc(null));
  }, [historyPinPreview, feedbackTarget]);

  const load = useCallback(async () => {
    if (view === "routing" || view === "act-on") { setLoading(false); return; }
    setLoading(true);
    if (view === "approvals") {
      try {
        const res = await getPendingApprovals({ entity_type: entityTypeFilter, page, page_size: pageSize });
        const items = Array.isArray(res?.data) ? res.data : [];
        setApprovals(items);
        setTotal(res?.total_count || 0);
        setTotalPages(res?.total_pages || 1);
        loadEntityDetails(items);
      } catch { toast.error("Failed to load pending approvals."); }
      finally { setLoading(false); }
      return;
    }
    if (view === "submissions") {
      try {
        // Every approval request the user started, whatever its type (documents, file requests, tenders ...).
        const res = await getWorkflowInstances({ mine_only: true, page, page_size: pageSize });
        const items = Array.isArray(res?.data) ? res.data : [];
        setSubmissions(items);
        setTotal(res?.total_count || 0);
        setTotalPages(res?.total_pages || 1);
        loadEntityDetails(items);
      } catch { toast.error("Failed to load your submissions."); }
      finally { setLoading(false); }
      return;
    }
    const v = VIEWS.find((x) => x.key === view);
    try {
      const params = { page, page_size: pageSize, status: v.status };
      if (view === "landing" && pipelineStatusFilter) params.pipeline_status = pipelineStatusFilter;
      const res = await getDocuments(params);
      setDocs(Array.isArray(res?.items) ? res.items : []);
      setTotal(res?.total_count || 0);
      setTotalPages(res?.total_pages || 1);
    } catch { toast.error("Failed to load queue."); }
    finally { setLoading(false); }
  }, [view, page, pageSize, entityTypeFilter, pipelineStatusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); setPipelineStatusFilter(""); }, [view]);

  // Lightweight, decoupled from the main list load so the tab badge stays
  // accurate even while a different tab is active.
  useEffect(() => {
    let cancelled = false;
    getPendingApprovals({ page: 1, page_size: 1 })
      .then((r) => { if (!cancelled) setApprovalCount(r?.total_count || 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Once the approvals tab itself has loaded, its own total is the freshest
  // count — keep the badge in sync with it instead of the separate poll.
  useEffect(() => {
    if (view === "approvals" && !loading) setApprovalCount(total);
  }, [view, loading, total]);

  useEffect(() => {
    getWorkflowEnums()
      .then((res) => {
        const items = res?.data?.entity_types || [];
        setEntityTypes(
          (Array.isArray(items) ? items : []).map((item) => ({
            code: item.Code ?? item.code ?? "",
            description: item.Description ?? item.description ?? "",
          }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getFileTree().then((r) => setFileTree(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
  }, []);

  const getEntityTypeLabel = (code) => {
    const found = entityTypes.find((e) => e.code === code);
    return found ? found.description : code;
  };

  // Readable label + link for each approval row - the same resolver the Workflows pending list uses.
  const loadEntityDetails = (items) => resolveApprovalEntityDetails(items, setEntityDetailMap);

  useEffect(() => {
    const close = () => { setOpenMenuId(null); setMenuPos(null); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const openMenu = (e, doc) => {
    e.stopPropagation();
    if (openMenuId === doc.id) { setOpenMenuId(null); setMenuPos(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: r.bottom, right: window.innerWidth - r.right });
    setOpenMenuId(doc.id);
  };

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

  const activeView = views.find((v) => v.key === view) || VIEWS[0];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <style>{`
        .qb-queue-table th, .qb-queue-table td { padding-top: .35rem; padding-bottom: .35rem; }
        .qb-queue-table tbody tr { line-height: 1.25; }
      `}</style>
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
          <div className="d-flex align-items-center gap-2">
            <h4 className="mb-0">My Queue</h4>
            <Tooltip text="Pending Approvals comes straight from the workflow service. Landing Queue has no dedicated queue endpoint yet, so it's assembled client-side from a document status filter. My Submissions shows documents you submitted, with reviewer status and comments.">
              <i className="ti ti-info-circle text-muted" style={{ fontSize: "0.9rem", cursor: "help" }}></i>
            </Tooltip>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom py-2">
            <ul className="nav nav-pills gap-2 mb-0">
              {views.map((v) => (
                <li key={v.key} className="nav-item">
                  <button
                    className={`btn btn-sm ${view === v.key ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setView(v.key)}
                  >
                    <i className={`ti ${v.icon} me-1`}></i>{v.label}
                    {v.key === "approvals" && approvalCount > 0 && (
                      <span className={`badge rounded-pill ms-1 ${view === v.key ? "text-bg-light text-primary" : "text-bg-warning"}`}>
                        {approvalCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-muted mb-0 mt-1" style={{ fontSize: "0.82rem" }}>{activeView.blurb}</p>
            {view === "approvals" && (
              <div className="d-flex align-items-center gap-2 mt-1">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 220 }}
                  value={entityTypeFilter}
                  onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
                >
                  <option value="">All Types</option>
                  {entityTypes.map((t) => (
                    <option key={t.code} value={t.code}>{t.description}</option>
                  ))}
                </select>
                {entityTypeFilter && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEntityTypeFilter(""); setPage(1); }}>
                    <i className="ti ti-x me-1"></i>Clear
                  </button>
                )}
                <button className="btn btn-sm btn-outline-primary ms-auto" onClick={load}>
                  <i className="ti ti-refresh me-1"></i>Refresh
                </button>
              </div>
            )}
            {view === "landing" && (
              <div className="d-flex align-items-center gap-2 mt-1">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 220 }}
                  value={pipelineStatusFilter}
                  onChange={(e) => { setPipelineStatusFilter(e.target.value); setPage(1); }}
                >
                  {PIPELINE_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {pipelineStatusFilter && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setPipelineStatusFilter(""); setPage(1); }}>
                    <i className="ti ti-x me-1"></i>Clear
                  </button>
                )}
                <button className="btn btn-sm btn-outline-primary ms-auto" onClick={load}>
                  <i className="ti ti-refresh me-1"></i>Refresh
                </button>
              </div>
            )}
          </div>

          <div className="card-body p-0">
            {view === "routing" || view === "act-on" ? (
              <div className="p-3">
                <FileRoutingTable embedded onlyStages={view === "act-on" ? actOnStages : null} />
              </div>
            ) : (
            <div className="table-responsive">
              {view === "approvals" ? (
              <table className="table table-hover table-sm align-middle mb-0 qb-queue-table" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Details</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Due Date</th>
                    <th>Started</th>
                    <th>Started By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j}><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                        ))}
                      </tr>
                    ))
                  ) : approvals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="ti ti-checks" style={{ fontSize: 56 }}></i>
                          <h6 className="mt-3 mb-1">You're all caught up!</h6>
                          <p className="small mb-0">No pending approvals at this time.</p>
                        </div>
                      </td>
                    </tr>
                  ) : approvals.map((item) => (
                    <tr key={item.workflow_instance_id}>
                      <td>
                        {(() => {
                          const key = `${item.entity_type}:${item.entity_id}`;
                          const isFileRequest = !!FILE_REQUEST_VERBS[item.entity_type];
                          const isResolvable = isDocumentEntityType(item.entity_type) || isFileRequest;
                          const detail = entityDetailMap[key];

                          if (isResolvable && detail === undefined) {
                            return <span className="text-muted">Loading…</span>;
                          }
                          if (isFileRequest && detail) {
                            return <strong>{detail.label}</strong>;
                          }
                          if (isResolvable && detail?.link) {
                            return (
                              <button
                                className="btn btn-link btn-sm p-0 text-decoration-none"
                                onClick={() => navigate(detail.link)}
                              >
                                {detail.label}
                              </button>
                            );
                          }
                          // Unresolvable or unhandled entity type — at least name
                          // the type + id instead of a bare number.
                          return (
                            <strong>{getEntityTypeLabel(item.entity_type)} #{item.entity_id}</strong>
                          );
                        })()}
                      </td>
                      <td><span className="badge bg-info">{getEntityTypeLabel(item.entity_type)}</span></td>
                      <td>
                        <span className={`badge ${INSTANCE_STATUS_BADGE[item.status] || "bg-secondary"}`}>
                          {(item.status || "").toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: 6 }}>
                            <div
                              className="progress-bar bg-primary"
                              style={{ width: `${getStepsProgress(item.pending_steps_count, item.total_steps_count)}%` }}
                            />
                          </div>
                          <small className="text-muted text-nowrap">
                            <span className="badge bg-warning text-dark">{item.pending_steps_count} pending</span>
                            {" "}/ {item.total_steps_count}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span>{formatDate(item.earliest_due_date)}</span>
                        {getDueDateBadge(item.earliest_due_date)}
                      </td>
                      <td className="text-muted">{formatDate(item.started_at)}</td>
                      <td className="text-muted">{getUserName(item.started_by) || `User #${item.started_by}`}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/workflows/instances/${item.workflow_instance_id}`)}
                        >
                          <i className="ti ti-eye me-1"></i>Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              ) : view === "submissions" ? (
              <table className="table table-hover table-sm align-middle mb-0 qb-queue-table" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Details</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Submitted</th>
                    <th className="text-end">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j}><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                        ))}
                      </tr>
                    ))
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="ti ti-send" style={{ fontSize: 56 }}></i>
                          <h6 className="mt-3 mb-1">No submissions yet</h6>
                          <p className="small mb-0">Anything you send for approval will show up here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : submissions.map((item) => {
                    const key = `${item.entity_type}:${item.entity_id}`;
                    const detail = entityDetailMap[key];
                    const isDoc = isDocumentEntityType(item.entity_type);
                    const isResolvable = isDoc || !!FILE_REQUEST_VERBS[item.entity_type];
                    const snapshot = parseSnapshot(item);
                    const label = (isDoc && snapshot?.title) || detail?.label;
                    const link = isDoc ? `/ed-mgt/documents/${item.entity_id}` : null;
                    const steps = item.steps || [];
                    const totalSteps = steps.length;
                    const pendingSteps = steps.filter((s) => s.status === "PENDING").length;
                    return (
                      <tr key={item.id}>
                        <td>
                          {label && link ? (
                            <Link to={link} className="text-decoration-none text-primary">
                              {label}
                            </Link>
                          ) : label ? (
                            <strong>{label}</strong>
                          ) : isResolvable && detail === undefined ? (
                            <span className="text-muted">Loading…</span>
                          ) : (
                            <strong>{getEntityTypeLabel(item.entity_type)} #{item.entity_id}</strong>
                          )}
                        </td>
                        <td><span className="badge bg-info">{getEntityTypeLabel(item.entity_type)}</span></td>
                        <td>
                          <span className={`badge ${INSTANCE_STATUS_BADGE[item.status] || "bg-secondary"}`}>
                            {item.status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ minWidth: 160 }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6 }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: `${getStepsProgress(pendingSteps, totalSteps)}%` }}
                              />
                            </div>
                            <small className="text-muted text-nowrap">
                              {totalSteps - pendingSteps}/{totalSteps} steps
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted" title={item.started_at}>{fmtRelative(item.started_at)}</span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setFeedbackTarget(item)}>
                            <i className="ti ti-message-circle me-1"></i>View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              ) : (
              <table className="table table-hover table-sm align-middle mb-0 qb-queue-table" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Document Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Age</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j}><div className="placeholder-glow"><span className="placeholder col-10 rounded"></span></div></td>
                        ))}
                      </tr>
                    ))
                  ) : docs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="ti ti-checks" style={{ fontSize: 56 }}></i>
                          <h6 className="mt-3 mb-1">Nothing here right now</h6>
                          <p className="small mb-0">No documents are waiting to be picked up.</p>
                        </div>
                      </td>
                    </tr>
                  ) : docs.map((doc) => {
                    return (
                    <tr key={doc.id}>
                      <td>
                        <button className="btn btn-sm btn-link p-0 border-0" title={doc.is_starred ? "Unstar" : "Star"}
                                onClick={(e) => { e.stopPropagation(); handleToggleStar(doc); }}>
                          <i className={`ti ti-star ${doc.is_starred ? "text-warning" : "text-muted"}`}></i>
                        </button>
                      </td>
                      <td style={{ maxWidth: "25ch", whiteSpace: "normal", wordBreak: "break-word" }}>
                        <Link to={doc.status === "LANDING" ? `/ed-mgt/documents/${doc.id}/validate` : `/ed-mgt/documents/${doc.id}`}
                              className="text-decoration-none text-primary">
                          {doc.title}
                        </Link>
                      </td>
                      <td><span className="text-muted">{doc.document_type_name || "—"}</span></td>
                      <td>
                        <PipelineStatusBadge
                          ocrStatus={doc.ocr_status}
                          aiStatus={doc.ai_status}
                          virusScanStatus={doc.virus_scan_status}
                        />
                      </td>
                      <td><span className="text-muted" title={doc.created_at}>{fmtRelative(doc.created_at)}</span></td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-secondary border-0" onClick={(e) => openMenu(e, doc)}>
                          <i className="ti ti-dots-vertical"></i>
                        </button>
                        {openMenuId === doc.id && menuPos && (
                          <ul className="dropdown-menu shadow-sm show"
                              style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 1055 }}
                              onClick={(e) => e.stopPropagation()}>
                            {doc.status === "LANDING" ? (
                              <li>
                                <button className="dropdown-item" onClick={() => { setOpenMenuId(null); navigate(`/ed-mgt/documents/${doc.id}/validate`); }}>
                                  <i className="ti ti-clipboard-check me-2 text-primary"></i> Validate
                                </button>
                              </li>
                            ) : (
                              <>
                                <li>
                                  <button className="dropdown-item" onClick={() => { setOpenMenuId(null); navigate(`/ed-mgt/documents/${doc.id}`); }}>
                                    <i className="ti ti-eye me-2 text-primary"></i> View
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => { setOpenMenuId(null); navigate(`/ed-mgt/documents/${doc.id}`); }}>
                                    <i className="ti ti-edit me-2 text-secondary"></i> Edit Metadata
                                  </button>
                                </li>
                              </>
                            )}
                            <li>
                              <button className="dropdown-item" onClick={() => { setOpenMenuId(null); setFileTarget(doc); }}>
                                <i className="ti ti-folder me-2 text-secondary"></i> Move to File
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
                          </ul>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
            )}
          </div>

          {view !== "routing" && view !== "act-on" && (
          <div className="card-footer bg-transparent border-top px-3 py-2">
            <EDMSPagination page={page} totalPages={totalPages} totalCount={total} pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
          </div>
          )}
        </div>
      </div>

      {fileTarget && (
        <FilePickerModal
          title={`Move "${fileTarget.title}" to file…`}
          tree={fileTree}
          confirmLabel="Move Here"
          onPick={handleAssignFile}
          onClose={() => setFileTarget(null)}
        />
      )}

      {feedbackTarget && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setFeedbackTarget(null)} />
          <div className="modal fade show d-block" style={{ zIndex: 1060 }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title">
                    <i className="ti ti-message-circle me-2 text-primary"></i>
                    {(isDocumentEntityType(feedbackTarget.entity_type) && parseSnapshot(feedbackTarget)?.title)
                      || entityDetailMap[`${feedbackTarget.entity_type}:${feedbackTarget.entity_id}`]?.label
                      || `${getEntityTypeLabel(feedbackTarget.entity_type)} #${feedbackTarget.entity_id}`}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setFeedbackTarget(null)} aria-label="Close" />
                </div>
                <div className="modal-body">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className={`badge ${INSTANCE_STATUS_BADGE[feedbackTarget.status] || "bg-secondary"}`}>
                      {feedbackTarget.status?.replace(/_/g, " ")}
                    </span>
                    <small className="text-muted">Submitted {formatDate(feedbackTarget.started_at)}</small>
                  </div>
                  {feedbackHistoryLoading ? (
                    <div className="text-center py-4"><span className="spinner-border spinner-border-sm" /></div>
                  ) : feedbackHistoryError ? (
                    <div className="alert alert-warning py-2 mb-0"><i className="ti ti-alert-triangle me-2"></i>{feedbackHistoryError}</div>
                  ) : feedbackHistory.length === 0 ? (
                    <div className="text-muted small">No approval history yet.</div>
                  ) : (
                    <div style={{ borderLeft: "2px solid #dee2e6", paddingLeft: 24 }}>
                      {feedbackHistory.map((row, i) => (
                        <div key={row.id ?? `${row.action}-${row.action_at}-${i}`} className="mb-3 position-relative">
                          <div
                            className="position-absolute"
                            style={{
                              left: -32, top: 6, width: 12, height: 12, borderRadius: "50%",
                              background: "#007bff", border: "2px solid #fff", boxShadow: "0 0 0 2px #007bff",
                            }}
                          ></div>
                          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className={`badge ${ACTION_BADGE_CLASS[row.action] || "bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
                                {ACTION_LABEL[row.action] || row.action}
                              </span>
                              <span className="text-muted small">
                                {getUserName(row.user_id) || (row.user_id != null ? `User #${row.user_id}` : "Unknown user")}
                              </span>
                              {row.step_order != null && (
                                <span className="badge bg-light text-dark border" style={{ fontSize: "0.7rem" }}>Step {row.step_order}</span>
                              )}
                              {row.target_step_order != null && (
                                <span className="text-muted small">
                                  <i className="ti ti-arrow-forward-up me-1"></i>To step {row.target_step_order}
                                </span>
                              )}
                              {row.target_user_id != null && (
                                <span className="text-muted small">
                                  <i className="ti ti-arrow-right me-1"></i>
                                  To {getUserName(row.target_user_id) || `User #${row.target_user_id}`}
                                </span>
                              )}
                            </div>
                            <small className="text-muted" title={row.action_at}>{fmtRelative(row.action_at)}</small>
                          </div>
                          <HistoryComment
                            comment={row.comment}
                            commentStyle={row.comment_style}
                            pinX={row.pin_x}
                            pinY={row.pin_y}
                            onViewPlacement={() => setHistoryPinPreview(row)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setFeedbackTarget(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {historyPinPreview && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1070 }} onClick={() => setHistoryPinPreview(null)} />
          <div className="modal fade show d-block" style={{ zIndex: 1080 }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title"><i className="ti ti-map-pin me-2"></i>Sticky Note Placement</h5>
                  <button type="button" className="btn-close" onClick={() => setHistoryPinPreview(null)} aria-label="Close" />
                </div>
                <div className="modal-body p-0">
                  {pinPreviewDoc ? (
                    <PinPlacementLayer pins={[{ x: historyPinPreview.pin_x, y: historyPinPreview.pin_y, note: historyPinPreview.comment }]}>
                      <DocumentPreviewPanel
                        documentId={pinPreviewDoc.id}
                        versionId={pinPreviewDoc.current_version?.id}
                        mimeType={pinPreviewDoc.current_version?.mime_type}
                        filename={pinPreviewDoc.current_version?.original_filename}
                        height={500}
                      />
                    </PinPlacementLayer>
                  ) : (
                    <div className="text-center py-5"><span className="spinner-border spinner-border-sm" /></div>
                  )}
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setHistoryPinPreview(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default MyQueue;
