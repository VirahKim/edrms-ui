import React, { useState, useRef } from "react";
import PropTypes from "prop-types";

/**
 * MessageInput - Component for composing and sending messages
 */
export default function MessageInput({ onSend, onMediaUpload, disabled }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;

    const messageData = {
      text: message.trim()
    };

    if (selectedFile) {
      setUploading(true);
      try {
        const mediaData = await onMediaUpload(selectedFile);
        messageData.mediaId = mediaData.mediaId;
        messageData.mediaType = mediaData.mediaType;
        messageData.fileName = mediaData.fileName;
      } catch (error) {
        console.error("Media upload failed:", error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSend(messageData);
    
    // Clear inputs
    setMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 16MB for WhatsApp)
      if (file.size > 16 * 1024 * 1024) {
        alert("File size must be less than 16MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container border-top p-3" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
      {/* File Preview */}
      {selectedFile && (
        <div className="file-preview mb-2 p-2 rounded d-flex align-items-center justify-content-between" style={{ backgroundColor: "var(--bs-tertiary-bg, #f8f9fa)" }}>
          <div className="d-flex align-items-center gap-2">
            <i className="ti ti-paperclip text-primary"></i>
            <span className="small">{selectedFile.name}</span>
            <span className="badge bg-secondary small">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link text-danger p-0"
            onClick={removeFile}
          >
            <i className="ti ti-x"></i>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="d-flex align-items-end gap-2">
        {/* Attachment Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
            disabled={disabled || uploading}
          />
          <button
            type="button"
            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            title="Attach file"
          >
            <i className="ti ti-paperclip"></i>
          </button>
        </div>

        {/* Message Input */}
        <div className="flex-grow-1">
          <textarea
            className="form-control"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || uploading}
            rows={1}
            style={{
              resize: "none",
              minHeight: "40px",
              maxHeight: "120px",
              overflow: "auto"
            }}
          />
        </div>

        {/* Emoji Button (Future enhancement) */}
        <div>
          <button
            type="button"
            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
            disabled={disabled || uploading}
            title="Emoji (Coming soon)"
          >
            <i className="ti ti-mood-smile"></i>
          </button>
        </div>

        {/* Send Button */}
        <div>
          <button
            type="submit"
            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
            disabled={disabled || uploading || (!message.trim() && !selectedFile)}
            title="Send message"
          >
            {uploading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <i className="ti ti-send"></i>
            )}
          </button>
        </div>
      </form>

      {/* Helper Text */}
      <div className="mt-2">
        <small className="text-muted">
          <i className="ti ti-info-circle me-1"></i>
          Press Enter to send, Shift+Enter for new line
        </small>
      </div>
    </div>
  );
}

MessageInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  onMediaUpload: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

MessageInput.defaultProps = {
  disabled: false
};
