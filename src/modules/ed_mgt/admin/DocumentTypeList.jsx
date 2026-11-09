import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import {
  getDocumentTypes, getConfidentialityLevels,
  createDocumentType, deleteDocumentType,
} from "../../../api/edmsApi";

const TypeCard = ({ type, onDelete, onClick }) => (
  <div
    className="card border-0 shadow-sm h-100"
    style={{ cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    onClick={onClick}
  >
    <div className="card-body">
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 44, height: 44, background: type.ocr_enabled ? "linear-gradient(135deg,#003d80,#007bff)" : "linear-gradient(135deg,#3395ff,#66b0ff)" }}
        >
          <i className="ti ti-file-text text-white" style={{ fontSize: "1.3rem" }} />
        </div>
        <button
          className="btn btn-link btn-sm p-0 text-danger"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete(type); }}
          disabled={type.is_system}
        >
          <i className="ti ti-trash" />
        </button>
      </div>
      <h6 className="fw-semibold mb-1 text-truncate" title={type.name}>{type.name}</h6>
      <div className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>
        <code style={{ fontSize: "0.72rem" }}>{type.code}</code>
      </div>
      {type.ocr_enabled && (
        <span className="badge text-bg-primary" style={{ fontSize: "0.7rem" }}>
          <i className="ti ti-scan me-1" />OCR
        </span>
      )}
      {!type.is_active && (
        <span className="badge text-bg-warning ms-1" style={{ fontSize: "0.7rem" }}>Inactive</span>
      )}
      {type.description && (
        <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.78rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {type.description}
        </p>
      )}
    </div>
    <div className="card-footer bg-transparent border-top py-2 d-flex align-items-center justify-content-between">
      <span className="text-muted" style={{ fontSize: "0.72rem" }}>
        <i className="ti ti-lock me-1" />{(type.default_confidentiality_level || "INTERNAL").replace(/_/g, " ")}
      </span>
      <span className="text-primary" style={{ fontSize: "0.72rem" }}>
        <i className="ti ti-settings me-1" />Configure <i className="ti ti-arrow-right" />
      </span>
    </div>
  </div>
);

const CreateModal = ({ confidentialityLevels, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: "", code: "", description: "",
    default_confidentiality_level: "INTERNAL", ocr_enabled: false,
    workflow_process_code: "", is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const autoCode = (name) =>
    name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    if (!form.code.trim()) { toast.error("Code is required."); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description || undefined,
        default_confidentiality_level: form.default_confidentiality_level,
        ocr_enabled: form.ocr_enabled,
        workflow_process_code: form.workflow_process_code || undefined,
        is_active: form.is_active,
      };
      const res = await createDocumentType(payload);
      const created = res?.data ?? res;
      toast.success(`Document type "${form.name}" created.`);
      onCreated(created);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create document type.");
    } finally {
      setLoading(false);
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
                <i className="ti ti-file-plus me-2 text-primary" />New Document Type
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                    <input
                      type="text" className="form-control" value={form.name} required
                      onChange={(e) => { set("name", e.target.value); if (!form.code || form.code === autoCode(form.name)) set("code", autoCode(e.target.value)); }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Code <span className="text-danger">*</span></label>
                    <input
                      type="text" className="form-control font-monospace" value={form.code} required
                      onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                      maxLength={30}
                    />
                    <div className="form-text">Unique identifier, e.g. TAX_INV</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Default Confidentiality</label>
                    <select className="form-select" value={form.default_confidentiality_level} onChange={(e) => set("default_confidentiality_level", e.target.value)}>
                      {confidentialityLevels.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Workflow Process Code</label>
                    <input type="text" className="form-control font-monospace" value={form.workflow_process_code}
                      onChange={(e) => set("workflow_process_code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))} />
                    <div className="form-text">e.g. INVOICE_APPROVAL</div>
                  </div>
                  <div className="col-md-6 d-flex flex-column gap-2 justify-content-center pt-3">
                    <div className="form-check form-switch">
                      <input type="checkbox" className="form-check-input" id="ocr-enabled" checked={form.ocr_enabled} onChange={(e) => set("ocr_enabled", e.target.checked)} />
                      <label className="form-check-label" htmlFor="ocr-enabled">OCR Enabled</label>
                    </div>
                    <div className="form-check form-switch">
                      <input type="checkbox" className="form-check-input" id="is-active" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                      <label className="form-check-label" htmlFor="is-active">Active</label>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : <><i className="ti ti-plus me-1" />Create Type</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

const DocumentTypeList = () => {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getDocumentTypes()
      .then((r) => {
        const items = r?.data?.items || r?.data || (Array.isArray(r) ? r : []);
        setTypes(items);
      })
      .catch(() => toast.error("Failed to load document types."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getConfidentialityLevels()
      .then((r) => setConfidentialityLevels(Array.isArray(r?.data) ? r.data : (r?.data?.items || [])))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocumentType(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = types.filter((t) =>
    !search.trim() ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Document Type"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone and will affect documents using this type.`}
        confirmLabel="Delete Type"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {showCreate && (
        <CreateModal
          confidentialityLevels={confidentialityLevels}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            load();
            if (created?.id) navigate(`/ed-mgt/admin/document-types/${created.id}`);
          }}
        />
      )}

      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        {/* Search bar */}
        <div className="row mb-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text" className="form-control border-start-0" placeholder="Search types…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary" onClick={() => setSearch("")}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          </div>
          <div className="col-auto ms-auto d-flex align-items-center gap-2">
            {!loading && <span className="text-muted" style={{ fontSize: "0.875rem" }}>{filtered.length} type{filtered.length !== 1 ? "s" : ""}</span>}
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <i className="ti ti-plus me-1" />New Document Type
            </button>
          </div>
        </div>

        {loading ? (
          <div className="row g-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm">
                  <div className="card-body placeholder-glow">
                    <div className="placeholder rounded mb-3" style={{ width: 44, height: 44 }} />
                    <span className="placeholder col-8 d-block mb-2" />
                    <span className="placeholder col-5 d-block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="ti ti-file-off" style={{ fontSize: 56, color: "#dee2e6" }} />
            <h5 className="mt-3">{search ? `No types match "${search}"` : "No document types yet"}</h5>
            {search ? (
              <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => setSearch("")}>Clear search</button>
            ) : (
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowCreate(true)}>
                <i className="ti ti-plus me-1" />Create first type
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((type) => (
              <div key={type.id} className="col-md-4 col-lg-3">
                <TypeCard
                  type={type}
                  onClick={() => navigate(`/ed-mgt/admin/document-types/${type.id}`)}
                  onDelete={setDeleteTarget}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DocumentTypeList;
