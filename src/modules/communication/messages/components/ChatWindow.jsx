import React, { useEffect, useRef, useState, useCallback } from "react";
import { getConversation, getConversationMessages, replyToConversation } from "../../../../api/messagesApi";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import AddParticipantsModal from "./AddParticipantsModal";
import ConversationInfoModal from "./ConversationInfoModal";

const POLL_MS = 5000;
const PAGE_SIZE = 50;

function mergeMessages(prev, fetched) {
  const byId = new Map(prev.map((m) => [m.id, m]));
  fetched.forEach((m) => byId.set(m.id, m));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id
  );
}

export default function ChatWindow({ conversationId, currentUserId, onMessageSent, onLeft }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [olderPage, setOlderPage] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const scrollRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // Initial load — conversation detail + most recent page of messages.
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    setLoading(true);
    setError("");
    setMessages([]);
    setOlderPage(1);
    setReplyingTo(null);
    setShowAddPeople(false);
    setShowInfo(false);

    Promise.all([
      getConversation(conversationId),
      getConversationMessages(conversationId, { page: 1, page_size: PAGE_SIZE }),
    ])
      .then(([conv, msgRes]) => {
        if (cancelled) return;
        setConversation(conv);
        setMessages(mergeMessages([], msgRes?.data || []));
        setTotalPages(msgRes?.pagination?.total_pages || 1);
        isNearBottomRef.current = true;
        setTimeout(scrollToBottom, 0);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load this conversation.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [conversationId, scrollToBottom]);

  // Poll for new incoming messages while the conversation stays open —
  // merges by id, so it never disturbs history already loaded further back.
  // A new "X added/removed/renamed" marker means the membership or title
  // changed, so that (and only that) is when the conversation is re-fetched.
  // A 404 means this person was removed from it.
  const knownIdsRef = useRef(new Set());
  useEffect(() => {
    knownIdsRef.current = new Set(messages.map((m) => m.id));
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    const id = setInterval(() => {
      getConversationMessages(conversationId, { page: 1, page_size: PAGE_SIZE })
        .then((res) => {
          const fetched = res?.data || [];
          const newSystem = fetched.some((m) => m.is_system && !knownIdsRef.current.has(m.id));
          setMessages((prev) => {
            const merged = mergeMessages(prev, fetched);
            if (merged.length !== prev.length && isNearBottomRef.current) {
              setTimeout(scrollToBottom, 0);
            }
            return merged;
          });
          if (newSystem) getConversation(conversationId).then(setConversation).catch(() => {});
        })
        .catch((err) => {
          if (err?.response?.status === 404) onLeft?.();
        });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [conversationId, scrollToBottom, onLeft]);

  const handleLoadOlder = async () => {
    const nextPage = olderPage + 1;
    setLoadingOlder(true);
    try {
      const res = await getConversationMessages(conversationId, { page: nextPage, page_size: PAGE_SIZE });
      setMessages((prev) => mergeMessages(prev, res?.data || []));
      setOlderPage(nextPage);
    } catch {
      setError("Failed to load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSend = async (body) => {
    const replyToId = replyingTo?.id;
    const res = await replyToConversation(conversationId, body, replyToId);
    // Optimistic append — the next poll will reconcile with the server copy.
    setMessages((prev) => mergeMessages(prev, [{
      id: res.message_id,
      sender_user_id: Number(currentUserId),
      body,
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to_message_id: replyToId,
      reply_to_sender_name: replyingTo?.sender_name,
      reply_to_preview: replyingTo?.body,
    }]));
    setReplyingTo(null);
    isNearBottomRef.current = true;
    setTimeout(scrollToBottom, 0);
    onMessageSent?.();
  };

  // Re-fetches rather than patching local state: adding people can turn a
  // 1:1 into a group (new title/icon) and adds an "X added Y" marker.
  const handleConversationChanged = async () => {
    try {
      const [conv, msgRes] = await Promise.all([
        getConversation(conversationId),
        getConversationMessages(conversationId, { page: 1, page_size: PAGE_SIZE }),
      ]);
      setConversation(conv);
      setMessages((prev) => mergeMessages(prev, msgRes?.data || []));
      isNearBottomRef.current = true;
      setTimeout(scrollToBottom, 0);
    } catch {
      setError("The change was saved, but the conversation couldn't be refreshed.");
    }
    onMessageSent?.();
  };

  const handlePeopleAdded = async () => {
    try {
      const [conv, msgRes] = await Promise.all([
        getConversation(conversationId),
        getConversationMessages(conversationId, { page: 1, page_size: PAGE_SIZE }),
      ]);
      setConversation(conv);
      setMessages((prev) => mergeMessages(prev, msgRes?.data || []));
      isNearBottomRef.current = true;
      setTimeout(scrollToBottom, 0);
    } catch {
      setError("People were added, but the conversation couldn't be refreshed.");
    }
    onMessageSent?.();
  };

  if (!conversationId) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
        <i className="ti ti-message-circle-2" style={{ fontSize: "3rem", color: "#ccc" }}></i>
        <p className="text-muted mt-2 mb-0">Select a conversation, or start a new one</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isGroup = !!conversation?.is_group;
  const participants = conversation?.participants || [];
  const participantNames = participants
    .map((p) => (Number(p.user_id) === Number(currentUserId) ? "You" : p.name || `User #${p.user_id}`))
    .join(", ");

  return (
    <div className="d-flex flex-column h-100">
      {/* Header */}
      <div className="border-bottom p-3 d-flex align-items-center gap-2 flex-shrink-0">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary flex-shrink-0"
          style={{ width: 40, height: 40 }}
        >
          <i className={`ti ${isGroup ? "ti-users" : "ti-user"}`}></i>
        </div>
        <div className="flex-grow-1 text-truncate">
          <div className="fw-semibold text-truncate">
            {conversation?.other_user_name || `User #${conversation?.other_user_id}`}
          </div>
          {isGroup ? (
            <small className="text-muted text-truncate d-block" title={participantNames}>
              {participants.length} people: {participantNames}
            </small>
          ) : (
            conversation?.topic && <small className="text-muted text-truncate d-block">{conversation.topic}</small>
          )}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={() => setShowAddPeople(true)}
          title="Add people to this conversation"
        >
          <i className="ti ti-user-plus me-1"></i>Add
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          onClick={() => setShowInfo(true)}
          title="Members and settings"
        >
          <i className="ti ti-info-circle"></i>
        </button>
        {conversation?.related_entity_link && (
          <a href={conversation.related_entity_link} className="btn btn-sm btn-outline-primary flex-shrink-0">
            <i className="ti ti-link me-1"></i>
            {conversation.related_entity_type ? `View ${conversation.related_entity_type.toLowerCase()}` : "View"}
          </a>
        )}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show m-2 py-2" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-grow-1 overflow-auto p-3" style={{ minHeight: 0 }}>
        {olderPage < totalPages && (
          <div className="text-center mb-3">
            <button className="btn btn-sm btn-outline-secondary" onClick={handleLoadOlder} disabled={loadingOlder}>
              {loadingOlder ? <span className="spinner-border spinner-border-sm" /> : "Load older messages"}
            </button>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isOutbound={Number(m.sender_user_id) === Number(currentUserId)}
            showSender={isGroup}
            onReply={setReplyingTo}
          />
        ))}
      </div>

      <MessageInput
        onSend={handleSend}
        onError={setError}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {showInfo && conversation && (
        <ConversationInfoModal
          conversation={conversation}
          currentUserId={currentUserId}
          onClose={() => setShowInfo(false)}
          onAddPeople={() => { setShowInfo(false); setShowAddPeople(true); }}
          onChanged={async () => { await handleConversationChanged(); setShowInfo(false); }}
          onLeft={() => { setShowInfo(false); onMessageSent?.(); onLeft?.(); }}
        />
      )}

      {showAddPeople && (
        <AddParticipantsModal
          conversationId={conversationId}
          participants={participants}
          isGroup={isGroup}
          onClose={() => setShowAddPeople(false)}
          onAdded={handlePeopleAdded}
        />
      )}
    </div>
  );
}
