import { lazy } from "react";

/**
 * Role Centers — a small registry mapping a role's `landing_page_key`
 * (configured on the Roles admin screen) to the React component it should
 * render at "/dashboard". Adding a new Role Center means adding one entry
 * here (and one option below); no other routing changes are needed.
 *
 * Scoped to what this app actually exposes (the sidebar is filtered to
 * ed-mgt / user_management / org_settings only, see DashboardLayout.jsx) —
 * unlike the full-ERP source app, there's no inventory/procurement/hr module
 * here to build further Role Centers around yet.
 *
 * Unknown/blank keys fall back to the generic default (the module launcher).
 */
export const roleCenterRegistry = {
  "admin-center": lazy(() => import("../../identity_n_authentication/user_management/dashboard/Welcome")),
  "registry-officer": lazy(() => import("../../ed_mgt/dashboards/RegistryOfficerDashboard")),
  "marking-officer": lazy(() => import("../../ed_mgt/dashboards/MarkingOfficerDashboard")),
  "action-officer": lazy(() => import("../../ed_mgt/dashboards/ActionOfficerDashboard")),
  "hr-records-officer": lazy(() => import("../../ed_mgt/dashboards/HrRecordsDashboard")),
};

export const defaultRoleCenter = lazy(() => import("../Dashboard"));

export const ROLE_CENTER_OPTIONS = [
  { key: "", label: "Default (Module Launcher)" },
  { key: "admin-center", label: "Admin Center" },
  { key: "registry-officer", label: "Registry Officer Dashboard" },
  { key: "marking-officer", label: "Marking Officer Dashboard" },
  { key: "action-officer", label: "Action Officer Dashboard" },
  { key: "hr-records-officer", label: "HR Records Officer Dashboard" },
];

// Routing roles, mirrored from the IAmAPI catalog (RoleCenterCatalog.cs).
export const ROUTING_ROLE_OPTIONS = [
  { code: "", label: "None (ordinary role)" },
  { code: "REGISTRY_OFFICER", label: "Registry Officer" },
  { code: "MARKING_OFFICER", label: "Marking Officer" },
  { code: "ACTION_OFFICER", label: "Action Officer" },
];
