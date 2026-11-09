import React, { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import UserSelect, { userLabelFor } from "../../communication/components/UserSelect";
import { toast } from "../components/EDMSToast";

// A role is a Marking / Action Officer role when its landing page is that officer's dashboard, or -
// when no landing page is set - its routing role code says so (same rule IAmAPI uses to resolve it).
const ROUTING_ROLES = {
  MARKING_OFFICER: { landing: "marking-officer", label: "Marking Officer" },
  ACTION_OFFICER: { landing: "action-officer", label: "Action Officer" },
};

const matchesRoutingRole = (role, code) => {
  const def = ROUTING_ROLES[code];
  if (!def) return false;
  if (role.landing_page_key) return role.landing_page_key === def.landing;
  return role.routing_role_code === code;
};

/**
 * Who a routing step goes to: a person (searchable list of users, with their role/title) or a
 * role / queue. The same picker the single-document routing uses, shared so file routing picks
 * its officers exactly the same way.
 *
 *   kind / onKind      "user" | "role"
 *   userId / onUser    the chosen person
 *   roleId / onRole    the chosen role ("" = none)
 *   label              field label
 *   optional           when true, leaving it blank is allowed (hint explains what blank means)
 *   hint               small text under the field
 *   routingRole        "MARKING_OFFICER" | "ACTION_OFFICER": offer only the people and roles that carry
 *                      that officer's landing page, so the list is short. If no role is set up that
 *                      way, everyone is shown and a note says so.
 */
const RoutingTargetPicker = ({
  kind, onKind, userId, onUser, roleId, onRole, label = "Send to", optional = false, hint, routingRole = null, onLabel,
}) => {
  const [roles, setRoles] = useState([]);
  const [peopleCount, setPeopleCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiClient.get("/IAmAPI/api/roles")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.roles || res.data?.data || [];
        if (!cancelled) setRoles(list);
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load roles."); });
    return () => { cancelled = true; };
  }, []);

  // Tell the parent the chosen person's / role's name (for the "are you sure" confirmation).
  useEffect(() => {
    if (!onLabel) return;
    onLabel(kind === "user"
      ? (userId != null && userId !== "" ? userLabelFor(userId) : null)
      : (roleId ? roles.find((r) => String(r.id) === String(roleId))?.name || null : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, userId, roleId, roles]);

  const officerRoles = routingRole ? roles.filter((r) => matchesRoutingRole(r, routingRole)) : [];
  const restricted = !!routingRole && officerRoles.length > 0;
  const officerLabel = ROUTING_ROLES[routingRole]?.label;

  return (
    <div className="mb-3">
      <label className="form-label fw-semibold small">
        {label}{!optional && <span className="text-danger"> *</span>}
      </label>
      <div className="d-flex gap-3 mb-2">
        <label className="small"><input type="radio" className="form-check-input me-1"
          checked={kind === "user"} onChange={() => onKind("user")} />Person</label>
        <label className="small"><input type="radio" className="form-check-input me-1"
          checked={kind === "role"} onChange={() => onKind("role")} />Role / queue</label>
      </div>
      {kind === "user" ? (
        <UserSelect value={userId} onChange={onUser} roleIds={restricted ? officerRoles.map((r) => r.id) : null} onCount={setPeopleCount}
                    placeholder={restricted ? `Search ${officerLabel}s…` : undefined} />
      ) : (
        <select className="form-select" value={roleId} onChange={(e) => onRole(e.target.value)}>
          <option value="">Select a role…</option>
          {(restricted ? officerRoles : roles).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      )}
      {restricted && kind === "user" && peopleCount === 0 && (
        <div className="form-text text-danger">
          No user is assigned to a role with the {officerLabel} landing page. Assign users on the Users screen, or pick a Role / queue instead.
        </div>
      )}
      {routingRole && roles.length > 0 && !restricted && (
        <div className="form-text text-warning">No role is set up with the {officerLabel} landing page, so everyone is listed.</div>
      )}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
};

export default RoutingTargetPicker;
