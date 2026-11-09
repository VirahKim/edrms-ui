import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createFile, getConfidentialityLevels, getRegistries, getCabinets, getShelves } from "../../../../api/edmsApi";
import apiClient from "../../../../api/apiClient";
import { listAvailableOpenRequests, listAvailableTemporaryFiles } from "../../../../api/recordsApi";
import { getCoverSettings, getCoverColors } from "../../../../api/fileCoversApi";
import CoverColorPicker from "../../components/CoverColorPicker";
import FileCoverView from "../../components/FileCoverView";
import { toast } from "../../components/EDMSToast";
import FilePickerModal from "./FilePickerModal";

const SCOPE_OPTIONS = [
  { value: "ORGANIZATION", icon: "ti-building",  label: "Organization",  desc: "Visible to everyone" },
  { value: "DEPARTMENT",   icon: "ti-users",     label: "Department",    desc: "Visible to your department" },
  { value: "PERSONAL",     icon: "ti-user",      label: "Personal",      desc: "Visible only to you" },
];

const unwrapList = (r) => r?.data?.items || r?.data || (Array.isArray(r) ? r : []);

// One numbered block of the form, so the modal reads top to bottom: details, cover, where it sits.
const Section = ({ n, title, hint, children }) => (
  <div className="border rounded-3 p-3 mb-3" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
    <div className="d-flex align-items-center gap-2 mb-2">
      <span className="badge rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>{n}</span>
      <span className="fw-semibold">{title}</span>
      {hint && <span className="text-muted ms-1" style={{ fontSize: "0.75rem" }}>{hint}</span>}
    </div>
    {children}
  </div>
);

/**
 * Props:
 *   parentFile   — when set from "New sub-file" click, the parent is pre-locked
 *   tree          — file tree array for the parent picker (pass from FilesBrowser)
 *   onCreated     — called after successful creation
 *   onClose
 */
const NewFileModal = ({ parentFile: lockedParent = null, tree = [], onCreated, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    reference_no: "",
    volume_no: "",
    scope: lockedParent?.scope || "ORGANIZATION",
    department_id: lockedParent?.department_id || "",
    confidentiality_level: "INTERNAL",
    registry_id: "",
    cabinet_id: "",
    shelf_id: "",
  });
  const [chosenParent, setChosenParent] = useState(lockedParent || null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [confidentialityLevels, setConfidentialityLevels] = useState([]);
  const [registries, setRegistries] = useState([]);
  const [cabinets, setCabinets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loadingCabinets, setLoadingCabinets] = useState(false);
  const [loadingShelves, setLoadingShelves] = useState(false);

  // A file is approved when it is requested, so creating one means picking an approved request. Each request
  // makes one file only. Personal files are private working folders and need none.
  const [requests, setRequests] = useState(null);       // null while loading
  const [requestId, setRequestId] = useState("");
  // A Registry Officer opens an ordinary file without any approval; only a temporary file (TY) is opened from an
  // approved request. Everyone else still picks an approved request.
  const [opensDirectly, setOpensDirectly] = useState(false);
  const [seriesPrefix, setSeriesPrefix] = useState("");

  // An ordinary file, or a temporary file (TY). A temporary file is opened only from an approved temporary-file
  // request - whoever opens it - and takes that request's reference number.
  const [fileType, setFileType] = useState("ORDINARY");
  const [tyRequests, setTyRequests] = useState(null);   // null while loading
  const [tyId, setTyId] = useState("");
  const isTemporary = fileType === "TEMPORARY";
  // The Temporary tab lists both kinds of approved request: HR temporary-file (TY) requests, and the file-opening
  // requests made under Files and records -> Requests ("Open a new temporary file"). tyId is "ty:<id>" or "req:<id>".
  const chosenTy = tyId.startsWith("ty:") ? (tyRequests || []).find((t) => `ty:${t.id}` === tyId) || null : null;
  const chosenTempRequest = tyId.startsWith("req:") ? (requests || []).find((r) => `req:${r.id}` === tyId) || null : null;
  const chosenTemporary = chosenTy || chosenTempRequest;

  // The cover of the file: department, colour, and (rarely) a different header. Empty header lines use the organisation's.
  const [cover, setCover] = useState({ department: "", color: "", header_line1: "", header_line2: "" });
  const [coverDeptTouched, setCoverDeptTouched] = useState(false);
  const [coverDefaults, setCoverDefaults] = useState(null);
  const [colors, setColors] = useState([]);

  // Approval is only needed for a temporary file; an ordinary file is opened directly.
  const needsRequest = false;
  const chosenRequest = (requests || []).find((r) => String(r.id) === String(requestId)) || null;

  useEffect(() => {
    getCoverSettings()
      .then((s) => { setCoverDefaults(s); setCover((c) => ({ ...c, color: c.color || s?.default_color || "BLUE" })); })
      .catch(() => {});
    getCoverColors().then(setColors).catch(() => {});
  }, []);

  useEffect(() => { setOpensDirectly(true); }, []);

  useEffect(() => {
    listAvailableOpenRequests()
      .then((r) => setRequests(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    listAvailableTemporaryFiles()
      .then((r) => setTyRequests(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setTyRequests([]));
  }, []);

  const chooseFileType = (type) => {
    setFileType(type);
    setRequestId("");
    setTyId("");
    setSeriesPrefix("");
    setForm((f) => ({
      ...f, reference_no: "", name: "",
      scope: type === "TEMPORARY" && f.scope === "PERSONAL" ? "ORGANIZATION" : f.scope,
      confidentiality_level: type === "TEMPORARY" ? "CONFIDENTIAL" : "INTERNAL",
    }));
  };

  // Picking an approved temporary-file request fills in its reference number (fixed) and its subject (which can be adjusted).
  const pickTy = (id) => {
    setTyId(id);
    const t = id.startsWith("ty:") ? (tyRequests || []).find((x) => `ty:${x.id}` === id)
      : (requests || []).find((x) => `req:${x.id}` === id);
    setForm((f) => ({ ...f, reference_no: t?.reference_no || "", name: t ? (t.subject || t.proposed_subject || f.name) : "" }));
  };

  // Picking a request fills in its reference number (fixed) and its subject (which can be adjusted).
  const pickRequest = (id) => {
    setRequestId(id);
    const req = (requests || []).find((r) => String(r.id) === String(id));
    setForm((f) => ({ ...f, reference_no: req?.reference_no || "", name: req ? (req.proposed_subject || f.name) : "" }));
  };

  /* When user picks a parent, inherit its scope */
  useEffect(() => {
    if (chosenParent?.scope) {
      setForm((f) => ({ ...f, scope: chosenParent.scope, department_id: chosenParent.department_id || "" }));
    }
  }, [chosenParent]);

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

  // The department printed on the cover follows the department the file belongs to, until the user types their own.
  useEffect(() => {
    if (coverDeptTouched || form.scope !== "DEPARTMENT" || !form.department_id) return;
    const d = departments.find((x) => String(x.id) === String(form.department_id));
    if (d?.name) setCover((c) => ({ ...c, department: d.name }));
  }, [form.scope, form.department_id, departments, coverDeptTouched]);

  /* Load confidentiality levels + registries once */
  useEffect(() => {
    getConfidentialityLevels().then((r) => setConfidentialityLevels(unwrapList(r))).catch(() => {});
    getRegistries().then((r) => setRegistries(unwrapList(r))).catch(() => {});
  }, []);

  /* Cascade: Registry -> Cabinets */
  useEffect(() => {
    if (!form.registry_id) { setCabinets([]); return; }
    setLoadingCabinets(true);
    getCabinets(form.registry_id)
      .then((r) => setCabinets(unwrapList(r)))
      .catch(() => setCabinets([]))
      .finally(() => setLoadingCabinets(false));
  }, [form.registry_id]);

  /* Cascade: Cabinet -> Shelves */
  useEffect(() => {
    if (!form.cabinet_id) { setShelves([]); return; }
    setLoadingShelves(true);
    getShelves(form.cabinet_id)
      .then((r) => setShelves(unwrapList(r)))
      .catch(() => setShelves([]))
      .finally(() => setLoadingShelves(false));
  }, [form.cabinet_id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setCoverField = (key, val) => setCover((c) => ({ ...c, [key]: val }));

  const setRegistryId = (val) => setForm((f) => ({ ...f, registry_id: val, cabinet_id: "", shelf_id: "" }));
  const setCabinetId = (val) => setForm((f) => ({ ...f, cabinet_id: val, shelf_id: "" }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsRequest && !chosenRequest) { toast.error("Choose the approved request this file is opened for."); return; }
    if (isTemporary && !chosenTemporary) { toast.error("Choose the approved temporary-file request this file is opened for."); return; }
    if (opensDirectly && !isTemporary && form.scope !== "PERSONAL" && !form.reference_no.trim() && !seriesPrefix.trim()) {
      toast.error("Give the reference number, or the reference series to take the next number from.");
      return;
    }
    if (!form.name.trim()) { toast.error("Name / Subject is required."); return; }
    if (form.scope === "DEPARTMENT" && !form.department_id) {
      toast.error("Please select a department.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:        form.name.trim(),
        scope:       form.scope,
        description: form.description.trim() || undefined,
        // The reference number comes from the approved request; the server sets it.
        reference_no: needsRequest || isTemporary ? undefined : (form.reference_no.trim() || undefined),
        file_request_id: needsRequest ? chosenRequest.id : chosenTempRequest ? chosenTempRequest.id : undefined,
        temporary_file_id: chosenTy ? chosenTy.id : undefined,
        series_prefix: opensDirectly && !isTemporary && !form.reference_no.trim() ? (seriesPrefix.trim() || undefined) : undefined,
        volume_no:    form.volume_no.trim() || undefined,
        confidentiality_level: form.confidentiality_level,
        cover_department: cover.department.trim() || undefined,
        cover_color: cover.color || undefined,
        cover_header_line1: cover.header_line1.trim() || undefined,
        cover_header_line2: cover.header_line2.trim() || undefined,
      };
      if (form.scope === "DEPARTMENT") payload.department_id = form.department_id;
      if (chosenParent?.id) payload.parent_folder_id = chosenParent.id;
      if (form.registry_id) payload.registry_id = Number(form.registry_id);
      if (form.cabinet_id) payload.cabinet_id = Number(form.cabinet_id);
      if (form.shelf_id) payload.shelf_id = Number(form.shelf_id);

      const created = await createFile(payload);
      toast.success(`File "${form.name}" created.`);
      onCreated(created?.data ?? created);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create file.");
    } finally {
      setLoading(false);
    }
  };

  // What the cover will look like, drawn from what has been typed so far.
  const paper = colors.find((c) => c.code === cover.color) || { color_hex: "#1e88e5", ink_hex: "#0b2a4a" };
  const previewReference = form.reference_no.trim()
    || (opensDirectly && !isTemporary && seriesPrefix.trim() ? `${seriesPrefix.trim().replace(/\/+$/, "")}/…` : "");
  const previewCover = {
    reference_no: previewReference,
    volume_no: form.volume_no,
    header_line1: cover.header_line1.trim() || coverDefaults?.header_line1 || "Republic of Kenya",
    header_line2: cover.header_line2.trim() || coverDefaults?.header_line2 || "",
    department: cover.department,
    subject: form.name.trim() || "Subject of the file",
    color_hex: paper.color_hex,
    ink_hex: paper.ink_hex,
    movements: [],
  };

  return (
    <>
      {/* Backdrop — behind picker if picker is open */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: showPicker ? 1030 : 1040 }}
        onClick={!showPicker ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: showPicker ? 1035 : 1050 }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newFileModalLabel"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title" id="newFileModalLabel">
                <i className="ti ti-folder-plus me-2 text-warning" />
                {lockedParent
                  ? `New sub-file in "${lockedParent.name}"`
                  : chosenParent
                  ? `New sub-file in "${chosenParent.name}"`
                  : "New File"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <form onSubmit={handleSubmit} className="d-flex flex-column" style={{ minHeight: 0, flex: "1 1 auto" }}>
              <div className="modal-body" style={{ backgroundColor: "var(--bs-body-bg)" }}>
                <div className="row g-4">

                  {/* ───────── Left: the form ───────── */}
                  <div className="col-lg-7">

                    {/* 1 — The file */}
                    <Section n={1} title="The file">
                      {/* Ordinary file, or a temporary file (TY) - a temporary file needs an approved request */}
                      <div className="btn-group w-100 mb-3" role="group" aria-label="Kind of file">
                        <button type="button" className={`btn btn-sm ${!isTemporary ? "btn-primary" : "btn-outline-primary"}`} onClick={() => chooseFileType("ORDINARY")}>
                          <i className="ti ti-folder me-1" />Ordinary file
                        </button>
                        <button type="button" className={`btn btn-sm ${isTemporary ? "btn-primary" : "btn-outline-primary"}`} onClick={() => chooseFileType("TEMPORARY")}>
                          <i className="ti ti-clock-hour-4 me-1" />Temporary file (TY)
                        </button>
                      </div>

                      {isTemporary && (
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Approved temporary-file request <span className="text-danger">*</span>
                          </label>
                          {tyRequests === null || requests === null ? (
                            <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2" />Loading approved requests…</div>
                          ) : tyRequests.length + requests.length === 0 ? (
                            <div className="alert alert-warning py-2 mb-0 small">
                              <i className="ti ti-alert-triangle me-1" />
                              There is no approved temporary-file request waiting for its file. Ask for one under{" "}
                              <Link to="/ed-mgt/records/files" onClick={onClose}>Files and records → Requests</Link> ("Open a new temporary file"), or from a missing personnel file under{" "}
                              <Link to="/ed-mgt/hr-records" onClick={onClose}>HR records</Link>; once approved it appears here.
                            </div>
                          ) : (
                            <>
                              <select className="form-select" value={tyId} onChange={(e) => pickTy(e.target.value)} required>
                                <option value="">-- Select an approved request --</option>
                                {requests.map((r) => (
                                  <option key={`req:${r.id}`} value={`req:${r.id}`}>{r.reference_no} - {r.proposed_subject}</option>
                                ))}
                                {tyRequests.map((t) => (
                                  <option key={`ty:${t.id}`} value={`ty:${t.id}`}>{t.reference_no} - {t.employee_name} ({t.personal_number})</option>
                                ))}
                              </select>
                              <div className="form-text">Each request opens one file. It is Confidential, and the reference number is fixed by the request.</div>
                            </>
                          )}
                        </div>
                      )}

                      {needsRequest && (
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Approved request <span className="text-danger">*</span>
                          </label>
                          {requests === null ? (
                            <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2" />Loading approved requests…</div>
                          ) : requests.length === 0 ? (
                            <div className="alert alert-warning py-2 mb-0 small">
                              <i className="ti ti-alert-triangle me-1" />
                              You have no approved request to open a file from. Ask for one under{" "}
                              <Link to="/ed-mgt/records/files" onClick={onClose}>Files and records → Requests</Link>{" "}
                              ("Open a new temporary file"); once it is approved it appears here.
                            </div>
                          ) : (
                            <>
                              <select className="form-select" value={requestId} onChange={(e) => pickRequest(e.target.value)} required>
                                <option value="">-- Select an approved request --</option>
                                {requests.map((r) => (
                                  <option key={r.id} value={r.id}>{r.reference_no} - {r.proposed_subject}</option>
                                ))}
                              </select>
                              <div className="form-text">Each request opens one file. It cannot be used again.</div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="row g-3">
                        <div className="col-md-8">
                          <label className="form-label fw-semibold">
                            Name / Subject <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., Records management operations"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            autoFocus
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Volume</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., 1 or IV"
                            value={form.volume_no}
                            onChange={(e) => set("volume_no", e.target.value)}
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Reference No.</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={needsRequest || isTemporary ? "Given by the approved request" : "e.g., MOH/ADM/1/1/43"}
                            value={form.reference_no}
                            onChange={(e) => set("reference_no", e.target.value)}
                            readOnly={needsRequest || isTemporary}
                          />
                          <div className="form-text">
                            {needsRequest || isTemporary ? "Fixed when the request was approved." : "The registry number on the file. Must be unique."}
                          </div>
                        </div>

                        {opensDirectly && !isTemporary && form.scope !== "PERSONAL" && !form.reference_no.trim() && (
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">…or the next number in a series</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., MOH/ADM/1/1"
                              value={seriesPrefix}
                              onChange={(e) => setSeriesPrefix(e.target.value)}
                            />
                            <div className="form-text">No approval needed - you open the file yourself.</div>
                          </div>
                        )}

                        <div className="col-12">
                          <label className="form-label fw-semibold">Description <span className="text-muted fw-normal">(optional)</span></label>
                          <textarea
                            className="form-control"
                            rows={2}
                            placeholder="What this file contains"
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                          />
                        </div>
                      </div>
                    </Section>

                    {/* 2 — The cover */}
                    <Section n={2} title="File cover" hint="See it take shape on the right">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Department</label>
                          <input
                            className="form-control"
                            maxLength={200}
                            placeholder="e.g., HQS - Administration"
                            value={cover.department}
                            onChange={(e) => { setCoverDeptTouched(true); setCoverField("department", e.target.value); }}
                          />
                          <div className="form-text">Written on the "Department" line of the cover.</div>
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Cover colour</label>
                          <CoverColorPicker value={cover.color} onChange={(c) => setCoverField("color", c)} colors={colors} />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Header on the cover</label>
                          <div className="row g-2">
                            <div className="col-md-6">
                              <input
                                className="form-control form-control-sm"
                                maxLength={200}
                                placeholder={coverDefaults?.header_line1 || "Republic of Kenya"}
                                value={cover.header_line1}
                                onChange={(e) => setCoverField("header_line1", e.target.value)}
                              />
                            </div>
                            <div className="col-md-6">
                              <input
                                className="form-control form-control-sm"
                                maxLength={200}
                                placeholder={coverDefaults?.header_line2 || "Ministry of Health"}
                                value={cover.header_line2}
                                onChange={(e) => setCoverField("header_line2", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="form-text">
                            Leave both empty to use the usual wording. Fill them only for a file that differs, for example a county government.
                          </div>
                        </div>
                      </div>
                    </Section>

                    {/* 3 — Where it sits */}
                    <Section n={3} title="Where it sits and who can see it">
                      {/* Parent file — only interactive when not locked */}
                      <label className="form-label fw-semibold">
                        Parent File
                        <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.78rem" }}>(optional — leave empty to create at root)</span>
                      </label>
                      {lockedParent ? (
                        <div className="form-control form-control-sm text-muted d-flex align-items-center gap-2 mb-3" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                          <i className="ti ti-folder text-warning" />
                          {lockedParent.name}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <div
                            className="form-control form-control-sm flex-grow-1"
                            style={{ color: chosenParent ? "inherit" : "#adb5bd", userSelect: "none" }}
                          >
                            {chosenParent ? (
                              <span className="d-flex align-items-center gap-1">
                                <i className="ti ti-folder text-warning" />
                                {chosenParent.name}
                              </span>
                            ) : (
                              "Root (no parent)"
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setShowPicker(true)}
                            disabled={tree.length === 0}
                          >
                            <i className="ti ti-folder-search me-1" />Browse
                          </button>
                          {chosenParent && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger p-0"
                              onClick={() => { setChosenParent(null); set("scope", "ORGANIZATION"); }}
                              title="Clear parent"
                            >
                              <i className="ti ti-x" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Scope — hidden when a parent is selected (scope inherited) */}
                      {!chosenParent && !lockedParent ? (
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Who can see it</label>
                          <div className="d-flex gap-2">
                            {SCOPE_OPTIONS.filter((opt) => !(isTemporary && opt.value === "PERSONAL")).map((opt) => (
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
                                  style={{ fontSize: "1.25rem", color: form.scope === opt.value ? "#007bff" : "#adb5bd" }}
                                />
                                <span className={`fw-semibold ${form.scope === opt.value ? "text-primary" : ""}`}>{opt.label}</span>
                                <div className="text-muted" style={{ fontSize: "0.72rem" }}>{opt.desc}</div>
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
                              {loadingDepartments && <small className="form-text text-muted">Loading departments…</small>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2 text-muted mb-3" style={{ fontSize: "0.8rem" }}>
                          <i className="ti ti-info-circle" />
                          Scope inherited from parent:
                          <span className="badge text-bg-secondary">{form.scope}</span>
                        </div>
                      )}

                      <label className="form-label fw-semibold">Confidentiality Level</label>
                      <select
                        className="form-select form-select-sm"
                        value={form.confidentiality_level}
                        onChange={(e) => set("confidentiality_level", e.target.value)}
                        disabled={isTemporary}
                      >
                        {confidentialityLevels.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                    </Section>

                    {/* 4 — Physical location — Registry -> Cabinet -> Shelf */}
                    <Section n={4} title="Physical location" hint="(optional)">
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
                    </Section>
                  </div>

                  {/* ───────── Right: the cover, as it will look ───────── */}
                  <div className="col-lg-5">
                    <div style={{ position: "sticky", top: 0 }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-semibold"><i className="ti ti-notebook me-1 text-primary" />Cover preview</span>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>Check it before you create the file</span>
                      </div>
                      <FileCoverView cover={previewCover} size="card" />
                      {!previewReference && (
                        <div className="text-muted mt-2" style={{ fontSize: "0.75rem" }}>
                          <i className="ti ti-info-circle me-1" />
                          {needsRequest || isTemporary ? "The reference number appears once you choose the approved request." : "The reference number appears once you type it or choose a series."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || (needsRequest && !chosenRequest) || (isTemporary && !chosenTemporary)}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Creating…</>
                  ) : (
                    <><i className="ti ti-folder-plus me-1" />Create File</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* File picker — rendered on top */}
      {showPicker && (
        <FilePickerModal
          title="Select Parent File"
          tree={tree}
          excludeIds={[]}
          confirmLabel="Select as Parent"
          onPick={(f) => { setChosenParent(f); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
          zBase={1060}
        />
      )}
    </>
  );
};

export default NewFileModal;
