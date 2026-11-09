import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DocumentReferences from "../components/DocumentReferences";
import { toast } from "../components/EDMSToast";
import { addRelationship } from "../../../api/edmsApi";
import {
  searchCatalog, createAccessRequest, listAccessRequests, cancelAccessRequest, decideAccessRequest,
} from "../../../api/accessRequestsApi";

const STATUS_BADGE = {
  PENDING: "text-bg-warning",
  GRANTED: "text-bg-success",
  DECLINED: "text-bg-danger",
  CANCELLED: "text-bg-secondary",
};

/**
 * Everything an officer needs to bring other material to the letter on their desk:
 *   - find another letter or a whole file by subject or reference (its contents stay hidden);
 *   - ask the Central Registry for access to it, and see how the request is going;
 *   - once it opens, cross-reference it from this letter;
 *   - cite a book or legal document that is too big to scan, by subject, author or link.
 *   letter   { id, title } the letter being worked on
 *   isRegistry   the Registry Officer also answers the officers' requests for more files right here
 *   onChanged    called after a request is sent, cancelled or answered (the page refreshes its count)
 */
const ReferenceDesk = ({ routingId, letter, readOnly = false, isRegistry = false, onChanged }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ documents: [], files: [] });
  const [searching, setSearching] = useState(false);
  const [reasons, setReasons] = useState({});          // "d12" / "f3" -> reason text
  const [asking, setAsking] = useState(null);          // key of the item whose request form is open
  const [mine, setMine] = useState([]);
  const [busyKey, setBusyKey] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [incoming, setIncoming] = useState([]);        // Registry: requests from the officers on this file, waiting
  const [notes, setNotes] = useState({});
  const [days, setDays] = useState({});

  // Only the requests made for this file in routing.
  const loadMine = useCallback(() =>
    listAccessRequests({ mine: true })
      .then((r) => setMine((Array.isArray(r?.data) ? r.data : []).filter((x) => x.file_routing_id === routingId)))
      .catch(() => {}), [routingId]);
  useEffect(() => { loadMine(); }, [loadMine]);

  const loadIncoming = useCallback(() => {
    if (!isRegistry) return Promise.resolve();
    return listAccessRequests({ mine: false, status: "PENDING" })
      .then((r) => setIncoming((Array.isArray(r?.data) ? r.data : []).filter((x) => x.file_routing_id === routingId)))
      .catch(() => {});
  }, [isRegistry, routingId]);
  useEffect(() => { loadIncoming(); }, [loadIncoming]);

  const decide = async (row, grant) => {
    setBusyKey(`r${row.id}`);
    try {
      const chosen = days[row.id] ?? 30;
      await decideAccessRequest(row.id, { grant, note: (notes[row.id] || "").trim() || null, valid_days: grant && chosen > 0 ? chosen : null });
      toast.success(grant ? "Access granted." : "Request declined.");
      await loadIncoming();
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That did not work.");
    } finally {
      setBusyKey(null);
    }
  };

  const text = query.trim();
  useEffect(() => {
    if (text.length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchCatalog(text)
        .then((r) => { if (!cancelled) setResults(r?.data || { documents: [], files: [] }); })
        .catch(() => { if (!cancelled) setResults({ documents: [], files: [] }); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [text, refreshTick]);

  const shown = text.length >= 2 ? results : { documents: [], files: [] };

  const request = async (key, body) => {
    setBusyKey(key);
    try {
      await createAccessRequest({ ...body, reason: (reasons[key] || "").trim() || null, file_routing_id: routingId });
      toast.success("Request sent to the Registry Officer.");
      setAsking(null);
      setRefreshTick((n) => n + 1);
      await loadMine();
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not send the request.");
    } finally {
      setBusyKey(null);
    }
  };

  const crossReference = async (doc) => {
    setBusyKey(`x${doc.id}`);
    try {
      await addRelationship(letter.id, { target_document_id: doc.id, relationship_type: "REFERENCES" });
      toast.success(`"${doc.title}" is now cross-referenced from this letter.`);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not add the cross-reference.");
    } finally {
      setBusyKey(null);
    }
  };

  const cancel = async (id) => {
    try { await cancelAccessRequest(id); await loadMine(); setRefreshTick((n) => n + 1); onChanged?.(); }
    catch (e) { toast.error(e?.response?.data?.message || "Could not cancel."); }
  };

  // The one-line state of a search hit, and what can be done with it.
  const AskRow = ({ k, canView, status, onAsk, children }) => (
    <>
      {canView ? children : status === "PENDING" ? (
        <span className="badge text-bg-warning">Waiting for the Registry</span>
      ) : (
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setAsking(asking === k ? null : k)}>
          <i className="ti ti-lock-open me-1"></i>{status === "DECLINED" ? "Ask again" : "Request access"}
        </button>
      )}
      {asking === k && (
        <div className="w-100 mt-2">
          <input className="form-control form-control-sm mb-1" maxLength={1000} placeholder="Why do you need it? (optional)"
                 value={reasons[k] || ""} onChange={(e) => setReasons((r) => ({ ...r, [k]: e.target.value }))} />
          <button type="button" className="btn btn-primary btn-sm" disabled={busyKey === k} onClick={onAsk}>
            {busyKey === k ? <span className="spinner-border spinner-border-sm me-1"></span> : null}Send to the Registry
          </button>
        </div>
      )}
    </>
  );

  return (
    <div>
      {/* Registry Officer: what the officers on this file have asked for */}
      {isRegistry && (
        <div className="mb-3">
          <div className="fw-semibold mb-1"><i className="ti ti-inbox me-1 text-warning"></i>Requests for more files on this file</div>
          {incoming.length === 0 ? (
            <div className="text-muted small">No one is waiting for another file.</div>
          ) : incoming.map((r) => (
            <div key={r.id} className="border rounded p-2 mb-2 bg-warning bg-opacity-10">
              <div className="fw-semibold" style={{ fontSize: "0.86rem" }}>
                <i className={`ti ${r.document_id ? "ti-file-text" : "ti-folder text-warning"} me-1`}></i>{r.target_title}
              </div>
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                {[r.target_reference, `asked by ${r.requested_by_name || "an officer"}`, new Date(r.created_at).toLocaleString()].filter(Boolean).join(" · ")}
              </div>
              {r.reason && <div className="small mt-1">"{r.reason}"</div>}
              <input className="form-control form-control-sm mt-2" maxLength={1000} placeholder="Note to the officer (optional)"
                     value={notes[r.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
              <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                <select className="form-select form-select-sm w-auto" value={days[r.id] ?? 30}
                        onChange={(e) => setDays((d) => ({ ...d, [r.id]: Number(e.target.value) }))}>
                  <option value={7}>For 7 days</option>
                  <option value={14}>For 14 days</option>
                  <option value={30}>For 30 days</option>
                  <option value={90}>For 90 days</option>
                  <option value={0}>No end date</option>
                </select>
                <button type="button" className="btn btn-sm btn-success" disabled={busyKey === `r${r.id}`} onClick={() => decide(r, true)}>
                  <i className="ti ti-check me-1"></i>Give access
                </button>
                <button type="button" className="btn btn-sm btn-outline-danger" disabled={busyKey === `r${r.id}`} onClick={() => decide(r, false)}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
      <div className="fw-semibold mb-1"><i className="ti ti-folder-plus me-1 text-primary"></i>Need another file or letter to finish this?</div>
      <div className="text-muted small mb-2">
        Search for it by subject, reference or folio. You see only what it is - to read it, ask the Registry Officer for it and say why.
        You are told here when the Registry answers.
      </div>
      <input className="form-control form-control-sm mb-2" placeholder="Subject, reference number, file name or folio…"
             value={query} onChange={(e) => setQuery(e.target.value)} />
      {searching && <div className="text-muted small mb-2">Searching…</div>}

      {shown.files.length > 0 && (
        <div className="mb-2">
          <div className="small fw-semibold text-muted mb-1">Files</div>
          {shown.files.map((f) => {
            const k = `f${f.id}`;
            return (
              <div key={k} className="border rounded p-2 mb-1 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold" style={{ fontSize: "0.86rem" }}><i className="ti ti-folder text-warning me-1"></i>{f.name}</div>
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>{[f.reference_no, f.volume_no && `Vol. ${f.volume_no}`, f.registry_name].filter(Boolean).join(" · ")}</div>
                </div>
                <AskRow k={k} canView={f.can_view} status={f.request_status} onAsk={() => request(k, { folder_id: f.id })}>
                  <Link to="/ed-mgt/documents" className="btn btn-sm btn-outline-secondary">Open in Files</Link>
                </AskRow>
              </div>
            );
          })}
        </div>
      )}

      {shown.documents.length > 0 && (
        <div className="mb-3">
          <div className="small fw-semibold text-muted mb-1">Letters</div>
          {shown.documents.filter((d) => d.id !== letter?.id).map((d) => {
            const k = `d${d.id}`;
            return (
              <div key={k} className="border rounded p-2 mb-1 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="min-w-0">
                  <div className="fw-semibold" style={{ fontSize: "0.86rem" }}>{d.title}</div>
                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                    {[d.folder_reference || d.folder_name, d.folio_label && `folio ${d.folio_label}`, d.document_reference].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <AskRow k={k} canView={d.can_view} status={d.request_status} onAsk={() => request(k, { document_id: d.id })}>
                  <div className="d-flex gap-1">
                    <Link to={`/ed-mgt/documents/${d.id}`} className="btn btn-sm btn-outline-secondary" target="_blank">Open</Link>
                    <button type="button" className="btn btn-sm btn-primary" disabled={busyKey === `x${d.id}`} onClick={() => crossReference(d)}>
                      <i className="ti ti-link me-1"></i>Cross-reference
                    </button>
                  </div>
                </AskRow>
              </div>
            );
          })}
        </div>
      )}

      {text.length >= 2 && !searching && shown.files.length === 0 && shown.documents.length === 0 && (
        <div className="text-muted small mb-3">Nothing found.</div>
      )}
        </>
      )}

      {mine.length > 0 && (
        <div className="mb-3">
          <div className="small fw-semibold text-muted mb-1">My requests to the Registry Officer for this file</div>
          {mine.slice(0, 8).map((r) => (
            <div key={r.id} className="d-flex align-items-center justify-content-between gap-2 border-bottom py-1">
              <div className="min-w-0">
                <div style={{ fontSize: "0.82rem" }}>{r.target_title}</div>
                <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {r.document_id ? "Letter" : "File"}
                  {r.decision_note ? ` · ${r.decision_note}` : ""}
                  {r.status === "GRANTED" && r.access_expires_at ? ` · until ${new Date(r.access_expires_at).toLocaleDateString()}` : ""}
                </div>
              </div>
              <div className="d-flex align-items-center gap-1">
                <span className={`badge ${STATUS_BADGE[r.status] || "text-bg-secondary"}`}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</span>
                {r.status === "PENDING" && (
                  <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => cancel(r.id)} title="Cancel the request">
                    <i className="ti ti-x"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {letter && (
        <div className="border-top pt-3">
          <div className="fw-semibold mb-1">Cross-references of "{letter.title}"</div>
          {/* key: reload the lists after a cross-reference is added above */}
          <DocumentReferences key={`${letter.id}:${refreshTick}`} doc={{ id: letter.id }} mode={readOnly ? "summary" : "manage"} hidePicker showPaper={false} />
        </div>
      )}
    </div>
  );
};

export default ReferenceDesk;
