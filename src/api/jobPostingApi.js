import apiClient from "./apiClient";

const basePath = "/HRmsAPI/api/JobPosting";

const normalizeListResponse = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const jobPostingApi = {
    async listVacancies(params = {}) {
        const response = await apiClient.get(`${basePath}/vacancies`, { params });
        return {
            items: normalizeListResponse(response.data),
            meta: {
                page: response.data?.page ?? 1,
                limit: response.data?.limit ?? normalizeListResponse(response.data).length
            }
        };
    },

    async getVacancyWithDetails(postingId) {
        const response = await apiClient.get(`${basePath}/vacancies/${postingId}`);
        return response.data;
    },

    // Multi-Recruiter Management
    async assignRecruiters(postingId, data) {
        const response = await apiClient.post(`${basePath}/job-postings/${postingId}/recruiters`, data);
        return response.data;
    },

    async getJobPostingRecruiters(postingId) {
        const response = await apiClient.get(`${basePath}/job-postings/${postingId}/recruiters`);
        return response.data;
    },

    async removeRecruiter(postingId, recruiterId) {
        const response = await apiClient.delete(`${basePath}/job-postings/${postingId}/recruiters/${recruiterId}`);
        return response.data;
    }
};

export default jobPostingApi;
