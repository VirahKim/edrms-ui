import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getWorkflowDefinitionById, updateStepApprovers } from "../../../api/workflowsApi";
import apiClient from "../../../api/apiClient";
import DetailsPreloader from "../../../components/DetailsPreloader";

export default function ViewWorkflowDefinition() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [definition, setDefinition] = useState(null);
    const [error, setError] = useState("");
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    // Update step approvers state
    const [editingStepId, setEditingStepId] = useState(null);
    const [stepApproverForm, setStepApproverForm] = useState({ approver_user_ids: [], approver_role_ids: [] });
    const [selectedStepUserId, setSelectedStepUserId] = useState("");
    const [selectedStepRoleId, setSelectedStepRoleId] = useState("");
    const [stepApproverLoading, setStepApproverLoading] = useState(false);
    const [stepApproverError, setStepApproverError] = useState("");
    const [stepApproverSuccess, setStepApproverSuccess] = useState("");

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");

            const [defResponse, usersRes, rolesRes] = await Promise.all([
                getWorkflowDefinitionById(id),
                apiClient.get("/IAmAPI/api/users", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                apiClient.get("/IAmAPI/api/roles", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (defResponse && defResponse.data) {
                setDefinition(defResponse.data);
            } else {
                setError("Workflow definition not found");
            }

            setUsers(usersRes.data || []);
            setRoles(rolesRes.data || []);
        } catch (err) {
            console.error("Error loading workflow definition:", err);
            setError("Failed to load workflow definition");
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.first_name} ${user.other_name}` : `User ID: ${userId}`;
    };

    const getRoleName = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.name : `Role ID: ${roleId}`;
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
        return <span className={`badge bg-${colors[scope] || "secondary"}`}>{scope || "N/A"}</span>;
    };

    const openStepApproverEdit = (step) => {
        setEditingStepId(step.id);
        setStepApproverForm({
            approver_user_ids: [...(step.approver_user_ids || [])],
            approver_role_ids: [...(step.approver_role_ids || [])]
        });
        setSelectedStepUserId("");
        setSelectedStepRoleId("");
        setStepApproverError("");
        setStepApproverSuccess("");
    };

    const closeStepApproverEdit = () => {
        setEditingStepId(null);
        setStepApproverError("");
        setStepApproverSuccess("");
    };

    const addStepApproverUser = () => {
        if (selectedStepUserId && !isNaN(selectedStepUserId)) {
            const userId = parseInt(selectedStepUserId);
            if (!stepApproverForm.approver_user_ids.includes(userId)) {
                setStepApproverForm((prev) => ({ ...prev, approver_user_ids: [...prev.approver_user_ids, userId] }));
            }
            setSelectedStepUserId("");
        }
    };

    const removeStepApproverUser = (userId) => {
        setStepApproverForm((prev) => ({ ...prev, approver_user_ids: prev.approver_user_ids.filter((id) => id !== userId) }));
    };

    const addStepApproverRole = () => {
        if (selectedStepRoleId && !isNaN(selectedStepRoleId)) {
            const roleId = parseInt(selectedStepRoleId);
            if (!stepApproverForm.approver_role_ids.includes(roleId)) {
                setStepApproverForm((prev) => ({ ...prev, approver_role_ids: [...prev.approver_role_ids, roleId] }));
            }
            setSelectedStepRoleId("");
        }
    };

    const removeStepApproverRole = (roleId) => {
        setStepApproverForm((prev) => ({ ...prev, approver_role_ids: prev.approver_role_ids.filter((rid) => rid !== roleId) }));
    };

    const saveStepApprovers = async () => {
        if (stepApproverForm.approver_user_ids.length === 0 && stepApproverForm.approver_role_ids.length === 0) {
            setStepApproverError("At least one user or role approver is required.");
            return;
        }
        setStepApproverLoading(true);
        setStepApproverError("");
        setStepApproverSuccess("");
        try {
            const payload = {};
            if (stepApproverForm.approver_user_ids.length > 0) payload.approver_user_ids = stepApproverForm.approver_user_ids;
            if (stepApproverForm.approver_role_ids.length > 0) payload.approver_role_ids = stepApproverForm.approver_role_ids;
            const response = await updateStepApprovers(id, editingStepId, payload);
            if (response.success || response.data) {
                // Refresh definition to show updated approvers
                const defResponse = await getWorkflowDefinitionById(id);
                if (defResponse?.data) setDefinition(defResponse.data);
                setStepApproverSuccess("Approvers updated. Changes apply to future workflow instances only.");
            } else {
                setStepApproverError(response.message || "Failed to update approvers.");
            }
        } catch (err) {
            setStepApproverError(err.response?.data?.message || "Failed to update approvers.");
        } finally {
            setStepApproverLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <DetailsPreloader />
            </DashboardLayout>
        );
    }

    if (error || !definition) {
        return (
            <DashboardLayout>
                <div className="px-3">
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-danger">
                            <i className="ti ti-alert-circle me-2"></i>
                            {error || "Workflow definition not found"}
                        </div>
                        <button className="btn btn-secondary" onClick={() => navigate("/workflows/definitions")}>
                            <i className="ti ti-arrow-left me-2"></i>
                            Back to List
                        </button>
                    </div>
                </div>
                </div>
            </DashboardLayout>
        );
    }

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
                                    <div className="page-header-title">
                                        <h2 className="mb-0">
                                            <i className="ti ti-template me-2"></i>
                                            {definition.name}
                                        </h2>
                                    </div>
                                    <button
                                        className="btn btn-outline-secondary btn-sm mb-3"
                                        onClick={() => navigate("/workflows/definitions")}
                                    >
                                        <i className="ti ti-arrow-left me-1"></i>
                                        Back to Definitions
                                    </button>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-0 mt-2">
                                            <li className="breadcrumb-item">
                                                <a href="#" onClick={(e) => { e.preventDefault(); navigate("/workflows"); }}>Workflows</a>
                                            </li>
                                            <li className="breadcrumb-item">
                                                <a href="#" onClick={(e) => { e.preventDefault(); navigate("/workflows/definitions"); }}>Definitions</a>
                                            </li>
                                            <li className="breadcrumb-item active">{definition.name}</li>
                                        </ol>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Basic Information */}
                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Basic Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label text-muted">Workflow Name</label>
                                    <p className="fw-bold">{definition.name}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted">Entity Type</label>
                                    <p>
                                        {definition.entity_type ? (
                                            <span className="badge bg-info">{definition.entity_type}</span>
                                        ) : (
                                            <span className="text-muted">N/A</span>
                                        )}
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted">Organization Scope</label>
                                    <p>{getOrgScopeBadge(definition.organization_scope)}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted">Status</label>
                                    <p>{getStatusBadge(definition.is_active)}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted">Version</label>
                                    <p className="fw-bold">{definition.version}</p>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-muted">Created At</label>
                                    <p className="text-muted">
                                        {definition.created_at && definition.created_at !== "0001-01-01T00:00:00"
                                            ? new Date(definition.created_at).toLocaleString()
                                            : "N/A"}
                                    </p>
                                </div>
                                {definition.description && (
                                    <div className="col-12">
                                        <label className="form-label text-muted">Description</label>
                                        <p>{definition.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Workflow Steps */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Workflow Steps ({definition.steps?.length || 0})</h5>
                        </div>
                        <div className="card-body">
                            {!definition.steps || definition.steps.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="ti ti-folder-off fs-1 text-muted mb-3"></i>
                                    <p className="text-muted">No workflow steps defined</p>
                                </div>
                            ) : (
                                <div className="workflow-steps">
                                    {definition.steps.map((step, index) => (
                                        <div key={step.id || index} className="card mb-3 bg-light">
                                            <div className="card-body">
                                                <div className="d-flex align-items-start">
                                                    <div className="me-3">
                                                        <span className="badge bg-primary" style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}>
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h6 className="mb-0">{step.step_name || `Step ${index + 1}`}</h6>
                                                            {step.id && (
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={() => editingStepId === step.id ? closeStepApproverEdit() : openStepApproverEdit(step)}
                                                                    title="Update Approvers"
                                                                >
                                                                    <i className="ti ti-users me-1"></i>
                                                                    {editingStepId === step.id ? "Cancel" : "Update Approvers"}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="row g-3">
                                                            <div className="col-md-6">
                                                                <small className="text-muted d-block">Approver Type</small>
                                                                <span className="badge bg-info">
                                                                    {step.approver_type || "N/A"}
                                                                </span>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <small className="text-muted d-block">Approval Mode</small>
                                                                <span className="badge bg-warning">
                                                                    {step.approval_mode || "N/A"}
                                                                </span>
                                                            </div>
                                                            {step.sla_hours && (
                                                                <div className="col-md-6">
                                                                    <small className="text-muted d-block">SLA</small>
                                                                    <span>{step.sla_hours} hours</span>
                                                                </div>
                                                            )}
                                                            <div className="col-md-6">
                                                                <small className="text-muted d-block">Options</small>
                                                                <div>
                                                                    {step.can_delegate && (
                                                                        <span className="badge bg-success me-1">Can Delegate</span>
                                                                    )}
                                                                    {step.is_parallel && (
                                                                        <span className="badge bg-info">Parallel</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {step.approver_user_ids && step.approver_user_ids.length > 0 && (
                                                                <div className="col-12">
                                                                    <small className="text-muted d-block mb-2">
                                                                        <i className="ti ti-users me-1"></i>
                                                                        User Approvers
                                                                    </small>
                                                                    <div className="d-flex flex-wrap gap-2">
                                                                        {step.approver_user_ids.map((userId) => (
                                                                            <span key={userId} className="badge bg-info">
                                                                                {getUserName(userId)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {step.approver_role_ids && step.approver_role_ids.length > 0 && (
                                                                <div className="col-12">
                                                                    <small className="text-muted d-block mb-2">
                                                                        <i className="ti ti-shield me-1"></i>
                                                                        Role Approvers
                                                                    </small>
                                                                    <div className="d-flex flex-wrap gap-2">
                                                                        {step.approver_role_ids.map((roleId) => (
                                                                            <span key={roleId} className="badge bg-success">
                                                                                {getRoleName(roleId)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {step.condition_expression && (
                                                                <div className="col-12">
                                                                    <small className="text-muted d-block mb-2">
                                                                        <i className="ti ti-code me-1"></i>
                                                                        Condition Expression
                                                                    </small>
                                                                    <code className="bg-white p-2 d-block rounded">
                                                                        {step.condition_expression}
                                                                    </code>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Update Step Approvers Panel */}
                                            {editingStepId === step.id && step.id && (
                                                <div className="card-footer border-top" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                                                    <h6 className="mb-3">
                                                        <i className="ti ti-users me-2"></i>
                                                        Update Step Approvers
                                                        <small className="text-muted ms-2 fw-normal">
                                                            (Affects future workflow instances only)
                                                        </small>
                                                    </h6>
                                                    {stepApproverError && (
                                                        <div className="alert alert-danger py-2 small">{stepApproverError}</div>
                                                    )}
                                                    {stepApproverSuccess && (
                                                        <div className="alert alert-success py-2 small">{stepApproverSuccess}</div>
                                                    )}
                                                    <div className="row g-3">
                                                        <div className="col-md-6">
                                                            <label className="form-label">
                                                                <i className="ti ti-users me-1"></i>User Approvers
                                                            </label>
                                                            <div className="input-group mb-2">
                                                                <select
                                                                    className="form-select"
                                                                    value={selectedStepUserId}
                                                                    onChange={(e) => setSelectedStepUserId(e.target.value)}
                                                                >
                                                                    <option value="">Select a user...</option>
                                                                    {users.filter((u) => u.is_active).map((user) => (
                                                                        <option key={user.id} value={user.id}>
                                                                            {user.first_name} {user.other_name} ({user.email_address})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button type="button" className="btn btn-primary" onClick={addStepApproverUser} disabled={!selectedStepUserId}>
                                                                    <i className="ti ti-plus"></i>
                                                                </button>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {stepApproverForm.approver_user_ids.map((uid) => {
                                                                    const user = users.find((u) => u.id === uid);
                                                                    return (
                                                                        <span key={uid} className="badge bg-info">
                                                                            {user ? `${user.first_name} ${user.other_name}` : `User ID: ${uid}`}
                                                                            <button type="button" className="btn-close btn-close-white ms-2" onClick={() => removeStepApproverUser(uid)} style={{ fontSize: "0.7rem" }}></button>
                                                                        </span>
                                                                    );
                                                                })}
                                                                {stepApproverForm.approver_user_ids.length === 0 && (
                                                                    <small className="text-muted">No users assigned</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label">
                                                                <i className="ti ti-shield me-1"></i>Role Approvers
                                                            </label>
                                                            <div className="input-group mb-2">
                                                                <select
                                                                    className="form-select"
                                                                    value={selectedStepRoleId}
                                                                    onChange={(e) => setSelectedStepRoleId(e.target.value)}
                                                                >
                                                                    <option value="">Select a role...</option>
                                                                    {roles.map((role) => (
                                                                        <option key={role.id} value={role.id}>
                                                                            {role.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button type="button" className="btn btn-primary" onClick={addStepApproverRole} disabled={!selectedStepRoleId}>
                                                                    <i className="ti ti-plus"></i>
                                                                </button>
                                                            </div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {stepApproverForm.approver_role_ids.map((rid) => {
                                                                    const role = roles.find((r) => r.id === rid);
                                                                    return (
                                                                        <span key={rid} className="badge bg-success">
                                                                            {role ? role.name : `Role ID: ${rid}`}
                                                                            <button type="button" className="btn-close btn-close-white ms-2" onClick={() => removeStepApproverRole(rid)} style={{ fontSize: "0.7rem" }}></button>
                                                                        </span>
                                                                    );
                                                                })}
                                                                {stepApproverForm.approver_role_ids.length === 0 && (
                                                                    <small className="text-muted">No roles assigned</small>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-12 d-flex gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm"
                                                                onClick={saveStepApprovers}
                                                                disabled={stepApproverLoading}
                                                            >
                                                                {stepApproverLoading ? (
                                                                    <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                                                                ) : (
                                                                    <><i className="ti ti-check me-1"></i>Save Approvers</>
                                                                )}
                                                            </button>
                                                            <button type="button" className="btn btn-secondary btn-sm" onClick={closeStepApproverEdit}>
                                                                <i className="ti ti-x me-1"></i>Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Actions</h5>
                        </div>
                        <div className="card-body">
                            <button
                                className="btn btn-primary w-100 mb-2"
                                onClick={() => navigate(`/workflows/definitions/edit/${id}`)}
                            >
                                <i className="ti ti-edit me-2"></i>
                                Edit Definition
                            </button>
                            <button
                                className="btn btn-secondary w-100"
                                onClick={() => navigate("/workflows/definitions")}
                            >
                                <i className="ti ti-arrow-left me-2"></i>
                                Back to List
                            </button>
                        </div>
                    </div>

                    <div className="card border-0" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                        <div className="card-body">
                            <h6 className="mb-3">
                                <i className="ti ti-info-circle me-2"></i>
                                Information
                            </h6>
                            <ul className="small mb-0">
                                <li className="mb-2">ID: <code>{definition.id}</code></li>
                                <li className="mb-2">Total Steps: <strong>{definition.steps?.length || 0}</strong></li>
                                {definition.created_by && (
                                    <li className="mb-0">Created By: User #{definition.created_by}</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
