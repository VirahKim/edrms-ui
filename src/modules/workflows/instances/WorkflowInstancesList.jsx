import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getWorkflowInstances, cancelWorkflow } from "../../../api/workflowsApi";
import TablePreloader from "../../../components/TablePreloader";

export default function WorkflowInstancesList() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [instances, setInstances] = useState([]);
    const [filters, setFilters] = useState({
        entity_type: "",
        status: "",
        page: 1,
        page_size: 20
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        loadInstances();
    }, [filters]);

    const loadInstances = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getWorkflowInstances(filters);
            
            setInstances(response.data || []);
            setTotalCount(response.total_count || 0);
            setTotalPages(response.total_pages || 1);
        } catch (err) {
            console.error("Error loading instances:", err);
            setError("Failed to load workflow instances");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        const comment = window.prompt("Please provide a reason for cancellation:");
        if (!comment) return;

        try {
            const response = await cancelWorkflow(id, comment);
            if (response.success) {
                alert("Workflow cancelled successfully");
                loadInstances();
            } else {
                alert(response.message || "Failed to cancel workflow");
            }
        } catch (err) {
            console.error("Error cancelling workflow:", err);
            alert("Failed to cancel workflow");
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            PENDING: "secondary",
            IN_PROGRESS: "primary",
            APPROVED: "success",
            REJECTED: "danger",
            CANCELLED: "warning"
        };
        return <span className={`badge bg-${colors[status] || "secondary"}`}>{status}</span>;
    };

    const getCompletedSteps = (steps = []) =>
        steps.filter((s) => s.status === "APPROVED" || s.status === "REJECTED").length;

    const getProgress = (steps = []) => {
        if (!steps.length) return 0;
        return Math.round((getCompletedSteps(steps) / steps.length) * 100);
    };

    const getCurrentStepName = (steps = []) => {
        const active = steps.find((s) => s.status === "PENDING" || s.status === "IN_PROGRESS");
        return active ? active.step_name : (steps[steps.length - 1]?.step_name || "");
    };

    return (
        <DashboardLayout>
            <div className="px-3">
            {/* Page Header */}
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-block">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => navigate("/workflows")}
                                        >
                                            <i className="ti ti-arrow-left me-1"></i>
                                            Back to Workflows
                                        </button>
                                    </div>
                                    <div className="page-header-title">
                                        <h2 className="mb-0">
                                            <i className="ti ti-git-branch me-2"></i>
                                            Workflow Instances
                                        </h2>
                                    </div>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-0 mt-2">
                                            <li className="breadcrumb-item">
                                                <a href="#" onClick={(e) => { e.preventDefault(); navigate("/workflows"); }}>Workflows</a>
                                            </li>
                                            <li className="breadcrumb-item active">Instances</li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Entity Type</label>
                                    <select
                                        className="form-select"
                                        value={filters.entity_type}
                                        onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
                                    >
                                        <option value="">All Types</option>
                                        <option value="PURCHASE_ORDER">Purchase Order</option>
                                        <option value="LEAVE_REQUEST">Leave Request</option>
                                        <option value="EXPENSE_CLAIM">Expense Claim</option>
                                        <option value="INVOICE">Invoice</option>
                                        <option value="CONTRACT">Contract</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                                <div className="col-md-4 d-flex align-items-end">
                                    <button
                                        className="btn btn-secondary w-100"
                                        onClick={() => setFilters({ entity_type: "", status: "", page: 1, page_size: 20 })}
                                    >
                                        <i className="ti ti-refresh me-2"></i>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <i className="ti ti-alert-circle me-2"></i>
                            {error}
                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instances Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                Workflow Executions ({totalCount})
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <TablePreloader />
                            ) : instances.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ti ti-folder-off fs-1 text-muted mb-3"></i>
                                    <p className="text-muted">No workflow instances found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Entity</th>
                                                    <th>Started</th>
                                                    <th>Progress</th>
                                                    <th>Status</th>
                                                    <th>Current Step</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {instances.map((instance) => (
                                                    <tr key={instance.id}>
                                                        <td>
                                                            <div>
                                                                <strong>{instance.entity_id}</strong>
                                                                <div className="text-muted small">
                                                                    <span className="badge bg-info">{instance.entity_type}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {new Date(instance.started_at).toLocaleString()}
                                                            </small>
                                                        </td>
                                                        <td style={{ minWidth: "150px" }}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="progress flex-grow-1 me-2" style={{ height: "20px" }}>
                                                                    <div
                                                                        className="progress-bar"
                                                                        role="progressbar"
                                                                        style={{ width: `${getProgress(instance.steps)}%` }}
                                                                    >
                                                                        {getProgress(instance.steps)}%
                                                                    </div>
                                                                </div>
                                                                <small className="text-muted">
                                                                    {getCompletedSteps(instance.steps)}/{instance.steps?.length || 0}
                                                                </small>
                                                            </div>
                                                        </td>
                                                        <td>{getStatusBadge(instance.status)}</td>
                                                        <td>
                                                            {getCurrentStepName(instance.steps) && (
                                                                <span className="badge bg-primary">
                                                                    {getCurrentStepName(instance.steps)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => navigate(`/workflows/instances/${instance.id}`)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="ti ti-eye"></i>
                                                                </button>
                                                                {instance.status === "IN_PROGRESS" && (
                                                                    <button
                                                                        className="btn btn-outline-danger"
                                                                        onClick={() => handleCancel(instance.id)}
                                                                        title="Cancel"
                                                                    >
                                                                        <i className="ti ti-x"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div className="text-muted">
                                                Page {filters.page} of {totalPages} ({totalCount} total)
                                            </div>
                                            <nav>
                                                <ul className="pagination mb-0">
                                                    <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                                            disabled={filters.page === 1}
                                                        >
                                                            Previous
                                                        </button>
                                                    </li>
                                                    <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
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
