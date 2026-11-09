import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

// Normalizes a module node — and every sub_modules descendant, at any depth
// (module -> sub-module -> sub-sub-module -> ...) — into a single consistent
// shape, so Sidebar can render any level with the same code. `key` is
// module_id-based (always present, always unique) rather than derived from
// module_route — container nodes (pure groupings like "Workspace") have no
// route of their own, so `path` is genuinely null for them rather than the
// literal string "/null".
const mapModule = (module) => ({
    key: String(module.module_id),
    label: module.module_name,
    icon: module.module_icon,
    module_id: module.module_id,
    path: module.module_route ? `/${module.module_route}` : null,
    sub_modules: (module.sub_modules || []).map(mapModule),
});

// This build is scoped to EDMS + system administration only, so the sidebar
// (and anything else driven by `menus`, e.g. Navbar) is restricted to these
// top-level sections regardless of what else the backend returns for the
// user's role. Matching is still against the backend's own response, so a
// user without permission to one of these three simply won't see it — this
// only narrows, it never grants access the backend didn't already return.
const ALLOWED_TOP_LEVEL_PATH_PREFIXES = ["/ed-mgt", "/user_management", "/org_settings"];

const isAllowedTopLevelMenu = (menu) =>
    !!menu.path &&
    ALLOWED_TOP_LEVEL_PATH_PREFIXES.some(
        (prefix) => menu.path === prefix || menu.path.startsWith(`${prefix}/`)
    );

// EDMS entries no longer shown in the sidebar: Overview is replaced by the
// fixed Home item, and Records / Reports & Analytics are reached from the
// dashboard instead. Matched by label because the menu tree is DB-driven.
const HIDDEN_EDMS_LABELS = new Set([
    "overview",
    "recent",
    "recents",
    "starred",
    "records",
    "reports & analytics",
    "reports and analytics",
    "records and analytics",
    "records & analytics",
    "analytics",
]);

const RENAMED_EDMS_LABELS = { files: "Files and Documents" };

// Drops the hidden entries, applies renames, and removes the grouping layer:
// a container node (no route of its own, e.g. "Workspace") is replaced by its
// children, in their existing display order, so the menu reads as one list.
const flattenEdmsChildren = (nodes) =>
    nodes.flatMap((node) => {
        const label = node.label.trim().toLowerCase();
        if (HIDDEN_EDMS_LABELS.has(label)) return [];
        const children = flattenEdmsChildren(node.sub_modules);
        if (!node.path && node.sub_modules.length > 0) return children;
        return [{ ...node, label: RENAMED_EDMS_LABELS[label] || node.label, sub_modules: children }];
    });

// The top-level EDMS wrapper ("Document Management") is not shown itself: its
// remaining children (which the backend already filters by the user's roles)
// are promoted to top-level menu items. If none remain, nothing is shown.
const tidyMenu = (menu) =>
    menu.path === "/ed-mgt/dashboard" || menu.path === "/ed-mgt"
        ? flattenEdmsChildren(menu.sub_modules)
        : [menu];

const mapBackendToMenus = (backendData) => {
    if (!backendData || backendData.length === 0) return [];
    return backendData.map(mapModule).filter(isAllowedTopLevelMenu).flatMap(tidyMenu);
};

const DashboardLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [menus, setMenus] = useState([]);
    const [menusLoading, setMenusLoading] = useState(true);
    const [menusError, setMenusError] = useState("");

    useEffect(() => {
        const fetchMenus = async () => {
            setMenusLoading(true);
            try {
                const res = await apiClient.get("/IAmAPI/api/modules/sidebar", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setMenus(mapBackendToMenus(res.data));
            } catch (err) {
                console.error("Failed to load sidebar menu:", err);
                setMenusError("Failed to load menu");
                setMenus([]);
            } finally {
                setMenusLoading(false);
            }
        };
        fetchMenus();
    }, []);

    // Roles with no side menus (e.g. Marking and Action Officers) start with the
    // sidebar minimised. The toggle still works if they want it open.
    useEffect(() => {
        if (!menusLoading && !menusError && menus.length === 0) setCollapsed(true);
    }, [menusLoading, menusError, menus.length]);

    return (
        <>
            <Sidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
                menus={menus}
                loading={menusLoading}
                error={menusError}
            />

            <Navbar
                menus={menus}
            />

            <div className="pc-container" style={{ overflow: "hidden" }}>
                <div style={{ overflow: "hidden" }}>
                    {children}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default DashboardLayout;
