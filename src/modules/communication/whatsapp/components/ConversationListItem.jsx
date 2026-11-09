import React from "react";
import { formatDistanceToNow } from "date-fns";
import PropTypes from "prop-types";

/**
 * ConversationListItem - Parent component for a Contact's conversation group
 * Displays latest conversation by default, expands to show history.
 */
export default function ConversationListItem({
  contact,
  isExpanded,
  selectedConversationId,
  onToggle,
  onSelect
}) {
  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return "";
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  // Sort conversations to get the latest one first
  const conversations = [...(contact.Conversations || [])].sort((a, b) => {
    return new Date(b.LastMessageTime || 0) - new Date(a.LastMessageTime || 0);
  });

  const latestConversation = conversations[0];
  const hasMultiple = conversations.length > 1;

  // Helpers for display
  const getDisplayTime = (conversation) => conversation ? formatTime(conversation.LastMessageTime) : "";
  
  // Handlers
  const handleMainClick = (e) => {
     // If clicking the main specific area, open the latest conversation
     if (latestConversation) {
        onSelect(latestConversation);
     }
  };

  const handleExpandClick = (e) => {
    e.stopPropagation();
    onToggle();
  };

  if (!latestConversation) return null;

  const isLatestSelected = selectedConversationId === latestConversation.ConversationId;

  return (
    <div className="border-bottom">
      {/* Main Row - Always shows latest conversation info */}
      <div 
        className={`d-flex position-relative hover-bg-light ${isLatestSelected ? "bg-light-primary" : ""}`}
        style={{ cursor: "pointer", transition: "background-color 0.2s" }}
      >
        {/* Clickable Area for Selecting Chat */}
        <div 
          className="d-flex p-3 flex-grow-1 overflow-hidden" 
          onClick={handleMainClick}
          role="button"
          tabIndex={0}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 position-relative">
              <div className="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center rounded-circle" 
                style={{ width: "48px", height: "48px", fontSize: "18px", fontWeight: "600" }}>
                {contact.ContactName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow-1 ms-3 overflow-hidden">
              <div className="d-flex justify-content-between align-items-start mb-1">
                <h6 className="mb-0 text-truncate fw-semibold">
                  {contact.ContactName || contact.ContactWaId}
                </h6>
                <small className="text-muted flex-shrink-0 ms-2" style={{ fontSize: "0.75rem" }}>
                  {getDisplayTime(latestConversation)}
                </small>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                 <div className="d-flex align-items-center overflow-hidden">
                    {!latestConversation.IsOpen && (
                        <i className="ti ti-archive text-muted me-1" style={{ fontSize: "14px" }} title="Closed"></i>
                    )}
                    <span className="text-secondary small text-truncate">
                      {truncateMessage(latestConversation.LastMessageText) || <span className="text-muted fst-italic">No messages</span>}
                    </span>
                 </div>

                 {latestConversation.UnreadCount > 0 && (
                  <span className="badge bg-success rounded-pill ms-2 flex-shrink-0">
                    {latestConversation.UnreadCount}
                  </span>
                 )}
              </div>
            </div>
        </div>

        {/* Expand Trigger - Separate Click Target */}
        {hasMultiple && (
          <div 
            className="d-flex align-items-center px-2 hover-bg-dark-10"
            onClick={handleExpandClick}
            style={{ borderLeft: "1px solid rgba(0,0,0,0.05)", cursor: "pointer" }}
            title="View history"
          >
             <i className={`ti ti-chevron-${isExpanded ? "up" : "down"} text-muted`}></i>
          </div>
        )}
      </div>

      {/* Expanded List - Shows ALL conversations (including latest, to be explicit, or just others? 
          Listing all simplifies the mental model: "Here represents the contact, inside are the chats")
       */}
      {isExpanded && hasMultiple && (
        <div className="bg-light-subtle border-top shadow-inner">
           {conversations.map((conv, idx) => {
              // Optional: skip the first one if we want to treat the distinct parent row as the first one. 
              // But displaying all confirms the history order.
              // Let's display all but style them slightly smaller.
              const isSelected = selectedConversationId === conv.ConversationId;
              
              return (
                <div
                  key={conv.ConversationId}
                  className={`d-flex align-items-center p-2 ps-5 border-bottom ${isSelected ? "border-start border-primary border-3" : ""}`}
                  style={{ cursor: "pointer", ...(isSelected ? { backgroundColor: "var(--bs-card-bg, #fff)" } : {}) }}
                  onClick={() => onSelect(conv)}
                >
                   {/* Small Status Icon */}
                   <div className="me-2" style={{ width: "20px", textAlign: "center" }}>
                      {conv.IsOpen ? (
                        <i className="ti ti-message-circle text-success" title="Open"></i>
                      ) : (
                        <i className="ti ti-archive text-muted" title="Closed"></i>
                      )}
                   </div>

                   <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex justify-content-between">
                         <small className="fw-medium">
                            {formatTime(conv.StartedAt || conv.LastMessageTime)}
                         </small>
                         {/* <small className="text-muted" style={{fontSize: "0.7rem"}}>
                             {formatTime(conv.LastMessageTime)}
                         </small> */}
                      </div>
                      <div className="d-flex justify-content-between">
                        <small className="text-muted text-truncate w-75">
                          {truncateMessage(conv.LastMessageText, 30)}
                        </small>
                        {conv.UnreadCount > 0 && (
                          <span className="badge bg-success rounded-pill ms-2" style={{ fontSize: "0.6rem" }}>
                            {conv.UnreadCount}
                          </span>
                        )}
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      )}
    </div>
  );
}

ConversationListItem.propTypes = {
  contact: PropTypes.shape({
    ContactId: PropTypes.number,
    ContactName: PropTypes.string,
    ContactWaId: PropTypes.string,
    Conversations: PropTypes.array
  }).isRequired,
  isExpanded: PropTypes.bool,
  selectedConversationId: PropTypes.number,
  onToggle: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired
};

ConversationListItem.defaultProps = {
  isExpanded: false,
  selectedConversationId: null
};
