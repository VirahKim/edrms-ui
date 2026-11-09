import apiClient from "./apiClient";

const basePath = "/HRmsAPI/api/Questionnaire";

const questionnaireApi = {
    // Template Management (HR)
    async createTemplate(payload) {
        const response = await apiClient.post(`${basePath}/templates`, payload);
        return response.data;
    },

    async getAllTemplates(params = {}) {
        const response = await apiClient.get(`${basePath}/templates`, { params });
        return response.data;
    },

    async getTemplateDetails(templateId) {
        const response = await apiClient.get(`${basePath}/templates/${templateId}`);
        return response.data;
    },

    async updateTemplate(templateId, payload) {
        const response = await apiClient.put(`${basePath}/templates/${templateId}`, payload);
        return response.data;
    },

    async deleteTemplate(templateId) {
        const response = await apiClient.delete(`${basePath}/templates/${templateId}`);
        return response.data;
    },

    // Job Posting Questionnaire Assignment (HR)
    async assignQuestionnaireToPosting(postingId, payload) {
        const response = await apiClient.post(`${basePath}/job-postings/${postingId}/assign-questionnaire`, payload);
        return response.data;
    },

    async getPostingQuestionnaireConfig(postingId) {
        const response = await apiClient.get(`${basePath}/job-postings/${postingId}/questionnaire`);
        return response.data;
    },

    async updateQuestionnaireConfig(postingId, payload) {
        const response = await apiClient.put(`${basePath}/job-postings/${postingId}/questionnaire`, payload);
        return response.data;
    },

    async removeQuestionnaireAssignment(postingId) {
        const response = await apiClient.delete(`${basePath}/job-postings/${postingId}/questionnaire`);
        return response.data;
    },

    // Candidate Questionnaire Submission (Public/Candidate)
    async downloadQuestionnaireForApplication(applicationId) {
        const response = await apiClient.get(`${basePath}/applications/${applicationId}/download-questionnaire`);
        return response.data;
    },

    async submitQuestionnaire(payload) {
        const response = await apiClient.post(`${basePath}/submit`, payload);
        return response.data;
    },

    async checkQuestionnaireStatus(applicationId) {
        const response = await apiClient.get(`${basePath}/applications/${applicationId}/status`);
        return response.data;
    },

    // HR Scoring & Listing Management
    async getScoringResults(postingId, params = {}) {
        const response = await apiClient.get(`${basePath}/job-postings/${postingId}/scoring-results`, { params });
        return response.data;
    },

    async getCandidateResponse(responseId) {
        const response = await apiClient.get(`${basePath}/responses/${responseId}`);
        return response.data;
    },

    async scoreTextResponse(responseId, payload) {
        const response = await apiClient.put(`${basePath}/responses/${responseId}/score`, payload);
        return response.data;
    },

    async updateListingStatus(responseId, payload) {
        const response = await apiClient.put(`${basePath}/responses/${responseId}/listing-status`, payload);
        return response.data;
    },

    async shortlistFromLonglist(postingId, payload) {
        const response = await apiClient.post(`${basePath}/job-postings/${postingId}/shortlist`, payload);
        return response.data;
    },

    async rejectCandidate(responseId, payload) {
        const response = await apiClient.put(`${basePath}/responses/${responseId}/reject`, payload);
        return response.data;
    }
};

export default questionnaireApi;
