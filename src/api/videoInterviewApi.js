import apiClient from './apiClient';

// Create single video question
export const createVideoQuestion = async (interviewId, questionData) => {
  const response = await apiClient.post('/HRmsAPI/api/videointerview/questions', {
    interview_id: interviewId,
    ...questionData,
  });
  return response.data;
};

// Bulk create video questions
export const bulkCreateVideoQuestions = async (interviewId, questions) => {
  const response = await apiClient.post('/HRmsAPI/api/videointerview/questions/bulk', {
    interview_id: interviewId,
    questions: questions,
  });
  return response.data;
};

// Get video interview progress for candidate
export const getVideoInterviewProgress = async (interviewId) => {
  const response = await apiClient.get(
    `/HRmsAPI/api/videointerview/interviews/${interviewId}/progress`
  );
  return response.data;
};

// Upload video response
export const uploadVideoResponse = async (formData) => {
  const response = await apiClient.post('/HRmsAPI/api/videointerview/responses/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Submit video response
export const submitVideoResponse = async (responseData) => {
  const response = await apiClient.post('/HRmsAPI/api/videointerview/responses/submit', responseData);
  return response.data;
};

// Complete video interview
export const completeVideoInterview = async (sessionId, interviewId) => {
  const response = await apiClient.post('/HRmsAPI/api/videointerview/complete', {
    session_id: sessionId,
    interview_id: interviewId,
  });
  return response.data;
};

// Get video question details
export const getVideoQuestion = async (questionId) => {
  const response = await apiClient.get(`/HRmsAPI/api/videointerview/questions/${questionId}`);
  return response.data;
};

// Get all questions for an interview
export const getVideoQuestionsByInterview = async (interviewId) => {
  const response = await apiClient.get(
    `/HRmsAPI/api/videointerview/interviews/${interviewId}/questions`
  );
  return response.data;
};

// Get video responses for an interview (recruiter view)
export const getVideoResponsesByInterview = async (interviewId) => {
  const response = await apiClient.get(
    `/HRmsAPI/api/videointerview/interviews/${interviewId}/responses`
  );
  return response.data;
};

// Get specific video response
export const getVideoResponse = async (responseId) => {
  const response = await apiClient.get(`/HRmsAPI/api/videointerview/responses/${responseId}`);
  return response.data;
};

// Delete video response
export const deleteVideoResponse = async (responseId) => {
  const response = await apiClient.delete(`/HRmsAPI/api/videointerview/responses/${responseId}`);
  return response.data;
};

// Update video question
export const updateVideoQuestion = async (questionId, questionData) => {
  const response = await apiClient.put(
    `/HRmsAPI/api/videointerview/questions/${questionId}`,
    questionData
  );
  return response.data;
};

// Delete video question
export const deleteVideoQuestion = async (questionId) => {
  const response = await apiClient.delete(`/HRmsAPI/api/videointerview/questions/${questionId}`);
  return response.data;
};

// Reorder video questions
export const reorderVideoQuestions = async (interviewId, questions) => {
  const response = await apiClient.post(
    `/HRmsAPI/api/videointerview/questions/reorder`,
    { 
      interview_id: interviewId,
      question_orders: questions 
    }
  );
  return response.data;
};
