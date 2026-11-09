import React from "react";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "../utils/permissions";

/**
 * PermissionGate - A component that conditionally renders children based on permissions
 * 
 * @param {Object} props
 * @param {Object} props.permission - Single permission object { resource, action }
 * @param {Array} props.anyPermissions - Array of permissions (user needs ANY of them)
 * @param {Array} props.allPermissions - Array of permissions (user needs ALL of them)
 * @param {ReactNode} props.children - Content to render if permission check passes
 * @param {ReactNode} props.fallback - Optional content to render if permission check fails
 * @param {boolean} props.showFallback - Whether to show fallback content (default: false, just hides)
 * 
 * @example
 * // Single permission check
 * <PermissionGate permission={{ resource: "Manage Users", action: "create" }}>
 *   <button>Add User</button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (needs ANY)
 * <PermissionGate 
 *   anyPermissions={[
 *     { resource: "Manage Users", action: "update" },
 *     { resource: "Manage Users", action: "delete" }
 *   ]}
 * >
 *   <ActionButtons />
 * </PermissionGate>
 * 
 * @example
 * // With fallback message
 * <PermissionGate 
 *   permission={{ resource: "Reports", action: "read" }}
 *   fallback={<div>You don't have access to view reports</div>}
 *   showFallback={true}
 * >
 *   <ReportsDashboard />
 * </PermissionGate>
 */
const PermissionGate = ({ 
  permission, 
  anyPermissions, 
  allPermissions, 
  children, 
  fallback = null,
  showFallback = false 
}) => {
  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Check if user has ANY of the permissions
  else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAnyPermission(anyPermissions);
  }
  // Check if user has ALL of the permissions
  else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAllPermissions(allPermissions);
  }
  // If no permission specified, show content (default behavior)
  else {
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if specified and showFallback is true
  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  // Default: render nothing
  return null;
};

export default PermissionGate;
