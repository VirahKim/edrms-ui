import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getRelationships, addRelationship, removeRelationship, searchReferenceTargets,
} from "../../../api/edmsApi";
import PhysicalEnclosuresPanel from "./PhysicalEnclosuresPanel";
import { toast } from "./EDMSToast";
import { searchFailureMessage } from "../utils/inwardIntake";

const RELATIONSHIP_TYPES = ["REFERENCES", "SUPPORTS", "AMENDS", "SUPERSEDES", "REPLACES"];

const unwrap = (r) =>
  Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.items) ? r.items : [];

const whereLabel = (name, reference, folio) =>
  [reference || name, folio != null && folio !== "" && `folio ${folio}`].filter(Boolean).join(", ");

/**
 * Cross-references and physical enclosures of one document, shown wherever its details are.
 *   mode="summary"  read-only, for the Overview tab (onManage opens the full tab)
 *   mode="manage"   add / remove cross-references and enclosures
 * Cross-references can point at mail in the same file, a different file, or several files.
 */
const DocumentReferences = ({ doc, mode = "summary", onManage, hidePicker = false, showPaper = true }) => {
  const manage = mode === "manage";
  const [rels, setRels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // manage-mode picker
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState(null);
  const [relType, setRelType] = useState("REFERENCES");
  const [adding, setAdding] = useState(false);

  const load = useCallback(() =>
    getRelationships(doc.id)
      .then((r) => { setLoadError(""); setRels(unwrap(r)); })
      .catch((e) => setLoadError(e?.response?.status === 404
        ? "Not available - this letter is no longer open to you."
        : (e?.response?.data?.message || "Could not load the cross-references right now.")))
      .finally(() => setLoading(false)), [doc.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!manage || query.trim().length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchReferenceTargets({ q: query.trim(), exclude_id: doc.id })
        .then((r) => { if (!cancelled) setResults(Array.isArray(r?.data) ? r.data : []); })
        .catch((err) => { if (!cancelled) { setResults([]); toast.error(searchFailureMessage(err)); } });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [manage, query, doc.id]);

  const add = async () => {
    if (!target) return;
    setAdding(true);
    try {
      await addRelationship(doc.id, { target_document_id: target.id, relationship_type: relType });
      toast.success("Cross-reference added.");
      setQuery(""); setResults([]); setTarget(null);
      await load();
    } catch (e) { toast.error(e?.response?.data?.message || "Failed to add the cross-reference."); }
    finally { setAdding(false); }
  };

  const remove = async (relId) => {
    try { await removeRelationship(doc.id, relId); toast.success("Removed."); await load(); }
    catch (e) { toast.error(e?.response?.data?.message || "Failed to remove."); }
  };

  // Normalise each row to "the other document" from this document's point of view.
  const items = rels.map((r) => {
    const outgoing = r.source_document_id === doc.id;
    return outgoing
      ? { id: r.id, outgoing, type: r.relationship_type, otherId: r.target_document_id, title: r.target_document_title,
          reference: r.target_document_reference, place: whereLabel(r.target_folder_name, r.target_folder_reference, r.target_folio_label ?? r.target_folio_number),
          sameFile: r.target_folder_id != null && r.target_folder_id === r.source_folder_id }
      : { id: r.id, outgoing, type: r.relationship_type, otherId: r.source_document_id, title: r.source_document_title,
          reference: r.source_document_reference, place: whereLabel(r.source_folder_name, r.source_folder_reference, r.source_folio_label ?? r.source_folio_number),
          sameFile: r.target_folder_id != null && r.target_folder_id === r.source_folder_id };
  });
  const refersTo = items.filter((i) => i.outgoing && i.type === "REFERENCES");
  const referredBy = items.filter((i) => !i.outgoing && i.type === "REFERENCES");
  const other = items.filter((i) => i.type !== "REFERENCES");

  const Row = ({ i }) => (
    <div className="d-flex justify-content-between align-items-start rounded bg-light py-2 px-3 text-start">
      <div className="min-w-0">
        {i.type !== "REFERENCES" && <span className="badge bg-secondary me-2">{i.type}{i.outgoing ? "" : " (by)"}</span>}
        <Link to={`/ed-mgt/documents/${i.otherId}`}>{i.title || `Document #${i.otherId}`}</Link>
        <span className={`badge ms-2 ${i.sameFile ? "text-bg-success" : "text-bg-info"}`}>{i.sameFile ? "Same file" : "Other file"}</span>
        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{[i.place, i.reference].filter(Boolean).join(" · ")}</div>
      </div>
      {manage && (
        <button className="btn btn-sm btn-outline-danger ms-2" title="Remove" onClick={() => remove(i.id)}><i className="ti ti-x"></i></button>
      )}
    </div>
  );

  const Group = ({ title, rows, empty }) => (
    <div className="mb-2">
      <div className="fw-semibold small mb-1">{title}</div>
      {rows.length === 0
        ? <div className="text-muted small">{empty}</div>
        : <div className="d-flex flex-column gap-2">{rows.map((i) => <Row key={i.id} i={i} />)}</div>}
    </div>
  );

  if (loading) return <div className="text-muted small">Loading…</div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="mb-0"><i className="ti ti-link me-2 text-primary"></i>Cross-references</h6>
        {!manage && onManage && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onManage}>Manage</button>
        )}
      </div>

      {loadError ? (
        <div className="text-muted small mb-3"><i className="ti ti-lock me-1"></i>{loadError}</div>
      ) : (
        <>
          <Group title="This document refers to" rows={refersTo} empty="No cross-references." />
          <Group title="Referred to by" rows={referredBy} empty="No other document refers to this one." />
        </>
      )}
      {other.length > 0 && <Group title="Other related documents" rows={other} empty="" />}

      {manage && !hidePicker && (
        <div className="card border-0 bg-light mb-2">
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-6 position-relative">
                <label className="form-label small mb-1">Find a document to cross-reference</label>
                <input className="form-control form-control-sm" placeholder="Subject, sender, reference no., file or folio…"
                       value={query} onChange={(e) => { setQuery(e.target.value); setTarget(null); }} />
                {!target && results.length > 0 && query.trim().length >= 2 && (
                  <div className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10, maxHeight: 240, overflowY: "auto" }}>
                    {results.map((d) => (
                      <button key={d.id} type="button" className="list-group-item list-group-item-action py-1"
                              onClick={() => { setTarget(d); setQuery(d.title); setResults([]); }}>
                        <div style={{ fontSize: "0.85rem" }}>{d.title}</div>
                        <small className="text-muted">
                          {[d.register_serial && `S/NO ${d.register_serial}`, d.source_name, whereLabel(d.folder_name, d.folder_reference, d.folio_label ?? d.folio_number)]
                            .filter(Boolean).join(" · ")}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-auto">
                <label className="form-label small mb-1">Relationship</label>
                <select className="form-select form-select-sm" value={relType} onChange={(e) => setRelType(e.target.value)}>
                  {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t === "REFERENCES" ? "REFERS TO" : t}</option>)}
                </select>
              </div>
              <div className="col-auto">
                <button className="btn btn-primary btn-sm" onClick={add} disabled={adding || !target}>
                  {adding ? <span className="spinner-border spinner-border-sm"></span> : <><i className="ti ti-plus me-1"></i>Add</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaper && <PhysicalEnclosuresPanel documentId={doc.id} readOnly={!manage} kind="ENCLOSURE" />}
      {showPaper && <PhysicalEnclosuresPanel documentId={doc.id} readOnly={!manage} kind="REFERENCE" />}
    </div>
  );
};

export default DocumentReferences;
