import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";

export default function Edit() {
    const { id } = useParams();
    const location = useLocation();

    const permissionFromState = location.state?.permissionData;

    const [modules, setModules] = useState([]);
    const [modulesLoading, setModulesLoading] = useState(false);
    const [resources, setResources] = useState([]);
    const [actions, setActions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [actionsLoading, setActionsLoading] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    ///const [permissionData, setPermissionData] = useState(null);

    const [selectedModuleId, setSelectedModuleId] = useState(0);

    const [form, setForm] = useState({
        resource_id: 0,
        action_id: 0,
        name: "",
        description: "",
        icon: "",
        route: "",
        display_order: 0
    });

    // Set form + module from permission data
    const initializeForm = (data) => {
        ///setPermissionData(data);

        setForm({
            resource_id: data.resource_id,
            action_id: data.action_id,
            name: data.name,
            description: data.description || "",
            icon: data.icon || "",
            route: data.route || "",
            display_order: data.display_order || 0
        });

        setSelectedModuleId(data.resource?.module_id || 0);
    };

    // ---------------------------------------
    // LOAD SUPPORTING DATA
    // ---------------------------------------
    const loadModules = async () => {
        setModulesLoading(true);

        try {
            const res = await apiClient.get("/IAmAPI/api/modules", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setModules(res.data);
        } catch {
            setError("Failed to load modules");
        } finally {
            setModulesLoading(false);
        }
    };

    const loadActions = async () => {
        setActionsLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/actions", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setActions(res.data);
        } finally {
            setActionsLoading(false);
        }
    };

    const loadResources = async (moduleId) => {
        setResourcesLoading(true);
        try {
            const url =
                moduleId && moduleId > 0
                    ? `/IAmAPI/api/resources?module_id=${moduleId}`
                    : `/IAmAPI/api/resources`;

            const res = await apiClient.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setResources(res.data);
        } finally {
            setResourcesLoading(false);
        }
    };

    // Load permission data + modules + actions
    useEffect(() => {
        const passed = location.state?.permissionData;
        console.log("Permission data from state:", passed);

        loadModules();
        loadActions();

        if (passed) {
            initializeForm(passed);
        }
    }, []);

    // Load resources when module changes
    useEffect(() => {
        if (selectedModuleId > 0) loadResources(selectedModuleId);
    }, [selectedModuleId]);

    // ---------------------------------------
    // SUBMIT HANDLER
    // ---------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Parse display_order as integer
        const parsedValue = name === 'display_order' ? parseInt(value, 10) || 0 : value;
        setForm((prev) => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await apiClient.put(`/IAmAPI/api/permissions/${id}`, form, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            setSuccess("Permission updated successfully");
        } catch (err) {
            setError("Failed to update permission");
        } finally {
            setSaving(false);
        }
    };

    // ---------------------------------------
    // RENDER
    // ---------------------------------------
    if (loading && !permissionFromState) {
        return <DashboardLayout><p>Loading permission...</p></DashboardLayout>;
    }

    if (error && !success) {
        return <DashboardLayout><div className="alert alert-danger">{error}</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">

                    <div className="card table-card">
                        <div className="card-header d-flex justify-content-between">
                            <h5>Edit Permission</h5>
                            <Link to="/permissions" className="btn btn-primary"><i className="ti ti-list"></i> List</Link>
                        </div>

                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            {/* --- FORM START --- */}
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-12">
                                        <div className="card p-3">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <p className="m-0">Resource Module</p>
                                                    <small>Resources must belong to a module</small>
                                                </div>
                                                <div className="col-md-6">
                                                    {modulesLoading ? (
                                                        <p>Loading modules...</p>
                                                    ) : (
                                                        <div className="form-floating">
                                                            <select
                                                                className="form-control"
                                                                value={selectedModuleId}
                                                                onChange={(e) => {
                                                                    const moduleId = Number(e.target.value);
                                                                    setSelectedModuleId(moduleId);
                                                                    setForm((prev) => ({ ...prev, resource_id: 0 }));
                                                                }}
                                                                required
                                                            >
                                                                <option value={0}>-- Select Module --</option>
                                                                {modules.map((mod) => (
                                                                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                                                                ))}
                                                            </select>
                                                            <label>Select Module</label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {resourcesLoading ? 
                                        <div className="col-12">
                                            <p><span className="spinner-grow spinner-grow-sm" role="status"></span> Fetching Permissions...</p>
                                        </div>
                                    :
                                    <>
                                        {resources.length > 0 ?
                                        <>
                                            <div className="col-12">
                                                <div className="card p-3">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <p className="m-0">Permission Resource</p>
                                                            <small>Permissions must have a resource</small>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="form-floating">
                                                                <select
                                                                    className="form-control"
                                                                    name="resource_id"
                                                                    value={form.resource_id}
                                                                    onChange={handleChange}
                                                                    required
                                                                >
                                                                    <option value={0}>-- Select Resource --</option>
                                                                    {resources.map((r) => (
                                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                                    ))}
                                                                </select>
                                                                <label>Select Resource</label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                        :
                                        <div className="col-12"><p className="text-warning">No Resources found for selected module</p></div>}
                                    </>}
                                    <div className="col-12">
                                        <div className="card p-3">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <p className="m-0">Permission Actions</p>
                                                    <small>Permissions must have a action</small>
                                                </div>
                                                <div className="col-md-6">
                                                    {actionsLoading ? (
                                                        <p>Loading actions...</p>
                                                    ) : (
                                                        <div className="form-floating">
                                                            <select
                                                                className="form-control"
                                                                name="action_id"
                                                                value={form.action_id}
                                                                onChange={handleChange}
                                                                required
                                                            >
                                                                <option value={0}>-- Select Action --</option>
                                                                {actions.map((a) => (
                                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                                ))}
                                                            </select>
                                                            <label>Select Action</label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3 mb-3">
                                        <div className="form-floating">
                                            <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
                                            <label>Name</label>
                                        </div>
                                    </div>

                                    <div className="col-md-3 mb-3">
                                        <div className="form-floating">
                                            <input type="text" className="form-control" name="icon" value={form.icon} onChange={handleChange} />
                                            <label>Icon</label>
                                        </div>
                                    </div>

                                    <div className="col-md-3 mb-3">
                                        <div className="form-floating">
                                            <input type="text" className="form-control" name="route" value={form.route} onChange={handleChange} />
                                            <label>Route</label>
                                        </div>
                                    </div>

                                    <div className="col-md-3 mb-3">
                                        <div className="form-floating">
                                            <input type="number" className="form-control" name="display_order" value={form.display_order} onChange={handleChange} />
                                            <label>Order</label>
                                        </div>
                                    </div>
                                </div>
                                

                                {/* OTHER FIELDS */}
                                <div className="col-12 mb-3">
                                    <div className="form-floating">
                                        <textarea className="form-control" style={{ height: "40px" }}
                                            name="description" value={form.description} onChange={handleChange}>
                                        </textarea>
                                        <label>Description</label>
                                    </div>
                                </div>

                                <div className="col-12 d-flex justify-content-end mb-3">
                                    <button className="btn btn-primary" disabled={saving}>
                                        {saving ? "Updating..." : "Update Permission"}
                                    </button>
                                </div>
                            </form>
                            {/* --- FORM END --- */}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
