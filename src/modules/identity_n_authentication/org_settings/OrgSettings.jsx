import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import apiClient from "../../../api/apiClient";

export default function OrgSettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orgInfo, setOrgInfo] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadOrgData() {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                
                // You can fetch organization info here if needed
                // const res = await apiClient.get("/OrganizationAPI/api/organization", { headers });
                // setOrgInfo(res.data);
                
                setLoading(false);
            } catch (err) {
                console.error("Failed to load organization data", err);
                setError("Failed to load organization information");
                setLoading(false);
            }
        }
        loadOrgData();
    }, []);

    // Cards with a real destination page (configured: true) are listed first;
    // cards for pages that don't exist yet (configured: false) are listed
    // after and deliberately don't navigate anywhere when clicked — see the
    // render logic below.
    const settingsSections = [
        {
            title: "Organization Structure",
            description: "Configure OU types, organization units, and sales point mappings",
            icon: "ti ti-hierarchy-2",
            color: "primary",
            route: "/org-settings/structure",
            items: ["OU Types", "Org Units", "Sales Point Mapping"],
            configured: true
        },
        {
            title: "Organization Profile",
            description: "Manage organization details, branding, and contact information",
            icon: "ti ti-building",
            color: "primary",
            route: "/org-settings/profile",
            items: ["Company Information", "Contact Details", "Business Registration", "Address"],
            configured: true
        },
        {
            title: "Workflow Management",
            description: "Set up approval workflows and business process automation",
            icon: "ti ti-git-branch",
            color: "warning",
            route: "/org-settings/workflows",
            items: ["Approval Workflows", "Process Automation", "Notification Rules", "Escalation Policies"],
            configured: true
        },
        {
            title: "Notification Center",
            description: "Configure notification preferences and communication channels",
            icon: "ti ti-bell",
            color: "danger",
            route: "/communication/notifications/templates",
            items: ["Email Notifications", "SMS Settings", "In-App Alerts", "Notification Templates"],
            configured: true
        },
        {
            title: "Document Management",
            description: "Set up document numbering, templates, and archiving policies",
            icon: "ti ti-file-text",
            color: "warning",
            route: "/ed-mgt/admin",
            items: ["Document Numbering", "Templates", "Archiving Policies", "Document Types"],
            configured: true
        },
        {
            title: "System Preferences",
            description: "Configure system-wide settings and preferences",
            icon: "ti ti-settings",
            color: "info",
            route: "/org-settings/preferences",
            items: ["General Settings", "Date & Time Format", "Currency & Localization", "Email Templates"],
            configured: false
        },
        {
            title: "Security & Compliance",
            description: "Manage security policies and compliance requirements",
            icon: "ti ti-shield-lock",
            color: "danger",
            route: "/org-settings/security",
            items: ["Password Policies", "Session Management", "Audit Logs", "Data Retention"],
            configured: false
        },
        {
            title: "Integration Settings",
            description: "Configure third-party integrations and API access",
            icon: "ti ti-plug",
            color: "secondary",
            route: "/org-settings/integrations",
            items: ["API Keys", "Webhooks", "External Systems", "Data Sync"],
            configured: false
        },
        {
            title: "Fiscal Year & Periods",
            description: "Configure fiscal year, accounting periods, and financial calendars",
            icon: "ti ti-calendar-event",
            color: "success",
            route: "/org-settings/fiscal-year",
            items: ["Fiscal Year Setup", "Accounting Periods", "Financial Calendar", "Period Closing"],
            configured: false
        },
        {
            title: "Business Rules",
            description: "Define business rules, validation rules, and custom logic",
            icon: "ti ti-checkup-list",
            color: "info",
            route: "/org-settings/business-rules",
            items: ["Validation Rules", "Custom Logic", "Conditional Fields", "Business Constraints"],
            configured: false
        },
        {
            title: "Data Import/Export",
            description: "Manage data migration, import templates, and export settings",
            icon: "ti ti-file-import",
            color: "secondary",
            route: "/org-settings/data-management",
            items: ["Import Templates", "Export Formats", "Data Migration", "Bulk Operations"],
            configured: false
        }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-3">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading organization settings...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
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
                                    <div className="page-header-title">
                                        <h2 className="mb-0">
                                            <i className="ti ti-settings me-2"></i>
                                            Organization Settings
                                        </h2>
                                    </div>
                                    <p className="text-muted mt-2">
                                        Configure your organization structure, workflows, and system preferences
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <i className="ti ti-alert-circle me-2"></i>
                            {error}
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setError("")}
                            ></button>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="alert alert-info d-flex align-items-center" role="alert">
                                <i className="ti ti-info-circle me-3 fs-4"></i>
                                <div>
                                    <strong>Quick Tip:</strong> Select any category below to configure specific settings for your organization.
                                    Changes made here will affect the entire system.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {settingsSections.map((section, index) => (
                    <div className="col-xl-4 col-md-6 mb-4" key={index}>
                        <div
                            className={`card h-100 ${section.configured ? "hover-shadow" : ""}`}
                            style={{ cursor: section.configured ? "pointer" : "default", opacity: section.configured ? 1 : 0.65 }}
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-start mb-3">
                                    <div
                                        className={`avtar avtar-l bg-light-${section.color}`}
                                        style={{ minWidth: '60px' }}
                                    >
                                        <i className={`${section.icon} text-${section.color} fs-3`}></i>
                                    </div>
                                    <div className="ms-3 flex-grow-1">
                                        <div className="d-flex align-items-center gap-2">
                                            <h5 className="mb-1">{section.title}</h5>
                                            {!section.configured && (
                                                <span className="badge bg-light-secondary text-secondary mb-1" style={{ fontSize: "0.65rem" }}>
                                                    Not configured yet
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted mb-0 small">{section.description}</p>
                                    </div>
                                </div>

                                <div className="border-top pt-3">
                                    <ul className="list-unstyled mb-0">
                                        {section.items.map((item, idx) => (
                                            <li key={idx} className="mb-1">
                                                <i className="ti ti-point text-muted me-2"></i>
                                                <small className="text-muted">{item}</small>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-3">
                                    <button
                                        className={`btn btn-outline-${section.color} btn-sm w-100`}
                                        onClick={() => section.configured && navigate(section.route)}
                                        disabled={!section.configured}
                                    >
                                        {section.configured
                                            ? <>Configure <i className="ti ti-arrow-right ms-1"></i></>
                                            : "Coming soon"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row mt-4">
                <div className="col-md-6">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-help-circle fs-1 me-3"></i>
                                <div>
                                    <h5 className="text-white mb-1">Need Help?</h5>
                                    <p className="mb-2 opacity-75">
                                        Check out our documentation or contact support for assistance.
                                    </p>
                                    <button className="btn btn-light btn-sm">
                                        <i className="ti ti-book me-1"></i>
                                        View Documentation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-download fs-1 me-3"></i>
                                <div>
                                    <h5 className="text-white mb-1">Backup & Restore</h5>
                                    <p className="mb-2 opacity-75">
                                        Create a backup of your organization settings and data.
                                    </p>
                                    <button className="btn btn-light btn-sm">
                                        <i className="ti ti-database-export me-1"></i>
                                        Create Backup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-shadow {
                    transition: all 0.3s ease;
                }
                .hover-shadow:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                    transform: translateY(-2px);
                }
            `}</style>
            </div>
        </DashboardLayout>
    );
}
