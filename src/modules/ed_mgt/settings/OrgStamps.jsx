import React, { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import DashboardLayout from "../../../layout/DashboardLayout";
import apiClient from "../../../api/apiClient";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import {
  listOrgStamps,
  createOrgStamp,
  updateOrgStamp,
  deactivateOrgStamp,
  getStampAuthorizedUsers,
  addStampAuthorizedUser,
  removeStampAuthorizedUser,
} from "../../../api/orgStampsApi";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "31px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#007bff" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.25rem rgba(2,115,92,.15)" : "none",
    "&:hover": { borderColor: "#007bff" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected ? "#007bff" : state.isFocused ? "#E1F5EE" : "transparent",
    color: state.isSelected ? "#fff" : "#212529",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const EMPTY_CREATE = { org_unit_id: "", name: "", description: "", file: null };

// A light chequerboard behind the picture, so a transparent stamp is visible and its real edges show.
const CHEQUER = {
  backgroundColor: "#fff",
  backgroundImage:
    "linear-gradient(45deg, #e9ecef 25%, transparent 25%), linear-gradient(-45deg, #e9ecef 25%, transparent 25%), " +
    "linear-gradient(45deg, transparent 75%, #e9ecef 75%), linear-gradient(-45deg, transparent 75%, #e9ecef 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0px",
};

// The stamp itself: shown at the size asked for, on the chequerboard; click to see it large.
const StampImage = ({ src, alt, size = 64, onClick }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const box = { width: size, height: size, borderRadius: 6, border: "1px solid #dee2e6", flex: "0 0 auto", ...CHEQUER };
  if (!src || failed) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ ...box, background: "#f8f9fa" }} title="The stamp image could not be shown">
        <i className="ti ti-photo-off" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} onError={() => setFailed(true)} onClick={onClick}
         title={onClick ? "Click to see the stamp full size" : undefined}
         style={{ ...box, objectFit: "contain", padding: 3, cursor: onClick ? "zoom-in" : "default" }} />
  );
};

// A picture of a file the user has just chosen, before it is uploaded.
const useFilePreview = (file) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) { setUrl(null); return undefined; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
};

// Digital "stamps" — the traditional round/rectangular office stamp, owned by
// an org unit (e.g. "Records Office") rather than a single user. See
// EDmsAPI/Migrations/add_org_stamps.sql for the schema and why the
// authorized-users roster is an explicit allow-list, not derived from live
// org-unit membership.
const OrgStamps = () => {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [orgUnits, setOrgUnits] = useState([]);
  const [loadingOrgUnits, setLoadingOrgUnits] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);

  const [manageTarget, setManageTarget] = useState(null); // the stamp being managed
  const [rosterUsers, setRosterUsers] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [grantingUser, setGrantingUser] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState(null);
  const [editFields, setEditFields] = useState({ name: "", description: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [replaceFile, setReplaceFile] = useState(null);

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [viewing, setViewing] = useState(null);          // the stamp shown full size
  const createPreview = useFilePreview(createForm.file);
  const replacePreview = useFilePreview(replaceFile);

  const load = useCallback(() => {
    setLoading(true);
    listOrgStamps({ include_inactive: true })
      .then((r) => setStamps(r?.data || []))
      .catch(() => toast.error("Failed to load stamps."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const extractList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  useEffect(() => {
    setLoadingOrgUnits(true);
    apiClient
      .get("/IAmAPI/api/OrganisationalUnits")
      .then((r) => setOrgUnits(extractList(r.data, "organisational_units")))
      .catch(() => toast.error("Failed to load org units."))
      .finally(() => setLoadingOrgUnits(false));

    setLoadingUsers(true);
    apiClient
      .get("/IAmAPI/api/users")
      .then((r) => setUsers(extractList(r.data, "users")))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoadingUsers(false));
  }, []);

  const orgUnitOptions = orgUnits.map((ou) => ({ value: String(ou.id), label: ou.name }));
  const orgUnitName = (id) => orgUnits.find((ou) => String(ou.id) === String(id))?.name || `Org unit #${id}`;

  const userLabel = (u) => `${u.first_name || ""} ${u.other_name || ""}`.trim() + (u.email_address ? ` (${u.email_address})` : "");
  const userSelectOptions = users
    .filter((u) => !rosterUsers.some((r) => String(r.user_id) === String(u.id)))
    .map((u) => ({ value: String(u.id), label: userLabel(u) }));

  const resolveUserName = (userId) => {
    const match = users.find((u) => String(u.id) === String(userId));
    return match ? userLabel(match) : `User #${userId}`;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.org_unit_id) { toast.error("Please select an org unit."); return; }
    if (!createForm.name.trim()) { toast.error("Please enter a stamp name."); return; }
    if (!createForm.file) { toast.error("Please choose a stamp image."); return; }
    setCreating(true);
    try {
      await createOrgStamp(Number(createForm.org_unit_id), createForm.name.trim(), createForm.description.trim() || null, createForm.file);
      toast.success("Stamp created.");
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create stamp.");
    } finally {
      setCreating(false);
    }
  };

  const openManage = (stamp) => {
    setManageTarget(stamp);
    setEditFields({ name: stamp.name, description: stamp.description || "" });
    setReplaceFile(null);
    setAddUserId("");
    setLoadingRoster(true);
    getStampAuthorizedUsers(stamp.id)
      .then((r) => setRosterUsers(r?.data || []))
      .catch(() => toast.error("Failed to load authorized users."))
      .finally(() => setLoadingRoster(false));
  };

  const closeManage = () => {
    setManageTarget(null);
    setRosterUsers([]);
  };

  const handleSaveEdit = async () => {
    if (!manageTarget) return;
    setSavingEdit(true);
    try {
      await updateOrgStamp(manageTarget.id, {
        name: editFields.name.trim(),
        description: editFields.description.trim(),
        file: replaceFile || undefined,
      });
      toast.success("Stamp updated.");
      setReplaceFile(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update stamp.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleGrantUser = async () => {
    if (!manageTarget || !addUserId) return;
    setGrantingUser(true);
    try {
      await addStampAuthorizedUser(manageTarget.id, Number(addUserId));
      toast.success("User authorized.");
      setAddUserId("");
      const r = await getStampAuthorizedUsers(manageTarget.id);
      setRosterUsers(r?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to authorize user.");
    } finally {
      setGrantingUser(false);
    }
  };

  const handleRevokeUser = async (userId) => {
    if (!manageTarget) return;
    setRevokingUserId(userId);
    try {
      await removeStampAuthorizedUser(manageTarget.id, userId);
      toast.success("User removed.");
      setRosterUsers((prev) => prev.filter((r) => r.user_id !== userId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove user.");
    } finally {
      setRevokingUserId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateOrgStamp(deactivateTarget.id);
      toast.success(`Deactivated "${deactivateTarget.name}".`);
      setDeactivateTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate stamp.");
      setDeactivateTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-0">Org Stamps</h4>
            <small className="text-muted">
              Traditional office stamps (e.g. &ldquo;Records Office&rdquo;), owned by an org unit rather than a
              single person. Only users on a stamp&rsquo;s authorized list can apply it to a document.
            </small>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>
            <i className="ti ti-plus me-1" />New Stamp
          </button>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: "0.78rem" }}>Stamp</th>
                  <th style={{ fontSize: "0.78rem" }}>Org Unit</th>
                  <th style={{ fontSize: "0.78rem" }}>Status</th>
                  <th style={{ fontSize: "0.78rem" }}>Created By</th>
                  <th style={{ fontSize: "0.78rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4"><span className="spinner-border spinner-border-sm text-muted" /></td></tr>
                ) : stamps.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-muted">
                    <i className="ti ti-stamp" style={{ fontSize: 28 }} />
                    <p className="mt-2 mb-0">No stamps yet. Create one above.</p>
                  </td></tr>
                ) : (
                  stamps.map((s) => (
                    <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.55 }}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <StampImage src={s.public_url} alt={s.name} size={64} onClick={() => setViewing(s)} />
                          <div>
                            <div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{s.name}</div>
                            {s.description && <div className="text-muted" style={{ fontSize: "0.75rem" }}>{s.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>{orgUnitName(s.org_unit_id)}</td>
                      <td>
                        {s.is_active
                          ? <span className="badge bg-success-subtle text-success border">Active</span>
                          : <span className="badge bg-secondary-subtle text-secondary border">Deactivated</span>}
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>{s.created_by_name || `User #${s.created_by}`}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openManage(s)}>
                          <i className="ti ti-settings me-1" />Manage
                        </button>
                        {s.is_active && (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setDeactivateTarget(s)}>
                            <i className="ti ti-x" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* The stamp, full size */}
      {viewing && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1055 }} onClick={() => setViewing(null)} />
          <div className="modal fade show d-block" style={{ zIndex: 1060 }} tabIndex={-1} role="dialog" aria-modal="true" onClick={() => setViewing(null)}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content shadow">
                <div className="modal-header border-bottom py-2">
                  <h6 className="modal-title mb-0"><i className="ti ti-stamp me-2 text-primary" />{viewing.name}</h6>
                  <button type="button" className="btn-close" onClick={() => setViewing(null)} aria-label="Close" />
                </div>
                <div className="modal-body text-center">
                  <StampImage src={viewing.public_url} alt={viewing.name} size={320} />
                  <div className="text-muted small mt-2">{[orgUnitName(viewing.org_unit_id), viewing.description].filter(Boolean).join(" · ")}</div>
                  {!viewing.is_active && <span className="badge bg-secondary-subtle text-secondary border mt-1">Deactivated</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setShowCreate(false)} />
          <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title"><i className="ti ti-stamp me-2 text-primary" />New Stamp</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreate(false)} aria-label="Close" />
                </div>
                <form onSubmit={handleCreate}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Org Unit</label>
                      <Select
                        options={orgUnitOptions}
                        value={orgUnitOptions.find((o) => o.value === String(createForm.org_unit_id)) || null}
                        onChange={(opt) => setCreateForm((f) => ({ ...f, org_unit_id: opt ? opt.value : "" }))}
                        isClearable
                        isSearchable
                        isLoading={loadingOrgUnits}
                        placeholder="Search org units…"
                        styles={selectStyles}
                        menuPlacement="bottom"
                        menuPortalTarget={document.body}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Records Office"
                        value={createForm.name}
                        onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Description (optional)</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={createForm.description}
                        onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="mb-1">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Stamp Image (PNG or JPEG)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="form-control form-control-sm"
                        onChange={(e) => setCreateForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
                      />
                      <small className="text-muted">A transparent PNG of the physical stamp works best.</small>
                      {createPreview && (
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <StampImage src={createPreview} alt="Chosen stamp" size={110} />
                          <small className="text-muted">This is how the stamp will look.</small>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                      {creating ? <span className="spinner-border spinner-border-sm" /> : "Create Stamp"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Manage modal — edit fields + authorized-users roster */}
      {manageTarget && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={closeManage} />
          <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title">
                    <i className="ti ti-stamp me-2 text-primary" />
                    Manage — <span className="fw-normal">{manageTarget.name}</span>
                  </h5>
                  <button type="button" className="btn-close" onClick={closeManage} aria-label="Close" />
                </div>
                <div className="modal-body p-0">
                  <div className="p-3 border-bottom">
                    <p className="fw-semibold mb-2" style={{ fontSize: "0.875rem" }}>Details</p>
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editFields.name}
                          onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="col-12 d-flex flex-wrap align-items-center gap-3">
                        <div>
                          <div className="text-muted" style={{ fontSize: "0.72rem" }}>Current stamp</div>
                          <StampImage src={manageTarget.public_url} alt={manageTarget.name} size={120} onClick={() => setViewing(manageTarget)} />
                        </div>
                        {replacePreview && (
                          <>
                            <i className="ti ti-arrow-right text-muted" />
                            <div>
                              <div className="text-muted" style={{ fontSize: "0.72rem" }}>New image (not saved yet)</div>
                              <StampImage src={replacePreview} alt="New stamp" size={120} />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Replace Image (optional)</label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="form-control form-control-sm"
                          onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label" style={{ fontSize: "0.8rem" }}>Description</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={editFields.description}
                          onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="text-end mt-2">
                      <button className="btn btn-sm btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                        {savingEdit ? <span className="spinner-border spinner-border-sm" /> : "Save Changes"}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 border-bottom">
                    <p className="fw-semibold mb-2" style={{ fontSize: "0.875rem" }}>Authorize a User</p>
                    <div className="d-flex gap-2 align-items-end">
                      <div className="flex-grow-1">
                        <Select
                          options={userSelectOptions}
                          value={userSelectOptions.find((o) => o.value === addUserId) || null}
                          onChange={(opt) => setAddUserId(opt ? opt.value : "")}
                          isClearable
                          isSearchable
                          isLoading={loadingUsers}
                          placeholder="Search users…"
                          styles={selectStyles}
                          menuPlacement="bottom"
                          menuPortalTarget={document.body}
                        />
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={handleGrantUser} disabled={grantingUser || !addUserId}>
                        {grantingUser ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-plus" />}
                      </button>
                    </div>
                    <small className="text-muted">Anyone already authorized can hand this stamp to another user.</small>
                  </div>

                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {loadingRoster ? (
                      <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-muted" /></div>
                    ) : rosterUsers.length === 0 ? (
                      <div className="text-center py-4 text-muted" style={{ fontSize: "0.875rem" }}>
                        <i className="ti ti-users" style={{ fontSize: 24 }} />
                        <p className="mt-2 mb-0">No one is authorized to apply this stamp yet.</p>
                      </div>
                    ) : (
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ fontSize: "0.78rem" }}>User</th>
                            <th style={{ fontSize: "0.78rem" }}>Granted By</th>
                            <th style={{ fontSize: "0.78rem" }}>Since</th>
                            <th style={{ fontSize: "0.78rem" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rosterUsers.map((r) => (
                            <tr key={r.id}>
                              <td style={{ fontSize: "0.82rem" }}>{r.user_name || resolveUserName(r.user_id)}</td>
                              <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>{r.granted_by_name || `User #${r.granted_by}`}</td>
                              <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>{new Date(r.granted_at).toLocaleDateString()}</td>
                              <td>
                                <button
                                  className="btn btn-link btn-sm text-danger p-0"
                                  onClick={() => handleRevokeUser(r.user_id)}
                                  disabled={revokingUserId === r.user_id || rosterUsers.length <= 1}
                                  title={rosterUsers.length <= 1 ? "Cannot remove the last authorized user — deactivate the stamp instead" : "Remove"}
                                >
                                  {revokingUserId === r.user_id ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-x" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeManage}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        show={!!deactivateTarget}
        title="Deactivate Stamp"
        message={`Deactivate "${deactivateTarget?.name}"? It will no longer be available to apply to documents. This can't be undone from here.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </DashboardLayout>
  );
};

export default OrgStamps;
