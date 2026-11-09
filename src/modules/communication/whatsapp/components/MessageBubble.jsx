import React from "react";
import { format } from "date-fns";
import PropTypes from "prop-types";

/**
 * MessageBubble - Individual message display component
 */
export default function MessageBubble({ message, isOutbound }) {
  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "HH:mm");
    } catch (error) {
      return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "read":
        return <i className="ti ti-checks text-primary"></i>;
      case "delivered":
        return <i className="ti ti-checks text-muted"></i>;
      case "sent":
        return <i className="ti ti-check text-muted"></i>;
      case "failed":
        return <i className="ti ti-alert-circle text-danger"></i>;
      default:
        return <i className="ti ti-clock text-muted"></i>;
    }
  };

  const renderMediaContent = () => {
    if (!message.mediaUrl) return null;

    const mediaUrl = message.mediaUrl;

    switch (message.messageType) {
      case "image":
        return (
          <div className="message-media mb-2">
            <img
              src={mediaUrl}
              alt="Media"
              className="img-fluid rounded"
              style={{ maxWidth: "300px", maxHeight: "400px", cursor: "pointer" }}
              onClick={() => window.open(mediaUrl, "_blank")}
            />
          </div>
        );

      case "video":
        return (
          <div className="message-media mb-2">
            <video
              controls
              className="rounded"
              style={{ maxWidth: "300px", maxHeight: "400px" }}
            >
              <source src={mediaUrl} type={message.mimeType || "video/mp4"} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="message-media mb-2">
            <audio controls className="w-100">
              <source src={mediaUrl} type={message.mimeType || "audio/mpeg"} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case "document":
        return (
          <div className="message-media mb-2">
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
            >
              <i className="ti ti-file-download"></i>
              Download Document
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`d-flex mb-3 ${isOutbound ? "justify-content-end" : "justify-content-start"}`}>
      <div
        className={`message-bubble p-3 rounded-3 ${isOutbound ? "" : "bg-light text-dark border"}`}
        style={{
          maxWidth: "70%",
          wordWrap: "break-word",
          position: "relative",
          // bg-primary/text-white resolve to a transparent background for a
          // plain div in this app's theme (only certain components define
          // --bs-primary-rgb) — white-on-transparent text is invisible, which
          // makes outbound bubbles look "missing" rather than mis-colored.
          // Hardcoded to the app's own brand teal instead (see the messages
          // module's MessageBubble.jsx, which hit the same bug).
          ...(isOutbound ? { backgroundColor: "#007bff", color: "#fff" } : {}),
        }}
      >
        {/* Context/Reply Indicator */}
        {message.contextMessageId && (
          <div
            className={`mb-2 pb-2 border-bottom ${isOutbound ? "" : "border-secondary-50"}`}
            style={isOutbound ? { borderColor: "rgba(255,255,255,0.5)" } : undefined}
          >
            <small style={isOutbound ? { color: "rgba(255,255,255,0.75)" } : undefined} className={isOutbound ? "" : "text-muted"}>
              <i className="ti ti-corner-down-right me-1"></i>
              Replying to a message
            </small>
          </div>
        )}

        {/* Media Content */}
        {renderMediaContent()}

        {/* Text Content */}
        {message.content && (
          <div className="message-text" style={{ whiteSpace: "pre-wrap" }}>
            {message.content}
          </div>
        )}

        {/* Template Indicator */}
        {message.templateId && (
          <div className="mt-2">
            <small className={`badge ${isOutbound ? "bg-white text-primary" : "bg-primary text-white"} small`}>
              <i className="ti ti-template me-1"></i>
              Template Message
            </small>
          </div>
        )}

        {/* Timestamp and Status */}
        <div
          className={`d-flex align-items-center justify-content-end gap-1 mt-1 ${isOutbound ? "" : "text-muted"}`}
          style={{ fontSize: "0.75rem", ...(isOutbound ? { color: "rgba(255,255,255,0.75)" } : {}) }}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOutbound && (
            <span className="ms-1">
              {getStatusIcon(message.status)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    content: PropTypes.string,
    direction: PropTypes.oneOf(["INBOUND", "OUTBOUND"]).isRequired,
    messageType: PropTypes.string,
    mediaUrl: PropTypes.string,
    mimeType: PropTypes.string,
    contextMessageId: PropTypes.number,
    templateId: PropTypes.number,
    status: PropTypes.string,
    createdAt: PropTypes.string.isRequired
  }).isRequired,
  isOutbound: PropTypes.bool.isRequired
};
