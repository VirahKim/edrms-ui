import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { listPartiesForManagement, createParty, updateParty } from "../../../api/registersApi";
import EDMSToastProvider, { toast } from "../components/EDMSToast";

const KIND_LABELS = { SOURCE: "Sender", DESTINATION: "Recipient", BOTH: "Sender & recipient" };

/**
 * Mail Senders: the names offered under "Received From" in Upload, and "Sent to" in the
 * Outward Register. List, add, rename (a correction is carried onto the register entries
 * that use the name) and switch a name off so it is no longer offered.
 */
const MailSenders = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState(null);

  const reload = () =>
    listPartiesForManagement()
      .then((res) => setParties(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch((err) => toast.error(err?.response?.data?.message || "Could not load the list."))
      .finally(() => setLoading(false));

  useEffect(() => { reload(); }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parties.filter((p) => (showInactive || p.is_active) && (!q || p.name.toLowerCase().includes(q)));
  }, [parties, search, showInactive]);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await createParty({ name, party_kind: "SOURCE" });
      setNewName("");
      toast.success(`Added "${name}".`);
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not add the name.");
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (p) => {
    const name = editName.trim();
    if (!name) return;
    if (name === p.name) { setEditingId(null); return; }
    setBusyId(p.id);
    try {
      await updateParty(p.id, { name });
      toast.success(p.entries_count > 0 ? `Renamed. ${p.entries_count} register entr${p.entries_count === 1 ? "y was" : "ies were"} updated.` : "Renamed.");
      setEditingId(null);
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not rename.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (p) => {
    setBusyId(p.id);
    try {
      await updateParty(p.id, { is_active: !p.is_active });
      await reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">Mail Senders</h5>
            <div className="text-muted small">
              The names offered under <strong>Received From</strong> when filing mail. Fix a misspelling here and the Inward Mail Register is corrected too.
            </div>
          </div>
          <Link to="/ed-mgt/registers/inward" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-book me-1" />Inward Mail Register
          </Link>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-md-5">
                <label className="form-label small fw-semibold">Add a sender</label>
                <div className="input-group input-group-sm">
                  <input className="form-control" placeholder="Name of the person or office" value={newName} maxLength={200}
                         onChange={(e) => setNewName(e.target.value)}
                         onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
                  <button type="button" className="btn btn-primary" onClick={add} disabled={adding || !newName.trim()}>
                    {adding ? "Adding…" : <><i className="ti ti-plus me-1" />Add</>}
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Search</label>
                <input className="form-control form-control-sm" placeholder="Find a name" value={search}
                       onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="col-md-3">
                <div className="form-check mt-4">
                  <input className="form-check-input" type="checkbox" id="senders-inactive" checked={showInactive}
                         onChange={(e) => setShowInactive(e.target.checked)} />
                  <label className="form-check-label small" htmlFor="senders-inactive">Show switched-off names</label>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-muted small">Loading…</div>
            ) : shown.length === 0 ? (
              <div className="text-muted small">No names found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Used as</th>
                      <th className="text-end">Register entries</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p) => (
                      <tr key={p.id} className={p.is_active ? "" : "text-muted"}>
                        <td style={{ minWidth: 260 }}>
                          {editingId === p.id ? (
                            <input className="form-control form-control-sm" value={editName} autoFocus maxLength={200}
                                   onChange={(e) => setEditName(e.target.value)}
                                   onKeyDown={(e) => { if (e.key === "Enter") saveEdit(p); if (e.key === "Escape") setEditingId(null); }} />
                          ) : p.name}
                        </td>
                        <td>{KIND_LABELS[p.party_kind] || p.party_kind}</td>
                        <td className="text-end">{p.entries_count}</td>
                        <td>
                          <span className={`badge ${p.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                            {p.is_active ? "Active" : "Switched off"}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          {editingId === p.id ? (
                            <>
                              <button className="btn btn-sm btn-primary me-1" disabled={busyId === p.id || !editName.trim()} onClick={() => saveEdit(p)}>Save</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-sm btn-outline-primary me-1" disabled={busyId === p.id}
                                      onClick={() => { setEditingId(p.id); setEditName(p.name); }}>
                                <i className="ti ti-edit me-1" />Edit
                              </button>
                              <button className={`btn btn-sm ${p.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                                      disabled={busyId === p.id} onClick={() => toggleActive(p)}>
                                {p.is_active ? "Switch off" : "Switch on"}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MailSenders;
