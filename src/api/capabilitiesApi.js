import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/capabilities";

// The catalogue of what a role may do, and which role holds what: { capabilities: [...], grants: [{ role_id, codes }] }.
export const getCapabilities = () =>
  apiClient.get(BASE).then((r) => r.data);

// What the signed-in user's own role may do, as a list of codes (e.g. "FILE_EDIT").
export const getMyCapabilities = () =>
  apiClient.get(`${BASE}/mine`).then((r) => r.data);

// Makes the role hold exactly these capabilities. Administrators only.
export const setRoleCapabilities = (roleId, codes) =>
  apiClient.put(`${BASE}/roles/${roleId}`, { codes }).then((r) => r.data);
