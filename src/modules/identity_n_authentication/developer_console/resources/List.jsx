import { useEffect, useState } from "react";
import apiClient from "../../../../api/apiClient";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";

export default function List() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(0);
    const [modulesOpen, setModulesOpen] = useState(false);
    const [modulesLoading, setModulesLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    async function loadModules() {
        setModulesLoading(true);
        try {
            const res = await apiClient.get("/IAmAPI/api/modules", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setModules(res.data);
        } catch (err) {
            ///console.error(err);
            setError("Failed to load modules");
        } finally {
            setModulesLoading(false);
        }
    }

    async function loadResources(moduleId = 0) {
        setLoading(true);
        try {
            const url =
                moduleId && moduleId > 0
                    ? `/IAmAPI/api/resources?module_id=${moduleId}`
                    : `/IAmAPI/api/resources`;

            const res = await apiClient.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setData(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load resources");
        } finally {
            setLoading(false);
        }
    }

    // Load modules
    useEffect(() => {
        loadResources();
        loadModules();
    }, []);

    return (
        <DashboardLayout>
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="flex-grow-1">{selectedModule === 0 ? "Resources" : (`${modules.find(m => m.id === selectedModule)?.name} - Resources` || "Resources")}</h5>
                        <div className="d-flex gap-2">
                            {modulesLoading ? (
                                <button type="button" className="btn btn-light-primary" disabled={modulesLoading}>
                                    <span className="spinner-grow spinner-grow-sm" role="status"></span> Modules...
                                </button>
                            ):(
                                <div className="btn-group mr-2 mb-0" style={{ position: "relative" }}>
                                    <button
                                        type="button"
                                        className="btn btn-light-primary"
                                        onClick={() => setModulesOpen((s) => !s)}
                                        aria-expanded={modulesOpen}
                                        aria-haspopup="true"
                                    >
                                        Modules
                                        <span className="ms-2"><i className="ti ti-chevron-down"></i></span>
                                    </button>

                                    {modulesOpen && (
                                        <ul
                                        className="dropdown-menu dropdown-menu-end show"
                                        style={{
                                            display: "block",
                                            position: "absolute",
                                            right: 0,
                                            top: "100%",
                                            zIndex: 1050,
                                            minWidth: 180
                                        }}
                                        role="menu"
                                        >
                                        <li>
                                            <button
                                            type="button"
                                            className="dropdown-item"
                                            onClick={() => {
                                                setSelectedModule(0);
                                                setModulesOpen(false);
                                                loadResources(0);
                                            }}
                                            >
                                            All Modules
                                            </button>
                                        </li>

                                        {modules.map((mod) => (
                                            <li key={mod.id}>
                                            <button
                                                type="button"
                                                className="dropdown-item"
                                                onClick={() => {
                                                setSelectedModule(mod.id);
                                                setModulesOpen(false);
                                                loadResources(mod.id);
                                                }}
                                            >
                                                {mod.name}
                                            </button>
                                            </li>
                                        ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                            <Link to={"/add_resource"} className="btn btn-primary">
                                <i className="ti ti-plus"></i> ADD
                            </Link>
                        </div>
                    </div>
                    <div className="card-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {loading ? (
                        <p><span className="spinner-grow spinner-grow-sm" role="status"></span> Please Wait...</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>                                        
                                        <th>Icon</th>
                                        <th>Module</th>
                                        <th>Resource</th>
                                        <th>Description</th>
                                        <th>Route</th>
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
                                            <td>{mod.module_name}</td>
                                            <td>{mod.name}</td>
                                            <td>{mod.description}</td>
                                            <td>{mod.route || '-'}</td>
                                            <td>{mod.display_order}</td>
                                            <td>
                                                <button
                                                className="btn btn-sm btn-warning"
                                                onClick={() => navigate(`/edit_resource/${mod.id}`, { state: { resourceData: mod } })}
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
        </DashboardLayout>
    );
}