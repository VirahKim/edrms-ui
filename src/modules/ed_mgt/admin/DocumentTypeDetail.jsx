import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import {
  getDocumentType, getTypeFields, getFieldOptions, getConfidentialityLevels,
  getTypeAccessPolicies, grantTypeAccess, deleteTypeAccessPolicy,
  updateDocumentType,
  createTypeField, updateTypeField, deleteTypeField,
  createFieldOption, deleteFieldOption,
} from "../../../api/edmsApi";

const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "DATETIME", "BOOLEAN", "LOOKUP", "REFERENCE"];
const ACCESS_LEVELS = ["VIEW", "DOWNLOAD", "EDIT", "FULL", "CUSTOM"];

/* ── helpers ── */
const unwrapFields = (r) =>
  Array.isArray(r) ? r
  : Array.isArray(r?.data) ? r.data
  : Array.isArray(r?.items) ? r.items
  : [];

const unwrapList = (r) =>
  r?.data?.items || r?.data || (Array.isArray(r) ? r : []);

/* ═══════════════════════════════════════════════════════════════
   Field Options Editor (used inside FieldModal for LOOKUP)
═══════════════════════════════════════════════════════════════ */
const OptionsEditor = ({ typeId, fieldId }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newCode, setNewCode] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!fieldId) return;
    setLoading(true);
    getFieldOptions(typeId, fieldId)
      .then((r) => setOptions(unwrapList(r)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeId, fieldId]);

  useEffect(() => { load(); }, [load]);

  const autoCode = (label) =>
    label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30);

  const addOption = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await createFieldOption(typeId, fieldId, {
        option_label: newLabel.trim(),
        option_code: newCode.trim() || autoCode(newLabel.trim()),
        sort_order: options.length + 1,
      });
      setNewLabel(""); setNewCode("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add option.");
    } finally {
      setSaving(false);
    }
  };

  const removeOption = async (opt) => {
    try {
      await deleteFieldOption(typeId, fieldId, opt.id);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove option.");
    }
  };

  return (
    <div className="mt-3 border rounded p-3" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
      <div className="fw-semibold mb-2" style={{ fontSize: "0.85rem" }}>
        <i className="ti ti-list me-1 text-primary" />Lookup Options
      </div>
      {loading ? (
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>Loading…</div>
      ) : (
        <div className="mb-2">
          {options.length === 0 ? (
            <div className="text-muted mb-2" style={{ fontSize: "0.8rem" }}>No options yet.</div>
          ) : (
            <div className="d-flex flex-wrap gap-1 mb-2">
              {options.map((o) => (
                <span key={o.id} className="badge text-bg-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: "0.78rem" }}>
                  {o.option_label}
                  <button
                    type="button" className="btn-close btn-close-white p-0 ms-1"
                    style={{ fontSize: "0.55rem" }}
                    onClick={() => removeOption(o)}
                  />
                </span>
              ))}
            </div>
          )}
          <div className="d-flex gap-2">
            <input
              type="text" className="form-control form-control-sm" placeholder="Option label"
              value={newLabel}
              onChange={(e) => { setNewLabel(e.target.value); if (!newCode) setNewCode(autoCode(e.target.value)); }}
              style={{ maxWidth: 180 }}
            />
            <input
              type="text" className="form-control form-control-sm font-monospace" placeholder="Code"
              value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
              style={{ maxWidth: 120 }}
            />
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOption} disabled={saving || !newLabel.trim()}>
              {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-plus" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Field Editor Modal
═══════════════════════════════════════════════════════════════ */
const FieldModal = ({ typeId, field, ocrEnabled, onClose, onSaved }) => {
  const isEdit = !!field?.id;

  const autoCode = (label) =>
    label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);

  const [form, setForm] = useState({
    field_label: field?.field_label || "",
    field_code: field?.field_code || "",
    field_type: field?.field_type || "TEXT",
    is_mandatory: field?.is_mandatory ?? false,
    is_searchable: field?.is_searchable ?? true,
    ocr_field_hint: field?.ocr_field_hint || "",
    sort_order: field?.sort_order ?? 1,
    validation_max_length: "",
    validation_min: "",
    validation_max: "",
  });

  useEffect(() => {
    if (field?.validation_rules) {
      try {
        const r = typeof field.validation_rules === "string"
          ? JSON.parse(field.validation_rules)
          : field.validation_rules;
        setForm((f) => ({
          ...f,
          validation_max_length: r?.max_length ?? "",
          validation_min: r?.min ?? "",
          validation_max: r?.max ?? "",
        }));
      } catch {}
    }
  }, [field]);

  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const buildValidation = () => {
    const r = {};
    if (form.field_type === "TEXT" && form.validation_max_length !== "") r.max_length = Number(form.validation_max_length);
    if (form.field_type === "NUMBER") {
      if (form.validation_min !== "") r.min = Number(form.validation_min);
      if (form.validation_max !== "") r.max = Number(form.validation_max);
    }
    return Object.keys(r).length ? JSON.stringify(r) : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.field_label.trim()) { toast.error("Label is required."); return; }
    if (!form.field_code.trim()) { toast.error("Code is required."); return; }
    setLoading(true);
    try {
      const payload = {
        field_label: form.field_label.trim(),
        field_code: form.field_code.trim(),
        field_type: form.field_type,
        is_mandatory: form.is_mandatory,
        is_searchable: form.is_searchable,
        sort_order: Number(form.sort_order) || 1,
        ocr_field_hint: ocrEnabled && form.ocr_field_hint ? form.ocr_field_hint : undefined,
        validation_rules: buildValidation(),
      };
      if (isEdit) {
        await updateTypeField(typeId, field.id, payload);
      } else {
        await createTypeField(typeId, payload);
      }
      toast.success(`Field "${form.field_label}" ${isEdit ? "updated" : "created"}.`);
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save field.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className={`ti ${isEdit ? "ti-pencil" : "ti-plus"} me-2 text-primary`} />
                {isEdit ? "Edit Field" : "Add Metadata Field"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Field Label <span className="text-danger">*</span></label>
                    <input
                      type="text" className="form-control" value={form.field_label} required
                      onChange={(e) => {
                        set("field_label", e.target.value);
                        if (!isEdit || form.field_code === autoCode(form.field_label))
                          set("field_code", autoCode(e.target.value));
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Field Code <span className="text-danger">*</span></label>
                    <input
                      type="text" className="form-control font-monospace" value={form.field_code} required
                      onChange={(e) => set("field_code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                      maxLength={50}
                    />
                    <div className="form-text">Unique key, e.g. INVOICE_DATE</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Field Type</label>
                    <select className="form-select" value={form.field_type} onChange={(e) => set("field_type", e.target.value)}>
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Sort Order</label>
                    <input type="number" className="form-control" value={form.sort_order} min={1}
                      onChange={(e) => set("sort_order", e.target.value)} />
                  </div>
                  <div className="col-md-4 d-flex flex-column gap-2 justify-content-center pt-3">
                    <div className="form-check form-switch">
                      <input type="checkbox" className="form-check-input" id="is-mandatory"
                        checked={form.is_mandatory} onChange={(e) => set("is_mandatory", e.target.checked)} />
                      <label className="form-check-label" htmlFor="is-mandatory">Mandatory</label>
                    </div>
                    <div className="form-check form-switch">
                      <input type="checkbox" className="form-check-input" id="is-searchable"
                        checked={form.is_searchable} onChange={(e) => set("is_searchable", e.target.checked)} />
                      <label className="form-check-label" htmlFor="is-searchable">Searchable</label>
                    </div>
                  </div>

                  {/* Validation rules */}
                  {form.field_type === "TEXT" && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Max Length</label>
                      <input type="number" className="form-control" value={form.validation_max_length} min={1}
                        onChange={(e) => set("validation_max_length", e.target.value)} placeholder="Unlimited" />
                    </div>
                  )}
                  {form.field_type === "NUMBER" && (
                    <>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Min Value</label>
                        <input type="number" className="form-control" value={form.validation_min}
                          onChange={(e) => set("validation_min", e.target.value)} placeholder="None" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Max Value</label>
                        <input type="number" className="form-control" value={form.validation_max}
                          onChange={(e) => set("validation_max", e.target.value)} placeholder="None" />
                      </div>
                    </>
                  )}

                  {/* OCR hint */}
                  {ocrEnabled && (
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <i className="ti ti-scan me-1 text-primary" />OCR Field Hint
                      </label>
                      <input type="text" className="form-control" value={form.ocr_field_hint}
                        onChange={(e) => set("ocr_field_hint", e.target.value)}
                        placeholder="Label as it appears on the document, e.g. 'Invoice Date'" />
                    </div>
                  )}
                </div>

                {/* LOOKUP options — only when editing an existing LOOKUP field */}
                {form.field_type === "LOOKUP" && isEdit && (
                  <OptionsEditor typeId={typeId} fieldId={field.id} />
                )}
                {form.field_type === "LOOKUP" && !isEdit && (
                  <div className="alert alert-info d-flex align-items-center gap-2 py-2 mt-3">
                    <i className="ti ti-info-circle" />
                    <small>Save the field first, then edit it to add lookup options.</small>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="ti ti-check me-1" />{isEdit ? "Save Changes" : "Add Field"}</>}
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
const SettingsTab = ({ typeData, confidentialityLevels, onUpdated }) => {
  const [form, setForm] = useState({
    name: typeData.name || "",
    code: typeData.code || "",
    description: typeData.description || "",
    default_confidentiality_level: typeData.default_confidentiality_level || "INTERNAL",
    ocr_enabled: typeData.ocr_enabled ?? false,
    workflow_process_code: typeData.workflow_process_code || "",
    is_active: typeData.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        default_confidentiality_level: form.default_confidentiality_level,
        ocr_enabled: form.ocr_enabled,
        workflow_process_code: form.workflow_process_code || undefined,
        is_active: form.is_active,
      };
      await updateDocumentType(typeData.id, payload);
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
        <div className="col-md-6">
          <label className="form-label fw-semibold">Code</label>
          <input type="text" className="form-control font-monospace" value={form.code} disabled />
          <div className="form-text">Code cannot be changed after creation.</div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Default Confidentiality</label>
          <select className="form-select" value={form.default_confidentiality_level}
            onChange={(e) => set("default_confidentiality_level", e.target.value)}>
            {confidentialityLevels.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Workflow Process Code</label>
          <input type="text" className="form-control font-monospace" value={form.workflow_process_code}
            onChange={(e) => set("workflow_process_code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            placeholder="e.g. INVOICE_APPROVAL" />
        </div>
        <div className="col-md-6 d-flex flex-column gap-2 justify-content-center pt-3">
          <div className="form-check form-switch">
            <input type="checkbox" className="form-check-input" id="s-ocr"
              checked={form.ocr_enabled} onChange={(e) => set("ocr_enabled", e.target.checked)} />
            <label className="form-check-label" htmlFor="s-ocr">OCR Enabled</label>
          </div>
          <div className="form-check form-switch">
            <input type="checkbox" className="form-check-input" id="s-active"
              checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            <label className="form-check-label" htmlFor="s-active">Active</label>
          </div>
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
   Fields Tab
═══════════════════════════════════════════════════════════════ */
const FIELD_TYPE_BADGE = {
  TEXT: "text-bg-secondary", NUMBER: "text-bg-info", DATE: "text-bg-warning",
  DATETIME: "text-bg-warning", BOOLEAN: "text-bg-success", LOOKUP: "text-bg-primary",
  REFERENCE: "text-bg-dark",
};

const FieldsTab = ({ typeId, ocrEnabled }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTypeFields(typeId)
      .then((r) => setFields(unwrapFields(r)))
      .catch(() => toast.error("Failed to load fields."))
      .finally(() => setLoading(false));
  }, [typeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTypeField(typeId, deleteTarget.id);
      toast.success(`Field "${deleteTarget.field_label}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete field.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Field"
        message={`Delete field "${deleteTarget?.field_label}"? This will remove all saved values for this field on existing documents.`}
        confirmLabel="Delete Field"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {(showAdd || editTarget) && (
        <FieldModal
          typeId={typeId}
          field={editTarget || null}
          ocrEnabled={ocrEnabled}
          onClose={() => { setShowAdd(false); setEditTarget(null); }}
          onSaved={() => { setShowAdd(false); setEditTarget(null); load(); }}
        />
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="text-muted" style={{ fontSize: "0.875rem" }}>
          {!loading && <span>{fields.length} field{fields.length !== 1 ? "s" : ""} configured</span>}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <i className="ti ti-plus me-1" />Add Field
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
      ) : fields.length === 0 ? (
        <div className="text-center py-5 text-muted border rounded-3 bg-light">
          <i className="ti ti-database-off" style={{ fontSize: 48, color: "#dee2e6" }} />
          <h6 className="mt-3">No metadata fields yet</h6>
          <p style={{ fontSize: "0.875rem" }}>Fields you add here will appear during document upload.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <i className="ti ti-plus me-1" />Add First Field
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 40, fontSize: "0.8rem" }}>#</th>
                <th style={{ fontSize: "0.8rem" }}>Label</th>
                <th style={{ fontSize: "0.8rem" }}>Code</th>
                <th style={{ fontSize: "0.8rem" }}>Type</th>
                <th style={{ fontSize: "0.8rem" }}>Mandatory</th>
                <th style={{ fontSize: "0.8rem" }}>Searchable</th>
                {ocrEnabled && <th style={{ fontSize: "0.8rem" }}>OCR Hint</th>}
                <th style={{ width: 80, fontSize: "0.8rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {[...fields].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)).map((f) => (
                <tr key={f.id}>
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>{f.sort_order ?? "—"}</td>
                  <td>
                    <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>{f.field_label}</span>
                    {f.is_mandatory && <span className="text-danger ms-1">*</span>}
                  </td>
                  <td><code style={{ fontSize: "0.75rem" }}>{f.field_code}</code></td>
                  <td>
                    <span className={`badge ${FIELD_TYPE_BADGE[f.field_type] || "text-bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
                      {f.field_type}
                    </span>
                  </td>
                  <td>
                    {f.is_mandatory
                      ? <i className="ti ti-check text-success" />
                      : <i className="ti ti-minus text-muted" />}
                  </td>
                  <td>
                    {f.is_searchable
                      ? <i className="ti ti-check text-success" />
                      : <i className="ti ti-minus text-muted" />}
                  </td>
                  {ocrEnabled && (
                    <td style={{ fontSize: "0.8rem", color: "#6c757d" }}>
                      {f.ocr_field_hint || <span className="text-muted">—</span>}
                    </td>
                  )}
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary border-0" title="Edit"
                        onClick={() => setEditTarget(f)}>
                        <i className="ti ti-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger border-0" title="Delete"
                        onClick={() => setDeleteTarget(f)}>
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
   Access Policies Tab
═══════════════════════════════════════════════════════════════ */
const AccessTab = ({ typeId }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    grantee_type: "ROLE", grantee_id: "", access_level: "VIEW",
    can_upload: false, can_view: true, can_download: true, can_approve: false, can_manage_access: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTypeAccessPolicies(typeId)
      .then((r) => setPolicies(unwrapList(r)))
      .catch(() => toast.error("Failed to load policies."))
      .finally(() => setLoading(false));
  }, [typeId]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!form.grantee_id.trim()) { toast.error("Grantee ID is required."); return; }
    setSaving(true);
    try {
      await grantTypeAccess(typeId, {
        grantee_type: form.grantee_type,
        grantee_id: Number(form.grantee_id) || form.grantee_id,
        access_level: form.access_level,
        permissions: form.access_level === "CUSTOM" ? {
          can_upload: form.can_upload, can_view: form.can_view,
          can_download: form.can_download, can_approve: form.can_approve,
          can_manage_access: form.can_manage_access,
        } : undefined,
      });
      toast.success("Access granted.");
      setForm((f) => ({ ...f, grantee_id: "" }));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to grant access.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTypeAccessPolicy(typeId, deleteTarget.id);
      toast.success("Access revoked.");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to revoke access.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const PERM_ICONS = { can_upload: "ti-upload", can_view: "ti-eye", can_download: "ti-download", can_approve: "ti-thumb-up", can_manage_access: "ti-shield" };

  return (
    <div>
      <ConfirmModal
        show={!!deleteTarget}
        title="Revoke Access"
        message={`Revoke ${deleteTarget?.access_level} access for grantee #${deleteTarget?.grantee_id}?`}
        confirmLabel="Revoke"
        danger
        onConfirm={handleRevoke}
        onCancel={() => setDeleteTarget(null)}
      />

      {loading ? (
        <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
      ) : policies.length === 0 ? (
        <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
          <i className="ti ti-info-circle" />
          <span style={{ fontSize: "0.875rem" }}>No access policies defined yet. All users inherit their default permissions.</span>
        </div>
      ) : (
        <div className="table-responsive mb-4">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
            <thead className="table-light">
              <tr>
                <th style={{ fontSize: "0.8rem" }}>Grantee Type</th>
                <th style={{ fontSize: "0.8rem" }}>Grantee ID</th>
                <th style={{ fontSize: "0.8rem" }}>Access Level</th>
                <th style={{ fontSize: "0.8rem" }}>Permissions</th>
                <th style={{ fontSize: "0.8rem" }}>Granted By</th>
                <th style={{ width: 60, fontSize: "0.8rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="badge text-bg-secondary">{p.grantee_type}</span>
                  </td>
                  <td>{p.grantee_name || `#${p.grantee_id}`}</td>
                  <td>
                    <span className={`badge ${p.access_level === "FULL" ? "text-bg-danger" : p.access_level === "EDIT" ? "text-bg-warning" : "text-bg-success"}`}>
                      {p.access_level}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {p.permissions && Object.entries(PERM_ICONS).map(([key, icon]) =>
                        p.permissions[key] ? (
                          <i key={key} className={`ti ${icon} text-success`} title={key.replace("can_", "")} />
                        ) : null
                      )}
                      {!p.permissions && <span className="text-muted" style={{ fontSize: "0.75rem" }}>Default for level</span>}
                    </div>
                  </td>
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>{p.created_by_name || `#${p.created_by}`}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => setDeleteTarget(p)} title="Revoke">
                      <i className="ti ti-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card border-0 bg-light">
        <div className="card-header bg-transparent border-bottom py-2">
          <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>
            <i className="ti ti-shield-plus me-1 text-primary" />Grant Access
          </span>
        </div>
        <div className="card-body">
          <form onSubmit={handleGrant}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: "0.8rem" }}>Grantee Type</label>
                <select className="form-select form-select-sm" value={form.grantee_type} onChange={(e) => set("grantee_type", e.target.value)}>
                  {["USER", "ROLE", "DEPARTMENT"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: "0.8rem" }}>Grantee ID</label>
                <input type="text" className="form-control form-control-sm" value={form.grantee_id}
                  onChange={(e) => set("grantee_id", e.target.value)} placeholder="User/Role/Dept ID" required />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: "0.8rem" }}>Access Level</label>
                <select className="form-select form-select-sm" value={form.access_level} onChange={(e) => set("access_level", e.target.value)}>
                  {ACCESS_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button type="submit" className="btn btn-primary btn-sm w-100" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : <><i className="ti ti-shield-plus me-1" />Grant</>}
                </button>
              </div>
              {form.access_level === "CUSTOM" && (
                <div className="col-12">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.8rem" }}>Custom Permissions</label>
                  <div className="d-flex flex-wrap gap-3">
                    {Object.entries(PERM_ICONS).map(([key, icon]) => (
                      <div className="form-check" key={key}>
                        <input type="checkbox" className="form-check-input" id={`perm-${key}`}
                          checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                        <label className="form-check-label" htmlFor={`perm-${key}`} style={{ fontSize: "0.8rem" }}>
                          <i className={`ti ${icon} me-1`} />{key.replace("can_", "").replace("_", " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main DocumentTypeDetail
═══════════════════════════════════════════════════════════════ */
const DocumentTypeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [typeData, setTypeData] = useState(null);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("settings");

  const loadType = useCallback(() => {
    getDocumentType(id)
      .then((r) => {
        const d = r?.data ?? r;
        setTypeData(d);
      })
      .catch(() => toast.error("Failed to load document type."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadType(); }, [loadType]);
  useEffect(() => {
    getConfidentialityLevels()
      .then((r) => setConfidentialityLevels(unwrapList(r)))
      .catch(() => {});
  }, []);

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

  if (!typeData) {
    return (
      <DashboardLayout>
        <EDMSToastProvider />
        <div className="pc-content text-center py-5" style={{ fontFamily: FONT_FAMILY }}>
          <i className="ti ti-file-off" style={{ fontSize: 56, color: "#dee2e6" }} />
          <h5 className="mt-3 text-muted">Document type not found.</h5>
          <Link to="/ed-mgt/admin/document-types" className="btn btn-outline-secondary mt-2">Back to Types</Link>
        </div>
      </DashboardLayout>
    );
  }

  const TABS = [
    { key: "settings", icon: "ti-settings", label: "Settings" },
    { key: "fields",   icon: "ti-list",     label: "Metadata Fields" },
    { key: "access",   icon: "ti-shield",   label: "Access Policies" },
  ];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
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
                    {t.key === "fields" && typeData && (
                      <span className="badge text-bg-secondary ms-2" style={{ fontSize: "0.65rem" }}>
                        {/* field count shown in tab body */}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body p-4">
            <div style={{ display: tab === "settings" ? "block" : "none" }}>
              <SettingsTab
                typeData={typeData}
                confidentialityLevels={confidentialityLevels}
                onUpdated={loadType}
              />
            </div>
            <div style={{ display: tab === "fields" ? "block" : "none" }}>
              <FieldsTab
                typeId={typeData.id}
                ocrEnabled={typeData.ocr_enabled}
              />
            </div>
            <div style={{ display: tab === "access" ? "block" : "none" }}>
              <AccessTab typeId={typeData.id} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentTypeDetail;
