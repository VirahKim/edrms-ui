import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import EDMSToastProvider from "../../ed_mgt/components/EDMSToast";
import NewFileModal from "../../ed_mgt/files/fileModals/NewFileModal";
import { getFileTree, getMyRegistries } from "../../../api/edmsApi";
import { FONT_FAMILY } from "../../ed_mgt/constants/fonts";
import RegistryMovementPanel from "./RegistryMovementPanel";
import { WelcomeBanner } from "./RoutingDashboard";

const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const RegistryOfficerDashboard = () => {
  const navigate = useNavigate();
  const user = readUser();

  const [myRegistries, setMyRegistries] = useState([]);   // the registries this user is mapped to (set in user management)
  const [fileTree, setFileTree] = useState([]);
  const [showNewFile, setShowNewFile] = useState(false);

  useEffect(() => {
    getMyRegistries().then((r) => setMyRegistries(r?.data?.registries || [])).catch(() => {});
    getFileTree().then((r) => setFileTree(Array.isArray(r?.data) ? r.data : [])).catch(() => {});
  }, []);

  // The registry officer's day-to-day actions: receive mail, file it, send it on.
  const actions = [
    { icon: "ti-book",        label: "Inward Mail Register", desc: "Record mail received",         onClick: () => navigate("/ed-mgt/registers/inward") },
    { icon: "ti-upload",      label: "Upload Document",      desc: "Add a new document",           onClick: () => navigate("/ed-mgt/documents/upload") },
    { icon: "ti-folder-plus", label: "Create File",          desc: "Open a new file",              onClick: () => setShowNewFile(true) },
    { icon: "ti-send",        label: "File Movements",       desc: "Files with marking / action",  onClick: () => navigate("/ed-mgt/file-routing") },
    { icon: "ti-send",        label: "Outward Register",     desc: "Mail sent out",                onClick: () => navigate("/ed-mgt/registers/outward") },
    { icon: "ti-search",      label: "Search Documents",     desc: "Find documents",               onClick: () => navigate("/ed-mgt/documents") },
    { icon: "ti-checklist",   label: "My Tasks",             desc: "View my queue",                onClick: () => navigate("/ed-mgt/documents/my-queue") },
    { icon: "ti-lock-open",   label: "Access Requests",      desc: "Files officers asked for",     onClick: () => navigate("/ed-mgt/access-requests") },
    { icon: "ti-folders",     label: "Physical Files",       desc: "Paper custody",                onClick: () => navigate("/ed-mgt/registers/physical-files") },
    { icon: "ti-folder-open", label: "Files & Records",      desc: "Open, close, dispose",         onClick: () => navigate("/ed-mgt/records/files") },
    { icon: "ti-clipboard-check", label: "File Census",      desc: "Check files in racks",         onClick: () => navigate("/ed-mgt/records/census") },
  ];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <WelcomeBanner
          title="Registry Officer Dashboard"
          subtitle="Receive and record incoming mail, file it, and send it on to the Marking Officer."
          user={user}
          registries={myRegistries}
          large
        />

        <div className="row g-2 mb-3">
          {actions.map((a) => (
            <div className="col-12 col-md-6 col-xl-4" key={a.label}>
              <button type="button" className="card border-0 shadow-sm w-100 h-100 text-start" onClick={a.onClick}>
                <div className="card-body py-3 d-flex align-items-center gap-3">
                  <span
                    className="d-flex align-items-center justify-content-center rounded-3 bg-light-primary text-primary"
                    style={{ width: 42, height: 42, fontSize: 22 }}
                  >
                    <i className={`ti ${a.icon}`} />
                  </span>
                  <div>
                    <div className="fw-semibold text-dark">{a.label}</div>
                    <div className="text-muted small">{a.desc}</div>
                  </div>
                  <i className="ti ti-chevron-right ms-auto text-muted" />
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* File movements: what has gone to the Marking Officer and Action Officers */}
        <RegistryMovementPanel />
      </div>

      {showNewFile && (
        <NewFileModal
          tree={fileTree}
          onCreated={() => { setShowNewFile(false); navigate("/ed-mgt/files"); }}
          onClose={() => setShowNewFile(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default RegistryOfficerDashboard;
