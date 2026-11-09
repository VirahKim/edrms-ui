import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { formatErrorDisplay } from "../../../../utils/errorHandler";

export default function New() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [actions, setActions] = useState([]);
    const [actionsLoading, setActionsLoading] = useState(false);
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
    const [savedModule, setSavedModule] = useState([]);
    const [selectedModule, setSelectedModule] = useState([]);
    const [savedResource, setSavedResource] = useState([]);
    const selectedResource = resources.find(r => r.id === Number(form.resource_id)) || null;
    const [savedAction, setSavedAction] = useState([]);
    const selectedAction = actions.find(a => a.id === Number(form.action_id)) || null;
    // const selectedModule = modules.find(m => m.id === Number(selectedModuleId)) || null;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadModules() {
        setLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/modules", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setModules(res.data);
        } catch (err) {
            ///console.error(err);
            setError("Failed to load modules");
        } finally {
            setLoading(false);
        }
    }

    async function loadResources(moduleId = 0) {
        setResourcesLoading(true);

        try {
            const url =
                moduleId && moduleId > 0
                    ? `/IAmAPI/api/resources?module_id=${moduleId}`
                    : `/IAmAPI/api/resources`;

            const res = await apiClient.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setResources(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load resources");
        } finally {
            setResourcesLoading(false);
        }
    }

    async function loadActions() {
        setActionsLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/actions", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setActions(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load modules");
        } finally {
            setActionsLoading(false);
        }
    }
    
    // Load modules
    useEffect(() => {
        loadModules();
        loadActions();
    }, []);

    
    useEffect(() => {
        if(selectedModuleId && selectedModuleId > 0) {
            loadResources(selectedModuleId);
            const mod = modules.find(m => m.id === Number(selectedModuleId)) || null;
            setSelectedModule(mod);
        }
    }, [selectedModuleId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Parse display_order as integer
        const parsedValue = name === 'display_order' ? parseInt(value, 10) || 0 : value;
        setForm((prev) => ({ ...prev, [name]: parsedValue }));
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await apiClient.post("/IAmAPI/api/permissions", form, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setError("");
            setSuccess("Permission created successfully.");

            setSavedModule(selectedModule);
            setSavedResource(selectedResource);
            setSavedAction(selectedAction);

            setData((prev) => (Array.isArray(prev) ? [...prev, res.data] : [res.data]));
            setForm({ resource_id: 0, action_id: 0, name: "", description: "", icon: "", route: "", display_order: 0 });
            setSaving(false);
            
            // Redirect to permissions list after 1.5 seconds
            setTimeout(() => {
                navigate('/permissions');
            }, 1500);
        } catch (err) {
            setSaving(false);
            setSuccess("");
            setError(formatErrorDisplay(err));
        }
    };

    const handleClearData = () => {
        setData([]);
        setSuccess("");
        setError("");
    };

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card table-card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5>New Permission</h5>
                                <Link to={'/permissions'} className="btn btn-primary"><i className="ti ti-list"></i> List</Link>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger">{error}</div> }
                            {success && <div className="alert alert-success">{success}</div> }

                            {data.length > 0 ?
                                <>
                                    {data.length > 0 && data.map((mod) => (
                                        <div className="row justify-content-center" key={mod.id}>
                                            <div className="col-md-8">
                                                <div className="card">
                                                    <div className="car-body">
                                                        <ul className="list-group">
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Resource Module</span>
                                                                <b>{savedModule.name}</b>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Resource Name</span>
                                                                <b>{savedResource.name}</b>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Action Name</span>
                                                                <b>{savedAction.name}</b>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Permission Name</span>
                                                                <b>{mod.name}</b>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Icon</span>
                                                                <i className={`${mod.icon}`}></i>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Route</span>
                                                                <b>{mod.route}</b>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Order</span>
                                                                <b>{mod.display_order}</b>
                                                            </li>
                                                            <li className="list-group-item">
                                                                <small>Description</small>
                                                                <p className="m-0 fw-bold">{mod.description}</p>
                                                            </li>
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <Link to={'/permissions'} className="btn btn-dark"><i className="ti ti-list"></i> List</Link>
                                                                <button type="button" onClick={()=> handleClearData()} className="btn btn-primary"><i className="ti ti-plus"></i> Add New</button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            :
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
                                                        {loading ? (
                                                            <p>Loading modules...</p>
                                                        ) : (
                                                            <div className="form-floating mb-0">
                                                                <select
                                                                    name="module_id"
                                                                    className="form-control"
                                                                    id="floatingInputModule"
                                                                    onChange={(e) => {
                                                                        const id = Number(e.target.value || 0);
                                                                        setSelectedModuleId(id);
                                                                    }}
                                                                    required
                                                                >
                                                                    <option value={0}>-- Select Module --</option>
                                                                    {modules.map((mod) => (
                                                                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                                                                    ))}
                                                                </select>
                                                                <label htmlFor="floatingInputModule">Select Module</label>
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
                                                                <div className="form-floating mb-0">
                                                                    <select name="resource_id" className="form-control" id="floatingInputResource" value={form.resource_id} onChange={handleChange} required>
                                                                        <option value={0}>-- Select resource --</option>
                                                                        {resources.map((res) => (
                                                                            <option key={res.id} value={res.id}>{res.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <label htmlFor="floatingInputResource">Select Resource</label>
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
                                                            <div className="form-floating mb-0">
                                                                <select name="action_id" className="form-control" id="floatingInputAction" value={form.action_id} onChange={handleChange} required>
                                                                    <option value={0}>-- Select Action --</option>
                                                                    {actions.map((act) => (
                                                                        <option key={act.id} value={act.id}>{act.name}</option>
                                                                    ))}
                                                                </select>
                                                                <label htmlFor="floatingInputAction">Select Action</label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5 mb-3">
                                            <div className="form-floating mb-0">
                                                <input type="text" name="name" className="form-control" id="floatingInput" value={form.name} onChange={handleChange} required />
                                                <label htmlFor="floatingInput">Permission Name</label>
                                            </div>
                                        </div>
                                        <div className="col-md-3 mb-3">
                                            <div className="form-floating mb-0">
                                                <input type="text" name="icon" className="form-control" id="floatingInputIcon" value={form.icon} onChange={handleChange} required />
                                                <label htmlFor="floatingInputIcon">Icon</label>
                                            </div>
                                        </div>
                                        <div className="col-md-2 mb-3">
                                            <div className="form-floating mb-0">
                                                <input type="text" name="route" className="form-control" id="floatingInputRoute" value={form.route} onChange={handleChange} required />
                                                <label htmlFor="floatingInputRoute">Route</label>
                                            </div>
                                        </div>
                                        <div className="col-md-2 mb-3">
                                            <div className="form-floating mb-0">
                                                <input type="number" name="display_order" className="form-control" id="floatingInputOrder" value={form.display_order} onChange={handleChange} required />
                                                <label htmlFor="floatingInputOrder">Order</label>
                                            </div>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <div className="form-floating">
                                                <textarea className="form-control" id="floatingTextarea2" name="description" value={form.description} onChange={handleChange} style={{height: 100}}/>
                                                <label htmlFor="floatingTextarea2">Permission Description</label>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving?
                                            <>
                                                <span className="spinner-grow spinner-grow-sm" role="status"></span> Saving...
                                            </>
                                        :
                                            <>Save Permission</> 
                                        }
                                    </button>
                                </form>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}