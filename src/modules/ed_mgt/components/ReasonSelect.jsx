import React, { useEffect, useState } from "react";
import { listReasonCodes } from "../../../api/recordsApi";

/**
 * A reason picked from a list of reason codes instead of typed. `context` is FILE_OPEN, FILE_CLOSE,
 * FILE_DISPOSE or BRING_UP; `value` and `onChange` carry the reason code. The list is kept in
 * Ref.ReasonCodes on the server.
 */
const ReasonSelect = ({ context, value, onChange, className = "form-select form-select-sm", disabled = false }) => {
  const [reasons, setReasons] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReasons(null);
    setFailed(false);
    listReasonCodes(context)
      .then((r) => { if (!cancelled) setReasons(Array.isArray(r?.data) ? r.data : []); })
      .catch(() => { if (!cancelled) { setReasons([]); setFailed(true); } });
    return () => { cancelled = true; };
  }, [context]);

  // A code that is not on the new list (the request type changed) is dropped.
  useEffect(() => {
    if (reasons && value && !reasons.some((x) => x.code === value)) onChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reasons]);

  return (
    <>
      <select className={className} value={value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled || reasons === null}>
        <option value="">{reasons === null ? "Loading reasons…" : "Select a reason…"}</option>
        {(reasons || []).map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
      </select>
      {failed && <div className="form-text text-danger">The list of reasons could not be loaded. Run add_reason_codes.sql and restart the API.</div>}
    </>
  );
};

export default ReasonSelect;
