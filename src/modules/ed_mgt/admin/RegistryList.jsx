import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import { getRegistries, createRegistry, deleteRegistry } from "../../../api/edmsApi";

export const REGISTRY_TYPES = [
  { value: "CENTRAL", label: "Central Registry (sees every file)" },
  { value: "HR", label: "HR Registry" },
  { value: "SECRET", label: "Secret Registry" },
  { value: "TECHNICAL", label: "Technical Registry" },
  { value: "OTHER", label: "Other sub-registry" },
];

const unwrapList = (r) => r?.data?.items || r?.data || (Array.isArray(r) ? r : []);

const RegistryCard = ({ registry, onDelete, onClick }) => (
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
          style={{ width: 44, height: 44, background: "linear-gradient(135deg,#3d5a80,#98c1d9)" }}
        >
          <i className="ti ti-building-warehouse text-white" style={{ fontSize: "1.3rem" }} />
        </div>
        <button
          className="btn btn-link btn-sm p-0 text-danger"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onDelete(registry); }}
        >
          <i className="ti ti-trash" />
        </button>
      </div>
      <h6 className="fw-semibold mb-1 text-truncate" title={registry.name}>{registry.name}</h6>
      <div className="text-muted mb-2" style={{ fontSize: "0.78rem" }}>
        {registry.cabinet_count} cabinet{registry.cabinet_count !== 1 ? "s" : ""}
      </div>
      {!registry.is_active && (
        <span className="badge text-bg-warning" style={{ fontSize: "0.7rem" }}>Inactive</span>
      )}
      {registry.description && (
        <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.78rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {registry.description}
        </p>
      )}
    </div>
    <div className="card-footer bg-transparent border-top py-2 d-flex align-items-center justify-content-between">
      <span className="text-muted" style={{ fontSize: "0.72rem" }}>
        <i className="ti ti-map-pin me-1" />Physical Registry
      </span>
      <span className="text-primary" style={{ fontSize: "0.72rem" }}>
        <i className="ti ti-settings me-1" />Manage <i className="ti ti-arrow-right" />
      </span>
    </div>
  </div>
);

const CreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ name: "", description: "", registry_type: "CENTRAL" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setLoading(true);
    try {
      const res = await createRegistry({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        registry_type: form.registry_type,
      });
      const created = res?.data ?? res;
      toast.success(`Registry "${form.name}" created.`);
      onCreated(created);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create registry.");
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
                <i className="ti ti-building-warehouse me-2 text-primary" />New Registry
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                  <input
                    type="text" className="form-control" value={form.name} required autoFocus
                    placeholder="e.g., Main Records Registry"
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Type</label>
                  <select className="form-select" value={form.registry_type} onChange={(e) => set("registry_type", e.target.value)}>
                    {REGISTRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="form-text">
                    The Central Registry oversees every file. People who work in a sub-registry see only that registry's
                    files and get that registry's own dashboard.
                  </div>
                </div>
                <div className="mb-1">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea className="form-control" rows={2} value={form.description}
                    placeholder="Optional — e.g. building/floor/room details"
                    onChange={(e) => set("description", e.target.value)} />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : <><i className="ti ti-plus me-1" />Create Registry</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

const RegistryList = () => {
  const navigate = useNavigate();
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getRegistries()
      .then((r) => setRegistries(unwrapList(r)))
      .catch(() => toast.error("Failed to load registries."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRegistry(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete registry.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = registries.filter((r) =>
    !search.trim() || r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Registry"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. Registries with cabinets cannot be deleted.`}
        confirmLabel="Delete Registry"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            load();
            if (created?.id) navigate(`/ed-mgt/admin/locations/${created.id}`);
          }}
        />
      )}

      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 className="mb-0">Physical Locations</h4>
        </div>
        <p className="text-muted mb-3" style={{ fontSize: "0.875rem" }}>
          Define the Registries, Cabinets, and Shelves used to track where paper files are physically stored.
          Each file can then be assigned a Registry, Cabinet, and Shelf.
        </p>

        <div className="row mb-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text" className="form-control border-start-0" placeholder="Search registries…"
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
            {!loading && <span className="text-muted" style={{ fontSize: "0.875rem" }}>{filtered.length} registr{filtered.length !== 1 ? "ies" : "y"}</span>}
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <i className="ti ti-plus me-1" />New Registry
            </button>
          </div>
        </div>

        {loading ? (
          <div className="row g-3">
            {Array.from({ length: 4 }).map((_, i) => (
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
            <i className="ti ti-building-warehouse" style={{ fontSize: 56, color: "#dee2e6" }} />
            <h5 className="mt-3">{search ? `No registries match "${search}"` : "No registries yet"}</h5>
            {search ? (
              <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => setSearch("")}>Clear search</button>
            ) : (
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowCreate(true)}>
                <i className="ti ti-plus me-1" />Create first registry
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((registry) => (
              <div key={registry.id} className="col-md-4 col-lg-3">
                <RegistryCard
                  registry={registry}
                  onClick={() => navigate(`/ed-mgt/admin/locations/${registry.id}`)}
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

export default RegistryList;
