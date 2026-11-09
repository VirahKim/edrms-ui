import React, { useEffect, useRef, useState } from "react";
import { getDocumentRoutingNotes } from "../../../api/fileRoutingApi";
import { getDocumentSignatureStamps, openDocumentPrintPack } from "../../../api/edmsApi";
import { toRoman } from "../utils/routingNotes";
import { getDocumentStampApplications } from "../../../api/orgStampsApi";
import DocumentPreviewPanel from "./DocumentPreviewPanel";
import PinPlacementLayer from "./PinPlacementLayer";
import PdfPages from "./PdfPages";

const fmt = (iso) => new Date(iso).toLocaleString();

/**
 * A card the reader can pick up (press and move, like the pinned sticky notes) and put elsewhere on the letter, or fold up,
 * to read what is underneath. It only changes how this reader sees it - nothing is saved.
 */
const MovableCard = ({ rootRef, offset, onMove, folded, onFold, children, title }) => {
  const cardRef = useRef(null);
  const drag = useRef(null);

  // Like the pinned sticky notes: press anywhere on the card and move a few pixels to pick it up.
  const start = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest("button")) return;
    const card = cardRef.current?.getBoundingClientRect();
    const root = rootRef.current?.getBoundingClientRect();
    if (!card || !root) return;
    drag.current = { x: e.clientX, y: e.clientY, startOffset: offset, card, root, moving: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moving && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 3) return;
    d.moving = true;
    // Keep the card inside the letter's frame.
    const dx = Math.min(Math.max(e.clientX - d.x, d.root.left - d.card.left), d.root.right - d.card.right);
    const dy = Math.min(Math.max(e.clientY - d.y, d.root.top - d.card.top), d.root.bottom - d.card.bottom);
    onMove({ x: d.startOffset.x + dx, y: d.startOffset.y + dy });
  };
  const end = () => { drag.current = null; };

  return (
    <div ref={cardRef}
         style={{
           transform: `translate(${offset.x}px, ${offset.y}px)`, pointerEvents: "auto", position: "relative",
           width: "fit-content", minWidth: 220, maxWidth: "70%", cursor: "grab", touchAction: "none", userSelect: "none",
         }}
         onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
         title="Drag to move this note out of the way">
      <div className="d-flex align-items-center justify-content-between px-2 rounded-top"
           style={{ background: "rgba(13,110,253,0.12)", fontSize: "0.65rem" }}>
        <span className="text-muted"><i className="ti ti-grip-horizontal me-1"></i>{title}</span>
        <button type="button" className="btn btn-sm p-0 border-0 text-muted" style={{ lineHeight: 1, cursor: "pointer" }}
                onClick={onFold} title={folded ? "Unfold" : "Fold up"}>
          <i className={`ti ${folded ? "ti-chevron-down" : "ti-chevron-up"}`}></i>
        </button>
      </div>
      {!folded && children}
    </div>
  );
};

const CommentBody = ({ text, footer, draft, number }) => (
  <div className="px-3 py-2 rounded-bottom"
       style={{ background: "rgba(255,255,255,0.94)", borderLeft: draft ? undefined : "4px solid #0d6efd", border: draft ? "2px dashed #0d6efd" : undefined }}>
    <div style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', cursive", fontSize: "0.9rem", color: "#0b3d91", whiteSpace: "pre-wrap" }}>
      {number ? <strong className="me-2">{toRoman(number)}.</strong> : null}{text}
    </div>
    {footer}
  </div>
);

const StickyBody = ({ text, footer, draft }) => (
  <div className="px-3 py-2 rounded-bottom shadow-sm"
       style={{ background: "#fff3a3", border: `${draft ? "2px dashed" : "1px solid"} #e6c200` }}>
    <div style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{text}</div>
    {footer}
  </div>
);

// Under the comment: the writer's signature, then the date and time. Nothing else (no name, role or step).
const noteFooter = (n) => (
  <>
    {n.author_signature_url && (
      <img src={n.author_signature_url} alt="Signature" style={{ display: "block", maxHeight: 44, maxWidth: 180, marginTop: 4, pointerEvents: "none" }} />
    )}
    <div className="text-muted fw-semibold" style={{ fontSize: "0.82rem" }}>
      {fmt(n.created_at)}
      {n.visibility === "PRIVATE" && (
        <span className="ms-2 text-danger" style={{ fontSize: "0.7rem" }}><i className="ti ti-lock me-1"></i>Private</span>
      )}
    </div>
  </>
);
const draftFooter = (label) => <div className="text-muted" style={{ fontSize: "0.7rem" }}>{label}</div>;

// Signatures and stamps are drawn into the PDF itself. To read what is under one, the reader can
// open the copy from before they were applied (the oldest version in the signing chain).
const unsignedVersionOf = (versionId, stampLists) => {
  const rows = stampLists.flat().filter(Boolean);
  let current = versionId;
  let found = false;
  for (let i = 0; i < rows.length + 1; i++) {
    const hit = rows.find((r) => r.version_id === current);
    if (!hit) break;
    current = hit.source_version_id;
    found = true;
  }
  return found ? current : null;
};

/**
 * A document's preview with the routing comments laid across the top of it, as if written on
 * the letter, and sticky notes pinned where they were placed (the same pin layer the approval
 * window uses). Readers can move or fold any note aside, drag pinned notes, hide them all, and
 * view the letter without its signatures and stamps.
 *   notes       already-loaded notes for this document; when omitted they are fetched
 *   draft       [{ text, kind }] comments / sticky notes about to be sent - shown dashed, as a preview
 *   draftPins   [{ x, y, note }] sticky notes about to be sent that are pinned on this letter
 *   placing     { active, pendingPin, onPlace(x, y) } - lets the user click the letter to pin a note
 *   continuous  draw the letter at its full length (no scroll box of its own) for a pane that scrolls
 *               through several letters; scrollRoot is that pane
 */
const DocumentWithNotes = ({ documentId, versionId, height = 520, notes, draft = [], draftPins = [], placing = null, continuous = false, scrollRoot = null }) => {
  const [fetched, setFetched] = useState({ id: null, items: [] });
  const [stampRows, setStampRows] = useState({ id: null, items: [] });
  const [hidden, setHidden] = useState(false);
  const [offsets, setOffsets] = useState({});      // card key -> { x, y }
  const [folded, setFolded] = useState({});        // card key -> bool
  const [unsigned, setUnsigned] = useState(false);
  const [printing, setPrinting] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (notes || !documentId) return undefined;
    let cancelled = false;
    getDocumentRoutingNotes(documentId)
      .then((r) => { if (!cancelled) setFetched({ id: documentId, items: Array.isArray(r?.data) ? r.data : [] }); })
      .catch(() => { if (!cancelled) setFetched({ id: documentId, items: [] }); });
    return () => { cancelled = true; };
  }, [documentId, notes]);

  // Which versions of this letter were produced by signing or stamping.
  useEffect(() => {
    if (!documentId) return undefined;
    let cancelled = false;
    Promise.allSettled([getDocumentSignatureStamps(documentId), getDocumentStampApplications(documentId)]).then(([a, b]) => {
      if (cancelled) return;
      const pick = (r) => (r.status === "fulfilled" && Array.isArray(r.value?.data) ? r.value.data : []);
      setStampRows({ id: documentId, items: [pick(a), pick(b)] });
    });
    return () => { cancelled = true; };
  }, [documentId, versionId]);

  const list = notes || (fetched.id === documentId ? fetched.items : []);
  const drafts = draft.filter((d) => d.text && d.text.trim());
  // Pinned sticky notes go on the pin layer; comments, and sticky notes without a pin, stack on top.
  const pinned = list.filter((n) => n.kind === "STICKY_NOTE" && n.pin_x != null && n.pin_y != null);
  const stacked = list.filter((n) => !pinned.includes(n));
  const pins = [
    ...pinned.map((n) => ({ x: Number(n.pin_x), y: Number(n.pin_y), note: n.text })),
    ...draftPins,
  ];
  const shown = stacked.length + drafts.length;
  const moved = Object.values(offsets).some((o) => o.x || o.y) || Object.values(folded).some(Boolean);

  const unsignedId = stampRows.id === documentId ? unsignedVersionOf(versionId, stampRows.items) : null;
  const previewVersion = unsigned && unsignedId ? unsignedId : versionId;

  const card = (key, title, body) => (
    <MovableCard key={key} rootRef={rootRef} title={title}
                 offset={offsets[key] || { x: 0, y: 0 }} onMove={(o) => setOffsets((s) => ({ ...s, [key]: o }))}
                 folded={!!folded[key]} onFold={() => setFolded((s) => ({ ...s, [key]: !s[key] }))}>
      {body}
    </MovableCard>
  );

  return (
    <div className="position-relative" ref={rootRef}>
      <PinPlacementLayer active={!!placing?.active} pins={pins} pendingPin={placing?.pendingPin || null} onPlace={placing?.onPlace}>
        {continuous
          ? <PdfPages documentId={documentId} versionId={previewVersion} root={scrollRoot} />
          : <DocumentPreviewPanel documentId={documentId} versionId={previewVersion} height={height} />}
      </PinPlacementLayer>

      {shown > 0 && !hidden && (
        <div className="position-absolute d-flex flex-column align-items-start gap-1" style={{ top: 48, left: 12, right: 12, pointerEvents: "none" }}>
          {stacked.map((n) => card(`n${n.id}`, n.kind === "STICKY_NOTE" ? "Sticky note" : "Comment",
            n.kind === "STICKY_NOTE"
              ? <StickyBody text={n.text} footer={noteFooter(n)} />
              : <CommentBody text={n.text} number={n.comment_number} footer={noteFooter(n)} />))}
          {drafts.map((d, i) => card(`d${i}${d.kind}`, d.kind === "STICKY_NOTE" ? "Sticky note (preview)" : "Comment (preview)",
            d.kind === "STICKY_NOTE"
              ? <StickyBody draft text={d.text} footer={draftFooter("Sticky note - preview, not sent yet")} />
              : <CommentBody draft text={d.text} number={d.number} footer={draftFooter("Preview - not sent yet")} />))}
        </div>
      )}

      <div className="position-absolute d-flex gap-1" style={{ top: 8, left: 12, zIndex: 11 }}>
        {unsignedId && (
          <button type="button" className={`btn btn-sm border ${unsigned ? "btn-warning" : "btn-light"}`}
                  onClick={() => setUnsigned((u) => !u)}
                  title="Signatures and stamps are part of the page. Open the copy from before they were applied to read what is underneath.">
            <i className="ti ti-signature me-1"></i>{unsigned ? "Showing the unsigned copy" : "View without signatures / stamps"}
          </button>
        )}
        <button type="button" className="btn btn-sm btn-light border" disabled={printing}
                onClick={async () => {
                  setPrinting(true);
                  try { await openDocumentPrintPack(documentId); } catch (e) { window.alert(e.message); } finally { setPrinting(false); }
                }}
                title="Print this document with its folio, cross-referenced folios and numbered, signed comments">
          <i className="ti ti-printer me-1"></i>{printing ? "Preparing…" : "Print"}
        </button>
        {moved && (
          <button type="button" className="btn btn-sm btn-light border" onClick={() => { setOffsets({}); setFolded({}); }}>
            <i className="ti ti-arrows-minimize me-1"></i>Reset notes
          </button>
        )}
        {shown > 0 && (
          <button type="button" className="btn btn-sm btn-light border" onClick={() => setHidden((h) => !h)}
                  title={hidden ? "Show notes on the document" : "Hide notes"}>
            <i className={`ti ${hidden ? "ti-eye" : "ti-eye-off"} me-1`}></i>{hidden ? `Show notes (${shown})` : "Hide notes"}
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentWithNotes;
