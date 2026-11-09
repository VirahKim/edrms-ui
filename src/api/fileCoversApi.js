import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/file-covers";

// The cover of a file: reference no. and volume, country and ministry lines, department, subject, colour.
export const getFileCover = (folderId) =>
  apiClient.get(`${BASE}/${folderId}`).then((r) => r.data?.data ?? null);

// body: { header_line1?, header_line2?, department?, color? } - an empty string puts a value back to the default.
export const saveFileCover = (folderId, body) =>
  apiClient.put(`${BASE}/${folderId}`, body).then((r) => r.data?.data ?? null);

export const getCoverColors = () =>
  apiClient.get(`${BASE}/colors`).then((r) => r.data?.data ?? []);

// The organisation's wording and default colour: { header_line1, header_line2, default_color }.
export const getCoverSettings = () =>
  apiClient.get(`${BASE}/settings`).then((r) => r.data?.data ?? null);

export const saveCoverSettings = (body) =>
  apiClient.put(`${BASE}/settings`, body).then((r) => r.data?.data ?? null);
