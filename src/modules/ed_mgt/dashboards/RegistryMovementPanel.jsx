import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listFileRoutings } from "../../../api/fileRoutingApi";
import { STAGE_BADGE } from "../utils/fileRoutingStages";
import { toast } from "../../ed_mgt/components/EDMSToast";

// The File Movement process, in the order a file moves through it. `stages` lists the
// file routing stages that count toward each step.
const PROCESS_STEPS = [
  { label: "With Marking Officer", stages: ["MARKING"], tone: "primary" },
  { label: "Back with Registry", stages: ["RETURNED_FROM_MARKING", "RETURNED_FROM_ACTION"], tone: "warning" },
  { label: "With Action Officer", stages: ["ACTION"], tone: "info" },
  { label: "Filed away", stages: ["FILED_AWAY"], tone: "success" },
];

// Action has been taken once the Action Officer has sent the file back, or it has been filed away.
const ACTION_DONE_STAGES = ["RETURNED_FROM_ACTION", "FILED_AWAY"];

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

/**
 * Registry Officer's view of every file currently or recently in the File Movement
 * process: where each file is, whether it went to the Marking Officer and Action
 * Officer, and whether action has been taken. Loaded when first opened.
 * Movement is tracked per file (folder), with a selection of its documents - not per document.
 */
const RegistryMovementPanel = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listFileRoutings()
      .then((res) => {
        const list = res?.data ?? res ?? [];
        setItems(Array.isArray(list) ? list : []);
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to load file movements."))
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const countFor = (stages) => items.filter((i) => stages.includes(i.stage)).length;
  const actionTaken = items.filter((i) => ACTION_DONE_STAGES.includes(i.stage)).length;

  return (
    <div className="card border-0 shadow-sm mb-2">
      <div className="card-header bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 px-3">
        <div>
          <h6 className="mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>File movements</h6>
          <div className="text-muted" style={{ fontSize: "0.72rem" }}>
            Track each file sent to the Marking Officer and Action Officers, and whether action has been taken.
          </div>
        </div>
        <div className="d-flex gap-2">
          {open && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>
              <i className="ti ti-refresh me-1" />Refresh
            </button>
          )}
          <button type="button" className="btn btn-sm btn-primary" onClick={toggle}>
            <i className={`ti ${open ? "ti-eye-off" : "ti-list-details"} me-1`} />
            {open ? "Hide movements" : "Show movements"}
          </button>
        </div>
      </div>

      {open && (
        <div className="card-body p-3">
          {loading && !loaded ? (
            <div className="text-muted small">Loading file movements…</div>
          ) : (
            <>
              {/* Process: how many files are at each step of the File Movement process */}
              <div className="d-flex flex-wrap align-items-stretch gap-2 mb-3">
                {PROCESS_STEPS.map((step, idx) => (
                  <React.Fragment key={step.label}>
                    <div className={`border rounded px-3 py-2 flex-fill border-${step.tone}`} style={{ minWidth: 150 }}>
                      <div className="text-muted" style={{ fontSize: "0.7rem" }}>Step {idx + 1}</div>
                      <div className="fw-semibold" style={{ fontSize: "0.8rem" }}>{step.label}</div>
                      <div className={`fw-semibold text-${step.tone}`} style={{ fontSize: "1rem" }}>{countFor(step.stages)}</div>
                    </div>
                    {idx < PROCESS_STEPS.length - 1 && (
                      <div className="d-flex align-items-center text-muted"><i className="ti ti-arrow-right" /></div>
                    )}
                  </React.Fragment>
                ))}
                <div className="border rounded px-3 py-2 flex-fill border-success" style={{ minWidth: 150 }}>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>Action taken</div>
                  <div className="fw-semibold" style={{ fontSize: "0.8rem" }}>Files the officers have acted on</div>
                  <div className="fw-semibold text-success" style={{ fontSize: "1rem" }}>{actionTaken}</div>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-muted small">No files have been moved yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.82rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th>File</th>
                        <th>Current stage</th>
                        <th>With</th>
                        <th>Documents</th>
                        <th>Action taken</th>
                        <th>Sent by</th>
                        <th>Last activity</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td>
                            <div className="fw-semibold">{it.folder_name || `File #${it.folder_id}`}</div>
                            {it.folder_reference && <div className="text-muted small">{it.folder_reference}</div>}
                          </td>
                          <td>
                            <span className={`badge ${STAGE_BADGE[it.stage] || "text-bg-secondary"}`}>{it.stage_label}</span>
                          </td>
                          <td>{it.holder_label || "Registry Officer"}</td>
                          <td>{it.included_count} of {it.document_count}</td>
                          <td>
                            {ACTION_DONE_STAGES.includes(it.stage)
                              ? <span className="badge text-bg-success">Yes</span>
                              : <span className="badge text-bg-light border text-muted">No</span>}
                          </td>
                          <td>{it.created_by_name || "—"}</td>
                          <td className="text-muted text-nowrap">{formatDate(it.updated_at)}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/ed-mgt/file-routing/${it.id}`)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RegistryMovementPanel;
