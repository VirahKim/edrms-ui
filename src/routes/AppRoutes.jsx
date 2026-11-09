import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import UserManagementRoutes from "./modules/usermanagement.routes";
import DeveloperRoutes from "./modules/developer.routes";
import CommunicationRoutes from "./modules/communication.router";
import WorkflowRoutes from "./modules/workflow.routes";
import EDMSRoutes from "./modules/edms.routes";
import AiAssistantRoutes from "./modules/ai_assistant.routes";

import Login from "../modules/identity_n_authentication/auth/Login";
const ForgotPassword = lazy(() => import("../modules/identity_n_authentication/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../modules/identity_n_authentication/auth/ResetPassword"));
const UserRegistration = lazy(() => import("../modules/identity_n_authentication/auth/UserRegistration"));
const CandidateRegistration = lazy(() => import("../modules/identity_n_authentication/auth/CandidateRegistration"));
const UserVerification = lazy(() => import("../modules/identity_n_authentication/auth/UserVerification"));
const FirstLoginPasswordChange = lazy(() => import("../modules/identity_n_authentication/auth/FirstLoginPasswordChange"));

// Organization Settings
const OrgSettings = lazy(() => import("../modules/identity_n_authentication/org_settings/OrgSettings"));
const OrgStructure = lazy(() => import("../modules/identity_n_authentication/org_settings/structure/OrgStructure"));
const OrganizationProfile = lazy(() => import("../modules/identity_n_authentication/org_settings/profile/OrganizationProfile"));

const AppRoutes = () => {
  return (
    <Router>
      {/* Each page is its own chunk, fetched when first opened, so the first load stays small. */}
      <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}><span className="spinner-border text-primary" role="status" /></div>}>
      <Routes>

        {/* PUBLIC ROUTE - NO LAYOUT */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        <Route
          path="/user-verification"
          element={
            <PublicRoute>
              <UserVerification />
            </PublicRoute>
          }
        />

        <Route
          path="/first-login-password-change"
          element={
            <PublicRoute>
              <FirstLoginPasswordChange />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <UserRegistration />
            </PublicRoute>
          }
        />

        <Route path="/candidate-registration" element={<CandidateRegistration />} />

        {/* LOGGED-IN ROUTES - WITH DASHBOARD LAYOUT */}

        {UserManagementRoutes()}

        {/* Organization Settings */}
        <Route
          path="/org_settings"
          element={
            <ProtectedRoute>
              <OrgSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-settings"
          element={
            <ProtectedRoute>
              <OrgSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-settings/structure"
          element={
            <ProtectedRoute>
              <OrgStructure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-settings/profile"
          element={
            <ProtectedRoute>
              <OrganizationProfile />
            </ProtectedRoute>
          }
        />

        {/* Workflow Management Routes */}
        {WorkflowRoutes.map((route, index) => (
          <Route
            key={`workflow-${index}`}
            path={route.path}
            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}

        {/* Developer Console Routes */}
        {DeveloperRoutes().map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}

        {/* Communication Routes (Notifications & WhatsApp) */}
        {CommunicationRoutes().map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}

        {/* EDMS — Electronic Document Management System */}
        {EDMSRoutes().map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}

        {/* AI Assistant */}
        {AiAssistantRoutes().map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={<ProtectedRoute>{route.element}</ProtectedRoute>}
          />
        ))}

      </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRoutes;
