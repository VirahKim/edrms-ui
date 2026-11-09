import React, { useEffect, useState } from "react";
import { getUserSignature, uploadUserSignature } from "../../../api/signaturesApi";
import SignaturePad from "../../identity_n_authentication/user_management/users/SignaturePad";

const currentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.id ?? u?.user_id;
  } catch { return undefined; }
};

/**
 * Every comment and sticky note goes out signed. This loads the writer's saved signature first; when there is
 * none (or they choose to sign again) it gives a space to sign - mouse, finger or pen - and saves it as their
 * signature. It tells the parent whether a signature is ready (onSigned), so nothing is sent without one.
 */
const NoteSignature = ({ signed, onSigned }) => {
  const [state, setState] = useState("loading");   // loading | have | draw
  const [signature, setSignature] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getUserSignature(currentUserId())
      .then((sig) => { if (!cancelled) { setSignature(sig); setState(sig?.public_url ? "have" : "draw"); } })
      .catch(() => { if (!cancelled) setState("draw"); });
    return () => { cancelled = true; };
  }, []);

  const ready = state === "have";
  useEffect(() => {
    if (signed !== ready) onSigned(ready);
  }, [ready, signed, onSigned]);

  const save = async (file) => {
    setSaving(true);
    setError("");
    try {
      const sig = await uploadUserSignature(currentUserId(), file);
      setSignature(sig);
      setState("have");
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || "Your signature could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-3 p-2 mb-2 bg-light">
      <div className="small fw-semibold mb-1"><i className="ti ti-signature me-1"></i>Your signature <span className="text-danger">*</span></div>
      {state === "loading" && <div className="text-muted small"><span className="spinner-border spinner-border-sm me-2" />Loading your saved signature…</div>}
      {state === "have" && (
        <div className="d-flex align-items-center gap-3">
          <img src={signature.public_url} alt="Your signature" style={{ maxHeight: 56, maxWidth: 200, background: "#fff", border: "1px solid #dee2e6", borderRadius: 4, padding: 2 }} />
          <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setState("draw")}>Sign again</button>
          <span className="text-muted small">Goes under your comment with the date and time.</span>
        </div>
      )}
      {state === "draw" && (
        <>
          <div className="text-muted small mb-1">
            {signature ? "Sign in the box below to replace your saved signature." : "You have no saved signature yet. Sign in the box below (with your finger, pen or mouse) - it is kept for next time."}
          </div>
          <SignaturePad onSave={save} saving={saving} height={110} />
          {signature && <button type="button" className="btn btn-sm btn-link p-0 mt-1" onClick={() => setState("have")}>Keep my saved signature</button>}
        </>
      )}
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
};

export default NoteSignature;
