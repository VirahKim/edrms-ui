import { useState, useRef } from "react";

// Uses position:fixed with a computed viewport rect (same escape-the-clip trick as
// the FixedMenu dropdowns elsewhere in this module) so the tooltip never gets cut
// off by an ancestor card/header's overflow, regardless of where the trigger sits.
export default function Tooltip({ text, children }) {
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);

  const show = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceAbove = r.top;
    const below = spaceAbove < 70; // not enough room above — flip below the trigger
    setPos({
      left: r.left + r.width / 2,
      top: below ? r.bottom + 6 : r.top - 6,
      below,
    });
  };

  const hide = () => setPos(null);

  return (
    <span
      ref={triggerRef}
      className="position-relative d-inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {pos && text && (
        <div
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            transform: pos.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            backgroundColor: "#1e293b",
            color: "#f1f5f9",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            lineHeight: "1.4",
            width: "220px",
            whiteSpace: "normal",
            zIndex: 10000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              [pos.below ? "bottom" : "top"]: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderWidth: "5px",
              borderStyle: "solid",
              borderColor: pos.below
                ? "transparent transparent #1e293b transparent"
                : "#1e293b transparent transparent transparent",
            }}
          />
          {text}
        </div>
      )}
    </span>
  );
}

export function FieldLabel({ label, required, tooltip }) {
  return (
    <label className="form-label d-flex align-items-center gap-1 mb-1">
      {label}
      {required && <span className="text-danger">*</span>}
      {tooltip && (
        <Tooltip text={tooltip}>
          <i
            className="ti ti-info-circle text-muted"
            style={{ fontSize: "14px", cursor: "help" }}
          />
        </Tooltip>
      )}
    </label>
  );
}
