import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import WidgetPreLoader from "./WidgetPreLoader";
import { useModuleSidebar } from "../contexts/ModuleSidebarContext";

const FALLBACK_ICON = "ti ti-point";

// One near-teal family — dark teal through pale aqua — so the whole sidebar
// reads as one color system. Each level (module / sub-module / sub-sub-
// module) draws from its own slice of the family and alternates between its
// two shades as rows render, instead of every icon sharing one flat color.
const NEAR_TEAL_PALETTE = [
  { bg: "#d6e8ff", fg: "#003d80" }, // dark teal
  { bg: "#dbeaff", fg: "#0056b3" }, // deep teal
  { bg: "#e1efff", fg: "#007bff" }, // teal
  { bg: "#e5f1ff", fg: "#1a8cff" }, // teal-cyan
  { bg: "#ebf4ff", fg: "#4da3ff" }, // light teal
  { bg: "#f1f7ff", fg: "#80bdff" }, // pale aqua-teal
];

const ROLE_SHADES = {
  module: [0, 1],
  subModule: [2, 3],
  subSubModule: [4, 5],
};

const colorForRole = (role, index) => {
  const shades = ROLE_SHADES[role];
  return NEAR_TEAL_PALETTE[shades[index % shades.length]];
};

// True if this node — or anything under it, at any depth — has a route the
// given pathname falls under. Container nodes (e.g. "Workspace") often have
// no route of their own (path is null).
const nodeContainsPath = (node, pathname) => {
  if (node.path && (pathname === node.path || pathname.startsWith(`${node.path}/`))) return true;
  return (node.sub_modules || []).some((child) => nodeContainsPath(child, pathname));
};

// Every path in the tree, at any depth.
const collectPaths = (nodes, acc = []) => {
  nodes.forEach((n) => {
    if (n.path) acc.push(n.path);
    if (n.sub_modules?.length) collectPaths(n.sub_modules, acc);
  });
  return acc;
};

// The single most specific route match for the current pathname, across the
// WHOLE menu tree (not just what's currently expanded). Several sidebar
// entries can legitimately share an ancestor path (e.g. placeholder items
// still pointing at their module's base route) — plain prefix-matching would
// then light up every one of them at once. Picking only the longest match
// keeps just the one entry that's actually the current page highlighted.
const bestMatchingPath = (nodes, pathname) => {
  let best = null;
  collectPaths(nodes).forEach((p) => {
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      if (!best || p.length > best.length) best = p;
    }
  });
  return best;
};

// Flattens a module's sub-tree into render order (pre-order, depth-first —
// same order the old recursive renderer produced) so colors can be handed
// out per level as rows are actually rendered, alternating shade in order.
const flattenTree = (nodes, depth = 0) => {
  const out = [];
  nodes.forEach((node) => {
    const hasChildren = node.sub_modules && node.sub_modules.length > 0;
    out.push({ node, depth, hasChildren });
    if (hasChildren) out.push(...flattenTree(node.sub_modules, depth + 1));
  });
  return out;
};

// The full module list is always on screen. A module with children is an
// accordion row: clicking it expands its entire sub-tree — sub-modules AND
// sub-sub-modules (any depth), flattened into one indented list — directly
// beneath it, in place, instead of swapping the sidebar to a secondary view.
// Only one module is expanded at a time.
const Sidebar = ({ collapsed, onToggleCollapse, menus = [], loading, error, onNavigate }) => {
  const location = useLocation();
  // Local override of what's expanded, independent of the route — set by
  // manually expanding/collapsing a module. Null means "no override, follow
  // the route"; "" means "explicitly collapsed." This has to be local (not
  // Context) so it resets automatically when a real navigation remounts
  // Sidebar, but still needs to gate the route-sync effect below for the
  // same-URL no-op case (e.g. collapsing then re-expanding the module
  // you're already on — no route change, so no remount, so this local state
  // is what stops the effect from immediately re-locking it open).
  const [peekKey, setPeekKey] = useState(null);
  const { activeModuleKey, setActiveModuleKey } = useModuleSidebar();

  const routedModule = menus.find((m) => m.sub_modules?.length > 0 && nodeContainsPath(m, location.pathname));

  // Persist the route-derived module in Context so it survives remounting
  // (see ModuleSidebarContext.jsx) — this is what keeps the right module
  // expanded on pages outside its own prefix (e.g. a shared inbox/approval
  // page reached from a link inside an expanded module).
  useEffect(() => {
    if (peekKey !== null) return;
    if (!routedModule) return;
    setActiveModuleKey((prev) => (prev === routedModule.key ? prev : routedModule.key));
  }, [routedModule?.key, peekKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveKey = peekKey !== null ? peekKey || null : routedModule ? routedModule.key : activeModuleKey;
  const activeModule = effectiveKey
    ? menus.find((m) => m.key === effectiveKey && m.sub_modules?.length > 0) || null
    : null;

  const expandModule = (menu) => {
    setPeekKey(menu.key);
    setActiveModuleKey(menu.key);
  };

  // Releases the lock in Context — not just local state — so expanding a
  // DIFFERENT module afterwards actually opens it instead of snapping back
  // to this one once the component remounts for the destination page.
  const collapseModule = () => {
    setPeekKey("");
    setActiveModuleKey(null);
  };

  const toggleModule = (menu) => {
    if (activeModule?.key === menu.key) collapseModule();
    else expandModule(menu);
  };

  // Icon rail (collapsed sidebar) row click. A leaf just navigates like
  // normal. A module with children can't show its sub-tree in a 78px rail,
  // so it expands the sidebar back to full width and opens straight into
  // that module's sub-tree, rather than silently doing nothing.
  const handleRailClick = (menu, hasChildren) => (e) => {
    if (!hasChildren) {
      handleLinkClick();
      return;
    }
    e.preventDefault();
    onToggleCollapse?.();
    expandModule(menu);
  };

  // Release any peek override on a real navigation. New page's remount
  // resets it anyway; this covers the same-route no-op click case.
  const handleLinkClick = () => {
    setPeekKey(null);
    onNavigate?.();
  };

  const activePath = bestMatchingPath(menus, location.pathname);
  const isActivePath = (path) => !!path && path === activePath;

  const visibleMenus = menus;
  const visibleTree = activeModule ? activeModule.sub_modules : [];

  const renderIconChip = (icon, active, color) => {
    const style = color
      ? { background: active ? color.fg : color.bg, color: active ? "#fff" : color.fg }
      : undefined;
    return (
      <span className="qs-icon-chip" style={style}>
        {icon.startsWith("#") ? (
          <svg className="pc-icon">
            <use xlinkHref={icon} />
          </svg>
        ) : (
          <i className={icon} />
        )}
      </span>
    );
  };

  // Expanded module's sub-tree, rendered flattened. Containers render as
  // non-clickable, indented section headers; leaves render as clickable
  // rows indented under their group. Depth 0 is a sub-module, depth 1+ is a
  // sub-sub-module — each level draws its own alternating shade so the tree
  // reads as three distinct color bands.
  const renderFlattenedTree = (items) => {
    const counts = { subModule: 0, subSubModule: 0 };
    return items.map(({ node, depth, hasChildren }) => {
      const role = depth === 0 ? "subModule" : "subSubModule";
      const color = colorForRole(role, counts[role]++);
      const indent = 20 + depth * 16;

      if (hasChildren) {
        return (
          <li key={node.key} className="qs-group-header" style={{ paddingLeft: indent, color: color.fg }}>
            {node.label}
          </li>
        );
      }

      if (!node.path) {
        return (
          <li className="pc-item" key={node.key}>
            <span className="pc-link qs-row" style={{ opacity: 0.5, cursor: "default", paddingLeft: indent }}>
              {renderIconChip(node.icon || FALLBACK_ICON, false, color)}
              <span className="pc-mtext">{node.label}</span>
            </span>
          </li>
        );
      }

      const active = isActivePath(node.path);
      return (
        <li className="pc-item" key={node.key}>
          <Link
            to={node.path}
            className={`pc-link qs-row ${active ? "on" : ""}`}
            style={{ paddingLeft: indent, ...(active ? { background: color.bg, color: color.fg } : {}) }}
            onClick={handleLinkClick}
          >
            {renderIconChip(node.icon || FALLBACK_ICON, active, color)}
            <span className="pc-mtext">{node.label}</span>
          </Link>
        </li>
      );
    });
  };

  // Top-level module row.
  //  - No children: plain navigate.
  //  - Children: an accordion row — clicking anywhere on it toggles the
  //    sub-tree open/closed in place, right below this row. It never
  //    navigates on its own, even if the module has a landing path of its
  //    own, since that's covered once a sub-item under it is opened
  //    (the routedModule effect above then keeps this row expanded).
  const renderModuleRow = (menu, index) => {
    const hasChildren = menu.sub_modules && menu.sub_modules.length > 0;
    const color = colorForRole("module", index);
    const active = isActivePath(menu.path);

    if (!hasChildren) {
      return (
        <li className="pc-item" key={menu.key}>
          <Link
            to={menu.path || "#"}
            className={`pc-link qs-row ${active ? "on" : ""}`}
            style={active ? { background: color.bg, color: color.fg } : undefined}
            onClick={handleLinkClick}
          >
            {renderIconChip(menu.icon || FALLBACK_ICON, active, color)}
            <span className="pc-mtext">{menu.label}</span>
          </Link>
        </li>
      );
    }

    const expanded = activeModule?.key === menu.key;

    return (
      <li className="pc-item" key={menu.key}>
        <a
          href="#!"
          className={`pc-link qs-row qs-parent-row ${expanded ? "expanded" : ""} ${active ? "on" : ""}`}
          style={active ? { background: color.bg, color: color.fg } : undefined}
          onClick={(e) => { e.preventDefault(); toggleModule(menu); }}
        >
          {renderIconChip(menu.icon || FALLBACK_ICON, active, color)}
          <span className="pc-mtext flex-grow-1">{menu.label}</span>
          <i className={`ti ${expanded ? "ti-chevron-down" : "ti-chevron-right"} qs-chevron-icon`} />
        </a>
        {expanded && (
          <ul className="qs-submenu">
            {visibleTree.length === 0 ? (
              <li className="pc-item px-3 py-2">
                <small className="text-muted">No results found</small>
              </li>
            ) : (
              renderFlattenedTree(flattenTree(visibleTree))
            )}
          </ul>
        )}
      </li>
    );
  };

  // Collapsed rail: every top-level module reduced to just its icon chip,
  // stacked vertically. A module with children can't show its sub-tree in
  // 78px, so clicking it re-expands the sidebar (see handleRailClick).
  const renderRail = () => (
    <div className="d-flex flex-column align-items-center gap-1 pt-2 px-2" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
      {loading ? (
        <div className="py-3"><span className="spinner-border spinner-border-sm" /></div>
      ) : error ? (
        <div className="text-danger text-center" style={{ fontSize: 18 }} title={error}>
          <i className="ti ti-alert-circle" />
        </div>
      ) : (
        <>
        <Link to="/dashboard" className="qs-rail-btn" title="Home" onClick={handleLinkClick}>
          {renderIconChip("ti ti-home", location.pathname === "/dashboard", colorForRole("module", 0))}
        </Link>
        {menus.map((menu, index) => {
          const hasChildren = menu.sub_modules && menu.sub_modules.length > 0;
          const color = colorForRole("module", index);
          const active = isActivePath(menu.path) || (hasChildren && nodeContainsPath(menu, location.pathname));
          return (
            <Link
              key={menu.key}
              to={hasChildren ? "#" : (menu.path || "#")}
              className="qs-rail-btn"
              title={menu.label}
              onClick={handleRailClick(menu, hasChildren)}
            >
              {renderIconChip(menu.icon || FALLBACK_ICON, active, color)}
            </Link>
          );
        })}
        </>
      )}
    </div>
  );

  return (
    <nav className={`pc-sidebar ${collapsed ? "pc-sidebar-icon" : ""}`}>
      <div className="navbar-wrapper">
        <div className={`m-header d-flex align-items-center gap-2 ${collapsed ? "justify-content-center" : ""}`}>
          <button
            type="button"
            className="qs-collapse-btn"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
          >
            <i className="ti ti-menu-2" style={{ fontSize: 20 }} />
          </button>
          <a href="/dashboard" className="b-brand text-primary" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/MOH_LOGO.png" height={44} alt="Ministry of Health" style={{ objectFit: "contain", maxWidth: collapsed ? 40 : 180 }} />
            </div>
          </a>
        </div>
        <div
          className="navbar-content"
          style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)" }}
        >
          {collapsed ? (
            renderRail()
          ) : (
            <>
              {/* HOME — fixed; /dashboard resolves to the user's role-based landing page */}
              <ul className="pc-navbar" style={{ flexShrink: 0, paddingTop: 8, paddingBottom: 0 }}>
                <li className="pc-item">
                  <Link
                    to="/dashboard"
                    className={`pc-link qs-row ${location.pathname === "/dashboard" ? "on" : ""}`}
                    onClick={handleLinkClick}
                  >
                    {renderIconChip("ti ti-home", location.pathname === "/dashboard", colorForRole("module", 0))}
                    <span className="pc-mtext">Home</span>
                  </Link>
                </li>
              </ul>

              {/* SCROLLABLE MENU */}
              <SimpleBar style={{ flex: 1, minHeight: 0 }}>
                <ul className="pc-navbar" style={{ paddingTop: 0 }}>
                  {loading ? (
                    <li className="px-3">
                      <WidgetPreLoader />
                    </li>
                  ) : error ? (
                    <li className="pc-item">
                      <div className="alert alert-danger m-3">{error}</div>
                    </li>
                  ) : (
                    visibleMenus.map((menu, index) => renderModuleRow(menu, index))
                  )}
                </ul>
              </SimpleBar>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
