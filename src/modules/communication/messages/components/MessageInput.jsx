import React, { useState } from "react";

/**
 * Reply box pinned to the bottom of an open conversation. Enter sends,
 * Shift+Enter inserts a newline — same convention as the WhatsApp module's
 * MessageInput.
 */
export default function MessageInput({ onSend, onError, disabled, replyingTo, onCancelReply }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setBody("");
    } catch (err) {
      // Without this, a failed send (network error, expired session, a 404
      // if the conversation vanished) left the box just sitting there with
      // no feedback at all — indistinguishable from the button not working.
      onError?.(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-top" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
      {replyingTo && (
        <div className="d-flex align-items-center justify-content-between px-3 pt-2" style={{ fontSize: "0.8rem" }}>
          <div className="d-flex align-items-start gap-2 overflow-hidden border-start border-3 ps-2" style={{ borderColor: "#007bff" }}>
            <div className="overflow-hidden">
              <div className="fw-semibold text-truncate">
                Replying to {replyingTo.sender_name || "message"}
              </div>
              <div className="text-muted text-truncate">{replyingTo.body}</div>
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-link text-muted p-0 flex-shrink-0" onClick={onCancelReply} title="Cancel reply">
            <i className="ti ti-x"></i>
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-2 d-flex align-items-end gap-2">
        <textarea
          className="form-control"
          rows={1}
          style={{ resize: "none", maxHeight: 120 }}
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
        />
        <button type="submit" className="btn btn-primary flex-shrink-0" disabled={disabled || sending || !body.trim()}>
          {sending ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-send" />}
        </button>
      </form>
    </div>
  );
}
