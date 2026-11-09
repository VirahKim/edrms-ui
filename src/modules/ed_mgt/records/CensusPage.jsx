import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import {
  createCensus, listCensus, getCensus, checkCensusEntry, closeCensus, downloadCensusExcel,
} from "../../../api/recordsApi";
import { toast } from "../components/EDMSToast";

const errorOf = (err, fallback) => err?.response?.data?.message || fallback;
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const STATUS = {
  FOUND: { label: "Found", tone: "success" },
  MISSING: { label: "Missing", tone: "danger" },
  NOT_CHECKED: { label: "Not checked", tone: "secondary" },
};

/**
 * File census (Table 4): an inventory of every physical file. Records officers visit
 * the offices, check each file off as found or missing, and the list is kept for
 * validation.
 */
const CensusPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [censusDate, setCensusDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState("ALL");
  const [conductedBy, setConductedBy] = useState("");

  const loadSessions = useCallback(() => {
    listCensus()
      .then((res) => setSessions(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch((err) => toast.error(errorOf(err, "Could not load censuses.")));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const open = useCallback((id) => {
    getCensus(id)
      .then((res) => {
        const data = res?.data ?? res;
        setSelected(data.session);
        setEntries(data.entries || []);
      })
      .catch((err) => toast.error(errorOf(err, "Could not open the census.")));
  }, []);

  const start = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await createCensus({ title: title.trim(), census_date: censusDate, scope, conducted_by: conductedBy.trim() || null });
      const created = res?.data ?? res;
      toast.success("Census started. Every file has been listed.");
      setTitle("");
      loadSessions();
      open(created.id);
    } catch (err) {
      toast.error(errorOf(err, "The census could not be started."));
    } finally {
      setBusy(false);
    }
  };

  const record = async (entry, status) => {
    const body = { status };
    if (status === "FOUND") {
      body.found_location = window.prompt("Where was the file found? (room, cabinet, shelf)", entry.recorded_location || "") || null;
    }
    body.inventory_officer_name = window.prompt("Name of the inventory officer:") || null;
    body.remarks = status === "MISSING" ? (window.prompt("Remarks (optional):") || null) : null;
    try {
      await checkCensusEntry(selected.id, entry.id, body);
      open(selected.id);
      loadSessions();
    } catch (err) {
      toast.error(errorOf(err, "The check could not be recorded."));
    }
  };

  const close = async () => {
    if (!window.confirm("Close this census? You will not be able to change the checks after this.")) return;
    try {
      await closeCensus(selected.id);
      toast.success("Census closed.");
      open(selected.id);
      loadSessions();
    } catch (err) {
      toast.error(errorOf(err, "The census could not be closed."));
    }
  };

  const exportExcel = () => downloadCensusExcel(selected.id)
    .catch((err) => toast.error(errorOf(err, "The Excel file could not be created.")));

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="mb-3">
          <h5 className="fw-semibold mb-1">File census</h5>
          <div className="text-muted small">Check every physical file against its recorded location. Missing files are reported.</div>
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-5">
                <label className="form-label small fw-semibold">Title</label>
                <input className="form-control form-control-sm" placeholder="e.g. Room 3 census, October" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Census date</label>
                <input type="date" className="form-control form-control-sm" value={censusDate} onChange={(e) => setCensusDate(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Covers</label>
                <select className="form-select form-select-sm" value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="ALL">All files</option>
                  <option value="HR">Personnel files only</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Conducted by</label>
                <input className="form-control form-control-sm" placeholder="Office and P/NO" value={conductedBy} onChange={(e) => setConductedBy(e.target.value)} maxLength={500} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary btn-sm" onClick={start} disabled={!title.trim() || busy}>Start a new census</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent small fw-semibold">Censuses</div>
              <div className="list-group list-group-flush">
                {sessions.length === 0 && <div className="p-3 text-muted small">No censuses yet.</div>}
                {sessions.map((s) => (
                  <button key={s.id} type="button" onClick={() => open(s.id)}
                    className={`list-group-item list-group-item-action text-start ${selected?.id === s.id ? "active" : ""}`}>
                    <div className="fw-semibold small">{s.title}</div>
                    <div className="small">
                      {fmt(s.census_date)} · {s.found} found · {s.missing} missing · {s.not_checked} not checked
                      {s.closed_at ? " · closed" : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            {!selected ? (
              <div className="text-muted small">Choose a census to check files.</div>
            ) : (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                      <div className="fw-semibold">{selected.title}</div>
                      <div className="small text-muted">{fmt(selected.census_date)} · {selected.closed_at ? "Closed" : "Open for checking"}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-success" onClick={exportExcel}>
                        <i className="ti ti-file-spreadsheet me-1" />Download Excel
                      </button>
                      {!selected.closed_at && (
                        <button className="btn btn-sm btn-outline-danger" onClick={close}>Close census</button>
                      )}
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.82rem" }}>
                      <thead className="table-light">
                        <tr><th>File reference</th><th>Subject</th><th>Recorded location</th><th>Status</th><th>Found at</th><th>Officer</th><th /></tr>
                      </thead>
                      <tbody>
                        {entries.map((e) => {
                          const st = STATUS[e.status] || STATUS.NOT_CHECKED;
                          return (
                            <tr key={e.id}>
                              <td className="fw-semibold">{e.reference_no}</td>
                              <td>{e.subject}</td>
                              <td>{e.recorded_location || "—"}</td>
                              <td><span className={`badge text-bg-${st.tone}`}>{st.label}</span></td>
                              <td>{e.found_location || "—"}</td>
                              <td>{e.inventory_officer_name || "—"}</td>
                              <td className="text-end text-nowrap">
                                {!selected.closed_at && (
                                  <>
                                    <button className="btn btn-sm btn-outline-success me-1" onClick={() => record(e, "FOUND")}>Found</button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => record(e, "MISSING")}>Missing</button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CensusPage;
