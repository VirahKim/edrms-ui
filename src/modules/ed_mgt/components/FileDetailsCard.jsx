import React, { useEffect, useState } from "react";
import { getFileDetails, getNextFolioNumber } from "../../../api/edmsApi";

const Row = ({ label, value }) => (
  <div className="col-sm-6">
    <div className="text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    <div className="fw-semibold" style={{ fontSize: "0.88rem" }}>{value || "—"}</div>
  </div>
);

/**
 * Shown right under the file picker the moment a file is selected: which registry,
 * volume and shelf it lives in, and the folio the document(s) about to be imported
 * will take. `count` > 1 (bulk) shows the folio range instead of a single number.
 */
const FileDetailsCard = ({ fileId, count = 1 }) => {
  const [file, setFile] = useState(null);
  const [nextFolio, setNextFolio] = useState(null);
  const [loading, setLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setFile(null);
    setNextFolio(null);
    if (!fileId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([getFileDetails(fileId), getNextFolioNumber(fileId)]).then(([f, n]) => {
      if (cancelled) return;
      if (f.status === "fulfilled") setFile(f.value?.data ?? f.value);
      if (n.status === "fulfilled") setNextFolio(n.value?.data?.next_folio_number ?? n.value?.next_folio_number ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fileId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!fileId) return null;

  const location = [file?.cabinet_name, file?.shelf_name].filter(Boolean).join(" / ");
  const folio = nextFolio == null ? null
    : count > 1 ? `${nextFolio} – ${nextFolio + count - 1}` : String(nextFolio);

  return (
    <div className="border rounded-3 p-3 mt-3 bg-light">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="ti ti-folder-open text-warning"></i>
        <span className="fw-semibold">{file?.name || "Selected file"}</span>
        {loading && <span className="spinner-border spinner-border-sm text-muted"></span>}
      </div>
      <div className="row g-2">
        <Row label="File reference" value={file?.reference_no} />
        <Row label="Registry" value={file?.registry_name} />
        <Row label="Volume" value={file?.volume_no} />
        <Row label="Cabinet / Shelf" value={location} />
        <Row label="Confidentiality" value={file?.confidentiality_label || file?.confidentiality_level} />
        <Row label={count > 1 ? "Folios these documents will take" : "Folio this document will take"} value={folio} />
      </div>
    </div>
  );
};

export default FileDetailsCard;
