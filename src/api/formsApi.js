import apiClient from "./apiClient";

const basePath = "/HRmsAPI/api/ApplicationForm";

const formsApi = {
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

    // Job Posting Form Assignment (HR)
    async assignFormToPosting(postingId, payload) {
        const response = await apiClient.post(`${basePath}/job-postings/${postingId}/assign-form`, payload);
        return response.data;
    },

    async getPostingFormAssignment(postingId) {
        const response = await apiClient.get(`${basePath}/job-postings/${postingId}/form`);
        return response.data;
    },

    async removeFormAssignment(postingId) {
        const response = await apiClient.delete(`${basePath}/job-postings/${postingId}/form`);
        return response.data;
    },

    // Candidate Form Download & Submission (Public/Candidate)
    async downloadFormForApplication(applicationId) {
        const response = await apiClient.get(`${basePath}/applications/${applicationId}/download-template`);
        return response.data;
    },

    async submitApplicationForm(applicationId, payload) {
        const formData = new FormData();
        
        formData.append('submission_type', payload.submission_type);
        
        if (payload.submission_type === 'template') {
            // Template-based submission
            formData.append('form_data_json', JSON.stringify(payload.form_data));
        } else if (payload.submission_type === 'external') {
            // External form file upload
            if (payload.uploaded_file) {
                formData.append('completed_form_file', payload.uploaded_file);
            }
        }
        
        const response = await apiClient.post(
            `${basePath}/applications/${applicationId}/submit`,
            formData
            // Don't set Content-Type header - browser will set it automatically with boundary
        );
        return response.data;
    },

    async getApplicationFormSubmission(applicationId) {
        const response = await apiClient.get(`${basePath}/applications/${applicationId}/submission`);
        return response.data;
    },

    // HR Review & Management
    async getSubmissionsForPosting(postingId, params = {}) {
        const response = await apiClient.get(`${basePath}/job-postings/${postingId}/submissions`, { params });
        return response.data;
    },

    async getAllSubmissions(params = {}) {
        const response = await apiClient.get(`${basePath}/submissions`, { params });
        return response.data;
    },

    async reviewSubmission(submissionId, payload) {
        const response = await apiClient.put(`${basePath}/submissions/${submissionId}/review`, payload);
        return response.data;
    },

    async getSubmissionDetails(submissionId) {
        const response = await apiClient.get(`${basePath}/submissions/${submissionId}`);
        return response.data;
    }
};

export default formsApi;
