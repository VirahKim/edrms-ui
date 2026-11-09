import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  getDocumentAccessPolicies,
  grantDocumentAccess,
  deleteDocumentAccessPolicy,
} from "../../../../api/edmsApi";
import apiClient from "../../../../api/apiClient";
import { toast } from "../../components/EDMSToast";

const ACCESS_LEVEL_LABELS = {
  VIEW:     { label: "View",     color: "text-bg-secondary" },
  DOWNLOAD: { label: "Download", color: "text-bg-info" },
  EDIT:     { label: "Edit",     color: "text-bg-warning" },
  FULL:     { label: "Full",     color: "text-bg-danger" },
};

const GRANTEE_ICONS = {
  USER: "ti-user",
  ROLE: "ti-shield",
  DEPARTMENT: "ti-building",
};

const granteeSelectStyles = {
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

const EMPTY_FORM = {
  grantee_type: "USER",
  grantee_id: "",
  access_level: "VIEW",
  expires_at: "",
};

/* ── DocumentSharesModal — grant/revoke document-level access overrides ── */
const DocumentSharesModal = ({ doc, onClose }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /* API responses aren't consistently shaped (bare array vs. wrapped object) — normalize defensively */
  const extractList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const loadShares = () => {
    setLoading(true);
    getDocumentAccessPolicies(doc.id)
      .then((r) => setShares(extractList(r?.data ?? r, "policies")))
      .catch(() => toast.error("Failed to load shares."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadShares(); }, [doc.id]);

  /* Load users, roles and departments for the grantee picker */
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [usersRes, rolesRes, deptsRes] = await Promise.all([
          apiClient.get("/IAmAPI/api/users"),
          apiClient.get("/IAmAPI/api/roles"),
          apiClient.get("/IAmAPI/api/departments/dropdown"),
        ]);
        setUsers(extractList(usersRes.data, "users"));
        setRoles(extractList(rolesRes.data, "roles"));
        setDepartments(extractList(deptsRes.data, "departments"));
      } catch (err) {
        console.error("Error loading share options:", err);
        toast.error("Failed to load users/roles/departments.");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  const granteeOptions =
    form.grantee_type === "USER" ? users :
    form.grantee_type === "ROLE" ? roles :
    departments;

  const granteeLabel = (opt) =>
    form.grantee_type === "USER"
      ? `${opt.first_name || ""} ${opt.other_name || ""}`.trim() + (opt.email_address ? ` (${opt.email_address})` : "")
      : opt.name;

  const granteeSelectOptions = granteeOptions.map((opt) => ({ value: String(opt.id), label: granteeLabel(opt) }));

  /* Resolve a grantee id → display name using the loaded options */
  const resolveGranteeName = (type, id) => {
    const list = type === "USER" ? users : type === "ROLE" ? roles : departments;
    const match = list.find((o) => String(o.id) === String(id));
    if (!match) return null;
    return type === "USER"
      ? `${match.first_name || ""} ${match.other_name || ""}`.trim()
      : match.name;
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!form.grantee_id.toString().trim()) {
      toast.error(`Please select a ${form.grantee_type.toLowerCase()}.`);
      return;
    }
    setSaving(true);
    try {
      await grantDocumentAccess(doc.id, {
        grantee_type: form.grantee_type,
        grantee_id: Number(form.grantee_id),
        access_level: form.access_level,
        expires_at: form.expires_at || null,
      });
      toast.success("Share granted.");
      setForm(EMPTY_FORM);
      loadShares();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to grant share.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (shareId) => {
    setRevoking(shareId);
    try {
      await deleteDocumentAccessPolicy(doc.id, shareId);
      toast.success("Share revoked.");
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to revoke share.");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-share me-2 text-primary" />
                Share Document — <span className="fw-normal">{doc.title}</span>
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body p-0">
              {/* Grant new share */}
              <div className="p-3 border-bottom">
                <p className="fw-semibold mb-2" style={{ fontSize: "0.875rem" }}>
                  Grant Access
                </p>
                <form onSubmit={handleGrant}>
                  <div className="row g-2 align-items-end">
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Grantee Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.grantee_type}
                        onChange={(e) => setForm((f) => ({ ...f, grantee_type: e.target.value, grantee_id: "" }))}
                      >
                        <option value="USER">User</option>
                        <option value="ROLE">Role</option>
                        <option value="DEPARTMENT">Department</option>
                      </select>
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>
                        {form.grantee_type === "USER" ? "User" : form.grantee_type === "ROLE" ? "Role" : "Department"}
                      </label>
                      <Select
                        options={granteeSelectOptions}
                        value={granteeSelectOptions.find((o) => o.value === String(form.grantee_id)) || null}
                        onChange={(opt) => set("grantee_id", opt ? opt.value : "")}
                        isClearable
                        isSearchable
                        isLoading={loadingOptions}
                        isDisabled={loadingOptions}
                        placeholder={`Search ${form.grantee_type === "USER" ? "users" : form.grantee_type === "ROLE" ? "roles" : "departments"}…`}
                        styles={granteeSelectStyles}
                        menuPlacement="bottom"
                        menuPortalTarget={document.body}
                      />
                    </div>
                    <div className="col-sm-2">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Access Level</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.access_level}
                        onChange={(e) => set("access_level", e.target.value)}
                      >
                        <option value="VIEW">View</option>
                        <option value="DOWNLOAD">Download</option>
                        <option value="EDIT">Edit</option>
                        <option value="FULL">Full</option>
                      </select>
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Expires (optional)</label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={form.expires_at}
                        onChange={(e) => set("expires_at", e.target.value)}
                      />
                    </div>
                    <div className="col-sm-1">
                      <button type="submit" className="btn btn-primary btn-sm w-100" disabled={saving}>
                        {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-plus" />}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Existing shares list */}
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {loading ? (
                  <div className="text-center py-4">
                    <span className="spinner-border spinner-border-sm text-muted" />
                  </div>
                ) : shares.length === 0 ? (
                  <div className="text-center py-4 text-muted" style={{ fontSize: "0.875rem" }}>
                    <i className="ti ti-lock-open" style={{ fontSize: 28 }} />
                    <p className="mt-2 mb-0">No shares yet. Grant access above.</p>
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ fontSize: "0.78rem" }}>Grantee</th>
                        <th style={{ fontSize: "0.78rem" }}>Access Level</th>
                        <th style={{ fontSize: "0.78rem" }}>Granted By</th>
                        <th style={{ fontSize: "0.78rem" }}>Expires</th>
                        <th style={{ fontSize: "0.78rem" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {shares.map((s) => {
                        const lvl = ACCESS_LEVEL_LABELS[s.access_level] || { label: s.access_level, color: "text-bg-secondary" };
                        return (
                          <tr key={s.id}>
                            <td>
                              <i className={`ti ${GRANTEE_ICONS[s.grantee_type] || "ti-user"} me-2 text-muted`} />
                              <span style={{ fontSize: "0.8rem" }}>
                                {resolveGranteeName(s.grantee_type, s.grantee_id) || `${s.grantee_type} #${s.grantee_id}`}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${lvl.color}`} style={{ fontSize: "0.7rem" }}>
                                {lvl.label}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                              #{s.granted_by}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                              {s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "Never"}
                            </td>
                            <td>
                              <button
                                className="btn btn-link btn-sm text-danger p-0"
                                onClick={() => handleRevoke(s.id)}
                                disabled={revoking === s.id}
                                title="Revoke"
                              >
                                {revoking === s.id ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <i className="ti ti-x" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentSharesModal;
