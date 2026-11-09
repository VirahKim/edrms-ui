import apiClient from './apiClient';

const BASE = '/ProjectMgtAPI/api';

// ──── Reference Data ────────────────────────────────────────────────
export const refData = {
  get:    (type)         => apiClient.get(`${BASE}/reference/${type}`),
  create: (type, data)   => apiClient.post(`${BASE}/reference/${type}`, data),
  update: (type, id, data) => apiClient.put(`${BASE}/reference/${type}/${id}`, data),
  remove: (type, id)     => apiClient.delete(`${BASE}/reference/${type}/${id}`),
};

// ──── Portfolios ──────────────────────────────────────────────────────
export const portfolioApi = {
  list:   ()           => apiClient.get(`${BASE}/portfolios`),
  get:    (id)         => apiClient.get(`${BASE}/portfolios/${id}`),
  create: (data)       => apiClient.post(`${BASE}/portfolios`, data),
  update: (id, data)   => apiClient.put(`${BASE}/portfolios/${id}`, data),
  remove: (id)         => apiClient.delete(`${BASE}/portfolios/${id}`),
};

// ──── Programmes ──────────────────────────────────────────────────────
export const programmeApi = {
  list:            ()                        => apiClient.get(`${BASE}/portfolios/programmes`),
  listByPortfolio: (portfolioId)             => apiClient.get(`${BASE}/portfolios/${portfolioId}/programmes`),
  get:             (id)                      => apiClient.get(`${BASE}/portfolios/programmes/${id}`),
  create:          (data)                    => apiClient.post(`${BASE}/portfolios/programmes`, data),
  update:          (id, data)                => apiClient.put(`${BASE}/portfolios/programmes/${id}`, data),
  remove:          (id)                      => apiClient.delete(`${BASE}/portfolios/programmes/${id}`),
  listMembers:     (programmeId)             => apiClient.get(`${BASE}/portfolios/programmes/${programmeId}/members`),
  addMember:       (programmeId, data)       => apiClient.post(`${BASE}/portfolios/programmes/${programmeId}/members`, data),
  updateMember:    (programmeId, mId, data)  => apiClient.put(`${BASE}/portfolios/programmes/${programmeId}/members/${mId}`, data),
  removeMember:    (programmeId, mId)        => apiClient.delete(`${BASE}/portfolios/programmes/${programmeId}/members/${mId}`),
};

// ──── Templates ───────────────────────────────────────────────────────
export const templateApi = {
  list:             ()                    => apiClient.get(`${BASE}/templates`),
  get:              (id)                  => apiClient.get(`${BASE}/templates/${id}`),
  create:           (data)               => apiClient.post(`${BASE}/templates`, data),
  update:           (id, data)           => apiClient.put(`${BASE}/templates/${id}`, data),
  remove:           (id)                 => apiClient.delete(`${BASE}/templates/${id}`),
  listPhases:       (tId)                => apiClient.get(`${BASE}/templates/${tId}/phases`),
  addPhase:         (tId, data)          => apiClient.post(`${BASE}/templates/${tId}/phases`, data),
  removePhase:      (tId, pId)           => apiClient.delete(`${BASE}/templates/${tId}/phases/${pId}`),
  listMilestones:   (tId)                => apiClient.get(`${BASE}/templates/${tId}/milestones`),
  addMilestone:     (tId, data)          => apiClient.post(`${BASE}/templates/${tId}/milestones`, data),
  removeMilestone:  (tId, mId)           => apiClient.delete(`${BASE}/templates/${tId}/milestones/${mId}`),
  listTasks:        (tId)                => apiClient.get(`${BASE}/templates/${tId}/tasks`),
  addTask:          (tId, data)          => apiClient.post(`${BASE}/templates/${tId}/tasks`, data),
  removeTask:       (tId, taskId)        => apiClient.delete(`${BASE}/templates/${tId}/tasks/${taskId}`),
};

// ──── Projects ────────────────────────────────────────────────────────
export const projectApi = {
  list:               ()                        => apiClient.get(`${BASE}/projects`),
  get:                (id)                      => apiClient.get(`${BASE}/projects/${id}`),
  create:             (data)                    => apiClient.post(`${BASE}/projects`, data),
  update:             (id, data)                => apiClient.put(`${BASE}/projects/${id}`, data),
  remove:             (id)                      => apiClient.delete(`${BASE}/projects/${id}`),
  // Members
  listMembers:        (pId)                     => apiClient.get(`${BASE}/projects/${pId}/members`),
  addMember:          (pId, data)               => apiClient.post(`${BASE}/projects/${pId}/members`, data),
  updateMember:       (pId, mId, data)          => apiClient.put(`${BASE}/projects/${pId}/members/${mId}`, data),
  removeMember:       (pId, mId)                => apiClient.delete(`${BASE}/projects/${pId}/members/${mId}`),
  // Stakeholders
  listStakeholders:   (pId)                     => apiClient.get(`${BASE}/projects/${pId}/stakeholders`),
  addStakeholder:     (pId, data)               => apiClient.post(`${BASE}/projects/${pId}/stakeholders`, data),
  updateStakeholder:  (pId, sId, data)          => apiClient.put(`${BASE}/projects/${pId}/stakeholders/${sId}`, data),
  removeStakeholder:  (pId, sId)                => apiClient.delete(`${BASE}/projects/${pId}/stakeholders/${sId}`),
  // Phases
  listPhases:         (pId)                     => apiClient.get(`${BASE}/projects/${pId}/phases`),
  addPhase:           (pId, data)               => apiClient.post(`${BASE}/projects/${pId}/phases`, data),
  updatePhase:        (pId, phId, data)         => apiClient.put(`${BASE}/projects/${pId}/phases/${phId}`, data),
  removePhase:        (pId, phId)               => apiClient.delete(`${BASE}/projects/${pId}/phases/${phId}`),
  // Milestones
  listMilestones:     (pId)                     => apiClient.get(`${BASE}/projects/${pId}/milestones`),
  addMilestone:       (pId, data)               => apiClient.post(`${BASE}/projects/${pId}/milestones`, data),
  updateMilestone:    (pId, mId, data)          => apiClient.put(`${BASE}/projects/${pId}/milestones/${mId}`, data),
  removeMilestone:    (pId, mId)                => apiClient.delete(`${BASE}/projects/${pId}/milestones/${mId}`),
  // Calendars
  listCalendars:      (pId)                     => apiClient.get(`${BASE}/projects/${pId}/calendars`),
  addCalendar:        (pId, data)               => apiClient.post(`${BASE}/projects/${pId}/calendars`, data),
  // Dependencies
  listDependencies:   (pId)                     => apiClient.get(`${BASE}/projects/${pId}/dependencies`),
  addDependency:      (pId, data)               => apiClient.post(`${BASE}/projects/${pId}/dependencies`, data),
  removeDependency:   (pId, dId)                => apiClient.delete(`${BASE}/projects/${pId}/dependencies/${dId}`),
};

// ──── Tasks / WBS ──────────────────────────────────────────────────────
export const taskApi = {
  listWBS:             (projectId)              => apiClient.get(`${BASE}/tasks/wbs?project_id=${projectId}`),
  getWBS:              (id)                     => apiClient.get(`${BASE}/tasks/wbs/${id}`),
  createWBS:           (data)                   => apiClient.post(`${BASE}/tasks/wbs`, data),
  updateWBS:           (id, data)               => apiClient.put(`${BASE}/tasks/wbs/${id}`, data),
  removeWBS:           (id)                     => apiClient.delete(`${BASE}/tasks/wbs/${id}`),
  list:                (projectId)              => apiClient.get(`${BASE}/tasks?project_id=${projectId}`),
  get:                 (id)                     => apiClient.get(`${BASE}/tasks/${id}`),
  create:              (data)                   => apiClient.post(`${BASE}/tasks`, data),
  update:              (id, data)               => apiClient.put(`${BASE}/tasks/${id}`, data),
  remove:              (id)                     => apiClient.delete(`${BASE}/tasks/${id}`),
  listAssignments:     (taskId)                 => apiClient.get(`${BASE}/tasks/${taskId}/assignments`),
  addAssignment:       (taskId, data)           => apiClient.post(`${BASE}/tasks/${taskId}/assignments`, data),
  updateAssignment:    (taskId, aId, data)      => apiClient.put(`${BASE}/tasks/${taskId}/assignments/${aId}`, data),
  removeAssignment:    (taskId, aId)            => apiClient.delete(`${BASE}/tasks/${taskId}/assignments/${aId}`),
  listChecklist:       (taskId)                 => apiClient.get(`${BASE}/tasks/${taskId}/checklist`),
  addChecklistItem:    (taskId, data)           => apiClient.post(`${BASE}/tasks/${taskId}/checklist`, data),
  updateChecklistItem: (taskId, cId, data)      => apiClient.put(`${BASE}/tasks/${taskId}/checklist/${cId}`, data),
  removeChecklistItem: (taskId, cId)            => apiClient.delete(`${BASE}/tasks/${taskId}/checklist/${cId}`),
  listComments:        (taskId)                 => apiClient.get(`${BASE}/tasks/${taskId}/comments`),
  addComment:          (taskId, data)           => apiClient.post(`${BASE}/tasks/${taskId}/comments`, data),
  listDependencies:    (taskId)                 => apiClient.get(`${BASE}/tasks/${taskId}/dependencies`),
  addDependency:       (taskId, data)           => apiClient.post(`${BASE}/tasks/${taskId}/dependencies`, data),
  removeDependency:    (taskId, dId)            => apiClient.delete(`${BASE}/tasks/${taskId}/dependencies/${dId}`),
};

// ──── Agile ────────────────────────────────────────────────────────────
export const agileApi = {
  listBoards:      (projectId)          => apiClient.get(`${BASE}/agile/boards?project_id=${projectId}`),
  getBoard:        (id)                 => apiClient.get(`${BASE}/agile/boards/${id}`),
  createBoard:     (data)              => apiClient.post(`${BASE}/agile/boards`, data),
  updateBoard:     (id, data)          => apiClient.put(`${BASE}/agile/boards/${id}`, data),
  removeBoard:     (id)                => apiClient.delete(`${BASE}/agile/boards/${id}`),
  listSprints:     (boardId)           => apiClient.get(`${BASE}/agile/boards/${boardId}/sprints`),
  getSprint:       (id)                => apiClient.get(`${BASE}/agile/sprints/${id}`),
  createSprint:    (boardId, data)     => apiClient.post(`${BASE}/agile/boards/${boardId}/sprints`, data),
  updateSprint:    (id, data)          => apiClient.put(`${BASE}/agile/sprints/${id}`, data),
  removeSprint:    (id)                => apiClient.delete(`${BASE}/agile/sprints/${id}`),
  listSprintGoals: (sprintId)          => apiClient.get(`${BASE}/agile/sprints/${sprintId}/goals`),
  addSprintGoal:   (sprintId, data)    => apiClient.post(`${BASE}/agile/sprints/${sprintId}/goals`, data),
  listBacklog:     (projectId, sprintId) =>
    apiClient.get(`${BASE}/agile/backlog?project_id=${projectId}${sprintId ? `&sprint_id=${sprintId}` : ''}`),
  getBacklogItem:  (id)                => apiClient.get(`${BASE}/agile/backlog/${id}`),
  createBacklogItem:(data)             => apiClient.post(`${BASE}/agile/backlog`, data),
  updateBacklogItem:(id, data)         => apiClient.put(`${BASE}/agile/backlog/${id}`, data),
  removeBacklogItem:(id)               => apiClient.delete(`${BASE}/agile/backlog/${id}`),
  listStories:     (projectId)         => apiClient.get(`${BASE}/agile/stories?project_id=${projectId}`),
  getStory:        (id)                => apiClient.get(`${BASE}/agile/stories/${id}`),
  createStory:     (data)              => apiClient.post(`${BASE}/agile/stories`, data),
  updateStory:     (id, data)          => apiClient.put(`${BASE}/agile/stories/${id}`, data),
  removeStory:     (id)                => apiClient.delete(`${BASE}/agile/stories/${id}`),
  listStoryTasks:  (storyId)           => apiClient.get(`${BASE}/agile/stories/${storyId}/tasks`),
  addStoryTask:    (storyId, data)     => apiClient.post(`${BASE}/agile/stories/${storyId}/tasks`, data),
};

// ──── Resources ────────────────────────────────────────────────────────
export const resourceApi = {
  list:              ()                 => apiClient.get(`${BASE}/resources`),
  get:               (id)              => apiClient.get(`${BASE}/resources/${id}`),
  create:            (data)            => apiClient.post(`${BASE}/resources`, data),
  update:            (id, data)        => apiClient.put(`${BASE}/resources/${id}`, data),
  remove:            (id)              => apiClient.delete(`${BASE}/resources/${id}`),
  listAllocations:   (resourceId)      => apiClient.get(`${BASE}/resources/${resourceId}/allocations`),
  createAllocation:  (resourceId, data)=> apiClient.post(`${BASE}/resources/${resourceId}/allocations`, data),
  updateAllocation:  (rId, aId, data)  => apiClient.put(`${BASE}/resources/${rId}/allocations/${aId}`, data),
  removeAllocation:  (rId, aId)        => apiClient.delete(`${BASE}/resources/${rId}/allocations/${aId}`),
  listAvailability:  (resourceId)      => apiClient.get(`${BASE}/resources/${resourceId}/availability`),
  setAvailability:   (resourceId, data)=> apiClient.post(`${BASE}/resources/${resourceId}/availability`, data),
  listTimesheets:    (userId)          => apiClient.get(`${BASE}/resources/timesheets${userId ? `?user_id=${userId}` : ''}`),
  getTimesheet:      (id)              => apiClient.get(`${BASE}/resources/timesheets/${id}`),
  createTimesheet:   (data)            => apiClient.post(`${BASE}/resources/timesheets`, data),
  submitTimesheet:   (id)              => apiClient.post(`${BASE}/resources/timesheets/${id}/submit`, { timesheet_id: id }),
  approveTimesheet:  (id, data)        => apiClient.post(`${BASE}/resources/timesheets/${id}/approve`, data),
  removeTimesheet:   (id)              => apiClient.delete(`${BASE}/resources/timesheets/${id}`),
  listEntries:       (timesheetId)     => apiClient.get(`${BASE}/resources/timesheets/${timesheetId}/entries`),
  addEntry:          (timesheetId, data)=> apiClient.post(`${BASE}/resources/timesheets/${timesheetId}/entries`, data),
  updateEntry:       (tId, eId, data)  => apiClient.put(`${BASE}/resources/timesheets/${tId}/entries/${eId}`, data),
  removeEntry:       (tId, eId)        => apiClient.delete(`${BASE}/resources/timesheets/${tId}/entries/${eId}`),
};

// ──── Financials ────────────────────────────────────────────────────────
export const financialApi = {
  listBudgets:       (projectId)       => apiClient.get(`${BASE}/financials/budgets?project_id=${projectId}`),
  getBudget:         (id)              => apiClient.get(`${BASE}/financials/budgets/${id}`),
  createBudget:      (data)            => apiClient.post(`${BASE}/financials/budgets`, data),
  updateBudget:      (id, data)        => apiClient.put(`${BASE}/financials/budgets/${id}`, data),
  submitBudget:      (id)              => apiClient.post(`${BASE}/financials/budgets/${id}/submit`, { project_budget_id: id }),
  removeBudget:      (id)              => apiClient.delete(`${BASE}/financials/budgets/${id}`),
  listBudgetLines:   (budgetId)        => apiClient.get(`${BASE}/financials/budgets/${budgetId}/lines`),
  addBudgetLine:     (budgetId, data)  => apiClient.post(`${BASE}/financials/budgets/${budgetId}/lines`, data),
  updateBudgetLine:  (bId, lId, data)  => apiClient.put(`${BASE}/financials/budgets/${bId}/lines/${lId}`, data),
  removeBudgetLine:  (bId, lId)        => apiClient.delete(`${BASE}/financials/budgets/${bId}/lines/${lId}`),
  listCosts:         (projectId)       => apiClient.get(`${BASE}/financials/costs?project_id=${projectId}`),
  createCost:        (data)            => apiClient.post(`${BASE}/financials/costs`, data),
  updateCost:        (id, data)        => apiClient.put(`${BASE}/financials/costs/${id}`, data),
  removeCost:        (id)              => apiClient.delete(`${BASE}/financials/costs/${id}`),
  listRevenue:       (projectId)       => apiClient.get(`${BASE}/financials/revenue?project_id=${projectId}`),
  createRevenue:     (data)            => apiClient.post(`${BASE}/financials/revenue`, data),
  updateRevenue:     (id, data)        => apiClient.put(`${BASE}/financials/revenue/${id}`, data),
  removeRevenue:     (id)              => apiClient.delete(`${BASE}/financials/revenue/${id}`),
  listFundingSources:()                => apiClient.get(`${BASE}/financials/funding-sources`),
  createFundingSource:(data)           => apiClient.post(`${BASE}/financials/funding-sources`, data),
  listGrants:        (projectId)       => apiClient.get(`${BASE}/financials/grants?project_id=${projectId}`),
  createGrant:       (data)            => apiClient.post(`${BASE}/financials/grants`, data),
};

// ──── Procurement ──────────────────────────────────────────────────────
export const procurementApi = {
  listRequests:          (projectId)   => apiClient.get(`${BASE}/procurement/requests?project_id=${projectId}`),
  getRequest:            (id)          => apiClient.get(`${BASE}/procurement/requests/${id}`),
  createRequest:         (data)        => apiClient.post(`${BASE}/procurement/requests`, data),
  updateRequest:         (id, data)    => apiClient.put(`${BASE}/procurement/requests/${id}`, data),
  submitRequest:         (id)          => apiClient.post(`${BASE}/procurement/requests/${id}/submit`, { procurement_request_id: id }),
  removeRequest:         (id)          => apiClient.delete(`${BASE}/procurement/requests/${id}`),
  listRequestItems:      (reqId)       => apiClient.get(`${BASE}/procurement/requests/${reqId}/items`),
  addRequestItem:        (reqId, data) => apiClient.post(`${BASE}/procurement/requests/${reqId}/items`, data),
  updateRequestItem:     (rId, iId, d) => apiClient.put(`${BASE}/procurement/requests/${rId}/items/${iId}`, d),
  removeRequestItem:     (rId, iId)    => apiClient.delete(`${BASE}/procurement/requests/${rId}/items/${iId}`),
  listContracts:         (projectId)   => apiClient.get(`${BASE}/procurement/contracts?project_id=${projectId}`),
  getContract:           (id)          => apiClient.get(`${BASE}/procurement/contracts/${id}`),
  createContract:        (data)        => apiClient.post(`${BASE}/procurement/contracts`, data),
  updateContract:        (id, data)    => apiClient.put(`${BASE}/procurement/contracts/${id}`, data),
  removeContract:        (id)          => apiClient.delete(`${BASE}/procurement/contracts/${id}`),
  listContractMilestones:(contractId)  => apiClient.get(`${BASE}/procurement/contracts/${contractId}/milestones`),
  addContractMilestone:  (cId, data)   => apiClient.post(`${BASE}/procurement/contracts/${cId}/milestones`, data),
  updateContractMilestone:(cId,mId,d)  => apiClient.put(`${BASE}/procurement/contracts/${cId}/milestones/${mId}`, d),
  listVariations:        (contractId)  => apiClient.get(`${BASE}/procurement/contracts/${contractId}/variations`),
  addVariation:          (cId, data)   => apiClient.post(`${BASE}/procurement/contracts/${cId}/variations`, data),
  updateVariation:       (cId, vId, d) => apiClient.put(`${BASE}/procurement/contracts/${cId}/variations/${vId}`, d),
};

// ──── Construction ──────────────────────────────────────────────────────
export const constructionApi = {
  listDrawings:      (projectId)       => apiClient.get(`${BASE}/construction/drawings?project_id=${projectId}`),
  getDrawing:        (id)              => apiClient.get(`${BASE}/construction/drawings/${id}`),
  createDrawing:     (data)            => apiClient.post(`${BASE}/construction/drawings`, data),
  updateDrawing:     (id, data)        => apiClient.put(`${BASE}/construction/drawings/${id}`, data),
  removeDrawing:     (id)              => apiClient.delete(`${BASE}/construction/drawings/${id}`),
  listRevisions:     (drawingId)       => apiClient.get(`${BASE}/construction/drawings/${drawingId}/revisions`),
  addRevision:       (drawingId, data) => apiClient.post(`${BASE}/construction/drawings/${drawingId}/revisions`, data),
  listRFIs:          (projectId)       => apiClient.get(`${BASE}/construction/rfis?project_id=${projectId}`),
  getRFI:            (id)              => apiClient.get(`${BASE}/construction/rfis/${id}`),
  createRFI:         (data)            => apiClient.post(`${BASE}/construction/rfis`, data),
  updateRFI:         (id, data)        => apiClient.put(`${BASE}/construction/rfis/${id}`, data),
  removeRFI:         (id)              => apiClient.delete(`${BASE}/construction/rfis/${id}`),
  listSubmittals:    (projectId)       => apiClient.get(`${BASE}/construction/submittals?project_id=${projectId}`),
  createSubmittal:   (data)            => apiClient.post(`${BASE}/construction/submittals`, data),
  updateSubmittal:   (id, data)        => apiClient.put(`${BASE}/construction/submittals/${id}`, data),
  listInspections:   (projectId)       => apiClient.get(`${BASE}/construction/inspections?project_id=${projectId}`),
  createInspection:  (data)            => apiClient.post(`${BASE}/construction/inspections`, data),
  updateInspection:  (id, data)        => apiClient.put(`${BASE}/construction/inspections/${id}`, data),
  listSiteDiaries:   (projectId)       => apiClient.get(`${BASE}/construction/site-diaries?project_id=${projectId}`),
  createSiteDiary:   (data)            => apiClient.post(`${BASE}/construction/site-diaries`, data),
  updateSiteDiary:   (id, data)        => apiClient.put(`${BASE}/construction/site-diaries/${id}`, data),
  listEquipmentUsage:(projectId)       => apiClient.get(`${BASE}/construction/equipment-usage?project_id=${projectId}`),
  createEquipmentUsage:(data)          => apiClient.post(`${BASE}/construction/equipment-usage`, data),
  listMaterialUsage: (projectId)       => apiClient.get(`${BASE}/construction/material-usage?project_id=${projectId}`),
  createMaterialUsage:(data)           => apiClient.post(`${BASE}/construction/material-usage`, data),
};

// ──── Risks ─────────────────────────────────────────────────────────────
export const riskApi = {
  list:              (projectId)       => apiClient.get(`${BASE}/risks?project_id=${projectId}`),
  get:               (id)              => apiClient.get(`${BASE}/risks/${id}`),
  create:            (data)            => apiClient.post(`${BASE}/risks`, data),
  update:            (id, data)        => apiClient.put(`${BASE}/risks/${id}`, data),
  remove:            (id)              => apiClient.delete(`${BASE}/risks/${id}`),
  listMitigations:   (riskId)          => apiClient.get(`${BASE}/risks/${riskId}/mitigations`),
  addMitigation:     (riskId, data)    => apiClient.post(`${BASE}/risks/${riskId}/mitigations`, data),
  updateMitigation:  (rId, mId, data)  => apiClient.put(`${BASE}/risks/${rId}/mitigations/${mId}`, data),
  removeMitigation:  (rId, mId)        => apiClient.delete(`${BASE}/risks/${rId}/mitigations/${mId}`),
  listReviews:       (riskId)          => apiClient.get(`${BASE}/risks/${riskId}/reviews`),
  addReview:         (riskId, data)    => apiClient.post(`${BASE}/risks/${riskId}/reviews`, data),
  removeReview:      (rId, rvId)       => apiClient.delete(`${BASE}/risks/${rId}/reviews/${rvId}`),
};

// ──── Issues ────────────────────────────────────────────────────────────
export const issueApi = {
  list:              (projectId)       => apiClient.get(`${BASE}/issues?project_id=${projectId}`),
  get:               (id)              => apiClient.get(`${BASE}/issues/${id}`),
  create:            (data)            => apiClient.post(`${BASE}/issues`, data),
  update:            (id, data)        => apiClient.put(`${BASE}/issues/${id}`, data),
  remove:            (id)              => apiClient.delete(`${BASE}/issues/${id}`),
  listResolutions:   (issueId)         => apiClient.get(`${BASE}/issues/${issueId}/resolutions`),
  addResolution:     (issueId, data)   => apiClient.post(`${BASE}/issues/${issueId}/resolutions`, data),
  updateResolution:  (iId, rId, data)  => apiClient.put(`${BASE}/issues/${iId}/resolutions/${rId}`, data),
};

// ──── Change Requests ──────────────────────────────────────────────────
export const changeRequestApi = {
  list:        (projectId)   => apiClient.get(`${BASE}/change-requests?project_id=${projectId}`),
  get:         (id)          => apiClient.get(`${BASE}/change-requests/${id}`),
  create:      (data)        => apiClient.post(`${BASE}/change-requests`, data),
  update:      (id, data)    => apiClient.put(`${BASE}/change-requests/${id}`, data),
  submit:      (id)          => apiClient.post(`${BASE}/change-requests/${id}/submit`, { change_request_id: id }),
  remove:      (id)          => apiClient.delete(`${BASE}/change-requests/${id}`),
  listImpacts: (id)          => apiClient.get(`${BASE}/change-requests/${id}/impacts`),
  addImpact:   (id, data)    => apiClient.post(`${BASE}/change-requests/${id}/impacts`, data),
  updateImpact:(cId, iId, d) => apiClient.put(`${BASE}/change-requests/${cId}/impacts/${iId}`, d),
  removeImpact:(cId, iId)    => apiClient.delete(`${BASE}/change-requests/${cId}/impacts/${iId}`),
};

// ──── Quality ──────────────────────────────────────────────────────────
export const qualityApi = {
  listChecks:         (projectId)     => apiClient.get(`${BASE}/quality/checks?project_id=${projectId}`),
  createCheck:        (data)          => apiClient.post(`${BASE}/quality/checks`, data),
  updateCheck:        (id, data)      => apiClient.put(`${BASE}/quality/checks/${id}`, data),
  removeCheck:        (id)            => apiClient.delete(`${BASE}/quality/checks/${id}`),
  listNCRs:           (projectId)     => apiClient.get(`${BASE}/quality/ncrs?project_id=${projectId}`),
  createNCR:          (data)          => apiClient.post(`${BASE}/quality/ncrs`, data),
  updateNCR:          (id, data)      => apiClient.put(`${BASE}/quality/ncrs/${id}`, data),
  removeNCR:          (id)            => apiClient.delete(`${BASE}/quality/ncrs/${id}`),
  listCorrectiveActions:(ncrId)       => apiClient.get(`${BASE}/quality/ncrs/${ncrId}/corrective-actions`),
  addCorrectiveAction:(ncrId, data)   => apiClient.post(`${BASE}/quality/ncrs/${ncrId}/corrective-actions`, data),
  updateCorrectiveAction:(nId, aId, d)=> apiClient.put(`${BASE}/quality/ncrs/${nId}/corrective-actions/${aId}`, d),
};

// ──── Software Dev ──────────────────────────────────────────────────────
export const softwareDevApi = {
  listReleases:    (projectId)        => apiClient.get(`${BASE}/software-dev/releases?project_id=${projectId}`),
  getRelease:      (id)               => apiClient.get(`${BASE}/software-dev/releases/${id}`),
  createRelease:   (data)             => apiClient.post(`${BASE}/software-dev/releases`, data),
  updateRelease:   (id, data)         => apiClient.put(`${BASE}/software-dev/releases/${id}`, data),
  removeRelease:   (id)               => apiClient.delete(`${BASE}/software-dev/releases/${id}`),
  listDefects:     (projectId)        => apiClient.get(`${BASE}/software-dev/defects?project_id=${projectId}`),
  createDefect:    (data)             => apiClient.post(`${BASE}/software-dev/defects`, data),
  updateDefect:    (id, data)         => apiClient.put(`${BASE}/software-dev/defects/${id}`, data),
  listTestCases:   (projectId)        => apiClient.get(`${BASE}/software-dev/test-cases?project_id=${projectId}`),
  createTestCase:  (data)             => apiClient.post(`${BASE}/software-dev/test-cases`, data),
  updateTestCase:  (id, data)         => apiClient.put(`${BASE}/software-dev/test-cases/${id}`, data),
  listExecutions:  (testCaseId)       => apiClient.get(`${BASE}/software-dev/test-cases/${testCaseId}/executions`),
  addExecution:    (testCaseId, data) => apiClient.post(`${BASE}/software-dev/test-cases/${testCaseId}/executions`, data),
  listDeployments: (releaseId)        => apiClient.get(`${BASE}/software-dev/releases/${releaseId}/deployments`),
  createDeployment:(releaseId, data)  => apiClient.post(`${BASE}/software-dev/releases/${releaseId}/deployments`, data),
  updateDeployment:(rId, dId, data)   => apiClient.put(`${BASE}/software-dev/releases/${rId}/deployments/${dId}`, data),
};

// ──── Meetings ──────────────────────────────────────────────────────────
export const meetingApi = {
  list:              (projectId)      => apiClient.get(`${BASE}/meetings?project_id=${projectId}`),
  get:               (id)             => apiClient.get(`${BASE}/meetings/${id}`),
  create:            (data)           => apiClient.post(`${BASE}/meetings`, data),
  update:            (id, data)       => apiClient.put(`${BASE}/meetings/${id}`, data),
  remove:            (id)             => apiClient.delete(`${BASE}/meetings/${id}`),
  listAttendees:     (meetingId)      => apiClient.get(`${BASE}/meetings/${meetingId}/attendees`),
  addAttendee:       (meetingId, data)=> apiClient.post(`${BASE}/meetings/${meetingId}/attendees`, data),
  updateAttendee:    (mId, aId, data) => apiClient.put(`${BASE}/meetings/${mId}/attendees/${aId}`, data),
  removeAttendee:    (mId, aId)       => apiClient.delete(`${BASE}/meetings/${mId}/attendees/${aId}`),
  listActionItems:   (meetingId)      => apiClient.get(`${BASE}/meetings/${meetingId}/action-items`),
  addActionItem:     (meetingId, data)=> apiClient.post(`${BASE}/meetings/${meetingId}/action-items`, data),
  updateActionItem:  (mId, iId, data) => apiClient.put(`${BASE}/meetings/${mId}/action-items/${iId}`, data),
  removeActionItem:  (mId, iId)       => apiClient.delete(`${BASE}/meetings/${mId}/action-items/${iId}`),
  listAnnouncements: (projectId)      => apiClient.get(`${BASE}/meetings/announcements?project_id=${projectId}`),
  createAnnouncement:(data)           => apiClient.post(`${BASE}/meetings/announcements`, data),
  updateAnnouncement:(id, data)       => apiClient.put(`${BASE}/meetings/announcements/${id}`, data),
  removeAnnouncement:(id)             => apiClient.delete(`${BASE}/meetings/announcements/${id}`),
};

// ──── Reporting ──────────────────────────────────────────────────────────
export const reportingApi = {
  listStatusReports:  (projectId)     => apiClient.get(`${BASE}/reporting/status-reports?project_id=${projectId}`),
  getStatusReport:    (id)            => apiClient.get(`${BASE}/reporting/status-reports/${id}`),
  createStatusReport: (data)          => apiClient.post(`${BASE}/reporting/status-reports`, data),
  updateStatusReport: (id, data)      => apiClient.put(`${BASE}/reporting/status-reports/${id}`, data),
  submitStatusReport: (id)            => apiClient.post(`${BASE}/reporting/status-reports/${id}/submit`),
  removeStatusReport: (id)            => apiClient.delete(`${BASE}/reporting/status-reports/${id}`),
  listKPIs:           (projectId)     => apiClient.get(`${BASE}/reporting/kpis?project_id=${projectId}`),
  getKPI:             (id)            => apiClient.get(`${BASE}/reporting/kpis/${id}`),
  createKPI:          (data)          => apiClient.post(`${BASE}/reporting/kpis`, data),
  updateKPI:          (id, data)      => apiClient.put(`${BASE}/reporting/kpis/${id}`, data),
  removeKPI:          (id)            => apiClient.delete(`${BASE}/reporting/kpis/${id}`),
  listKPIReadings:    (kpiId)         => apiClient.get(`${BASE}/reporting/kpis/${kpiId}/readings`),
  addKPIReading:      (kpiId, data)   => apiClient.post(`${BASE}/reporting/kpis/${kpiId}/readings`, data),
  updateKPIReading:   (kId, rId, d)   => apiClient.put(`${BASE}/reporting/kpis/${kId}/readings/${rId}`, d),
  removeKPIReading:   (kId, rId)      => apiClient.delete(`${BASE}/reporting/kpis/${kId}/readings/${rId}`),
  listLessons:        (projectId)     => apiClient.get(`${BASE}/reporting/lessons?project_id=${projectId}`),
  getLesson:          (id)            => apiClient.get(`${BASE}/reporting/lessons/${id}`),
  createLesson:       (data)          => apiClient.post(`${BASE}/reporting/lessons`, data),
  updateLesson:       (id, data)      => apiClient.put(`${BASE}/reporting/lessons/${id}`, data),
  removeLesson:       (id)            => apiClient.delete(`${BASE}/reporting/lessons/${id}`),
};

// ──── Integration ────────────────────────────────────────────────────────
export const integrationApi = {
  listApprovals:    (entityType, entityId) => apiClient.get(`${BASE}/integration/approval-requests?entity_type=${entityType}&entity_id=${entityId}`),
  getApproval:      (id)                   => apiClient.get(`${BASE}/integration/approval-requests/${id}`),
  createApproval:   (data)                 => apiClient.post(`${BASE}/integration/approval-requests`, data),
  updateApproval:   (id, data)             => apiClient.put(`${BASE}/integration/approval-requests/${id}`, data),
  removeApproval:   (id)                   => apiClient.delete(`${BASE}/integration/approval-requests/${id}`),
  listExternalRefs: (entityType, entityId, system) =>
    apiClient.get(`${BASE}/integration/external-references?entity_type=${entityType}&entity_id=${entityId}${system ? `&external_system=${system}` : ''}`),
  getExternalRef:   (id)                   => apiClient.get(`${BASE}/integration/external-references/${id}`),
  createExternalRef:(data)                 => apiClient.post(`${BASE}/integration/external-references`, data),
  updateExternalRef:(id, data)             => apiClient.put(`${BASE}/integration/external-references/${id}`, data),
  removeExternalRef:(id)                   => apiClient.delete(`${BASE}/integration/external-references/${id}`),
};

// ──── Documents ──────────────────────────────────────────────────────────
export const documentApi = {
  list:         (projectId)           => apiClient.get(`${BASE}/documents?project_id=${projectId}`),
  get:          (id)                  => apiClient.get(`${BASE}/documents/${id}`),
  create:       (data)                => apiClient.post(`${BASE}/documents`, data),
  update:       (id, data)            => apiClient.put(`${BASE}/documents/${id}`, data),
  remove:       (id)                  => apiClient.delete(`${BASE}/documents/${id}`),
  listVersions: (documentId)          => apiClient.get(`${BASE}/documents/${documentId}/versions`),
  addVersion:   (documentId, data)    => apiClient.post(`${BASE}/documents/${documentId}/versions`, data),
  removeVersion:(documentId, vId)     => apiClient.delete(`${BASE}/documents/${documentId}/versions/${vId}`),
};
