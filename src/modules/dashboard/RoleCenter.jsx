import { Suspense } from "react";
import { getUserLandingPageKey } from "../../utils/permissions";
import { roleCenterRegistry, defaultRoleCenter } from "./roleCenters/registry";

// Mounted at "/dashboard" in place of a single static page. Resolves the
// logged-in user's role to its configured Role Center (see roleCenters/registry.js)
// and lazily renders it, falling back to the generic default (EDMSDashboard).
const RoleCenter = () => {
  const Page = roleCenterRegistry[getUserLandingPageKey()] || defaultRoleCenter;

  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <span className="spinner-border text-primary" role="status" />
        </div>
      }
    >
      <Page />
    </Suspense>
  );
};

export default RoleCenter;
