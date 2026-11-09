import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import DocumentWithNotes from "../components/RoutingNotesOverlay";
import RoutingNotesComposer from "../components/RoutingNotesComposer";
import IngestionStepBar from "../components/IngestionStepBar";
import { emptyNotes, notesPayload, notesProblem, draftNotesFor } from "../utils/routingNotes";
import RoutingTargetPicker from "./RoutingTargetPicker";
import ContinuousLetters from "./ContinuousLetters";
import RoutingConfirmModal from "./RoutingConfirmModal";
import { prepareFileRouting, sendFileToMarking } from "../../../api/fileRoutingApi";

const STEPS = ["Choose the letters", "Send to & comments"];

/**
 * Registry Officer: submit a whole file to the Marking Officer, in two steps.
 *   1. Choose the letters - every letter starts ticked; untick what the Marking Officer should not see.
 *   2. Send to & comments - who it goes to, the comments written on the letters, sticky notes.
 * Only the electronic file moves - the paper file stays where it is.
 */
const FileRoutingSubmit = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ticked, setTicked] = useState({});          // documentId -> bool
  const [previewId, setPreviewId] = useState(null);
  const [composer, setComposer] = useState(emptyNotes());
  const [targetKind, setTargetKind] = useState("user");
  const [toUser, setToUser] = useState(null);
  const [toRole, setToRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [placingIndex, setPlacingIndex] = useState(null);   // sticky note whose pin is being placed
  const [targetLabel, setTargetLabel] = useState(null);      // the chosen person / role, by name
  const [confirming, setConfirming] = useState(false);       // "are you sure it goes there?"

  useEffect(() => {
    let cancelled = false;
    prepareFileRouting(fileId)
      .then((r) => {
        if (cancelled) return;
        const d = r?.data;
        setData(d);
        // All ticked to start, except a letter still open with someone from an earlier routing - that one cannot be sent.
        setTicked(Object.fromEntries((d?.documents || []).map((x) => [x.id, !x.blocked_reason])));
        setPreviewId(d?.documents?.[0]?.id ?? null);
      })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.message || "Could not open this file."); });
    return () => { cancelled = true; };
  }, [fileId]);

  const docs = data?.documents || [];
  const tickedDocs = docs.filter((d) => ticked[d.id]);
  const sendable = docs.filter((d) => !d.blocked_reason);
  const blockedDocs = docs.filter((d) => d.blocked_reason);
  const allTicked = sendable.length > 0 && tickedDocs.length === sendable.length;

  const goNext = () => {
    if (tickedDocs.length === 0) { toast.error("Tick at least one letter or document to send."); return; }
    // Step 2 only shows ticked letters, so make sure the preview is one of them.
    if (!ticked[previewId]) setPreviewId(tickedDocs[0].id);
    setStep(2);
  };

  // Checks what must be right, then asks the officer to confirm where it is going.
  const askToSend = () => {
    if (tickedDocs.length === 0) { toast.error("Tick at least one letter or document to send."); return; }
    const problem = notesProblem(composer);
    if (problem) { toast.error(problem); return; }
    setConfirming(true);
  };

  const submit = async () => {
    const { comment, notes } = notesPayload(composer);
    setSaving(true);
    try {
      const res = await sendFileToMarking({
        folder_id: Number(fileId),
        documents: tickedDocs.map((d) => ({ document_id: d.id, comment: null })),
        comment,
        to_user_id: targetKind === "user" && toUser ? Number(toUser) : null,
        to_role_id: targetKind === "role" && toRole ? Number(toRole) : null,
        notes,
      });
      toast.success("File sent to the Marking Officer.");
      setTimeout(() => navigate(`/ed-mgt/file-routing/${res?.data?.id}`), 600);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not send the file.");
      setSaving(false);
      setConfirming(false);
    }
  };

  const draftFor = (docId) => [
    ...draftNotesFor(docId, "", [composer.notes]),
  ];

  // Sticky notes pinned on a letter, shown live; the one being placed is the pending pin.
  const notePin = (n) => ({ x: n.pin_x, y: n.pin_y, note: n.text });
  const draftPinsFor = (docId) => composer.notes
    .map((n, i) => ({ n, i }))
    .filter(({ n, i }) => n.document_id === docId && n.pin_x != null && i !== placingIndex)
    .map(({ n }) => notePin(n));
  const placingNote = placingIndex != null ? composer.notes[placingIndex] : null;
  const placingFor = (docId) => ({
    active: !!placingNote && placingNote.document_id === docId,
    pendingPin: placingNote && placingNote.document_id === docId && placingNote.pin_x != null ? notePin(placingNote) : null,
    onPlace: (x, y) => {
      setComposer((c) => ({ ...c, notes: c.notes.map((n, i) => (i === placingIndex ? { ...n, pin_x: x, pin_y: y } : n)) }));
      setPlacingIndex(null);
    },
  });
  const startPlacing = (i) => {
    const docId = composer.notes[i]?.document_id;
    if (docId) setPreviewId(docId);   // show the letter the note is for
    setPlacingIndex(i);
  };

  // The step buttons live in the page header, so Next is never scrolled out of sight.
  const stepButtons = step === 1 ? (
    <>
      <Link to="/ed-mgt/documents" className="btn btn-outline-secondary">Cancel</Link>
      <button type="button" className="btn btn-primary btn-lg px-4" onClick={goNext} disabled={tickedDocs.length === 0}>
        Next: Send to &amp; comments ({tickedDocs.length} letter{tickedDocs.length === 1 ? "" : "s"}) <i className="ti ti-arrow-right ms-1"></i>
      </button>
    </>
  ) : (
    <>
      <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={saving}>
        <i className="ti ti-arrow-left me-1"></i> Back
      </button>
      <button type="button" className="btn btn-primary btn-lg px-4" onClick={askToSend} disabled={saving || tickedDocs.length === 0}>
        {saving ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-send me-1"></i>}
        Send {tickedDocs.length} letter{tickedDocs.length === 1 ? "" : "s"} to Marking
      </button>
    </>
  );

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        {error ? (
          <div className="alert alert-danger">{error} <Link to="/ed-mgt/documents" className="alert-link">Back to Files</Link></div>
        ) : !data ? (
          <div className="text-muted">Loading…</div>
        ) : data.existing_routing_id ? (
          <div className="alert alert-warning">
            This file is already in routing.{" "}
            <Link to={`/ed-mgt/file-routing/${data.existing_routing_id}`} className="alert-link">Continue it here</Link>.
          </div>
        ) : (
          <>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
              <div>
                <h5 className="fw-semibold mb-1">Submit to Marking Officer</h5>
                <div className="text-muted small">
                  <i className="ti ti-folder text-warning me-1"></i>
                  <strong>{data.folder_name}</strong>
                  {[data.folder_reference, data.volume_no && `Vol. ${data.volume_no}`, data.registry_name].filter(Boolean).map((x) => ` · ${x}`)}
                </div>
                <div className="text-muted small">Only the electronic file is sent - the paper file does not move with it.</div>
              </div>
              <div className="d-flex align-items-center gap-2">{stepButtons}</div>
            </div>

            <IngestionStepBar step={step} steps={STEPS} />

            {/* ── Step 1: which letters the Marking Officer sees ── */}
            {step === 1 && (
              <>
                <div className="row g-3">
                  <div className="col-lg-5">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-transparent d-flex align-items-center justify-content-between py-2">
                        <div className="form-check mb-0">
                          <input className="form-check-input" type="checkbox" id="tick-all" checked={allTicked}
                                 onChange={(e) => setTicked(Object.fromEntries(docs.map((d) => [d.id, e.target.checked && !d.blocked_reason])))} />
                          <label className="form-check-label fw-semibold small" htmlFor="tick-all">
                            Letters the Marking Officer can see
                          </label>
                        </div>
                        <span className="text-muted small">{tickedDocs.length} of {sendable.length} ticked</span>
                      </div>
                      <div style={{ maxHeight: 560, overflowY: "auto" }}>
                        {docs.length === 0 && <div className="p-3 text-muted small">This file has no documents you can send.</div>}
                        {blockedDocs.length > 0 && (
                          <div className="p-2 px-3 small text-danger bg-danger-subtle border-bottom">
                            {blockedDocs.length} letter{blockedDocs.length === 1 ? " is" : "s are"} still with an officer from an earlier routing and cannot be sent with this file yet.
                          </div>
                        )}
                        {docs.map((d) => (
                          <div key={d.id} className={`p-2 px-3 border-bottom ${d.id === previewId ? "bg-primary bg-opacity-10" : ""}`}
                               style={{ cursor: "pointer", opacity: ticked[d.id] ? 1 : 0.6 }} onClick={() => setPreviewId(d.id)}>
                            <div className="d-flex align-items-start gap-2">
                              <input type="checkbox" className="form-check-input mt-1" checked={!!ticked[d.id]} disabled={!!d.blocked_reason}
                                     onClick={(e) => e.stopPropagation()}
                                     onChange={(e) => setTicked((t) => ({ ...t, [d.id]: e.target.checked }))} />
                              <div className="flex-grow-1 min-w-0">
                                <div className="fw-semibold" style={{ fontSize: "0.88rem" }}>{d.title}</div>
                                <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                  {[(d.folio_label ?? d.folio_number) != null && `Folio ${d.folio_label ?? d.folio_number}`, d.document_reference].filter(Boolean).join(" · ")}
                                </div>
                                {d.blocked_reason && (
                                  <div className="text-danger small mt-1"><i className="ti ti-alert-circle me-1"></i>{d.blocked_reason} - it cannot be sent until it is returned to the Registry</div>
                                )}
                                {!ticked[d.id] && !d.blocked_reason && (
                                  <div className="text-muted small mt-1"><i className="ti ti-eye-off me-1"></i>Kept back - the Marking Officer will not see it</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-7">
                    {docs.length > 0 ? (
                      /* All the letters one after another - read on past the end of one into the next. */
                      <ContinuousLetters coverFolderId={Number(fileId)} docs={docs} activeId={previewId} onActiveChange={setPreviewId} height={600}
                        renderLetter={(d, scrollRoot) => (
                          <DocumentWithNotes key={d.id} documentId={d.id} versionId={d.current_version_id}
                                             continuous scrollRoot={scrollRoot} notes={[]} />
                        )} />
                    ) : (
                      <div className="text-muted p-5 text-center">Select a letter to preview it.</div>
                    )}
                  </div>
                </div>

              </>
            )}

            {/* ── Step 2: who it goes to, comments, sticky notes ── */}
            {step === 2 && (
              <>
                <div className="row g-3">
                  <div className="col-lg-5">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <RoutingTargetPicker
                          label="Send to" optional routingRole="MARKING_OFFICER"
                          kind={targetKind} onKind={setTargetKind}
                          userId={toUser} onUser={setToUser}
                          roleId={toRole} onRole={setToRole}
                          hint="Leave blank to send it to the Marking Officer role."
                          onLabel={setTargetLabel}
                        />

                        <RoutingNotesComposer
                          value={composer} onChange={setComposer}
                          allowComment={false}
                          documents={tickedDocs.map((d) => ({ id: d.id, title: d.title }))}
                          defaultDocumentId={previewId}
                          placingIndex={placingIndex} onPlace={startPlacing}
                        />

                      </div>
                    </div>
                  </div>

                  <div className="col-lg-7">
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {tickedDocs.map((d) => (
                        <button key={d.id} type="button" onClick={() => setPreviewId(d.id)}
                                className={`btn btn-sm ${d.id === previewId ? "btn-primary" : "btn-outline-secondary"}`}
                                title={d.title} style={{ maxWidth: 220 }}>
                          <span className="d-inline-block text-truncate align-bottom" style={{ maxWidth: 190 }}>
                            {(d.folio_label ?? d.folio_number) != null ? `${d.folio_label ?? d.folio_number}. ` : ""}{d.title}
                          </span>
                        </button>
                      ))}
                    </div>
                    {tickedDocs.length > 0 ? (
                      <ContinuousLetters coverFolderId={Number(fileId)} docs={tickedDocs} activeId={previewId} onActiveChange={setPreviewId} height={560}
                        renderLetter={(d, scrollRoot) => (
                          <DocumentWithNotes key={d.id} documentId={d.id} versionId={d.current_version_id}
                                             continuous scrollRoot={scrollRoot} notes={[]}
                                             draft={draftFor(d.id)} draftPins={draftPinsFor(d.id)} placing={placingFor(d.id)} />
                        )} />
                    ) : (
                      <div className="text-muted p-5 text-center">Select a letter to preview it.</div>
                    )}
                  </div>
                </div>

              </>
            )}
          </>
        )}
      </div>

      <RoutingConfirmModal
        show={confirming}
        title="Send this file to the Marking Officer?"
        fileLabel={data ? [data.folder_name, data.folder_reference && `(${data.folder_reference})`].filter(Boolean).join(" ") : ""}
        destination={targetLabel || "The Marking Officer role"}
        destinationNote={targetLabel ? null : "No one in particular was chosen, so anyone who holds the Marking Officer role can pick it up."}
        letters={tickedDocs.map((d) => ({ id: d.id, title: d.title, folio: d.folio_label ?? d.folio_number }))}
        confirmLabel="Yes, send it"
        busy={saving}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      />
    </DashboardLayout>
  );
};

export default FileRoutingSubmit;
