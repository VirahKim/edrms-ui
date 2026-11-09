import apiClient from "./apiClient";

const BASE_URL = "/HRmsAPI/api/Performance";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ==================== DASHBOARDS ====================

export const getHRDashboard = async () => {
  const response = await apiClient.get(`${BASE_URL}/dashboard/hr`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getEmployeeDashboard = async () => {
  const response = await apiClient.get(`${BASE_URL}/dashboard/employee`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getManagerDashboard = async () => {
  const response = await apiClient.get(`${BASE_URL}/dashboard/manager`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== CYCLES ====================

export const createCycle = async (cycleData) => {
  const response = await apiClient.post(`${BASE_URL}/cycles`, cycleData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCycle = async (id) => {
  const response = await apiClient.get(`${BASE_URL}/cycles/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCycles = async (params = {}) => {
  const response = await apiClient.get(`${BASE_URL}/cycles`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const updateCycle = async (id, cycleData) => {
  const response = await apiClient.put(`${BASE_URL}/cycles/${id}`, cycleData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const initializeReviews = async (cycleId) => {
  const response = await apiClient.post(
    `${BASE_URL}/cycles/${cycleId}/initialize-reviews`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// ==================== COMPETENCIES ====================

export const createCompetency = async (competencyData) => {
  const response = await apiClient.post(`${BASE_URL}/competencies`, competencyData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCompetency = async (id) => {
  const response = await apiClient.get(`${BASE_URL}/competencies/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCompetencies = async (params = {}) => {
  const response = await apiClient.get(`${BASE_URL}/competencies`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const updateCompetency = async (id, competencyData) => {
  const response = await apiClient.put(`${BASE_URL}/competencies/${id}`, competencyData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== GOALS ====================

export const createGoal = async (goalData) => {
  const response = await apiClient.post(`${BASE_URL}/goals`, goalData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getGoal = async (id) => {
  const response = await apiClient.get(`${BASE_URL}/goals/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getGoals = async (params = {}) => {
  const response = await apiClient.get(`${BASE_URL}/goals`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const updateGoal = async (id, goalData) => {
  const response = await apiClient.put(`${BASE_URL}/goals/${id}`, goalData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getMyGoals = async (params = {}) => {
  const response = await apiClient.get(`${BASE_URL}/goals/my-goals`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getPendingGoalApprovals = async () => {
  const response = await apiClient.get(`${BASE_URL}/goals/pending-approvals`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const approveGoal = async (goalId, approvalData) => {
  const response = await apiClient.post(`${BASE_URL}/goals/${goalId}/approve`, approvalData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== REVIEWERS ====================

export const assignReviewer = async (reviewerData) => {
  const response = await apiClient.post(`${BASE_URL}/reviewers`, reviewerData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const assignReviewersBulk = async (bulkData) => {
  const response = await apiClient.post(`${BASE_URL}/reviewers/bulk`, bulkData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getReviewers = async (reviewId) => {
  const response = await apiClient.get(`${BASE_URL}/reviews/${reviewId}/reviewers`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== CHECK-INS ====================

export const createCheckIn = async (checkInData) => {
  const response = await apiClient.post(`${BASE_URL}/check-ins`, checkInData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getCheckIns = async (reviewId) => {
  const response = await apiClient.get(`${BASE_URL}/reviews/${reviewId}/check-ins`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== REVIEWS ====================

export const getReviews = async (params = {}) => {
  const response = await apiClient.get(`${BASE_URL}/reviews/hr`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getReview = async (id) => {
  const response = await apiClient.get(`${BASE_URL}/reviews/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getReviewSummary = async (id) => {
  // This gets the full review detail
  const response = await apiClient.get(`${BASE_URL}/reviews/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getManagerReviewSummary = async (id) => {
  const response = await apiClient.get(`${BASE_URL}/reviews/${id}/manager-summary`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const submitSelfReview = async (selfReviewData) => {
  const response = await apiClient.post(`${BASE_URL}/reviews/self-review`, selfReviewData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const submitFeedback = async (reviewId, feedbackData) => {
  const response = await apiClient.post(`${BASE_URL}/reviews/${reviewId}/feedback`, feedbackData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const submitManagerReview = async (reviewId, managerReviewData) => {
  const response = await apiClient.post(`${BASE_URL}/reviews/${reviewId}/manager-review`, managerReviewData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const calibrateReview = async (reviewId, calibrationData) => {
  const response = await apiClient.post(`${BASE_URL}/reviews/${reviewId}/calibrate`, calibrationData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const approveReview = async (approvalData) => {
  const response = await apiClient.post(`${BASE_URL}/reviews/approve`, approvalData, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const acknowledgeReview = async (acknowledgementDataOrId) => {
  // Support two call styles:
  // 1) acknowledgeReview(reviewId)
  // 2) acknowledgeReview({ review_id: reviewId, ... })
  let reviewId;
  let payload = {};
  if (typeof acknowledgementDataOrId === "number") {
    reviewId = acknowledgementDataOrId;
  } else if (acknowledgementDataOrId && typeof acknowledgementDataOrId === "object") {
    reviewId = acknowledgementDataOrId.review_id || acknowledgementDataOrId.reviewId;
    payload = { ...acknowledgementDataOrId };
    delete payload.review_id;
    delete payload.reviewId;
  }

  if (!reviewId) throw new Error("reviewId is required to acknowledge a review");

  const response = await apiClient.post(`${BASE_URL}/reviews/${reviewId}/acknowledge`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ==================== UTILITIES ====================

export const getStaffDropdown = async () => {
  const response = await apiClient.get(`${BASE_URL}/staff-dropdown`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export default {
  // Dashboards
  getHRDashboard,
  getEmployeeDashboard,
  getManagerDashboard,
  
  // Cycles
  createCycle,
  getCycle,
  getCycles,
  updateCycle,
  initializeReviews,
  
  // Competencies
  createCompetency,
  getCompetency,
  getCompetencies,
  updateCompetency,
  
  // Goals
  createGoal,
  getGoal,
  getGoals,
  getMyGoals,
  updateGoal,
  getPendingGoalApprovals,
  approveGoal,
  
  // Reviewers
  assignReviewer,
  assignReviewersBulk,
  getReviewers,
  
  // Check-ins
  createCheckIn,
  getCheckIns,
  
  // Reviews
  getReviews,
  getReview,
  getReviewSummary,
  getManagerReviewSummary,
  submitSelfReview,
  submitFeedback,
  submitManagerReview,
  calibrateReview,
  approveReview,
  acknowledgeReview,
  
  // Utilities
  getStaffDropdown,
};
