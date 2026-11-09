import React from "react";

function listTimestamp(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationListItem({ conversation, isActive, currentUserId, onSelect }) {
  const isUnread = conversation.unread_count > 0;
  const previewPrefix = Number(conversation.last_message_sender_user_id) === Number(currentUserId) ? "You: " : "";

  let backgroundColor = "transparent";
  if (isActive) backgroundColor = "rgba(13,110,253,0.08)";
  else if (isUnread) backgroundColor = "rgba(13,110,253,0.03)";

  return (
    <button
      type="button"
      className="btn w-100 text-start d-flex align-items-start gap-2 border-0 border-bottom rounded-0 px-3 py-2"
      style={{ backgroundColor }}
      onClick={() => onSelect(conversation.id)}
    >
      <div
        className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary flex-shrink-0 position-relative"
        style={{ width: 40, height: 40 }}
      >
        <i className={`ti ${conversation.is_group ? "ti-users" : "ti-user"}`}></i>
        {isUnread && (
          <span
            className="rounded-circle bg-primary position-absolute"
            style={{ width: 10, height: 10, top: -1, right: -1, border: "2px solid #fff" }}
            title="Unread"
          ></span>
        )}
      </div>
      <div className="flex-grow-1 overflow-hidden">
        <div className="d-flex justify-content-between">
          <span className={`text-truncate ${isUnread ? "fw-bold" : "fw-normal"}`}>
            {conversation.other_user_name || `User #${conversation.other_user_id}`}
          </span>
          <small className={`ms-2 flex-shrink-0 ${isUnread ? "text-primary fw-semibold" : "text-muted"}`}>
            {listTimestamp(conversation.last_message_at)}
          </small>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <small className={`text-truncate ${isUnread ? "text-body fw-semibold" : "text-muted"}`} style={{ maxWidth: 220 }}>
            {previewPrefix}{conversation.last_message_preview || conversation.topic || "No messages yet"}
          </small>
          {isUnread && (
            <span className="badge rounded-pill bg-primary ms-1" style={{ fontSize: "0.65rem" }}>
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
