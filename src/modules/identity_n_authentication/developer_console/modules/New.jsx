import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { formatErrorDisplay } from "../../../../utils/errorHandler";

export default function New() {
    const [data, setData] = useState([]);
    const [modules, setModules] = useState([]);
    const [form, setForm] = useState({
        name: "",
        description: "",
        icon: "",
        route: "",
        display_order: 0,
        parent_module_id: null
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Parse display_order as integer
        const parsedValue = name === 'display_order' ? parseInt(value, 10) || 0 : value;
        setForm((prev) => ({ ...prev, [name]: parsedValue }));
    };

    // Load modules for parent module dropdown
    useEffect(() => {
        const loadModules = async () => {
            try {
                const res = await apiClient.get("/IAmAPI/api/modules", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                // Filter only parent modules (those without parent_module_id)
                setModules(res.data.filter(mod => mod.parent_module_id === null));
            } catch (err) {
                console.error("Failed to load modules:", err);
            }
        };
        loadModules();
    }, []);

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                ...form,
                parent_module_id: form.parent_module_id === "" || form.parent_module_id == null
                    ? null
                    : form.parent_module_id,
            };

            const res = await apiClient.post("/IAmAPI/api/modules", payload, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setError("");
            setSuccess("Module created successfully.");

            console.log("Module created:", res);
            console.log("Module created:", res.data);

            setData((prev) => (Array.isArray(prev) ? [...prev, res.data] : [res.data]));
            setForm({ name: "", description: "", icon: "", route: "", display_order: 0, parent_module_id: null });
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
                                <h5>New Module</h5>
                                <Link to={'/modules'} className="btn btn-primary fs-10"><i className="ti ti-list"></i> List</Link>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger">{error}</div> }
                            {success && <div className="alert alert-success">{success}</div> }

                            {data.length > 0 ?
                                <>
                                    {data.length > 0 && data.map((mod) => (
                                        <div className="row justify-content-center" key={mod.id}>
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="car-body">
                                                        <ul className="list-group">
                                                            <li className="list-group-item d-flex justify-content-between align-items-center">
                                                                <span>Module Name</span>
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
                                                                <Link to={'/modules'} className="btn btn-dark"><i className="ti ti-list"></i> List</Link>
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
                                        <div className="col-md-5 mb-3">
                                            <div className="form-floating mb-0">
                                                <input type="text" name="name" className="form-control" id="floatingInput" value={form.name} onChange={handleChange} required />
                                                <label htmlFor="floatingInput">Module Name</label>
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
                                        <div className="col-md-12 mb-3">
                                            <div className="form-floating mb-0">
                                                <select 
                                                    name="parent_module_id" 
                                                    className="form-select" 
                                                    id="floatingSelectParent" 
                                                    value={form.parent_module_id || ""} 
                                                    onChange={(e) => setForm({...form, parent_module_id: e.target.value ? parseInt(e.target.value) : null})}
                                                >
                                                    <option value="">None (Parent Module)</option>
                                                    {modules.map(mod => (
                                                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                                                    ))}
                                                </select>
                                                <label htmlFor="floatingSelectParent">Parent Module</label>
                                            </div>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <div className="form-floating">
                                                <textarea className="form-control" id="floatingTextarea2" name="description" value={form.description} onChange={handleChange} style={{height: 100}}/>
                                                <label htmlFor="floatingTextarea2">Module Description</label>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving?
                                            <>
                                                <span className="spinner-grow spinner-grow-sm" role="status"></span> Saving...
                                            </>
                                        :
                                        <>Save Module</> 
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