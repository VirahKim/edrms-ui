import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getConversations } from "../../../api/messagesApi";
import ConversationListItem from "./components/ConversationListItem";
import ChatWindow from "./components/ChatWindow";
import ComposeMessageModal from "./ComposeMessageModal";

const POLL_MS = 15000;

export default function MyMessagesInbox() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = user?.user_id;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const fetchConversations = () => {
    getConversations()
      .then((res) => {
        setConversations(res?.data || []);
        setError("");
      })
      .catch(() => setError("Failed to load conversations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Deep-link from the navbar bell's hover preview — location.state can
  // change while this component stays mounted (same route, different
  // conversation clicked), so this has to react to it via an effect rather
  // than lazy-initializing state once.
  useEffect(() => {
    if (location.state?.openConversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(location.state.openConversationId);
    }
  }, [location.state]);

  const handleSelect = (id) => {
    setSelectedId(id);
    // Optimistic — the conversation's own fetch marks it read server-side;
    // this just clears the badge immediately instead of waiting a poll cycle.
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)));
  };

  // Left (or was removed from) the open conversation — it's no longer
  // visible to this user, so close it and drop it from the list.
  const handleLeft = useCallback(() => {
    setSelectedId(null);
    fetchConversations();
  }, []);

  const handleConversationStarted = (res) => {
    fetchConversations();
    if (res?.conversation_id) setSelectedId(res.conversation_id);
  };

  const filtered = conversations.filter((c) =>
    !searchTerm.trim() ||
    (c.other_user_name || "").toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    (c.topic || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      <div className="card mb-0" style={{ height: "75vh", minHeight: 520 }}>
        <div className="card-body p-0 d-flex h-100" style={{ overflow: "hidden" }}>
          <div
            className={`border-end d-flex flex-column ${selectedId ? "d-none d-md-flex" : "d-flex"}`}
            style={{ width: 340, minWidth: 280, flexShrink: 0, height: "100%" }}
          >
            <div className="p-2 border-bottom" style={{ flexShrink: 0 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Messages</span>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowCompose(true)}>
                  <i className="ti ti-plus me-1"></i>New
                </button>
              </div>
              <div className="input-group input-group-sm">
                <span className="input-group-text" style={{ backgroundColor: "var(--bs-card-bg, #fff)" }}>
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search conversations…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-grow-1 overflow-auto">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="ti ti-message-off" style={{ fontSize: "2.5rem", color: "#ccc" }}></i>
                  <p className="text-muted mt-2 mb-0">
                    {searchTerm ? "No conversations match your search" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                filtered.map((c) => (
                  <ConversationListItem
                    key={c.id}
                    conversation={c}
                    isActive={selectedId === c.id}
                    currentUserId={currentUserId}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          </div>

          <div className={`flex-grow-1 ${selectedId ? "d-flex" : "d-none d-md-flex"} flex-column`} style={{ minWidth: 0 }}>
            {selectedId && (
              <div className="d-md-none p-2 border-bottom">
                <button className="btn btn-sm btn-light" onClick={() => setSelectedId(null)}>
                  <i className="ti ti-arrow-left me-1"></i>Back
                </button>
              </div>
            )}
            <div className="flex-grow-1" style={{ minHeight: 0 }}>
              <ChatWindow
                conversationId={selectedId}
                currentUserId={currentUserId}
                onMessageSent={fetchConversations}
                onLeft={handleLeft}
              />
            </div>
          </div>
        </div>
      </div>

      {showCompose && (
        <ComposeMessageModal
          onClose={() => setShowCompose(false)}
          onSent={handleConversationStarted}
        />
      )}
    </>
  );
}
