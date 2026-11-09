import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/access-requests";

// Find a letter or file by subject / reference without seeing its contents.
export const searchCatalog = (q) => apiClient.get(`${BASE}/catalog`, { params: { q } }).then((r) => r.data);

// mine = true: my requests. mine = false (Registry Officer): everyone's.
export const listAccessRequests = ({ mine = true, status } = {}) =>
  apiClient.get(BASE, { params: { mine, status } }).then((r) => r.data);

// body: { document_id | folder_id, reason, file_routing_id? }
export const createAccessRequest = (body) => apiClient.post(BASE, body).then((r) => r.data);

// Registry Officer: body { grant, note, valid_days }
export const decideAccessRequest = (id, body) => apiClient.post(`${BASE}/${id}/decide`, body).then((r) => r.data);

export const cancelAccessRequest = (id) => apiClient.post(`${BASE}/${id}/cancel`).then((r) => r.data);
