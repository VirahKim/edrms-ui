import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/search";

// One search over every registry: letters and files, where they are, whether you can open them.
export const globalSearch = (q, scope = "all", registryId = null) =>
  apiClient.get(BASE, { params: { q, scope, registry_id: registryId || undefined } }).then((r) => r.data);

// Cross-references and the other letters filed in the same file.
export const getRelatedLetters = (documentId) =>
  apiClient.get(`${BASE}/related/${documentId}`).then((r) => r.data);
