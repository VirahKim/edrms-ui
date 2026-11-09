import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/file-records";

// ── file requests: opening, closing, disposal (approved in WorkflowsAPI) ──
export const submitFileRequest = (body) =>
  apiClient.post(`${BASE}/requests`, body).then((r) => r.data);

// The reasons an officer picks from: context is FILE_OPEN, FILE_CLOSE, FILE_DISPOSE or BRING_UP.
export const listReasonCodes = (context) =>
  apiClient.get(`${BASE}/reason-codes`, { params: { context } }).then((r) => r.data);

// Approved "open a new file" requests that have not made their file yet - New File picks one of these.
export const listAvailableOpenRequests = () =>
  apiClient.get(`${BASE}/requests/available-to-open`).then((r) => r.data);

// True for a Registry Officer / super admin: an ordinary file is opened straight away, with no approved request.
export const canOpenFileDirectly = () =>
  apiClient.get(`${BASE}/can-open-directly`).then((r) => r.data?.data?.can_open_directly === true);

// Approved temporary-file (TY) requests that have not made their file yet - New File picks one of these for a temporary file.
export const listAvailableTemporaryFiles = () =>
  apiClient.get(`${BASE}/temporary-files/available-to-open`).then((r) => r.data);

export const listFileRequests = (status) =>
  apiClient.get(`${BASE}/requests`, { params: status ? { status } : {} }).then((r) => r.data);

export const cancelFileRequest = (id) =>
  apiClient.post(`${BASE}/requests/${id}/cancel`).then((r) => r.data);

// ── files and their state ──
export const listFiles = (status) =>
  apiClient.get(`${BASE}/files`, { params: status ? { status } : {} }).then((r) => r.data);

// ── retention of files (rules are set on the Retention Rules page) ──
// Files whose retention period has passed, and what can be raised for each.
export const listRetentionDue = () =>
  apiClient.get(`${BASE}/retention/due`).then((r) => r.data);

// Raises the closing / disposal requests for those files (all, or the folder ids given).
export const runRetentionCheck = (folderIds) =>
  apiClient.post(`${BASE}/retention/run`, { folder_ids: folderIds?.length ? folderIds : null }).then((r) => r.data);

// ── file registers: OPENING | CLOSING | DISPOSAL ──
export const listFileRegister = (register, year) =>
  apiClient.get(`${BASE}/registers/${register}`, { params: year ? { year } : {} }).then((r) => r.data);

export const downloadFileRegisterExcel = (register, year) =>
  downloadBlob(`${BASE}/registers/${register}/export`, { year }, `file-${register.toLowerCase()}-register.xlsx`);

// ── statistics ──
export const getRecordsStatistics = (year) =>
  apiClient.get(`${BASE}/statistics`, { params: year ? { year } : {} }).then((r) => r.data);

// ── census (Table 4) ──
export const createCensus = (body) =>
  apiClient.post(`${BASE}/census`, body).then((r) => r.data);

export const listCensus = () =>
  apiClient.get(`${BASE}/census`).then((r) => r.data);

export const getCensus = (id) =>
  apiClient.get(`${BASE}/census/${id}`).then((r) => r.data);

export const checkCensusEntry = (sessionId, entryId, body) =>
  apiClient.post(`${BASE}/census/${sessionId}/entries/${entryId}/check`, body).then((r) => r.data);

export const closeCensus = (id) =>
  apiClient.post(`${BASE}/census/${id}/close`).then((r) => r.data);

export const downloadCensusExcel = (id) =>
  downloadBlob(`${BASE}/census/${id}/export`, {}, `file-census-${id}.xlsx`);

// ── bring-up diary (BU) ──
export const createBringUp = (body) =>
  apiClient.post(`${BASE}/bring-ups`, body).then((r) => r.data);

export const listBringUps = (openOnly = true) =>
  apiClient.get(`${BASE}/bring-ups`, { params: { openOnly } }).then((r) => r.data);

export const clearBringUp = (id) =>
  apiClient.post(`${BASE}/bring-ups/${id}/clear`).then((r) => r.data);

// ── mark grid (Table 2) ──
export const getMarkGrid = (folderId) =>
  apiClient.get(`${BASE}/files/${folderId}/mark-grid`).then((r) => r.data);

export const downloadMarkGridExcel = (folderId) =>
  downloadBlob(`${BASE}/files/${folderId}/mark-grid/export`, {}, `file-grid-${folderId}.xlsx`);

// Downloads an Excel file through the authenticated client.
async function downloadBlob(url, params, fallbackName) {
  const res = await apiClient.get(url, { params, responseType: "blob" });
  const disposition = res.headers?.["content-disposition"] || "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = match ? match[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
