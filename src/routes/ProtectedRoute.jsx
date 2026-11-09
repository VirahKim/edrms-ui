import React from "react";
import { Navigate } from "react-router-dom";
import { hasPermission, isAuthenticated } from "../utils/permissions";

/**
 * ProtectedRoute component for route-level access control
 * @param {ReactNode} children - The component to render if authorized
 * @param {Object} requiredPermission - Optional permission object { resource, action }
 * @param {string} fallback - Route to redirect to if permission check fails (default: "/dashboard")
 */
const ProtectedRoute = ({ children, requiredPermission, fallback = "/dashboard" }) => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Check if specific permission is required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // User is authenticated but doesn't have permission
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
