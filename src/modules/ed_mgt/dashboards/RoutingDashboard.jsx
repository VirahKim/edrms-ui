import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { listFileRoutings, getFileRoutingMe } from "../../../api/fileRoutingApi";
import { STAGE_BADGE } from "../utils/fileRoutingStages";
import { toast } from "../../ed_mgt/components/EDMSToast";

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

// The user's title(s) as set up in IAM, e.g. "Director, ICT".
const roleTitles = (user) => {
  const names = (user.roles || []).map((r) => r.role_name).filter(Boolean);
  return names.length ? names : [user.role_name].filter(Boolean);
};

// Blue banner with who the user is and the title they hold - kept narrow so the page's tiles stay in view.
// `registries` adds a "You are in" badge beside the titles. (`large` is accepted for older callers and ignored.)
export const WelcomeBanner = ({ title, subtitle, user, registries = [] }) => {
  const titles = roleTitles(user);
  const pill = { fontSize: "0.72rem" };
  return (
    <div
      className="card border-0 shadow-sm mb-3 text-white"
      style={{ background: "linear-gradient(135deg, #0056b3 0%, #007bff 60%, #4da3ff 100%)", borderRadius: 12 }}
    >
      <div className="card-body px-3 py-2 d-flex flex-wrap flex-lg-nowrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-white"
            style={{ width: 40, height: 40, flex: "0 0 auto" }}
          >
            <img src="/MOH_LOGO.png" alt="" style={{ maxHeight: 30, maxWidth: 30, objectFit: "contain" }} />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div className="d-flex flex-wrap align-items-baseline gap-2">
              <span style={{ opacity: 0.9, fontSize: "0.8rem" }}>{greeting()},</span>
              <span className="fw-bold text-white" style={{ fontSize: "1.05rem" }}>{user.full_name || user.email || "Welcome"}</span>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
              {titles.map((t) => (
                <span key={t} className="badge rounded-pill bg-white text-primary fw-semibold px-2 py-1" style={pill}>
                  <i className="ti ti-id-badge-2 me-1" />{t}
                </span>
              ))}
              {user.organization_name && (
                <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(255,255,255,0.2)", ...pill }}>
                  {user.organization_name}
                </span>
              )}
              {registries.length > 0 && (
                <>
                  <span className="ms-1" style={pill}><i className="ti ti-building-warehouse me-1" />You are in:</span>
                  {registries.map((r) => (
                    <span key={r.id} className="badge rounded-pill bg-white text-primary fw-semibold px-2 py-1" style={pill}>
                      {r.name}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-lg-end flex-lg-shrink-0" style={{ lineHeight: 1.25 }}>
          <div className="fw-semibold" style={{ fontSize: "0.95rem" }}>{title}</div>
          <div style={{ opacity: 0.9, fontSize: "0.74rem", maxWidth: 420 }} className="ms-lg-auto">{subtitle}</div>
          <div style={{ opacity: 0.9, fontSize: "0.74rem" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Shortcuts and counters, since these roles have no sidebar menus: small cards in one row.
const tileStyle = { minWidth: 0 };
const Tile = ({ to, icon, tone = "primary", title, sub, value }) => {
  const body = (
    <div className="card-body px-3 py-2 d-flex align-items-center gap-2">
      <span className={`d-flex align-items-center justify-content-center rounded-3 bg-light-${tone} text-${tone} flex-shrink-0`}
            style={{ width: 32, height: 32, fontSize: 17 }}>
        <i className={`ti ${icon}`} />
      </span>
      <div style={{ minWidth: 0, lineHeight: 1.2 }}>
        {value !== undefined
          ? <div className="d-flex align-items-baseline gap-1">
              <span className={`fw-bold text-${tone}`} style={{ fontSize: "1.1rem" }}>{value ?? 0}</span>
              <span className="text-muted text-truncate" style={{ fontSize: "0.74rem" }}>{title}</span>
            </div>
          : <>
              <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "0.85rem" }}>{title}</div>
              <div className="text-muted text-truncate" style={{ fontSize: "0.72rem" }}>{sub}</div>
            </>}
      </div>
      {to && <i className="ti ti-chevron-right ms-auto text-muted" style={{ fontSize: 14 }} />}
    </div>
  );
  return to
    ? <Link to={to} className="card border-0 shadow-sm text-decoration-none" style={tileStyle} title={sub || title}>{body}</Link>
    : <div className="card border-0 shadow-sm" style={tileStyle}>{body}</div>;
};

const QuickLinks = ({ focus, toActOn, done }) => (
  <div className="mb-3" style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
    <Tile to="/ed-mgt/file-routing" icon="ti-send" title="Files sent to me" sub="Whole files for marking or action" />
    <Tile to="/ed-mgt/documents/my-queue" icon="ti-inbox" title="My tasks" sub="Everything assigned to you" />
    <Tile to="/ed-mgt/documents" icon="ti-folders" title="All files" sub="Browse files and letters" />
    <Tile to="/ed-mgt/file-routing" tone="warning" icon={focus === "marking" ? "ti-pencil" : "ti-checks"} value={toActOn}
          title={focus === "marking" ? "Files awaiting my marking" : "Files to act on"} />
    <Tile to="/ed-mgt/file-routing" tone="success" icon="ti-circle-check" value={done}
          title={focus === "marking" ? "Files I have marked" : "Files I have acted on"} />
  </div>
);

const ItemTable = ({ items, emptyText, onOpen }) => {
  if (!items || items.length === 0) return <div className="text-muted small">{emptyText}</div>;
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
        <thead className="table-light">
          <tr>
            <th>File</th>
            <th>Stage</th>
            <th>Documents</th>
            <th>Sent by</th>
            <th>Since</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>
                <div className="fw-semibold">{it.folder_name || `File #${it.folder_id}`}</div>
                {it.folder_reference && <div className="text-muted" style={{ fontSize: "0.72rem" }}>{it.folder_reference}</div>}
              </td>
              <td><span className={`badge ${STAGE_BADGE[it.stage] || "text-bg-secondary"}`}>{it.stage_label}</span></td>
              <td>{it.included_count} of {it.document_count}</td>
              <td>{it.created_by_name || "—"}</td>
              <td className="text-nowrap">{formatDate(it.updated_at)}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-primary" onClick={() => onOpen(it.id)}>
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Shared shell for the Marking and Action Officer landing dashboards. `focus` picks which
 * section the page is about. Files (not single documents) move through marking and action,
 * so every list here is a list of files in routing: the server returns the files sent to the
 * signed-in officer.
 */
const RoutingDashboard = ({ focus, title, subtitle }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listFileRoutings(),
      getFileRoutingMe().catch(() => null),
    ])
      .then(([list, who]) => {
        if (cancelled) return;
        setRows(Array.isArray(list?.data) ? list.data : []);
        setMe(who?.data ?? null);
      })
      .catch((err) => { if (!cancelled) toast.error(err?.response?.data?.message || "Failed to load the dashboard."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const user = useMemo(readUser, []);

  const openRouting = (id) => navigate(`/ed-mgt/file-routing/${id}`);

  const withMe = useMemo(() => rows.filter((r) => r.stage === (focus === "marking" ? "MARKING" : "ACTION")), [rows, focus]);
  const doneByMe = useMemo(
    () => rows.filter((r) => (focus === "marking"
      ? ["RETURNED_FROM_MARKING", "ACTION", "RETURNED_FROM_ACTION", "FILED_AWAY"]
      : ["RETURNED_FROM_ACTION", "FILED_AWAY"]).includes(r.stage)),
    [rows, focus]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="pc-content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
          <span className="spinner-border text-primary" role="status" />
        </div>
      </DashboardLayout>
    );
  }

  const holdsFocusRole = focus === "marking" ? !!me?.is_marking_officer : !!me?.is_action_officer;

  return (
    <DashboardLayout>
      <div className="pc-content">
        <WelcomeBanner title={title} subtitle={subtitle} user={user} />
        <QuickLinks focus={focus} toActOn={withMe.length} done={doneByMe.length} />

        {me && !holdsFocusRole && (
          <div className="alert alert-warning small">
            You do not hold this routing role, so this dashboard has no files for you. Ask an administrator to
            assign the role if this is wrong.
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="fw-semibold small mb-2">{focus === "marking" ? "Files to mark" : "Files to act on"}</div>
            <ItemTable
              items={withMe}
              onOpen={openRouting}
              emptyText={focus === "marking" ? "No files waiting for your marking." : "No files waiting for you to act on."}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoutingDashboard;
