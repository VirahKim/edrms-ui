import React, { useState } from "react";
import { uploadVersion } from "../../../api/edmsApi";
import { toast } from "./EDMSToast";

/* ── UploadVersionModal — attach a new file version to an existing document.
     The previous version stays in history and can always be rolled back to
     via DocumentVersionsModal / VersionsTab (promoteVersion). ── */
const UploadVersionModal = ({ documentId, documentTitle, nextVersionNumber, onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [versionLabel, setVersionLabel] = useState(nextVersionNumber ? `v${nextVersionNumber}` : "");
  const [changeSummary, setChangeSummary] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Choose a file to upload."); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (versionLabel.trim()) fd.append("version_label", versionLabel.trim());
      if (changeSummary.trim()) fd.append("change_summary", changeSummary.trim());
      const res = await uploadVersion(documentId, fd);
      toast.success("New version uploaded.");
      onUploaded?.(res?.data ?? res);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload new version.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => !uploading && onClose()} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <form onSubmit={handleSubmit}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title">
                  <i className="ti ti-upload me-2 text-primary" />
                  Upload New Version{documentTitle ? <span className="fw-normal"> — {documentTitle}</span> : null}
                </h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={uploading} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>File <span className="text-danger">*</span></label>
                  <input type="file" className="form-control" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={uploading} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>Version Label</label>
                  <input type="text" className="form-control" value={versionLabel}
                         onChange={(e) => setVersionLabel(e.target.value)} disabled={uploading}
                         placeholder={nextVersionNumber ? `v${nextVersionNumber}` : "v2"} />
                </div>
                <div className="mb-1">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.875rem" }}>Change Summary</label>
                  <textarea className="form-control" rows={2} value={changeSummary}
                            onChange={(e) => setChangeSummary(e.target.value)} disabled={uploading}
                            placeholder="What changed in this version?" />
                </div>
                <p className="text-muted mb-0 mt-2" style={{ fontSize: "0.78rem" }}>
                  The current version stays in history — you can roll back to it at any time.
                </p>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
                  {uploading ? <><span className="spinner-border spinner-border-sm me-1" />Uploading…</> : <><i className="ti ti-upload me-1" />Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default UploadVersionModal;
