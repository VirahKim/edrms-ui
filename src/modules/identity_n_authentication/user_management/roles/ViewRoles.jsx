import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { ROLE_CENTER_OPTIONS } from "../../../dashboard/roleCenters/registry";

const landingPageLabel = (key) =>
    ROLE_CENTER_OPTIONS.find((opt) => opt.key === (key || ""))?.label || key;

export default function ViewRoles() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const navigate = useNavigate();

    const fetchRoles = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await apiClient.get("/IAmAPI/api/roles", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
            });
            setData(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load roles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this role?")) {
            return;
        }

        setDeletingId(id);
        setError("");
        setSuccess("");

        try {
            await apiClient.delete(`/IAmAPI/api/roles/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
            });

            setSuccess("Role deleted successfully");
            setData((prev) => prev.filter((role) => role.id !== id));
        } catch (err) {
            console.error(err);
            setError(err.response?.data || "Failed to delete role");
        } finally {
            setDeletingId(null);
        }
    };

    const openPermissions = (roleId) => {
        navigate(`/role_permissions/${roleId}`);
    };

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card table-card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5>Roles</h5>
                                <Link to="/create_role" className="btn btn-primary">
                                    <i className="ti ti-plus"></i> New Role
                                </Link>
                            </div>
                        </div>
                        <div className="card-body p-3">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <div className="table-responsive">
                                {loading ? (
                                    <p>
                                        <span className="spinner-grow spinner-grow-sm" role="status"></span> Loading roles...
                                    </p>
                                ) : (
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Landing Page</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center">No roles found</td>
                                                </tr>
                                            ) : (
                                                data.map((role) => (
                                                    <tr key={role.id}>
                                                        <td>{role.id}</td>
                                                        <td>{role.name}</td>
                                                        <td>{role.description}</td>
                                                        <td>
                                                            <span className="badge bg-light-secondary text-secondary">
                                                                {landingPageLabel(role.landing_page_key)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-info me-2"
                                                                onClick={() => openPermissions(role.id)}
                                                            >
                                                                <i className="ti ti-key"></i> Permissions
                                                            </button>
                                                            <Link
                                                                to={`/edit_role/${role.id}`}
                                                                state={{ roleData: role }}
                                                                className="btn btn-sm btn-warning me-2"
                                                            >
                                                                <i className="ti ti-edit"></i> Edit
                                                            </Link>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDelete(role.id)}
                                                                disabled={deletingId === role.id}
                                                            >
                                                                {deletingId === role.id ? (
                                                                    <>
                                                                        <span className="spinner-grow spinner-grow-sm" role="status"></span> Deleting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="ti ti-trash"></i> Delete
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
