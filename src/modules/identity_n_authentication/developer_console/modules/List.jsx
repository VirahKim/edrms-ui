import { useEffect, useState } from "react";
import apiClient from "../../../../api/apiClient";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { formatErrorDisplay } from "../../../../utils/errorHandler";

export default function List() {
    const [data, setData] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadModules() {
        setLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/modules", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setData(res.data);
            // Set parent modules for dropdown (those without parent_module_id)
            setModules(res.data.filter(mod => mod.parent_module_id === null));
        } catch (err) {
            console.error(err);
            setError("Failed to load modules");
        } finally {
            setLoading(false);
        }
    }

    // Load modules
    useEffect(() => {
        loadModules();
    }, []);

    // Update module function
    const updateModule = async (module) => {
        setSavingEdit(true);
        setError("");
        setSuccess("");
        try {
            const res = await apiClient.put(
                `/IAmAPI/api/modules/${module.id}`,
                module,
                {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
            setData((prev) =>
                prev.map((m) => (m.id === res.data.id ? res.data : m))
            );
            setSuccess("Module updated successfully");
            setEditModalOpen(false);
            loadModules();
        } catch (err) {
            setError(formatErrorDisplay(err));
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <DashboardLayout>
        <div className="row">
            <div className="col-12">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                <h5>Modules</h5>
                <Link to={"/add_module"} className="btn btn-primary">
                    <i className="ti ti-plus"></i> ADD
                </Link>
                </div>
                <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <p>Loading modules...</p>
                ) : (
                    <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                        <tr>                            
                            <th>Icon</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Route</th>
                            <th>Parent Module</th>
                            <th>Order</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.map((mod) => (
                            <tr key={mod.id}>
                            <td>
                                {mod.icon && <i className={`${mod.icon}`}></i>}
                            </td>
                            <td>{mod.name}</td>
                            <td>{mod.description}</td>
                            <td>{mod.route}</td>
                            <td>{mod.parent_module_name || "-"}</td>
                            <td>{mod.display_order}</td>
                            <td>
                                <button
                                className="btn btn-sm btn-warning"
                                onClick={() => {
                                    setEditingModule(mod);
                                    setEditModalOpen(true);
                                }}
                                >
                                <i className="ti ti-edit"></i> Edit
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                )}
                </div>
            </div>
            </div>
        </div>

        {/* Edit Modal */}
        {editModalOpen && editingModule && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Module</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setEditModalOpen(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Module Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingModule?.name || ""}
                                    onChange={(e) =>
                                    setEditingModule({ ...editingModule, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Icon</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingModule?.icon || ""}
                                    onChange={(e) =>
                                    setEditingModule({ ...editingModule, icon: e.target.value })
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Route</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editingModule?.route || ""}
                                    onChange={(e) =>
                                    setEditingModule({ ...editingModule, route: e.target.value })
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Order</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={editingModule?.display_order || 0}
                                    onChange={(e) =>
                                    setEditingModule({ ...editingModule, display_order: e.target.value })
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Parent Module</label>
                                <select
                                    className="form-select"
                                    value={editingModule?.parent_module_id || ""}
                                    onChange={(e) =>
                                    setEditingModule({ ...editingModule, parent_module_id: e.target.value ? parseInt(e.target.value) : null })
                                    }
                                >
                                    <option value="">None (Parent Module)</option>
                                    {modules.filter(m => m.id !== editingModule?.id).map(mod => (
                                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-control"
                                    value={editingModule?.description || ""}
                                    onChange={(e) =>
                                    setEditingModule({ ...editingModule, description: e.target.value })
                                    }
                                    style={{ height: 100 }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer justify-content-between">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setEditModalOpen(false)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={savingEdit}
                                onClick={() => updateModule(editingModule)}
                            >
                                {savingEdit ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </DashboardLayout>
    );
}