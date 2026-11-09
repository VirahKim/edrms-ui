import React from "react";
import { useFolioInfo } from "./useFolioInfo";

/** The box itself, exactly as it is printed at the top right of each page: "Folio 7" and "Ref: Folio 3, 4". */
export const FolioBox = ({ info, style }) => {
  if (!info || (!info.folio_label && !(info.cross_references || []).length)) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.93)", border: "1px solid #000", padding: "3px 8px", color: "#000", lineHeight: 1.35,
      textAlign: "right", fontFamily: "Arial, sans-serif", pointerEvents: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", ...style,
    }}>
      {info.folio_label && <div style={{ fontWeight: 700, fontSize: "0.8rem" }}>Folio {info.folio_label}</div>}
      {(info.cross_references || []).length > 0 && (
        <div style={{ fontSize: "0.72rem" }}>Ref: Folio {info.cross_references.join(", ")}</div>
      )}
    </div>
  );
};

/** Pins the box to the top right corner of whatever positioned element it is placed in. */
const FolioBadge = ({ documentId, info: given, top = 8, right = 24 }) => {
  const fetched = useFolioInfo(given ? null : documentId);
  return <FolioBox info={given || fetched} style={{ position: "absolute", top, right, zIndex: 12 }} />;
};

export default FolioBadge;
