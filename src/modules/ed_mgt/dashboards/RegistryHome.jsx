import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { getMyRegistries } from "../../../api/edmsApi";
import RegistryOfficerDashboard from "./RegistryOfficerDashboard";
import SubRegistryDashboard from "./SubRegistryDashboard";
import HrRecordsDashboard from "./HrRecordsDashboard";

/**
 * Landing page of the EDMS. The Central Registry (and anyone not tied to a registry) gets the full
 * Registry Officer dashboard. A user who works in a sub-registry gets that registry's own dashboard:
 * HR gets the HR Records dashboard, the others (Secret, Technical ...) get the sub-registry dashboard.
 */
const RegistryHome = () => {
  const [mine, setMine] = useState(null);

  useEffect(() => {
    getMyRegistries()
      .then((r) => setMine(r?.data ?? { scoped: false, registries: [] }))
      .catch(() => setMine({ scoped: false, registries: [] }));
  }, []);

  if (!mine) {
    return (
      <DashboardLayout>
        <div className="pc-content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <span className="spinner-border text-primary" role="status" />
        </div>
      </DashboardLayout>
    );
  }

  const sub = mine.scoped ? mine.registries.find((r) => r.registry_type !== "CENTRAL") : null;
  if (!sub) return <RegistryOfficerDashboard />;
  if (sub.registry_type === "HR") return <HrRecordsDashboard />;
  return <SubRegistryDashboard registry={sub} />;
};

export default RegistryHome;
