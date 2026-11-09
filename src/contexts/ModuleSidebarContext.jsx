import React, { createContext, useContext, useState } from "react";

/**
 * Tracks which top-level module (if any) Sidebar is currently "drilled
 * into" — stores that module's key (module_id-based). Null means the
 * primary module list is showing. Once drilled in, a module's entire
 * sub-tree (sub-modules and sub-sub-modules, any depth) renders together as
 * one flattened list — there's no per-level drill state to track.
 *
 * This has to live in a Context mounted once above the router (see App.jsx)
 * rather than as local state inside Sidebar/DashboardLayout, because every
 * page wraps ITSELF in its own <DashboardLayout> (see routes/AppRoutes.jsx —
 * there is no single shared layout route with an <Outlet/>). React fully
 * unmounts/remounts DashboardLayout (and Sidebar with it) on every
 * navigation, so any state local to it is lost the instant the user clicks a
 * link. Context state, backed by a Provider that lives above <AppRoutes/>,
 * survives that remounting.
 */
const ModuleSidebarContext = createContext(null);

export const ModuleSidebarProvider = ({ children }) => {
  const [activeModuleKey, setActiveModuleKey] = useState(null);
  return (
    <ModuleSidebarContext.Provider value={{ activeModuleKey, setActiveModuleKey }}>
      {children}
    </ModuleSidebarContext.Provider>
  );
};

export const useModuleSidebar = () => {
  const ctx = useContext(ModuleSidebarContext);
  if (!ctx) {
    throw new Error("useModuleSidebar must be used within a ModuleSidebarProvider");
  }
  return ctx;
};
