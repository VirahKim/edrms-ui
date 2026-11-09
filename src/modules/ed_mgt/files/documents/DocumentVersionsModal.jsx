import React, { useState, useEffect, useCallback } from "react";
import { getVersions, getPreviewUrl, getDownloadUrl, promoteVersion, restoreVersion } from "../../../../api/edmsApi";
import { toast } from "../../components/EDMSToast";
import ConfirmModal from "../../components/ConfirmModal";
import UploadVersionModal from "../../components/UploadVersionModal";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
const fmtRelative = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};
const fmtSize = (b) => {
  if (!b) return "—";
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

const SCAN_BADGE = {
  CLEAN: "bg-success",
  PENDING: "bg-warning text-dark",
  INFECTED: "bg-danger",
  SKIPPED: "bg-secondary",
};

const TIER_BADGE = {
  HOT: "text-bg-success",
  WARM: "text-bg-info",
  COLD: "text-bg-secondary",
  GLACIER: "text-bg-dark",
};

/* ── DocumentVersionsModal — view history, switch/rollback current version,
     and request restore of archived (cold/glacier) versions. ── */
const DocumentVersionsModal = ({ doc, onClose, onChanged }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbackTarget, setRollbackTarget] = useState(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const isLocked = !!doc.is_locked;

  const loadVersions = useCallback(() => {
    setLoading(true);
    getVersions(doc.id)
      .then((res) => setVersions(res?.data || []))
      .catch(() => toast.error("Failed to load version history."))
      .finally(() => setLoading(false));
  }, [doc.id]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handlePreview = async (v) => {
    try {
      const res = await getPreviewUrl(doc.id, v.id);
      const url = res?.data?.url;
      if (!url) { toast.error("Preview link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get preview link."); }
  };

  const handleDownload = async (v) => {
    try {
      const res = await getDownloadUrl(doc.id, v.id);
      const url = res?.data?.url;
      if (!url) { toast.error("Download link unavailable."); return; }
      window.open(url, "_blank");
    } catch { toast.error("Could not get download link."); }
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    setRollingBack(true);
    try {
      await promoteVersion(doc.id, rollbackTarget.id);
      toast.success(`Rolled back to ${rollbackTarget.version_label || `v${rollbackTarget.version_number}`}.`);
      setRollbackTarget(null);
      loadVersions();
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to roll back version.");
    } finally {
      setRollingBack(false);
    }
  };

  const handleRestore = async (v) => {
    setRestoringId(v.id);
    try {
      const res = await restoreVersion(doc.id, v.id);
      toast.success(res?.message || "Glacier restore requested.");
      loadVersions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to request restore.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <>
      <ConfirmModal
        show={!!rollbackTarget}
        title="Roll Back Version"
        message={`Make "${rollbackTarget?.version_label || `v${rollbackTarget?.version_number}`}" the current version of "${doc.title}"? Later versions stay in history and can be switched back to at any time.`}
        confirmLabel={rollingBack ? "Rolling back…" : "Roll Back"}
        onConfirm={handleRollback}
        onCancel={() => !rollingBack && setRollbackTarget(null)}
      />

      {showUpload && (
        <UploadVersionModal
          documentId={doc.id}
          documentTitle={doc.title}
          nextVersionNumber={(versions[0]?.version_number || 0) + 1}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { loadVersions(); onChanged?.(); }}
        />
      )}

      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className="ti ti-versions me-2 text-primary" />
                Version History — <span className="fw-normal">{doc.title}</span>
              </h5>
              <div className="d-flex align-items-center gap-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowUpload(true)} disabled={isLocked}>
                  <i className="ti ti-upload me-1" />Upload New Version
                </button>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
              </div>
            </div>

            <div className="modal-body p-0">
              {isLocked && (
                <div className="alert alert-warning border-0 rounded-0 mb-0 py-2 px-3" style={{ fontSize: "0.8rem" }}>
                  <i className="ti ti-lock me-1" />
                  This document is locked — rolling back is disabled until it is unlocked.
                </div>
              )}
              {loading ? (
                <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="ti ti-versions-off" style={{ fontSize: 32 }} />
                  <p className="mt-2 mb-0">No versions found.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: 460, overflowY: "auto" }}>
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                    <thead className="table-light">
                      <tr>
                        <th>Version</th>
                        <th>Filename</th>
                        <th>Change Summary</th>
                        <th>Size</th>
                        <th>Tier</th>
                        <th>Uploaded By</th>
                        <th>Uploaded At</th>
                        <th>Scan</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <span className="badge bg-secondary">{v.version_label || `v${v.version_number}`}</span>
                            {v.is_current && <span className="badge text-bg-primary ms-1">Current</span>}
                          </td>
                          <td><i className="ti ti-file me-1 text-muted" />{v.original_filename}</td>
                          <td className="text-muted">{v.change_summary || "—"}</td>
                          <td>{fmtSize(v.file_size_bytes)}</td>
                          <td>
                            <span className={`badge ${TIER_BADGE[v.storage_tier] || "text-bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
                              {v.storage_tier_label || v.storage_tier}
                            </span>
                            {!v.is_available && (
                              <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                                {v.restore_requested_at
                                  ? `Restore requested — available by ${fmtDate(v.restore_available_until)}`
                                  : "Archived"}
                              </div>
                            )}
                          </td>
                          <td>{v.uploaded_by_name || (v.uploaded_by ? `User #${v.uploaded_by}` : "—")}</td>
                          <td title={fmtDate(v.uploaded_at)}>{fmtRelative(v.uploaded_at)}</td>
                          <td>
                            <span className={`badge ${SCAN_BADGE[v.virus_scan_status] || "bg-secondary"}`} style={{ fontSize: "0.7rem" }}>
                              {v.virus_scan_status || "—"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-1 flex-nowrap">
                              {v.is_available ? (
                                <>
                                  <button className="btn btn-sm btn-outline-secondary" title="Preview" onClick={() => handlePreview(v)}>
                                    <i className="ti ti-eye" />
                                  </button>
                                  <button className="btn btn-sm btn-outline-secondary" title="Download" onClick={() => handleDownload(v)}>
                                    <i className="ti ti-download" />
                                  </button>
                                  {!v.is_current && (
                                    <button
                                      className="btn btn-sm btn-outline-primary text-nowrap"
                                      title="Make this the current version"
                                      disabled={isLocked}
                                      onClick={() => setRollbackTarget(v)}
                                    >
                                      <i className="ti ti-history me-1" />Roll Back
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-secondary text-nowrap"
                                  title="Request restore from cold storage"
                                  onClick={() => handleRestore(v)}
                                  disabled={!!v.restore_requested_at || restoringId === v.id}
                                >
                                  {restoringId === v.id ? (
                                    <span className="spinner-border spinner-border-sm" />
                                  ) : (
                                    <><i className="ti ti-cloud-download me-1" />{v.restore_requested_at ? "Restore requested" : "Request Restore"}</>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer border-top">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentVersionsModal;
