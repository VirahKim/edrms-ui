import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";

export default function DeveloperSettings() {
    return (
        <DashboardLayout>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Developer Console</h5>
                        </div>
                        <div className="card-body">
                            <p className="text-muted mb-4">
                                Manage system modules, resources, actions, and permissions.
                            </p>

                            <div className="row g-3">
                                {/* Modules Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-apps" style={{ fontSize: "3rem", color: "#4680FF" }}></i>
                                            </div>
                                            <h5 className="card-title">Modules</h5>
                                            <p className="card-text text-muted">
                                                Manage system modules and their configurations
                                            </p>
                                            <Link to="/modules" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Modules
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Resources Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-file-text" style={{ fontSize: "3rem", color: "#04a9f5" }}></i>
                                            </div>
                                            <h5 className="card-title">Resources</h5>
                                            <p className="card-text text-muted">
                                                Define and manage system resources
                                            </p>
                                            <Link to="/resources" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Resources
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-bolt" style={{ fontSize: "3rem", color: "#ffa21d" }}></i>
                                            </div>
                                            <h5 className="card-title">Actions</h5>
                                            <p className="card-text text-muted">
                                                Configure available actions in the system
                                            </p>
                                            <Link to="/actions" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Actions
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-lock" style={{ fontSize: "3rem", color: "#1de9b6" }}></i>
                                            </div>
                                            <h5 className="card-title">Permissions</h5>
                                            <p className="card-text text-muted">
                                                Manage user permissions and access control
                                            </p>
                                            <Link to="/permissions" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Permissions
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Organizations Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-building" style={{ fontSize: "3rem", color: "#a389d4" }}></i>
                                            </div>
                                            <h5 className="card-title">Organizations</h5>
                                            <p className="card-text text-muted">
                                                Manage organizations and their settings
                                            </p>
                                            <Link to="/developer-console/organizations" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Organizations
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Statutory Rates Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-receipt-tax" style={{ fontSize: "3rem", color: "#f4c430" }}></i>
                                            </div>
                                            <h5 className="card-title">Statutory Rates</h5>
                                            <p className="card-text text-muted">
                                                Configure payroll statutory rates and limits
                                            </p>
                                            <Link to="/payroll/reference/statutory-rates" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Statutory Rates
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Frontend App URLs Card */}
                                <div className="col-md-6 col-lg-3">
                                    <div className="card border shadow-sm h-100">
                                        <div className="card-body text-center">
                                            <div className="mb-3">
                                                <i className="ti ti-world" style={{ fontSize: "3rem", color: "#4680FF" }}></i>
                                            </div>
                                            <h5 className="card-title">Frontend App URLs</h5>
                                            <p className="card-text text-muted">
                                                System-wide domains that password reset and welcome emails link to
                                            </p>
                                            <Link to="/developer-console/frontend-apps" className="btn btn-primary w-100">
                                                <i className="ti ti-arrow-right"></i> Go to Frontend App URLs
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
