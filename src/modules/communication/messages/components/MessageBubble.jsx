import React, { useState } from "react";

function formatTime(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * A single chat bubble — right-aligned/primary for the current user's own
 * messages, left-aligned/light for the other participant's. Mirrors the
 * WhatsApp module's MessageBubble styling for visual consistency across the
 * communication module. Hovering reveals a reply button (`onReply`); a
 * quoted message (`message.reply_to_message_id`) renders inline above the
 * body, same as the "swipe to reply" pattern in most chat apps. In a group
 * (`showSender`), other people's bubbles are labelled with who wrote them,
 * and the read tick means everyone else has seen it.
 */
export default function MessageBubble({ message, isOutbound, showSender = false, onReply }) {
  const [hovered, setHovered] = useState(false);

  // "Alice added Bob" — a centered note in the thread, not a bubble.
  if (message.is_system) {
    return (
      <div className="text-center text-muted my-2" style={{ fontSize: "0.78rem" }}>
        <i className="ti ti-user-plus me-1"></i>{message.body}
      </div>
    );
  }

  const replyButton = (
    <button
      type="button"
      className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 28,
        height: 28,
        padding: 0,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.15s",
        pointerEvents: hovered ? "auto" : "none",
      }}
      title="Reply"
      onClick={() => onReply?.(message)}
    >
      <i className="ti ti-arrow-back-up" style={{ fontSize: "0.9rem" }}></i>
    </button>
  );

  return (
    <div
      className={`d-flex align-items-center gap-1 mb-2 ${isOutbound ? "justify-content-end" : "justify-content-start"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isOutbound && replyButton}
      <div
        className={`p-2 px-3 rounded-3 ${isOutbound ? "" : "bg-light text-dark border"}`}
        style={{
          maxWidth: "70%",
          wordWrap: "break-word",
          // bg-primary/text-white resolve to a transparent background for a
          // plain div in this app's theme (only certain components define
          // --bs-primary-rgb) — white-on-transparent text is invisible, which
          // is why outbound bubbles looked "missing" rather than mis-colored.
          // Hardcoded to the app's own brand teal instead, same as the
          // Navbar's AI pill does for the same reason.
          ...(isOutbound ? { backgroundColor: "#007bff", color: "#fff" } : {}),
        }}
      >
        {showSender && !isOutbound && (
          <div className="fw-semibold mb-1" style={{ fontSize: "0.78rem", color: "#007bff" }}>
            {message.sender_name || `User #${message.sender_user_id}`}
          </div>
        )}
        {message.reply_to_message_id && (
          <div
            className={`mb-2 p-2 rounded-2 border-start border-3 ${isOutbound ? "" : "text-muted"}`}
            style={{
              fontSize: "0.78rem",
              borderColor: isOutbound ? "rgba(255,255,255,0.6)" : "#007bff",
              backgroundColor: isOutbound ? "rgba(255,255,255,0.15)" : "rgba(2,115,92,0.08)",
              ...(isOutbound ? { color: "rgba(255,255,255,0.9)" } : {}),
            }}
          >
            <div className="fw-semibold">{message.reply_to_sender_name || "Deleted message"}</div>
            <div className="text-truncate" style={{ opacity: 0.85 }}>{message.reply_to_preview}</div>
          </div>
        )}
        <div style={{ whiteSpace: "pre-wrap" }}>{message.body}</div>
        <div
          className={`d-flex align-items-center justify-content-end gap-1 mt-1 ${isOutbound ? "" : "text-muted"}`}
          style={{ fontSize: "0.7rem", ...(isOutbound ? { color: "rgba(255,255,255,0.75)" } : {}) }}
        >
          <span>{formatTime(message.created_at)}</span>
          {isOutbound && (
            <i className={`ti ${message.is_read ? "ti-checks" : "ti-check"}`}></i>
          )}
        </div>
      </div>
      {!isOutbound && replyButton}
    </div>
  );
}
