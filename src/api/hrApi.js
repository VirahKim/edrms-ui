import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/hr-records";

// ── personnel files ──
export const listPersonnelFiles = (params = {}) =>
  apiClient.get(`${BASE}/personnel-files`, { params }).then((r) => r.data);
export const createPersonnelFile = (body) =>
  apiClient.post(`${BASE}/personnel-files`, body).then((r) => r.data);
export const getPersonnelFile = (id) =>
  apiClient.get(`${BASE}/personnel-files/${id}`).then((r) => r.data);
export const linkPersonnelDocument = (id, documentId) =>
  apiClient.post(`${BASE}/personnel-files/${id}/documents`, { document_id: documentId }).then((r) => r.data);
export const requestPersonnelClosure = (id, body) =>
  apiClient.post(`${BASE}/personnel-files/${id}/closure-request`, body).then((r) => r.data);

// ── digit holders ──
export const listDigitHolders = () =>
  apiClient.get(`${BASE}/digit-holders`).then((r) => r.data);
export const setDigitHolder = (digit, userId) =>
  apiClient.put(`${BASE}/digit-holders/${digit}`, { user_id: userId }).then((r) => r.data);
export const getDocumentDigitHolder = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/digit-holder`).then((r) => r.data);

// ── incoming register ──
export const recordHrIncoming = (body) =>
  apiClient.post(`${BASE}/incoming`, body).then((r) => r.data);
export const listHrIncoming = (params = {}) =>
  apiClient.get(`${BASE}/incoming`, { params }).then((r) => r.data);

// ── requisitions ──
export const createRequisition = (body) =>
  apiClient.post(`${BASE}/requisitions`, body).then((r) => r.data);
export const listRequisitions = (status) =>
  apiClient.get(`${BASE}/requisitions`, { params: status ? { status } : {} }).then((r) => r.data);
export const verifyRequisition = (id, body) =>
  apiClient.post(`${BASE}/requisitions/${id}/verify`, body).then((r) => r.data);
export const issueRequisition = (id) =>
  apiClient.post(`${BASE}/requisitions/${id}/issue`).then((r) => r.data);

// ── missing files, search log, TY ──
export const reportMissing = (body) =>
  apiClient.post(`${BASE}/missing-files`, body).then((r) => r.data);
export const listMissing = (openOnly = false) =>
  apiClient.get(`${BASE}/missing-files`, { params: { openOnly } }).then((r) => r.data);
export const addMissingSearch = (id, body) =>
  apiClient.post(`${BASE}/missing-files/${id}/searches`, body).then((r) => r.data);
export const escalateMissing = (id) =>
  apiClient.post(`${BASE}/missing-files/${id}/escalate`).then((r) => r.data);
export const resolveMissingFound = (id) =>
  apiClient.post(`${BASE}/missing-files/${id}/found`).then((r) => r.data);
export const reconstructMissing = (id, body) =>
  apiClient.post(`${BASE}/missing-files/${id}/reconstruct`, body).then((r) => r.data);
export const requestTemporaryFile = (body) =>
  apiClient.post(`${BASE}/temporary-files`, body).then((r) => r.data);
export const listTemporaryFiles = () =>
  apiClient.get(`${BASE}/temporary-files`).then((r) => r.data);

// ── transfers ──
export const authorizeTransferOut = (body) =>
  apiClient.post(`${BASE}/transfers-out`, body).then((r) => r.data);
export const listTransfersOut = () =>
  apiClient.get(`${BASE}/transfers-out`).then((r) => r.data);
export const dispatchTransferOut = (id, body) =>
  apiClient.post(`${BASE}/transfers-out/${id}/dispatch`, body).then((r) => r.data);
export const acknowledgeTransferOut = (id, body) =>
  apiClient.post(`${BASE}/transfers-out/${id}/acknowledge`, body).then((r) => r.data);
export const registerTransferIn = (body) =>
  apiClient.post(`${BASE}/transfers-in`, body).then((r) => r.data);
export const listTransfersIn = () =>
  apiClient.get(`${BASE}/transfers-in`).then((r) => r.data);
export const acknowledgeTransferIn = (id) =>
  apiClient.post(`${BASE}/transfers-in/${id}/acknowledge`).then((r) => r.data);

// ── HR Records Officer dashboard ──
export const getHrDashboard = () =>
  apiClient.get(`${BASE}/dashboard`).then((r) => r.data);
