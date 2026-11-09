import React, { useState } from "react";
import UserSelect from "../components/UserSelect";
import { sendMessage } from "../../../api/messagesApi";

/**
 * Compose and send an in-app message to another user, with a guaranteed
 * email fallback handled entirely server-side. `relatedEntity*` props let a
 * caller (e.g. a document page) pre-fill a message that's "about" something
 * specific — the recipient gets a deep link back to it, in both the in-app
 * message and the fallback email.
 */
const ComposeMessageModal = ({
  onClose,
  onSent,
  defaultSubject = "",
  defaultBody = "",
  relatedEntityType,
  relatedEntityId,
  relatedEntityLink,
}) => {
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")?.user_id;
  const [recipientIds, setRecipientIds] = useState([]);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (recipientIds.length === 0) { setError("Please select who to send this to."); return; }
    if (!body.trim()) { setError("Message is required."); return; }

    setError("");
    setSending(true);
    try {
      const res = await sendMessage({
        recipient_user_ids: recipientIds.map(Number),
        subject: subject.trim() || undefined,
        body: body.trim(),
        related_entity_type: relatedEntityType || undefined,
        related_entity_id: relatedEntityId || undefined,
        related_entity_link: relatedEntityLink || undefined,
      });
      onSent?.(res);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">
            <form onSubmit={handleSend}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title">
                  <i className="ti ti-send me-2 text-primary" />
                  New Message
                </h5>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
              </div>

              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show py-2" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                  </div>
                )}

                {relatedEntityType && (
                  <div className="alert alert-light border d-flex align-items-center gap-2 py-2 mb-3">
                    <i className="ti ti-link"></i>
                    <small>This message will link to the {relatedEntityType.toLowerCase()} you came from.</small>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">To</label>
                  <UserSelect
                    isMulti
                    value={recipientIds}
                    onChange={setRecipientIds}
                    placeholder="Search and select one or more people…"
                    excludeIds={currentUserId ? [currentUserId] : []}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Subject <span className="text-muted fw-normal">(optional — names a group)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Please send me the signed contract"
                  />
                </div>

                <div className="mb-1">
                  <label className="form-label fw-semibold">Message</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message…"
                  />
                </div>
                <div className="form-text">Pick one person to start a chat (or continue the one you already have), or several to start a group. Everyone also gets an email. You can add more people later.</div>
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-send me-1" />}
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComposeMessageModal;
