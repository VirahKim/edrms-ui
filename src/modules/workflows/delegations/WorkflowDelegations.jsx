import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getMyDelegations, getDelegationsToMe, createDelegation, updateDelegation, deleteDelegation } from "../../../api/workflowsApi";
import TablePreloader from "../../../components/TablePreloader";
import apiClient from "../../../api/apiClient";

export default function WorkflowDelegations() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [myDelegations, setMyDelegations] = useState([]);
    const [delegatedToMe, setDelegatedToMe] = useState([]);
    const [activeTab, setActiveTab] = useState("my");
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [processing, setProcessing] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    const [formData, setFormData] = useState({
        delegation_id: null,
        delegated_to_user_id: "",
        entity_type: "",
        start_date: "",
        end_date: ""
    });

    useEffect(() => {
        loadDelegations();
        loadUsers();
    }, []);

    const loadDelegations = async () => {
        try {
            setLoading(true);
            setError("");
            
            const [myRes, toMeRes] = await Promise.all([
                getMyDelegations(true),
                getDelegationsToMe(true)
            ]);
            
            if (myRes.success) {
                setMyDelegations(myRes.data || []);
            }
            
            if (toMeRes.success) {
                setDelegatedToMe(toMeRes.data || []);
            }
        } catch (err) {
            console.error("Error loading delegations:", err);
            setError("Failed to load delegations");
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const token = localStorage.getItem("token");
            const response = await apiClient.get("/IAmAPI/api/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const openCreateModal = () => {
        setModalMode("create");
        setFormData({
            delegation_id: null,
            delegated_to_user_id: "",
            entity_type: "",
            start_date: new Date().toISOString().split('T')[0],
            end_date: ""
        });
        setShowModal(true);
    };

    const openEditModal = (delegation) => {
        setModalMode("edit");
        setFormData({
            delegation_id: delegation.delegation_id,
            delegated_to_user_id: delegation.delegated_to_user_id,
            entity_type: delegation.entity_type || "",
            start_date: delegation.start_date ? delegation.start_date.split('T')[0] : "",
            end_date: delegation.end_date ? delegation.end_date.split('T')[0] : ""
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({
            delegation_id: null,
            delegated_to_user_id: "",
            entity_type: "",
            start_date: "",
            end_date: ""
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.delegated_to_user_id) {
            alert("Please enter a user ID to delegate to");
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            alert("Please specify start and end dates");
            return;
        }

        setProcessing(true);
        try {
            let response;
            
            if (modalMode === "create") {
                const payload = {
                    delegated_to_user_id: parseInt(formData.delegated_to_user_id),
                    entity_type: formData.entity_type || null,
                    start_date: new Date(formData.start_date).toISOString(),
                    end_date: new Date(formData.end_date + "T23:59:59").toISOString()
                };
                response = await createDelegation(payload);
            } else {
                const payload = {
                    end_date: new Date(formData.end_date + "T23:59:59").toISOString(),
                    is_active: true
                };
                response = await updateDelegation(formData.delegation_id, payload);
            }

            if (response.success) {
                alert(`Delegation ${modalMode === "create" ? "created" : "updated"} successfully`);
                closeModal();
                loadDelegations();
            } else {
                alert(response.message || `Failed to ${modalMode} delegation`);
            }
        } catch (err) {
            console.error(`Error ${modalMode}ing delegation:`, err);
            alert(`Failed to ${modalMode} delegation`);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this delegation?")) {
            return;
        }

        try {
            const response = await deleteDelegation(id);
            if (response.success) {
                alert("Delegation deactivated successfully");
                loadDelegations();
            } else {
                alert(response.message || "Failed to deactivate delegation");
            }
        } catch (err) {
            console.error("Error deleting delegation:", err);
            alert("Failed to deactivate delegation");
        }
    };

    const isActive = (delegation) => {
        const now = new Date();
        const start = new Date(delegation.start_date);
        const end = new Date(delegation.end_date);
        return delegation.is_active && now >= start && now <= end;
    };

    const getStatusBadge = (delegation) => {
        if (!delegation.is_active) {
            return <span className="badge bg-secondary">Inactive</span>;
        }
        
        if (isActive(delegation)) {
            return <span className="badge bg-success">Active</span>;
        }
        
        const now = new Date();
        const start = new Date(delegation.start_date);
        
        if (now < start) {
            return <span className="badge bg-info">Scheduled</span>;
        }
        
        return <span className="badge bg-warning">Expired</span>;
    };

    const renderDelegationsTable = (delegations, isDelegatedToMe = false) => {
        if (delegations.length === 0) {
            return (
                <div className="text-center py-5">
                    <i className="ti ti-folder-off fs-1 text-muted mb-3"></i>
                    <p className="text-muted">No delegations found</p>
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            {isDelegatedToMe ? (
                                <th>Delegated From</th>
                            ) : (
                                <th>Delegated To</th>
                            )}
                            <th>Entity Type</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            {!isDelegatedToMe && <th className="text-end">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {delegations.map((delegation) => {
                            const userId = isDelegatedToMe ? delegation.delegated_from_user_id : delegation.delegated_to_user_id;
                            const user = users.find(u => u.id === userId);
                            return (
                            <tr key={delegation.delegation_id}>
                                <td>
                                    <strong>{user ? `${user.first_name} ${user.other_name}` : `User ID: ${userId}`}</strong>
                                    {user && <><br /><small className="text-muted">{user.email_address}</small></>}
                                </td>
                                <td>
                                    {delegation.entity_type ? (
                                        <span className="badge bg-info">{delegation.entity_type}</span>
                                    ) : (
                                        <span className="badge bg-secondary">All Types</span>
                                    )}
                                </td>
                                <td>
                                    <small className="text-muted">
                                        {new Date(delegation.start_date).toLocaleDateString()}
                                    </small>
                                </td>
                                <td>
                                    <small className="text-muted">
                                        {new Date(delegation.end_date).toLocaleDateString()}
                                    </small>
                                </td>
                                <td>{getStatusBadge(delegation)}</td>
                                {!isDelegatedToMe && (
                                    <td className="text-end">
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-outline-warning"
                                                onClick={() => openEditModal(delegation)}
                                                title="Edit"
                                                disabled={!delegation.is_active}
                                            >
                                                <i className="ti ti-edit"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-danger"
                                                onClick={() => handleDelete(delegation.delegation_id)}
                                                title="Deactivate"
                                                disabled={!delegation.is_active}
                                            >
                                                <i className="ti ti-x"></i>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>
        );
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
                                            onClick={openCreateModal}
                                        >
                                            <i className="ti ti-plus me-2"></i>
                                            Create Delegation
                                        </button>
                                    </div>
                                    <div className="page-header-title">
                                        <h2 className="mb-0">
                                            <i className="ti ti-user-share me-2"></i>
                                            Workflow Delegations
                                        </h2>
                                    </div>
                                    <nav aria-label="breadcrumb">
                                        <ol className="breadcrumb mb-0 mt-2">
                                            <li className="breadcrumb-item">
                                                <a href="#" onClick={(e) => { e.preventDefault(); navigate("/workflows"); }}>Workflows</a>
                                            </li>
                                            <li className="breadcrumb-item active">Delegations</li>
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

            {/* Tabs */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <ul className="nav nav-tabs card-header-tabs" role="tablist">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "my" ? "active" : ""}`}
                                        onClick={() => setActiveTab("my")}
                                    >
                                        <i className="ti ti-user-check me-1"></i>
                                        My Delegations ({myDelegations.length})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "tome" ? "active" : ""}`}
                                        onClick={() => setActiveTab("tome")}
                                    >
                                        <i className="ti ti-user-plus me-1"></i>
                                        Delegated To Me ({delegatedToMe.length})
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <TablePreloader />
                            ) : (
                                <>
                                    {activeTab === "my" && renderDelegationsTable(myDelegations, false)}
                                    {activeTab === "tome" && renderDelegationsTable(delegatedToMe, true)}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                        <div className="card-body">
                            <h6 className="mb-3">
                                <i className="ti ti-info-circle me-2"></i>
                                About Delegations
                            </h6>
                            <ul className="small mb-0">
                                <li className="mb-2">Delegations allow you to temporarily assign your approval responsibilities to another user</li>
                                <li className="mb-2">You can delegate all approvals or only specific entity types</li>
                                <li className="mb-2">Delegations are time-bound and automatically expire after the end date</li>
                                <li className="mb-0">Active delegations are automatically applied when workflows are started</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modalMode === "create" ? (
                                        <><i className="ti ti-plus me-2"></i>Create Delegation</>
                                    ) : (
                                        <><i className="ti ti-edit me-2"></i>Edit Delegation</>
                                    )}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Delegate To User <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            name="delegated_to_user_id"
                                            value={formData.delegated_to_user_id}
                                            onChange={handleInputChange}
                                            required
                                            disabled={modalMode === "edit" || loadingUsers}
                                        >
                                            <option value="">Select a user...</option>
                                            {users.filter(user => user.is_active).map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.other_name} ({user.email_address})
                                                </option>
                                            ))}
                                        </select>
                                        <small className="text-muted">The user who will receive your approvals</small>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Entity Type</label>
                                        <select
                                            className="form-select"
                                            name="entity_type"
                                            value={formData.entity_type}
                                            onChange={handleInputChange}
                                            disabled={modalMode === "edit"}
                                        >
                                            <option value="">All Entity Types</option>
                                            <option value="PURCHASE_ORDER">Purchase Order</option>
                                            <option value="LEAVE_REQUEST">Leave Request</option>
                                            <option value="EXPENSE_CLAIM">Expense Claim</option>
                                            <option value="INVOICE">Invoice</option>
                                            <option value="CONTRACT">Contract</option>
                                        </select>
                                        <small className="text-muted">Leave empty to delegate all types</small>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Start Date <span className="text-danger">*</span></label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleInputChange}
                                                required
                                                disabled={modalMode === "edit"}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">End Date <span className="text-danger">*</span></label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {modalMode === "create" ? "Create" : "Update"} Delegation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </DashboardLayout>
    );
}
