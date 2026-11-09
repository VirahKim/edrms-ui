import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";
import apiClient from "../../../../api/apiClient";

const orgId = () => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.organisation_id || u?.organization_id || null;
};

const emptyOuType = {
    name: "", code: "", description: "",
    can_have_children: true, is_leaf_type: false, max_depth: null,
    ui_color: "", ui_icon: "", sort_order: 0,
    default_is_sales_point: false, default_is_production_unit: false,
    default_is_stock_location: false, default_is_hr_unit: false,
};

const emptyOu = {
    name: "", code: "", ou_type_id: "", parent_id: "",
    is_sales_point: false, is_production_unit: false,
    is_stock_location: false, is_hr_unit: false,
    address: "", contact_phone: "", contact_email: "",
    external_ref: "", sort_order: 0,
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

// ─── OU Types Tab ─────────────────────────────────────────────────────────────

function OuTypesTab() {
    const [ouTypes, setOuTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyOuType);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/OuTypes");
            setOuTypes(res.data);
        } catch {
            setError("Failed to load organization unit types.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function openAdd() { setEditing(null); setForm(emptyOuType); setShowModal(true); }
    function openEdit(t) { setEditing(t); setForm({ ...t }); setShowModal(true); }
    function closeModal() { setShowModal(false); setEditing(null); }

    function buildPayload() {
        return {
            ...form,
            sort_order: parseInt(form.sort_order) || 0,
            max_depth: form.max_depth !== "" && form.max_depth !== null ? parseInt(form.max_depth) : null,
        };
    }

    async function save() {
        setSaving(true);
        setError(""); setSuccess("");
        try {
            if (editing) {
                await apiClient.put(`/IAmAPI/api/OuTypes/${editing.id}`, buildPayload());
                setSuccess("OU type updated.");
            } else {
                await apiClient.post("/IAmAPI/api/OuTypes", buildPayload());
                setSuccess("OU type created.");
            }
            closeModal();
            load();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || "Failed to save OU type.");
        } finally {
            setSaving(false);
        }
    }

    async function remove(t) {
        if (!window.confirm(`Delete OU type "${t.name}"? This cannot be undone.`)) return;
        setDeleting(t.id);
        try {
            await apiClient.delete(`/IAmAPI/api/OuTypes/${t.id}`);
            setSuccess("OU type deleted.");
            load();
        } catch {
            setError("Failed to delete OU type.");
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div>
            <Alert type="danger" message={error} onClose={() => setError("")} />
            <Alert type="success" message={success} onClose={() => setSuccess("")} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">Define unit type templates used to classify organization units.</p>
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <i className="ti ti-plus me-1"></i> Add OU Type
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
            ) : ouTypes.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="ti ti-category fs-1 d-block mb-2"></i>
                    No OU types found. Add one to get started.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Children</th>
                                <th>Leaf</th>
                                <th>Icon / Color</th>
                                <th>Sort</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {ouTypes.map((t) => (
                                <tr key={t.id}>
                                    <td><code>{t.code}</code></td>
                                    <td className="fw-medium">{t.name}</td>
                                    <td className="text-muted small">{t.description || "—"}</td>
                                    <td>
                                        <span className={`badge bg-light-${t.can_have_children ? "success" : "secondary"} text-${t.can_have_children ? "success" : "secondary"}`}>
                                            {t.can_have_children ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge bg-light-${t.is_leaf_type ? "warning" : "secondary"} text-${t.is_leaf_type ? "warning" : "secondary"}`}>
                                            {t.is_leaf_type ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="text-muted small">
                                        {t.ui_icon && <i className={`${t.ui_icon} me-1`}></i>}
                                        {t.ui_color ? <span className="badge" style={{ background: t.ui_color }}>{t.ui_color}</span> : "—"}
                                    </td>
                                    <td className="text-muted small">{t.sort_order}</td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(t)}>
                                            <i className="ti ti-edit"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => remove(t)}
                                            disabled={deleting === t.id}
                                        >
                                            {deleting === t.id
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

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="ti ti-category me-2"></i>
                                    {editing ? "Edit OU Type" : "New OU Type"}
                                </h5>
                                <button className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Code <span className="text-danger">*</span></label>
                                        <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. BRANCH" />
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label">Name <span className="text-danger">*</span></label>
                                        <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Type name" />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">UI Icon</label>
                                        <input className="form-control" value={form.ui_icon} onChange={e => setForm({ ...form, ui_icon: e.target.value })} placeholder="e.g. ti ti-building" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">UI Color</label>
                                        <input className="form-control" type="color" value={form.ui_color || "#6c757d"} onChange={e => setForm({ ...form, ui_color: e.target.value })} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Sort Order</label>
                                        <input className="form-control" type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Max Depth</label>
                                        <input className="form-control" type="number" min="0" value={form.max_depth ?? ""} onChange={e => setForm({ ...form, max_depth: e.target.value === "" ? null : e.target.value })} placeholder="No limit" />
                                    </div>
                                </div>

                                <hr className="my-3" />
                                <p className="fw-medium mb-2 small text-uppercase text-muted">Hierarchy Rules</p>
                                <div className="row g-2">
                                    <div className="col-auto">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" id="ouCanChildren" checked={form.can_have_children} onChange={e => setForm({ ...form, can_have_children: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="ouCanChildren">Can Have Children</label>
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" id="ouIsLeaf" checked={form.is_leaf_type} onChange={e => setForm({ ...form, is_leaf_type: e.target.checked })} />
                                            <label className="form-check-label" htmlFor="ouIsLeaf">Is Leaf Type</label>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-3" />
                                <p className="fw-medium mb-2 small text-uppercase text-muted">Default Flags</p>
                                <div className="row g-2">
                                    {[
                                        { key: "default_is_sales_point", label: "Sales Point" },
                                        { key: "default_is_production_unit", label: "Production Unit" },
                                        { key: "default_is_stock_location", label: "Stock Location" },
                                        { key: "default_is_hr_unit", label: "HR Unit" },
                                    ].map(({ key, label }) => (
                                        <div className="col-auto" key={key}>
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type="checkbox" id={key} checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                                                <label className="form-check-label" htmlFor={key}>{label}</label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.code}>
                                    {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                                    {editing ? "Update" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Org Units Tab ────────────────────────────────────────────────────────────

function OrgUnitsTab() {
    const [orgUnits, setOrgUnits] = useState([]);
    const [ouTypes, setOuTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyOu);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    async function load() {
        setLoading(true);
        try {
            const [ouRes, typesRes] = await Promise.all([
                apiClient.get("/IAmAPI/api/OrganisationalUnits"),
                apiClient.get("/IAmAPI/api/OuTypes"),
            ]);
            setOrgUnits(ouRes.data);
            setOuTypes(typesRes.data);
        } catch {
            setError("Failed to load organization units.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function typeName(id) {
        return ouTypes.find(t => String(t.id) === String(id))?.name || "—";
    }
    function parentName(id) {
        return orgUnits.find(u => String(u.id) === String(id))?.name || "—";
    }

    function openAdd() { setEditing(null); setForm(emptyOu); setShowModal(true); }
    function openEdit(u) { setEditing(u); setForm({ ...u }); setShowModal(true); }
    function closeModal() { setShowModal(false); setEditing(null); }

    function buildPayload() {
        const oid = orgId();
        const base = {
            ...form,
            sort_order: parseInt(form.sort_order) || 0,
            ou_type_id: form.ou_type_id !== "" ? parseInt(form.ou_type_id) : null,
            parent_id: form.parent_id !== "" ? parseInt(form.parent_id) : null,
        };
        if (oid) base.organisation_id = oid;
        return base;
    }

    async function save() {
        setSaving(true);
        setError(""); setSuccess("");
        try {
            if (editing) {
                await apiClient.put(`/IAmAPI/api/OrganisationalUnits/${editing.id}`, buildPayload());
                setSuccess("Organization unit updated.");
            } else {
                await apiClient.post("/IAmAPI/api/OrganisationalUnits", buildPayload());
                setSuccess("Organization unit created.");
            }
            closeModal();
            load();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || "Failed to save organization unit.");
        } finally {
            setSaving(false);
        }
    }

    async function remove(u) {
        if (!window.confirm(`Delete organization unit "${u.name}"? This cannot be undone.`)) return;
        setDeleting(u.id);
        try {
            await apiClient.delete(`/IAmAPI/api/OrganisationalUnits/${u.id}`);
            setSuccess("Organization unit deleted.");
            load();
        } catch {
            setError("Failed to delete organization unit.");
        } finally {
            setDeleting(null);
        }
    }

    const FLAG_ICONS = {
        is_sales_point: { icon: "ti-shopping-cart", label: "Sales", color: "success" },
        is_production_unit: { icon: "ti-settings-2", label: "Production", color: "warning" },
        is_stock_location: { icon: "ti-box", label: "Stock", color: "info" },
        is_hr_unit: { icon: "ti-users", label: "HR", color: "primary" },
    };

    return (
        <div>
            <Alert type="danger" message={error} onClose={() => setError("")} />
            <Alert type="success" message={success} onClose={() => setSuccess("")} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">Manage the organization's structural units (branches, cost centres, etc.).</p>
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <i className="ti ti-plus me-1"></i> Add Org Unit
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
            ) : orgUnits.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <i className="ti ti-sitemap fs-1 d-block mb-2"></i>
                    No organization units found. Add one to get started.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Parent</th>
                                <th>Flags</th>
                                <th>Contact</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgUnits.map((u) => (
                                <tr key={u.id}>
                                    <td><code>{u.code}</code></td>
                                    <td className="fw-medium">{u.name}</td>
                                    <td className="text-muted small">{typeName(u.ou_type_id)}</td>
                                    <td className="text-muted small">{u.parent_id ? parentName(u.parent_id) : <span className="text-muted">Root</span>}</td>
                                    <td>
                                        <div className="d-flex gap-1 flex-wrap">
                                            {Object.entries(FLAG_ICONS).map(([key, { icon, label, color }]) =>
                                                u[key] ? (
                                                    <span key={key} className={`badge bg-light-${color} text-${color}`} title={label}>
                                                        <i className={`ti ${icon} me-1`}></i>{label}
                                                    </span>
                                                ) : null
                                            )}
                                            {!u.is_sales_point && !u.is_production_unit && !u.is_stock_location && !u.is_hr_unit && (
                                                <span className="text-muted small">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-muted small">
                                        {u.contact_email || u.contact_phone || "—"}
                                    </td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}>
                                            <i className="ti ti-edit"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => remove(u)}
                                            disabled={deleting === u.id}
                                        >
                                            {deleting === u.id
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

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="ti ti-sitemap me-2"></i>
                                    {editing ? "Edit Organization Unit" : "New Organization Unit"}
                                </h5>
                                <button className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Code <span className="text-danger">*</span></label>
                                        <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. NBO-001" />
                                    </div>
                                    <div className="col-md-8">
                                        <label className="form-label">Name <span className="text-danger">*</span></label>
                                        <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Unit name" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Unit Type</label>
                                        <select className="form-select" value={form.ou_type_id} onChange={e => setForm({ ...form, ou_type_id: e.target.value })}>
                                            <option value="">— Select Type —</option>
                                            {ouTypes.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Parent Unit</label>
                                        <select className="form-select" value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })}>
                                            <option value="">— Root (no parent) —</option>
                                            {orgUnits
                                                .filter(u => !editing || u.id !== editing.id)
                                                .map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Contact Email</label>
                                        <input className="form-control" type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="unit@example.com" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Contact Phone</label>
                                        <input className="form-control" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+254 700 000000" />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Address</label>
                                        <input className="form-control" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Physical address" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">External Reference</label>
                                        <input className="form-control" value={form.external_ref} onChange={e => setForm({ ...form, external_ref: e.target.value })} placeholder="Optional external ID" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Sort Order</label>
                                        <input className="form-control" type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
                                    </div>
                                </div>

                                <hr className="my-3" />
                                <p className="fw-medium mb-2 small text-uppercase text-muted">Unit Flags</p>
                                <div className="row g-2">
                                    {[
                                        { key: "is_sales_point", label: "Sales Point" },
                                        { key: "is_production_unit", label: "Production Unit" },
                                        { key: "is_stock_location", label: "Stock Location" },
                                        { key: "is_hr_unit", label: "HR Unit" },
                                    ].map(({ key, label }) => (
                                        <div className="col-auto" key={key}>
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type="checkbox" id={`ou_${key}`} checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                                                <label className="form-check-label" htmlFor={`ou_${key}`}>{label}</label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.code}>
                                    {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                                    {editing ? "Update" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
    { id: "ou-types", label: "OU Types", icon: "ti ti-layout-list" },
    { id: "org-units", label: "Org Units", icon: "ti ti-sitemap" },
];

export default function OrgStructure() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("ou-types");

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
                                                <span className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate("/org-settings")}>
                                                    Organization Settings
                                                </span>
                                            </li>
                                            <li className="breadcrumb-item active">Organization Structure</li>
                                        </ol>
                                    </nav>
                                    <h2 className="mb-0">
                                        <i className="ti ti-hierarchy-2 me-2"></i>
                                        Organization Structure
                                    </h2>
                                    <p className="text-muted mt-1 mb-0">
                                        Configure OU types and organization units.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body py-0">
                            <ul className="nav nav-tabs profile-tabs" role="tablist">
                                {TABS.map(tab => (
                                    <li className="nav-item" key={tab.id} role="presentation">
                                        <button
                                            className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                                            onClick={() => setActiveTab(tab.id)}
                                            type="button"
                                            role="tab"
                                        >
                                            <i className={`${tab.icon} me-2`}></i>
                                            {tab.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="card mt-0">
                        <div className="card-body">
                            {activeTab === "ou-types" && <OuTypesTab />}
                            {activeTab === "org-units" && <OrgUnitsTab />}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </DashboardLayout>
    );
}
