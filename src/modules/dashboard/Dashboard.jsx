import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import WidgetPreLoader from "../../components/WidgetPreLoader";
import apiClient from "../../api/apiClient";

const FALLBACK_ICON = "ti ti-point";

// Cycled across the tiles in order so the icon chips alternate dark teal ->
// teal -> light teal -> repeat, regardless of how many tiles are on a level.
// Cards themselves stay white; only the icon chip carries the teal accent.
const TEAL_SHADES = [
  { iconBg: "#003d80", iconFg: "#ffffff" }, // dark teal
  { iconBg: "#1a8cff", iconFg: "#ffffff" }, // teal
  { iconBg: "#d7f5f0", iconFg: "#003d80" }, // light teal
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drill-down trail: [] shows the top-level modules; each entry pushed is
  // the module/sub-module that was expanded, so its sub_modules render next.
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/IAmAPI/api/modules/sidebar");
        setModules(res.data || []);
      } catch (err) {
        console.error("Failed to load modules:", err);
        setError("Failed to load modules");
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const currentNode = trail[trail.length - 1] || null;
  const visibleNodes = currentNode ? currentNode.sub_modules : modules;

  const handleTileClick = (node) => {
    if (node.sub_modules && node.sub_modules.length > 0) {
      setTrail([...trail, node]);
    } else if (node.module_route) {
      navigate(`/${node.module_route}`);
    }
  };

  const jumpTo = (index) => {
    // index === -1 means back to the top-level modules list
    setTrail(trail.slice(0, index + 1));
  };

  return (
    <DashboardLayout>
      <div className="pc-content">
      <div className="row">
        <div className="col-sm-12">
          <div
            className="qb-dashboard-hero rounded-3 mb-3 d-flex align-items-end"
            style={{
              backgroundImage: "url('/BusinessTechnology.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              height: "220px",
              padding: "20px 24px",
            }}
          >
            <style>{`
              .qb-dashboard-hero .breadcrumb-item, .qb-dashboard-hero .breadcrumb-item a { color: rgba(255,255,255,0.85); text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
              .qb-dashboard-hero .breadcrumb-item a:hover { color: #ffffff; }
              .qb-dashboard-hero .breadcrumb-item.active { color: #ffffff; font-weight: 600; }
              .qb-dashboard-hero .breadcrumb-item + .breadcrumb-item::before { color: rgba(255,255,255,0.7); text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
            `}</style>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className={`breadcrumb-item ${!currentNode ? "active" : ""}`}>
                  {currentNode ? (
                    <a href="#!" onClick={(e) => { e.preventDefault(); jumpTo(-1); }}>Home</a>
                  ) : (
                    "Home"
                  )}
                </li>
                {trail.map((node, index) => (
                  <li
                    key={node.module_id}
                    className={`breadcrumb-item ${index === trail.length - 1 ? "active" : ""}`}
                  >
                    {index === trail.length - 1 ? (
                      node.module_name
                    ) : (
                      <a href="#!" onClick={(e) => { e.preventDefault(); jumpTo(index); }}>
                        {node.module_name}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="card">
            <div className="card-body">
              {loading ? (
                <WidgetPreLoader />
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : visibleNodes.length === 0 ? (
                <p className="text-muted mb-0">No modules to show here.</p>
              ) : (
                <div className="row g-3">
                  {visibleNodes.map((node, index) => {
                    const hasChildren = node.sub_modules && node.sub_modules.length > 0;
                    const isNavigable = hasChildren || !!node.module_route;
                    const shade = TEAL_SHADES[index % TEAL_SHADES.length];

                    return (
                      <div className="col-6 col-md-4 col-lg-3" key={node.module_id}>
                        <div
                          className="card mb-0 h-100"
                          role="button"
                          style={{
                            cursor: isNavigable ? "pointer" : "default",
                            opacity: isNavigable ? 1 : 0.5,
                          }}
                          onClick={() => isNavigable && handleTileClick(node)}
                        >
                          <div className="card-body d-flex align-items-center gap-3">
                            <span className="avtar avtar-s" style={{ backgroundColor: shade.iconBg, color: shade.iconFg }}>
                              <i className={node.module_icon || FALLBACK_ICON} />
                            </span>
                            <div className="flex-grow-1">
                              <h6 className="mb-0">{node.module_name}</h6>
                              {hasChildren && (
                                <small className="text-muted">{node.sub_modules.length} items</small>
                              )}
                            </div>
                            {hasChildren && <i className="ti ti-chevron-right text-muted" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
