import { useEffect, useRef, useState } from "react";
import { getUserSignature, uploadUserSignature } from "../../../api/signaturesApi";
import { signDocument, getDocumentSignatureStamps, reviseStampPlacement } from "../../../api/edmsApi";
import { listOrgStamps, applyStamp, getDocumentStampApplications } from "../../../api/orgStampsApi";
import { getCurrentOrgId, getEsignOtpSetting, requestEsignOtp } from "../../../api/esignOtpApi";
import { displayDateTime as formatDateTime } from "../../../utils/dateFormat";
import SignaturePad from "../../identity_n_authentication/user_management/users/SignaturePad";
import PinPlacementLayer from "../../ed_mgt/components/PinPlacementLayer";
import FolioBadge from "../../ed_mgt/components/FolioBadge";

// The sign / stamp panel and the e-signature OTP box, shared by the approval window and the
// file routing screens so a signature is always applied the same way: the user's own saved
// signature (or one drawn on the document), or an organisation stamp - placed by dragging on
// the preview, with the emailed OTP where the organisation requires one.

const DEFAULT_STAMP = { pos_x: 0.62, pos_y: 0.82, width: 0.18, height: 0.08, page_number: 1 };
const STAMP_HANDLE_HEIGHT = 18; // px — drag-handle strip inside the top of the stamp box

// Shared by the sign/stamp panel (DocumentDetail) and the approve-with-
// signature modal (the top-level ApprovalWindow component) — both need the
// exact same "send code, then enter it" flow whenever the org has opted
// into require_otp_for_esign. Only ever sends and collects the code; actual
// verification happens server-to-server when the sign/stamp/approve call is
// made, so there's nothing here to fake by skipping a client-side check.
export function EsignOtpBox({ purpose, code, onCodeChange, disabled }) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSend = async () => {
        setSending(true);
        setError("");
        try {
            await requestEsignOtp(purpose);
            setSent(true);
        } catch (e) {
            setError(e?.response?.data?.message || "Failed to send verification code.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="border rounded p-2" style={{ backgroundColor: "#f8f7ff" }}>
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <small className="text-muted">
                    <i className="ti ti-shield-lock me-1"></i>
                    Verification required — a code will be emailed to you.
                </small>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleSend} disabled={sending || disabled}>
                    {sending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-mail me-1"></i>}
                    {sent ? "Resend Code" : "Send Code"}
                </button>
            </div>
            {sent && (
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="form-control form-control-sm mt-2"
                    placeholder="Enter the 6-digit code"
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={disabled}
                />
            )}
            {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
    );
}

export default function DocumentSignPanel({ details, documentPreview, currentUserId, onSigned, placingPin = false, onPlacePin, onMovePin, pendingPin = null }) {
    const version = details.current_version || {};
    const previewUrl = details.preview?.url || documentPreview?.preview_url;
    const previewExpiresAt = details.preview?.expires_at || documentPreview?.preview_expires_at;
    const mimeType = version.mime_type || documentPreview?.mime_type;
    const isPdf = mimeType === "application/pdf";
    const isImage = typeof mimeType === "string" && mimeType.startsWith("image/");
    const canPreview = Boolean(details.is_previewable) && Boolean(previewUrl);
    const canSign = canPreview && (isPdf || isImage) && !details.is_locked;
    // Chrome's built-in PDF viewer ships its own toolbar/sidebar/annotate tools
    // inside the iframe — #toolbar=0&navpanes=0 asks it to hide those (best
    // effort; support varies by browser) so there's nothing there to compete
    // with our own sign-here overlay for clicks.
    const pdfPreviewUrl = previewUrl && isPdf
        ? `${previewUrl}${previewUrl.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0`
        : previewUrl;

    const previewContainerRef = useRef(null);
    const stampCanvasRef = useRef(null);
    const stampDrawingRef = useRef(false);
    const [signMode, setSignMode] = useState(false);
    const [loadingSignature, setLoadingSignature] = useState(false);
    const [mySignature, setMySignature] = useState(null);
    const [stamp, setStamp] = useState(DEFAULT_STAMP);
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [signing, setSigning] = useState(false);
    const [signError, setSignError] = useState("");
    const [stamps, setStamps] = useState([]);
    const [drawOnDocument, setDrawOnDocument] = useState(false);
    const [hasStampDrawing, setHasStampDrawing] = useState(false);
    const [otpRequired, setOtpRequired] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    // A signature / stamp already on the document that its owner is moving - the same drag/resize
    // box is used, started at the stamp's current place.
    const [revise, setRevise] = useState(null);
    const [revising, setRevising] = useState(false);

    useEffect(() => {
        const orgId = getCurrentOrgId();
        if (!orgId) return;
        getEsignOtpSetting(orgId)
            .then((r) => setOtpRequired(!!(r?.require_otp_for_esign ?? r?.data?.require_otp_for_esign)))
            .catch(() => setOtpRequired(false));
    }, []);

    // "signature" = the user's own e-signature (drawn or on file). "orgstamp"
    // = a traditional org-owned stamp (e.g. "Records Office") the user is on
    // the authorized roster for. Both share the same drag/resize placement
    // box below — only the image source and the confirm-time API call differ.
    const [stampSourceMode, setStampSourceMode] = useState("signature");
    const [myStamps, setMyStamps] = useState([]);
    const [loadingMyStamps, setLoadingMyStamps] = useState(false);
    const [selectedStampId, setSelectedStampId] = useState(null);

    useEffect(() => {
        setSignMode(false);
        setSignError("");
        setStamp(DEFAULT_STAMP);
        setDrawOnDocument(false);
        setStampSourceMode("signature");
        setSelectedStampId(null);
        setOtpCode("");
        setRevise(null);
        loadPlacements();
    }, [details?.id, version.id]);

    // Every signature and organisation stamp on the document, oldest first, in one list.
    async function loadPlacements() {
        if (!details?.id) { setStamps([]); return; }
        const [sigs, apps] = await Promise.allSettled([getDocumentSignatureStamps(details.id), getDocumentStampApplications(details.id)]);
        const pick = (r) => (r.status === "fulfilled" && Array.isArray(r.value?.data) ? r.value.data : []);
        const list = [
            ...pick(sigs).map((s) => ({ ...s, kind: "signature", label: "Signature", by: s.signed_by, by_name: s.signed_by_name, at: s.signed_at })),
            ...pick(apps).map((a) => ({ ...a, kind: "stamp", label: a.stamp_name ? `Stamp: ${a.stamp_name}` : "Stamp", by: a.applied_by, by_name: a.applied_by_name, at: a.applied_at })),
        ].sort((x, y) => new Date(x.at) - new Date(y.at));
        setStamps(list);
    }

    function startMove(s) {
        setSignError("");
        setRevise({ kind: s.kind, id: s.id });
        setStamp({ pos_x: Number(s.pos_x), pos_y: Number(s.pos_y), width: Number(s.width), height: Number(s.height), page_number: s.page_number });
    }

    function cancelRevise() {
        setRevise(null);
        setStamp(DEFAULT_STAMP);
        setSignError("");
    }

    async function reviseNow(target, action) {
        setRevising(true);
        setSignError("");
        try {
            await reviseStampPlacement(details.id, target.kind, target.id, action === "REMOVE"
                ? { action }
                : { action, page_number: isPdf ? stamp.page_number : 1, pos_x: stamp.pos_x, pos_y: stamp.pos_y, width: stamp.width, height: stamp.height });
            setRevise(null);
            setStamp(DEFAULT_STAMP);
            await loadPlacements();
            onSigned?.();
        } catch (err) {
            setSignError(err?.response?.data?.message || "Could not change the signature or stamp.");
        } finally {
            setRevising(false);
        }
    }

    function removeStamp(s) {
        if (!window.confirm(`Remove this ${s.kind === "stamp" ? "stamp" : "signature"} from the document?`)) return;
        reviseNow(s, "REMOVE");
    }

    useEffect(() => {
        if (!dragging) return;
        const onMove = (e) => {
            const container = previewContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            let x = (e.clientX - rect.left) / rect.width;
            let y = (e.clientY - rect.top) / rect.height;
            x = Math.min(Math.max(x, 0), 1 - stamp.width);
            y = Math.min(Math.max(y, 0), 1 - stamp.height);
            setStamp((prev) => ({ ...prev, pos_x: x, pos_y: y }));
        };
        const onUp = () => setDragging(false);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, [dragging, stamp.width, stamp.height]);

    // Corner-handle resize — width/height track the pointer directly (like
    // dragging the corner of an image), anchored at the box's fixed top-left
    // corner (stamp.pos_x/pos_y never change while resizing this way).
    useEffect(() => {
        if (!resizing) return;
        const onMove = (e) => {
            const container = previewContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            let width = (e.clientX - (rect.left + stamp.pos_x * rect.width)) / rect.width;
            let height = (e.clientY - (rect.top + stamp.pos_y * rect.height)) / rect.height;
            width = Math.min(1 - stamp.pos_x, Math.max(0.06, width));
            height = Math.min(1 - stamp.pos_y, Math.max(0.03, height));
            setStamp((prev) => ({ ...prev, width, height }));
        };
        const onUp = () => setResizing(false);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, [resizing, stamp.pos_x, stamp.pos_y]);

    // (Re)initializes the in-place drawing canvas whenever draw-on-document mode
    // turns on, or the box is resized while drawing — resizing mid-drawing clears
    // whatever was drawn (the backing store has to be recreated to stay crisp at
    // the new size), which is why the toolbar reminds the user of that tradeoff.
    useEffect(() => {
        if (!drawOnDocument) return;
        const canvas = stampCanvasRef.current;
        const container = previewContainerRef.current;
        if (!canvas || !container) return;
        const containerRect = container.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = containerRect.width * stamp.width * ratio;
        canvas.height = Math.max(1, containerRect.height * stamp.height - STAMP_HANDLE_HEIGHT) * ratio;
        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1a1a2e";
        setHasStampDrawing(false);
    }, [drawOnDocument, stamp.width, stamp.height]);

    function handleStampCanvasPointerDown(e) {
        e.preventDefault();
        e.stopPropagation();
        const canvas = e.currentTarget;
        canvas.setPointerCapture(e.pointerId);
        stampDrawingRef.current = true;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }

    function handleStampCanvasPointerMove(e) {
        if (!stampDrawingRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        if (!hasStampDrawing) setHasStampDrawing(true);
    }

    function handleStampCanvasPointerUp(e) {
        stampDrawingRef.current = false;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }

    function clearStampDrawing() {
        const canvas = stampCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasStampDrawing(false);
    }

    async function startSigning() {
        setSignError("");
        setLoadingSignature(true);
        try {
            const sig = await getUserSignature(currentUserId);
            setMySignature(sig);
            setDrawOnDocument(false);
        } catch {
            // No saved signature yet — draw directly on the document instead of a
            // separate generic pad, so the very first signature is placed exactly
            // where the user wants it, not somewhere else and dragged in after.
            setMySignature(null);
            setDrawOnDocument(true);
        } finally {
            setLoadingSignature(false);
            setSignMode(true);
        }
    }

    async function startStamping() {
        setSignError("");
        setStampSourceMode("orgstamp");
        setDrawOnDocument(false);
        setLoadingMyStamps(true);
        try {
            const res = await listOrgStamps({ mine_only: true });
            const list = res?.data || [];
            setMyStamps(list);
            setSelectedStampId(list[0]?.id ?? null);
        } catch {
            setMyStamps([]);
            setSelectedStampId(null);
        } finally {
            setLoadingMyStamps(false);
            setSignMode(true);
        }
    }

    function cancelSigning() {
        setSignMode(false);
        setDrawOnDocument(false);
        setSignError("");
        setStamp(DEFAULT_STAMP);
        setStampSourceMode("signature");
        setSelectedStampId(null);
        setOtpCode("");
    }

    function bumpStampSize(delta) {
        setStamp((prev) => {
            const width = Math.min(0.5, Math.max(0.08, prev.width + delta));
            const height = Math.min(0.3, Math.max(0.04, prev.height + delta * 0.4));
            return {
                ...prev,
                width,
                height,
                pos_x: Math.min(prev.pos_x, 1 - width),
                pos_y: Math.min(prev.pos_y, 1 - height)
            };
        });
    }

    async function confirmSign() {
        if (otpRequired && !otpCode.trim()) {
            setSignError("Enter the verification code emailed to you first.");
            return;
        }

        if (stampSourceMode === "orgstamp") {
            if (!selectedStampId) {
                setSignError("Choose a stamp first.");
                return;
            }
            setSigning(true);
            setSignError("");
            try {
                await applyStamp(details.id, {
                    stamp_id: selectedStampId,
                    page_number: isPdf ? stamp.page_number : 1,
                    pos_x: stamp.pos_x,
                    pos_y: stamp.pos_y,
                    width: stamp.width,
                    height: stamp.height,
                    otp_code: otpRequired ? otpCode.trim() : undefined
                });
                setSignMode(false);
                setStamp(DEFAULT_STAMP);
                setStampSourceMode("signature");
                setSelectedStampId(null);
                setOtpCode("");
                loadPlacements();
                onSigned?.();
            } catch (err) {
                setSignError(err?.response?.data?.message || "Failed to apply stamp.");
            } finally {
                setSigning(false);
            }
            return;
        }

        if (drawOnDocument && !hasStampDrawing) {
            setSignError("Draw your signature in the box first.");
            return;
        }
        if (!drawOnDocument && !mySignature?.id) return;

        setSigning(true);
        setSignError("");
        try {
            let signatureId = mySignature?.id;

            // Drawing directly on the document adopts that stroke as the user's
            // saved signature (same "draw once, reuse it" model as the standalone
            // signature pad) — it becomes the signature_id the stamp references.
            if (drawOnDocument) {
                const blob = await new Promise((resolve) => stampCanvasRef.current.toBlob(resolve, "image/png"));
                if (!blob) throw new Error("Could not capture the drawn signature.");
                const file = new File([blob], "signature.png", { type: "image/png" });
                const sig = await uploadUserSignature(currentUserId, file);
                setMySignature(sig);
                signatureId = sig.id;
            }

            const res = await signDocument(details.id, {
                signature_id: signatureId,
                page_number: isPdf ? stamp.page_number : 1,
                pos_x: stamp.pos_x,
                pos_y: stamp.pos_y,
                width: stamp.width,
                height: stamp.height,
                otp_code: otpRequired ? otpCode.trim() : undefined
            });
            setSignMode(false);
            setDrawOnDocument(false);
            setStamp(DEFAULT_STAMP);
            setOtpCode("");
            onSigned?.();
            if (res?.data) await loadPlacements();
        } catch (err) {
            setSignError(err?.response?.data?.message || "Failed to sign document.");
        } finally {
            setSigning(false);
        }
    }

    return (
        <div>
            {/* Document identity (reference, type, status, created/uploaded) now
                lives in the Instance Summary card above, and Supporting Documents
                now lives in the right-hand column (see the DOCUMENT branch of the
                Instance Summary + Wizard layout below) — so neither is repeated
                here. This component is purely the preview/sign/stamp panel. */}

            {/* Preview */}
            <div className="card border mb-0">
                <div className="card-header py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <small className="fw-semibold text-muted">
                        <i className="ti ti-eye me-1"></i>Document Preview
                    </small>
                    <div className="d-flex align-items-center gap-3">
                        {previewUrl && (
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="small">
                                <i className="ti ti-external-link me-1"></i>Open in new tab
                            </a>
                        )}
                        {canSign && !signMode && !revise && (
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={startSigning}
                                disabled={loadingSignature}
                            >
                                {loadingSignature
                                    ? <><span className="spinner-border spinner-border-sm me-1" />Checking signature…</>
                                    : <><i className="ti ti-signature me-1"></i>Sign Document</>
                                }
                            </button>
                        )}
                        {canSign && !signMode && !revise && (
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={startStamping}
                                disabled={loadingMyStamps}
                                title="Apply an org-owned stamp (e.g. Records Office)"
                            >
                                {loadingMyStamps
                                    ? <><span className="spinner-border spinner-border-sm me-1" />Loading stamps…</>
                                    : <><i className="ti ti-stamp me-1"></i>Apply Stamp</>
                                }
                            </button>
                        )}
                    </div>
                </div>

                {signMode && (
                    <div className="px-3 py-2 border-bottom bg-light-subtle d-flex flex-wrap align-items-center gap-2">
                        <span className="small text-muted me-2">
                            <i className="ti ti-drag-drop me-1"></i>
                            Drag the bar to reposition, the corner dot to resize
                            {drawOnDocument && " — draw your signature below the bar"}
                        </span>
                        {stampSourceMode === "orgstamp" && myStamps.length > 0 && (
                            <select
                                className="form-select form-select-sm"
                                style={{ width: 220 }}
                                value={selectedStampId ?? ""}
                                onChange={(e) => setSelectedStampId(Number(e.target.value))}
                                disabled={signing}
                            >
                                {myStamps.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                        {isPdf && (
                            <div className="d-flex align-items-center gap-1">
                                <label className="small text-muted mb-0">Page</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="form-control form-control-sm"
                                    style={{ width: 70 }}
                                    value={stamp.page_number}
                                    onChange={(e) => setStamp((prev) => ({ ...prev, page_number: Math.max(1, Number(e.target.value) || 1) }))}
                                    disabled={signing}
                                />
                            </div>
                        )}
                        <div className="btn-group btn-group-sm">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => bumpStampSize(-0.02)}
                                disabled={signing}
                                title={drawOnDocument && hasStampDrawing ? "Smaller (clears your drawing)" : "Smaller"}
                            >
                                <i className="ti ti-minus"></i>
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => bumpStampSize(0.02)}
                                disabled={signing}
                                title={drawOnDocument && hasStampDrawing ? "Larger (clears your drawing)" : "Larger"}
                            >
                                <i className="ti ti-plus"></i>
                            </button>
                        </div>
                        {stampSourceMode === "signature" && mySignature && (
                            <button
                                className={`btn btn-sm ${drawOnDocument ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => setDrawOnDocument((prev) => !prev)}
                                disabled={signing}
                            >
                                <i className="ti ti-signature me-1"></i>
                                {drawOnDocument ? "Use Saved Signature" : "Draw Here Instead"}
                            </button>
                        )}
                        {stampSourceMode === "signature" && drawOnDocument && (
                            <button className="btn btn-sm btn-outline-secondary" onClick={clearStampDrawing} disabled={signing}>
                                <i className="ti ti-eraser me-1"></i>Clear
                            </button>
                        )}
                        <div className="ms-auto d-flex gap-2">
                            <button className="btn btn-sm btn-secondary" onClick={cancelSigning} disabled={signing}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={confirmSign}
                                disabled={
                                    signing ||
                                    (stampSourceMode === "signature" && drawOnDocument && !hasStampDrawing) ||
                                    (stampSourceMode === "orgstamp" && !selectedStampId) ||
                                    (otpRequired && !otpCode.trim())
                                }
                            >
                                {signing
                                    ? <><span className="spinner-border spinner-border-sm me-1" />{stampSourceMode === "orgstamp" ? "Stamping…" : "Signing…"}</>
                                    : <><i className="ti ti-check me-1"></i>{stampSourceMode === "orgstamp" ? "Confirm & Stamp" : "Confirm & Sign"}</>
                                }
                            </button>
                        </div>
                    </div>
                )}
                {revise && (
                    <div className="px-3 py-2 border-bottom bg-warning-subtle d-flex flex-wrap align-items-center gap-2">
                        <span className="small me-2">
                            <i className="ti ti-drag-drop me-1"></i>
                            Drag the bar to an empty space (the corner dot resizes it), then press Save position
                        </span>
                        {isPdf && (
                            <div className="d-flex align-items-center gap-1">
                                <label className="small text-muted mb-0">Page</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="form-control form-control-sm"
                                    style={{ width: 70 }}
                                    value={stamp.page_number}
                                    onChange={(e) => setStamp((prev) => ({ ...prev, page_number: Math.max(1, Number(e.target.value) || 1) }))}
                                    disabled={revising}
                                />
                            </div>
                        )}
                        <div className="ms-auto d-flex gap-2">
                            <button className="btn btn-sm btn-secondary" onClick={cancelRevise} disabled={revising}>Cancel</button>
                            <button className="btn btn-sm btn-primary" onClick={() => reviseNow(revise, "MOVE")} disabled={revising}>
                                {revising
                                    ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                                    : <><i className="ti ti-check me-1"></i>Save position</>}
                            </button>
                        </div>
                    </div>
                )}
                {signMode && otpRequired && (
                    <div className="px-3 py-2 border-bottom">
                        <EsignOtpBox
                            purpose={stampSourceMode === "orgstamp" ? "STAMP" : "SIGN"}
                            code={otpCode}
                            onCodeChange={setOtpCode}
                            disabled={signing}
                        />
                    </div>
                )}
                {signMode && stampSourceMode === "signature" && !mySignature && (
                    <div className="px-3 py-2 border-bottom bg-light-subtle">
                        <small className="text-muted">
                            <i className="ti ti-info-circle me-1"></i>
                            No signature on file yet — draw one directly on the document below to continue.
                        </small>
                    </div>
                )}
                {signMode && stampSourceMode === "orgstamp" && !loadingMyStamps && myStamps.length === 0 && (
                    <div className="px-3 py-2 border-bottom bg-danger-subtle">
                        <small className="text-danger fw-semibold">
                            <i className="ti ti-alert-circle me-1"></i>
                            You are not currently authorized to apply any stamp. Ask the stamp&rsquo;s holder or an administrator to add you under Org Stamps.
                        </small>
                    </div>
                )}
                {signError && (
                    <div className="alert alert-danger mb-0 rounded-0 py-2 px-3">
                        <i className="ti ti-alert-circle me-2"></i>{signError}
                    </div>
                )}

                {placingPin && (
                    <div className="alert alert-warning mb-0 rounded-0 py-2 px-3 d-flex align-items-center gap-2">
                        <i className="ti ti-map-pin"></i>
                        Click anywhere on the document below to place your sticky note.
                    </div>
                )}

                <div className="card-body p-0" style={{ position: "relative" }} ref={previewContainerRef}>
                    <FolioBadge documentId={details.id} right={26} />
                    <PinPlacementLayer active={placingPin} pendingPin={pendingPin} onPlace={onPlacePin} onMove={onMovePin}>
                        {!canPreview ? (
                            <div className="text-center text-muted py-5">
                                <i className="ti ti-file-off" style={{ fontSize: 28 }}></i>
                                <p className="mb-0 mt-2 small">Preview not available for this document</p>
                            </div>
                        ) : isPdf ? (
                            <iframe
                                src={pdfPreviewUrl}
                                title="Document Preview"
                                style={{ width: "100%", height: "600px", border: "none" }}
                            />
                        ) : isImage ? (
                            <div className="text-center p-3">
                                <img
                                    src={previewUrl}
                                    alt={version.original_filename || "Document preview"}
                                    style={{ maxWidth: "100%", maxHeight: "600px" }}
                                />
                            </div>
                        ) : (
                            <div className="text-center text-muted py-5">
                                <i className="ti ti-file-unknown" style={{ fontSize: 28 }}></i>
                                <p className="mb-0 mt-2 small">
                                    Preview not supported for this file type. Use &ldquo;Open in new tab&rdquo; to view.
                                </p>
                            </div>
                        )}
                    </PinPlacementLayer>

                    {(signMode || revise) && (
                        <div style={{ position: "absolute", inset: 0 }}>
                            <div
                                style={{
                                    position: "absolute",
                                    left: `${stamp.pos_x * 100}%`,
                                    top: `${stamp.pos_y * 100}%`,
                                    width: `${stamp.width * 100}%`,
                                    height: `${stamp.height * 100}%`,
                                    border: `2px ${drawOnDocument ? "solid" : "dashed"} var(--bs-primary)`,
                                    background: revise ? "rgba(255,193,7,0.15)" : "rgba(255,255,255,0.85)",
                                    userSelect: "none"
                                }}
                            >
                                {/* Drag handle — always available, in both modes, so positioning
                                    never depends on already having a signature to fall back to. */}
                                <div
                                    onPointerDown={(e) => { e.preventDefault(); setDragging(true); }}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: STAMP_HANDLE_HEIGHT,
                                        background: "var(--bs-primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: dragging ? "grabbing" : "grab",
                                        touchAction: "none"
                                    }}
                                    title="Drag to reposition"
                                >
                                    <i className="ti ti-drag-drop" style={{ fontSize: 11, color: "#fff" }}></i>
                                </div>

                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        top: STAMP_HANDLE_HEIGHT,
                                        bottom: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    {revise ? null : stampSourceMode === "orgstamp" ? (
                                        myStamps.find((s) => s.id === selectedStampId)?.public_url && (
                                            <img
                                                src={myStamps.find((s) => s.id === selectedStampId).public_url}
                                                alt="Stamp"
                                                style={{ maxWidth: "90%", maxHeight: "90%", pointerEvents: "none" }}
                                            />
                                        )
                                    ) : drawOnDocument ? (
                                        <canvas
                                            ref={stampCanvasRef}
                                            style={{ width: "100%", height: "100%", cursor: "crosshair" }}
                                            onPointerDown={handleStampCanvasPointerDown}
                                            onPointerMove={handleStampCanvasPointerMove}
                                            onPointerUp={handleStampCanvasPointerUp}
                                            onPointerCancel={handleStampCanvasPointerUp}
                                        />
                                    ) : (
                                        mySignature?.public_url && (
                                            <img
                                                src={mySignature.public_url}
                                                alt="Your signature"
                                                style={{ maxWidth: "90%", maxHeight: "90%", pointerEvents: "none" }}
                                            />
                                        )
                                    )}
                                </div>

                                {/* Resize handle — drag like the corner grip of an image, growing/
                                    shrinking the box from its fixed top-left anchor. */}
                                <div
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setResizing(true); }}
                                    style={{
                                        position: "absolute",
                                        right: -7,
                                        bottom: -7,
                                        width: 14,
                                        height: 14,
                                        borderRadius: "50%",
                                        background: "var(--bs-primary)",
                                        border: "2px solid #fff",
                                        boxShadow: "0 0 0 1px var(--bs-primary)",
                                        cursor: "nwse-resize",
                                        touchAction: "none"
                                    }}
                                    title="Drag to resize"
                                />
                            </div>
                        </div>
                    )}
                </div>
                {canPreview && previewExpiresAt && (
                    <div className="card-footer py-1 px-3">
                        <small className="text-muted">
                            <i className="ti ti-clock me-1"></i>
                            Preview link expires {formatDateTime(previewExpiresAt)}
                        </small>
                    </div>
                )}
                {stamps.length > 0 && (
                    <div className="card-footer py-2 px-3">
                        <small className="text-muted fw-semibold d-block mb-1">
                            <i className="ti ti-signature me-1"></i>Signatures and stamps on this document
                        </small>
                        <div className="d-flex flex-column gap-1">
                            {stamps.map((s) => (
                                <div key={`${s.kind}-${s.id}`} className="small text-muted d-flex flex-wrap align-items-center gap-2">
                                    <span>
                                        {s.label} — {s.by_name || (s.by ? `User #${s.by}` : "You")} — page {s.page_number} — {formatDateTime(s.at)}
                                    </span>
                                    {canSign && !signMode && !revise && String(s.by) === String(currentUserId) && (
                                        <span className="btn-group btn-group-sm">
                                            <button type="button" className="btn btn-outline-secondary py-0" onClick={() => startMove(s)} disabled={revising}
                                                    title="Drag it into an empty space so it does not hide anything">
                                                <i className="ti ti-arrows-move me-1"></i>Move
                                            </button>
                                            <button type="button" className="btn btn-outline-danger py-0" onClick={() => removeStamp(s)} disabled={revising}
                                                    title="Take this off the document">
                                                <i className="ti ti-trash me-1"></i>Remove
                                            </button>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
