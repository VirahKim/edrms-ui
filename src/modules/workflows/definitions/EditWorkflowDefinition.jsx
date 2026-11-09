import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getWorkflowDefinitionById, getWorkflowEnums, updateWorkflowDefinition, updateStepApprovers } from "../../../api/workflowsApi";
import apiClient from "../../../api/apiClient";
import DetailsPreloader from "../../../components/DetailsPreloader";

const SUPPORTED_APPROVER_TYPES = ["ROLE", "USER", "MIXED"];

const getEnumList = (items) =>
    (Array.isArray(items) ? items : []).map((item) => ({
        code: item.Code ?? item.code ?? "",
        description: item.Description ?? item.description ?? ""
    }));

const getOptionLabel = (item) => item?.description || item?.code || "";

export default function EditWorkflowDefinition() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [entityTypes, setEntityTypes] = useState([]);
    const [organizationScopes, setOrganizationScopes] = useState([]);
    const [approverTypes, setApproverTypes] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    
    const [formData, setFormData] = useState({
        entity_type: "",
        name: "",
        description: "",
        organization_scope: "",
        steps: []
    });

    const [currentStep, setCurrentStep] = useState({
        step_order: 1,
        step_name: "",
        approver_type: "",
        approval_mode: "ANY",
        approver_user_ids: [],
        approver_role_ids: [],
        sla_hours: 24,
        can_delegate: true,
        is_parallel: false,
        condition_expression: ""
    });

    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState("");

    // State for quick-update step approvers
    const [editingStepIndex, setEditingStepIndex] = useState(null);
    const [stepApproverForm, setStepApproverForm] = useState({ approver_user_ids: [], approver_role_ids: [] });
    const [selectedStepUserId, setSelectedStepUserId] = useState("");
    const [selectedStepRoleId, setSelectedStepRoleId] = useState("");
    const [stepApproverLoading, setStepApproverLoading] = useState(false);
    const [stepApproverError, setStepApproverError] = useState("");
    const [stepApproverSuccess, setStepApproverSuccess] = useState("");

    // Fetch workflow definition, roles and users on component mount
    useEffect(() => {
        async function fetchData() {
            try {
                setLoadingData(true);
                const token = localStorage.getItem("token");
                
                const [defResponse, rolesRes, usersRes, enumsRes] = await Promise.all([
                    getWorkflowDefinitionById(id),
                    apiClient.get("/IAmAPI/api/roles", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    apiClient.get("/IAmAPI/api/users", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    getWorkflowEnums()
                ]);

                const enums = enumsRes?.data || {};
                const fetchedEntityTypes = getEnumList(enums.entity_types);
                const fetchedOrganizationScopes = getEnumList(enums.organization_scopes);
                const fetchedApproverTypes = getEnumList(enums.approver_types).filter(({ code }) =>
                    SUPPORTED_APPROVER_TYPES.includes(code)
                );

                setRoles(rolesRes.data || []);
                setUsers(usersRes.data || []);
                setEntityTypes(fetchedEntityTypes);
                setOrganizationScopes(fetchedOrganizationScopes);
                setApproverTypes(fetchedApproverTypes);
                setCurrentStep((prev) => ({
                    ...prev,
                    approver_type: prev.approver_type || fetchedApproverTypes[0]?.code || ""
                }));

                if (defResponse && defResponse.data) {
                    const def = defResponse.data;
                    setFormData({
                        entity_type: def.entity_type || fetchedEntityTypes[0]?.code || "",
                        name: def.name || "",
                        description: def.description || "",
                        organization_scope: def.organization_scope || fetchedOrganizationScopes[0]?.code || "",
                        steps: def.steps || []
                    });
                } else {
                    setError("Workflow definition not found");
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load workflow definition");
            } finally {
                setLoadingData(false);
            }
        }
        fetchData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleStepChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentStep({
            ...currentStep,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const addUserId = () => {
        if (selectedUserId && !isNaN(selectedUserId)) {
            const userId = parseInt(selectedUserId);
            if (!currentStep.approver_user_ids.includes(userId)) {
                setCurrentStep({
                    ...currentStep,
                    approver_user_ids: [...currentStep.approver_user_ids, userId]
                });
            }
            setSelectedUserId("");
        }
    };

    const removeUserId = (userId) => {
        setCurrentStep({
            ...currentStep,
            approver_user_ids: currentStep.approver_user_ids.filter(id => id !== userId)
        });
    };

    const addRoleId = () => {
        if (selectedRoleId && !isNaN(selectedRoleId)) {
            const roleId = parseInt(selectedRoleId);
            if (!currentStep.approver_role_ids.includes(roleId)) {
                setCurrentStep({
                    ...currentStep,
                    approver_role_ids: [...currentStep.approver_role_ids, roleId]
                });
            }
            setSelectedRoleId("");
        }
    };

    const removeRoleId = (roleId) => {
        setCurrentStep({
            ...currentStep,
            approver_role_ids: currentStep.approver_role_ids.filter(id => id !== roleId)
        });
    };

    const addStep = () => {
        if (!currentStep.step_name) {
            alert("Please enter a step name");
            return;
        }

        if (currentStep.approver_type === "USER" && currentStep.approver_user_ids.length === 0) {
            alert("Please add at least one user approver");
            return;
        }

        if (currentStep.approver_type === "ROLE" && currentStep.approver_role_ids.length === 0) {
            alert("Please add at least one role approver");
            return;
        }

        const newStep = {
            ...currentStep,
            step_order: formData.steps.length + 1
        };

        setFormData({
            ...formData,
            steps: [...formData.steps, newStep]
        });

        // Reset current step
        setCurrentStep({
            step_order: formData.steps.length + 2,
            step_name: "",
            approver_type: approverTypes[0]?.code || "",
            approval_mode: "ANY",
            approver_user_ids: [],
            approver_role_ids: [],
            sla_hours: 24,
            can_delegate: true,
            is_parallel: false,
            condition_expression: ""
        });
    };

    const removeStep = (index) => {
        const updatedSteps = formData.steps.filter((_, i) => i !== index);
        // Reorder steps
        const reorderedSteps = updatedSteps.map((step, i) => ({
            ...step,
            step_order: i + 1
        }));
        setFormData({ ...formData, steps: reorderedSteps });
    };

    const moveStep = (index, direction) => {
        const newSteps = [...formData.steps];
        const newIndex = direction === "up" ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= newSteps.length) return;
        
        [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
        
        // Reorder
        const reorderedSteps = newSteps.map((step, i) => ({
            ...step,
            step_order: i + 1
        }));
        
        setFormData({ ...formData, steps: reorderedSteps });
    };

    const openStepApproverEdit = (index) => {
        const step = formData.steps[index];
        setEditingStepIndex(index);
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
        setEditingStepIndex(null);
        setStepApproverError("");
        setStepApproverSuccess("");
    };

    const addStepApproverUser = () => {
        if (selectedStepUserId && !isNaN(selectedStepUserId)) {
            const userId = parseInt(selectedStepUserId);
            if (!stepApproverForm.approver_user_ids.includes(userId)) {
                setStepApproverForm((prev) => ({
                    ...prev,
                    approver_user_ids: [...prev.approver_user_ids, userId]
                }));
            }
            setSelectedStepUserId("");
        }
    };

    const removeStepApproverUser = (userId) => {
        setStepApproverForm((prev) => ({
            ...prev,
            approver_user_ids: prev.approver_user_ids.filter((uid) => uid !== userId)
        }));
    };

    const addStepApproverRole = () => {
        if (selectedStepRoleId && !isNaN(selectedStepRoleId)) {
            const roleId = parseInt(selectedStepRoleId);
            if (!stepApproverForm.approver_role_ids.includes(roleId)) {
                setStepApproverForm((prev) => ({
                    ...prev,
                    approver_role_ids: [...prev.approver_role_ids, roleId]
                }));
            }
            setSelectedStepRoleId("");
        }
    };

    const removeStepApproverRole = (roleId) => {
        setStepApproverForm((prev) => ({
            ...prev,
            approver_role_ids: prev.approver_role_ids.filter((rid) => rid !== roleId)
        }));
    };

    const saveStepApprovers = async () => {
        const step = formData.steps[editingStepIndex];
        if (!step?.id) {
            setStepApproverError("Step ID not available. Save the full definition first to enable quick approver updates.");
            return;
        }
        if (stepApproverForm.approver_user_ids.length === 0 && stepApproverForm.approver_role_ids.length === 0) {
            setStepApproverError("At least one user or role approver is required.");
            return;
        }
        setStepApproverLoading(true);
        setStepApproverError("");
        setStepApproverSuccess("");
        try {
            const payload = {};
            if (stepApproverForm.approver_user_ids.length > 0)
                payload.approver_user_ids = stepApproverForm.approver_user_ids;
            if (stepApproverForm.approver_role_ids.length > 0)
                payload.approver_role_ids = stepApproverForm.approver_role_ids;
            const response = await updateStepApprovers(id, step.id, payload);
            if (response.success || response.data) {
                const updatedSteps = formData.steps.map((s, i) =>
                    i === editingStepIndex
                        ? { ...s, approver_user_ids: stepApproverForm.approver_user_ids, approver_role_ids: stepApproverForm.approver_role_ids }
                        : s
                );
                setFormData((prev) => ({ ...prev, steps: updatedSteps }));
                setStepApproverSuccess("Approvers updated successfully. This change affects future workflow instances only.");
            } else {
                setStepApproverError(response.message || "Failed to update approvers.");
            }
        } catch (err) {
            setStepApproverError(err.response?.data?.message || "Failed to update approvers.");
        } finally {
            setStepApproverLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            setError("Workflow name is required");
            return;
        }

        if (formData.steps.length === 0) {
            setError("Please add at least one workflow step");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await updateWorkflowDefinition(id, formData);
            
            if (response.success) {
                alert("Workflow definition updated successfully!");
                navigate("/workflows/definitions");
            } else {
                setError(response.message || "Failed to update workflow definition");
            }
        } catch (err) {
            console.error("Error updating workflow definition:", err);
            setError(err.response?.data?.message || "Failed to update workflow definition");
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <DashboardLayout>
                <DetailsPreloader />
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
                                            <i className="ti ti-edit me-2"></i>
                                            Edit Workflow Definition
                                        </h2>
                                    </div>
                                    <button
                                        className="btn btn-outline-secondary btn-sm mb-3"
                                        onClick={() => navigate("/workflows/definitions")}
                                        type="button"
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
                                            <li className="breadcrumb-item active">Edit</li>
                                        </ol>
                                    </nav>
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

            <form onSubmit={handleSubmit}>
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
                                        <label className="form-label">Workflow Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Purchase Order Approval"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Entity Type <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            name="entity_type"
                                            value={formData.entity_type}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="" disabled>
                                                Select entity type...
                                            </option>
                                            {entityTypes.map((entityType) => (
                                                <option key={entityType.code} value={entityType.code}>
                                                    {getOptionLabel(entityType)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Organization Scope</label>
                                        <select
                                            className="form-select"
                                            name="organization_scope"
                                            value={formData.organization_scope}
                                            onChange={handleInputChange}
                                        >
                                            <option value="" disabled>
                                                Select organization scope...
                                            </option>
                                            {organizationScopes.map((organizationScope) => (
                                                <option key={organizationScope.code} value={organizationScope.code}>
                                                    {getOptionLabel(organizationScope)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="Describe the workflow purpose and usage"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Workflow Steps - Similar to CreateWorkflowDefinition */}
                        {/* Copy the entire workflow steps section from CreateWorkflowDefinition.jsx */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Workflow Steps ({formData.steps.length})</h5>
                            </div>
                            <div className="card-body">
                                {formData.steps.length > 0 && (
                                    <div className="mb-4">
                                        {formData.steps.map((step, index) => (
                                            <div key={index} className="card mb-3 bg-light">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="flex-grow-1">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <span className="badge bg-primary me-2">Step {step.step_order}</span>
                                                                <strong>{step.step_name}</strong>
                                                            </div>
                                                            <div className="row g-2">
                                                                <div className="col-md-6">
                                                                    <small className="text-muted">
                                                                        <i className="ti ti-user me-1"></i>
                                                                        Approver Type: <span className="badge bg-info">{step.approver_type}</span>
                                                                    </small>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <small className="text-muted">
                                                                        <i className="ti ti-check me-1"></i>
                                                                        Mode: <span className="badge bg-warning">{step.approval_mode}</span>
                                                                    </small>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <small className="text-muted">
                                                                        <i className="ti ti-clock me-1"></i>
                                                                        SLA: {step.sla_hours} hours
                                                                    </small>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <small className="text-muted">
                                                                        {step.can_delegate && (
                                                                            <span className="badge bg-success">Can Delegate</span>
                                                                        )}
                                                                        {step.is_parallel && (
                                                                            <span className="badge bg-info ms-1">Parallel</span>
                                                                        )}
                                                                    </small>
                                                                </div>
                                                                {step.approver_user_ids.length > 0 && (
                                                                    <div className="col-12">
                                                                        <small className="text-muted">
                                                                            <i className="ti ti-users me-1"></i>
                                                                            Users: {step.approver_user_ids.map(userId => {
                                                                                const user = users.find(u => u.id === userId);
                                                                                return user ? `${user.first_name} ${user.other_name}` : `ID:${userId}`;
                                                                            }).join(", ")}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                                {step.approver_role_ids.length > 0 && (
                                                                    <div className="col-12">
                                                                        <small className="text-muted">
                                                                            <i className="ti ti-shield me-1"></i>
                                                                            Roles: {step.approver_role_ids.map(roleId => {
                                                                                const role = roles.find(r => r.id === roleId);
                                                                                return role ? role.name : `ID:${roleId}`;
                                                                            }).join(", ")}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                                {step.condition_expression && (
                                                                    <div className="col-12">
                                                                        <small className="text-muted">
                                                                            <i className="ti ti-code me-1"></i>
                                                                            Condition: <code>{step.condition_expression}</code>
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="btn-group btn-group-sm ms-3">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary"
                                                                onClick={() => moveStep(index, "up")}
                                                                disabled={index === 0}
                                                                title="Move Up"
                                                            >
                                                                <i className="ti ti-arrow-up"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary"
                                                                onClick={() => moveStep(index, "down")}
                                                                disabled={index === formData.steps.length - 1}
                                                                title="Move Down"
                                                            >
                                                                <i className="ti ti-arrow-down"></i>
                                                            </button>
                                                            {step.id && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-secondary"
                                                                    onClick={() => editingStepIndex === index ? closeStepApproverEdit() : openStepApproverEdit(index)}
                                                                    title="Quick Update Approvers"
                                                                >
                                                                    <i className="ti ti-users"></i>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger"
                                                                onClick={() => removeStep(index)}
                                                                title="Remove"
                                                            >
                                                                <i className="ti ti-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Quick Update Approvers Panel */}
                                                {editingStepIndex === index && step.id && (
                                                    <div className="mt-3 border-top pt-3">
                                                        <h6 className="mb-3">
                                                            <i className="ti ti-users me-2"></i>
                                                            Quick Update Approvers
                                                            <small className="text-muted ms-2 fw-normal">
                                                                (Saved immediately — only affects future workflow instances)
                                                            </small>
                                                        </h6>
                                                        {stepApproverError && (
                                                            <div className="alert alert-danger py-2 small">{stepApproverError}</div>
                                                        )}
                                                        {stepApproverSuccess && (
                                                            <div className="alert alert-success py-2 small">{stepApproverSuccess}</div>
                                                        )}
                                                        <div className="row g-3">
                                                            <div className="col-12">
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
                                                            <div className="col-12">
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

                                {/* Add Step Form - Same as in CreateWorkflowDefinition */}
                                <div className="card border-primary">
                                    <div className="card-header bg-primary text-white">
                                        <h6 className="mb-0">Add New Step</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Step Name <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="step_name"
                                                    value={currentStep.step_name}
                                                    onChange={handleStepChange}
                                                    placeholder="e.g., Manager Approval"
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Approver Type</label>
                                                <select
                                                    className="form-select"
                                                    name="approver_type"
                                                    value={currentStep.approver_type}
                                                    onChange={handleStepChange}
                                                >
                                                    <option value="" disabled>
                                                        Select approver type...
                                                    </option>
                                                    {approverTypes.map((approverType) => (
                                                        <option key={approverType.code} value={approverType.code}>
                                                            {getOptionLabel(approverType)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Approval Mode</label>
                                                <select
                                                    className="form-select"
                                                    name="approval_mode"
                                                    value={currentStep.approval_mode}
                                                    onChange={handleStepChange}
                                                >
                                                    <option value="ANY">ANY (First Approves)</option>
                                                    <option value="ALL">ALL (Unanimous)</option>
                                                </select>
                                            </div>

                                            {(currentStep.approver_type === "USER" || currentStep.approver_type === "MIXED") && (
                                                <div className="col-12">
                                                    <label className="form-label">User Approvers</label>
                                                    <div className="input-group mb-2">
                                                        <select
                                                            className="form-select"
                                                            value={selectedUserId}
                                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                                            disabled={loadingData}
                                                        >
                                                            <option value="">Select a user...</option>
                                                            {users.filter(user => user.is_active).map((user) => (
                                                                <option key={user.id} value={user.id}>
                                                                    {user.first_name} {user.other_name} ({user.email_address})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            onClick={addUserId}
                                                            disabled={!selectedUserId || loadingData}
                                                        >
                                                            <i className="ti ti-plus"></i> Add
                                                        </button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {currentStep.approver_user_ids.map((userId) => {
                                                            const user = users.find(u => u.id === userId);
                                                            return (
                                                                <span key={userId} className="badge bg-info">
                                                                    {user ? `${user.first_name} ${user.other_name}` : `User ID: ${userId}`}
                                                                    <button
                                                                        type="button"
                                                                        className="btn-close btn-close-white ms-2"
                                                                        onClick={() => removeUserId(userId)}
                                                                        style={{ fontSize: '0.7rem' }}
                                                                    ></button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {(currentStep.approver_type === "ROLE" || currentStep.approver_type === "MIXED") && (
                                                <div className="col-12">
                                                    <label className="form-label">Role Approvers</label>
                                                    <div className="input-group mb-2">
                                                        <select
                                                            className="form-select"
                                                            value={selectedRoleId}
                                                            onChange={(e) => setSelectedRoleId(e.target.value)}
                                                            disabled={loadingData}
                                                        >
                                                            <option value="">Select a role...</option>
                                                            {roles.map((role) => (
                                                                <option key={role.id} value={role.id}>
                                                                    {role.name} {role.description && `- ${role.description}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            onClick={addRoleId}
                                                            disabled={!selectedRoleId || loadingData}
                                                        >
                                                            <i className="ti ti-plus"></i> Add
                                                        </button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {currentStep.approver_role_ids.map((roleId) => {
                                                            const role = roles.find(r => r.id === roleId);
                                                            return (
                                                                <span key={roleId} className="badge bg-success">
                                                                    {role ? role.name : `Role ID: ${roleId}`}
                                                                    <button
                                                                        type="button"
                                                                        className="btn-close btn-close-white ms-2"
                                                                        onClick={() => removeRoleId(roleId)}
                                                                        style={{ fontSize: '0.7rem' }}
                                                                    ></button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-md-4">
                                                <label className="form-label">SLA (Hours)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="sla_hours"
                                                    value={currentStep.sla_hours}
                                                    onChange={handleStepChange}
                                                    min="1"
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label d-block">Options</label>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        name="can_delegate"
                                                        checked={currentStep.can_delegate}
                                                        onChange={handleStepChange}
                                                    />
                                                    <label className="form-check-label">Can Delegate</label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        name="is_parallel"
                                                        checked={currentStep.is_parallel}
                                                        onChange={handleStepChange}
                                                    />
                                                    <label className="form-check-label">Parallel</label>
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label">Condition Expression (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="condition_expression"
                                                    value={currentStep.condition_expression}
                                                    onChange={handleStepChange}
                                                    placeholder="e.g., amount > 10000"
                                                />
                                                <small className="text-muted">
                                                    JavaScript-like expression for conditional execution
                                                </small>
                                            </div>
                                            <div className="col-12">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary w-100"
                                                    onClick={addStep}
                                                >
                                                    <i className="ti ti-plus me-2"></i>
                                                    Add This Step
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                    type="submit"
                                    className="btn btn-primary w-100 mb-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-check me-2"></i>
                                            Update Workflow
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary w-100"
                                    onClick={() => navigate("/workflows/definitions")}
                                >
                                    <i className="ti ti-x me-2"></i>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
            </div>
        </DashboardLayout>
    );
}
