import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getWorkflowDefinitions, deactivateWorkflowDefinition, getWorkflowEnums } from "../../../api/workflowsApi";
import TablePreloader from "../../../components/TablePreloader";

export default function WorkflowDefinitionsList() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [definitions, setDefinitions] = useState([]);
    const [entityTypes, setEntityTypes] = useState([]);
    const [filters, setFilters] = useState({
        entity_type: "",
        is_active: true,
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
        loadDefinitions();
    }, [filters]);

    const loadDefinitions = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getWorkflowDefinitions(filters);
            
            // Backend returns data directly without a success wrapper
            if (response && response.data) {
                setDefinitions(response.data || []);
                setTotalCount(response.total_count || 0);
                setTotalPages(response.total_pages || 1);
            } else {
                setError("Failed to load workflow definitions");
            }
        } catch (err) {
            console.error("Error loading definitions:", err);
            setError("Failed to load workflow definitions");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this workflow definition?")) {
            return;
        }

        try {
            const response = await deactivateWorkflowDefinition(id);
            if (response.success) {
                alert("Workflow definition deactivated successfully");
                loadDefinitions();
            } else {
                alert(response.message || "Failed to deactivate workflow definition");
            }
        } catch (err) {
            console.error("Error deactivating definition:", err);
            alert("Failed to deactivate workflow definition");
        }
    };

    const getStatusBadge = (isActive) => {
        return isActive ? (
            <span className="badge bg-success">Active</span>
        ) : (
            <span className="badge bg-secondary">Inactive</span>
        );
    };

    const getOrgScopeBadge = (scope) => {
        const colors = {
            ORG_WIDE: "primary",
            DEPARTMENT: "info",
            BRANCH: "warning",
            TEAM: "secondary"
        };
        return <span className={`badge bg-${colors[scope] || "secondary"}`}>{scope}</span>;
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
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate("/workflows/definitions/create")}
                                        >
                                            <i className="ti ti-plus me-2"></i>
                                            Create Workflow
                                        </button>
                                    </div>
                                    <div className="page-header-title">
                                        <h2 className="mb-0">
                                            <i className="ti ti-template me-2"></i>
                                            Workflow Definitions
                                        </h2>
                                    </div>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-0 mt-2">
                                            <li className="breadcrumb-item">
                                                <a href="#" onClick={(e) => { e.preventDefault(); navigate("/workflows"); }}>Workflows</a>
                                            </li>
                                            <li className="breadcrumb-item active">Definitions</li>
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
                                        {entityTypes.map((et) => (
                                            <option key={et.code} value={et.code}>
                                                {et.description || et.code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={filters.is_active}
                                        onChange={(e) => setFilters({ ...filters, is_active: e.target.value === "true", page: 1 })}
                                    >
                                        <option value="true">Active Only</option>
                                        <option value="false">Inactive Only</option>
                                        <option value="">All</option>
                                    </select>
                                </div>
                                <div className="col-md-4 d-flex align-items-end">
                                    <button
                                        className="btn btn-secondary w-100"
                                        onClick={() => setFilters({ entity_type: "", is_active: true, page: 1, page_size: 20 })}
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

            {/* Definitions Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                Workflow Templates ({totalCount})
                            </h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <TablePreloader />
                            ) : definitions.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ti ti-folder-off fs-1 text-muted mb-3"></i>
                                    <p className="text-muted">No workflow definitions found</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate("/workflows/definitions/create")}
                                    >
                                        Create Your First Workflow
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Entity Type</th>
                                                    <th>Org Scope</th>
                                                    <th>Steps</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {definitions.map((def) => (
                                                    <tr key={def.id}>
                                                        <td>
                                                            <div>
                                                                <strong>{def.name}</strong>
                                                                {def.description && (
                                                                    <div className="text-muted small">
                                                                        {def.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {def.entity_type ? (
                                                                <span className="badge bg-info">
                                                                    {def.entity_type}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted">N/A</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {def.organization_scope ? (
                                                                getOrgScopeBadge(def.organization_scope)
                                                            ) : (
                                                                <span className="text-muted">N/A</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-secondary">
                                                                {def.steps?.length || 0} Steps
                                                            </span>
                                                        </td>
                                                        <td>{getStatusBadge(def.is_active)}</td>
                                                        <td>
                                                            <small className="text-muted">
                                                                {def.created_at && def.created_at !== "0001-01-01T00:00:00" 
                                                                    ? new Date(def.created_at).toLocaleDateString()
                                                                    : "N/A"}
                                                            </small>
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => navigate(`/workflows/definitions/${def.id}`)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="ti ti-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-warning"
                                                                    onClick={() => navigate(`/workflows/definitions/edit/${def.id}`)}
                                                                    title="Edit"
                                                                >
                                                                    <i className="ti ti-edit"></i>
                                                                </button>
                                                                {def.is_active && (
                                                                    <button
                                                                        className="btn btn-outline-danger"
                                                                        onClick={() => handleDeactivate(def.id)}
                                                                        title="Deactivate"
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
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <li
                                                            key={i + 1}
                                                            className={`page-item ${filters.page === i + 1 ? 'active' : ''}`}
                                                        >
                                                            <button
                                                                className="page-link"
                                                                onClick={() => setFilters({ ...filters, page: i + 1 })}
                                                            >
                                                                {i + 1}
                                                            </button>
                                                        </li>
                                                    ))}
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
