import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { formatErrorDisplay } from "../../../utils/errorHandler";

export default function Actions() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newAction, setNewAction] = useState({ name: "", description: "" });
    const [savingNew, setSavingNew] = useState(false);

    async function loadActions() {
        setLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/actions", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load modules");
        } finally {
            setLoading(false);
        }
    }

    // Load Actions
    useEffect(() => {
        loadActions();
    }, []);

    // Update action function
    const updateAction = async (module) => {
        setSavingEdit(true);
        setError("");
        setSuccess("");
        try {
            const res = await apiClient.put(
                `/IAmAPI/api/actions/${module.id}`,
                module,
                {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
            setData((prev) =>
                prev.map((m) => (m.id === res.data.id ? res.data : m))
            );
            setSuccess("Action updated successfully");
            setEditModalOpen(false);
            loadActions();
        } catch (err) {
            setError(formatErrorDisplay(err));
        } finally {
            setSavingEdit(false);
        }
    };

    const createAction = async () => {
        if (!newAction.name) {
            setError("Action name is required");
            return;
        }

        setSavingNew(true);
        setError("");
        setSuccess("");

        try {
            const res = await apiClient.post(
                "/IAmAPI/api/actions",
                newAction,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            setSuccess("Action created successfully");

            // Add to table instantly
            setData((prev) => [res.data, ...prev]);

            // Reset form + close
            setNewAction({ name: "", description: "" });
            setAddModalOpen(false);
        } catch (err) {
            setError(formatErrorDisplay(err));
        } finally {
            setSavingNew(false);
        }
    };


    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5>Actions</h5>
                            <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
                                <i className="ti ti-plus"></i> ADD
                            </button>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            {loading ? (
                                <p>Loading actions...</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {data.map((mod) => (
                                            <tr key={mod.id}>
                                                <td>{mod.id}</td>
                                                <td>{mod.name}</td>
                                                <td>{mod.description}</td>
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
                                <h5 className="modal-title">Edit Action</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEditModalOpen(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Action Name</label>
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
                            <div className="modal-footer">
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
                                    onClick={() => updateAction(editingModule)}
                                >
                                    {savingEdit ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {addModalOpen && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Action</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setAddModalOpen(false)}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Action Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newAction.name}
                                        onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        value={newAction.description}
                                        onChange={(e) =>
                                            setNewAction({ ...newAction, description: e.target.value })
                                        }
                                        style={{ height: 100 }}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer justify-content-between">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setAddModalOpen(false)}
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={savingNew}
                                    onClick={createAction}
                                >
                                    {savingNew ? "Saving..." : "Save Action"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </DashboardLayout>
    );
}