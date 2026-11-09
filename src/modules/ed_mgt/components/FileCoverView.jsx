import React from "react";

const HAND = "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
const ROWS = 14;

const shortDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

/**
 * A file's cover, drawn like the paper one: reference number and volume across the top, Republic of Kenya,
 * the ministry, the department and the subject, then the ruled movement table (filled from where the file has been).
 * It is only a picture of the data: cover = { reference_no, volume_no, header_line1, header_line2, department, subject,
 * color_hex, ink_hex, movements[] }. size is "card" (beside a list) or "page" (a full page when reading the file).
 */
const FileCoverView = ({ cover, size = "card", onOpen }) => {
  const ink = cover.ink_hex || "#0b2a4a";
  const paper = cover.color_hex || "#1e88e5";
  const rule = `${ink}66`;
  const base = size === "page" ? 16 : 12.5;
  const movements = cover.movements || [];
  const volume = cover.volume_no ? String(cover.volume_no).replace(/^vol\.?\s*/i, "") : "";

  const cell = { borderRight: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`, padding: "0 0.35em", minHeight: "1.65em", display: "flex", alignItems: "center", overflow: "hidden" };

  return (
    <div
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      title={onOpen ? "Open this file" : undefined}
      style={{
        position: "relative", width: "100%", maxWidth: size === "page" ? 760 : 460, margin: "0 auto",
        fontSize: base, color: ink, background: paper, borderRadius: 6, cursor: onOpen ? "pointer" : "default",
        borderLeft: "0.7em solid rgba(0,0,0,0.16)", boxShadow: "0 6px 22px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.18)",
        backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(0,0,0,0.06))",
        padding: "1.4em 1.4em 1.2em", userSelect: "none",
      }}
    >
      {/* Reference number and volume */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.8em", borderBottom: `1px solid ${ink}`, paddingBottom: "0.1em" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: HAND, fontSize: "1.55em", lineHeight: 1.15, overflowWrap: "anywhere" }}>{cover.reference_no || " "}</div>
        </div>
        <div style={{ fontFamily: HAND, fontSize: "1.3em", whiteSpace: "nowrap", lineHeight: 1.15 }}>{volume ? `VOL. ${volume}` : ""}</div>
      </div>
      <div style={{ fontSize: "0.6em", marginTop: "0.15em", opacity: 0.85 }}>File No.</div>

      {/* Country and ministry */}
      <div style={{ textAlign: "center", marginTop: "0.9em", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: "1.25em" }}>
        {cover.header_line1}
      </div>
      <div style={{ textAlign: "center", marginTop: "0.25em", fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: "1.45em", lineHeight: 1.15 }}>
        {cover.header_line2}
      </div>

      {/* Department */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6em", marginTop: "0.5em", borderBottom: `1px solid ${ink}` }}>
        <div style={{ flex: 1, fontFamily: HAND, fontSize: "1.3em", lineHeight: 1.2, minHeight: "1.4em", overflowWrap: "anywhere" }}>{cover.department || " "}</div>
        <div style={{ fontSize: "0.65em", whiteSpace: "nowrap", paddingBottom: "0.2em" }}>Department</div>
      </div>

      {/* Subject */}
      <div style={{ textAlign: "center", fontSize: "0.62em", marginTop: "0.5em", letterSpacing: "0.12em" }}>SUBJECT</div>
      <div style={{ fontFamily: HAND, fontSize: "1.55em", lineHeight: 1.3, minHeight: "3.2em", marginTop: "0.1em", overflowWrap: "anywhere", textTransform: "uppercase" }}>
        {cover.subject}
      </div>

      {/* Movement table */}
      <div style={{ marginTop: "0.8em", borderTop: `1px solid ${rule}`, borderLeft: `1px solid ${rule}`, fontSize: "0.78em" }}>
        <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1.2fr 0.7fr", background: "rgba(255,255,255,0.18)", fontSize: "0.8em", fontWeight: 600 }}>
          {["Date", "From", "Officer to see", "Officer's initials"].map((h) => <div key={h} style={cell}>{h}</div>)}
        </div>
        {Array.from({ length: ROWS }, (_, i) => {
          const m = movements[i];
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "0.7fr 1fr 1.2fr 0.7fr", fontFamily: HAND }}>
              <div style={cell}>{m ? shortDate(m.date) : ""}</div>
              <div style={cell} title={m?.from}><span className="text-truncate">{m?.from}</span></div>
              <div style={cell} title={m?.to}><span className="text-truncate">{m?.to}</span></div>
              <div style={cell}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileCoverView;
