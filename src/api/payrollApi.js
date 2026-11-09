import apiClient from "./apiClient";

const basePath = "/HRmsAPI/api/Payroll";
const referencePath = "/HRmsAPI/api/Payroll/reference";
const employeePath = "/HRmsAPI/api/Payroll/employee";

// Normalize list responses
const normalizeListResponse = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const payrollApi = {
    // ==================== PAYROLL RUNS ====================
    
    async createPayrollRun(payload) {
        const response = await apiClient.post(`${basePath}/run/create`, payload);
        return response.data;
    },

    async getPayrollRuns(params = {}) {
        const response = await apiClient.get(`${basePath}/runs`, { params });
        return normalizeListResponse(response.data);
    },

    async getPayrollRun(id) {
        const response = await apiClient.get(`${basePath}/runs/${id}`);
        return response.data;
    },

    async getLastPayrollRun() {
        const response = await apiClient.get(`${basePath}/run/last`);
        return response.data;
    },

    async approvePayrollRun(payroll_run_id) {
        const response = await apiClient.put(`${basePath}/run/approve`, { payroll_run_id });
        return response.data;
    },

    async submitForApproval(payroll_run_id, reason) {
        const response = await apiClient.put(`${basePath}/run/submit-for-approval`, { payroll_run_id, reason });
        return response.data;
    },

    async postPayrollRun(payroll_run_id) {
        const response = await apiClient.put(`${basePath}/run/post`, { payroll_run_id });
        return response.data;
    },

    async lockPayrollRun(payroll_run_id) {
        const response = await apiClient.put(`${basePath}/run/lock`, { payroll_run_id });
        return response.data;
    },

    async submitUnlockRequest(payroll_run_id, reason) {
        const response = await apiClient.put(`${basePath}/run/submit-unlock-request`, { payroll_run_id, reason });
        return response.data;
    },

    async getUnlockWorkflowStatus(payroll_run_id) {
        const response = await apiClient.get(`${basePath}/run/${payroll_run_id}/unlock-workflow-status`);
        return response.data;
    },

    async cancelUnlockWorkflow(payroll_run_id) {
        const response = await apiClient.put(`${basePath}/run/${payroll_run_id}/cancel-unlock-workflow`);
        return response.data;
    },

    // ==================== PAYROLL ITEMS ====================
    
    async generatePayrollItems(payroll_run_id, staff_ids = [], regenerate = false) {
        const response = await apiClient.post(`${basePath}/run/generate`, {
            payroll_run_id,
            staff_ids,
            regenerate
        });
        return response.data;
    },

    // Deprecated: Use generatePayrollItems instead (unified endpoint)
    async generateEnhancedPayrollItems(payroll_run_id, staff_ids = [], regenerate = false) {
        return this.generatePayrollItems(payroll_run_id, staff_ids, regenerate);
    },

    async getPayrollItems(payroll_run_id) {
        const response = await apiClient.get(`${basePath}/items/${payroll_run_id}`);
        return normalizeListResponse(response.data);
    },

    // Note: The items endpoint already includes components (detailed data)
    async getPayrollItemsDetailed(payroll_run_id) {
        return this.getPayrollItems(payroll_run_id);
    },

    async getPayrollItemsByStaff(staff_id) {
        const response = await apiClient.get(`${basePath}/items/staff/${staff_id}`);
        return normalizeListResponse(response.data);
    },

    async getPayrollAuditLog(payroll_run_id) {
        const response = await apiClient.get(`${basePath}/audit/${payroll_run_id}`);
        return normalizeListResponse(response.data);
    },

    async getEmployeePayslip(payroll_run_id, staff_id) {
        const response = await apiClient.get(`${basePath}/payslip/${payroll_run_id}/staff/${staff_id}`);
        return response.data;
    },

    // ==================== PAYSLIP TEMPLATES ====================
    
    async createTemplate(payload) {
        const response = await apiClient.post(`${basePath}/templates`, payload);
        return response.data;
    },

    async updateTemplate(id, payload) {
        const response = await apiClient.put(`${basePath}/templates/${id}`, payload);
        return response.data;
    },

    async getTemplates() {
        const response = await apiClient.get(`${basePath}/templates`);
        return normalizeListResponse(response.data);
    },

    async getTemplate(id) {
        const response = await apiClient.get(`${basePath}/templates/${id}`);
        return response.data;
    },

    async deleteTemplate(id) {
        const response = await apiClient.delete(`${basePath}/templates/${id}`);
        return response.data;
    },

    // ==================== CHANGE REQUESTS ====================
    
    async requestBasicSalaryChange(payload) {
        const response = await apiClient.post(`${basePath}/change-requests/basic-salary`, payload);
        return response.data;
    },

    async requestBasicSalaryUpdate(id, payload) {
        const response = await apiClient.put(`${basePath}/change-requests/basic-salary/${id}`, payload);
        return response.data;
    },

    async requestAllowanceChange(payload) {
        const response = await apiClient.post(`${basePath}/change-requests/allowances`, payload);
        return response.data;
    },

    async requestAllowanceUpdate(id, payload) {
        const response = await apiClient.put(`${basePath}/change-requests/allowances/${id}`, payload);
        return response.data;
    },

    async requestDeductionChange(payload) {
        const response = await apiClient.post(`${basePath}/change-requests/deductions`, payload);
        return response.data;
    },

    async requestDeductionUpdate(id, payload) {
        const response = await apiClient.put(`${basePath}/change-requests/deductions/${id}`, payload);
        return response.data;
    },

    async requestStatutoryChange(payload) {
        const response = await apiClient.post(`${basePath}/change-requests/statutory`, payload);
        return response.data;
    },

    async requestStatutoryUpdate(id, payload) {
        const response = await apiClient.put(`${basePath}/change-requests/statutory/${id}`, payload);
        return response.data;
    },

    async getChangeRequests(params = {}) {
        const response = await apiClient.get(`${basePath}/change-requests`, { params });
        return normalizeListResponse(response.data);
    },

    async getChangeRequest(id) {
        const response = await apiClient.get(`${basePath}/change-requests/${id}`);
        return response.data;
    },

    async approveChangeRequest(id, payload) {
        const response = await apiClient.put(`${basePath}/change-requests/${id}/approve`, payload);
        return response.data;
    },

    async rejectChangeRequest(id, payload) {
        const response = await apiClient.put(`${basePath}/change-requests/${id}/reject`, payload);
        return response.data;
    },

    async bulkApproveChangeRequests(change_request_ids, review_notes = "") {
        const response = await apiClient.put(`${basePath}/change-requests/bulk-approve`, {
            change_request_ids,
            review_notes
        });
        return response.data;
    },

    // ==================== BASIC SALARY ====================
    
    async getBasicSalaryByStaff(staff_id, is_active = null) {
        const params = is_active !== null ? { is_active } : {};
        const response = await apiClient.get(`${basePath}/basic-salary/staff/${staff_id}`, { params });
        return normalizeListResponse(response.data);
    },

    async getBasicSalaryById(id) {
        const response = await apiClient.get(`${basePath}/basic-salary/${id}`);
        return response.data;
    },

    // ==================== ALLOWANCES ====================
    
    async getAllowancesByStaff(staff_id) {
        const response = await apiClient.get(`${basePath}/allowances/staff/${staff_id}`);
        return normalizeListResponse(response.data);
    },

    async getAllowanceById(id) {
        const response = await apiClient.get(`${basePath}/allowances/${id}`);
        return response.data;
    },

    // ==================== DEDUCTIONS ====================
    
    async getDeductionsByStaff(staff_id) {
        const response = await apiClient.get(`${basePath}/deductions/staff/${staff_id}`);
        return normalizeListResponse(response.data);
    },

    async getDeductionById(id) {
        const response = await apiClient.get(`${basePath}/deductions/${id}`);
        return response.data;
    },

    // ==================== STATUTORY ====================
    
    async getStatutoryByStaff(staff_id) {
        const response = await apiClient.get(`${basePath}/statutory/staff/${staff_id}`);
        return normalizeListResponse(response.data);
    },

    async getStatutoryById(id) {
        const response = await apiClient.get(`${basePath}/statutory/${id}`);
        return response.data;
    },

    // ==================== DROPDOWNS ====================
    
    async getStaffDropdown(params = {}) {
        const response = await apiClient.get(`${basePath}/dropdowns/staff`, { params });
        return normalizeListResponse(response.data);
    },

    // ==================== PAYROLL DATA REPORT ====================
    
    async getPayrollDataReport(params = {}) {
        const response = await apiClient.get(`${basePath}/payroll-data/report`, { params });
        return response.data;
    },

    async getPayrollDataExportFlat(params = {}) {
        const response = await apiClient.get(`${basePath}/payroll-data/export-flat`, { params });
        return response.data;
    },

    // ==================== PAYROLL REPORTS ====================
    
    // P9 Report for a specific employee
    async getP9Report(employeeId, params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/p9/employee/${employeeId}`, { 
            params,
            responseType: params.format === 'excel' ? 'blob' : 'json'
        });
        return response;
    },

    // P9 Report for current logged-in employee
    async getMyP9Report(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/p9/me`, { 
            params,
            responseType: params.format === 'excel' ? 'blob' : 'json'
        });
        return response;
    },

    // P10 Report for specific month
    async getP10Report(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/p10`, { 
            params,
            responseType: params.format === 'excel' || params.format === 'csv' ? 'blob' : 'json'
        });
        return response;
    },

    // Annual P10 Report (all 12 months)
    async getP10AnnualReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/p10/annual`, { 
            params,
            responseType: params.format === 'excel' ? 'blob' : 'json'
        });
        return response;
    },

    // NSSF Report
    async getNSSFReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/nssf`, { 
            params,
            responseType: params.format === 'excel' ? 'blob' : 'json'
        });
        return response;
    },

    // SHIF Report
    async getSHIFReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/shif`, { 
            params,
            responseType: params.format === 'excel' ? 'blob' : 'json'
        });
        return response;
    },

    // Variance Analysis Report
    async getVarianceAnalysisReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/variance-analysis`, { 
            params,
            responseType: 'blob'
        });
        return response;
    },

    // Comprehensive Payroll Summary
    async getPayrollSummaryReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/payroll-summary`, { 
            params,
            responseType: params.format === 'excel' ? 'blob' : 'json'
        });
        return response;
    },

    // Comprehensive Payroll Summary PDF
    async getPayrollSummaryPdfReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/payroll-summary/pdf`, {
            params,
            responseType: 'blob'
        });
        return response;
    },

    // Comprehensive Payroll Summary Workbook
    async getPayrollSummaryWorkbookReport(params = {}) {
        const response = await apiClient.get(`/HRmsAPI/api/PayrollReports/payroll-summary/workbook`, {
            params,
            responseType: 'blob'
        });
        return response;
    },

    async downloadPayslipPdf(payrollRunId, staffId) {
        const response = await apiClient.get(`${basePath}/${payrollRunId}/payslip/${staffId}/pdf`, {
            responseType: 'blob'
        });
        return response;
    }
};

// ==================== REFERENCE DATA API ====================

const payrollReferenceApi = {
    // Global Allowance Categories
    async getAllowanceCategories() {
        const response = await apiClient.get(`${referencePath}/allowance-categories`);
        return normalizeListResponse(response.data);
    },

    async getAllowanceCategory(id) {
        const response = await apiClient.get(`${referencePath}/allowance-categories/${id}`);
        return response.data;
    },

    // Global Deduction Categories
    async getDeductionCategories(is_statutory = null) {
        const params = is_statutory !== null ? { is_statutory } : {};
        const response = await apiClient.get(`${referencePath}/deduction-categories`, { params });
        return normalizeListResponse(response.data);
    },

    async getDeductionCategory(id) {
        const response = await apiClient.get(`${referencePath}/deduction-categories/${id}`);
        return response.data;
    },

    // Statutory Types
    async getStatutoryTypes(country_code = "KE") {
        const response = await apiClient.get(`${referencePath}/statutory-types`, { params: { country_code } });
        return normalizeListResponse(response.data);
    },

    async getStatutoryType(id) {
        const response = await apiClient.get(`${referencePath}/statutory-types/${id}`);
        return response.data;
    },

    // Tax Relief Types
    async getTaxReliefTypes(country_code = "KE", as_of_date = null) {
        const params = { country_code };
        if (as_of_date) params.as_of_date = as_of_date;
        const response = await apiClient.get(`${referencePath}/tax-relief-types`, { params });
        return normalizeListResponse(response.data);
    },

    async getTaxReliefType(id) {
        const response = await apiClient.get(`${referencePath}/tax-relief-types/${id}`);
        return response.data;
    },

    // Tax Brackets
    async getTaxBrackets(params = {}) {
        const response = await apiClient.get(`${referencePath}/tax-brackets`, { params });
        return normalizeListResponse(response.data);
    },

    async createTaxBracket(payload) {
        const response = await apiClient.post(`${referencePath}/tax-brackets`, payload);
        return response.data;
    },

    async updateTaxBracket(id, payload) {
        const response = await apiClient.put(`${referencePath}/tax-brackets/${id}`, payload);
        return response.data;
    },

    async deleteTaxBracket(id) {
        const response = await apiClient.delete(`${referencePath}/tax-brackets/${id}`);
        return response.data;
    },

    // Organization Allowance Types
    async getOrganizationAllowanceTypes(include_inactive = false) {
        const response = await apiClient.get(`${referencePath}/org/allowance-types`, { params: { include_inactive } });
        return normalizeListResponse(response.data);
    },

    async getOrganizationAllowanceType(id) {
        const response = await apiClient.get(`${referencePath}/org/allowance-types/${id}`);
        return response.data;
    },

    async createOrganizationAllowanceType(payload) {
        const response = await apiClient.post(`${referencePath}/org/allowance-types`, payload);
        return response.data;
    },

    async updateOrganizationAllowanceType(id, payload) {
        const response = await apiClient.put(`${referencePath}/org/allowance-types/${id}`, payload);
        return response.data;
    },

    async deleteOrganizationAllowanceType(id) {
        const response = await apiClient.delete(`${referencePath}/org/allowance-types/${id}`);
        return response.data;
    },

    // Organization Deduction Types
    async getOrganizationDeductionTypes(include_inactive = false) {
        const response = await apiClient.get(`${referencePath}/org/deduction-types`, { params: { include_inactive } });
        return normalizeListResponse(response.data);
    },

    async getOrganizationDeductionType(id) {
        const response = await apiClient.get(`${referencePath}/org/deduction-types/${id}`);
        return response.data;
    },

    async createOrganizationDeductionType(payload) {
        const response = await apiClient.post(`${referencePath}/org/deduction-types`, payload);
        return response.data;
    },

    async updateOrganizationDeductionType(id, payload) {
        const response = await apiClient.put(`${referencePath}/org/deduction-types/${id}`, payload);
        return response.data;
    },

    async deleteOrganizationDeductionType(id) {
        const response = await apiClient.delete(`${referencePath}/org/deduction-types/${id}`);
        return response.data;
    },

    // Organization Statutory Config
    async getOrganizationStatutoryConfig() {
        const response = await apiClient.get(`${referencePath}/org/statutory-config`);
        return normalizeListResponse(response.data);
    },

    async upsertOrganizationStatutoryConfig(payload) {
        const response = await apiClient.post(`${referencePath}/org/statutory-config`, payload);
        return response.data;
    },

    // Dropdowns
    async getAllowanceCategoriesDropdown() {
        const response = await apiClient.get(`${referencePath}/dropdowns/allowance-categories`);
        return normalizeListResponse(response.data);
    },

    async getDeductionCategoriesDropdown() {
        const response = await apiClient.get(`${referencePath}/dropdowns/deduction-categories`);
        return normalizeListResponse(response.data);
    },

    async getOrgAllowanceTypesDropdown() {
        const response = await apiClient.get(`${referencePath}/dropdowns/org-allowance-types`);
        return normalizeListResponse(response.data);
    },

    async getOrgDeductionTypesDropdown() {
        const response = await apiClient.get(`${referencePath}/dropdowns/org-deduction-types`);
        return normalizeListResponse(response.data);
    },

    async getStatutoryTypesDropdown(country_code = "KE") {
        const response = await apiClient.get(`${referencePath}/dropdowns/statutory-types`, { params: { country_code } });
        return normalizeListResponse(response.data);
    },

    async getTaxReliefTypesDropdown(country_code = "KE") {
        const response = await apiClient.get(`${referencePath}/dropdowns/tax-relief-types`, { params: { country_code } });
        return normalizeListResponse(response.data);
    },

    // Statutory Rates Configuration
    async getStatutoryRates(params = {}) {
        const response = await apiClient.get(`${referencePath}/statutory-rates`, { params });
        return normalizeListResponse(response.data);
    },

    async getStatutoryRateByCode(config_code, params = {}) {
        const response = await apiClient.get(`${referencePath}/statutory-rates/${config_code}`, { params });
        return response.data;
    },

    async getStatutoryRatesGrouped(params = {}) {
        const response = await apiClient.get(`${referencePath}/statutory-rates/grouped`, { params });
        return response.data;
    },

    async createStatutoryRate(payload) {
        const response = await apiClient.post(`${referencePath}/statutory-rates`, payload);
        return response.data;
    },

    async updateStatutoryRate(id, payload) {
        const response = await apiClient.put(`${referencePath}/statutory-rates/${id}`, payload);
        return response.data;
    },

    async deleteStatutoryRate(id) {
        const response = await apiClient.delete(`${referencePath}/statutory-rates/${id}`);
        return response.data;
    }
};

// ==================== EMPLOYEE PAYROLL CONFIG API ====================

const employeePayrollApi = {
    // Employee Summary
    async getEmployeePayrollSummary(staffId, as_of_date = null) {
        const params = as_of_date ? { as_of_date } : {};
        const response = await apiClient.get(`${employeePath}/${staffId}/summary`, { params });
        return response.data;
    },

    async previewPayrollCalculation(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/preview`, payload);
        return response.data;
    },

    // Pension
    async getEmployeePension(staffId) {
        const response = await apiClient.get(`${employeePath}/${staffId}/pension`);
        return normalizeListResponse(response.data);
    },

    async createEmployeePension(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/pension`, payload);
        return response.data;
    },

    async updateEmployeePension(staffId, id, payload) {
        const response = await apiClient.put(`${employeePath}/${staffId}/pension/${id}`, payload);
        return response.data;
    },

    async getEmployeePensionById(staffId, id) {
        const response = await apiClient.get(`${employeePath}/${staffId}/pension/${id}`);
        return response.data;
    },

    // Insurance
    async getEmployeeInsurance(staffId) {
        const response = await apiClient.get(`${employeePath}/${staffId}/insurance`);
        return normalizeListResponse(response.data);
    },

    async createEmployeeInsurance(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/insurance`, payload);
        return response.data;
    },

    async updateEmployeeInsurance(staffId, id, payload) {
        const response = await apiClient.put(`${employeePath}/${staffId}/insurance/${id}`, payload);
        return response.data;
    },

    async getEmployeeInsuranceById(staffId, id) {
        const response = await apiClient.get(`${employeePath}/${staffId}/insurance/${id}`);
        return response.data;
    },

    async deleteEmployeeInsurance(staffId, id) {
        const response = await apiClient.delete(`${employeePath}/${staffId}/insurance/${id}`);
        return response.data;
    },

    // Tax Reliefs
    async getEmployeeTaxReliefs(staffId) {
        const response = await apiClient.get(`${employeePath}/${staffId}/tax-reliefs`);
        return normalizeListResponse(response.data);
    },

    async createEmployeeTaxRelief(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/tax-reliefs`, payload);
        return response.data;
    },

    async updateEmployeeTaxRelief(staffId, id, payload) {
        const response = await apiClient.put(`${employeePath}/${staffId}/tax-reliefs/${id}`, payload);
        return response.data;
    },

    async deleteEmployeeTaxRelief(staffId, id) {
        const response = await apiClient.delete(`${employeePath}/${staffId}/tax-reliefs/${id}`);
        return response.data;
    },

    // Statutory Settings
    async getEmployeeStatutorySettings(staffId) {
        const response = await apiClient.get(`${employeePath}/${staffId}/statutory-settings`);
        return normalizeListResponse(response.data);
    },

    async upsertEmployeeStatutorySetting(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/statutory-settings`, payload);
        return response.data;
    },

    async bulkUpdateEmployeeStatutorySettings(staffId, settings) {
        const response = await apiClient.post(`${employeePath}/${staffId}/statutory-settings/bulk`, settings);
        return response.data;
    },

    async getEmployeeStatutoryById(staffId, id) {
        const response = await apiClient.get(`${employeePath}/${staffId}/statutory-settings/${id}`);
        return response.data;
    },

    // Basic Salary
    async getEmployeeBasicSalary(staffId, is_active = null) {
        const params = is_active !== null ? { is_active } : {};
        const response = await apiClient.get(`${employeePath}/${staffId}/basic-salary`, { params });
        return normalizeListResponse(response.data);
    },

    async getEmployeeBasicSalaryById(staffId, id) {
        const response = await apiClient.get(`${employeePath}/${staffId}/basic-salary/${id}`);
        return response.data;
    },

    async requestBasicSalaryChange(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/basic-salary/change-request`, payload);
        return response.data;
    },

    async requestBasicSalaryUpdate(staffId, id, payload) {
        const response = await apiClient.put(`${employeePath}/${staffId}/basic-salary/${id}/change-request`, payload);
        return response.data;
    },

    // Allowances
    async getEmployeeAllowances(staffId) {
        const response = await apiClient.get(`${employeePath}/${staffId}/allowances`);
        return normalizeListResponse(response.data);
    },

    async getEmployeeAllowanceById(staffId, id) {
        const response = await apiClient.get(`${employeePath}/${staffId}/allowances/${id}`);
        return response.data;
    },

    async createEmployeeAllowance(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/allowances`, payload);
        return response.data;
    },

    async requestAllowanceChange(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/allowances/change-request`, payload);
        return response.data;
    },

    async requestAllowanceUpdate(staffId, id, payload) {
        const response = await apiClient.put(`${employeePath}/${staffId}/allowances/${id}/change-request`, payload);
        return response.data;
    },

    // Deductions
    async getEmployeeDeductions(staffId) {
        const response = await apiClient.get(`${employeePath}/${staffId}/deductions`);
        return normalizeListResponse(response.data);
    },

    async getEmployeeDeductionById(staffId, id) {
        const response = await apiClient.get(`${employeePath}/${staffId}/deductions/${id}`);
        return response.data;
    },

    async createEmployeeDeduction(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/deductions`, payload);
        return response.data;
    },

    async requestDeductionChange(staffId, payload) {
        const response = await apiClient.post(`${employeePath}/${staffId}/deductions/change-request`, payload);
        return response.data;
    },

    async requestDeductionUpdate(staffId, id, payload) {
        const response = await apiClient.put(`${employeePath}/${staffId}/deductions/${id}/change-request`, payload);
        return response.data;
    }
,

    // Bulk deductions template download and upload
    async downloadDeductionsTemplate() {
        const response = await apiClient.get(`${employeePath}/deductions/template`, { responseType: 'blob' });
        return response;
    },

    async uploadDeductions(file) {
        const form = new FormData();
        form.append('file', file);
        const response = await apiClient.post(`${employeePath}/deductions/upload`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Bulk payroll config template download and upload
    async downloadBulkConfigTemplate() {
        const response = await apiClient.get(`${employeePath}/bulk-config/template`, { responseType: 'blob' });
        return response;
    },

    async uploadBulkConfig(file) {
        const form = new FormData();
        form.append('file', file);
        const response = await apiClient.post(`${employeePath}/bulk-config/upload`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // ==================== COMPONENT CHANGE HISTORY ====================
    
    async getComponentChangeHistory(params = {}) {
        const url = `${basePath}/component-changes/history`;
        console.log('payrollApi.getComponentChangeHistory - Calling:', url, 'with params:', params);
        const response = await apiClient.get(url, { params });
        console.log('payrollApi.getComponentChangeHistory - Response:', response.data);
        return response.data;
    },

    async comparePayrollComponents(params = {}) {
        const url = `${basePath}/component-changes/compare`;
        console.log('payrollApi.comparePayrollComponents - Calling:', url, 'with params:', params);
        const response = await apiClient.get(url, { params });
        console.log('payrollApi.comparePayrollComponents - Response:', response.data);
        return response.data;
    }
};

export { payrollApi, payrollReferenceApi, employeePayrollApi };
export default payrollApi;
