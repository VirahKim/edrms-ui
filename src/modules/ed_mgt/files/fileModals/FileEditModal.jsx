import React, { useState, useEffect } from "react";
import { updateFile, getConfidentialityLevels, getRegistries, getCabinets, getShelves } from "../../../../api/edmsApi";
import apiClient from "../../../../api/apiClient";
import { toast } from "../../components/EDMSToast";

const PRESET_COLORS = [
  "#667eea", "#f093fb", "#43e97b", "#f5a623",
  "#e53e3e", "#2563eb", "#16a34a", "#9333ea",
];

const SCOPE_OPTIONS = [
  { value: "ORGANIZATION", icon: "ti-building", label: "Organization", desc: "Visible to everyone" },
  { value: "DEPARTMENT",   icon: "ti-users",    label: "Department",   desc: "Visible to your department" },
  { value: "PERSONAL",     icon: "ti-user",     label: "Personal",     desc: "Visible only to you" },
];

const unwrapList = (r) => r?.data?.items || r?.data || (Array.isArray(r) ? r : []);

const FileEditModal = ({ file, onUpdated, onClose }) => {
  const [form, setForm] = useState({
    name: file.name || "",
    description: file.description || "",
    color: file.color || "#007bff",
    scope: file.scope || "ORGANIZATION",
    department_id: file.department_id || "",
    reference_no: file.reference_no || "",
    volume_no: file.volume_no || "",
    confidentiality_level: file.confidentiality_level || "INTERNAL",
    registry_id: file.registry_id || "",
    cabinet_id: file.cabinet_id || "",
    shelf_id: file.shelf_id || "",
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [registries, setRegistries] = useState([]);
  const [cabinets, setCabinets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loadingCabinets, setLoadingCabinets] = useState(false);
  const [loadingShelves, setLoadingShelves] = useState(false);

  /* Load departments for the Department-scope selector */
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const res = await apiClient.get("/IAmAPI/api/departments/dropdown");
        setDepartments(res.data || []);
      } catch (err) {
        console.error("Error loading departments:", err);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  /* Load confidentiality levels + registries once */
  useEffect(() => {
    getConfidentialityLevels().then((r) => setConfidentialityLevels(unwrapList(r))).catch(() => {});
    getRegistries().then((r) => setRegistries(unwrapList(r))).catch(() => {});
  }, []);

  /* Cascade: Registry -> Cabinets. Runs on mount too, to populate the select
     with the file's existing registry (the initial cabinet_id/shelf_id
     from `file` are only cleared by a user-driven change, in setRegistryId
     below — not by this fetch effect). */
  useEffect(() => {
    if (!form.registry_id) { setCabinets([]); return; }
    setLoadingCabinets(true);
    getCabinets(form.registry_id)
      .then((r) => setCabinets(unwrapList(r)))
      .catch(() => setCabinets([]))
      .finally(() => setLoadingCabinets(false));
  }, [form.registry_id]);

  useEffect(() => {
    if (!form.cabinet_id) { setShelves([]); return; }
    setLoadingShelves(true);
    getShelves(form.cabinet_id)
      .then((r) => setShelves(unwrapList(r)))
      .catch(() => setShelves([]))
      .finally(() => setLoadingShelves(false));
  }, [form.cabinet_id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setRegistryId = (val) => setForm((f) => ({ ...f, registry_id: val, cabinet_id: "", shelf_id: "" }));
  const setCabinetId = (val) => setForm((f) => ({ ...f, cabinet_id: val, shelf_id: "" }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name / Subject is required."); return; }
    if (form.scope === "DEPARTMENT" && !form.department_id) {
      toast.error("Please select a department.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color,
        scope: form.scope,
        reference_no: form.reference_no.trim(),
        volume_no: form.volume_no.trim(),
        confidentiality_level: form.confidentiality_level,
      };
      payload.department_id = form.scope === "DEPARTMENT" ? form.department_id : null;
      if (form.registry_id) payload.registry_id = Number(form.registry_id);
      if (form.cabinet_id) payload.cabinet_id = Number(form.cabinet_id);
      if (form.shelf_id) payload.shelf_id = Number(form.shelf_id);

      await updateFile(file.id, payload);
      toast.success("File updated.");
      onUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update file.");
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
                <i className="ti ti-pencil me-2 text-primary" />
                Edit File              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Reference No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., HR/2024/003"
                      value={form.reference_no}
                      onChange={(e) => set("reference_no", e.target.value)}
                    />
                    <div className="form-text">The physical file's registry number. Must be unique.</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Name / Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Volume No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Vol. 1"
                      value={form.volume_no}
                      onChange={(e) => set("volume_no", e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3 mt-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Optional description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Scope</label>
                  <div className="d-flex gap-2">
                    {SCOPE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex-fill border rounded-3 p-2 text-center ${
                          form.scope === opt.value
                            ? "border-primary bg-primary bg-opacity-10"
                            : "border-light"
                        }`}
                        style={{ cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        <input
                          type="radio"
                          name="scope"
                          value={opt.value}
                          className="visually-hidden"
                          checked={form.scope === opt.value}
                          onChange={() => set("scope", opt.value)}
                        />
                        <i
                          className={`ti ${opt.icon} d-block mb-1`}
                          style={{
                            fontSize: "1.25rem",
                            color: form.scope === opt.value ? "#007bff" : "#adb5bd",
                          }}
                        />
                        <span className={`fw-semibold ${form.scope === opt.value ? "text-primary" : ""}`}>
                          {opt.label}
                        </span>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {opt.desc}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Department — required when scope is Department */}
                  {form.scope === "DEPARTMENT" && (
                    <div className="mt-2">
                      <label className="form-label fw-semibold">
                        Department <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={form.department_id}
                        onChange={(e) => set("department_id", e.target.value)}
                        disabled={loadingDepartments}
                        required
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {loadingDepartments && (
                        <small className="form-text text-muted">Loading departments…</small>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Confidentiality Level</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.confidentiality_level}
                    onChange={(e) => set("confidentiality_level", e.target.value)}
                  >
                    {confidentialityLevels.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Physical location — Registry -> Cabinet -> Shelf */}
                <div className="border rounded-3 p-3 mb-3" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  <div className="fw-semibold mb-2" style={{ fontSize: "0.85rem" }}>
                    <i className="ti ti-map-pin me-1 text-primary" />Physical Location
                    <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.72rem" }}>(optional)</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Registry</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.registry_id}
                        onChange={(e) => setRegistryId(e.target.value)}
                      >
                        <option value="">-- None --</option>
                        {registries.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Cabinet</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.cabinet_id}
                        onChange={(e) => setCabinetId(e.target.value)}
                        disabled={!form.registry_id || loadingCabinets}
                      >
                        <option value="">-- None --</option>
                        {cabinets.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={{ fontSize: "0.8rem" }}>Shelf</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.shelf_id}
                        onChange={(e) => set("shelf_id", e.target.value)}
                        disabled={!form.cabinet_id || loadingShelves}
                      >
                        <option value="">-- None --</option>
                        {shelves.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-1">
                  <label className="form-label fw-semibold">Color</label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`rounded-circle border-0 ${form.color === c ? "ring-2" : ""}`}
                        style={{
                          width: 28,
                          height: 28,
                          background: c,
                          outline: form.color === c ? `3px solid ${c}` : "none",
                          outlineOffset: 2,
                          cursor: "pointer",
                        }}
                        onClick={() => set("color", c)}
                        title={c}
                      />
                    ))}
                    <input
                      type="color"
                      className="form-control form-control-color border"
                      style={{ width: 36, height: 28, padding: 1, cursor: "pointer" }}
                      value={form.color}
                      onChange={(e) => set("color", e.target.value)}
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                  ) : (
                    <><i className="ti ti-check me-1" />Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default FileEditModal;
