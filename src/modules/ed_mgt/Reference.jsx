import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { key: "overview", icon: "☝", label: "Overview", to: "/ed-mgt/dashboard" },
      { key: "my-queue", icon: "🗃", label: "My Documents Queue", to: "/ed-mgt/documents/my-queue" },
      { key: "recent", icon: "🕐", label: "Recent", to: "/ed-mgt/documents" },
      { key: "starred", icon: "★", label: "Starred", to: "/ed-mgt/documents", search: "?starred_only=true" },
    ],
  },
  {
    label: "Documents",
    items: [
      { key: "all-documents", icon: "📁", label: "All documents", to: "/ed-mgt/documents" },
      { key: "files", icon: "🗂", label: "Files", to: "/ed-mgt/files" },
      { key: "approved", icon: "✔", label: "Approved", to: "/ed-mgt/documents", search: "?status=APPROVED" },
      { key: "archive", icon: "📦", label: "Archive", to: "/ed-mgt/documents", search: "?status=ARCHIVED" },
    ],
  },
  {
    label: "Organisation",
    items: [
      { key: "records", icon: "🗄", label: "Records", to: "/ed-mgt/records" },
      { key: "sla", icon: "⏱", label: "SLA Dashboard", to: "/ed-mgt/sla" },
      { key: "reports", icon: "📊", label: "Reports", to: "/ed-mgt/audit" },
      { key: "settings", icon: "⚙", label: "Settings", to: "/ed-mgt/admin" },
    ],
  },
];

const Sidebar = ({ collapsed, onShowMainMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const getItemCount = (item) => item.count;

  const isActive = (item) => {
    if (!item.to || location.pathname !== item.to) return false;
    if (item.search) return location.search === item.search;
    if (item.to === "/ed-mgt/documents") {
      const sp = new URLSearchParams(location.search);
      return !sp.get("status") && !sp.get("starred_only");
    }
    return true;
  };

  const handleClick = (item) => {
    if (!item.to) return;
    navigate(`${item.to}${item.search || ""}`);
  };

  const getFilteredGroups = () => {
    if (!searchQuery.trim()) return NAV_GROUPS;
    const q = searchQuery.toLowerCase();
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length > 0);
  };

  const filteredGroups = getFilteredGroups();

  return (
    <nav className={`pc-sidebar qside ${collapsed ? "pc-sidebar-hide" : ""}`}>
      <style>{`
        .qside { background: #fafafa; }
        .qside-ns { font-size: 11px; font-weight: 700; color: #aaa; padding: 14px 10px 5px; letter-spacing: .7px; text-transform: uppercase; }
        .qside-ni { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 7px; cursor: pointer; color: #666; font-size: 13.5px; margin-bottom: 3px; transition: background .15s; border: none; background: transparent; width: 100%; text-align: left; }
        .qside-ni:hover { background: #f0f0f0; }
        .qside-ni.on { background: #E1F5EE; color: #0F6E56; font-weight: 600; }
        .qside-ni-ic { font-size: 19px; width: 22px; text-align: center; }
        .qside-ni-ct { margin-left: auto; font-size: 11px; background: #9FE1CB; padding: 2px 8px; border-radius: 10px; color: #0F6E56; font-weight: 700; }
        .qside-allmod { display: flex; align-items: center; gap: 6px; width: 100%; padding: 7px 10px; margin-bottom: 4px; border: 1px dashed #cfd8dc; border-radius: 7px; background: transparent; color: #666; font-size: 11px; font-weight: 600; cursor: pointer; }
        .qside-allmod:hover { background: #f0f0f0; border-color: #0F6E56; color: #0F6E56; }
      `}</style>

      <div className="navbar-wrapper">
        {/* LOGO */}
        <div className="m-header">
          <a href="/dashboard" className="b-brand text-primary">
            <img src="/QBITS_LOGO.png" className="img-fluid logo-lg" alt="logo" />
          </a>
        </div>

        <div
          className="navbar-content"
          style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)" }}
        >
          {/* ALL MODULES — expand primary sidebar */}
          {onShowMainMenu && (
            <div className="px-3 pt-2" style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="qside-allmod"
                onClick={onShowMainMenu}
              >
                <i className="ti ti-grid-dots" style={{ fontSize: "13px" }} />
                All Modules
              </button>
            </div>
          )}

          {/* SEARCH */}
          <div className="px-3 pb-2 pt-1" style={{ flexShrink: 0 }}>
            <div
              className="input-group input-group-sm"
              style={{
                border: "1px solid var(--bs-border-color, #dde3ea)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <span
                className="input-group-text"
                style={{ background: "transparent", border: "none" }}
              >
                <i
                  className="ti ti-search"
                  style={{ fontSize: "13px", opacity: 0.5 }}
                />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  boxShadow: "none",
                  fontSize: "13px",
                  background: "transparent",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSearchQuery("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "0 8px",
                    opacity: 0.5,
                  }}
                >
                  <i className="ti ti-x" style={{ fontSize: "12px" }} />
                </button>
              )}
            </div>
          </div>

          {/* SCROLLABLE NAV */}
          <SimpleBar style={{ flex: 1, minHeight: 0 }}>
            <div className="px-3 pb-2">
              {filteredGroups.length === 0 ? (
                <div className="px-3 py-2">
                  <small className="text-muted">No results found</small>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.label}>
                    <div className="qside-ns">{group.label}</div>
                    {group.items.map((item) => {
                      const count = getItemCount(item);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`qside-ni ${isActive(item) ? "on" : ""}`}
                          onClick={() => handleClick(item)}
                        >
                          <span className="qside-ni-ic">{item.icon}</span>
                          <span>{item.label}</span>
                          {!!count && <span className="qside-ni-ct">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </SimpleBar>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
