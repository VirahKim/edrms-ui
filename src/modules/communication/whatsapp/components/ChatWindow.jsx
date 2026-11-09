import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import whatsappApi from "../../../../api/whatsappApi";
import { format } from "date-fns";

/**
 * ChatWindow - Main chat interface for displaying and sending messages
 */
export default function ChatWindow({ conversation, phoneNumberId, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (conversation && phoneNumberId) {
      setLoading(true);
      setMessages([]);
      loadMessages();
      // Mark conversation as read
      markAsRead();
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [conversation?.Id, phoneNumberId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      const response = await whatsappApi.getMessages(conversation.Id);
      const data = response.data || [];

      // Normalize API PascalCase fields to camelCase used by MessageBubble
      const normalized = data.map((msg) => {
        const contentRaw = msg.Content || "";

        // If template message and variables exist, append them for display
        let content = contentRaw;
        const isTemplate = (msg.MessageType || "").toLowerCase() === "template";
        const vars = msg.Variables || msg.TemplateVariables || null;
        if (isTemplate && Array.isArray(vars) && vars.length > 0) {
          content = `${contentRaw} | ${vars.join(", ")}`;
        }

        return {
          id: msg.Id,
          conversationId: msg.ConversationId,
          metaMessageId: msg.MetaMessageId,
          direction: msg.Direction,
          messageType: msg.MessageType,
          fromWaId: msg.FromWaId,
          toWaId: msg.ToWaId,
          content,
          mediaId: msg.MediaId,
          mediaUrl: msg.MediaUrl,
          mimeType: msg.MimeType,
          contextMessageId: msg.ContextMessageId,
          templateId: msg.TemplateId,
          status: msg.Status,
          createdAt: msg.CreatedAt
        };
      });

      setMessages(normalized);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversation) return;
    
    try {
      await whatsappApi.markConversationAsRead(conversation.Id);
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageData) => {
    if (!conversation) return;

    setSending(true);
    setError("");

    try {
      const payload = {
        contactWaId: conversation.ContactWaId,
        messageText: messageData.text,
        phoneNumberId: phoneNumberId
      };

      // Add media if present
      if (messageData.mediaId) {
        payload.mediaId = messageData.mediaId;
        payload.mediaType = messageData.mediaType;
        payload.mediaFileName = messageData.fileName;
      }

      await whatsappApi.sendMessage(payload);

      // Reload messages to show the sent message
      await loadMessages();
      
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleMediaUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await whatsappApi.uploadMedia(formData);
      return response.data;
    } catch (err) {
      console.error("Media upload failed:", err);
      throw new Error("Failed to upload media");
    }
  };

  const handleCloseConversation = async () => {
    if (!conversation) return;

    if (!window.confirm("Are you sure you want to close this conversation?")) {
      return;
    }

    try {
      await whatsappApi.closeConversation(conversation.Id);
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (err) {
      console.error("Failed to close conversation:", err);
      alert("Failed to close conversation");
    }
  };

  const handleReopenConversation = async () => {
    if (!conversation) return;

    try {
      await whatsappApi.reopenConversation(conversation.Id);
      if (onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (err) {
      console.error("Failed to reopen conversation:", err);
      alert("Failed to reopen conversation");
    }
  };

  if (!conversation) {
    return (
      <div className="chat-window d-flex flex-column h-100 align-items-center justify-content-center" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
        <div className="text-center text-muted">
          <i className="ti ti-message-circle" style={{ fontSize: "64px" }}></i>
          <h5 className="mt-3">No Conversation Selected</h5>
          <p>Select a conversation from the list to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window d-flex flex-column h-100" style={{ overflow: "hidden" }}>
      {/* Chat Header - Fixed */}
      <div className="chat-header border-bottom p-3" style={{ flexShrink: 0, zIndex: 10, backgroundColor: "var(--bs-card-bg, #fff)" }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "40px", height: "40px", fontSize: "16px", fontWeight: "600" }}>
              {conversation.ContactName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h6 className="mb-0">{conversation.ContactName || conversation.ContactWaId}</h6>
              <small className="text-muted">{conversation.ContactWaId}</small>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-light"
              onClick={loadMessages}
              title="Refresh messages"
            >
              <i className="ti ti-refresh"></i>
            </button>
            
            {conversation.IsOpen ? (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleCloseConversation}
                title="Close conversation"
              >
                <i className="ti ti-x me-1"></i>
                Close
              </button>
            ) : (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={handleReopenConversation}
                title="Reopen conversation"
              >
                <i className="ti ti-refresh me-1"></i>
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show m-3 mb-0" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Messages Container - Scrollable */}
      <div
        ref={messagesContainerRef}
        className="messages-container overflow-auto p-3"
        style={{ flex: 1, minHeight: 0, backgroundColor: "var(--bs-tertiary-bg, #f8f9fa)" }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="ti ti-message-off" style={{ fontSize: "48px" }}></i>
            <p className="mt-3">No messages yet</p>
            <p className="small">Start the conversation by sending a message below</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOutbound={message.direction === "OUTBOUND"}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div style={{ flexShrink: 0 }}>
        {conversation.IsOpen ? (
          <MessageInput
            onSend={handleSendMessage}
            onMediaUpload={handleMediaUpload}
            disabled={sending}
          />
        ) : (
          <div className="alert alert-warning m-3 mb-0">
            <i className="ti ti-info-circle me-2"></i>
            This conversation is closed. Reopen it to send messages.
          </div>
        )}
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  conversation: PropTypes.shape({
    Id: PropTypes.number.isRequired,
    ContactName: PropTypes.string,
    ContactWaId: PropTypes.string.isRequired,
    IsOpen: PropTypes.bool.isRequired
  }),
  phoneNumberId: PropTypes.number.isRequired,
  onConversationUpdate: PropTypes.func
};

ChatWindow.defaultProps = {
  conversation: null,
  onConversationUpdate: null
};
