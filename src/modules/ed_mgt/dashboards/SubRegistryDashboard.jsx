import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../../ed_mgt/components/EDMSToast";
import { FONT_FAMILY } from "../../ed_mgt/constants/fonts";
import { getFileTree } from "../../../api/edmsApi";
import { listPhysicalFiles, receivePhysicalFile } from "../../../api/registersApi";
import { FileRoutingTable } from "../routing/FileRoutingList";
import { WelcomeBanner } from "./RoutingDashboard";

const TYPE_LABEL = { HR: "HR", SECRET: "Secret", TECHNICAL: "Technical", OTHER: "" };

const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); }
  catch { return {}; }
};

const fmtRelative = (iso) => {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 43200) return `${Math.floor(mins / 1440)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const flatten = (nodes, acc = []) => {
  nodes.forEach((n) => { acc.push(n); if (n.children?.length) flatten(n.children, acc); });
  return acc;
};

const Kpi = ({ label, value, icon, tone = "primary", to, loading }) => {
  const navigate = useNavigate();
  return (
    <div className="col-6 col-lg-3 mb-2">
      <div className="card border-0 shadow-sm h-100" style={{ cursor: to ? "pointer" : "default" }} onClick={() => to && navigate(to)}>
        <div className="card-body py-3 d-flex align-items-center gap-3">
          <span className={`d-flex align-items-center justify-content-center rounded-3 bg-light-${tone} text-${tone}`}
                style={{ width: 44, height: 44, fontSize: 22 }}>
            <i className={`ti ${icon}`} />
          </span>
          <div>
            <div className={`fw-bold text-${tone}`} style={{ fontSize: "1.5rem", lineHeight: 1.1 }}>{loading ? "…" : value}</div>
            <div className="text-muted" style={{ fontSize: "0.78rem" }}>{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard of a sub-registry (Secret, Technical ...). Files reach it from the Central Registry through the
 * normal route - Registry Officer, Marking Officer, Action Officer - and the paper file is kept here after
 * action. So it shows what has been sent to this registry and is waiting to be acknowledged, what it holds,
 * its own files, and the files of this registry that are moving. It only ever sees its own registry's files.
 */
const SubRegistryDashboard = ({ registry }) => {
  const navigate = useNavigate();
  const user = useMemo(readUser, []);
  const [tree, setTree] = useState([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [incoming, setIncoming] = useState([]);   // paper files sent to me, waiting for me to acknowledge
  const [held, setHeld] = useState([]);           // paper files I have acknowledged and hold
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sent, received] = await Promise.all([
        listPhysicalFiles({ status: "SENT", mine: true }),
        listPhysicalFiles({ status: "RECEIVED", mine: true }),
      ]);
      setIncoming(sent?.data ?? sent ?? []);
      setHeld(received?.data ?? received ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not load the files sent to this registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getFileTree()
      .then((r) => setTree(Array.isArray(r?.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setTreeLoading(false));
  }, []);

  const files = useMemo(() => flatten(tree), [tree]);
  const recent = useMemo(
    () => files.filter((f) => f.last_activity_at).sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at)).slice(0, 8),
    [files]
  );

  const acknowledge = async (m) => {
    setBusyId(m.id);
    try {
      await receivePhysicalFile(m.id);
      toast.success(`Receipt of "${m.file_name}" acknowledged.`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not acknowledge receipt.");
    } finally {
      setBusyId(null);
    }
  };

  const typeLabel = TYPE_LABEL[registry.registry_type];
  const title = `${registry.name} Dashboard`;

  const actions = [
    { icon: "ti-folders", label: "Physical Files", desc: "Paper custody", to: "/ed-mgt/registers/physical-files" },
    { icon: "ti-folder-open", label: "Files & Records", desc: "Open, close, dispose", to: "/ed-mgt/records/files" },
    { icon: "ti-clipboard-check", label: "File Census", desc: "Check files in racks", to: "/ed-mgt/records/census" },
    { icon: "ti-calendar-event", label: "Bring-ups", desc: "Files due back", to: "/ed-mgt/records/bring-ups" },
    { icon: "ti-send", label: "File Routing/Movement", desc: "Files with marking / action", to: "/ed-mgt/file-routing" },
    { icon: "ti-files", label: "All files", desc: "Browse this registry's files", to: "/ed-mgt/documents" },
  ];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <WelcomeBanner
          title={title}
          subtitle={`${typeLabel ? `${typeLabel} registry. ` : ""}Receives files from the Central Registry after action and keeps the paper file. Only this registry's files are shown.`}
          user={user}
        />

        <div className="row">
          <Kpi label="Awaiting my acknowledgement" value={incoming.length} icon="ti-inbox" tone="warning" loading={loading} />
          <Kpi label="Paper files I hold" value={held.length} icon="ti-archive" tone="success" loading={loading} to="/ed-mgt/registers/physical-files" />
          <Kpi label={`Files in ${registry.name}`} value={files.length} icon="ti-folders" loading={treeLoading} to="/ed-mgt/documents" />
          <Kpi label="Recently active files" value={recent.length} icon="ti-history" tone="info" loading={treeLoading} />
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-transparent fw-semibold small">
            <i className="ti ti-inbox me-1 text-warning" />Received from Central Registry - awaiting acknowledgement
          </div>
          <div className="card-body">
            {loading ? <div className="text-muted small">Loading…</div>
              : incoming.length === 0 ? <div className="text-muted small">Nothing is waiting for you to acknowledge.</div> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.86rem" }}>
                    <thead className="table-light">
                      <tr><th>File</th><th>What</th><th>Purpose</th><th>Sent by</th><th>Sent</th><th /></tr>
                    </thead>
                    <tbody>
                      {incoming.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="fw-semibold">{m.file_name}</div>
                            <div className="text-muted" style={{ fontSize: "0.72rem" }}>{m.file_reference}</div>
                          </td>
                          <td>{m.scope === "DOCUMENT" ? (m.document_title || "One document") : "Whole file"}</td>
                          <td>{m.purpose || "—"}</td>
                          <td>{m.sent_by_name || "—"}</td>
                          <td className="text-nowrap">{fmtRelative(m.sent_at)}</td>
                          <td className="text-end">
                            <button className="btn btn-sm btn-primary" disabled={busyId === m.id} onClick={() => acknowledge(m)}>
                              {busyId === m.id ? <span className="spinner-border spinner-border-sm" /> : <><i className="ti ti-check me-1" />Acknowledge receipt</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>

        <div className="row g-2">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-transparent fw-semibold small">
                <i className="ti ti-send me-1 text-primary" />File routing / movement for this registry
              </div>
              <div className="card-body">
                <FileRoutingTable embedded />
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm mb-2">
              <div className="card-header bg-transparent fw-semibold small">
                <i className="ti ti-history me-1 text-primary" />Recently affected files
              </div>
              <div className="card-body p-2">
                {treeLoading ? <div className="text-muted small p-2">Loading…</div>
                  : recent.length === 0 ? <div className="text-muted small p-2">No file activity yet.</div>
                  : recent.map((f) => (
                    <div key={f.id} className="d-flex align-items-start gap-2 px-2 py-2 border-bottom"
                         style={{ cursor: "pointer" }} onClick={() => navigate(`/ed-mgt/documents?folder_id=${f.id}`)}>
                      <i className="ti ti-folder mt-1" style={{ color: f.color || "#003d80" }} />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-semibold" style={{ fontSize: "0.85rem", overflowWrap: "anywhere" }}>{f.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>{[f.reference_no, f.volume_no && `Vol. ${f.volume_no}`].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span className="text-muted text-nowrap" style={{ fontSize: "0.72rem" }}>{fmtRelative(f.last_activity_at)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent fw-semibold small">Quick actions</div>
              <div className="card-body p-2">
                <div className="row g-2">
                  {actions.map((a) => (
                    <div className="col-6" key={a.label}>
                      <Link to={a.to} className="d-flex align-items-center gap-2 p-2 rounded border text-decoration-none h-100">
                        <i className={`ti ${a.icon} text-primary`} style={{ fontSize: "1.2rem" }} />
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: "0.8rem" }}>{a.label}</div>
                          <div className="text-muted" style={{ fontSize: "0.68rem" }}>{a.desc}</div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubRegistryDashboard;
