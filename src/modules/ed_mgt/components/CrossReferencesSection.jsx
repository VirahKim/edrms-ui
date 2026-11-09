import React, { useEffect, useState } from "react";
import { searchReferenceTargets } from "../../../api/edmsApi";
import { FieldLabel } from "./Tooltip";
import { searchFailureMessage } from "../utils/inwardIntake";

const where = (d) =>
  [d.folder_reference || d.folder_name, (d.folio_label ?? d.folio_number) != null && `folio ${d.folio_label ?? d.folio_number}`].filter(Boolean).join(", ");

/**
 * Two optional parts of the details form:
 *   - Cross-references: other letters/documents this one refers to, found across every
 *     file (same file, another file, or several files).
 *   - Physical enclosures: things that came with it but cannot be uploaded (a book, a bulky
 *     report) and are kept on paper — what they are and where they are kept.
 *
 *   value      the form (uses value.cross_refs and value.enclosures)
 *   onChange   (patch) => void
 *   documentId the document being filed (never offered as its own reference)
 *   fileId     the file chosen in step 1 — used to tell "same file" from "other file"
 */
const CrossReferencesSection = ({ value, onChange, documentId, fileId }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError("");
      searchReferenceTargets({ q: query.trim(), exclude_id: documentId })
        .then((r) => { if (!cancelled) setResults(Array.isArray(r?.data) ? r.data : []); })
        .catch((err) => { if (!cancelled) { setResults([]); setSearchError(searchFailureMessage(err)); } })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, documentId]);

  const refs = value.cross_refs || [];
  const enclosures = value.enclosures || [];
  const shown = query.trim().length < 2 ? [] : results.filter((d) => !refs.some((r) => r.id === d.id));

  const addRef = (d) => { onChange({ cross_refs: [...refs, d] }); setQuery(""); setResults([]); };
  const removeRef = (id) => onChange({ cross_refs: refs.filter((r) => r.id !== id) });

  const setEnclosure = (i, patch) =>
    onChange({ enclosures: enclosures.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });

  return (
    <>
      <div className="col-12">
        <FieldLabel label="Cross-references"
          tooltip="Other mail or documents this one refers to - in the same file, in a different file, or across several files. Search by subject, sender, reference number, file or folio." />
        <input className="form-control" placeholder="Search by subject, sender, reference no., file or folio…"
               value={query} onChange={(e) => setQuery(e.target.value)} />
        {query.trim().length >= 2 && (
          <div className="list-group mt-1 shadow-sm" style={{ maxHeight: 220, overflowY: "auto" }}>
            {searching && <div className="list-group-item text-muted small">Searching…</div>}
            {!searching && searchError && <div className="list-group-item text-danger small">{searchError}</div>}
            {!searching && !searchError && shown.length === 0 && <div className="list-group-item text-muted small">Nothing found.</div>}
            {shown.map((d) => (
              <button key={d.id} type="button" className="list-group-item list-group-item-action py-2" onClick={() => addRef(d)}>
                <div className="fw-semibold" style={{ fontSize: "0.85rem" }}>{d.title}</div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {[d.register_serial && `S/NO ${d.register_serial}`, d.source_name, d.sender_ref_no, where(d), d.document_reference]
                    .filter(Boolean).join(" · ")}
                </div>
              </button>
            ))}
          </div>
        )}
        {refs.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {refs.map((d) => {
              const sameFile = fileId && String(d.folder_id) === String(fileId);
              return (
                <span key={d.id} className="badge bg-light text-dark border d-inline-flex align-items-center gap-2 py-2"
                      style={{ fontWeight: 500, fontSize: "0.78rem", maxWidth: "100%" }}>
                  <i className="ti ti-link text-primary"></i>
                  <span className="text-truncate" style={{ maxWidth: 300 }} title={d.title}>{d.title}</span>
                  <span className={`badge ${sameFile ? "text-bg-success" : "text-bg-info"}`}>{sameFile ? "Same file" : "Other file"}</span>
                  {where(d) && <span className="text-muted">{where(d)}</span>}
                  <button type="button" className="btn-close" style={{ fontSize: "0.6rem" }} aria-label="Remove" onClick={() => removeRef(d.id)} />
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="col-12">
        <FieldLabel label="Physical enclosures"
          tooltip="Something that came with this document but can't be uploaded - a book, a bulky report, samples. It stays on paper; write its title and the number of copies so this letter points to it." />
        {enclosures.map((e, i) => (
          <div key={i} className="row g-2 mb-2 align-items-center">
            <div className="col-md-11">
              <input className="form-control form-control-sm" placeholder="Title and number of copies, e.g. Annual Report 2025 - 3 copies"
                     value={e.description} maxLength={500} onChange={(ev) => setEnclosure(i, { description: ev.target.value })} />
            </div>
            <div className="col-md-1 text-end">
              <button type="button" className="btn btn-sm btn-outline-danger" title="Remove"
                      onClick={() => onChange({ enclosures: enclosures.filter((_, idx) => idx !== i) })}>
                <i className="ti ti-trash"></i>
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-secondary btn-sm"
                onClick={() => onChange({ enclosures: [...enclosures, { description: "", quantity: "", kept_at: "" }] })}>
          <i className="ti ti-plus me-1"></i>Add a physical enclosure
        </button>
      </div>
    </>
  );
};

export default CrossReferencesSection;
