import { useEffect, useState } from "react";
import { getDocumentFolioInfo } from "../../../api/edmsApi";

/** The document's folio and the folios it refers to (null until loaded, or when it has none). */
export const useFolioInfo = (documentId) => {
  const [state, setState] = useState({ id: null, info: null });
  useEffect(() => {
    if (!documentId) return undefined;
    let cancelled = false;
    getDocumentFolioInfo(documentId)
      .then((info) => { if (!cancelled) setState({ id: documentId, info }); })
      .catch(() => { if (!cancelled) setState({ id: documentId, info: null }); });
    return () => { cancelled = true; };
  }, [documentId]);
  return state.id === documentId ? state.info : null;
};
