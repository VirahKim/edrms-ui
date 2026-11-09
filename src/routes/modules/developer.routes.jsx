import { lazy } from "react";
const DeveloperSettings = lazy(() => import("../../modules/identity_n_authentication/developer_console/DeveloperSettings"));
const FrontendApps = lazy(() => import("../../modules/identity_n_authentication/developer_console/frontend_apps/FrontendApps"));
const OrgsList = lazy(() => import("../../modules/identity_n_authentication/developer_console/organizations/OrgsList"));
const NewOrg = lazy(() => import("../../modules/identity_n_authentication/developer_console/organizations/NewOrg"));
const OrgDetails = lazy(() => import("../../modules/identity_n_authentication/developer_console/organizations/OrgDetails"));
const EditOrgDetails = lazy(() => import("../../modules/identity_n_authentication/developer_console/organizations/EditOrgDetails"));
const SwitchOrganization = lazy(() => import("../../modules/identity_n_authentication/developer_console/organizations/SwitchOrganization"));

const DeveloperRoutes = () => {
  return [
    {
      path: "/developer_console",
      element: <DeveloperSettings />
    },
    {
      path: "/developer-console",
      element: <DeveloperSettings />
    },
    {
      path: "/developer_console/organizations",
      element: <OrgsList />
    },
    {
      path: "/developer-console/organizations",
      element: <OrgsList />
    },
    {
      path: "/developer-console/organizations/new",
      element: <NewOrg />
    },
    {
      path: "/developer-console/organizations/:id",
      element: <OrgDetails />
    },
    {
      path: "/developer-console/organizations/:id/edit",
      element: <EditOrgDetails />
    },
    {
      path: "/developer-console/organizations/switch",
      element: <SwitchOrganization />
    },
    {
      path: "/developer-console/frontend-apps",
      element: <FrontendApps />
    }
  ];
};

export default DeveloperRoutes;
