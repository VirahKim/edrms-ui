import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import { STAGE_BADGE } from "../utils/fileRoutingStages";
import DocumentWithNotes from "../components/RoutingNotesOverlay";
import ContinuousLetters from "./ContinuousLetters";
import PhysicalEnclosuresPanel from "../components/PhysicalEnclosuresPanel";
import { listAccessRequests } from "../../../api/accessRequestsApi";
import RoutingConfirmModal from "./RoutingConfirmModal";
import LetterSigner from "./LetterSigner";
import RoutingTargetPicker from "./RoutingTargetPicker";
import DelegatePanel from "./DelegatePanel";
import ReferenceDesk from "./ReferenceDesk";
import ReplyLetters from "./ReplyLetters";
import SendOutsideModal from "./SendOutsideModal";
import BringUpModal from "./BringUpModal";
import RoutingNotesComposer, { StickyNotesEditor } from "../components/RoutingNotesComposer";
import { emptyNotes, notesPayload, notesProblem, draftNotesFor, toRoman } from "../utils/routingNotes";
import {
  getFileRouting, markFileRouting, sendFileToAction, fileAwayFileRouting,
  completeFileRouting, addFileRoutingNote,
} from "../../../api/fileRoutingApi";

const DOC_STATE = {
  WITH_MARKING: { label: "With Marking Officer", cls: "text-bg-primary" },
  WITH_ACTION: { label: "With Action Officer", cls: "text-bg-info" },
  ACTION_DONE: { label: "Action done", cls: "text-bg-success" },
  WITH_REGISTRY: { label: "With Registry", cls: "text-bg-warning" },
  FILED_AWAY: { label: "Filed away", cls: "text-bg-success" },
  NOT_SENT: { label: "Not sent", cls: "text-bg-secondary" },
};

const fmt = (iso) => new Date(iso).toLocaleString();

// A titled block of the officer form.
const Section = ({ icon, title, hint, children }) => (
  <div className="mb-4">
    <div className="d-flex align-items-center gap-2 mb-1">
      <i className={`ti ${icon} text-primary`}></i>
      <span className="fw-semibold">{title}</span>
    </div>
    {hint && <div className="text-muted small mb-2">{hint}</div>}
    {children}
  </div>
);

// The path a file takes, in order; each routing stage sits at one step.
const TRACK_STEPS = [
  { label: "Sent to Marking", stages: [] },
  { label: "With Marking Officer", stages: ["MARKING"] },
  { label: "With Action Officer", stages: ["RETURNED_FROM_MARKING", "ACTION"] },
  { label: "Back with Registry", stages: ["RETURNED_FROM_ACTION"] },
  { label: "Filed away", stages: ["FILED_AWAY"] },
];

/**
 * What the Registry Officer sees while the file is with someone else: where it is now, how far it has
 * gone, and how many letters have been acted on. Nothing here can be changed.
 */
const TrackingBanner = ({ routing, docs }) => {
  const at = Math.max(1, TRACK_STEPS.findIndex((s) => s.stages.includes(routing.stage)));
  const done = docs.filter((d) => d.action_done || d.state === "FILED_AWAY").length;
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <div className="text-muted small">Where is this file?</div>
            <div className="fw-semibold fs-5">
              <i className="ti ti-map-pin text-primary me-1"></i>
              {routing.holder_label ? `With ${routing.holder_label}` : routing.stage_label}
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted small">Action taken</div>
            <div className="fw-semibold fs-5">
              <span className={done > 0 ? "text-success" : "text-muted"}>{done}</span> of {docs.length} letter{docs.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          {TRACK_STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <span className={`badge rounded-pill px-3 py-2 ${i === at ? "text-bg-primary" : i < at ? "text-bg-success" : "text-bg-light border text-muted"}`}>
                {i < at && <i className="ti ti-check me-1"></i>}{s.label}
              </span>
              {i < TRACK_STEPS.length - 1 && <i className="ti ti-chevron-right text-muted"></i>}
            </React.Fragment>
          ))}
        </div>
        <div className="text-muted small mt-2">
          You are following this file. You can work on it again once it is back with the Registry. Officers' requests for more files are answered under Access Requests.
        </div>
      </div>
    </div>
  );
};

/**
 * One file in routing: who has it, which letters went, what has been written on them, and the
 * next step for whoever the caller is - mark it, act on it, or (Registry) send it on / file it.
 */
const FileRoutingDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState(null);
  const [ticked, setTicked] = useState({});
  const [composer, setComposer] = useState(emptyNotes());
  const [targetKind, setTargetKind] = useState("user");
  const [toUser, setToUser] = useState(null);
  const [toRole, setToRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [quickNotes, setQuickNotes] = useState([]);
  const [tab, setTab] = useState(null);           // right-hand tab; null = the officer's tab, else Letters
  const [option, setOption] = useState(null);      // what the officer chose to do, within their tab
  const [signing, setSigning] = useState(false);   // showing the sign / stamp panel for the previewed letter
  const [registryModal, setRegistryModal] = useState(null); // "outside" | "bringup"
  const [placing, setPlacing] = useState(null);      // { source: "composer" | "quick", index } sticky note being pinned
  const [targetLabel, setTargetLabel] = useState(null);  // the Action Officer chosen, by name
  const [pendingRequests, setPendingRequests] = useState(0);  // Registry: officers' requests for more files, waiting
  const [confirm, setConfirm] = useState(null);          // a step waiting for "yes, that is where it goes"

  const load = useCallback(() =>
    getFileRouting(id)
      .then((r) => {
        const d = r?.data;
        setData(d);
        setError("");
        // Registry: the letters that have just come back start ticked for the next step; ones that were
        // kept back, or never sent, are left for the Registry Officer to tick on purpose.
        setTicked(Object.fromEntries((d?.documents || [])
          .filter((x) => x.open_hop_type === "RETURN").map((x) => [x.id, true])));
        setPreviewId((p) => (p && d?.documents?.some((x) => x.id === p) ? p : d?.documents?.[0]?.id ?? null));
      })
      .catch((e) => setError(e?.response?.data?.message || "Could not open this routing.")), [id]);

  useEffect(() => { load(); }, [load]);

  // Registry Officer: how many requests for more files are waiting on this file.
  const loadPending = useCallback(() =>
    listAccessRequests({ mine: false, status: "PENDING" })
      .then((r) => setPendingRequests((Array.isArray(r?.data) ? r.data : []).filter((x) => x.file_routing_id === Number(id)).length))
      .catch(() => {}), [id]);
  useEffect(() => { if (data?.caller?.is_registry_officer) loadPending(); }, [data, loadPending]);
  const docs = data?.documents || [];
  const caller = data?.caller || {};
  const routing = data?.routing;
  const preview = docs.find((d) => d.id === previewId) || null;
  const tickedIds = docs.filter((d) => ticked[d.id]).map((d) => d.id);
  const canPickDocs = caller.can_forward || caller.can_file_away;
  const canAct = caller.can_mark || caller.can_complete || canPickDocs;
  const canSign = caller.can_mark || caller.can_complete;
  const activeTab = tab || (canAct ? "action" : "letters");
  // Officers working a letter can look other material up and cite it; whoever holds a letter (or the
  // Registry) writes the letters that answer it.
  // The Registry Officer only follows the file while it is with the Marking or Action Officer: where it
  // is, and whether action has been taken. They work on it again once it is back with them.
  const tracking = !!caller.is_registry_officer && !caller.can_mark && !caller.can_complete && !canPickDocs;
  const canDesk = caller.can_mark || caller.can_complete || (!!caller.is_registry_officer && !tracking);
  const canReply = caller.can_mark || caller.can_complete || (!!caller.is_registry_officer && !tracking);
  // These stay for anyone who has taken part, read-only once they have handed the letters on - the
  // letters written and the material cited are the officer's record of what was done.
  const showDesk = (canDesk || !!caller.is_participant) && !tracking;
  const showReplies = canReply || !!caller.is_participant;
  const replyParents = (docs.filter((d) => d.caller_is_holder).length > 0 ? docs.filter((d) => d.caller_is_holder) : docs)
    .map((d) => ({ id: d.id, title: d.title, folio: d.folio_label ?? d.folio_number }));
  const stepLabel = caller.can_mark ? "Your marking" : caller.can_complete ? "Your action" : "Next step";

  // An officer's choices, shown as tabs inside their own tab. Responses and Request files sit here for
  // officers; for everyone else they keep a tab of their own.
  const inlineReplies = canAct && showReplies;
  const inlineDesk = canAct && showDesk && !caller.is_registry_officer;
  const canFile = !!caller.can_forward && (routing?.stage === "RETURNED_FROM_ACTION" || !!caller.can_file_away);
  const handon = (caller.can_mark || caller.can_forward) && {
    key: "handon", icon: "ti-send",
    label: caller.can_mark ? "Hand to Action Officer" : routing?.stage === "RETURNED_FROM_ACTION" ? "Send for further action" : "Send to Action Officer",
    desc: caller.can_mark ? "You have marked it. Send it straight to the Action Officer who will do the work."
      : "Send the ticked letters to an Action Officer to act on.",
  };
  const giveBack = (caller.can_mark || caller.can_complete) && {
    key: "return", icon: "ti-arrow-back-up",
    label: caller.can_mark ? "Return to Registry" : "Done - return to Registry",
    desc: caller.can_mark ? "You have marked it. Send it back to the Registry, who will pass it to the Action Officer."
      : "Use this last, when the work is finished. It goes back to the Registry with what you wrote above.",
  };
  const fileOpt = canFile && { key: "file", icon: "ti-archive", label: "File away", desc: "The work is finished. The letters go back into the file's records." };
  const delegateOpt = caller.can_delegate && { key: "delegate", icon: "ti-users", label: "Delegate", desc: "Hand the letter to someone else to act on. They send it back to the Registry when done." };
  const respondOpt = inlineReplies && { key: "respond", icon: "ti-mail-forward", label: "Responses", desc: "Answer with a letter, memo or other document - write a new one or upload one." };
  const requestOpt = inlineDesk && { key: "request", icon: "ti-folder-plus", label: "Request files", desc: "Ask the Registry for more files you need in order to take action." };
  // An Action Officer does the work first (respond, ask for files, delegate) and returns it last.
  const options = (caller.can_complete && !caller.can_mark
    ? [respondOpt, requestOpt, delegateOpt, giveBack, handon, fileOpt]
    : [handon, giveBack, fileOpt, delegateOpt, respondOpt, requestOpt]).filter(Boolean);
  const activeOption = options.some((o) => o.key === option) ? option : options[0]?.key;

  // Sticky notes being written (in the step form, or the quick add) that are pinned on the letter shown.
  const lists = { composer: composer.notes, quick: quickNotes };
  const notePin = (n) => ({ x: n.pin_x, y: n.pin_y, note: n.text });
  const draftPinsFor = (docId) => Object.entries(lists).flatMap(([source, notes]) =>
    notes.map((n, index) => ({ n, source, index }))
      .filter(({ n, source: s2, index }) => n.document_id === docId && n.pin_x != null
        && !(placing && placing.source === s2 && placing.index === index))
      .map(({ n }) => notePin(n)));
  const placingNote = placing ? lists[placing.source]?.[placing.index] : null;
  const placingFor = (docId) => ({
    active: !!placingNote && placingNote.document_id === docId,
    pendingPin: placingNote && placingNote.document_id === docId && placingNote.pin_x != null ? notePin(placingNote) : null,
    onPlace: (x, y) => {
      const apply = (notes) => notes.map((n, i) => (i === placing.index ? { ...n, pin_x: x, pin_y: y } : n));
      if (placing.source === "composer") setComposer((c) => ({ ...c, notes: apply(c.notes) }));
      else setQuickNotes((q) => apply(q));
      setPlacing(null);
    },
  });
  const startPlacing = (source) => (index) => {
    const docId = lists[source][index]?.document_id;
    if (docId) { setPreviewId(docId); setSigning(false); }
    setPlacing({ source, index });
  };

  const run = async (fn, success) => {
    const problem = notesProblem(composer);
    if (problem) { toast.error(problem); return; }
    setBusy(true);
    try {
      await fn(notesPayload(composer));
      toast.success(success);
      setComposer(emptyNotes());
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  // Every step that sends the file on first asks "is this where it should go?".
  const letterRows = (list) => list.map((d) => ({ id: d.id, title: d.title, folio: d.folio_label ?? d.folio_number }));
  const fileLabel = routing ? [routing.folder_name, routing.folder_reference && `(${routing.folder_reference})`].filter(Boolean).join(" ") : "";
  const ask = (config) => {
    const problem = notesProblem(composer);
    if (problem) { toast.error(problem); return; }
    setConfirm(config);
  };
  const heldLetters = letterRows(docs.filter((d) => d.caller_is_holder).length ? docs.filter((d) => d.caller_is_holder) : docs);

  const hasActionTarget = targetKind === "user" ? toUser != null : toRole !== "";
  const markAndSend = () => {
    if (!hasActionTarget) { toast.error("Choose the Action Officer to send it to."); return; }
    ask({
      title: "Send this file straight to the Action Officer?", destination: targetLabel || "The chosen Action Officer",
      destinationNote: "Your marking is complete. It goes directly to the Action Officer, without first going back to the Registry."
        + (targetKind === "role" ? " Anyone who holds this role can pick it up." : ""),
      letters: heldLetters, confirmLabel: "Yes, send it",
      run: () => run(({ comment, notes }) => markFileRouting(id, {
        comment, notes,
        to_user_id: targetKind === "user" ? Number(toUser) : null,
        to_role_id: targetKind === "role" ? Number(toRole) : null,
      }), "Marked and sent to the Action Officer."),
    });
  };
  const markDone = () => ask({
    title: "Return this file to the Registry Officer?", destination: "The Registry Officer",
    destinationNote: "Your marking is complete. The Registry will route it to the Action Officer.",
    letters: heldLetters, confirmLabel: "Yes, return it",
    run: () => run(({ comment, notes }) => markFileRouting(id, { comment, notes }),
      "Marked - the file is back with the Registry Officer."),
  });
  const completeDone = () => ask({
    title: "Return this file to the Registry Officer?", destination: "The Registry Officer",
    destinationNote: "The action is complete. The Registry will file it away or send it for further action.",
    letters: heldLetters, confirmLabel: "Yes, return it",
    run: () => run(({ comment, notes }) => completeFileRouting(id, { comment, notes }),
      "Action complete - the file is back with the Registry Officer."),
  });
  const sendToAction = () => {
    if (tickedIds.length === 0) { toast.error("Tick at least one letter to send."); return; }
    const hasTarget = targetKind === "user" ? toUser != null : toRole !== "";
    if (!hasTarget) { toast.error("Choose the Action Officer."); return; }
    ask({
      title: "Send this file to the Action Officer?", destination: targetLabel || "The chosen Action Officer",
      destinationNote: targetKind === "role" ? "Anyone who holds this role can pick it up." : null,
      letters: letterRows(docs.filter((d) => tickedIds.includes(d.id))), confirmLabel: "Yes, send it",
      run: () => run(({ comment, notes }) => sendFileToAction(id, {
        document_ids: tickedIds, comment, notes,
        to_user_id: targetKind === "user" ? Number(toUser) : null,
        to_role_id: targetKind === "role" ? Number(toRole) : null,
      }), "Sent to the Action Officer."),
    });
  };
  const fileAway = () => {
    if (tickedIds.length === 0) { toast.error("Tick at least one letter to file away."); return; }
    ask({
      title: "File these letters away?", destination: "Filed away - the work on them is finished",
      destinationNote: "They leave routing and go back to the file's records.",
      letters: letterRows(docs.filter((d) => tickedIds.includes(d.id))), confirmLabel: "Yes, file them away",
      run: () => run(({ comment, notes }) => fileAwayFileRouting(id, { document_ids: tickedIds, comment, notes }), "Filed away."),
    });
  };

  const saveQuickNotes = async () => {
    const valid = quickNotes.filter((n) => n.text.trim());
    if (valid.length === 0) return;
    if (valid.some((n) => n.visibility === "PRIVATE" && n.recipient_user_ids.length === 0)) {
      toast.error("A private sticky note must be addressed to at least one person.");
      return;
    }
    setBusy(true);
    try {
      for (const n of valid) {
        await addFileRoutingNote(id, {
          kind: "STICKY_NOTE", text: n.text.trim(), visibility: n.visibility,
          document_id: n.document_id || null,
          pin_x: n.document_id && n.pin_x != null ? n.pin_x : null, pin_y: n.document_id && n.pin_y != null ? n.pin_y : null,
          recipient_user_ids: n.visibility === "PRIVATE" ? n.recipient_user_ids : [],
        });
      }
      setQuickNotes([]);
      toast.success("Sticky note added.");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not add the note.");
    } finally {
      setBusy(false);
    }
  };


  // Back with the Registry Officer and nothing more to do: record when it will be needed, or send it outside.
  const returned = routing && (routing.stage === "RETURNED_FROM_MARKING" || routing.stage === "RETURNED_FROM_ACTION");
  // The officer's choices, one click away at the top of the page: each opens the Next step tab on that choice.
  const topButtonClass = { handon: "btn-primary", file: "btn-success", return: "btn-primary" };
  const topActions = options.map((o) => {
    const chosen = activeTab === "action" && activeOption === o.key;
    const solid = chosen || topButtonClass[o.key];
    const colour = topButtonClass[o.key] ? topButtonClass[o.key].replace("btn-", "") : "primary";
    return (
      <button key={o.key} type="button" disabled={busy} title={o.desc}
              className={`btn ${solid ? `btn-${colour}` : `btn-outline-${colour}`} ${chosen ? "shadow" : ""}`}
              onClick={() => { setTab("action"); setOption(o.key); }}>
        <i className={`ti ${o.icon} me-1`}></i>{o.label}
      </button>
    );
  });

  const registryExtras = caller.can_file_away && returned && (
    <>
      <button className="btn btn-outline-secondary" disabled={busy} onClick={() => setRegistryModal("bringup")}>
        <i className="ti ti-calendar-event me-1"></i>Bring up…
      </button>
      <button className="btn btn-outline-primary" disabled={busy || tickedIds.length === 0} onClick={() => setRegistryModal("outside")}>
        <i className="ti ti-mail-forward me-1"></i>Send outside…
      </button>
    </>
  );

  const tabs = [
    { key: "letters", label: `Letters (${docs.length})`, icon: "ti-files" },
    ...(canAct ? [{ key: "action", label: stepLabel, icon: "ti-edit" }] : []),
    ...(showReplies && !inlineReplies ? [{ key: "replies", label: "Responses", icon: "ti-mail-forward" }] : []),
    ...(showDesk && !inlineDesk ? [{ key: "references", label: caller.is_registry_officer ? "Requests & references" : "Request files", icon: "ti-folder-plus", badge: pendingRequests }] : []),
    { key: "notes", label: `Notes (${data?.notes?.length || 0})`, icon: "ti-notes" },
  ];

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        {error ? (
          <div className="alert alert-danger">{error} <Link to="/ed-mgt/file-routing" className="alert-link">Back to File Routing</Link></div>
        ) : !data ? (
          <div className="text-muted">Loading…</div>
        ) : (
          <>
            {/* Header: what this is, who has it, and the step buttons */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h5 className="fw-semibold mb-1">
                  <i className="ti ti-folder text-warning me-1"></i>{routing.folder_name}
                  <span className={`badge ms-2 ${STAGE_BADGE[routing.stage] || "text-bg-secondary"}`} style={{ fontSize: "0.7rem" }}>{routing.stage_label}</span>
                </h5>
                <div className="text-muted small">
                  {[routing.folder_reference, routing.holder_label && `With ${routing.holder_label}`, `Sent by ${routing.created_by_name || "Registry"}`, `Updated ${fmt(routing.updated_at)}`]
                    .filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                {topActions}
                {registryExtras}
                <Link to="/ed-mgt/file-routing" className="btn btn-outline-secondary"><i className="ti ti-arrow-left me-1"></i>File Routing</Link>
              </div>
            </div>

            {tracking && <TrackingBanner routing={routing} docs={docs} />}

            <div className="row g-3">
              {/* Left: the letter */}
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate" style={{ maxWidth: 420 }}>{preview ? preview.title : "No letter selected"}</div>
                      {preview && (
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          {[(preview.folio_label ?? preview.folio_number) != null && `Folio ${preview.folio_label ?? preview.folio_number}`, preview.document_reference].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    {canSign && preview && (
                      signing ? (
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSigning(false)}>Back to the letter</button>
                      ) : (
                        <button type="button" className="btn btn-sm btn-outline-success" onClick={() => setSigning(true)}>
                          <i className="ti ti-signature me-1"></i>Sign or stamp this letter
                        </button>
                      )
                    )}
                  </div>
                  <div className="card-body p-2">
                    {preview && signing && canSign ? (
                      <LetterSigner key={preview.id} documentId={preview.id}
                                    onSigned={() => { setSigning(false); toast.success("Signed."); load(); }} />
                    ) : docs.length > 0 ? (
                      /* Every letter one after another: reading on past the end of one carries into the next,
                         and the header above just follows whichever letter is at the top. */
                      <ContinuousLetters coverFolderId={routing?.folder_id} docs={docs} activeId={previewId} onActiveChange={setPreviewId} height={640}
                        renderLetter={(d, scrollRoot) => (
                          <DocumentWithNotes key={`${d.id}:${d.current_version_id}:${data.notes.length}`} documentId={d.id}
                                             versionId={d.current_version_id} continuous scrollRoot={scrollRoot}
                                             draft={draftNotesFor(d.id, composer.comment, [composer.notes, quickNotes], data?.next_comment_number)}
                                             draftPins={draftPinsFor(d.id)} placing={placingFor(d.id)} />
                        )} />
                    ) : (
                      <div className="text-muted p-5 text-center">No documents to show.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: letters, your step, notes - one tab at a time, no long scroll */}
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm">
                  {/* Plain buttons in their own row - no negative-margin tab styling that can sit under the card body. */}
                  <div className="card-header bg-transparent py-2" style={{ position: "relative", zIndex: 2 }}>
                    <div className="d-flex flex-wrap gap-2" role="tablist">
                      {tabs.map((t) => (
                        <button key={t.key} type="button" role="tab" aria-selected={activeTab === t.key}
                                className={`btn btn-sm ${activeTab === t.key ? "btn-primary" : "btn-outline-secondary"}`}
                                style={{ cursor: "pointer" }}
                                onClick={() => setTab(t.key)}>
                          <i className={`ti ${t.icon} me-1`}></i>{t.label}
                          {t.badge > 0 && <span className="badge rounded-pill text-bg-warning ms-1">{t.badge}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card-body" style={{ maxHeight: 700, overflowY: "auto" }}>
                    {activeTab === "letters" && (
                      <>
                        {canPickDocs && (
                          <div className="text-muted small mb-2">
                            Tick the letters to send on. {tickedIds.length} ticked.
                          </div>
                        )}
                        {docs.map((d) => {
                          const st = DOC_STATE[d.state] || DOC_STATE.NOT_SENT;
                          const selectable = canPickDocs && ["WITH_REGISTRY", "NOT_SENT", "ACTION_DONE"].includes(d.state);
                          return (
                            <div key={d.id} className={`p-2 px-3 mb-2 border rounded ${d.id === previewId ? "border-primary bg-primary bg-opacity-10" : ""}`}
                                 style={{ cursor: "pointer" }} onClick={() => { setPreviewId(d.id); setSigning(false); }}>
                              <div className="d-flex align-items-start gap-2">
                                {canPickDocs && (
                                  <input type="checkbox" className="form-check-input mt-1" disabled={!selectable} checked={!!ticked[d.id]}
                                         onClick={(e) => e.stopPropagation()}
                                         onChange={(e) => setTicked((t) => ({ ...t, [d.id]: e.target.checked }))} />
                                )}
                                <div className="flex-grow-1 min-w-0">
                                  <div className="fw-semibold" style={{ fontSize: "0.88rem" }}>{d.title}</div>
                                  <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                    {[(d.folio_label ?? d.folio_number) != null && `Folio ${d.folio_label ?? d.folio_number}`, d.document_reference].filter(Boolean).join(" · ")}
                                  </div>
                                  <span className={`badge mt-1 ${st.cls}`} style={{ fontSize: "0.62rem" }}>
                                    {st.label}{d.state === "ACTION_DONE" && d.action_done_by ? ` - ${d.action_done_by}` : d.holder_label && d.state !== "FILED_AWAY" ? ` - ${d.holder_label}` : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {activeTab === "action" && canAct && (
                      <>
                        {/* What the officer says about the letters - the same whichever option is chosen below */}
                        <Section icon="ti-pencil" title={caller.can_mark ? "Write your instruction" : caller.can_complete ? "Say what was done" : "Add a comment"}
                                 hint="Written on the letters, with your name and the date. Add a sticky note to point at something.">
                          <RoutingNotesComposer nextNumber={data?.next_comment_number}
                            value={composer} onChange={setComposer}
                            commentLabel={caller.can_mark ? "Your instruction (written on the letters)" : caller.can_complete ? "What was done (written on the letters)" : "Your comment (written on the letters)"}
                            documents={docs.map((d) => ({ id: d.id, title: d.title }))}
                            defaultDocumentId={previewId}
                            placingIndex={placing?.source === "composer" ? placing.index : null} onPlace={startPlacing("composer")}
                          />
                        </Section>

                        {/* A book or legal document the action relied on - can go with any option */}
                        {canDesk && preview && (
                          <details className="border rounded-3 mb-4">
                            <summary className="p-2 px-3 fw-semibold small" style={{ cursor: "pointer" }}>
                              <i className="ti ti-book me-1"></i>Refer to a book or legal document
                              <span className="text-muted fw-normal"> - optional, goes with any option below</span>
                            </summary>
                            <div className="p-3 pt-1">
                              <div className="text-muted small mb-2">
                                For the letter shown on the left: "{preview.title}". Use it when the source is too big to scan - give its subject and author, or a link.
                              </div>
                              <PhysicalEnclosuresPanel key={`ref-${preview.id}`} documentId={preview.id} kind="REFERENCE" readOnly={false} compact />
                            </div>
                          </details>
                        )}

                        {/* What to do next - one option at a time */}
                        {/* The choices are the buttons at the top of the page; this shows the one chosen. */}
                        <div>

                          {activeOption === "handon" && (
                            <div className="border rounded-3 p-3">
                              {caller.can_mark && (
                                <div className="text-muted small mb-2">Send the file straight to the Action Officer, together with your instruction above.</div>
                              )}
                              <RoutingTargetPicker
                                label="Action Officer" routingRole="ACTION_OFFICER"
                                kind={targetKind} onKind={setTargetKind}
                                userId={toUser} onUser={setToUser}
                                roleId={toRole} onRole={setToRole}
                                onLabel={setTargetLabel}
                              />
                              <button className="btn btn-primary w-100 mt-2" disabled={busy || !hasActionTarget}
                                      onClick={caller.can_mark ? markAndSend : sendToAction}>
                                <i className={`ti ${caller.can_mark || routing.stage !== "RETURNED_FROM_ACTION" ? "ti-send" : "ti-repeat"} me-1`}></i>
                                {caller.can_mark ? "Complete marking - hand to Action Officer" : routing.stage === "RETURNED_FROM_ACTION" ? "Send for further action" : "Send to Action Officer"}
                              </button>
                            </div>
                          )}

                          {activeOption === "return" && (
                            <div className="border rounded-3 p-3">
                              <div className="text-muted small mb-2">
                                {caller.can_mark
                                  ? "Your marking is complete. The file goes back to the Registry Officer, who will route it to the Action Officer."
                                  : "The action is complete. The file goes back to the Registry Officer, who will file it away or send it for further action."}
                              </div>
                              <button className="btn btn-primary w-100" disabled={busy} onClick={caller.can_mark ? markDone : completeDone}>
                                <i className="ti ti-arrow-back-up me-1"></i>{caller.can_mark ? "Complete marking - return to Registry" : "Complete action - return to Registry"}
                              </button>
                            </div>
                          )}

                          {activeOption === "file" && (
                            <div className="border rounded-3 p-3">
                              <div className="text-muted small mb-2">
                                The work on the ticked letters is finished. They leave routing and go back to the file's records.
                                {" "}{tickedIds.length} letter{tickedIds.length === 1 ? "" : "s"} selected. Change the ticks on the <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setTab("letters")}>Letters</button> tab.
                              </div>
                              <button className="btn btn-success w-100" disabled={busy} onClick={fileAway}>
                                <i className="ti ti-archive me-1"></i>File away
                              </button>
                            </div>
                          )}

                          {activeOption === "delegate" && (
                            <DelegatePanel routingId={Number(id)} onDone={load} suggestFor={previewId}
                                           letters={docs.filter((d) => d.caller_is_holder).map((d) => ({ id: d.id, title: d.title }))} />
                          )}

                          {activeOption === "respond" && (
                            <>
                              <div className="text-muted small mb-2">
                                Answer with a letter, memo or other document. Write it here on a template with the letterhead, signature and stamp.
                                It is filed with the next folio number, with a cross-reference to the letter it answers.
                              </div>
                              <ReplyLetters routingId={Number(id)} letters={replyParents} defaultParentId={previewId} readOnly={!canReply} />
                            </>
                          )}

                          {activeOption === "request" && (
                            <ReferenceDesk key={preview?.id ?? "none"} routingId={Number(id)}
                                           letter={preview ? { id: preview.id, title: preview.title } : null} readOnly={!canDesk}
                                           isRegistry={!!caller.is_registry_officer} onChanged={loadPending} />
                          )}
                        </div>
                      </>
                    )}

                    {activeTab === "references" && showDesk && !inlineDesk && (
                      <ReferenceDesk key={preview?.id ?? "none"} routingId={Number(id)}
                                     letter={preview ? { id: preview.id, title: preview.title } : null} readOnly={!canDesk}
                                     isRegistry={!!caller.is_registry_officer} onChanged={loadPending} />
                    )}

                    {activeTab === "replies" && showReplies && !inlineReplies && (
                      <ReplyLetters routingId={Number(id)} letters={replyParents} defaultParentId={previewId} readOnly={!canReply} />
                    )}

                    {activeTab === "notes" && (
                      <>
                        {routing.stage !== "FILED_AWAY" && !tracking && (
                          <div className="mb-3">
                            <div className="fw-semibold small mb-1">Add a sticky note</div>
                            <StickyNotesEditor notes={quickNotes} onChange={setQuickNotes}
                                               documents={docs.map((d) => ({ id: d.id, title: d.title }))}
                                               defaultDocumentId={previewId}
                                               placingIndex={placing?.source === "quick" ? placing.index : null} onPlace={startPlacing("quick")} />
                            {quickNotes.length > 0 && (
                              <button className="btn btn-sm btn-warning mt-2" disabled={busy} onClick={saveQuickNotes}>Save sticky notes</button>
                            )}
                          </div>
                        )}
                        <div className="fw-semibold small mb-2 border-top pt-3">Comments and notes so far</div>
                        {data.notes.length === 0 && <div className="text-muted small">Nothing written yet.</div>}
                        {data.notes.map((n) => {
                          const doc = docs.find((d) => d.id === n.document_id);
                          return (
                            <div key={n.id} className="mb-3">
                              <div className="rounded p-2" style={{ background: n.kind === "STICKY_NOTE" ? "#fff3a3" : "#f4f6f8", fontSize: "0.88rem" }}>
                                <div style={{ whiteSpace: "pre-wrap" }}>{n.comment_number ? <strong className="me-2">{toRoman(n.comment_number)}.</strong> : null}{n.text}</div>
                                {n.author_signature_url && (
                                  <img src={n.author_signature_url} alt="Signature" style={{ display: "block", maxHeight: 44, maxWidth: 180, marginTop: 4 }} />
                                )}
                                <div className="text-muted fw-semibold" style={{ fontSize: "0.82rem" }}>{fmt(n.created_at)}</div>
                              </div>
                              <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                                {doc ? `On: ${doc.title}` : "On the whole file"}
                                {n.kind === "STICKY_NOTE" && <> · Sticky note</>}
                                {n.visibility === "PRIVATE" && <span className="text-danger"> · <i className="ti ti-lock"></i> Private{n.recipient_names.length ? ` - for ${n.recipient_names.join(", ")}` : ""}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <RoutingConfirmModal
        show={!!confirm}
        title={confirm?.title}
        fileLabel={fileLabel}
        destination={confirm?.destination}
        destinationNote={confirm?.destinationNote}
        letters={confirm?.letters || []}
        confirmLabel={confirm?.confirmLabel}
        busy={busy}
        onConfirm={async () => { const c = confirm; setConfirm(null); await c.run(); }}
        onCancel={() => setConfirm(null)}
      />
      {registryModal === "outside" && (
        <SendOutsideModal routingId={Number(id)} letters={docs.map((d) => ({ id: d.id, title: d.title, folio: d.folio_label ?? d.folio_number }))}
                          preselected={tickedIds} onClose={() => setRegistryModal(null)} onDone={load} />
      )}
      {registryModal === "bringup" && (
        <BringUpModal folderId={routing?.folder_id} label={routing?.folder_reference} onClose={() => setRegistryModal(null)} />
      )}
    </DashboardLayout>
  );
};

export default FileRoutingDetail;
