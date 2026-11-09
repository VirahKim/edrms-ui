import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import { STAGE_BADGE, STAGE_FILTERS } from "../utils/fileRoutingStages";
import { listFileRoutings, getFileRoutingMe } from "../../../api/fileRoutingApi";

const fmt = (iso) => new Date(iso).toLocaleString();

/**
 * Files in routing. The Registry Officer sees every file and where it is - including the ones
 * back from the Marking Officer that are waiting to go to an Action Officer or be filed away.
 * Marking and Action Officers see the files that were sent to them.
 * `embedded` drops the page heading, for use as a tab inside My Queue.
 * `onlyStages` (e.g. ["MARKING"]) shows just the files at those stages, with no stage filters -
 * the "Files to Act On" tab for Marking and Action Officers.
 */
export const FileRoutingTable = ({ embedded = false, onlyStages = null }) => {
  const [rows, setRows] = useState(null);
  const [me, setMe] = useState(null);
  const [filter, setFilter] = useState("ACTIVE");

  useEffect(() => {
    let cancelled = false;
    listFileRoutings()
      .then((r) => { if (!cancelled) setRows(Array.isArray(r?.data) ? r.data : []); })
      .catch((e) => { toast.error(e?.response?.data?.message || "Could not load file routing."); if (!cancelled) setRows([]); });
    getFileRoutingMe().then((r) => { if (!cancelled) setMe(r?.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => {
    const c = { ACTIVE: 0 };
    (rows || []).forEach((r) => {
      c[r.stage] = (c[r.stage] || 0) + 1;
      if (r.stage !== "FILED_AWAY") c.ACTIVE += 1;
    });
    return c;
  }, [rows]);

  const shown = (rows || []).filter((r) => (onlyStages ? onlyStages.includes(r.stage)
    : filter === "ACTIVE" ? r.stage !== "FILED_AWAY" : r.stage === filter));

  return (
    <>
      {!embedded && (
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">File Routing</h5>
            <div className="text-muted small">
              {me?.is_registry_officer
                ? "Every file sent for marking or action. To send a file, open the Files page and use the ⋮ menu on it: Submit to Marking Officer."
                : "Files that have been sent to you."}
            </div>
          </div>
          <Link to="/ed-mgt/documents" className="btn btn-sm btn-outline-secondary"><i className="ti ti-folders me-1"></i>Files</Link>
        </div>
      )}

      {!onlyStages && (
      <div className="d-flex flex-wrap gap-2 mb-3">
        {STAGE_FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                  className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-outline-secondary"}`}>
            {f.label} <span className="badge bg-light text-dark ms-1">{counts[f.key] || 0}</span>
          </button>
        ))}
      </div>
      )}

      <div className={embedded ? "" : "card border-0 shadow-sm"}>
        <div className={embedded ? "" : "card-body"}>
          {rows === null ? <div className="text-muted small">Loading…</div>
            : shown.length === 0 ? <div className="text-muted small">Nothing here.</div> : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.86rem" }}>
                  <thead className="table-light">
                    <tr><th>File</th><th>Stage</th><th>With</th><th>Documents</th><th>Sent by</th><th>Updated</th><th /></tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="fw-semibold">{r.folder_name}</div>
                          <div className="text-muted" style={{ fontSize: "0.72rem" }}>{r.folder_reference}</div>
                        </td>
                        <td><span className={`badge ${STAGE_BADGE[r.stage] || "text-bg-secondary"}`}>{r.stage_label}</span></td>
                        <td>{r.holder_label || "Registry Officer"}</td>
                        <td>{r.included_count} of {r.document_count}</td>
                        <td>{r.created_by_name || "—"}</td>
                        <td className="text-nowrap">{fmt(r.updated_at)}</td>
                        <td className="text-end">
                          <Link to={`/ed-mgt/file-routing/${r.id}`} className="btn btn-sm btn-outline-primary">Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

const FileRoutingList = () => (
  <DashboardLayout>
    <EDMSToastProvider />
    <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
      <FileRoutingTable />
    </div>
  </DashboardLayout>
);

export default FileRoutingList;
