import React, { useEffect, useState } from "react";
import RoutingTargetPicker from "./RoutingTargetPicker";
import { userLabelFor } from "../../communication/components/UserSelect";
import RoutingConfirmModal from "./RoutingConfirmModal";
import { toast } from "../components/EDMSToast";
import { delegateFileRouting } from "../../../api/fileRoutingApi";
import { getDocumentDigitHolder } from "../../../api/hrApi";

/**
 * The Action Officer hands the letters they hold to one or several other Action Officers (or a role) to act on -
 * for HR letters, the digit holder for the personnel number is offered. Each delegate answers the guide written
 * here with their own letters and finishes on their own; the letter returns to the Registry when the last one is done.
 *   routingId    the file routing
 *   letters      [{ id, title }] the letters the caller holds
 *   suggestFor   a letter id to look up the HR digit holder for
 *   onDone       called after a successful delegation
 */
const DelegatePanel = ({ routingId, letters, suggestFor, onDone }) => {
  const [kind, setKind] = useState("user");
  const [userId, setUserId] = useState(null);
  const [people, setPeople] = useState([]);   // [{ id, label }] the people added so far
  const [roleId, setRoleId] = useState("");
  const [comment, setComment] = useState("");
  const [picked, setPicked] = useState({});   // letter id -> bool; none picked = all of them
  const [holder, setHolder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [targetLabel, setTargetLabel] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!suggestFor) return undefined;
    let cancelled = false;
    getDocumentDigitHolder(suggestFor)
      .then((r) => { if (!cancelled) setHolder(r?.data ?? r ?? null); })
      .catch(() => { if (!cancelled) setHolder(null); });
    return () => { cancelled = true; };
  }, [suggestFor]);

  const chosen = letters.filter((l) => picked[l.id]).map((l) => l.id);
  const addPerson = (id) => {
    if (id == null || id === "") return;
    setPeople((list) => (list.some((p) => String(p.id) === String(id)) ? list
      : [...list, { id: Number(id), label: userLabelFor(id) || `user #${id}` }]));
    setUserId(null);
  };
  // The person still sitting in the picker counts too, so one person needs no "Add".
  const userIds = kind === "user"
    ? [...people.map((p) => p.id), ...(userId != null && userId !== "" && !people.some((p) => String(p.id) === String(userId)) ? [Number(userId)] : [])]
    : [];
  const hasTarget = kind === "user" ? userIds.length > 0 : roleId !== "";

  const askToDelegate = () => {
    if (!hasTarget) { toast.error("Choose who to delegate to."); return; }
    setConfirming(true);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await delegateFileRouting(routingId, {
        to_user_ids: kind === "user" ? userIds : null,
        to_role_id: kind === "role" ? Number(roleId) : null,
        comment: comment.trim() || null,
        document_ids: chosen,
      });
      toast.success(userIds.length > 1 ? "Delegated. Each of them replies on their own; it returns to the Registry when the last one is done."
        : "Delegated. They will return it to the Registry when they are done.");
      setComment(""); setPicked({}); setPeople([]); setUserId(null);
      onDone?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not delegate.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div className="border rounded-3 p-3 mb-3">
      <div className="fw-semibold mb-1"><i className="ti ti-users me-1 text-primary"></i>Delegate</div>
      <div className="text-muted small mb-2">The people you choose act on the letter, answer your guide with their own letters, and it goes back to the Registry once all of them are done. You keep the history.</div>

      {holder?.user_id && (
        <div className="alert alert-info py-2 small d-flex align-items-center justify-content-between gap-2">
          <span><i className="ti ti-id-badge-2 me-1"></i>Digit holder for this HR letter: <strong>{holder.user_name || holder.full_name || holder.name || `user #${holder.user_id}`}</strong></span>
          <button type="button" className="btn btn-sm btn-outline-primary"
                  onClick={() => { setKind("user"); addPerson(holder.user_id); }}>Use</button>
        </div>
      )}

      <RoutingTargetPicker
        label="Delegate to"
        kind={kind} onKind={setKind} userId={userId} onUser={setUserId} roleId={roleId} onRole={setRoleId}
        onLabel={setTargetLabel}
      />

      {kind === "user" && (
        <div className="mb-3">
          <button type="button" className="btn btn-outline-primary btn-sm" disabled={userId == null || userId === ""}
                  onClick={() => addPerson(userId)}>
            <i className="ti ti-user-plus me-1"></i>Add another Action Officer
          </button>
          {people.map((p) => (
            <span key={p.id} className="badge bg-primary-subtle text-primary ms-2">
              {p.label}
              <button type="button" className="btn-close btn-close-sm ms-1" style={{ fontSize: "0.5rem" }} aria-label="Remove"
                      onClick={() => setPeople((list) => list.filter((x) => x.id !== p.id))}></button>
            </span>
          ))}
        </div>
      )}

      {letters.length > 1 && (
        <div className="mb-2">
          <div className="small fw-semibold mb-1">Which letters <span className="text-muted fw-normal">(none ticked = all you hold)</span></div>
          {letters.map((l) => (
            <div className="form-check" key={l.id}>
              <input className="form-check-input" type="checkbox" id={`dl-${l.id}`} checked={!!picked[l.id]}
                     onChange={(e) => setPicked((p) => ({ ...p, [l.id]: e.target.checked }))} />
              <label className="form-check-label small" htmlFor={`dl-${l.id}`}>{l.title}</label>
            </div>
          ))}
        </div>
      )}

      <textarea className="form-control form-control-sm mb-2" rows={2} maxLength={2000} value={comment}
                placeholder="What you want them to do (written on the letter)" onChange={(e) => setComment(e.target.value)} />
      <button type="button" className="btn btn-primary btn-sm" disabled={busy || !hasTarget} onClick={askToDelegate}>
        {busy ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="ti ti-share-3 me-1"></i>}
        Delegate{chosen.length > 0 ? ` ${chosen.length} letter${chosen.length === 1 ? "" : "s"}` : ""}
      </button>

      <RoutingConfirmModal
        show={confirming}
        title="Delegate these letters?"
        destination={kind === "user" && userIds.length > 0
          ? userIds.map((u) => people.find((p) => p.id === u)?.label || userLabelFor(u) || `user #${u}`).join(", ")
          : targetLabel || (kind === "role" ? "The chosen role" : "The chosen person")}
        destinationNote={kind === "role" ? "Anyone who holds this role can pick it up."
          : userIds.length > 1 ? "Each of them acts and replies on their own. It goes back to the Registry when the last one has finished."
          : "They will act on it and send it back to the Registry."}
        letters={(chosen.length ? letters.filter((l) => chosen.includes(l.id)) : letters).map((l) => ({ id: l.id, title: l.title }))}
        confirmLabel="Yes, delegate"
        busy={busy}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
};

export default DelegatePanel;
