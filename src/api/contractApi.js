// API Service for Employment Contracts
// Place this in: src/api/contractApi.js

import apiClient from "./apiClient";

const contractApi = {
    // ===== CONTRACT TYPES =====
    getContractTypes: async () => {
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/contract-types");
        return response.data;
    },

    // ===== TEMPLATES =====
    getTemplates: async (contractTypeId = null) => {
        const params = contractTypeId ? { contract_type_id: contractTypeId } : {};
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/templates", { params });
        return response.data;
    },

    getTemplate: async (id) => {
        const response = await apiClient.get(`/HRmsAPI/api/EmploymentContracts/templates/${id}`);
        return response.data;
    },

    createTemplate: async (data) => {
        const response = await apiClient.post("/HRmsAPI/api/EmploymentContracts/templates", data);
        return response.data;
    },

    updateTemplate: async (id, data) => {
        const response = await apiClient.put(`/HRmsAPI/api/EmploymentContracts/templates/${id}`, data);
        return response.data;
    },

    deleteTemplate: async (id) => {
        const response = await apiClient.delete(`/HRmsAPI/api/EmploymentContracts/templates/${id}`);
        return response.data;
    },

    // ===== TEMPLATE VARIABLES =====
    getTemplateVariables: async (category = null) => {
        const params = category ? { category } : {};
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/template-variables", { params });
        return response.data;
    },

    getTemplateVariablesGrouped: async () => {
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/template-variables/grouped");
        return response.data;
    },

    // ===== CONTRACTS =====
    getContracts: async (query) => {
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts", { params: query });
        return response.data;
    },

    getContract: async (id) => {
        const response = await apiClient.get(`/HRmsAPI/api/EmploymentContracts/${id}`);
        return response.data;
    },

    createContract: async (data) => {
        const response = await apiClient.post("/HRmsAPI/api/EmploymentContracts/create", data);
        return response.data;
    },

    updateContract: async (id, data) => {
        const response = await apiClient.put(`/HRmsAPI/api/EmploymentContracts/${id}`, data);
        return response.data;
    },

    deleteContract: async (id) => {
        const response = await apiClient.delete(`/HRmsAPI/api/EmploymentContracts/${id}`);
        return response.data;
    },

    // ===== CONTRACT GENERATION =====
    generateContract: async (id, options = {}) => {
        const response = await apiClient.post(`/HRmsAPI/api/EmploymentContracts/${id}/generate`, options);
        return response.data;
    },

    previewContract: async (contractData) => {
        const response = await apiClient.post("/HRmsAPI/api/EmploymentContracts/preview", contractData);
        return response.data;
    },

    // ===== CONTRACT PREPARATION (New Workflow) =====
    prepareContract: async (staffId, options = {}) => {
        const params = {};
        if (options.contractTypeId) params.contractTypeId = options.contractTypeId;
        if (options.templateId) params.templateId = options.templateId;
        
        const response = await apiClient.get(
            `/HRmsAPI/api/EmploymentContracts/prepare-contract/${staffId}`,
            { params }
        );
        return response.data;
    },

    // ===== SIGNING =====
    signContract: async (id, signatureData) => {
        const response = await apiClient.post(`/HRmsAPI/api/EmploymentContracts/${id}/sign`, signatureData);
        return response.data;
    },

    // ===== CONTRACT TERMINATION =====
    terminateContract: async (id, terminationData) => {
        const response = await apiClient.post(`/HRmsAPI/api/EmploymentContracts/${id}/terminate`, terminationData);
        return response.data;
    },

    // ===== EMPLOYEE SELF-SERVICE =====
    getMyContracts: async (status = null) => {
        const params = status ? { status } : {};
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/my-contracts", { params });
        return response.data;
    },

    getMyContract: async (id) => {
        const response = await apiClient.get(`/HRmsAPI/api/EmploymentContracts/my-contracts/${id}`);
        return response.data;
    },

    signMyContract: async (id, signatureData) => {
        const response = await apiClient.post(`/HRmsAPI/api/EmploymentContracts/my-contracts/${id}/sign`, signatureData);
        return response.data;
    },

    // ===== DOCUMENTS =====
    /**
     * Upload a file document and attach it to a contract.
     * @param {number|string} id  - Contract ID
     * @param {File}   file           - The file object from <input type="file">
     * @param {string} documentType   - Category label, e.g. "signed_contract", "id_copy"
     * @param {string} [documentName] - Display name (defaults to filename on server)
     */
    uploadDocument: async (id, file, documentType, documentName = "") => {
        const form = new FormData();
        form.append("file", file);
        form.append("document_type", documentType);
        form.append("document_name", documentName || file.name);

        const response = await apiClient.post(
            `/HRmsAPI/api/EmploymentContracts/${id}/documents/upload`,
            form,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    },

    getDocuments: async (id) => {
        const response = await apiClient.get(`/HRmsAPI/api/EmploymentContracts/${id}/documents`);
        return response.data;
    },

    /**
     * Returns the download URL for a contract document.
     * Open this URL in a new tab or use an <a> tag to trigger the browser download.
     */
    getDocumentDownloadUrl: (contractId, documentId) => {
        // Strip trailing slash from base URL if present
        const base = apiClient.defaults.baseURL?.replace(/\/$/, "") || "";
        return `${base}/HRmsAPI/api/EmploymentContracts/${contractId}/documents/${documentId}/download`;
    },

    deleteDocument: async (contractId, documentId) => {
        const response = await apiClient.delete(
            `/HRmsAPI/api/EmploymentContracts/${contractId}/documents/${documentId}`
        );
        return response.data;
    },

    // ===== PREPOPULATION =====
    getContractPrepopulationData: async (offerId) => {
        const response = await apiClient.get(`/HRmsAPI/api/EmploymentContracts/prepopulate-from-offer/${offerId}`);
        return response.data;
    },

    // ===== DROPDOWNS =====
    getEmployeesDropdown: async (includeInactive = false) => {
        const params = includeInactive ? { includeInactive: true } : {};
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/dropdowns/employees", { params });
        return response.data;
    },

    getCurrencies: async () => {
        const response = await apiClient.get("/HRmsAPI/api/EmploymentContracts/dropdowns/currencies");
        return response.data;
    }
};

export default contractApi;
