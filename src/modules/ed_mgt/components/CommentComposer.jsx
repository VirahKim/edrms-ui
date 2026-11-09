import React, { useState } from "react";
import PinPlacementLayer from "./PinPlacementLayer";

// Consumers use this to gate their submit/confirm buttons and to show their
// own validation message — it deliberately doesn't render anything itself.
// eslint-disable-next-line react-refresh/only-export-components
export const isCommentComposerValid = (value, required) => {
  const comment = (value?.comment || "").trim();
  if (!comment) return !required;
  if (value?.commentStyle === "STICKY_NOTE") {
    return value?.pinX != null && value?.pinY != null;
  }
  return true;
};

/**
 * Reusable text/sticky-note comment input, shared by every place a user
 * leaves a comment on an EDMS approval action: the three submit-for-approval
 * entry points and the approve/reject/send-back modal.
 *
 * `value` is always the composite shape `{ comment, commentStyle, pinX, pinY }`.
 *
 * `previewSlot` is the preview node to pin onto, rendered inline by this
 * component (wrapped in its own PinPlacementLayer with locally-managed
 * "placing" state) — used by the three submit entry points, which each have
 * their own self-contained preview.
 *
 * `externalPin` is an escape hatch for ApprovalWindow, where the document
 * preview already lives elsewhere on the page (outside the action modal
 * this composer renders inside of) instead of being embeddable here.
 * When provided as `{ placing, onStartPlacing }`, the Sticky Note option is
 * enabled without a `previewSlot`, and "Place Pin" hands placement control
 * to the caller instead of rendering an internal PinPlacementLayer.
 */
const CommentComposer = ({
  value,
  onChange,
  required = false,
  placeholder = "Add a comment…",
  previewSlot = null,
  disabled = false,
  externalPin = null,
}) => {
  const [placing, setPlacing] = useState(false);
  const hasPinTarget = Boolean(previewSlot) || Boolean(externalPin);
  const commentStyle = value?.commentStyle || "TEXT";
  const hasPin = value?.pinX != null && value?.pinY != null;
  const isPlacing = externalPin ? Boolean(externalPin.placing) : placing;

  const setStyle = (style) => {
    if (style === "TEXT") {
      setPlacing(false);
      onChange({ ...value, commentStyle: "TEXT", pinX: null, pinY: null });
    } else {
      onChange({ ...value, commentStyle: "STICKY_NOTE" });
    }
  };

  const startPlacing = () => {
    if (externalPin) externalPin.onStartPlacing();
    else setPlacing(true);
  };

  const handlePlace = (x, y) => {
    setPlacing(false);
    onChange({ ...value, commentStyle: "STICKY_NOTE", pinX: x, pinY: y });
  };

  const handleMove = (x, y) => {
    onChange({ ...value, pinX: x, pinY: y });
  };

  const handleTextChange = (text) => {
    if (commentStyle === "STICKY_NOTE") {
      onChange({ ...value, comment: text });
    } else {
      onChange({ ...value, comment: text, commentStyle: "TEXT", pinX: null, pinY: null });
    }
  };

  const pinLabel = hasPin ? `Pin placed at ${Math.round(value.pinX)}%, ${Math.round(value.pinY)}%` : null;

  return (
    <div>
      {hasPinTarget && (
        <div className="btn-group btn-group-sm mb-2" role="group" aria-label="Comment style">
          <button
            type="button"
            className={`btn ${commentStyle === "TEXT" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setStyle("TEXT")}
            disabled={disabled}
          >
            <i className="ti ti-align-left me-1" />Text
          </button>
          <button
            type="button"
            className={`btn ${commentStyle === "STICKY_NOTE" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setStyle("STICKY_NOTE")}
            disabled={disabled}
          >
            <i className="ti ti-note me-1" />Sticky Note
          </button>
        </div>
      )}

      {commentStyle === "STICKY_NOTE" && hasPinTarget && (
        <div className="mb-2">
          {previewSlot ? (
            <>
              <PinPlacementLayer
                active={placing}
                pendingPin={hasPin ? { x: value.pinX, y: value.pinY, note: value.comment } : null}
                onPlace={handlePlace}
                onMove={handleMove}
              >
                {previewSlot}
              </PinPlacementLayer>
              <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={startPlacing} disabled={disabled}>
                  <i className="ti ti-map-pin me-1" />{hasPin ? "Reposition Pin" : "Place Pin"}
                </button>
                <small className="text-muted">
                  {placing
                    ? "Click the document above to place your note"
                    : pinLabel
                      ? `${pinLabel}. Hold the note and drag to move it.`
                      : "Click the document to place your note"}
                </small>
              </div>
            </>
          ) : (
            <div className="border rounded p-2 bg-light-subtle">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={startPlacing} disabled={disabled || isPlacing}>
                  <i className="ti ti-map-pin me-1" />{hasPin ? "Reposition Pin" : "Place Pin"}
                </button>
                <small className="text-muted">
                  {isPlacing ? "Click the document preview to place your note…" : pinLabel || "Click “Place Pin”, then click on the document preview"}
                </small>
              </div>
            </div>
          )}
        </div>
      )}

      <textarea
        className="form-control"
        rows={3}
        placeholder={commentStyle === "STICKY_NOTE" ? "Note text…" : placeholder}
        value={value?.comment || ""}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={disabled || isPlacing}
        required={required}
        aria-required={required}
      />
    </div>
  );
};

export default CommentComposer;
