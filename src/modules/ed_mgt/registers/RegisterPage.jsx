import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import PartySelect from "./PartySelect";
import {
  listRegister, createRegisterEntry, voidRegisterEntry, linkRegisterDocument, downloadRegisterExcel,
} from "../../../api/registersApi";
import { toast } from "../components/EDMSToast";

const ITEM_TYPES = [
  { value: "LETTER", label: "Letter" },
  { value: "MEMO", label: "Memo" },
  { value: "FILE", label: "Physical file" },
  { value: "PARCEL", label: "Parcel" },
  { value: "EMAIL", label: "E-mail" },
  { value: "OTHER", label: "Other" },
];

const DISPATCH_MODES = [
  { value: "HAND", label: "Hand delivery" },
  { value: "COURIER", label: "Courier" },
  { value: "POST", label: "Post" },
  { value: "EMAIL", label: "E-mail" },
  { value: "OTHER", label: "Other" },
];

const REGISTRIES = [
  { value: "SUBJECT", label: "Subject Files", icon: "ti-folders" },
  { value: "HR", label: "HR Files", icon: "ti-users" },
];

const today = () => new Date().toISOString().slice(0, 10);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

// One definition per register. The same page shows either one.
const CONFIG = {
  inward: {
    title: "Inward Mail Register",
    intro: "Record each letter, memo or file as it is received. Pick who it came from, or add a new name.",
    partyKind: "SOURCE",
    partyLabel: "Received from",
    dateLabel: "Date received",
    refLabel: "Sender's ref. no.",
    placeLabel: "Where filed",
    emptyForm: () => ({
      date: today(), item_type: "LETTER", party_id: null, party_name: "",
      ref_no: "", ref_date: "", subject: "", place: "", folio: "", remarks: "", edms_document_id: "",
      origin: "EXTERNAL",
    }),
    toBody: (f) => ({
      date_received: f.date, item_type: f.item_type, origin: f.origin, source_party_id: f.party_id,
      sender_ref_no: f.ref_no || null, sender_ref_date: f.ref_date || null, subject: f.subject,
      filed_location: f.place || null, folio_no: f.folio || null, remarks: f.remarks || null,
      edms_document_id: f.edms_document_id ? Number(f.edms_document_id) : null,
    }),
    columns: [
      { label: "S/No", render: (r) => `${r.serial_no}/${r.register_year}` },
      { label: "Date received", render: (r) => fmtDate(r.date_received) },
      { label: "Received from", render: (r) => r.source_name },
      { label: "Sender's ref.", render: (r) => r.sender_ref_no ? `${r.sender_ref_no}${r.sender_ref_date ? ` (${fmtDate(r.sender_ref_date)})` : ""}` : "—" },
      { label: "Subject", render: (r) => r.subject },
      { label: "Type", render: (r) => ITEM_TYPES.find((t) => t.value === r.item_type)?.label || r.item_type },
      { label: "Where filed / folio", render: (r) => [r.filed_location, r.folio_no && `folio ${r.folio_no}`].filter(Boolean).join(" · ") || "—" },
    ],
  },
  outward: {
    title: "Outward Mail Register",
    intro: "Record each letter, memo or file as it leaves the registry. Pick who it is going to, or add a new name.",
    partyKind: "DESTINATION",
    partyLabel: "Sent to",
    dateLabel: "Date dispatched",
    refLabel: "Our ref. no.",
    placeLabel: "Dispatch mode",
    emptyForm: () => ({
      date: today(), item_type: "LETTER", party_id: null, party_name: "",
      ref_no: "", subject: "", mode: "POST", acknowledged_on: "", remarks: "", edms_document_id: "",
    }),
    toBody: (f) => ({
      date_dispatched: f.date, item_type: f.item_type, destination_party_id: f.party_id,
      our_ref_no: f.ref_no || null, subject: f.subject, dispatch_mode: f.mode,
      acknowledged_on: f.acknowledged_on || null, remarks: f.remarks || null,
      edms_document_id: f.edms_document_id ? Number(f.edms_document_id) : null,
    }),
    columns: [
      { label: "S/No", render: (r) => `${r.serial_no}/${r.register_year}` },
      { label: "Date dispatched", render: (r) => fmtDate(r.date_dispatched) },
      { label: "Sent to", render: (r) => r.destination_name },
      { label: "Our ref.", render: (r) => r.our_ref_no || "—" },
      { label: "Subject", render: (r) => r.subject },
      { label: "Type", render: (r) => ITEM_TYPES.find((t) => t.value === r.item_type)?.label || r.item_type },
      { label: "Mode / acknowledged", render: (r) => `${DISPATCH_MODES.find((m) => m.value === r.dispatch_mode)?.label || r.dispatch_mode}${r.acknowledged_on ? ` · acknowledged ${fmtDate(r.acknowledged_on)}` : ""}` },
    ],
  },
};

/**
 * An entry register: a form that adds rows, a filterable table, Excel download.
 * Entries are never deleted. A wrong entry is voided with a reason and keeps its number.
 */
const RegisterPage = ({ kind }) => {
  const cfg = CONFIG[kind];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(cfg.emptyForm());
  const [saving, setSaving] = useState(false);
  const [registry, setRegistry] = useState("SUBJECT");
  const [filters, setFilters] = useState({ from: "", to: "", q: "", edms: "", includeVoided: true });

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
      edms: filters.edms || undefined,
      includeVoided: filters.includeVoided,
      registry,
    };
    listRegister(kind, params)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch((err) => toast.error(err?.response?.data?.message || "Could not load the register."))
      .finally(() => setLoading(false));
  }, [kind, filters, registry]);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSave = Boolean(form.party_id) && form.subject.trim() && form.date;

  const save = async () => {
    setSaving(true);
    try {
      const res = await createRegisterEntry(kind, { ...cfg.toBody(form), registry });
      const created = res?.data ?? res;
      toast.success(`Recorded as S/No ${created.serial_no}/${created.register_year}.`);
      setForm(cfg.emptyForm());
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "The entry could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const voidEntry = async (row) => {
    const reason = window.prompt(`Why is S/No ${row.serial_no}/${row.register_year} being voided? It keeps its number.`);
    if (!reason || !reason.trim()) return;
    try {
      await voidRegisterEntry(kind, row.id, reason.trim());
      toast.success("Entry voided.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not void the entry.");
    }
  };

  const linkDocument = async (row) => {
    const value = window.prompt("EDMS document ID to link to this entry:");
    if (!value || !/^\d+$/.test(value.trim())) return;
    try {
      await linkRegisterDocument(kind, row.id, Number(value.trim()));
      toast.success("Linked to the EDMS document.");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not link the document.");
    }
  };

  const exportExcel = () => {
    downloadRegisterExcel(kind, {
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
      edms: filters.edms || undefined,
      registry,
    }).catch((err) => toast.error(err?.response?.data?.message || "The Excel file could not be created."));
  };

  return (
    <DashboardLayout>
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">{cfg.title} — {REGISTRIES.find((r) => r.value === registry).label}</h5>
            <div className="text-muted small">{cfg.intro}</div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-success" onClick={exportExcel}>
              <i className="ti ti-file-spreadsheet me-1" />Download Excel
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowForm((s) => !s)}>
              <i className={`ti ${showForm ? "ti-x" : "ti-plus"} me-1`} />{showForm ? "Close form" : "New entry"}
            </button>
          </div>
        </div>

        <ul className="nav nav-tabs mb-3" role="tablist">
          {REGISTRIES.map((r) => (
            <li className="nav-item" key={r.value} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={registry === r.value}
                className={`nav-link ${registry === r.value ? "active" : ""}`}
                onClick={() => setRegistry(r.value)}
              >
                <i className={`ti ${r.icon} me-1`} />{r.label}
              </button>
            </li>
          ))}
        </ul>

        {showForm && (
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-body">
              <div className="row g-2">
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">{cfg.dateLabel} <span className="text-danger">*</span></label>
                  <input type="date" className="form-control form-control-sm" value={form.date} onChange={set("date")} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Type</label>
                  <select className="form-select form-select-sm" value={form.item_type} onChange={set("item_type")}>
                    {ITEM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {kind === "inward" && (
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Internal or external</label>
                    <select className="form-select form-select-sm" value={form.origin} onChange={set("origin")}>
                      <option value="EXTERNAL">External (from outside)</option>
                      <option value="INTERNAL">Internal (within the organisation)</option>
                    </select>
                  </div>
                )}
                <div className="col-md-6">
                  <PartySelect
                    kind={cfg.partyKind}
                    label={cfg.partyLabel}
                    required
                    value={form.party_id}
                    onChange={(id, name) => setForm((f) => ({ ...f, party_id: id, party_name: name }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Subject <span className="text-danger">*</span></label>
                  <input className="form-control form-control-sm" value={form.subject} onChange={set("subject")} maxLength={500} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">{cfg.refLabel}</label>
                  <input className="form-control form-control-sm" value={form.ref_no} onChange={set("ref_no")} maxLength={100} />
                </div>
                {kind === "inward" ? (
                  <>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Date on sender's letter</label>
                      <input type="date" className="form-control form-control-sm" value={form.ref_date} onChange={set("ref_date")} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">{cfg.placeLabel}</label>
                      <input className="form-control form-control-sm" value={form.place} onChange={set("place")} maxLength={200} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Folio no.</label>
                      <input className="form-control form-control-sm" value={form.folio} onChange={set("folio")} maxLength={50} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">{cfg.placeLabel}</label>
                      <select className="form-select form-select-sm" value={form.mode} onChange={set("mode")}>
                        {DISPATCH_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Acknowledged on</label>
                      <input type="date" className="form-control form-control-sm" value={form.acknowledged_on} onChange={set("acknowledged_on")} />
                    </div>
                  </>
                )}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Remarks</label>
                  <input className="form-control form-control-sm" value={form.remarks} onChange={set("remarks")} maxLength={1000} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">EDMS document ID (if uploaded)</label>
                  <input className="form-control form-control-sm" inputMode="numeric" value={form.edms_document_id} onChange={set("edms_document_id")} />
                </div>
              </div>
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!canSave || saving}>
                  {saving ? "Saving…" : "Record entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-6 col-md-2">
                <label className="form-label small">From</label>
                <input type="date" className="form-control form-control-sm" value={filters.from}
                  onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small">To</label>
                <input type="date" className="form-control form-control-sm" value={filters.to}
                  onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Search</label>
                <input className="form-control form-control-sm" placeholder="Name, subject or reference"
                  value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small">In EDMS</label>
                <select className="form-select form-select-sm" value={filters.edms}
                  onChange={(e) => setFilters((f) => ({ ...f, edms: e.target.value }))}>
                  <option value="">All</option>
                  <option value="YES">Uploaded</option>
                  <option value="NO">Not uploaded</option>
                </select>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check mt-4">
                  <input className="form-check-input" type="checkbox" id={`${kind}-voided`} checked={filters.includeVoided}
                    onChange={(e) => setFilters((f) => ({ ...f, includeVoided: e.target.checked }))} />
                  <label className="form-check-label small" htmlFor={`${kind}-voided`}>Show voided entries</label>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-muted small">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="text-muted small">No entries match these filters in the {REGISTRIES.find((r) => r.value === registry).label} registry.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.82rem" }}>
                  <thead className="table-light">
                    <tr>
                      {cfg.columns.map((c) => <th key={c.label}>{c.label}</th>)}
                      <th>In EDMS</th>
                      <th>Recorded by</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className={r.is_voided ? "text-muted text-decoration-line-through" : ""}>
                        {cfg.columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
                        <td>
                          {r.edms_document_id ? (
                            <a href={`/ed-mgt/documents/${r.edms_document_id}`} className="badge text-bg-success text-decoration-none">
                              {r.edms_document_reference || `Doc ${r.edms_document_id}`}
                            </a>
                          ) : (
                            <span className="badge text-bg-light border text-muted">No</span>
                          )}
                        </td>
                        <td>{r.recorded_by_name || "—"}</td>
                        <td className="text-end text-nowrap">
                          {r.is_voided ? (
                            <span className="badge text-bg-secondary">Voided</span>
                          ) : (
                            <>
                              {!r.edms_document_id && (
                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => linkDocument(r)}>
                                  Link to EDMS
                                </button>
                              )}
                              <button className="btn btn-sm btn-outline-danger" onClick={() => voidEntry(r)}>Void</button>
                            </>
                          )}
                          {r.is_voided && r.void_reason && <div className="small text-muted text-start">{r.void_reason}</div>}
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

export default RegisterPage;
