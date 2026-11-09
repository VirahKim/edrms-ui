import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DashboardLayout from "../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../ed_mgt/components/EDMSToast";
import FileTreeSelect from "../ed_mgt/components/FileTreeSelect";
import {
  getDocumentTypes,
  getFileTree,
  createDocument,
  uploadVersion,
  askDocuments,
  getAskConversations,
  getAskConversationMessages,
} from "../../api/edmsApi";
import {
  sendChatMessage,
  getModelPolicies,
  getConversations,
  getConversationMessages,
  DEFAULT_POLICY,
  parseGatewayError,
} from "../../api/aiGatewayApi";
import { addErrorLog } from "./errorLogStore";

const FALLBACK_REPLY =
  "Sorry, I couldn't reach the AI gateway just now. It might be offline or the request timed out — try again in a moment. " +
  "I can already handle one thing for real though: attach a file below and I'll upload it straight to the EDMS for you.";

const markdownComponents = {
  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
  ul: ({ node, ...props }) => <ul className="mb-2 ps-4" {...props} />,
  ol: ({ node, ...props }) => <ol className="mb-2 ps-4" {...props} />,
  h1: ({ node, ...props }) => <h6 className="fw-semibold mt-1 mb-2" {...props} />,
  h2: ({ node, ...props }) => <h6 className="fw-semibold mt-1 mb-2" {...props} />,
  h3: ({ node, ...props }) => <h6 className="fw-semibold mt-1 mb-2" {...props} />,
  a: ({ node, ...props }) => <a target="_blank" rel="noreferrer" {...props} />,
  code: ({ node, ...props }) => <code className="px-1 rounded bg-white bg-opacity-50" {...props} />,
  pre: ({ node, ...props }) => (
    <pre className="bg-white bg-opacity-50 rounded p-2 mb-2" style={{ overflowX: "auto" }} {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="table-responsive mb-2">
      <table className="table table-sm table-bordered align-middle mb-0" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => <th style={{ backgroundColor: "var(--bs-tertiary-bg, #f8f9fa)" }} {...props} />,
};

const Markdown = ({ content }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
    {content}
  </ReactMarkdown>
);

const TypingIndicator = () => (
  <span className="ai-typing-indicator" role="status" aria-label="Thinking">
    <span />
    <span />
    <span />
  </span>
);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const newSessionId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : uid());

const fmtFileSize = (b) => (b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`);

const fmtRelative = (iso) => {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const Bubble = ({ msg, onNavigateDoc }) => {
  const isUser = msg.role === "user";
  return (
    <div className={isUser ? "message-out" : "message-in"}>
      <div className="d-flex">
        {!isUser && (
          <div className="flex-shrink-0">
            <div
              className="avtar avtar-s rounded-circle d-flex align-items-center justify-content-center"
              style={{ background: "linear-gradient(135deg, #007bff, #3395ff)" }}
            >
              <i className="ti ti-sparkles text-white f-16" />
            </div>
          </div>
        )}
        <div className={`flex-grow-1 ${isUser ? "me-2 text-end" : "ms-2"}`}>
          <div className="chat-msg">
            <div
              className="msg-content d-inline-block text-start"
              // bg-primary/text-white resolve to a transparent background for a plain div in
              // this app's theme (only certain components define --bs-primary-rgb) —
              // white-on-transparent text is invisible, which is why outbound bubbles looked
              // "missing" rather than mis-colored. Hardcoded to the app's own brand teal
              // instead, same as the communication module's MessageBubble.jsx components.
              // The inbound bubble used a literal bg-light (never covered by the vendor's
              // dark-theme CSS outside a .card ancestor), which left markdown text — which
              // has no color of its own — inheriting the dark-mode body/heading color on a
              // background that stayed light regardless of theme.
              style={isUser ? { backgroundColor: "#007bff", color: "#fff" } : { backgroundColor: "var(--bs-card-bg, #fff)" }}
            >
              {msg.attachment && (
                <div
                  className="d-flex align-items-center gap-2 mb-1 pb-1 border-bottom"
                  style={isUser ? { borderColor: "rgba(255,255,255,0.5)" } : undefined}
                >
                  <i className="ti ti-paperclip" />
                  <span className="fw-semibold">{msg.attachment.name}</span>
                  <span className="opacity-75" style={{ fontSize: "0.75rem" }}>
                    {fmtFileSize(msg.attachment.size)}
                  </span>
                </div>
              )}
              {isUser ? (
                <p className="mb-0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {msg.content}
                </p>
              ) : msg.status === "thinking" ? (
                <TypingIndicator />
              ) : (
                <div className="markdown-body" style={{ wordBreak: "break-word" }}>
                  <Markdown content={msg.content} />
                </div>
              )}
              {msg.status === "uploading" && (
                <div className="d-flex align-items-center gap-2 mt-2">
                  <span className="spinner-border spinner-border-sm" />
                  <small>Uploading to EDMS…</small>
                </div>
              )}
              {msg.documentId && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    style={{ fontSize: "0.78rem" }}
                    onClick={() => onNavigateDoc(msg.documentId)}
                  >
                    <i className="ti ti-file-check me-1" />
                    View document
                  </button>
                </div>
              )}
              {msg.documents && msg.documents.length > 0 && (
                <div className="mt-2 d-flex flex-column gap-1">
                  {msg.documents.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="btn btn-sm btn-outline-success text-start"
                      style={{ fontSize: "0.78rem" }}
                      onClick={() => onNavigateDoc(d.id)}
                    >
                      <div>
                        <i className="ti ti-file-check me-1" />
                        <span className="fw-semibold">{d.document_reference}</span> — {d.title}
                      </div>
                      {d.folder_paths?.length > 0 && (
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          <i className="ti ti-folder me-1" />
                          {d.folder_paths.join("; ")}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="mb-0 text-muted mt-1">
            <small>
              {msg.timestamp}
              {!isUser && msg.model && <> · {msg.model}</>}
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};

const ChatInterface = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [stagedFile, setStagedFile] = useState(null);
  const [docTypes, setDocTypes] = useState([]);
  const [docTypeId, setDocTypeId] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [fileId, setFileId] = useState("");
  const [policies, setPolicies] = useState([]);
  const [selectedModel, setSelectedModel] = useState(searchParams.get("model") || DEFAULT_POLICY);
  const [mode, setMode] = useState("chat"); // "chat" (DrioAPI general chat) | "documents" (EDmsAPI retrieval)
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    getDocumentTypes()
      .then((r) => setDocTypes(r?.data?.items || r?.data || []))
      .catch(() => {});
    getFileTree()
      .then((r) => setFiles(r?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getModelPolicies()
      .then((list) => {
        setPolicies(list);
        const requested = searchParams.get("model");
        if (requested && list.some((p) => p.id === requested)) setSelectedModel(requested);
        else if (list.length && !list.some((p) => p.id === selectedModel)) setSelectedModel(list[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePolicy = policies.find((p) => p.id === selectedModel);

  useEffect(() => {
    const el = scrollRef.current?.getScrollElement?.();
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Two independent history stores share this one sidebar: general chat lives in the AI
  // Gateway's own Postgres conversation store (getConversations), while "Ask about documents"
  // has its own EDMS-side store (getAskConversations) since it hits a different backend
  // endpoint entirely. Tag each with where it came from so handleOpenConversation knows which
  // messages endpoint — and which send mode — to use when it's reopened.
  const mergeConversations = ([chatList, askList]) =>
    [
      ...chatList.map((c) => ({ ...c, source: "chat" })),
      ...askList.map((c) => ({ ...c, source: "documents" })),
    ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const loadConversations = () => {
    setLoadingConversations(true);
    Promise.all([getConversations().catch(() => []), getAskConversations().catch(() => [])])
      .then((results) => setConversations(mergeConversations(results)))
      .finally(() => setLoadingConversations(false));
  };

  const refreshConversations = () => {
    Promise.all([getConversations().catch(() => []), getAskConversations().catch(() => [])]).then((results) =>
      setConversations(mergeConversations(results))
    );
  };

  useEffect(() => {
    setSessionId(newSessionId());
    loadConversations();
  }, []);

  const filteredConversations = conversations.filter((c) => {
    const term = historySearch.trim().toLowerCase();
    if (!term) return true;
    return (c.title || "").toLowerCase().includes(term) || (c.preview || "").toLowerCase().includes(term);
  });

  const pushMessage = (msg) => {
    const withDefaults = { id: uid(), timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), ...msg };
    setMessages((prev) => [...prev, withDefaults]);
    return withDefaults.id;
  };

  const updateMessage = (id, patch) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const stageFile = (file) => {
    if (!file) return;
    setStagedFile(file);
    setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
    setDocTypeId(docTypes[0]?.id ? String(docTypes[0].id) : "");
  };

  const clearStagedFile = () => {
    setStagedFile(null);
    setDocTitle("");
    setDocTypeId("");
    setFileId("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleNewChat = () => {
    if (sending || loadingMessages) return;
    setMessages([]);
    setSessionId(newSessionId());
  };

  const handleOpenConversation = async (conversation) => {
    const targetSessionId = conversation.session_id;
    if (sending || loadingMessages || targetSessionId === sessionId) return;
    setLoadingMessages(true);
    try {
      const isDocuments = conversation.source === "documents";
      const data = isDocuments
        ? await getAskConversationMessages(targetSessionId)
        : await getConversationMessages(targetSessionId);
      setMessages(
        data.map((m) => ({
          id: uid(),
          role: m.role,
          content: m.content,
          documents: m.documents || undefined,
          timestamp: m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
        }))
      );
      setSessionId(targetSessionId);
      setMode(isDocuments ? "documents" : "chat");
    } catch {
      toast.error("Couldn't load that conversation.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleUploadSend = async () => {
    if (!docTitle.trim()) { toast.error("Give the document a title first."); return; }
    if (!docTypeId) { toast.error("Pick a document type first."); return; }
    if (!fileId) { toast.error("Pick a file first — every document must be filed somewhere."); return; }

    const file = stagedFile;
    pushMessage({ role: "user", content: input.trim(), attachment: { name: file.name, size: file.size } });
    setInput("");
    clearStagedFile();

    const assistantId = pushMessage({ role: "assistant", content: `Uploading "${docTitle}"…`, status: "uploading" });
    setSending(true);
    try {
      const doc = await createDocument({
        title: docTitle.trim(),
        document_type_id: Number(docTypeId),
        folder_id: Number(fileId),
        confidentiality_level: "INTERNAL",
        source: "API",
        status: "DRAFT",
      });
      const docId = doc?.data?.id;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("version_label", "v1");
      fd.append("change_summary", "Uploaded via AI assistant");
      await uploadVersion(docId, fd);

      updateMessage(assistantId, {
        status: "done",
        content: `Done! I've uploaded "${docTitle}" as ${doc?.data?.document_reference || `document #${docId}`}.`,
        documentId: docId,
      });
      toast.success("Document uploaded to EDMS.");
    } catch (err) {
      updateMessage(assistantId, {
        status: "error",
        content: `Sorry, that upload failed: ${err?.response?.data?.message || "an unexpected error occurred"}.`,
      });
      toast.error("Upload failed.");
    } finally {
      setSending(false);
    }
  };

  const handleChatSend = async () => {
    const text = input.trim();
    if (!text) return;
    pushMessage({ role: "user", content: text });
    setInput("");

    const assistantId = pushMessage({ role: "assistant", content: "", status: "thinking" });
    setSending(true);
    try {
      const res = await sendChatMessage(text, messages, { model: selectedModel, sessionId });
      updateMessage(assistantId, { status: "done", content: res?.reply || FALLBACK_REPLY, model: res?.model });
      refreshConversations();
    } catch (err) {
      const { kind, detail, retryAfterSeconds } = parseGatewayError(err);
      if (kind === "rate_limit") {
        updateMessage(assistantId, { status: "error", content: detail || "Rate limit exceeded — try again shortly." });
        toast.error(retryAfterSeconds ? `Rate limited — try again in ${retryAfterSeconds}s.` : "Rate limited — try again shortly.");
      } else if (kind === "budget_exhausted") {
        updateMessage(assistantId, { status: "error", content: detail || "This organization's AI budget has been used up for the month. Contact your administrator." });
        toast.error("AI budget exhausted for this organization.");
      } else if (kind === "all_exhausted") {
        addErrorLog({ kind, message: "All models in fallback chain exhausted", detail, policy: selectedModel });
        updateMessage(assistantId, {
          status: "error",
          content: "All AI models configured for this policy are currently unavailable (rate-limited, out of credits, or misconfigured). An administrator can review the full error log under AI Administration.",
        });
        toast.error("All AI models unavailable right now.");
      } else {
        if (detail) addErrorLog({ kind, message: "AI gateway request failed", detail, policy: selectedModel });
        updateMessage(assistantId, { status: "error", content: FALLBACK_REPLY });
        toast.error("Couldn't reach the AI gateway.");
      }
    } finally {
      setSending(false);
    }
  };

  // Access-controlled retrieval against EDMS data (Controllers/AiController.cs AskDocuments) —
  // separate from handleChatSend's direct-to-DrioAPI general chat, so retrieval answers are
  // always grounded in the caller's own viewable documents rather than the model's own guesses.
  const handleAskDocuments = async () => {
    const text = input.trim();
    if (!text) return;
    pushMessage({ role: "user", content: text });
    setInput("");

    const assistantId = pushMessage({ role: "assistant", content: "", status: "thinking" });
    setSending(true);
    try {
      const res = await askDocuments(text, sessionId);
      if (res?.success) {
        updateMessage(assistantId, {
          status: "done",
          content: res.data?.answer || "No documents matched your question.",
          documents: res.data?.documents || [],
        });
        refreshConversations();
      } else {
        updateMessage(assistantId, { status: "error", content: res?.message || "Couldn't answer that." });
      }
    } catch (err) {
      updateMessage(assistantId, {
        status: "error",
        content: `Sorry, document search failed: ${err?.response?.data?.message || "an unexpected error occurred"}.`,
      });
      toast.error("Document search failed.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (sending || loadingMessages) return;
    if (stagedFile) handleUploadSend();
    else if (mode === "documents") handleAskDocuments();
    else handleChatSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content">
      <div className="row">
        {/* [ sample-page ] start */}
        <div className="col-sm-12">
          <div className="chat-wrapper">
            <div className="offcanvas-xxl offcanvas-start chat-offcanvas" id="offcanvas_User_list">
              <div className="offcanvas-header">
                <button className="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#offcanvas_User_list" aria-label="Close" />
              </div>
              <div className="offcanvas-body p-0">
                <div id="chat-user_list" className="collapse collapse-horizontal">
                  <div className="chat-user_list">
                    <div className="p-3 pb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1"
                        onClick={handleNewChat}
                        disabled={sending || loadingMessages}
                      >
                        <i className="ti ti-plus" />
                        New chat
                      </button>
                    </div>
                    <div className="px-3 pb-2">
                      <div className="form-search">
                        <i className="ti ti-search" />
                        <input
                          type="search"
                          className="form-control"
                          placeholder="Search history"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="scroll-block pt-1">
                      <SimpleBar style={{ maxHeight: 480 }}>
                        <div className="px-2 pb-2">
                          {loadingConversations ? (
                            <div className="placeholder-glow px-2">
                              {[1, 2, 3].map((i) => (
                                <span key={i} className="placeholder col-12 rounded mb-2" style={{ height: 52, display: "block" }} />
                              ))}
                            </div>
                          ) : filteredConversations.length === 0 ? (
                            <div className="text-center text-muted py-4">
                              <i className="ti ti-message-off" style={{ fontSize: 28, color: "#cbd5e1" }} />
                              <p className="mb-0 mt-2" style={{ fontSize: "0.82rem" }}>
                                {conversations.length === 0 ? "No previous chats yet." : "No chats match your search."}
                              </p>
                            </div>
                          ) : (
                            filteredConversations.map((c) => {
                              const isActive = c.session_id === sessionId;
                              return (
                                <button
                                  key={`${c.source}-${c.session_id}`}
                                  type="button"
                                  className={`btn w-100 text-start border-0 rounded-3 mb-1 px-2 py-2 ${isActive ? "bg-primary bg-opacity-10" : ""}`}
                                  onClick={() => handleOpenConversation(c)}
                                  disabled={sending || loadingMessages}
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      className="avtar avtar-xs rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ background: "linear-gradient(135deg, #007bff, #3395ff)" }}
                                    >
                                      <i
                                        className={`ti ${c.source === "documents" ? "ti-file-search" : "ti-message-2"} text-white`}
                                        style={{ fontSize: "0.8rem" }}
                                      />
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <div className="fw-semibold text-truncate" style={{ fontSize: "0.82rem" }}>
                                        {c.title || "Untitled conversation"}
                                      </div>
                                      {c.preview && (
                                        <div className="text-muted text-truncate" style={{ fontSize: "0.76rem" }}>
                                          {c.preview}
                                        </div>
                                      )}
                                      <small className="text-muted">{fmtRelative(c.updated_at)}</small>
                                    </div>
                                    {isActive && <i className="ti ti-circle-filled text-primary" style={{ fontSize: "0.5rem" }} />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </SimpleBar>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-content">
              <div className="card mb-0">
                <div className="card-header p-3">
                  <div className="d-flex align-items-center">
                    <ul className="list-inline me-auto mb-0">
                      <li className="list-inline-item align-bottom">
                        <a href="#" className="d-xxl-none avtar avtar-s btn-link-secondary" data-bs-toggle="offcanvas" data-bs-target="#offcanvas_User_list">
                          <i className="ti ti-layout-grid f-18" />
                        </a>
                        <a href="#" className="d-none d-xxl-inline-flex avtar avtar-s btn-link-secondary collapsed" data-bs-toggle="collapse" data-bs-target="#chat-user_list" aria-expanded="false">
                          <i className="ti ti-layout-grid f-18" />
                        </a>
                      </li>
                      <li className="list-inline-item">
                        <div className="d-flex align-items-center">
                          <div className="flex-grow-1 mx-3 d-none d-sm-inline-block">
                            <h6 className="mb-0">QBits AI</h6>
                            <span className="text-sm text-muted">Assistant Agent</span>
                          </div>
                        </div>
                      </li>
                    </ul>
                    <ul className="list-inline ms-auto mb-0 d-flex align-items-center">
                      {policies.length > 0 && (
                        <li className="list-inline-item me-2">
                          <select
                            className="form-select form-select-sm"
                            style={{ fontSize: "0.78rem", minWidth: 150 }}
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            disabled={sending}
                            title={activePolicy?.description}
                          >
                            {policies.map((p) => (
                              <option key={p.id} value={p.id}>{p.id}</option>
                            ))}
                          </select>
                        </li>
                      )}
                      <li className="list-inline-item">
                        <a href="#" className="avtar avtar-s btn-link-secondary" title="New chat" onClick={(e) => { e.preventDefault(); handleNewChat(); }}>
                          <i className="ti ti-edit f-18" />
                        </a>
                      </li>
                      <li className="list-inline-item">
                        <a href="#" className="avtar avtar-s btn-link-secondary" title="AI administration" onClick={(e) => { e.preventDefault(); navigate("/ai-assistant/admin"); }}>
                          <i className="ti ti-settings f-18" />
                        </a>
                      </li>
                      <li className="list-inline-item">
                        <a href="#" className="d-xxl-none avtar avtar-s btn-link-secondary" data-bs-toggle="offcanvas" data-bs-target="#offcanvas_User_info">
                          <i className="ti ti-info-circle f-18" />
                        </a>
                        <a href="#" className="d-none d-xxl-inline-flex avtar avtar-s btn-link-secondary" data-bs-toggle="collapse" data-bs-target="#chat-user_info">
                          <i className="ti ti-info-circle f-18" />
                        </a>
                      </li>
                    </ul>
                  </div>
                  {activePolicy?.fallback_chain?.length > 0 && (
                    <div className="mt-1 ps-1">
                      <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                        Primary: {activePolicy.primary_model} · Fallback: {activePolicy.fallback_chain.join(" → ")}
                      </small>
                    </div>
                  )}
                </div>

                <div className="scroll-block chat-message">
                  <SimpleBar ref={scrollRef} style={{ height: "100%" }}>
                    <div className="card-body">
                      {loadingMessages ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
                          <span className="spinner-border text-primary" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div>
                          <h5>Where should we begin?</h5>
                          <p className="text-muted mb-0">
                            {mode === "documents" ? (
                              "Ask me where a document is, or what's in it — e.g. \"where is the signed NDA with Acme\" or \"what's in the March invoice from Acme\"."
                            ) : (
                              <>
                                Ask me anything about the ERP, or click the <i className="ti ti-paperclip mx-1" />
                                below to attach a document — I'll file it straight into the EDMS for you.
                              </>
                            )}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <Bubble key={msg.id} msg={msg} onNavigateDoc={(id) => navigate(`/ed-mgt/documents/${id}`)} />
                        ))
                      )}
                    </div>
                  </SimpleBar>
                </div>

                <div className="card-footer py-2 px-3">
                  {stagedFile && (
                    <div className="border rounded-3 p-2 mb-2">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="ti ti-file text-primary" />
                        <span className="fw-semibold flex-grow-1 text-truncate" style={{ fontSize: "0.85rem" }}>
                          {stagedFile.name}
                        </span>
                        <span className="text-muted" style={{ fontSize: "0.75rem" }}>{fmtFileSize(stagedFile.size)}</span>
                        <button type="button" className="btn btn-link btn-sm text-muted p-0" onClick={clearStagedFile}>
                          <i className="ti ti-x" />
                        </button>
                      </div>
                      <div className="row g-2">
                        <div className="col-md-7">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Document title"
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                          />
                        </div>
                        <div className="col-md-5">
                          <select
                            className="form-select form-select-sm"
                            value={docTypeId}
                            onChange={(e) => setDocTypeId(e.target.value)}
                          >
                            <option value="">Select type…</option>
                            {docTypes.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <FileTreeSelect
                            files={files}
                            value={fileId}
                            onChange={(id) => setFileId(id ? String(id) : "")}
                            placeholder="Select file…"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!stagedFile && (
                    <div className="btn-group btn-group-sm mb-2" role="group" aria-label="Chat mode">
                      <button
                        type="button"
                        className={`btn ${mode === "chat" ? "btn-primary" : "btn-outline-secondary"}`}
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => setMode("chat")}
                        disabled={sending || loadingMessages}
                      >
                        <i className="ti ti-message-2 me-1" />
                        General chat
                      </button>
                      <button
                        type="button"
                        className={`btn ${mode === "documents" ? "btn-primary" : "btn-outline-secondary"}`}
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => setMode("documents")}
                        disabled={sending || loadingMessages}
                        title="Ask where a document is filed, or what's in it"
                      >
                        <i className="ti ti-file-search me-1" />
                        Ask about documents
                      </button>
                    </div>
                  )}

                  <textarea
                    className="form-control border-0 shadow-none"
                    placeholder={
                      stagedFile
                        ? "Add a note (optional)…"
                        : mode === "documents"
                        ? "Ask where a document is, or what's in it…"
                        : "Ask anything, or attach a document to upload it to the EDMS…"
                    }
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending || loadingMessages}
                  />
                  <hr className="my-2" />
                  <div className="d-sm-flex align-items-center">
                    <ul className="list-inline me-auto mb-0">
                      <li className="list-inline-item">
                        <a
                          href="#"
                          className="avtar avtar-xs btn-link-secondary"
                          title="Attach a document to upload to EDMS"
                          onClick={(e) => { e.preventDefault(); if (!sending && !loadingMessages) fileRef.current?.click(); }}
                        >
                          <i className="ti ti-paperclip f-18" />
                        </a>
                      </li>
                    </ul>
                    <input
                      ref={fileRef}
                      type="file"
                      className="d-none"
                      onChange={(e) => stageFile(e.target.files?.[0])}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                    <ul className="list-inline ms-auto mb-0">
                      <li className="list-inline-item">
                        <a
                          href="#"
                          className="avtar avtar-s btn-link-primary"
                          onClick={(e) => { e.preventDefault(); handleSend(); }}
                        >
                          {sending ? <span className="spinner-border spinner-border-sm" /> : <i className="ti ti-send f-18" />}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="offcanvas-xxl offcanvas-end chat-offcanvas" tabIndex={-1} id="offcanvas_User_info">
              <div className="offcanvas-header">
                <button className="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#offcanvas_User_info" aria-label="Close" />
              </div>
              <div className="offcanvas-body p-0">
                <div id="chat-user_info" className="collapse collapse-horizontal">
                  <div className="chat-user_info">
                    <div className="card">
                      <div className="text-center card-body position-relative pb-0">
                        <h5 className="text-start">QBits AI Agent : Overview</h5>
                        <div className="position-absolute end-0 top-0 p-3 d-none d-xxl-inline-flex">
                          <a href="#" className="avtar avtar-xs btn-link-danger btn-pc-default" data-bs-toggle="collapse" data-bs-target="#chat-user_info">
                            <i className="ti ti-x f-16" />
                          </a>
                        </div>
                      </div>
                      <div className="p-4">
                        <p>QBits AI Agent is the intelligent automation engine embedded in QBits ERP, designed to streamline operations, enhance decision-making, and reduce manual workload across all modules of the system. It acts as a proactive digital assistant that understands user actions, analyses business data in real time, and performs tasks automatically based on rules, patterns, or direct instructions.</p>
                        <ul>
                          <li>Smart Automation</li>
                          <li>Predictive Intelligence</li>
                          <li>Natural Language Interaction</li>
                          <li>Cross-Module Intelligence</li>
                          <li>Document Upload to EDMS — attach a file in the chat and it's filed for you</li>
                        </ul>
                        <hr />
                        <b>The autonomous brain of QBits ERP : A system that not only processes data, but also understands your business, anticipates problems, and executes solutions automatically.</b>
                        <br />
                        <br />
                        <small>Version 1.0</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* [ sample-page ] end */}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatInterface;
