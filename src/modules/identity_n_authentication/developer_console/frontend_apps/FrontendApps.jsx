import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import apiClient from "../../../../api/apiClient";

const emptyApp = {
    app_code: "",
    origin: "",
    reset_password_path: "/reset-password",
    is_default: false,
    status: "active",
};

function Alert({ type, message, onClose }) {
    if (!message) return null;
    return (
        <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
            <i className={`ti ${type === "danger" ? "ti-alert-circle" : "ti-circle-check"} me-2`}></i>
            {message}
            <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
    );
}

export default function FrontendApps() {
    const navigate = useNavigate();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyApp);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/frontend-apps");
            setApps(res.data);
        } catch {
            setError("Failed to load frontend apps.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function openAdd() { setEditing(null); setForm(emptyApp); setShowModal(true); }
    function openEdit(a) { setEditing(a); setForm({ ...a }); setShowModal(true); }
    function closeModal() { setShowModal(false); setEditing(null); }

    async function save() {
        setSaving(true);
        setError(""); setSuccess("");
        try {
            if (editing) {
                await apiClient.put(`/IAmAPI/api/frontend-apps/${editing.id}`, form);
                setSuccess("Frontend app updated.");
            } else {
                await apiClient.post("/IAmAPI/api/frontend-apps", form);
                setSuccess("Frontend app created.");
            }
            closeModal();
            load();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to save frontend app.");
        } finally {
            setSaving(false);
        }
    }

    async function remove(a) {
        if (!window.confirm(`Delete "${a.app_code}" (${a.origin})? Links pointing at this app will stop generating until another row is configured.`)) return;
        setDeleting(a.id);
        try {
            await apiClient.delete(`/IAmAPI/api/frontend-apps/${a.id}`);
            setSuccess("Frontend app deleted.");
            load();
        } catch {
            setError("Failed to delete frontend app.");
        } finally {
            setDeleting(null);
        }
    }

    return (
        <DashboardLayout>
            <div className="px-3">
                <div className="row">
                    <div className="col-12">
                        <div className="page-header">
                            <div className="page-block">
                                <div className="row align-items-center">
                                    <div className="col-md-12">
                                        <nav aria-label="breadcrumb">
                                            <ol className="breadcrumb mb-1">
                                                <li className="breadcrumb-item">
                                                    <span className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate("/developer-settings")}>
                                                        Developer Console
                                                    </span>
                                                </li>
                                                <li className="breadcrumb-item active">Frontend App URLs</li>
                                            </ol>
                                        </nav>
                                        <h2 className="mb-0">
                                            <i className="ti ti-world me-2"></i>
                                            Frontend App URLs
                                        </h2>
                                        <p className="text-muted mt-1 mb-0">
                                            System-wide, not per-organization: the domains that server-generated
                                            links (e.g. password reset and welcome emails) point to. The correct
                                            row is picked automatically by the origin the request came from,
                                            falling back to the row marked Default.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Alert type="danger" message={error} onClose={() => setError("")} />
                <Alert type="success" message={success} onClose={() => setSuccess("")} />

                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <p className="text-muted mb-0">Manage the frontend domains available to server-generated links.</p>
                                    <button className="btn btn-primary btn-sm" onClick={openAdd}>
                                        <i className="ti ti-plus me-1"></i> Add Frontend App
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    </div>
                                ) : apps.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="ti ti-world fs-1 d-block mb-2"></i>
                                        No frontend apps configured. Add one to get started.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>App Code</th>
                                                    <th>Origin</th>
                                                    <th>Reset Password Path</th>
                                                    <th>Default</th>
                                                    <th>Status</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {apps.map((a) => (
                                                    <tr key={a.id}>
                                                        <td><code>{a.app_code}</code></td>
                                                        <td className="fw-medium">{a.origin}</td>
                                                        <td className="text-muted small">{a.reset_password_path}</td>
                                                        <td>
                                                            {a.is_default ? (
                                                                <span className="badge bg-light-primary text-primary">Default</span>
                                                            ) : (
                                                                <span className="text-muted small">—</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge bg-light-${a.status === "active" ? "success" : "secondary"} text-${a.status === "active" ? "success" : "secondary"}`}>
                                                                {a.status}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(a)}>
                                                                <i className="ti ti-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => remove(a)}
                                                                disabled={deleting === a.id}
                                                            >
                                                                {deleting === a.id
                                                                    ? <span className="spinner-border spinner-border-sm" />
                                                                    : <i className="ti ti-trash"></i>}
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

                {showModal && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="ti ti-world me-2"></i>
                                        {editing ? "Edit Frontend App" : "New Frontend App"}
                                    </h5>
                                    <button className="btn-close" onClick={closeModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label">App Code <span className="text-danger">*</span></label>
                                            <input className="form-control" value={form.app_code} onChange={e => setForm({ ...form, app_code: e.target.value })} placeholder="e.g. web-app" />
                                            <div className="form-text">A short internal label for this frontend.</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Origin <span className="text-danger">*</span></label>
                                            <input className="form-control" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} placeholder="https://app.example.com" />
                                            <div className="form-text">Scheme + host only, no trailing slash. Matched against the caller's Origin header.</div>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Reset Password Path</label>
                                            <input className="form-control" value={form.reset_password_path} onChange={e => setForm({ ...form, reset_password_path: e.target.value })} placeholder="/reset-password" />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label d-block">Status</label>
                                            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="col-6 d-flex align-items-end">
                                            <div className="form-check form-switch mb-2">
                                                <input className="form-check-input" type="checkbox" id="isDefault" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />
                                                <label className="form-check-label" htmlFor="isDefault">Default fallback</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                    <button className="btn btn-primary" onClick={save} disabled={saving || !form.app_code || !form.origin}>
                                        {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                                        {editing ? "Update" : "Create"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
