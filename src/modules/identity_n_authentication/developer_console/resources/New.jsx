import { useEffect, useState, useRef } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { formatErrorDisplay } from "../../../../utils/errorHandler";

export default function New() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const resourceData = location.state?.resourceData;
    
    const [data, setData] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        module_id: 0,
        name: "",
        description: "",
        icon: "",
        route: "",
        display_order: 0
    });
    const [savedModule, setSavedModule] = useState([]);
    const selectedModule = modules.find(m => m.id === Number(form.module_id)) || null;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // useEffect(() => {
    //     if (selectedModule) {
    //         console.log("Selected module changed:", selectedModule);
    //     }
    // }, [selectedModule]);

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
    
    // Load modules and populate form if editing
    useEffect(() => {
        loadModules();
        
        if (isEditMode && resourceData) {
            setForm({
                module_id: resourceData.module_id || 0,
                name: resourceData.name || "",
                description: resourceData.description || "",
                icon: resourceData.icon || "",
                route: resourceData.route || "",
                display_order: resourceData.display_order || 0
            });
        }
    }, [isEditMode, resourceData]);

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
            const payload = { ...form };

            let res;
            if (isEditMode) {
                // Update existing resource
                res = await apiClient.put(`/IAmAPI/api/resources/${id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                setError("");
                setSuccess("Resource updated successfully.");
                
                // Navigate back to list after a short delay
                setTimeout(() => {
                    navigate('/resources');
                }, 1500);
            } else {
                // Create new resource
                res = await apiClient.post("/IAmAPI/api/resources", payload, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                setError("");
                setSuccess("Resource created successfully.");

                setSavedModule(selectedModule);
                setData((prev) => (Array.isArray(prev) ? [...prev, res.data] : [res.data]));
                setForm({ module_id: 0, name: "", description: "", icon: "", route: "", display_order: 0 });
            }
            setSaving(false);
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
                                <h5>{isEditMode ? 'Edit Resource' : 'New Resource'}</h5>
                                <Link to={'/resources'} className="btn btn-primary"><i className="ti ti-list"></i> List</Link>
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
                                                                <Link to={'/resources'} className="btn btn-dark"><i className="ti ti-list"></i> List</Link>
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
                                                                <select name="module_id" className="form-control" id="floatingInputModule" value={form.module_id} onChange={handleChange} required>
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
                                        <div className="col-md-5 mb-3">
                                            <div className="form-floating mb-0">
                                                <input type="text" name="name" className="form-control" id="floatingInput" value={form.name} onChange={handleChange} required />
                                                <label htmlFor="floatingInput">Resource Name</label>
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
                                                <label htmlFor="floatingTextarea2">Resource Description</label>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving?
                                            <>
                                                <span className="spinner-grow spinner-grow-sm" role="status"></span> {isEditMode ? 'Updating...' : 'Saving...'}
                                            </>
                                        :
                                        <>{isEditMode ? 'Update Resource' : 'Save Resource'}</> 
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