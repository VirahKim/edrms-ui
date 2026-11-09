import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getPendingApprovals, getWorkflowEnums } from "../../../api/workflowsApi";
import apiClient from "../../../api/apiClient";
import TablePreloader from "../../../components/TablePreloader";
import { FILE_REQUEST_VERBS, isResolvableEntityType, resolveApprovalEntityDetails } from "../../../utils/approvalEntityDetails";

const STATUS_BADGE = {
    IN_PROGRESS: "bg-light-primary",
    COMPLETED: "bg-light-success",
    REJECTED: "bg-light-danger",
    CANCELLED: "bg-light-secondary"
};

const formatStatusLabel = (status) =>
    (status || "")
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

export default function PendingApprovals() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [approvals, setApprovals] = useState([]);
    const [entityTypes, setEntityTypes] = useState([]);
    const [userMap, setUserMap] = useState({});
    // Keyed by `${entity_type}:${entity_id}` — entity_id is only unique within
    // its own entity type (a TENDER #5 and a DOCUMENT #5 can coexist), so a
    // bare entity_id key would let one type's details leak onto the other.
    const [entityDetailMap, setEntityDetailMap] = useState({});
    const [filters, setFilters] = useState({
        entity_type: "",
        page: 1,
        page_size: 20
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        getWorkflowEnums()
            .then((res) => {
                const items = res?.data?.entity_types || [];
                setEntityTypes(
                    (Array.isArray(items) ? items : []).map((item) => ({
                        code: item.Code ?? item.code ?? "",
                        description: item.Description ?? item.description ?? ""
                    }))
                );
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        apiClient
            .get("/IAmAPI/api/users")
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
                const map = {};
                list.forEach((u) => {
                    map[u.id] = `${u.first_name || ""} ${u.other_name || ""}`.trim() || `User #${u.id}`;
                });
                setUserMap(map);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadApprovals();
    }, [filters]);

    const loadApprovals = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getPendingApprovals(filters);
            const items = response.data || [];
            setApprovals(items);
            setTotalCount(response.total_count || 0);
            setTotalPages(response.total_pages || 1);
            loadEntityDetails(items);
        } catch (err) {
            console.error("Error loading pending approvals:", err);
            setError("Failed to load pending approvals");
        } finally {
            setLoading(false);
        }
    };

    const loadEntityDetails = (items) => resolveApprovalEntityDetails(items, setEntityDetailMap);

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const getDueDateBadge = (dateStr) => {
        if (!dateStr) return null;
        const due = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return <span className="badge rounded-pill bg-danger ms-1">Overdue</span>;
        if (daysLeft === 0) return <span className="badge rounded-pill bg-warning text-dark ms-1">Due Today</span>;
        if (daysLeft <= 3) return <span className="badge rounded-pill bg-warning text-dark ms-1">{daysLeft}d left</span>;
        return null;
    };

    const getEntityTypeLabel = (code) => {
        const found = entityTypes.find((e) => e.code === code);
        return found ? found.description : code;
    };

    const getStartedByLabel = (userId) => userMap[userId] || `User #${userId}`;

    const getStepsProgress = (pending, total) => {
        if (!total) return 0;
        return Math.round(((total - pending) / total) * 100);
    };

    return (
        <DashboardLayout>
            <div className="px-3">
            {/* Page Header */}
            <div className="row">
                <div className="col-12">
                    <div className="page-header mb-2">
                        <div className="page-block">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="page-header-title">
                                        <h2 className="mb-0 fs-4">
                                            <i className="ti ti-clock-check me-2"></i>
                                            My Pending Approvals
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="row mb-2">
                    <div className="col-12">
                        <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">
                            <i className="ti ti-alert-circle me-2"></i>
                            {error}
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setError("")}
                            ></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approvals Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2 py-2">
                            <h5 className="mb-0 fs-6 text-nowrap">
                                <i className="ti ti-clock-check me-2 text-warning"></i>
                                Awaiting Your Approval ({totalCount})
                            </h5>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 170 }}
                                    value={filters.entity_type}
                                    onChange={(e) =>
                                        setFilters({ ...filters, entity_type: e.target.value, page: 1 })
                                    }
                                    title="Entity Type"
                                >
                                    <option value="">All Entity Types</option>
                                    {entityTypes.map((t) => (
                                        <option key={t.code} value={t.code}>
                                            {t.description}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 70 }}
                                    value={filters.page_size}
                                    onChange={(e) =>
                                        setFilters({ ...filters, page_size: Number(e.target.value), page: 1 })
                                    }
                                    title="Per Page"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    title="Reset filters"
                                    onClick={() => setFilters({ entity_type: "", page: 1, page_size: 20 })}
                                >
                                    <i className="ti ti-x"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-primary" onClick={loadApprovals}>
                                    <i className="ti ti-refresh me-1"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div className="card-body py-2">
                            {loading ? (
                                <TablePreloader />
                            ) : approvals.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="ti ti-checks fs-2 text-success mb-2 d-block"></i>
                                    <h6 className="text-muted mb-1">You&apos;re all caught up!</h6>
                                    <p className="text-muted mb-0 small">No pending approvals at this time.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.8125rem" }}>
                                            <thead>
                                                <tr>
                                                    <th className="text-nowrap">Details</th>
                                                    <th className="text-nowrap" style={{ width: "1%" }}>Type</th>
                                                    <th className="text-nowrap" style={{ width: "1%" }}>Status</th>
                                                    <th className="text-nowrap" style={{ width: "1%" }}>Progress</th>
                                                    <th className="text-nowrap" style={{ width: "1%" }}>Due Date</th>
                                                    <th className="text-nowrap" style={{ width: "1%" }}>Started</th>
                                                    <th className="text-nowrap" style={{ width: "1%" }}>Started By</th>
                                                    <th className="text-end text-nowrap" style={{ width: "1%" }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {approvals.map((item) => (
                                                    <tr key={item.workflow_instance_id}>
                                                        <td className="text-nowrap">
                                                            {(() => {
                                                                const key = `${item.entity_type}:${item.entity_id}`;
                                                                const isFileRequest = !!FILE_REQUEST_VERBS[item.entity_type];
                                                                const isResolvable = isResolvableEntityType(item.entity_type);
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
                                                                // the type + id instead of a bare dash, so the row is
                                                                // still identifiable now that the Entity column is gone.
                                                                return (
                                                                    <span className="text-muted">
                                                                        {getEntityTypeLabel(item.entity_type)} #{item.entity_id}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="text-nowrap">
                                                            <span className="badge bg-info">{getEntityTypeLabel(item.entity_type)}</span>
                                                        </td>
                                                        <td className="text-nowrap">
                                                            <span className={`badge rounded-pill fw-semibold ${STATUS_BADGE[item.status] || "bg-light-secondary"}`}>
                                                                {formatStatusLabel(item.status)}
                                                            </span>
                                                        </td>
                                                        <td className="text-nowrap">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div
                                                                    className="progress"
                                                                    style={{ height: "6px", width: "60px" }}
                                                                >
                                                                    <div
                                                                        className="progress-bar bg-primary"
                                                                        style={{
                                                                            width: `${getStepsProgress(
                                                                                item.pending_steps_count,
                                                                                item.total_steps_count
                                                                            )}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                                <small className="text-muted text-nowrap">
                                                                    <span className="badge rounded-pill bg-light-warning">
                                                                        {item.pending_steps_count} pending
                                                                    </span>
                                                                    {" "}
                                                                    / {item.total_steps_count}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td className="text-nowrap">
                                                            <span>{formatDate(item.earliest_due_date)}</span>
                                                            {getDueDateBadge(item.earliest_due_date)}
                                                        </td>
                                                        <td className="text-nowrap text-muted">
                                                            {formatDate(item.started_at)}
                                                        </td>
                                                        <td className="text-nowrap text-muted">
                                                            {getStartedByLabel(item.started_by)}
                                                        </td>
                                                        <td className="text-end text-nowrap">
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/workflows/instances/${item.workflow_instance_id}`
                                                                    )
                                                                }
                                                            >
                                                                <i className="ti ti-eye me-1"></i>
                                                                Review
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <div className="text-muted small">
                                                Page {filters.page} of {totalPages} ({totalCount} total)
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    <li
                                                        className={`page-item ${
                                                            filters.page === 1 ? "disabled" : ""
                                                        }`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={() =>
                                                                setFilters({ ...filters, page: filters.page - 1 })
                                                            }
                                                            disabled={filters.page === 1}
                                                        >
                                                            Previous
                                                        </button>
                                                    </li>
                                                    {Array.from(
                                                        { length: Math.min(totalPages, 5) },
                                                        (_, i) => i + 1
                                                    ).map((pg) => (
                                                        <li
                                                            key={pg}
                                                            className={`page-item ${
                                                                filters.page === pg ? "active" : ""
                                                            }`}
                                                        >
                                                            <button
                                                                className="page-link"
                                                                onClick={() =>
                                                                    setFilters({ ...filters, page: pg })
                                                                }
                                                            >
                                                                {pg}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li
                                                        className={`page-item ${
                                                            filters.page === totalPages ? "disabled" : ""
                                                        }`}
                                                    >
                                                        <button
                                                            className="page-link"
                                                            onClick={() =>
                                                                setFilters({ ...filters, page: filters.page + 1 })
                                                            }
                                                            disabled={filters.page === totalPages}
                                                        >
                                                            Next
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
