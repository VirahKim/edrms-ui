import apiClient from "./apiClient";

const BASE = "/EDMSApi/api/file-routing";

// Which routing roles the signed-in user holds.
export const getFileRoutingMe = () => apiClient.get(`${BASE}/me`).then((r) => r.data);

// People a private note can be addressed to (everyone in the Registry / Marking / Action roles).
export const getChainPeople = () => apiClient.get(`${BASE}/chain-people`).then((r) => r.data);

export const listFileRoutings = (stage) =>
  apiClient.get(BASE, { params: stage ? { stage } : {} }).then((r) => r.data);

export const getFileRouting = (id) => apiClient.get(`${BASE}/${id}`).then((r) => r.data);

// The "Submit to Marking Officer" screen: the file and its documents.
export const prepareFileRouting = (folderId) =>
  apiClient.get(`${BASE}/folders/${folderId}/prepare`).then((r) => r.data);

// Notes to show on top of one document.
export const getDocumentRoutingNotes = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/notes`).then((r) => r.data);

export const sendFileToMarking = (body) => apiClient.post(`${BASE}/send-to-marking`, body).then((r) => r.data);
export const markFileRouting = (id, body) => apiClient.post(`${BASE}/${id}/mark`, body).then((r) => r.data);
export const sendFileToAction = (id, body) => apiClient.post(`${BASE}/${id}/send-to-action`, body).then((r) => r.data);
export const fileAwayFileRouting = (id, body) => apiClient.post(`${BASE}/${id}/file-away`, body).then((r) => r.data);
export const completeFileRouting = (id, body) => apiClient.post(`${BASE}/${id}/complete`, body).then((r) => r.data);
export const addFileRoutingNote = (id, body) => apiClient.post(`${BASE}/${id}/notes`, body).then((r) => r.data);

// ── Action Officer tools ─────────────────────────────────────────────────
// Hand the letters you hold to someone else (a follower, e.g. an HR digit holder).
export const delegateFileRouting = (id, body) => apiClient.post(`${BASE}/${id}/delegate`, body).then((r) => r.data);

// Reply / attachment letters filed next to a letter (next folio, cross-referenced to the letter answered).
export const listReplyLetters = (id) => apiClient.get(`${BASE}/${id}/letters`).then((r) => r.data);
export const uploadReplyLetter = (id, formData) =>
  apiClient.post(`${BASE}/${id}/letters/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const createReplyLetter = (id, body) => apiClient.post(`${BASE}/${id}/letters/create`, body).then((r) => r.data);

// Letter templates (logo, letterhead ...).
export const listLetterTemplates = () => apiClient.get(`${BASE}/letter-templates`).then((r) => r.data);
export const addLetterTemplate = (formData) =>
  apiClient.post(`${BASE}/letter-templates`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const removeLetterTemplate = (id) => apiClient.delete(`${BASE}/letter-templates/${id}`).then((r) => r.data);

// Registry Officer: send letters outside (Outward Mail Register) and close their routing.
export const sendFileOutside = (id, body) => apiClient.post(`${BASE}/${id}/send-outside`, body).then((r) => r.data);

// ── Letters written in the system (the word-processor panel) ─────────────
// The kinds of document: Official Letter, Memo, Circular, Notice, Minutes ...
export const listLetterTypes = () => apiClient.get(`${BASE}/letter-types`).then((r) => r.data);
// A template made in the system: letterhead (logo, name, address), footer and the kind of document.
export const createLetterTemplate = (formData) =>
  apiClient.post(`${BASE}/letter-templates/create`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);

export const listLetterDrafts = (id) => apiClient.get(`${BASE}/${id}/letter-drafts`).then((r) => r.data);
export const startLetterDraft = (id, body) => apiClient.post(`${BASE}/${id}/letter-drafts`, body).then((r) => r.data);
export const getLetterDraft = (id, draftId) => apiClient.get(`${BASE}/${id}/letter-drafts/${draftId}`).then((r) => r.data);
export const saveLetterDraft = (id, draftId, body) => apiClient.put(`${BASE}/${id}/letter-drafts/${draftId}`, body).then((r) => r.data);
export const deleteLetterDraft = (id, draftId) => apiClient.delete(`${BASE}/${id}/letter-drafts/${draftId}`).then((r) => r.data);
// The letter as it will be filed (a .docx on its template) - rendered in the editor's preview.
export const previewLetterDraft = (id, draftId) =>
  apiClient.get(`${BASE}/${id}/letter-drafts/${draftId}/preview`, { responseType: "arraybuffer" }).then((r) => r.data);
export const finishLetterDraft = (id, draftId) => apiClient.post(`${BASE}/${id}/letter-drafts/${draftId}/finish`).then((r) => r.data);
