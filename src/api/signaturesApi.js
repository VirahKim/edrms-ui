import apiClient from "./apiClient";

const BASE = "/IAmAPI/api";

// One active signature per user — owned entirely by UsersAuthAPI.
// WorkflowsAPI never stores the image, only a signature_id reference.

export const getUserSignature = (userId) =>
  apiClient.get(`${BASE}/users/${userId}/signature`).then((r) => r.data);

export const uploadUserSignature = (userId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient
    .post(`${BASE}/users/${userId}/signature`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const deleteUserSignature = (userId) =>
  apiClient.delete(`${BASE}/users/${userId}/signature`).then((r) => r.data);

export const getSignatureById = (signatureId) =>
  apiClient.get(`${BASE}/signatures/${signatureId}`).then((r) => r.data);
