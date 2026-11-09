import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import { FieldLabel } from "../components/Tooltip";
import {
  getRetentionRules, createRetentionRule, updateRetentionRule,
  getRegistries, getCabinets, getShelves,
} from "../../../api/edmsApi";
import { listRetentionDue, runRetentionCheck } from "../../../api/recordsApi";

const unwrapList = (r) => {
  const list = r?.data?.items || r?.data || (Array.isArray(r) ? r : []);
  return Array.isArray(list) ? list : [];
};

const autoCode = (name) =>
  name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30);

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// 30 -> "2 years 6 months"
const fmtMonths = (total) => {
  if (!total) return "—";
  const years = Math.floor(total / 12);
  const months = total % 12;
  return [years && plural(years, "year"), months && plural(months, "month")].filter(Boolean).join(" ");
};

const ruleMonths = (r) => (r.retention_years || 0) * 12 + (r.retention_months || 0);

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

// Years and months describe the same period, so typing one fills in the other.
const yearsFromMonths = (months) => (months === "" ? "" : String(Math.round((Number(months) / 12) * 100) / 100));
const monthsFromYears = (years) => (years === "" ? "" : String(Math.round(Number(years) * 12)));

/* ── Create / Edit modal ─────────────────────────────────── */
const RuleModal = ({ initial, registries, onClose, onSaved }) => {
  const isEdit = !!initial?.id;
  const startMonths = initial ? ruleMonths(initial) : 0;
  const [form, setForm] = useState({
    rule_name: initial?.rule_name || "",
    rule_code: initial?.rule_code || "",
    description: initial?.description || "",
    registry_id: initial?.registry_id ?? "",
    series_prefix: initial?.series_prefix || "",
    months: startMonths ? String(startMonths) : "",
    years: startMonths ? yearsFromMonths(String(startMonths)) : "",
    destination_registry_id: initial?.destination_registry_id ?? "",
    destination_cabinet_id: initial?.destination_cabinet_id ?? "",
    destination_shelf_id: initial?.destination_shelf_id ?? "",
    regulatory_basis: initial?.regulatory_basis || "",
    is_active: initial?.is_active ?? true,
  });
  const [cabinets, setCabinets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Destination: registry -> cabinet -> shelf.
  useEffect(() => {
    if (!form.destination_registry_id) { setCabinets([]); return; }
    getCabinets(form.destination_registry_id).then((r) => setCabinets(unwrapList(r))).catch(() => setCabinets([]));
  }, [form.destination_registry_id]);
  useEffect(() => {
    if (!form.destination_cabinet_id) { setShelves([]); return; }
    getShelves(form.destination_cabinet_id).then((r) => setShelves(unwrapList(r))).catch(() => setShelves([]));
  }, [form.destination_cabinet_id]);

  const totalMonths = Number(form.months) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rule_name.trim()) { toast.error("Rule name is required."); return; }
    if (!form.rule_code.trim()) { toast.error("Rule code is required."); return; }
    if (totalMonths <= 0) { toast.error("Enter how long the files are kept, in years or months."); return; }
    setLoading(true);
    try {
      const num = (v) => (v === "" || v == null ? null : Number(v));
      const shared = {
        rule_name: form.rule_name.trim(),
        description: form.description || undefined,
        retention_years: Math.floor(totalMonths / 12),
        retention_months: totalMonths % 12,
        regulatory_basis: form.regulatory_basis || undefined,
      };

      if (isEdit) {
        // On an edit, 0 and "" clear a field.
        await updateRetentionRule(initial.id, {
          ...shared,
          regulatory_basis: form.regulatory_basis,
          registry_id: num(form.registry_id) ?? 0,
          series_prefix: form.series_prefix.trim(),
          destination_registry_id: num(form.destination_registry_id) ?? 0,
          destination_cabinet_id: num(form.destination_cabinet_id) ?? 0,
          destination_shelf_id: num(form.destination_shelf_id) ?? 0,
          is_active: form.is_active,
        });
      } else {
        await createRetentionRule({
          ...shared,
          rule_code: form.rule_code.trim(),
          applies_to: "FILE",
          registry_id: num(form.registry_id) ?? undefined,
          series_prefix: form.series_prefix.trim() || undefined,
          destination_registry_id: num(form.destination_registry_id) ?? undefined,
          destination_cabinet_id: num(form.destination_cabinet_id) ?? undefined,
          destination_shelf_id: num(form.destination_shelf_id) ?? undefined,
        });
      }
      toast.success(`Retention rule "${form.rule_name}" ${isEdit ? "updated" : "created"}.`);
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${isEdit ? "update" : "create"} retention rule.`);
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
                <i className={`ti ${isEdit ? "ti-edit" : "ti-calendar-plus"} me-2 text-primary`} />
                {isEdit ? `Edit "${initial.rule_name}"` : "New Retention Rule"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Rule Name <span className="text-danger">*</span></label>
                    <input
                      type="text" className="form-control" value={form.rule_name} required autoFocus
                      placeholder="e.g. Administration files - 7 years"
                      onChange={(e) => {
                        set("rule_name", e.target.value);
                        if (!isEdit && (!form.rule_code || form.rule_code === autoCode(form.rule_name)))
                          set("rule_code", autoCode(e.target.value));
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <FieldLabel label="Rule Code" required
                      tooltip={isEdit ? "The code can't be changed after creation." : "Unique identifier, e.g. ADMIN_7YR."} />
                    <input
                      type="text" className="form-control font-monospace" value={form.rule_code} required
                      disabled={isEdit}
                      onChange={(e) => set("rule_code", e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                      maxLength={30}
                    />
                  </div>

                  {/* Which files */}
                  <div className="col-12">
                    <div className="fw-semibold text-primary small text-uppercase">Which files</div>
                  </div>
                  <div className="col-md-6">
                    <FieldLabel label="Registry" tooltip="The rule covers the files kept in this Registry." />
                    <select className="form-select" value={form.registry_id} onChange={(e) => set("registry_id", e.target.value)}>
                      <option value="">Every registry</option>
                      {registries.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <FieldLabel label="Reference series (optional)"
                      tooltip="Limit the rule to the files whose reference starts with this, e.g. MOH/ADM/1/1. Leave blank to cover every file in the Registry. A rule for a series wins over one for the whole Registry." />
                    <input type="text" className="form-control font-monospace" value={form.series_prefix}
                      placeholder="e.g. MOH/ADM/1/1"
                      onChange={(e) => set("series_prefix", e.target.value.toUpperCase().replace(/\s+/g, ""))} />
                  </div>

                  {/* How long */}
                  <div className="col-12">
                    <div className="fw-semibold text-primary small text-uppercase">How long files are kept</div>
                    <div className="text-muted small">Counted from the day the file was opened (approved). Fill in either box - the other works itself out.</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Years</label>
                    <input type="number" min="0" step="any" className="form-control" value={form.years}
                      onChange={(e) => setForm((f) => ({ ...f, years: e.target.value, months: monthsFromYears(e.target.value) }))} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Months</label>
                    <input type="number" min="0" step="1" className="form-control" value={form.months}
                      onChange={(e) => setForm((f) => ({ ...f, months: e.target.value, years: yearsFromMonths(e.target.value) }))} />
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="alert alert-light border w-100 mb-0 py-2 small">
                      <i className="ti ti-hourglass me-1 text-primary" />
                      {totalMonths > 0 ? <>Kept for <strong>{fmtMonths(totalMonths)}</strong></> : "No period yet"}
                    </div>
                  </div>

                  {/* Where disposal sends the file */}
                  <div className="col-12">
                    <div className="fw-semibold text-primary small text-uppercase">When the time is up</div>
                    <div className="text-muted small">
                      Disposal moves the file - nothing is destroyed. Choose where disposed files go, such as an Archive.
                      Leave it blank to just mark them as disposed where they are.
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Move to registry</label>
                    <select className="form-select" value={form.destination_registry_id}
                      onChange={(e) => setForm((f) => ({ ...f, destination_registry_id: e.target.value, destination_cabinet_id: "", destination_shelf_id: "" }))}>
                      <option value="">Leave where it is</option>
                      {registries.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Cabinet</label>
                    <select className="form-select" value={form.destination_cabinet_id} disabled={!form.destination_registry_id}
                      onChange={(e) => setForm((f) => ({ ...f, destination_cabinet_id: e.target.value, destination_shelf_id: "" }))}>
                      <option value="">Any</option>
                      {cabinets.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Shelf</label>
                    <select className="form-select" value={form.destination_shelf_id} disabled={!form.destination_cabinet_id}
                      onChange={(e) => set("destination_shelf_id", e.target.value)}>
                      <option value="">Any</option>
                      {shelves.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Regulatory Basis</label>
                    <input type="text" className="form-control" value={form.regulatory_basis}
                      onChange={(e) => set("regulatory_basis", e.target.value)}
                      placeholder="e.g. Public Archives and Documentation Service Act" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows={2} value={form.description}
                      onChange={(e) => set("description", e.target.value)} />
                  </div>

                  {isEdit && (
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input type="checkbox" className="form-check-input" id="rule-active"
                          checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                        <label className="form-check-label" htmlFor="rule-active">Active</label>
                      </div>
                      {initial?.active_schedule_count > 0 && (
                        <div className="form-text">
                          {plural(initial.active_schedule_count, "file")} currently covered by this rule.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />{isEdit ? "Saving…" : "Creating…"}</>
                    : <><i className={`ti ${isEdit ? "ti-device-floppy" : "ti-plus"} me-1`} />{isEdit ? "Save Changes" : "Create Rule"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Files whose retention has run out ───────────────────── */
const NEXT_STEP = {
  CLOSE: { label: "Closing request", hint: "The disposal request follows once the file is closed.", cls: "bg-warning-subtle text-warning" },
  DISPOSE: { label: "Disposal request", hint: "Goes for approval, then the file is moved.", cls: "bg-primary-subtle text-primary" },
};
const BLOCKED = {
  REQUEST_PENDING: { label: "Request already waiting", cls: "bg-secondary-subtle text-secondary" },
  LEGAL_HOLD: { label: "Legal hold", cls: "bg-danger-subtle text-danger" },
};

const DueFilesPanel = ({ onRaised }) => {
  const [rows, setRows] = useState(null);       // null = not checked yet
  const [ticked, setTicked] = useState({});
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const check = async () => {
    setChecking(true);
    setResult(null);
    try {
      const r = await listRetentionDue();
      const list = r?.data ?? [];
      setRows(list);
      setTicked(Object.fromEntries(list.filter((x) => x.next_request).map((x) => [x.folder_id, true])));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not check the files.");
    } finally {
      setChecking(false);
    }
  };

  const raisable = (rows || []).filter((x) => x.next_request);
  const chosen = raisable.filter((x) => ticked[x.folder_id]);
  const allTicked = raisable.length > 0 && chosen.length === raisable.length;

  const send = async () => {
    if (chosen.length === 0) return;
    setSending(true);
    try {
      const r = await runRetentionCheck(chosen.map((x) => x.folder_id));
      setResult(r?.data ?? null);
      toast.success(r?.message || "Sent for approval.");
      setRows(null);
      onRaised?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not send the requests.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="fw-semibold"><i className="ti ti-calendar-time text-primary me-1" />Files that are due</div>
          <div className="text-muted small">Find the files whose retention period has run out and send them for approval.</div>
        </div>
        <button className="btn btn-primary" onClick={check} disabled={checking}>
          {checking ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-search me-1" />}
          Check files now
        </button>
      </div>

      {(rows !== null || result) && (
        <div className="card-body">
          {result && (
            <div className="alert alert-success">
              <div className="fw-semibold mb-1">
                {result.raised > 0 ? `${plural(result.raised, "request")} sent for approval.` : "Nothing was sent."}
                {result.skipped > 0 && ` ${result.skipped} skipped.`}
              </div>
              <ul className="mb-2 small ps-3">
                {result.lines.map((l) => (
                  <li key={l.folder_id}><strong>{l.reference_no}</strong> - {l.note}</li>
                ))}
              </ul>
              <Link to="/ed-mgt/records/files" className="alert-link small">See them in Files and records <i className="ti ti-arrow-right" /></Link>
            </div>
          )}

          {rows !== null && rows.length === 0 && (
            <div className="text-center text-muted py-4">
              <i className="ti ti-circle-check text-success" style={{ fontSize: 40 }} />
              <div className="mt-2">No file has reached its retention date.</div>
            </div>
          )}

          {rows !== null && rows.length > 0 && (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-2" style={{ fontSize: "0.85rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" className="form-check-input" checked={allTicked} disabled={raisable.length === 0}
                          onChange={(e) => setTicked(Object.fromEntries(raisable.map((x) => [x.folder_id, e.target.checked])))} />
                      </th>
                      <th>File</th>
                      <th>Registry</th>
                      <th>Opened</th>
                      <th>Retention ended</th>
                      <th>Rule</th>
                      <th>Will send</th>
                      <th>Then moves to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((x) => {
                      const next = x.next_request ? NEXT_STEP[x.next_request] : null;
                      const blocked = x.blocked_reason ? BLOCKED[x.blocked_reason] : null;
                      return (
                        <tr key={x.folder_id} className={x.next_request ? "" : "text-muted"}>
                          <td>
                            <input type="checkbox" className="form-check-input" disabled={!x.next_request}
                              checked={!!ticked[x.folder_id]}
                              onChange={(e) => setTicked((t) => ({ ...t, [x.folder_id]: e.target.checked }))} />
                          </td>
                          <td>
                            <div className="fw-semibold">{x.reference_no}</div>
                            <div className="small text-muted">{x.subject}</div>
                            <span className={`badge ${x.file_status === "OPEN" ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
                              {x.file_status === "OPEN" ? "Open" : "Closed"}
                            </span>
                          </td>
                          <td>{x.registry_name || "—"}</td>
                          <td>{fmtDate(x.opened_on)}</td>
                          <td>
                            {fmtDate(x.due_on)}
                            {x.days_overdue > 0 && <div className="small text-muted">{plural(x.days_overdue, "day")} ago</div>}
                          </td>
                          <td>{x.rule_name}</td>
                          <td>
                            {next && (
                              <>
                                <span className={`badge ${next.cls}`}>{next.label}</span>
                                <div className="small text-muted">{next.hint}</div>
                              </>
                            )}
                            {blocked && <span className={`badge ${blocked.cls}`}>{blocked.label}</span>}
                          </td>
                          <td>{x.destination_label || <span className="text-muted">Stays where it is</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="text-muted small">
                  Nothing is disposed of yet. Each request goes through approval first, and only then is the file moved.
                </div>
                <button className="btn btn-success" disabled={sending || chosen.length === 0} onClick={send}>
                  {sending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-send me-1" />}
                  Send {chosen.length} for approval
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main screen ─────────────────────────────────────────── */
const RetentionRuleList = () => {
  const [rules, setRules] = useState([]);
  const [registries, setRegistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { initial } | null

  const load = useCallback(() => {
    setLoading(true);
    getRetentionRules({ page_size: 100, applies_to: "FILE" })
      .then((r) => {
        const d = r?.data ?? r;
        setRules(Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []);
      })
      .catch(() => toast.error("Failed to load retention rules."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getRegistries()
      .then((r) => setRegistries(unwrapList(r).filter((x) => x.is_active !== false)))
      .catch(() => {});
  }, []);

  const searchLower = search.toLowerCase();
  const filtered = rules.filter((r) =>
    !searchLower ||
    r.rule_name?.toLowerCase().includes(searchLower) ||
    r.rule_code?.toLowerCase().includes(searchLower) ||
    r.registry_name?.toLowerCase().includes(searchLower) ||
    r.series_prefix?.toLowerCase().includes(searchLower)
  );

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      {modal && (
        <RuleModal
          initial={modal.initial}
          registries={registries}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/ed-mgt/admin" className="btn btn-sm btn-outline-secondary">
            <i className="ti ti-arrow-left me-1"></i>Admin
          </Link>
          <h4 className="mb-0">Retention Rules</h4>
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body py-3">
            <div className="fw-semibold mb-2"><i className="ti ti-info-circle text-primary me-1" />How retention works</div>
            <div className="row g-3 small">
              {[
                ["1", "Set a rule per Registry", "Say how long its files are kept - and, if needed, only for one reference series."],
                ["2", "The clock starts when a file is opened", "The date the file was approved and opened."],
                ["3", "Check files when you are ready", "Files past their date are sent for approval: an open file is closed first, then disposed of."],
                ["4", "Disposal moves the file", "After approval the file goes to the rule's destination, such as the Archive. Nothing is destroyed."],
              ].map(([n, title, text]) => (
                <div className="col-md-6 col-xl-3" key={n}>
                  <div className="d-flex gap-2">
                    <span className="badge rounded-pill text-bg-primary align-self-start">{n}</span>
                    <div><div className="fw-semibold">{title}</div><div className="text-muted">{text}</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-muted small mt-2">
              A file can also be closed or disposed of by hand at any time, from <Link to="/ed-mgt/records/files">Files and records</Link>.
              A manual disposal moves the file to the destination on its rule too.
            </div>
          </div>
        </div>

        <DueFilesPanel onRaised={load} />

        <div className="row mb-3">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="ti ti-search text-muted" />
              </span>
              <input type="text" className="form-control border-start-0" placeholder="Search rules…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button className="btn btn-outline-secondary" onClick={() => setSearch("")}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          </div>
          <div className="col-auto ms-auto d-flex align-items-center gap-2">
            {!loading && <span className="text-muted" style={{ fontSize: "0.875rem" }}>{plural(filtered.length, "rule")}</span>}
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ initial: null })}>
              <i className="ti ti-plus me-1" />New Retention Rule
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.875rem" }}>
                <thead className="table-light">
                  <tr>
                    <th>Rule</th>
                    <th>Registry</th>
                    <th>Series</th>
                    <th>Kept for</th>
                    <th>Then moved to</th>
                    <th>Files covered</th>
                    <th>Status</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><div className="placeholder-glow"><span className="placeholder col-8 rounded"></span></div></td>
                      ))}</tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <i className="ti ti-calendar-off" style={{ fontSize: 48 }}></i>
                        <p className="mt-2 mb-3">{search ? `No rules match "${search}"` : "No retention rules yet."}</p>
                        {!search && (
                          <button className="btn btn-primary btn-sm" onClick={() => setModal({ initial: null })}>
                            <i className="ti ti-plus me-1" />Create first rule
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-semibold">{r.rule_name}</div>
                        <code className="text-muted" style={{ fontSize: "0.72rem" }}>{r.rule_code}</code>
                      </td>
                      <td>{r.registry_name || <span className="text-muted">Every registry</span>}</td>
                      <td>{r.series_prefix ? <code>{r.series_prefix}</code> : <span className="text-muted">All files</span>}</td>
                      <td>{fmtMonths(ruleMonths(r))}</td>
                      <td>{r.destination_label || <span className="text-muted">Stays where it is</span>}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">{r.active_schedule_count ?? 0}</span>
                      </td>
                      <td>
                        {r.is_active
                          ? <span className="badge bg-success-subtle text-success border">Active</span>
                          : <span className="badge bg-secondary-subtle text-secondary border">Inactive</span>}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary" title="Edit"
                          onClick={() => setModal({ initial: r })}>
                          <i className="ti ti-edit"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RetentionRuleList;
