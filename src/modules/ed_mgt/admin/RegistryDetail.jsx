import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import {
  getRegistry, updateRegistry,
  getCabinets, createCabinet, updateCabinet, deleteCabinet,
  getShelves, createShelf, updateShelf, deleteShelf,
  getRegistryUsers, setRegistryUsers,
} from "../../../api/edmsApi";
import UserSelect from "../../communication/components/UserSelect";
import { REGISTRY_TYPES } from "./RegistryList";

const unwrapList = (r) => r?.data?.items || r?.data || (Array.isArray(r) ? r : []);

/* ═══════════════════════════════════════════════════════════════
   Shelf Manager Modal (shelves belonging to one Cabinet)
═══════════════════════════════════════════════════════════════ */
const ShelfManagerModal = ({ cabinet, onClose }) => {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getShelves(cabinet.id)
      .then((r) => setShelves(unwrapList(r)))
      .catch(() => toast.error("Failed to load shelves."))
      .finally(() => setLoading(false));
  }, [cabinet.id]);

  useEffect(() => { load(); }, [load]);

  const addShelf = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createShelf(cabinet.id, { name: newName.trim(), description: newDesc.trim() || undefined });
      setNewName(""); setNewDesc("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add shelf.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget.name.trim()) return;
    setSaving(true);
    try {
      await updateShelf(cabinet.id, editTarget.id, { name: editTarget.name.trim(), description: editTarget.description || undefined });
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update shelf.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShelf(cabinet.id, deleteTarget.id);
      toast.success(`Shelf "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete shelf.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1060 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1070 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-stack-2 me-2 text-primary" />Shelves in "{cabinet.name}"
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <ConfirmModal
                show={!!deleteTarget}
                title="Delete Shelf"
                message={`Delete "${deleteTarget?.name}"? Shelves with files assigned cannot be deleted.`}
                confirmLabel="Delete Shelf"
                danger
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
              />

              {loading ? (
                <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
              ) : shelves.length === 0 ? (
                <div className="text-muted text-center py-3" style={{ fontSize: "0.875rem" }}>No shelves yet.</div>
              ) : (
                <div className="table-responsive mb-3">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ fontSize: "0.8rem" }}>Name</th>
                        <th style={{ fontSize: "0.8rem" }}>Description</th>
                        <th style={{ width: 90, fontSize: "0.8rem" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shelves.map((s) => (
                        <tr key={s.id}>
                          {editTarget?.id === s.id ? (
                            <td colSpan={3}>
                              <form onSubmit={saveEdit} className="d-flex gap-2 align-items-center">
                                <input type="text" className="form-control form-control-sm" value={editTarget.name}
                                  onChange={(e) => setEditTarget((t) => ({ ...t, name: e.target.value }))} required />
                                <input type="text" className="form-control form-control-sm" placeholder="Description"
                                  value={editTarget.description || ""}
                                  onChange={(e) => setEditTarget((t) => ({ ...t, description: e.target.value }))} />
                                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>Save</button>
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
                              </form>
                            </td>
                          ) : (
                            <>
                              <td style={{ fontSize: "0.875rem" }}>
                                {s.name}
                                {!s.is_active && <span className="badge text-bg-warning ms-2" style={{ fontSize: "0.65rem" }}>Inactive</span>}
                              </td>
                              <td className="text-muted" style={{ fontSize: "0.8rem" }}>{s.description || "—"}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-outline-primary border-0" title="Edit" onClick={() => setEditTarget(s)}>
                                    <i className="ti ti-pencil" />
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger border-0" title="Delete" onClick={() => setDeleteTarget(s)}>
                                    <i className="ti ti-trash" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <form onSubmit={addShelf} className="d-flex gap-2 border-top pt-3">
                <input type="text" className="form-control form-control-sm" placeholder="New shelf name"
                  value={newName} onChange={(e) => setNewName(e.target.value)} />
                <input type="text" className="form-control form-control-sm" placeholder="Description (optional)"
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                <button type="submit" className="btn btn-sm btn-outline-primary text-nowrap" disabled={saving || !newName.trim()}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : <><i className="ti ti-plus me-1" />Add Shelf</>}
                </button>
              </form>
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Cabinet Editor Modal
═══════════════════════════════════════════════════════════════ */
const CabinetModal = ({ registryId, cabinet, onClose, onSaved }) => {
  const isEdit = !!cabinet?.id;
  const [form, setForm] = useState({ name: cabinet?.name || "", description: cabinet?.description || "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setLoading(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined };
      if (isEdit) await updateCabinet(registryId, cabinet.id, payload);
      else await createCabinet(registryId, payload);
      toast.success(`Cabinet "${form.name}" ${isEdit ? "updated" : "created"}.`);
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save cabinet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className={`ti ${isEdit ? "ti-pencil" : "ti-plus"} me-2 text-primary`} />
                {isEdit ? "Edit Cabinet" : "New Cabinet"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" value={form.name} required autoFocus
                    onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="mb-1">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea className="form-control" rows={2} value={form.description}
                    onChange={(e) => set("description", e.target.value)} />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="ti ti-check me-1" />{isEdit ? "Save Changes" : "Create Cabinet"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Settings Tab
═══════════════════════════════════════════════════════════════ */
const SettingsTab = ({ registryData, onUpdated }) => {
  const [form, setForm] = useState({
    name: registryData.name || "",
    description: registryData.description || "",
    is_active: registryData.is_active ?? true,
    registry_type: registryData.registry_type || "CENTRAL",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateRegistry(registryData.id, {
        name: form.name.trim(),
        description: form.description || undefined,
        is_active: form.is_active,
        registry_type: form.registry_type,
      });
      toast.success("Settings saved.");
      onUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
          <input type="text" className="form-control" value={form.name} required
            onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="col-md-6 d-flex align-items-center pt-4">
          <div className="form-check form-switch">
            <input type="checkbox" className="form-check-input" id="s-active"
              checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            <label className="form-check-label" htmlFor="s-active">Active</label>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Type</label>
          <select className="form-select" value={form.registry_type} onChange={(e) => set("registry_type", e.target.value)}>
            {REGISTRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="form-text">Decides what the registry's people see and which dashboard they land on.</div>
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold">Description</label>
          <textarea className="form-control" rows={3} value={form.description}
            onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>
      <div className="mt-4 d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="ti ti-device-floppy me-1" />Save Settings</>}
        </button>
      </div>
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Cabinets Tab
═══════════════════════════════════════════════════════════════ */
const CabinetsTab = ({ registryId }) => {
  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [shelvesTarget, setShelvesTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getCabinets(registryId)
      .then((r) => setCabinets(unwrapList(r)))
      .catch(() => toast.error("Failed to load cabinets."))
      .finally(() => setLoading(false));
  }, [registryId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCabinet(registryId, deleteTarget.id);
      toast.success(`Cabinet "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete cabinet.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Cabinet"
        message={`Delete "${deleteTarget?.name}"? Cabinets with shelves cannot be deleted.`}
        confirmLabel="Delete Cabinet"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {(showAdd || editTarget) && (
        <CabinetModal
          registryId={registryId}
          cabinet={editTarget}
          onClose={() => { setShowAdd(false); setEditTarget(null); }}
          onSaved={() => { setShowAdd(false); setEditTarget(null); load(); }}
        />
      )}
      {shelvesTarget && (
        <ShelfManagerModal cabinet={shelvesTarget} onClose={() => setShelvesTarget(null)} />
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="text-muted" style={{ fontSize: "0.875rem" }}>
          {!loading && <span>{cabinets.length} cabinet{cabinets.length !== 1 ? "s" : ""}</span>}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <i className="ti ti-plus me-1" />Add Cabinet
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
      ) : cabinets.length === 0 ? (
        <div className="text-center py-5 text-muted border rounded-3 bg-light">
          <i className="ti ti-archive-off" style={{ fontSize: 48, color: "#dee2e6" }} />
          <h6 className="mt-3">No cabinets yet</h6>
          <p style={{ fontSize: "0.875rem" }}>Add cabinets to this registry, then manage the shelves within each one.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus me-1" />Add First Cabinet
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ fontSize: "0.8rem" }}>Name</th>
                <th style={{ fontSize: "0.8rem" }}>Description</th>
                <th style={{ fontSize: "0.8rem" }}>Shelves</th>
                <th style={{ width: 170, fontSize: "0.8rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {cabinets.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>{c.name}</span>
                    {!c.is_active && <span className="badge text-bg-warning ms-2" style={{ fontSize: "0.65rem" }}>Inactive</span>}
                  </td>
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>{c.description || "—"}</td>
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>{c.shelf_count}</td>
                  <td>
                    <div className="d-flex gap-1 justify-content-end">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setShelvesTarget(c)}>
                        <i className="ti ti-stack-2 me-1" />Shelves
                      </button>
                      <button className="btn btn-sm btn-outline-primary border-0" title="Edit" onClick={() => setEditTarget(c)}>
                        <i className="ti ti-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger border-0" title="Delete" onClick={() => setDeleteTarget(c)}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Users Tab — who works in this registry
   Optional per user: someone tied to a registry sees only that registry's files (and files with
   no registry); someone tied to none is not limited.
═══════════════════════════════════════════════════════════════ */
const UsersTab = ({ registryId, isCentral }) => {
  const [userIds, setUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRegistryUsers(registryId)
      .then((r) => setUserIds((unwrapList(r) || []).map((u) => u.user_id)))
      .catch(() => toast.error("Failed to load registry users."))
      .finally(() => setLoading(false));
  }, [registryId]);

  const save = async () => {
    setSaving(true);
    try {
      await setRegistryUsers(registryId, userIds);
      toast.success("Registry users saved.");
      setDirty(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save registry users.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4"><span className="spinner-border text-primary" /></div>;

  return (
    <div>
      <div className="alert alert-light border small">
        <i className="ti ti-info-circle me-1" />
        People listed here work in this registry and see only this registry's files (and files with no registry).
        A person can belong to more than one registry. People who are not listed in any registry are not limited
        and see files as before. Administrators are never limited.
      </div>
      <label className="form-label fw-semibold">Users in this registry</label>
      <UserSelect isMulti value={userIds} onChange={(ids) => { setUserIds(ids || []); setDirty(true); }}
                  placeholder="Search and add people…" />
      <div className="mt-3 d-flex justify-content-end">
        <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="ti ti-device-floppy me-1" />Save Users</>}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main RegistryDetail
═══════════════════════════════════════════════════════════════ */
const RegistryDetail = () => {
  const { id } = useParams();
  const [registryData, setRegistryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("settings");

  const loadRegistry = useCallback(() => {
    getRegistry(id)
      .then((r) => setRegistryData(r?.data ?? r))
      .catch(() => toast.error("Failed to load registry."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadRegistry(); }, [loadRegistry]);

  if (loading) {
    return (
      <DashboardLayout>
        <EDMSToastProvider />
        <div className="pc-content d-flex justify-content-center align-items-center" style={{ minHeight: "60vh", fontFamily: FONT_FAMILY }}>
          <span className="spinner-border text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!registryData) {
    return (
      <DashboardLayout>
        <EDMSToastProvider />
        <div className="pc-content text-center py-5" style={{ fontFamily: FONT_FAMILY }}>
          <i className="ti ti-building-warehouse" style={{ fontSize: 56, color: "#dee2e6" }} />
          <h5 className="mt-3 text-muted">Registry not found.</h5>
          <Link to="/ed-mgt/admin/locations" className="btn btn-outline-secondary mt-2">Back to Physical Locations</Link>
        </div>
      </DashboardLayout>
    );
  }

  const TABS = [
    { key: "settings", icon: "ti-settings",           label: "Settings" },
    { key: "cabinets",  icon: "ti-building-warehouse", label: "Cabinets" },
    { key: "users",     icon: "ti-users",              label: "Users" },
  ];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/ed-mgt/admin/locations" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left" />
          </Link>
          <h4 className="mb-0">{registryData.name}</h4>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom py-0">
            <ul className="nav nav-tabs border-0">
              {TABS.map((t) => (
                <li key={t.key} className="nav-item">
                  <button
                    className={`nav-link border-0 ${tab === t.key ? "active fw-semibold" : "text-muted"}`}
                    style={{ padding: "14px 18px" }}
                    onClick={() => setTab(t.key)}
                  >
                    <i className={`ti ${t.icon} me-1`} />{t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body p-4">
            <div style={{ display: tab === "settings" ? "block" : "none" }}>
              <SettingsTab registryData={registryData} onUpdated={loadRegistry} />
            </div>
            <div style={{ display: tab === "cabinets" ? "block" : "none" }}>
              <CabinetsTab registryId={registryData.id} />
            </div>
            <div style={{ display: tab === "users" ? "block" : "none" }}>
              <UsersTab registryId={registryData.id} isCentral={(registryData.registry_type || "CENTRAL") === "CENTRAL"} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegistryDetail;
