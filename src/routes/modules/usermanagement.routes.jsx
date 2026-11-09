import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";

const RoleCenter = lazy(() => import("../../modules/dashboard/RoleCenter"));
const DeveloperSettings = lazy(() => import("../../modules/identity_n_authentication/developer_console/DeveloperSettings"));
const Modules = lazy(() => import("../../modules/identity_n_authentication/developer_console/modules/List"));
const ModuleNew = lazy(() => import("../../modules/identity_n_authentication/developer_console/modules/New"));
const Resources = lazy(() => import("../../modules/identity_n_authentication/developer_console/resources/List"));
const AddResource = lazy(() => import("../../modules/identity_n_authentication/developer_console/resources/New"));
const Actions = lazy(() => import("../../modules/identity_n_authentication/developer_console/Actions"));
const Permissions = lazy(() => import("../../modules/identity_n_authentication/developer_console/permissions/List"));
const AddPermission = lazy(() => import("../../modules/identity_n_authentication/developer_console/permissions/New"));
const EditPermission = lazy(() => import("../../modules/identity_n_authentication/developer_console/permissions/Edit"));
const Users = lazy(() => import("../../modules/identity_n_authentication/user_management/users/Users"));
const CreateUser = lazy(() => import("../../modules/identity_n_authentication/user_management/users/CreateUser"));
const EditUser = lazy(() => import("../../modules/identity_n_authentication/user_management/users/EditUser"));
const MyProfile = lazy(() => import("../../modules/identity_n_authentication/user_management/users/MyProfile"));
const ViewRoles = lazy(() => import("../../modules/identity_n_authentication/user_management/roles/ViewRoles"));
const CreateRole = lazy(() => import("../../modules/identity_n_authentication/user_management/roles/CreateRole"));
const RolePermissions = lazy(() => import("../../modules/identity_n_authentication/user_management/roles/RolePermissions"));
const UserManagementWelcome = lazy(() => import("../../modules/identity_n_authentication/user_management/dashboard/Welcome"));
const LoginAttempts = lazy(() => import("../../modules/identity_n_authentication/user_management/security/LoginAttempts"));

const UserManagementRoutes = () => (
    <>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleCenter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/developer-settings"
          element={
            <ProtectedRoute>
              <DeveloperSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <Modules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add_module"
          element={
            <ProtectedRoute>
              <ModuleNew />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add_resource"
          element={
            <ProtectedRoute>
              <AddResource />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit_resource/:id"
          element={
            <ProtectedRoute>
              <AddResource />
            </ProtectedRoute>
          }
        />

        <Route
          path="/actions"
          element={
            <ProtectedRoute>
              <Actions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/permissions"
          element={
            <ProtectedRoute>
              <Permissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/new_permission"
          element={
            <ProtectedRoute>
              <AddPermission />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add_permission"
          element={
            <ProtectedRoute>
              <AddPermission />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/update_permission/:id" 
          element={
            <ProtectedRoute>
              <EditPermission />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/user_management"
          element={
            <ProtectedRoute>
              <UserManagementWelcome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/create"
          element={
            <ProtectedRoute>
              <CreateUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/edit/:id"
          element={
            <ProtectedRoute>
              <EditUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/view_roles"
          element={
            <ProtectedRoute>
              <ViewRoles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <ViewRoles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create_role"
          element={
            <ProtectedRoute>
              <CreateRole />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit_role/:id"
          element={
            <ProtectedRoute>
              <CreateRole />
            </ProtectedRoute>
          }
        />

        <Route
          path="/role_permissions/:id"
          element={
            <ProtectedRoute>
              <RolePermissions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/security/login-attempts"
          element={
            <ProtectedRoute>
              <LoginAttempts />
            </ProtectedRoute>
          }
        />

    </>
);

export default UserManagementRoutes;