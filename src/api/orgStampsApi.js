import apiClient from "./apiClient";

const BASE = "/EDMSApi/api";

// Digital "stamps" — the traditional round/rectangular office stamp, owned by
// an org unit (e.g. "Records Office") rather than a single user. Distinct
// from signaturesApi.js, which manages a personal e-signature (one per user).
// Applying a stamp to a document lives under documents (see applyStamp /
// getDocumentStampApplications), mirroring where signDocument lives in
// edmsApi.js.

export const listOrgStamps = (params) =>
  apiClient.get(`${BASE}/org-stamps`, { params }).then((r) => r.data);

export const getOrgStamp = (id) =>
  apiClient.get(`${BASE}/org-stamps/${id}`).then((r) => r.data);

export const createOrgStamp = (orgUnitId, name, description, file) => {
  const formData = new FormData();
  formData.append("org_unit_id", orgUnitId);
  formData.append("name", name);
  if (description) formData.append("description", description);
  formData.append("image", file);
  return apiClient
    .post(`${BASE}/org-stamps`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const updateOrgStamp = (id, { name, description, is_active, file } = {}) => {
  const formData = new FormData();
  if (name !== undefined) formData.append("name", name);
  if (description !== undefined) formData.append("description", description);
  if (is_active !== undefined) formData.append("is_active", is_active);
  if (file) formData.append("image", file);
  return apiClient
    .put(`${BASE}/org-stamps/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deactivateOrgStamp = (id) =>
  apiClient.delete(`${BASE}/org-stamps/${id}`).then((r) => r.data);

export const getStampAuthorizedUsers = (id) =>
  apiClient.get(`${BASE}/org-stamps/${id}/authorized-users`).then((r) => r.data);

export const addStampAuthorizedUser = (id, userId) =>
  apiClient.post(`${BASE}/org-stamps/${id}/authorized-users`, { user_id: userId }).then((r) => r.data);

export const removeStampAuthorizedUser = (id, userId) =>
  apiClient.delete(`${BASE}/org-stamps/${id}/authorized-users/${userId}`).then((r) => r.data);

// Flattens an org stamp's image onto a normalized position of one page of the
// document's current version, landing the result as a brand-new version.
// body: { stamp_id, page_number, pos_x, pos_y, width, height, workflow_instance_id?, workflow_step_approver_id? }
export const applyStamp = (documentId, body) =>
  apiClient.post(`${BASE}/documents/${documentId}/apply-stamp`, body).then((r) => r.data);

export const getDocumentStampApplications = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/stamp-applications`).then((r) => r.data);
