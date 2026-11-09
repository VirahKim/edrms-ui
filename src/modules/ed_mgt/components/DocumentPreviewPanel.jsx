import React, { useState, useEffect, useCallback } from "react";
import { getPreviewFile } from "../../../api/edmsApi";
import FolioBadge from "./FolioBadge";

// The server returns PDFs and images as-is, and converts Office files to PDF,
// so every supported file type is shown inline without a download.

/** Reads the server's JSON error message from a failed blob response. */
const readErrorMessage = async (err) => {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text());
      if (body?.message) return body.message;
    } catch {
      // Not JSON; fall through to the generic text.
    }
  }
  return err?.response?.status === 415
    ? "This file type cannot be previewed."
    : "Could not load preview.";
};

const DocumentPreviewPanel = ({ documentId, versionId, height = 480 }) => {
  // result holds the outcome of one request, tagged with its key, so a stale
  // result from a previous document or retry is never shown.
  const [result, setResult] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const requestKey = `${documentId}:${versionId}:${attempt}`;

  useEffect(() => {
    if (!documentId || !versionId) return undefined;
    let cancelled = false;
    let url = null;
    const key = `${documentId}:${versionId}:${attempt}`;

    getPreviewFile(documentId, versionId)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setResult({ key, url, kind: blob.type.startsWith("image/") ? "image" : "pdf", error: null });
      })
      .catch(async (err) => {
        const message = await readErrorMessage(err);
        if (!cancelled) setResult({ key, url: null, kind: null, error: message });
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [documentId, versionId, attempt]);

  const current = result?.key === requestKey ? result : null;
  const loading = !!documentId && !!versionId && !current;
  const objectUrl = current?.url ?? null;
  const kind = current?.kind ?? null;
  const error = current?.error ?? null;

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Called as a function, not rendered as a component: a component declared inside
  // this render would be a new type on every render and would remount the viewer.
  const renderPreview = () => {
    if (loading) return (
      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
        <div className="spinner-border spinner-border-sm me-2"></div> Loading preview…
      </div>
    );
    if (error || !objectUrl) return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted px-3 text-center">
        <i className="ti ti-file-off" style={{ fontSize: 48 }}></i>
        <p className="mt-2 mb-1">Preview not available</p>
        <small>{error || "No preview"}</small>
        <button className="btn btn-sm btn-outline-secondary mt-2" onClick={retry}>
          <i className="ti ti-refresh me-1"></i> Retry
        </button>
      </div>
    );
    if (kind === "image") return (
      <div className="d-flex align-items-center justify-content-center h-100 p-2">
        <img src={objectUrl} alt="Document preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      </div>
    );
    return <iframe src={objectUrl} title="Document preview" width="100%" height="100%" style={{ border: 0 }} />;
  };

  return (
    <>
      <div className="position-relative rounded border" style={{ height, overflow: "hidden", backgroundColor: "var(--bs-card-bg, #fff)" }}>
        <FolioBadge documentId={documentId} />
        <div className="position-absolute bottom-0 end-0 p-2" style={{ zIndex: 10 }}>
          <button className="btn btn-sm btn-light shadow-sm" onClick={() => setFullscreen(true)} title="Full screen">
            <i className="ti ti-maximize"></i>
          </button>
        </div>
        {renderPreview()}
      </div>

      {fullscreen && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.85)", zIndex: 9999 }}
             onClick={() => setFullscreen(false)}>
          <div className="modal-dialog modal-fullscreen" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title mb-0">Document preview</h6>
                <button className="btn-close" onClick={() => setFullscreen(false)}></button>
              </div>
              <div className="modal-body p-0 position-relative" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>
                <FolioBadge documentId={documentId} />
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentPreviewPanel;
