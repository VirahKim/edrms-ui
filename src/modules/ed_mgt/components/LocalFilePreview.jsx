import React, { useState, useEffect } from "react";
import { DocxPreview, XlsxPreview } from "./officeFilePreview";
import { isDocxName, isXlsxName } from "./officeFileUtils";

const fmtFileSize = (b) => {
  if (b == null) return "";
  return b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
};

/* ── Preview body for a locally-selected File object ── */
const LocalPreviewContent = ({ file, previewUrl, emptyHint }) => {
  if (!file) return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
      <i className="ti ti-file-off" style={{ fontSize: 48 }}></i>
      <p className="mt-2 mb-0 text-center px-3">{emptyHint}</p>
    </div>
  );

  const name = file.name || "";
  const isPDF = file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
  const isImage = file.type?.startsWith("image/");
  const loadBuffer = () => file.arrayBuffer();

  if (isPDF) return (
    <iframe src={previewUrl} title={file.name} width="100%" height="100%" style={{ border: 0 }} />
  );
  if (isImage) return (
    <img src={previewUrl} alt={file.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
  );
  if (isDocxName(name)) return <DocxPreview loadBuffer={loadBuffer} cacheKey={file} />;
  if (isXlsxName(name)) return <XlsxPreview loadBuffer={loadBuffer} cacheKey={file} />;
  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
      <i className="ti ti-file-description" style={{ fontSize: 56 }}></i>
      <p className="mt-2 mb-1 fw-semibold text-body text-truncate px-3" style={{ maxWidth: "100%" }}>{file.name}</p>
      <small>No inline preview for this file type</small>
    </div>
  );
};

/* ── Preview for a locally-selected File object, before it's uploaded ── */
const LocalFilePreview = ({ file, height = 420, emptyHint = "Attach a file to preview it here." }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Object URLs are a browser resource outside React state, created/revoked
  // here to stay in sync with the `file` prop — a legitimate external-system
  // sync effect, not derived state.
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <>
      <div className="position-relative rounded border" style={{ height, overflow: "hidden", backgroundColor: "var(--bs-card-bg, #fff)" }}>
        {file && (
          <div className="position-absolute top-0 end-0 p-2" style={{ zIndex: 10 }}>
            <button type="button" className="btn btn-sm btn-light shadow-sm" onClick={() => setFullscreen(true)} title="Full screen">
              <i className="ti ti-maximize"></i>
            </button>
          </div>
        )}
        <LocalPreviewContent file={file} previewUrl={previewUrl} emptyHint={emptyHint} />
      </div>

      {file && (
        <div className="d-flex align-items-center justify-content-between mt-2 px-1">
          <span className="text-truncate fw-semibold" style={{ fontSize: "0.82rem", maxWidth: "70%" }} title={file.name}>
            {file.name}
          </span>
          <span className="text-muted" style={{ fontSize: "0.78rem" }}>{fmtFileSize(file.size)}</span>
        </div>
      )}

      {fullscreen && file && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.85)", zIndex: 9999 }}
             onClick={() => setFullscreen(false)}>
          <div className="modal-dialog modal-fullscreen" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title mb-0">{file.name}</h6>
                <button type="button" className="btn-close" onClick={() => setFullscreen(false)}></button>
              </div>
              <div className="modal-body p-0" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>
                <LocalPreviewContent file={file} previewUrl={previewUrl} emptyHint={emptyHint} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocalFilePreview;
