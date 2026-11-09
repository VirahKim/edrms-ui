import React, { useEffect, useRef, useState } from "react";

// Holding the left mouse button on the pending note for this long starts a drag.
const LONG_PRESS_MS = 300;
// Pressing and moving the note this far starts the drag straight away.
const DRAG_START_PX = 3;

const clampPercent = (v) => Math.min(100, Math.max(0, v));

/**
 * Generic click-to-place overlay for "sticky note" comments — a pin dropped
 * at an x/y position (0-100 percent) on top of whatever preview is rendered
 * as `children`. Framework-agnostic of what's underneath: works the same
 * over an `<iframe>`, an `<img>`, or arbitrary HTML (the docx/xlsx renders),
 * because it never touches `children` — it only ever adds absolutely
 * positioned siblings on top of it.
 *
 * - `pins` — static sticky notes always rendered (used for read-only history
 *   display too, with `active` left false). Each is `{x, y, note?}` — `note`
 *   is the comment text shown inside the note card; omit it for a bare pin.
 * - `pendingPin` — the note still being edited (e.g. the comment composer's
 *   in-progress pin, before the comment is submitted), rendered visually
 *   distinct (pulsing pin, different tilt) from confirmed `pins`. Same
 *   `{x, y, note?}` shape — pass the live comment text as `note` so the
 *   sticky note on the document updates as the user types.
 * - `onMove(x, y)` — makes `pendingPin` draggable. Hold the left mouse button
 *   on the note for a moment, then drag it to a new spot; `onMove` gets the
 *   final position. Omit it for a note that cannot be moved.
 * - Saved notes can be read when they overlap: click one to bring it to the
 *   front, drag it aside, or use "Spread notes" to lay them all out side by
 *   side. This only changes how this viewer sees them; the saved position of
 *   each note is never changed. "Reset" puts them back.
 * - `active` — capturing-placement mode. While true, an invisible
 *   crosshair-cursor layer sits above `children` and turns the next click
 *   into a placement instead of letting it reach `children` (so a real
 *   `<iframe>` underneath never receives the click). While false, the
 *   capture layer isn't rendered at all, so normal preview interaction
 *   (scrolling a PDF iframe, etc.) is untouched.
 */
const PinPlacementLayer = ({ active = false, pins = [], pendingPin = null, onPlace, onMove, children }) => {
  const wrapperRef = useRef(null);
  // Live drag state, kept in a ref so pointer handlers always see the latest values.
  const dragRef = useRef(null);
  const [dragPos, setDragPos] = useState(null);
  // View-only arrangement of the saved notes: moved positions by index, and the one on top.
  const [offsets, setOffsets] = useState({});
  const [front, setFront] = useState(null);
  const pinDragRef = useRef(null);

  // Clear a pending long-press timer if the layer unmounts mid-press.
  useEffect(() => () => {
    if (dragRef.current?.timer) clearTimeout(dragRef.current.timer);
  }, []);

  const handleCaptureClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.min(100, Math.max(0, x));
    y = Math.min(100, Math.max(0, y));
    onPlace?.(x, y);
  };

  const handleGrabDown = (e) => {
    if (e.button !== 0 || !wrapperRef.current || !pendingPin) return;
    e.preventDefault(); // no text selection or native image drag while holding
    const state = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: { x: pendingPin.x, y: pendingPin.y },
      rect: wrapperRef.current.getBoundingClientRect(),
      dragging: false,
      pos: null,
      timer: null,
    };
    // Holding still for the long-press time also picks the note up.
    state.timer = setTimeout(() => startDrag(state), LONG_PRESS_MS);
    dragRef.current = state;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const startDrag = (d) => {
    if (d.timer) clearTimeout(d.timer);
    d.dragging = true;
    d.pos = d.origin;
    setDragPos(d.origin);
  };

  const handleGrabMove = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.dragging) {
      // Pressing and moving starts the drag straight away.
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_START_PX) return;
      startDrag(d);
    }
    const x = clampPercent(d.origin.x + ((e.clientX - d.startX) / d.rect.width) * 100);
    const y = clampPercent(d.origin.y + ((e.clientY - d.startY) / d.rect.height) * 100);
    d.pos = { x, y };
    setDragPos(d.pos);
  };

  const handleGrabUp = (e) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    const finalPos = d.dragging ? d.pos : null;
    dragRef.current = null;
    setDragPos(null);
    if (finalPos) onMove?.(finalPos.x, finalPos.y);
  };

  // Dragging a saved note aside, so the notes underneath it can be read.
  const handlePinDown = (index, pin) => (e) => {
    if (e.button !== 0 || !wrapperRef.current) return;
    e.preventDefault();
    setFront(index);
    const o = offsets[index];
    pinDragRef.current = {
      index,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: { x: o?.x ?? pin.x, y: o?.y ?? pin.y },
      rect: wrapperRef.current.getBoundingClientRect(),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePinMove = (e) => {
    const d = pinDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_START_PX) return;
    d.moved = true;
    const x = clampPercent(d.origin.x + ((e.clientX - d.startX) / d.rect.width) * 100);
    const y = clampPercent(d.origin.y + ((e.clientY - d.startY) / d.rect.height) * 100);
    setOffsets((prev) => ({ ...prev, [d.index]: { x, y } }));
  };

  const handlePinUp = (e) => {
    const d = pinDragRef.current;
    if (d && e.pointerId === d.pointerId) pinDragRef.current = null;
  };

  // Lays every saved note out in a grid so none covers another.
  const spreadNotes = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const noteWidth = 190 + 14;
    const rowHeight = 170;
    const cols = Math.max(1, Math.min(pins.length, Math.floor(rect.width / noteWidth)));
    const next = {};
    pins.forEach((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      next[i] = {
        x: clampPercent(((col + 0.5) * (rect.width / cols) / rect.width) * 100),
        y: clampPercent(((50 + row * rowHeight) / rect.height) * 100),
      };
    });
    setOffsets(next);
  };

  const resetNotes = () => {
    setOffsets({});
    setFront(null);
  };

  // Pin + note are drawn as ONE unit, not two independently-positioned
  // elements: the pin is a hand-drawn SVG vector (with its point at an exact,
  // known coordinate) laid out inline right above the note's text, in normal
  // document flow — not absolutely positioned/offset by hand-tuned pixels
  // against a font glyph's unpredictable internal metrics. A single rotate on
  // the outer box tilts the whole assembled piece together, so the pin can
  // never drift apart from the note it's supposedly stuck to.
  const renderMarker = (savedPin, key, pending, index = -1) => {
    const moved = !pending ? offsets[index] : null;
    const pin = moved ? { ...savedPin, x: moved.x, y: moved.y } : savedPin;
    const hasText = Boolean(pin.note && pin.note.trim());
    const tilt = pending ? -5 : 5;
    const draggable = pending && Boolean(onMove);
    const isDragging = draggable && dragPos != null;
    // Saved notes can always be pulled to the front or dragged aside for reading.
    const movable = !pending;
    const isFront = movable && front === index;
    const grabProps = movable
      ? {
          onPointerDown: handlePinDown(index, savedPin),
          onPointerMove: handlePinMove,
          onPointerUp: handlePinUp,
          onPointerCancel: handlePinUp,
          onDragStart: (e) => e.preventDefault(),
        }
      : draggable
      ? {
          onPointerDown: handleGrabDown,
          onPointerMove: handleGrabMove,
          onPointerUp: handleGrabUp,
          onPointerCancel: handleGrabUp,
          onContextMenu: (e) => e.preventDefault(),
          // Stop the browser's own drag of the note, which would cancel ours.
          onDragStart: (e) => e.preventDefault(),
        }
      : {};
    return (
      <div
        key={key}
        {...grabProps}
        title={draggable ? "Hold and drag to move the note" : movable ? "Click to bring to front, drag to move aside" : undefined}
        style={{
          position: "absolute",
          left: `${pin.x}%`,
          top: `${pin.y}%`,
          transform: `translate(-50%, -34px) rotate(${tilt}deg) scale(${isDragging ? 1.04 : 1})`,
          zIndex: isDragging ? 7 : isFront ? 8 : 6,
          pointerEvents: draggable || movable ? "auto" : "none",
          cursor: draggable || movable ? (isDragging ? "grabbing" : "grab") : undefined,
          touchAction: draggable || movable ? "none" : undefined,
          userSelect: "none",
          width: 190,
          maxWidth: "65%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          filter: `drop-shadow(${isDragging ? "4px 8px 10px" : "2px 4px 6px"} rgba(0,0,0,0.3))`,
          transition: isDragging ? "none" : "transform 120ms ease",
        }}
      >
        <svg width="24" height="26" viewBox="0 0 24 26" style={{ display: "block" }}>
          <line x1="12" y1="9" x2="12" y2="25" stroke="#8a8a8a" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="8" r="7" fill="#e03131" stroke="#9c1414" strokeWidth="0.75" />
          <circle cx="9.5" cy="5.7" r="2" fill="#ffffff" opacity="0.5" />
          {pending && (
            <circle cx="12" cy="8" r="9.5" fill="none" stroke="#f59f00" strokeWidth="1.2">
              <animate attributeName="r" values="9.5;12;9.5" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1.1s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <div
          style={{
            width: "100%",
            marginTop: -3,
            background: "#fff59d",
            border: "1px solid #e6d370",
            padding: "8px 10px",
            fontSize: "0.75rem",
            lineHeight: 1.35,
            color: "#5c4a1e",
            minHeight: 44,
            maxHeight: 150,
            overflowY: "auto",
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
          }}
        >
          {hasText ? pin.note : <span style={{ opacity: 0.6, fontStyle: "italic" }}>Empty note</span>}
        </div>
      </div>
    );
  };

  const shownPending = pendingPin && dragPos ? { ...pendingPin, x: dragPos.x, y: dragPos.y } : pendingPin;

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      {children}

      {active && (
        <div
          onClick={handleCaptureClick}
          title="Click to place your sticky note"
          style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "crosshair" }}
        />
      )}

      {pins.length > 1 && (
        <div className="position-absolute d-flex gap-1" style={{ top: 6, right: 6, zIndex: 9 }}>
          <button type="button" className="btn btn-sm btn-light border shadow-sm" onClick={spreadNotes}
            title="Lay the notes out side by side so none covers another">
            <i className="ti ti-layout-grid me-1" />Spread notes
          </button>
          {Object.keys(offsets).length > 0 && (
            <button type="button" className="btn btn-sm btn-light border shadow-sm" onClick={resetNotes}>
              Reset
            </button>
          )}
        </div>
      )}

      {pins.map((p, i) => renderMarker(p, `pin-${i}`, false, i))}
      {shownPending && renderMarker(shownPending, "pin-pending", true)}
    </div>
  );
};

export default PinPlacementLayer;
