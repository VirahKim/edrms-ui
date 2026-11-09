import apiClient from "./apiClient";

const BASE = "/EDMSApi/api";

/* ── Documents ────────────────────────────────────────────── */
export const getDocuments = (params) =>
  apiClient.get(`${BASE}/documents`, { params }).then((r) => r.data);

export const getDocument = (id) =>
  apiClient.get(`${BASE}/documents/${id}`).then((r) => r.data);

export const createDocument = (body) =>
  apiClient.post(`${BASE}/documents`, body).then((r) => r.data);

export const updateDocument = (id, body) =>
  apiClient.put(`${BASE}/documents/${id}`, body).then((r) => r.data);

export const submitDocument = (id, body = {}) =>
  apiClient.post(`${BASE}/documents/${id}/submit`, body).then((r) => r.data);

export const approveDocument = (id, body) =>
  apiClient.post(`${BASE}/documents/${id}/approve`, body).then((r) => r.data);

export const rejectDocument = (id, body) =>
  apiClient.post(`${BASE}/documents/${id}/reject`, body).then((r) => r.data);

export const reworkDocument = (id, body) =>
  apiClient.post(`${BASE}/documents/${id}/rework`, body).then((r) => r.data);

export const lockDocument = (id, body) =>
  apiClient.post(`${BASE}/documents/${id}/lock`, body).then((r) => r.data);

export const deleteDocument = (id) =>
  apiClient.delete(`${BASE}/documents/${id}`).then((r) => r.data);

export const starDocument = (id) =>
  apiClient.post(`${BASE}/documents/${id}/star`).then((r) => r.data);

export const unstarDocument = (id) =>
  apiClient.delete(`${BASE}/documents/${id}/star`).then((r) => r.data);

export const addTag = (id, tag) =>
  apiClient.post(`${BASE}/documents/${id}/tags`, { tag }).then((r) => r.data);

export const removeTag = (id, tag) =>
  apiClient.delete(`${BASE}/documents/${id}/tags/${tag}`).then((r) => r.data);

export const getRelationships = (id) =>
  apiClient.get(`${BASE}/documents/${id}/relationships`).then((r) => r.data);

export const addRelationship = (id, body) =>
  apiClient.post(`${BASE}/documents/${id}/relationships`, body).then((r) => r.data);

export const getComments = (id) =>
  apiClient.get(`${BASE}/documents/${id}/comments`).then((r) => r.data);

export const addComment = (id, commentText, parentCommentId = null) =>
  apiClient
    .post(`${BASE}/documents/${id}/comments`, {
      comment_text: commentText,
      parent_comment_id: parentCommentId,
    })
    .then((r) => r.data);

export const updateComment = (id, commentId, commentText) =>
  apiClient
    .put(`${BASE}/documents/${id}/comments/${commentId}`, { comment_text: commentText })
    .then((r) => r.data);

export const deleteComment = (id, commentId) =>
  apiClient.delete(`${BASE}/documents/${id}/comments/${commentId}`).then((r) => r.data);

export const searchDocuments = (params) =>
  apiClient.get(`${BASE}/documents/search`, { params }).then((r) => r.data);

export const bulkUploadDocuments = (formData, onUploadProgress) =>
  apiClient
    .post(`${BASE}/documents/bulk`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
    .then((r) => r.data);

export const checkoutDocument = (id) =>
  apiClient.post(`${BASE}/documents/${id}/checkout`).then((r) => r.data);

export const checkinDocument = (id) =>
  apiClient.post(`${BASE}/documents/${id}/checkin`).then((r) => r.data);

export const declareRecord = (id) =>
  apiClient.post(`${BASE}/documents/${id}/declare-record`).then((r) => r.data);

export const unlockDocument = (id, body) =>
  apiClient.post(`${BASE}/documents/${id}/unlock`, body).then((r) => r.data);

export const removeRelationship = (id, relationshipId) =>
  apiClient.delete(`${BASE}/documents/${id}/relationships/${relationshipId}`).then((r) => r.data);

export const checkDuplicates = (params) =>
  apiClient.get(`${BASE}/documents/duplicate-check`, { params }).then((r) => r.data);

// Flattens a signature image onto a normalized position of one page of the
// document's current version, landing the result as a brand-new version.
// body: { signature_id, page_number, pos_x, pos_y, width, height, workflow_instance_id?, workflow_step_approver_id? }
export const signDocument = (documentId, body) =>
  apiClient.post(`${BASE}/documents/${documentId}/sign`, body).then((r) => r.data);

// Converts a Word / Excel / PowerPoint letter to PDF (as a new version) so it can be signed or stamped.
// A PDF or image is left as it is.
export const prepareDocumentForSigning = (documentId) =>
  apiClient.post(`${BASE}/documents/${documentId}/prepare-for-signing`).then((r) => r.data);

// Fixes a wrongly placed signature / stamp. kind: "signature" | "stamp".
// body: { action: "REMOVE" } or { action: "MOVE", page_number, pos_x, pos_y, width, height }.
export const reviseStampPlacement = (documentId, kind, placementId, body) =>
  apiClient.post(`${BASE}/documents/${documentId}/stamp-placements/${kind}/${placementId}/revise`, body).then((r) => r.data);

// The printable copy of a document (PDF): folio and cross-referenced folios at the top right, then the numbered comments
// with signatures and dates. Opens in a new tab ready to print.
export const openDocumentPrintPack = async (documentId) => {
  const win = window.open("", "_blank");
  try {
    const res = await apiClient.get(`${BASE}/documents/${documentId}/print-pack`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    if (win) win.location.href = url; else window.open(url, "_blank");
  } catch (err) {
    win?.close();
    let message = "The printable copy could not be made.";
    try { message = JSON.parse(await err.response.data.text()).message || message; } catch { /* keep the general message */ }
    throw new Error(message);
  }
};

// The document's folio and the folios it refers to - drawn at the top right of the document.
export const getDocumentFolioInfo = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/folio-info`).then((r) => r.data?.data ?? null);

export const getDocumentSignatureStamps = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/signature-stamps`).then((r) => r.data);

/* ── Storage / Versions ───────────────────────────────────── */
export const getVersions = (documentId) =>
  apiClient.get(`${BASE}/storage/documents/${documentId}/versions`).then((r) => r.data);

export const uploadVersion = (documentId, formData) =>
  apiClient
    .post(`${BASE}/storage/documents/${documentId}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const getVersionDetail = (documentId, versionId) =>
  apiClient
    .get(`${BASE}/storage/documents/${documentId}/versions/${versionId}`)
    .then((r) => r.data);

export const getPreviewUrl = (documentId, versionId) =>
  apiClient
    .get(`${BASE}/storage/documents/${documentId}/versions/${versionId}/preview-url`)
    .then((r) => r.data);

// Inline preview as a Blob (PDF, or an image). Office files are converted on the
// server, so the browser never downloads the original.
export const getPreviewFile = (documentId, versionId) =>
  apiClient
    .get(`${BASE}/storage/documents/${documentId}/versions/${versionId}/preview-file`, { responseType: "blob" })
    .then((r) => r.data);

export const getDownloadUrl = (documentId, versionId) =>
  apiClient
    .get(`${BASE}/storage/documents/${documentId}/versions/${versionId}/download-url`)
    .then((r) => r.data);

export const promoteVersion = (documentId, versionId) =>
  apiClient
    .post(`${BASE}/storage/documents/${documentId}/versions/${versionId}/promote`)
    .then((r) => r.data);

export const restoreVersion = (documentId, versionId) =>
  apiClient
    .post(`${BASE}/storage/documents/${documentId}/versions/${versionId}/restore`)
    .then((r) => r.data);

export const createUploadSession = (body) =>
  apiClient.post(`${BASE}/storage/upload-sessions`, body).then((r) => r.data);

export const confirmPart = (sessionId, partNumber, body) =>
  apiClient
    .post(`${BASE}/storage/upload-sessions/${sessionId}/parts/${partNumber}`, body)
    .then((r) => r.data);

export const completeUploadSession = (sessionId) =>
  apiClient
    .post(`${BASE}/storage/upload-sessions/${sessionId}/complete`)
    .then((r) => r.data);

/* ── Metadata ─────────────────────────────────────────────── */
export const getDocumentTypes = (params) =>
  apiClient.get(`${BASE}/metadata/document-types`, { params }).then((r) => r.data);

export const getDocumentType = (id) =>
  apiClient.get(`${BASE}/metadata/document-types/${id}`).then((r) => r.data);

export const getTypeFields = (typeId) =>
  apiClient.get(`${BASE}/metadata/document-types/${typeId}/fields`).then((r) => r.data);

export const getFieldOptions = (typeId, fieldId) =>
  apiClient
    .get(`${BASE}/metadata/document-types/${typeId}/fields/${fieldId}/options`)
    .then((r) => r.data);

export const getMetadataValues = (documentId) =>
  apiClient.get(`${BASE}/metadata/documents/${documentId}/values`).then((r) => r.data);

export const saveMetadataValues = (documentId, values) =>
  apiClient
    .put(`${BASE}/metadata/documents/${documentId}/values`, { values })
    .then((r) => r.data);

export const getStatuses = () =>
  apiClient.get(`${BASE}/metadata/ref/statuses`).then((r) => r.data);

export const getDisposalMethods = () =>
  apiClient.get(`${BASE}/metadata/ref/disposal-methods`).then((r) => r.data);

export const getRetentionTriggers = () =>
  apiClient.get(`${BASE}/metadata/ref/retention-triggers`).then((r) => r.data);

export const getRetentionActions = () =>
  apiClient.get(`${BASE}/metadata/ref/retention-actions`).then((r) => r.data);

export const getConfidentialityLevels = () =>
  apiClient.get(`${BASE}/metadata/ref/confidentiality-levels`).then((r) => r.data);

export const createDocumentType = (body) =>
  apiClient.post(`${BASE}/metadata/document-types`, body).then((r) => r.data);

export const updateDocumentType = (id, body) =>
  apiClient.put(`${BASE}/metadata/document-types/${id}`, body).then((r) => r.data);

export const deleteDocumentType = (id) =>
  apiClient.delete(`${BASE}/metadata/document-types/${id}`).then((r) => r.data);

export const createTypeField = (typeId, body) =>
  apiClient.post(`${BASE}/metadata/document-types/${typeId}/fields`, body).then((r) => r.data);

export const updateTypeField = (typeId, fieldId, body) =>
  apiClient.put(`${BASE}/metadata/document-types/${typeId}/fields/${fieldId}`, body).then((r) => r.data);

export const deleteTypeField = (typeId, fieldId) =>
  apiClient.delete(`${BASE}/metadata/document-types/${typeId}/fields/${fieldId}`).then((r) => r.data);

export const createFieldOption = (typeId, fieldId, body) =>
  apiClient.post(`${BASE}/metadata/document-types/${typeId}/fields/${fieldId}/options`, body).then((r) => r.data);

export const updateFieldOption = (typeId, fieldId, optionId, body) =>
  apiClient.put(`${BASE}/metadata/document-types/${typeId}/fields/${fieldId}/options/${optionId}`, body).then((r) => r.data);

export const deleteFieldOption = (typeId, fieldId, optionId) =>
  apiClient.delete(`${BASE}/metadata/document-types/${typeId}/fields/${fieldId}/options/${optionId}`).then((r) => r.data);

export const deleteTypeAccessPolicy = (typeId, policyId) =>
  apiClient.delete(`${BASE}/access/document-types/${typeId}/policies/${policyId}`).then((r) => r.data);

/* ── Workflow ─────────────────────────────────────────────── */
export const getInbox = (params) =>
  apiClient.get(`${BASE}/workflow/inbox`, { params }).then((r) => r.data);

export const submitDecision = (taskId, body) =>
  apiClient.post(`${BASE}/workflow/inbox/${taskId}/decision`, body).then((r) => r.data);

export const getDocumentWorkflows = (documentId) =>
  apiClient
    .get(`${BASE}/workflow/documents/${documentId}/workflows`)
    .then((r) => r.data);

export const initiateWorkflow = (documentId, body) =>
  apiClient
    .post(`${BASE}/workflow/documents/${documentId}/initiate`, body)
    .then((r) => r.data);

export const getPendingApprovals = (params) =>
  apiClient.get(`${BASE}/workflow/pending-approvals`, { params }).then((r) => r.data);

/* ── Records ──────────────────────────────────────────────── */
export const getSchedules = (params) =>
  apiClient.get(`${BASE}/records/schedules`, { params }).then((r) => r.data);

export const reviewSchedule = (scheduleId, body) =>
  apiClient
    .put(`${BASE}/records/schedules/${scheduleId}/review`, body)
    .then((r) => r.data);

export const initiateDisposal = (scheduleId) =>
  apiClient
    .post(`${BASE}/records/schedules/${scheduleId}/dispose`)
    .then((r) => r.data);

export const confirmDisposal = (scheduleId, body) =>
  apiClient
    .post(`${BASE}/records/schedules/${scheduleId}/dispose/confirm`, body)
    .then((r) => r.data);

export const getLegalHolds = (params) =>
  apiClient.get(`${BASE}/records/legal-holds`, { params }).then((r) => r.data);

export const releaseHold = (holdId, body) =>
  apiClient
    .post(`${BASE}/records/legal-holds/${holdId}/release`, body)
    .then((r) => r.data);

export const getDueForAction = (params) =>
  apiClient.get(`${BASE}/records/due-for-action`, { params }).then((r) => r.data);

export const getRetentionRules = (params) =>
  apiClient.get(`${BASE}/records/retention-rules`, { params }).then((r) => r.data);

export const getRetentionRule = (id) =>
  apiClient.get(`${BASE}/records/retention-rules/${id}`).then((r) => r.data);

export const createRetentionRule = (body) =>
  apiClient.post(`${BASE}/records/retention-rules`, body).then((r) => r.data);

export const updateRetentionRule = (id, body) =>
  apiClient.put(`${BASE}/records/retention-rules/${id}`, body).then((r) => r.data);

export const scheduleRetention = (documentId, body) =>
  apiClient.post(`${BASE}/records/documents/${documentId}/schedule`, body).then((r) => r.data);

/* ── OCR ──────────────────────────────────────────────────── */
export const getOCRJobs = (params) =>
  apiClient.get(`${BASE}/ocr/jobs`, { params }).then((r) => r.data);

export const getOCRJob = (jobId) =>
  apiClient.get(`${BASE}/ocr/jobs/${jobId}`).then((r) => r.data);

export const submitOCRJob = (body) =>
  apiClient.post(`${BASE}/ocr/jobs`, body).then((r) => r.data);

export const cancelOCRJob = (jobId) =>
  apiClient.post(`${BASE}/ocr/jobs/${jobId}/cancel`).then((r) => r.data);

export const getOCRFields = (jobId) =>
  apiClient.get(`${BASE}/ocr/jobs/${jobId}/extracted-fields`).then((r) => r.data);

export const correctOCRField = (jobId, fieldId, body) =>
  apiClient
    .put(`${BASE}/ocr/jobs/${jobId}/extracted-fields/${fieldId}`, body)
    .then((r) => r.data);

export const updateOCRField = (jobId, fieldId, body) =>
  apiClient.put(`${BASE}/ocr/jobs/${jobId}/fields/${fieldId}`, body).then((r) => r.data);

export const acceptOCRJob = (jobId) =>
  apiClient.post(`${BASE}/ocr/jobs/${jobId}/accept`).then((r) => r.data);

export const rejectOCRJob = (jobId, body) =>
  apiClient.post(`${BASE}/ocr/jobs/${jobId}/reject`, body).then((r) => r.data);

export const retryOCRJob = (jobId) =>
  apiClient.post(`${BASE}/ocr/jobs/${jobId}/retry`).then((r) => r.data);

export const getManualReviewQueue = (params) =>
  apiClient.get(`${BASE}/ocr/manual-review-queue`, { params }).then((r) => r.data);

export const getOCRPages = (jobId) =>
  apiClient.get(`${BASE}/ocr/jobs/${jobId}/pages`).then((r) => r.data);

export const getOCRStats = () =>
  apiClient.get(`${BASE}/ocr/stats`).then((r) => r.data);

/* ── AI ───────────────────────────────────────────────────── */
export const getAIResults = (documentId) =>
  apiClient.get(`${BASE}/ai/documents/${documentId}/results`).then((r) => r.data);

export const queueAIJob = (body) =>
  apiClient.post(`${BASE}/ai/jobs`, body).then((r) => r.data);

export const applyAIClassification = (resultId) =>
  apiClient
    .post(`${BASE}/ai/results/${resultId}/apply-classification`)
    .then((r) => r.data);

export const applyAITags = (resultId) =>
  apiClient.post(`${BASE}/ai/results/${resultId}/apply-tags`).then((r) => r.data);

export const getAIJob = (jobId) =>
  apiClient.get(`${BASE}/ai/jobs/${jobId}`).then((r) => r.data);

export const reviewAIResult = (resultId, body) =>
  apiClient.post(`${BASE}/ai/results/${resultId}/review`, body).then((r) => r.data);

// Natural-language document retrieval ("where is it" / "what's in it") — runs access-controlled
// keyword retrieval against EDMS data, then has AiAPI (Claude) answer grounded in the matches.
// Unlike the aiGatewayApi.js chat functions, this hits EDmsAPI itself, not DrioAPI directly.
// `sessionId` is opt-in, same contract as the AI Gateway's X-Session-Id: pass it to have the
// turn persisted under AI.AskConversations/AskMessages so it shows up via getAskConversations;
// omit it for a stateless one-off call.
export const askDocuments = (question, sessionId) =>
  apiClient.post(`${BASE}/ai/ask`, { question, session_id: sessionId }).then((r) => r.data);

// This mode's history lives in EDmsAPI's own AI.AskConversations/AskMessages tables, separate
// from the AI Gateway's Postgres conversation store used by general chat — so it gets its own
// list/messages calls, shaped to match aiGatewayApi.js's getConversations/getConversationMessages.
export const getAskConversations = ({ limit = 50, offset = 0 } = {}) =>
  apiClient.get(`${BASE}/ai/ask/conversations`, { params: { limit, offset } }).then((r) => r.data?.data || []);

export const getAskConversationMessages = (sessionId, { limit = 100, offset = 0 } = {}) =>
  apiClient
    .get(`${BASE}/ai/ask/conversations/${encodeURIComponent(sessionId)}/messages`, { params: { limit, offset } })
    .then((r) => r.data?.data || []);

/* ── Reporting ────────────────────────────────────────────── */
// Just the numbers on the Reports page - far lighter than the full dashboard summary.
export const getReportCounts = () =>
  apiClient.get(`${BASE}/reporting/report-counts`).then((r) => r.data);

export const getDashboardSummary = () =>
  apiClient.get(`${BASE}/reporting/dashboard-summary`).then((r) => r.data);

export const getDocumentVolume = (params) =>
  apiClient.get(`${BASE}/reporting/document-volume`, { params }).then((r) => r.data);

export const exportReport = (reportType, params) =>
  apiClient.get(`${BASE}/reporting/export/${reportType}`, { params }).then((r) => r.data);

export const getSLAReport = (params) =>
  apiClient.get(`${BASE}/reporting/sla-report`, { params }).then((r) => r.data);

/* ── Audit ────────────────────────────────────────────────── */
export const getAuditLogs = (params) =>
  apiClient.get(`${BASE}/audit/logs`, { params }).then((r) => r.data);

export const getDocumentHistory = (documentId, params) =>
  apiClient
    .get(`${BASE}/audit/documents/${documentId}/history`, { params })
    .then((r) => r.data);

/* ── Files (backend: Folders) ───────────────────────────────── */
export const getFiles = (params) =>
  apiClient.get(`${BASE}/folders`, { params }).then((r) => r.data);

export const getFile = (id) =>
  apiClient.get(`${BASE}/folders/${id}`).then((r) => r.data);

export const createFile = (body) =>
  apiClient.post(`${BASE}/folders`, body).then((r) => r.data);

export const updateFile = (id, body) =>
  apiClient.put(`${BASE}/folders/${id}`, body).then((r) => r.data);

export const deleteFile = (id) =>
  apiClient.delete(`${BASE}/folders/${id}`).then((r) => r.data);

export const moveFile = (id, body) =>
  apiClient.post(`${BASE}/folders/${id}/move`, body).then((r) => r.data);

export const getFileDocuments = (fileId, params) =>
  apiClient.get(`${BASE}/folders/${fileId}/documents`, { params }).then((r) => r.data);

export const linkDocumentToFile = (fileId, documentId) =>
  apiClient.post(`${BASE}/folders/${fileId}/documents`, { document_id: documentId }).then((r) => r.data);

export const unlinkDocumentFromFile = (fileId, documentId) =>
  apiClient.delete(`${BASE}/folders/${fileId}/documents/${documentId}`).then((r) => r.data);

export const previewFile = (fileId, body) =>
  apiClient.post(`${BASE}/folders/${fileId}/preview`, body).then((r) => r.data);

export const getFileTree = (params) =>
  apiClient.get(`${BASE}/folders/tree`, { params }).then((r) => r.data);

export const cloneFile = (id, body) =>
  apiClient.post(`${BASE}/folders/${id}/clone`, body).then((r) => r.data);

export const getFilesByDocument = (documentId) =>
  apiClient.get(`${BASE}/folders/by-document/${documentId}`).then((r) => r.data);

export const moveDocumentToFile = (fileId, documentId, body) =>
  apiClient.post(`${BASE}/folders/${fileId}/documents/${documentId}/move`, body).then((r) => r.data);

export const copyDocumentToFile = (fileId, documentId, body) =>
  apiClient.post(`${BASE}/folders/${fileId}/documents/${documentId}/copy`, body).then((r) => r.data);

export const bulkLinkDocuments = (fileId, documentIds) =>
  apiClient.post(`${BASE}/folders/${fileId}/documents/bulk`, { document_ids: documentIds }).then((r) => r.data);

export const bulkUnlinkDocuments = (fileId, documentIds) =>
  apiClient.delete(`${BASE}/folders/${fileId}/documents/bulk`, { data: { document_ids: documentIds } }).then((r) => r.data);

/* ── File Shares ─────────────────────────────────────────── */
export const getFileShares = (fileId) =>
  apiClient.get(`${BASE}/folders/${fileId}/shares`).then((r) => r.data);

export const createFileShare = (fileId, body) =>
  apiClient.post(`${BASE}/folders/${fileId}/shares`, body).then((r) => r.data);

export const deleteFileShare = (fileId, shareId) =>
  apiClient.delete(`${BASE}/folders/${fileId}/shares/${shareId}`).then((r) => r.data);

/* ── File Subscriptions ──────────────────────────────────── */
export const getFileSubscriptions = (fileId) =>
  apiClient.get(`${BASE}/folders/${fileId}/subscriptions`).then((r) => r.data);

export const subscribeFileNotifications = (fileId, body) =>
  apiClient.post(`${BASE}/folders/${fileId}/subscriptions`, body).then((r) => r.data);

export const unsubscribeFromFile = (fileId) =>
  apiClient.delete(`${BASE}/folders/${fileId}/subscriptions/me`).then((r) => r.data);

/* ── File Preferences ────────────────────────────────────── */
export const setFilePreferences = (fileId, body) =>
  apiClient.put(`${BASE}/folders/${fileId}/preferences`, body).then((r) => r.data);

/* ── File Stars ──────────────────────────────────────────── */
export const starFile = (id) =>
  apiClient.post(`${BASE}/folders/${id}/star`).then((r) => r.data);

export const unstarFile = (id) =>
  apiClient.delete(`${BASE}/folders/${id}/star`).then((r) => r.data);

/* ── Physical Locations (Registries / Cabinets / Shelves) ───── */
export const getRegistries = () =>
  apiClient.get(`${BASE}/locations/registries`).then((r) => r.data);

export const getRegistry = (id) =>
  apiClient.get(`${BASE}/locations/registries/${id}`).then((r) => r.data);

export const getMyRegistries = () =>
  apiClient.get(`${BASE}/locations/my-registries`).then((r) => r.data);

// A user's own registries (set from user management). Optional: none = not tied to a registry.
export const getUserRegistries = (userId) =>
  apiClient.get(`${BASE}/locations/users/${userId}/registries`).then((r) => r.data);

export const setUserRegistries = (userId, registryIds) =>
  apiClient.put(`${BASE}/locations/users/${userId}/registries`, { registry_ids: registryIds }).then((r) => r.data);

export const getRegistryUsers = (id) =>
  apiClient.get(`${BASE}/locations/registries/${id}/users`).then((r) => r.data);

export const setRegistryUsers = (id, userIds) =>
  apiClient.put(`${BASE}/locations/registries/${id}/users`, { user_ids: userIds }).then((r) => r.data);

export const createRegistry = (body) =>
  apiClient.post(`${BASE}/locations/registries`, body).then((r) => r.data);

export const updateRegistry = (id, body) =>
  apiClient.put(`${BASE}/locations/registries/${id}`, body).then((r) => r.data);

export const deleteRegistry = (id) =>
  apiClient.delete(`${BASE}/locations/registries/${id}`).then((r) => r.data);

export const getCabinets = (registryId) =>
  apiClient.get(`${BASE}/locations/registries/${registryId}/cabinets`).then((r) => r.data);

export const createCabinet = (registryId, body) =>
  apiClient.post(`${BASE}/locations/registries/${registryId}/cabinets`, body).then((r) => r.data);

export const updateCabinet = (registryId, cabinetId, body) =>
  apiClient.put(`${BASE}/locations/registries/${registryId}/cabinets/${cabinetId}`, body).then((r) => r.data);

export const deleteCabinet = (registryId, cabinetId) =>
  apiClient.delete(`${BASE}/locations/registries/${registryId}/cabinets/${cabinetId}`).then((r) => r.data);

export const getShelves = (cabinetId) =>
  apiClient.get(`${BASE}/locations/cabinets/${cabinetId}/shelves`).then((r) => r.data);

export const createShelf = (cabinetId, body) =>
  apiClient.post(`${BASE}/locations/cabinets/${cabinetId}/shelves`, body).then((r) => r.data);

export const updateShelf = (cabinetId, shelfId, body) =>
  apiClient.put(`${BASE}/locations/cabinets/${cabinetId}/shelves/${shelfId}`, body).then((r) => r.data);

export const deleteShelf = (cabinetId, shelfId) =>
  apiClient.delete(`${BASE}/locations/cabinets/${cabinetId}/shelves/${shelfId}`).then((r) => r.data);

export const getNextFolioNumber = (fileId) =>
  apiClient.get(`${BASE}/folders/${fileId}/next-folio-number`).then((r) => r.data);

/* ── Access ───────────────────────────────────────────────── */
export const getEffectivePermissions = (documentId) =>
  apiClient
    .get(`${BASE}/access/documents/${documentId}/effective-permissions`)
    .then((r) => r.data);

export const getTypeAccessPolicies = (typeId) =>
  apiClient.get(`${BASE}/access/document-types/${typeId}/policies`).then((r) => r.data);

export const grantTypeAccess = (typeId, body) =>
  apiClient.post(`${BASE}/access/document-types/${typeId}/policies`, body).then((r) => r.data);

export const getDocumentAccessPolicies = (documentId) =>
  apiClient.get(`${BASE}/access/documents/${documentId}/policies`).then((r) => r.data);

export const grantDocumentAccess = (documentId, body) =>
  apiClient.post(`${BASE}/access/documents/${documentId}/policies`, body).then((r) => r.data);

export const updateDocumentAccessPolicy = (documentId, policyId, body) =>
  apiClient.put(`${BASE}/access/documents/${documentId}/policies/${policyId}`, body).then((r) => r.data);

export const deleteDocumentAccessPolicy = (documentId, policyId) =>
  apiClient.delete(`${BASE}/access/documents/${documentId}/policies/${policyId}`).then((r) => r.data);

/* ── Storage quota ────────────────────────────────────────── */
export const getStorageQuota = () =>
  apiClient.get(`${BASE}/storage-quota`).then((r) => r.data);

export const updateStorageQuota = (quotaBytes) =>
  apiClient.put(`${BASE}/storage-quota`, { quota_bytes: quotaBytes }).then((r) => r.data);

/* ── Cloud co-editing (OneDrive/Google Drive) ────────────────
   Generic, standalone EDMS capability — works on any document,
   independent of procurement/tendering or any other module. The
   physical server stays the system of record; the cloud copy is
   transient for the lifetime of one edit session (opened in a new
   browser tab, never embedded). */
export const connectExternalAccount = (provider, capability = "CLOUD_EDIT") =>
  apiClient.post(`${BASE}/external-accounts/connect`, { provider, capability }).then((r) => r.data);

export const listExternalAccounts = () =>
  apiClient.get(`${BASE}/external-accounts`).then((r) => r.data);

export const disconnectExternalAccount = (id) =>
  apiClient.delete(`${BASE}/external-accounts/${id}`).then((r) => r.data);

// Only meaningful once 2+ accounts are connected — a lone account is always
// the default already (server-enforced on connect/disconnect).
export const setDefaultExternalAccount = (id) =>
  apiClient.patch(`${BASE}/external-accounts/${id}/default`).then((r) => r.data);

/* ── Import from Email ───────────────────────────────────────
   Search a connected Gmail/Outlook mailbox for messages with attachments and
   pull selected ones in as documents. An account connected only for Cloud
   Edit shows has_mail_scope: false until reconnected with the EMAIL_IMPORT
   capability (see connectExternalAccount). */
export const listEmailImportAccounts = () =>
  apiClient.get(`${BASE}/email-import/accounts`).then((r) => r.data);

export const searchEmailAttachments = (params) =>
  apiClient.post(`${BASE}/email-import/search`, params).then((r) => r.data);

export const importEmailAttachments = (payload) =>
  apiClient.post(`${BASE}/email-import/import`, payload).then((r) => r.data);

// Returns the raw attachment bytes as a Blob for inline preview — not persisted,
// same read-through proxy the search step's account already authorizes.
export const previewEmailAttachment = (params) =>
  apiClient.get(`${BASE}/email-import/preview`, { params, responseType: "blob" }).then((r) => r.data);

// Invite more people (system users) to write the open online copy together.
export const inviteToCloudEdit = (documentId, sessionId, body) =>
  apiClient.post(`${BASE}/documents/${documentId}/cloud-edit/${sessionId}/invite`, body).then((r) => r.data);

export const startCloudEdit = (documentId, provider) =>
  apiClient.post(`${BASE}/documents/${documentId}/cloud-edit/start`, { provider }).then((r) => r.data);

export const getCloudEditStatus = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/cloud-edit/status`).then((r) => r.data);

export const completeCloudEdit = (documentId, sessionId) =>
  apiClient.post(`${BASE}/documents/${documentId}/cloud-edit/${sessionId}/complete`).then((r) => r.data);

/* ── Inward intake (register-first upload) ────────────────── */
// Details of one file (registry, volume, location …) — shown under the file picker.
export const getFileDetails = (fileId) =>
  apiClient.get(`${BASE}/folders/${fileId}`).then((r) => r.data);

// Cross-reference picker: documents the user can see, across every file.
export const searchReferenceTargets = (params) =>
  apiClient.get(`${BASE}/documents/reference-search`, { params }).then((r) => r.data);

// Physical enclosures: items that came with a document but are kept on paper.
export const getPhysicalEnclosures = (documentId) =>
  apiClient.get(`${BASE}/documents/${documentId}/physical-enclosures`).then((r) => r.data);
export const addPhysicalEnclosure = (documentId, body) =>
  apiClient.post(`${BASE}/documents/${documentId}/physical-enclosures`, body).then((r) => r.data);
export const removePhysicalEnclosure = (documentId, enclosureId) =>
  apiClient.delete(`${BASE}/documents/${documentId}/physical-enclosures/${enclosureId}`).then((r) => r.data);

// Saves the upload details form: files the imported document and writes its
// Inward Register entry in a single step (no approval, no validation queue).
export const fileInwardDocument = (body) =>
  apiClient.post(`${BASE}/registers/inward/file-document`, body).then((r) => r.data);
