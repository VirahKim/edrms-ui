import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../../layout/DashboardLayout";

const Welcome = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: 'ti-users',
      title: 'Users',
      description: 'View and manage system users, edit details, and control account status.',
      path: '/users',
      buttonLabel: 'Manage Users',
      tags: [
        { icon: 'ti-user-check', label: 'User Accounts' },
        { icon: 'ti-edit', label: 'Edit Users' },
        { icon: 'ti-lock', label: 'Deactivate' },
      ],
    },
    {
      icon: 'ti-shield-lock',
      title: 'Roles',
      description: 'Create and manage user roles and configure access permissions.',
      path: '/view_roles',
      buttonLabel: 'Manage Roles',
      tags: [
        { icon: 'ti-key', label: 'Permissions' },
        { icon: 'ti-plus', label: 'Create Roles' },
        { icon: 'ti-settings', label: 'Configure' },
      ],
    },
    {
      icon: 'ti-shield-check',
      title: 'Security Audit',
      description: 'Monitor login attempts, failed authentication events, and threats.',
      path: '/security/login-attempts',
      buttonLabel: 'View Login Attempts',
      tags: [
        { icon: 'ti-activity', label: 'Monitor' },
        { icon: 'ti-alert-triangle', label: 'Threats' },
        { icon: 'ti-history', label: 'Audit Log' },
      ],
    },
  ];

  const quickActions = [
    { icon: 'ti-users', label: 'View All Users', path: '/users' },
    { icon: 'ti-plus', label: 'Create New Role', path: '/create_role' },
    { icon: 'ti-shield-lock', label: 'View All Roles', path: '/view_roles' },
    { icon: 'ti-activity', label: 'Security Audit', path: '/security/login-attempts' },
  ];

  return (
    <DashboardLayout>
      <div className="container-fluid">
        <div className="mb-3">
          <h5 className="mb-1">User Management</h5>
          <p className="text-muted mb-0">Manage system users, roles, and permissions</p>
        </div>

        <div className="row g-3">
          {sections.map((section) => (
            <div className="col-md-6" key={section.path}>
              <div
                className="card h-100 hover-shadow"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(section.path)}
              >
                <div className="card-body p-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="avtar avtar-s bg-brand-subtle rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center">
                      <i className={`ti ${section.icon} text-brand fs-5`}></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="mb-1">{section.title}</h6>
                      <p className="text-muted small mb-2">{section.description}</p>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex gap-1 flex-wrap">
                          {section.tags.map((tag) => (
                            <small className="badge bg-brand-subtle text-brand fw-normal" key={tag.label}>
                              <i className={`ti ${tag.icon} me-1`}></i>{tag.label}
                            </small>
                          ))}
                        </div>
                        <button
                          className="btn btn-sm btn-primary text-nowrap"
                          onClick={(e) => { e.stopPropagation(); navigate(section.path); }}
                        >
                          {section.buttonLabel} <i className="ti ti-arrow-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card mt-3">
          <div className="card-body p-3">
            <h6 className="mb-2">
              <i className="ti ti-bolt me-1 text-brand"></i> Quick Actions
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigate(action.path)}
                >
                  <i className={`ti ${action.icon} me-1`}></i> {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="card bg-brand-subtle mt-3 mb-3">
          <div className="card-body p-3">
            <div className="d-flex align-items-start gap-2">
              <i className="ti ti-info-circle text-brand mt-1"></i>
              <div className="row gx-4">
                <div className="col-md-6">
                  <p className="text-muted small mb-2 mb-md-0">
                    <strong>Users:</strong> Manage system user accounts and monitor login activity.
                    New users are added through the Staff List page.
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="text-muted small mb-0">
                    <strong>Roles:</strong> Define user roles with specific permissions to control
                    access to different modules and features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Welcome;
