import apiClient from "./apiClient";

const basePath = "/HRmsAPI/api";

const normalizeListResponse = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const recruitmentApi = {
    async listVacancies(params = {}) {
        const response = await apiClient.get(`${basePath}/JobPosting/vacancies`, { params });
        return {
            items: normalizeListResponse(response.data),
            meta: {
                page: response.data?.page ?? 1,
                limit: response.data?.limit ?? normalizeListResponse(response.data).length
            }
        };
    },

    async getVacancyWithDetails(postingId) {
        const response = await apiClient.get(`${basePath}/JobPosting/vacancies/${postingId}`);
        return response.data;
    },

    async createCandidate(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/candidates`, payload);
        return response.data;
    },

    async updateCandidate(id, payload) {
        return apiClient.put(`${basePath}/Recruitment/candidates/${id}`, payload);
    },

    async getCandidate(id) {
        const response = await apiClient.get(`${basePath}/Recruitment/candidates/${id}`);
        return response.data;
    },

    async getMyCandidate() {
        const response = await apiClient.get(`${basePath}/Recruitment/candidates/me`);
        return response.data;
    },

    async searchCandidates(query, page = 1, limit = 10) {
        const response = await apiClient.get(`${basePath}/Recruitment/candidates/search`, {
            params: { q: query, page, limit }
        });
        return normalizeListResponse(response.data);
    },

    async initializeApplication(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/initialize`, payload);
        return response.data;
    },

    async getJobRequirements(applicationId) {
        const response = await apiClient.get(`${basePath}/Recruitment/applications/${applicationId}/job-requirements`);
        return response.data;
    },

    async submitEducationConfirmations(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/education-confirmations`, payload);
        return response.data;
    },

    async submitExperienceConfirmations(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/experience-confirmations`, payload);
        return response.data;
    },

    async submitSkillsConfirmations(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/skill-confirmations`, payload);
        return response.data;
    },

    async submitCertificationConfirmations(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/certification-confirmations`, payload);
        return response.data;
    },

    async submitFinalApplication(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/submit`, payload);
        return response.data;
    },

    async getApplicationProgress(applicationId) {
        const response = await apiClient.get(`${basePath}/Recruitment/applications/${applicationId}/progress`);
        return response.data;
    },

    async getApplicationReview(applicationId) {
        const response = await apiClient.get(`${basePath}/Recruitment/applications/${applicationId}/review`);
        return response.data;
    },

    async submitApplicationReview(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/status-change`, payload);
        return response.data;
    },

    async reviewFormSubmission(submissionId, payload) {
        const response = await apiClient.put(`${basePath}/ApplicationForm/submissions/${submissionId}/review`, payload);
        return response.data;
    },

    async listApplications(params = {}) {
        const response = await apiClient.get(`${basePath}/Recruitment/applications`, { params });
        return response.data;
    },

    async getCandidateApplications(candidateId, params = {}) {
        const response = await apiClient.get(`${basePath}/Recruitment/candidates/${candidateId}/applications`, {
            params
        });
        return response.data;
    },

    async getMyCandidateApplications(params = {}) {
        const response = await apiClient.get(`${basePath}/Recruitment/candidates/me/applications`, {
            params
        });
        return response.data;
    },

    async getApplicationByCode(applicationCode) {
        const response = await apiClient.get(`${basePath}/Recruitment/applications/by-code/${encodeURIComponent(applicationCode)}`);
        return response.data;
    },

    async listDocuments(params = {}) {
        const response = await apiClient.get(`${basePath}/Recruitment/documents`, { params });
        return normalizeListResponse(response.data);
    },

    async uploadDocument(payload) {
        const response = await apiClient.post(`${basePath}/Recruitment/documents`, payload);
        return response.data;
    },

    async deleteDocument(documentId) {
        return apiClient.delete(`${basePath}/Recruitment/documents/${documentId}`);
    },

    // Multi-Recruiter Scoring
    async submitScore(data) {
        const response = await apiClient.post(`${basePath}/Recruitment/applications/recruiter-score`, data);
        return response.data;
    },

    async getApplicationScores(applicationId) {
        const response = await apiClient.get(`${basePath}/Recruitment/applications/${applicationId}/recruiter-scores`);
        return response.data;
    },

    async getApplicationRecruiters(applicationId) {
        const response = await apiClient.get(`${basePath}/InterviewAndAssessment/applications/${applicationId}/recruiters`);
        return response.data;
    },

    async getMyApplications(params = {}) {
        const response = await apiClient.get(`${basePath}/Recruitment/recruiter/my-applications`, { params });
        return response.data;
    }
};

export default recruitmentApi;
