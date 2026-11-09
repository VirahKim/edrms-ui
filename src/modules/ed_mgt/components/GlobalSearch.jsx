import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { globalSearch, getRelatedLetters } from "../../../api/searchApi";
import { getRegistries } from "../../../api/edmsApi";

const SCOPES = [
  { key: "all", label: "Everything" },
  { key: "letters", label: "Letters" },
  { key: "files", label: "Files" },
];

const LINK_LABEL = {
  REFERS_TO: "This letter refers to",
  REFERRED_BY: "Refers to this letter",
  AMENDS: "This letter amends",
  AMENDS_BY: "Amended by",
  SUPERSEDES: "This letter supersedes",
  SUPERSEDES_BY: "Superseded by",
  REPLACES: "This letter replaces",
  REPLACES_BY: "Replaced by",
  SUPPORTS: "This letter supports",
  SUPPORTS_BY: "Supported by",
};

const fmtRelative = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 43200) return `${Math.floor(mins / 1440)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Shows the words that were searched for in bold yellow.
const Highlight = ({ text, terms }) => {
  if (!text) return null;
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  return (
    <>
      {String(text).split(re).map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase())
          ? <mark key={i} className="px-0" style={{ background: "#fff3a3" }}>{part}</mark>
          : <React.Fragment key={i}>{part}</React.Fragment>)}
    </>
  );
};

// Registry > Cabinet > Shelf (rack): where the paper file physically is.
const Place = ({ r }) => {
  const parts = [r.registry_name, r.cabinet_name, r.shelf_name, r.current_rack && `Rack ${r.current_rack}`].filter(Boolean);
  return (
    <span className="text-muted">
      <i className="ti ti-map-pin me-1" />
      {parts.length ? parts.join(" › ") : "No registry or shelf recorded"}
    </span>
  );
};

const Status = ({ r }) => (
  <>
    {r.routing_stage_label && <span className="badge text-bg-info me-1" style={{ fontSize: "0.65rem" }}><i className="ti ti-send me-1" />{r.routing_stage_label}</span>}
    {r.custody && <span className="badge text-bg-warning me-1" style={{ fontSize: "0.65rem" }}><i className="ti ti-folders me-1" />{r.custody}</span>}
  </>
);

const NoAccess = () => (
  <span className="badge text-bg-secondary me-1" style={{ fontSize: "0.65rem" }} title="You can see where it is, but not open it.">
    <i className="ti ti-lock me-1" />No access - location only
  </span>
);

const RelatedList = ({ title, rows, onOpen }) => (
  rows.length === 0 ? null : (
    <div className="mb-2">
      <div className="fw-semibold small mb-1">{title}</div>
      {rows.map((x) => (
        <div key={`${x.link}-${x.id}`} className="d-flex align-items-start gap-2 py-1 border-bottom" style={{ fontSize: "0.8rem" }}>
          <i className={`ti ${x.can_view ? "ti-file-text" : "ti-lock"} mt-1 text-muted`} />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            {x.can_view
              ? <a href={`/ed-mgt/documents/${x.id}`} onClick={(e) => { e.preventDefault(); onOpen(`/ed-mgt/documents/${x.id}`); }}>{x.title}</a>
              : <span>{x.title} <NoAccess /></span>}
            <div className="text-muted" style={{ fontSize: "0.72rem" }}>
              {[x.folio_label && `Folio ${x.folio_label}`, x.document_reference, x.folder_name, x.registry_name].filter(Boolean).join(" · ")}
              {x.link !== "SAME_FILE" && <span className="ms-2 fst-italic">{LINK_LABEL[x.link] || x.link}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
);

/**
 * Global search over every registry: any letter or file, where it is (registry, cabinet, shelf, rack),
 * where the file is in routing and who holds the paper, and the letters it is linked to. Letters you
 * cannot open are located but not opened. `onOpenFile(folderId)` shows a file in the Files page.
 */
const GlobalSearch = ({ onOpenFile }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [registryId, setRegistryId] = useState("");
  const [registries, setRegistries] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [related, setRelated] = useState({});     // letterId -> { loading, data, error }
  const [expanded, setExpanded] = useState({});
  const boxRef = useRef(null);
  const ticket = useRef(0);

  const terms = useMemo(() => query.split(/\s+/).filter((t) => t.length > 0), [query]);

  useEffect(() => {
    getRegistries()
      .then((r) => setRegistries(r?.data?.items || r?.data || (Array.isArray(r) ? r : [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults(null); setError(""); setLoading(false); return undefined; }
    const mine = ++ticket.current;
    setLoading(true);
    const timer = setTimeout(() => {
      globalSearch(query.trim(), scope, registryId || null)
        .then((r) => { if (mine === ticket.current) { setResults(r?.data ?? r); setError(""); setRelated({}); setExpanded({}); } })
        .catch((e) => { if (mine === ticket.current) { setResults(null); setError(e?.response?.data?.message || "Search failed."); } })
        .finally(() => { if (mine === ticket.current) setLoading(false); });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, scope, registryId]);

  // Close when clicking elsewhere or pressing Escape.
  useEffect(() => {
    const away = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const go = (path) => { setOpen(false); navigate(path); };
  const openFile = (folderId) => { setOpen(false); onOpenFile?.(folderId); };

  const toggleRelated = (letter) => {
    const nowOpen = !expanded[letter.id];
    setExpanded((x) => ({ ...x, [letter.id]: nowOpen }));
    if (nowOpen && !related[letter.id]) {
      setRelated((x) => ({ ...x, [letter.id]: { loading: true } }));
      getRelatedLetters(letter.id)
        .then((r) => setRelated((x) => ({ ...x, [letter.id]: { data: r?.data ?? r } })))
        .catch((e) => setRelated((x) => ({ ...x, [letter.id]: { error: e?.response?.data?.message || "Could not load related letters." } })));
    }
  };

  const showPanel = open && (loading || results || error);
  const letters = results?.letters || [];
  const files = results?.files || [];

  return (
    <div ref={boxRef} className="position-relative mb-2" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <div className="card border-0 shadow-sm">
        <div className="card-body py-2 px-3">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="input-group flex-grow-1" style={{ minWidth: 280 }}>
              <span className="input-group-text bg-transparent border-end-0">
                {loading ? <span className="spinner-border spinner-border-sm text-primary" /> : <i className="ti ti-search text-primary" />}
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search any letter or file in all registries - subject, reference, folio, sender, file name, shelf…"
                value={query}
                onFocus={() => setOpen(true)}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              />
              {query && (
                <button className="btn btn-outline-secondary" type="button" title="Clear" onClick={() => { setQuery(""); setResults(null); }}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
            <div className="btn-group btn-group-sm" role="group">
              {SCOPES.map((s) => (
                <button key={s.key} type="button" className={`btn ${scope === s.key ? "btn-primary" : "btn-outline-secondary"}`} onClick={() => setScope(s.key)}>
                  {s.label}
                </button>
              ))}
            </div>
            <select className="form-select form-select-sm" style={{ width: 200 }} value={registryId} onChange={(e) => setRegistryId(e.target.value)}>
              <option value="">All registries</option>
              {registries.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="card border-0 shadow position-absolute w-100 mt-1" style={{ zIndex: 1030 }}>
          <div className="card-body p-0 qb-scroll" style={{ maxHeight: "62vh", overflowY: "auto" }}>
            {error ? <div className="p-3 text-danger small">{error}</div>
              : !results ? <div className="p-3 text-muted small">Searching…</div>
              : letters.length === 0 && files.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="ti ti-zoom-cancel" style={{ fontSize: 36, color: "#dee2e6" }} />
                  <div className="mt-2">Nothing found for "{query.trim()}"{registryId ? " in that registry" : ""}.</div>
                  <div className="small">Try fewer words, the reference number, or the sender's name.</div>
                </div>
              ) : (
                <>
                  {files.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-light small fw-semibold border-bottom">
                        <i className="ti ti-folders me-1 text-warning" />Files ({results.files_total}{results.files_total > files.length ? `, showing ${files.length}` : ""})
                      </div>
                      {files.map((f) => (
                        <div key={`f${f.id}`} className="px-3 py-2 border-bottom d-flex align-items-start gap-3">
                          <i className="ti ti-folder mt-1 text-warning" style={{ fontSize: "1.3rem" }} />
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-semibold"><Highlight text={f.name} terms={terms} /></div>
                            <div className="small text-muted">
                              <Highlight text={[f.reference_no, f.volume_no && `Vol. ${f.volume_no}`].filter(Boolean).join(" · ")} terms={terms} />
                              {` · ${f.document_count} letter${f.document_count === 1 ? "" : "s"}`}
                              {f.last_activity_at && ` · active ${fmtRelative(f.last_activity_at)}`}
                            </div>
                            <div className="small"><Place r={f} /></div>
                            <div className="mt-1"><Status r={f} />{!f.can_view && <NoAccess />}</div>
                          </div>
                          {f.can_view
                            ? <button className="btn btn-sm btn-outline-primary text-nowrap" onClick={() => openFile(f.id)}>Open file</button>
                            : <Link className="btn btn-sm btn-outline-secondary text-nowrap" to="/ed-mgt/access-requests" onClick={() => setOpen(false)}>Ask for access</Link>}
                        </div>
                      ))}
                    </div>
                  )}

                  {letters.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-light small fw-semibold border-bottom">
                        <i className="ti ti-file-text me-1 text-primary" />Letters ({results.letters_total}{results.letters_total > letters.length ? `, showing ${letters.length}` : ""})
                      </div>
                      {letters.map((l) => {
                        const rel = related[l.id];
                        return (
                          <div key={`l${l.id}`} className="px-3 py-2 border-bottom">
                            <div className="d-flex align-items-start gap-3">
                              <i className={`ti ${l.can_view ? "ti-file-text text-primary" : "ti-lock text-secondary"} mt-1`} style={{ fontSize: "1.3rem" }} />
                              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <div className="fw-semibold"><Highlight text={l.title} terms={terms} /></div>
                                <div className="small text-muted">
                                  <Highlight
                                    text={[l.document_reference, l.folio_label && `Folio ${l.folio_label}`, l.register_serial && `Register ${l.register_serial}`,
                                      l.source_name && `From ${l.source_name}`, l.sender_ref_no && `Their ref ${l.sender_ref_no}`].filter(Boolean).join(" · ")}
                                    terms={terms} />
                                </div>
                                <div className="small">
                                  {l.folder_name ? (
                                    <span><i className="ti ti-folder me-1 text-warning" />In <strong><Highlight text={l.folder_name} terms={terms} /></strong>
                                      {l.folder_reference && ` (${l.folder_reference}${l.volume_no ? `, Vol. ${l.volume_no}` : ""})`}</span>
                                  ) : <span className="text-muted">Not filed in any file</span>}
                                </div>
                                <div className="small"><Place r={l} /></div>
                                <div className="mt-1"><Status r={l} />{!l.can_view && <NoAccess />}</div>
                              </div>
                              <div className="d-flex flex-column gap-1 align-items-stretch">
                                {l.can_view
                                  ? <button className="btn btn-sm btn-outline-primary text-nowrap" onClick={() => go(`/ed-mgt/documents/${l.id}`)}>Open letter</button>
                                  : <Link className="btn btn-sm btn-outline-secondary text-nowrap" to="/ed-mgt/access-requests" onClick={() => setOpen(false)}>Ask for access</Link>}
                                {l.folder_id && (
                                  <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => openFile(l.folder_id)}>Go to file</button>
                                )}
                                <button className="btn btn-sm btn-link text-nowrap p-0" onClick={() => toggleRelated(l)}>
                                  <i className={`ti ${expanded[l.id] ? "ti-chevron-up" : "ti-chevron-down"} me-1`} />
                                  Related{l.related_count ? ` (${l.related_count})` : ""}
                                </button>
                              </div>
                            </div>
                            {expanded[l.id] && (
                              <div className="mt-2 ms-4 ps-3 border-start">
                                {!rel || rel.loading ? <div className="text-muted small">Loading related letters…</div>
                                  : rel.error ? <div className="text-danger small">{rel.error}</div>
                                  : (rel.data.cross_references.length === 0 && rel.data.same_file.length === 0)
                                    ? <div className="text-muted small">No cross-references, and no other letters in this file.</div>
                                    : (
                                      <>
                                        <RelatedList title="Cross-references" rows={rel.data.cross_references} onOpen={go} />
                                        <RelatedList title="Other letters in the same file" rows={rel.data.same_file} onOpen={go} />
                                      </>
                                    )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
