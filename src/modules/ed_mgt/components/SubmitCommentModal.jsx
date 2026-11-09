import React, { useState, useEffect } from "react";
import { getDocument, submitDocument } from "../../../api/edmsApi";
import { toast } from "./EDMSToast";
import DocumentPreviewPanel from "./DocumentPreviewPanel";
import CommentComposer, { isCommentComposerValid } from "./CommentComposer";
import { isResubmission } from "../constants/documentStatus";

/**
 * Shared "submit / resubmit for approval" modal — used from anywhere that
 * doesn't already have a full-page layout to put a CommentComposer + preview
 * into (DocumentList's row action, DocumentDetail's action bar). Always
 * fetches its own fresh copy of the document (current_version info isn't
 * guaranteed to be on whatever row/object the caller already has), so
 * callers only need to hand it a document id.
 */
const SubmitCommentModal = ({ documentId, onClose, onSubmitted }) => {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentState, setCommentState] = useState({ comment: "", commentStyle: "TEXT", pinX: null, pinY: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocument(documentId)
      .then((r) => { if (!cancelled) setDoc(r?.data || r); })
      .catch(() => { if (!cancelled) toast.error("Failed to load document."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [documentId]);

  const resubmitting = isResubmission(doc?.status);
  const cv = doc?.current_version;
  const valid = isCommentComposerValid(commentState, false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitDocument(documentId, {
        comment: commentState.comment || undefined,
        comment_style: commentState.commentStyle,
        pin_x: commentState.pinX,
        pin_y: commentState.pinY,
      });
      toast.success(
        res?.data?.status === "ACTIVE"
          ? "Document activated — no approval required."
          : resubmitting
          ? "Document resubmitted for approval."
          : "Document submitted for approval."
      );
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9000 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ti ti-send me-2 text-primary"></i>
              {resubmitting ? "Resubmit" : "Submit"} {doc?.title ? `"${doc.title}"` : "Document"} for Approval
            </h5>
            <button className="btn-close" onClick={onClose} disabled={submitting}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4"><span className="spinner-border spinner-border-sm" /></div>
            ) : !doc ? (
              <div className="alert alert-danger mb-0">Document not found.</div>
            ) : (
              <>
                {resubmitting && (
                  <div className="alert alert-info d-flex align-items-center gap-2 py-2 mb-3">
                    <i className="ti ti-info-circle"></i>
                    <div>This document is already approved. Submitting will start a new approval round.</div>
                  </div>
                )}
                <CommentComposer
                  value={commentState}
                  onChange={setCommentState}
                  placeholder="Add a note for approvers (optional)…"
                  disabled={submitting}
                  previewSlot={
                    <DocumentPreviewPanel
                      documentId={doc.id}
                      versionId={cv?.id}
                      mimeType={cv?.mime_type}
                      filename={cv?.original_filename}
                      height={340}
                    />
                  }
                />
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || loading || !doc || !valid}>
              {submitting
                ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
                : <><i className="ti ti-send me-1"></i>{resubmitting ? "Resubmit for Approval" : "Submit for Approval"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitCommentModal;
