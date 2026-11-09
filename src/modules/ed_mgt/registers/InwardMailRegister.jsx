import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { listRegister, voidRegisterEntry, downloadRegisterExcel } from "../../../api/registersApi";
import EDMSToastProvider, { toast } from "../components/EDMSToast";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

/**
 * The Inward Mail Register — a report of everything filed through Upload (Single,
 * Bulk and Email). Entries are not typed in here: saving the Details step of an upload
 * writes the row. A wrong entry is voided with a reason and keeps its S/NO.
 */
const InwardMailRegister = () => {
  const [filters, setFilters] = useState({ from: "", to: "", q: "", includeVoided: true });
  const [reloads, setReloads] = useState(0);
  const [result, setResult] = useState({ key: null, rows: [] });

  // Loading is derived: the stored result belongs to an older filter set until the fetch lands.
  const key = `${JSON.stringify(filters)}#${reloads}`;
  const loading = result.key !== key;
  const rows = result.rows;

  useEffect(() => {
    let cancelled = false;
    listRegister("inward", {
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
      includeVoided: filters.includeVoided,
    })
      .then((res) => { if (!cancelled) setResult({ key, rows: Array.isArray(res?.data) ? res.data : res?.data?.data || [] }); })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Could not load the register.");
        if (!cancelled) setResult({ key, rows: [] });
      });
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const voidEntry = async (row) => {
    const reason = window.prompt(`Why is S/NO ${row.serial_no}/${row.register_year} being voided? It keeps its number.`);
    if (!reason || !reason.trim()) return;
    try {
      await voidRegisterEntry("inward", row.id, reason.trim());
      toast.success("Entry voided.");
      setReloads((n) => n + 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not void the entry.");
    }
  };

  const exportExcel = () => {
    downloadRegisterExcel("inward", {
      from: filters.from || undefined,
      to: filters.to || undefined,
      q: filters.q || undefined,
    }).catch((err) => toast.error(err?.response?.data?.message || "The Excel file could not be created."));
  };

  const validCount = rows.filter((r) => !r.is_voided).length;

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h5 className="fw-semibold mb-1">Inward Mail Register</h5>
            <div className="text-muted small">
              A report of every document filed through Upload — Single, Bulk and Email. To add an entry, upload the document and fill in its details.
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-success" onClick={exportExcel}>
              <i className="ti ti-file-spreadsheet me-1" />Download Excel
            </button>
            <Link to="/ed-mgt/registers/senders" className="btn btn-sm btn-outline-primary">
              <i className="ti ti-address-book me-1" />Mail Senders
            </Link>
            <Link to="/ed-mgt/documents/upload" className="btn btn-sm btn-primary">
              <i className="ti ti-upload me-1" />Upload document
            </Link>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-6 col-md-2">
                <label className="form-label small">Received from</label>
                <input type="date" className="form-control form-control-sm" value={filters.from}
                  onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small">Received to</label>
                <input type="date" className="form-control form-control-sm" value={filters.to}
                  onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Search</label>
                <input className="form-control form-control-sm" placeholder="Received from, subject or reference"
                  value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <div className="form-check mt-4">
                  <input className="form-check-input" type="checkbox" id="inward-voided" checked={filters.includeVoided}
                    onChange={(e) => setFilters((f) => ({ ...f, includeVoided: e.target.checked }))} />
                  <label className="form-check-label small" htmlFor="inward-voided">Show voided entries</label>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-muted small">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="text-muted small">No entries match these filters.</div>
            ) : (
              <>
                <div className="text-muted small mb-2">{validCount} entr{validCount === 1 ? "y" : "ies"}</div>
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: "0.82rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th>S/NO</th>
                        <th>Date Received</th>
                        <th>Received From</th>
                        <th>Reference No. &amp; Date</th>
                        <th>Subject</th>
                        <th>Where Filed</th>
                        <th>Folio</th>
                        <th>Cross-references</th>
                        <th>Physical enclosures</th>
                        <th>Document</th>
                        <th>Recorded by</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className={r.is_voided ? "text-muted text-decoration-line-through" : ""}>
                          <td className="text-nowrap">{r.serial_no}/{r.register_year}</td>
                          <td className="text-nowrap">{fmtDate(r.date_received)}</td>
                          <td style={{ minWidth: 160, maxWidth: 240, whiteSpace: "normal", overflowWrap: "anywhere" }}>{r.source_name}</td>
                          <td>
                            {r.sender_ref_no
                              ? `${r.sender_ref_no}${r.sender_ref_date ? ` (${fmtDate(r.sender_ref_date)})` : ""}`
                              : (r.sender_ref_date ? fmtDate(r.sender_ref_date) : "—")}
                          </td>
                          <td style={{ minWidth: 200, maxWidth: 320, whiteSpace: "normal", overflowWrap: "anywhere" }}>{r.subject}</td>
                          <td style={{ minWidth: 160, maxWidth: 240, whiteSpace: "normal", overflowWrap: "anywhere" }}>{r.filed_location || "—"}</td>
                          <td>{r.folio_no || "—"}</td>
                          <td style={{ minWidth: 220, maxWidth: 280, whiteSpace: "normal", overflowWrap: "anywhere" }}>{r.cross_references || "—"}</td>
                          <td style={{ minWidth: 200, maxWidth: 260, whiteSpace: "normal", overflowWrap: "anywhere" }}>{r.physical_enclosures || "—"}</td>
                          <td>
                            {r.edms_document_id ? (
                              <Link to={`/ed-mgt/documents/${r.edms_document_id}`} className="badge text-bg-success text-decoration-none">
                                {r.edms_document_reference || `Doc ${r.edms_document_id}`}
                              </Link>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{r.recorded_by_name || "—"}</td>
                          <td className="text-end text-nowrap">
                            {r.is_voided ? (
                              <span className="badge text-bg-secondary">Voided</span>
                            ) : (
                              <button className="btn btn-sm btn-outline-danger" title="Void a wrong entry (duplicate, wrong recipient, made by mistake). It is not deleted: it stays in the register, struck through, with your reason, and keeps its S/NO so the numbering has no gaps." onClick={() => voidEntry(r)}>Void</button>
                            )}
                            {r.is_voided && r.void_reason && <div className="small text-muted text-start">{r.void_reason}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InwardMailRegister;
