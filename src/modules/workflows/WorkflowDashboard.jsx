import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { getPendingApprovals, getWorkflowInstances } from "../../api/workflowsApi";

export default function WorkflowDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        activeWorkflows: 0,
        completedToday: 0,
        overdueApprovals: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Load pending approvals
            const approvals = await getPendingApprovals({ page: 1, page_size: 1 });
            
            // Load active workflows
            const activeWorkflows = await getWorkflowInstances({ 
                status: "IN_PROGRESS", 
                page: 1, 
                page_size: 1 
            });

            setStats({
                pendingApprovals: approvals.data?.total_count || 0,
                activeWorkflows: activeWorkflows.data?.total_count || 0,
                completedToday: 0, // Would need a separate endpoint
                overdueApprovals: 0 // Would calculate from due dates
            });
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            title: "Workflow Definitions",
            description: "Create and manage workflow templates",
            icon: "ti ti-template",
            color: "primary",
            route: "/workflows/definitions",
            count: null,
            actions: [
                { label: "View All", route: "/workflows/definitions" },
                { label: "Create New", route: "/workflows/definitions/create" }
            ]
        },
        {
            title: "Active Workflows",
            description: "Currently running workflow instances",
            icon: "ti ti-git-branch",
            color: "info",
            route: "/workflows/instances",
            count: stats.activeWorkflows,
            actions: [
                { label: "View All", route: "/workflows/instances" }
            ]
        },
        {
            title: "Reports & Analytics",
            description: "Workflow performance and metrics",
            icon: "ti ti-chart-line",
            color: "danger",
            route: "/workflows/reports",
            count: null,
            actions: [
                { label: "View Reports", route: "/workflows/reports" }
            ]
        }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="px-3">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 mb-0">Loading workflow dashboard...</p>
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
            {/* Page Header */}
            <div className="row">
                <div className="col-12">
                    <div className="page-header">
                        <div className="page-block">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="page-header-title">
                                        <h2 className="mb-0">
                                            <i className="ti ti-git-branch me-2"></i>
                                            Workflow Management
                                        </h2>
                                    </div>
                                    <p className="text-muted mt-2">
                                        Manage approval workflows, track pending approvals, and configure business process automation
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-3">
                <div className="col-xl-3 col-md-6 mb-2">
                    <div className="card bg-primary text-white mb-0">
                        <div className="card-body py-2 px-3">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-clock-check fs-4 me-2"></i>
                                <p className="mb-0 me-2 opacity-75 small">Pending Approvals</p>
                                <h5 className="mb-0 text-white ms-auto">{stats.pendingApprovals}</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-2">
                    <div className="card bg-info text-white mb-0">
                        <div className="card-body py-2 px-3">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-git-branch fs-4 me-2"></i>
                                <p className="mb-0 me-2 opacity-75 small">Active Workflows</p>
                                <h5 className="mb-0 text-white ms-auto">{stats.activeWorkflows}</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-2">
                    <div className="card bg-success text-white mb-0">
                        <div className="card-body py-2 px-3">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-check fs-4 me-2"></i>
                                <p className="mb-0 me-2 opacity-75 small">Completed Today</p>
                                <h5 className="mb-0 text-white ms-auto">{stats.completedToday}</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-2">
                    <div className="card bg-warning text-white mb-0">
                        <div className="card-body py-2 px-3">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-alert-triangle fs-4 me-2"></i>
                                <p className="mb-0 me-2 opacity-75 small">Overdue</p>
                                <h5 className="mb-0 text-white ms-auto">{stats.overdueApprovals}</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Card */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="alert alert-info d-flex align-items-center mb-0" role="alert">
                                <i className="ti ti-info-circle me-3 fs-4"></i>
                                <div>
                                    <strong>Quick Tip:</strong> You have {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? 's' : ''} waiting for your action.
                                    {stats.pendingApprovals > 0 && (
                                        <button 
                                            className="btn btn-sm btn-primary ms-3"
                                            onClick={() => navigate("/workflows/approvals/pending")}
                                        >
                                            Review Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="row">
                {menuItems.map((item, index) => (
                    <div className="col-xl-4 col-md-6 mb-4" key={index}>
                        <div className="card h-100 hover-shadow">
                            <div className="card-body">
                                <div className="d-flex align-items-start mb-3">
                                    <div 
                                        className={`avtar avtar-l bg-light-${item.color}`}
                                        style={{ minWidth: '60px' }}
                                    >
                                        <i className={`${item.icon} text-${item.color} fs-3`}></i>
                                    </div>
                                    <div className="ms-3 flex-grow-1">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <h5 className="mb-1">{item.title}</h5>
                                            {item.count !== null && (
                                                <span className={`badge bg-${item.badge || item.color}`}>
                                                    {item.count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted mb-0 small">{item.description}</p>
                                    </div>
                                </div>
                                
                                <div className="border-top pt-3">
                                    <div className="d-flex gap-2 flex-wrap">
                                        {item.actions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                className={`btn btn-${idx === 0 ? '' : 'outline-'}${item.color} btn-sm flex-fill`}
                                                onClick={() => navigate(action.route)}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Help Section */}
            <div className="row mt-4">
                <div className="col-md-6 mb-3">
                    <div className="card border-0" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-help-circle fs-1 text-primary me-3"></i>
                                <div>
                                    <h5 className="mb-1">Need Help?</h5>
                                    <p className="mb-2 text-muted small">
                                        Learn how to set up workflows and manage approvals
                                    </p>
                                    <button className="btn btn-primary btn-sm">
                                        <i className="ti ti-book me-1"></i>
                                        View Documentation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card border-0" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <i className="ti ti-video fs-1 text-success me-3"></i>
                                <div>
                                    <h5 className="mb-1">Video Tutorials</h5>
                                    <p className="mb-2 text-muted small">
                                        Watch step-by-step guides for workflow setup
                                    </p>
                                    <button className="btn btn-success btn-sm">
                                        <i className="ti ti-player-play me-1"></i>
                                        Watch Tutorials
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
