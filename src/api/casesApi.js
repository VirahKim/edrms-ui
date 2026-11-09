import apiClient from './apiClient';

// ============================================================================
// CASE TYPES
// ============================================================================

export const createCaseType = async (data) => {
  const response = await apiClient.post('/CasesAPI/api/cases/types', data);
  return response.data;
};

export const getCaseType = async (id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/types/${id}`);
  return response.data;
};

export const getAllCaseTypes = async (isActive = null) => {
  const params = isActive !== null ? { isActive } : {};
  const response = await apiClient.get('/CasesAPI/api/cases/types', { params });
  return response.data;
};

export const updateCaseType = async (id, data) => {
  const response = await apiClient.put(`/CasesAPI/api/cases/types/${id}`, data);
  return response.data;
};

export const deleteCaseType = async (id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/types/${id}`);
  return response.data;
};

// ============================================================================
// CASES
// ============================================================================

export const createCase = async (data) => {
  const response = await apiClient.post('/CasesAPI/api/cases', data);
  return response.data;
};

export const getCase = async (id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${id}`);
  return response.data;
};

export const getCaseDetail = async (id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${id}/detail`);
  return response.data;
};

export const getAllCases = async (filters = {}) => {
  const response = await apiClient.get('/CasesAPI/api/cases', { params: filters });
  return response.data;
};

export const updateCase = async (id, data) => {
  const response = await apiClient.put(`/CasesAPI/api/cases/${id}`, data);
  return response.data;
};

export const getCaseStatusHistory = async (id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${id}/status-history`);
  return response.data;
};

// ============================================================================
// CASE ATTACHMENTS
// ============================================================================

export const createAttachment = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/attachments`, data);
  return response.data;
};

export const getAttachment = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/attachments/${id}`);
  return response.data;
};

export const getAllAttachments = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/attachments`);
  return response.data;
};

export const deleteAttachment = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/attachments/${id}`);
  return response.data;
};

// ============================================================================
// CHAIN OF CUSTODY
// ============================================================================

export const createChainOfCustody = async (caseId, attachmentId, data) => {
  const response = await apiClient.post(
    `/CasesAPI/api/cases/${caseId}/attachments/${attachmentId}/chain-of-custody`,
    data
  );
  return response.data;
};

export const getChainOfCustody = async (caseId, attachmentId, id) => {
  const response = await apiClient.get(
    `/CasesAPI/api/cases/${caseId}/attachments/${attachmentId}/chain-of-custody/${id}`
  );
  return response.data;
};

export const getChainOfCustodyHistory = async (caseId, attachmentId) => {
  const response = await apiClient.get(
    `/CasesAPI/api/cases/${caseId}/attachments/${attachmentId}/chain-of-custody`
  );
  return response.data;
};

export const updateChainOfCustody = async (caseId, attachmentId, id, data) => {
  const response = await apiClient.put(
    `/CasesAPI/api/cases/${caseId}/attachments/${attachmentId}/chain-of-custody/${id}`,
    data
  );
  return response.data;
};

export const deleteChainOfCustody = async (caseId, attachmentId, id) => {
  const response = await apiClient.delete(
    `/CasesAPI/api/cases/${caseId}/attachments/${attachmentId}/chain-of-custody/${id}`
  );
  return response.data;
};

// ============================================================================
// CASE ACTIONS
// ============================================================================

export const createAction = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/actions`, data);
  return response.data;
};

export const getAction = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/actions/${id}`);
  return response.data;
};

export const getAllActions = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/actions`);
  return response.data;
};

export const deleteAction = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/actions/${id}`);
  return response.data;
};

// ============================================================================
// CASE NOTES
// ============================================================================

export const createNote = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/notes`, data);
  return response.data;
};

export const getNote = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/notes/${id}`);
  return response.data;
};

export const getAllNotes = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/notes`);
  return response.data;
};

export const deleteNote = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/notes/${id}`);
  return response.data;
};

// ============================================================================
// INVESTIGATIONS
// ============================================================================

export const createInvestigation = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/investigations`, data);
  return response.data;
};

export const getInvestigation = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/${id}`);
  return response.data;
};

export const getInvestigationByCase = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations`);
  return response.data;
};

export const updateInvestigation = async (caseId, id, data) => {
  const response = await apiClient.put(`/CasesAPI/api/cases/${caseId}/investigations/${id}`, data);
  return response.data;
};

// ============================================================================
// CASE ASSIGNMENTS
// ============================================================================

export const createAssignment = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/investigations/assignments`, data);
  return response.data;
};

export const getAssignment = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/assignments/${id}`);
  return response.data;
};

export const getAllAssignments = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/assignments`);
  return response.data;
};

export const deleteAssignment = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/investigations/assignments/${id}`);
  return response.data;
};

// ============================================================================
// CASE TASKS
// ============================================================================

export const createTask = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/investigations/tasks`, data);
  return response.data;
};

export const getTask = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/tasks/${id}`);
  return response.data;
};

export const getAllTasks = async (caseId, status = null) => {
  const params = status ? { status } : {};
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/tasks`, { params });
  return response.data;
};

export const updateTask = async (caseId, id, data) => {
  const response = await apiClient.put(`/CasesAPI/api/cases/${caseId}/investigations/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/investigations/tasks/${id}`);
  return response.data;
};

// ============================================================================
// INVOLVED PARTIES
// ============================================================================

export const createInvolvedParty = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/investigations/involved-parties`, data);
  return response.data;
};

export const getInvolvedParty = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/involved-parties/${id}`);
  return response.data;
};

export const getAllInvolvedParties = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/involved-parties`);
  return response.data;
};

export const updateInvolvedParty = async (caseId, id, data) => {
  const response = await apiClient.put(`/CasesAPI/api/cases/${caseId}/investigations/involved-parties/${id}`, data);
  return response.data;
};

export const deleteInvolvedParty = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/investigations/involved-parties/${id}`);
  return response.data;
};

// ============================================================================
// RELATED CASES
// ============================================================================

export const linkRelatedCase = async (caseId, data) => {
  const response = await apiClient.post(`/CasesAPI/api/cases/${caseId}/investigations/related-cases`, data);
  return response.data;
};

export const getRelatedCase = async (caseId, id) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/related-cases/${id}`);
  return response.data;
};

export const getAllRelatedCases = async (caseId) => {
  const response = await apiClient.get(`/CasesAPI/api/cases/${caseId}/investigations/related-cases`);
  return response.data;
};

export const deleteRelatedCase = async (caseId, id) => {
  const response = await apiClient.delete(`/CasesAPI/api/cases/${caseId}/investigations/related-cases/${id}`);
  return response.data;
};
