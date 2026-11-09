import React, { useState } from "react";
import UserSelect from "../../components/UserSelect";
import { addConversationParticipants } from "../../../../api/messagesApi";

/**
 * Loops more people into an open conversation. They can read the earlier
 * messages and are emailed; if the conversation was 1:1 it becomes a group.
 * `participants` are the people already in it (hidden from the picker).
 */
export default function AddParticipantsModal({ conversationId, participants, isGroup, onClose, onAdded }) {
  const [userIds, setUserIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userIds.length === 0) { setError("Select at least one person to add."); return; }

    setError("");
    setSaving(true);
    try {
      const updated = await addConversationParticipants(conversationId, userIds.map(Number));
      onAdded?.(updated);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add people.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <form onSubmit={handleSubmit}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title">
                  <i className="ti ti-user-plus me-2 text-primary" />
                  Add people
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

                <UserSelect
                  isMulti
                  value={userIds}
                  onChange={setUserIds}
                  placeholder="Search and select people to add…"
                  excludeIds={participants.map((p) => p.user_id)}
                />
                <div className="form-text">
                  They'll be able to read the earlier messages in this conversation, and they'll get an email.
                  {!isGroup && " This chat will become a group conversation."}
                </div>
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-user-plus me-1" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
