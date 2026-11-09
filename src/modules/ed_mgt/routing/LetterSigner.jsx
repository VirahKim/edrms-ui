import React, { useEffect, useState } from "react";
import DocumentSignPanel from "../../workflows/approvals/DocumentSignPanel";
import { getDocument, getPreviewUrl, prepareDocumentForSigning } from "../../../api/edmsApi";

const currentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.id ?? u?.user_id;
  } catch { return undefined; }
};

/**
 * Signs or stamps one letter with the existing e-signature flow (the user's saved signature,
 * one drawn on the document, or an organisation stamp - placed by dragging, with the emailed
 * code where the organisation requires one). Signing writes a new version of the letter.
 */
const LetterSigner = ({ documentId, onSigned }) => {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [converted, setConverted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // A Word / Excel letter is turned into a PDF version first; PDFs and images are used as they are.
        const prepared = await prepareDocumentForSigning(documentId);
        if (prepared?.data?.converted && !cancelled) setConverted(true);
        const res = await getDocument(documentId);
        const doc = res?.data || res;
        const cv = doc?.current_version;
        if (!cv?.id) throw new Error("This letter has no file to sign.");
        const prev = await getPreviewUrl(documentId, cv.id);
        if (cancelled) return;
        setDetails({
          id: doc.id,
          current_version: cv,
          preview: { url: prev?.data?.url, expires_at: prev?.data?.expires_at },
          is_previewable: true,
          is_locked: !!doc.is_locked,
        });
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message
          || (e?.response?.status === 404 ? "The server does not have the signing step yet - restart the EDMS API, then try again." : e?.message)
          || "Could not open the letter for signing.");
      }
    })();
    return () => { cancelled = true; };
  }, [documentId]);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-2">
        <span className="fw-semibold"><i className="ti ti-signature me-1 text-success"></i>Sign or stamp this letter</span>
      </div>
      <div className="card-body">
        {error ? <div className="alert alert-danger mb-0">{error}</div>
          : !details ? <div className="text-muted small">Getting the letter ready to sign…</div>
          : <>
              {converted && (
                <div className="alert alert-info py-2 small">
                  This letter was a Word/Office file, so it was converted to PDF to be signed. The original is kept as an earlier version.
                </div>
              )}
              <DocumentSignPanel details={details} currentUserId={currentUserId()} onSigned={onSigned} />
            </>}
      </div>
    </div>
  );
};

export default LetterSigner;
