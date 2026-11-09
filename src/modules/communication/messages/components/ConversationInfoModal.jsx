import React, { useState } from "react";
import { removeConversationParticipant, renameConversation } from "../../../../api/messagesApi";

/**
 * Details of an open conversation: its members, and — for a group — renaming
 * it, removing people, and leaving. `onChanged` fires after a rename or a
 * removal so the caller can refresh; `onLeft` after the current user leaves.
 */
export default function ConversationInfoModal({
  conversation,
  currentUserId,
  onClose,
  onAddPeople,
  onChanged,
  onLeft,
}) {
  const isGroup = !!conversation.is_group;
  const participants = conversation.participants || [];
  const canRemove = isGroup && participants.length > 2;

  const [name, setName] = useState(conversation.topic || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action, onDone) => {
    setError("");
    setBusy(true);
    try {
      await action();
      await onDone();
    } catch (err) {
      setError(err?.response?.data?.message || "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (name.trim() === (conversation.topic || "")) return;
    run(() => renameConversation(conversation.id, name.trim()), () => onChanged?.());
  };

  const handleRemove = (p) => {
    const isSelf = Number(p.user_id) === Number(currentUserId);
    const label = isSelf ? "Leave this conversation? You won't be able to see it any more." : `Remove ${p.name || "this person"} from the conversation?`;
    if (!window.confirm(label)) return;
    run(
      () => removeConversationParticipant(conversation.id, p.user_id),
      () => (isSelf ? onLeft?.() : onChanged?.())
    );
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClose} />
      <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title">
                <i className={`ti ${isGroup ? "ti-users" : "ti-user"} me-2 text-primary`} />
                {isGroup ? "Group details" : "Conversation details"}
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

              {isGroup && (
                <form onSubmit={handleRename} className="mb-4">
                  <label className="form-label fw-semibold">Name</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      maxLength={300}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Unnamed — shown by its members"
                    />
                    <button
                      type="submit"
                      className="btn btn-outline-primary"
                      disabled={busy || name.trim() === (conversation.topic || "")}
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">{participants.length} people</label>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={onAddPeople} disabled={busy}>
                  <i className="ti ti-user-plus me-1"></i>Add people
                </button>
              </div>

              <ul className="list-group">
                {participants.map((p) => {
                  const isSelf = Number(p.user_id) === Number(currentUserId);
                  return (
                    <li key={p.user_id} className="list-group-item d-flex align-items-center justify-content-between">
                      <span className="text-truncate">
                        {p.name || `User #${p.user_id}`}
                        {isSelf && <span className="text-muted ms-1">(you)</span>}
                      </span>
                      {canRemove && !isSelf && (
                        <button
                          type="button"
                          className="btn btn-sm btn-light text-danger"
                          title="Remove from conversation"
                          disabled={busy}
                          onClick={() => handleRemove(p)}
                        >
                          <i className="ti ti-user-minus"></i>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {isGroup && !canRemove && (
                <div className="form-text">A conversation needs at least two people, so no one can be removed.</div>
              )}
            </div>

            <div className="modal-footer border-top d-flex justify-content-between">
              {canRemove ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={busy}
                  onClick={() => handleRemove({ user_id: currentUserId })}
                >
                  <i className="ti ti-logout me-1"></i>Leave conversation
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
