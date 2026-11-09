import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { ROLE_CENTER_OPTIONS, ROUTING_ROLE_OPTIONS } from "../../../dashboard/roleCenters/registry";
import { formatErrorDisplay } from "../../../../utils/errorHandler";

export default function CreateRole() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const roleData = location.state?.roleData;
    const isEdit = !!id && !!roleData;

    const [form, setForm] = useState({
        name: roleData?.name || "",
        description: roleData?.description || "",
        landing_page_key: roleData?.landing_page_key || "",
        routing_role_code: roleData?.routing_role_code || ""
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (isEdit) {
                await apiClient.put(`/IAmAPI/api/roles/${id}`, form, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setSuccess("Role updated successfully.");
            } else {
                await apiClient.post("/IAmAPI/api/roles", form, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setSuccess("Role created successfully.");
                setForm({ name: "", description: "", landing_page_key: "", routing_role_code: "" });
            }

            setTimeout(() => {
                navigate("/roles");
            }, 1500);
        } catch (err) {
            console.error("Error", err);
            setError(formatErrorDisplay(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card table-card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5>{isEdit ? 'Edit Role' : 'New Role'}</h5>
                                <Link to="/roles" className="btn btn-primary">
                                    <i className="ti ti-list"></i> List
                                </Link>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <div className="form-floating mb-0">
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                id="floatingInputName"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                            />
                                            <label htmlFor="floatingInputName">Role Name</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="form-floating">
                                            <select
                                                className="form-select"
                                                id="floatingLandingPage"
                                                name="landing_page_key"
                                                value={form.landing_page_key}
                                                onChange={handleChange}
                                            >
                                                {ROLE_CENTER_OPTIONS.map((opt) => (
                                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="floatingLandingPage">Landing Page (Role Center)</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <div className="form-floating">
                                            <select
                                                className="form-select"
                                                id="floatingRoutingRole"
                                                name="routing_role_code"
                                                value={form.routing_role_code}
                                                onChange={handleChange}
                                            >
                                                {ROUTING_ROLE_OPTIONS.map((opt) => (
                                                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="floatingRoutingRole">Routing Role (EDMS)</label>
                                        </div>
                                    </div>
                                    <div className="col-12 mb-3">
                                        <div className="form-floating">
                                            <textarea
                                                className="form-control"
                                                id="floatingTextarea"
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                style={{ height: 100 }}
                                            />
                                            <label htmlFor="floatingTextarea">Role Description</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="spinner-grow spinner-grow-sm" role="status"></span> Saving...
                                            </>
                                        ) : (
                                            <>{isEdit ? 'Update Role' : 'Save Role'}</>
                                        )}
                                    </button>
                                    <Link to="/roles" className="btn btn-secondary">
                                        Cancel
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
