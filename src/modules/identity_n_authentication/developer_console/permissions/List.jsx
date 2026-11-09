import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import apiClient from "../../../../api/apiClient";
import DashboardLayout from "../../../../layout/DashboardLayout";
import { DataTable } from "simple-datatables";
import "simple-datatables/dist/style.css";
import { formatErrorDisplay } from "../../../../utils/errorHandler";

export default function List() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const openEdit = (itemSelected) => {
        navigate(`/update_permission/${itemSelected.id}`, {
        state: { permissionData: itemSelected },
        });
    };
    
    useEffect(() => {
        const fetchPermissions = async () => {
            setLoading(true);

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL || ""}/GraphQLAPIGateway/graphql`,
                    {
                        query: `
                        query {
                            UserAuth_api_permissions
                        }`,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                    }
                );

                if (response.data.errors) {
                    setError(
                        response.data.errors
                            .map((e) => e.message || String(e))
                            .join("; ")
                    );
                } else {
                    ///console.log(response.data.data.UserAuth_api_permissions);
                    const permissions = response.data.data.UserAuth_api_permissions;
                    // Sort by display_order (nulls at the end)
                    const sortedPermissions = permissions.sort((a, b) => {
                        if (a.display_order === null) return 1;
                        if (b.display_order === null) return -1;
                        return a.display_order - b.display_order;
                    });
                    setData(sortedPermissions);
                }
            } catch (err) {
                setError(formatErrorDisplay(err));
            } finally {
                setLoading(false);
            }
        };
        fetchPermissions();
    }, []);

    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card table-card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5>Permissions</h5>
                                <Link to={'/new_permission'} className="btn btn-primary"><i className="ti ti-plus"></i> New Permission</Link>
                            </div>
                        </div>
                        <div className="card-body p-3">
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="table-responsive">
                                {loading ? (
                                    <p><span className="spinner-grow spinner-grow-sm" role="status"></span> Please Wait...</p>
                                ) : (
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Link</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.display_order}</td>
                                                    <td>{item.name}</td>
                                                    <td>{item.description}</td>
                                                    <td>{item.resource.name} : {item.action.name}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-warning"
                                                            onClick={()=>openEdit(item)}
                                                        >
                                                            <i className="ti ti-edit"></i> Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
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