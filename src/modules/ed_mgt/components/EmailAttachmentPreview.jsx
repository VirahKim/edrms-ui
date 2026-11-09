import React, { useEffect, useRef, useState } from "react";
import LocalFilePreview from "./LocalFilePreview";
import { previewEmailAttachment } from "../../../api/edmsApi";

// Avoid pulling a huge attachment through the server just to preview it —
// it still imports normally, it just isn't rendered inline here.
const MAX_PREVIEW_BYTES = 20 * 1024 * 1024;

/* ── Preview for one not-yet-imported email attachment ──────────────────────
   Fetches the attachment's raw bytes through the same account-scoped proxy
   Search/Import use, wraps them as a File, and hands off to LocalFilePreview —
   so an email attachment renders with exactly the same PDF/image/docx/xlsx
   logic as a locally-picked file, instead of a second preview implementation. */
const EmailAttachmentPreview = ({ accountId, item, height = 480, emptyHint = "Select an attachment to preview it here." }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);
  const cache = useRef({});

  useEffect(() => {
    if (!item || !accountId) { setFile(null); setTooLarge(false); return undefined; }

    const key = `${item.messageId}:${item.attachmentId}`;
    if (cache.current[key]) { setFile(cache.current[key]); setTooLarge(false); return undefined; }
    if (item.size && item.size > MAX_PREVIEW_BYTES) { setFile(null); setTooLarge(true); return undefined; }

    let cancelled = false;
    setLoading(true); setTooLarge(false); setFile(null);
    previewEmailAttachment({
      external_account_id: accountId,
      message_id: item.messageId,
      attachment_id: item.attachmentId,
      mime_type: item.mimeType,
    })
      .then((blob) => {
        if (cancelled) return;
        const f = new File([blob], item.filename, { type: item.mimeType || blob.type });
        cache.current[key] = f;
        setFile(f);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [item, accountId]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center rounded border text-muted" style={{ height, backgroundColor: "var(--bs-card-bg, #fff)" }}>
        <div className="spinner-border spinner-border-sm me-2"></div> Fetching preview…
      </div>
    );
  }

  if (tooLarge && item) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center rounded border text-muted text-center px-3" style={{ height, backgroundColor: "var(--bs-card-bg, #fff)" }}>
        <i className="ti ti-file-description" style={{ fontSize: 56 }}></i>
        <p className="mt-2 mb-1 fw-semibold text-body text-truncate px-3" style={{ maxWidth: "100%" }}>{item.filename}</p>
        <small>Too large to preview inline — it will still import normally.</small>
      </div>
    );
  }

  return <LocalFilePreview file={file} height={height} emptyHint={emptyHint} />;
};

export default EmailAttachmentPreview;
