import React, { useEffect, useState } from "react";
import { getCoverColors } from "../../../api/fileCoversApi";

/**
 * Swatches of the cover paper colours used in registries. value / onChange work with the colour code (BLUE, GREEN ...).
 * `colors` can be passed in when the caller already has the list; otherwise it is fetched.
 */
const CoverColorPicker = ({ value, onChange, disabled, colors: given }) => {
  const [fetched, setFetched] = useState([]);
  useEffect(() => {
    if (given) return;
    getCoverColors().then(setFetched).catch(() => setFetched([]));
  }, [given]);
  const colors = given || fetched;
  const chosen = colors.find((c) => c.code === String(value || "").toUpperCase());

  return (
    <div>
      <div className="d-flex flex-wrap gap-2">
        {colors.map((c) => {
          const on = chosen?.code === c.code;
          return (
            <button key={c.code} type="button" disabled={disabled} onClick={() => onChange(c.code)} title={c.label}
                    aria-label={c.label} aria-pressed={on}
                    className="border-0 p-0 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, background: c.color_hex, outline: on ? "3px solid #0d6efd" : "1px solid rgba(0,0,0,0.25)", outlineOffset: on ? 2 : 0, color: c.ink_hex }}>
              {on && <i className="ti ti-check" />}
            </button>
          );
        })}
      </div>
      {chosen && <div className="text-muted mt-1" style={{ fontSize: "0.78rem" }}>{chosen.label}</div>}
    </div>
  );
};

export default CoverColorPicker;
