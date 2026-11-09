import apiClient from "./apiClient";

const BASE_URL = "/WorkflowsAPI/api";

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };
};

// ==================== Workflow Definitions ====================

export const getWorkflowDefinitions = async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.entity_type) queryParams.append("entity_type", params.entity_type);
    if (params.is_active !== undefined) queryParams.append("is_active", params.is_active);
    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);

    const url = `${BASE_URL}/workflow-definitions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

export const getWorkflowDefinitionById = async (id) => {
    const response = await apiClient.get(`${BASE_URL}/workflow-definitions/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createWorkflowDefinition = async (data) => {
    const response = await apiClient.post(`${BASE_URL}/workflow-definitions`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateWorkflowDefinition = async (id, data) => {
    const response = await apiClient.put(`${BASE_URL}/workflow-definitions/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deactivateWorkflowDefinition = async (id) => {
    const response = await apiClient.delete(`${BASE_URL}/workflow-definitions/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updateStepApprovers = async (definitionId, stepId, data) => {
    const response = await apiClient.put(
        `${BASE_URL}/workflow-definitions/${definitionId}/steps/${stepId}/approvers`,
        data,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

// ==================== Workflow Instances ====================

export const startWorkflow = async (data) => {
    const response = await apiClient.post(`${BASE_URL}/workflow-instances/start`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getWorkflowInstances = async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.entity_type) queryParams.append("entity_type", params.entity_type);
    if (params.entity_type_prefix) queryParams.append("entity_type_prefix", params.entity_type_prefix);
    if (params.entity_id) queryParams.append("entity_id", params.entity_id);
    if (params.status) queryParams.append("status", params.status);
    if (params.started_from) queryParams.append("started_from", params.started_from);
    if (params.started_to) queryParams.append("started_to", params.started_to);
    if (params.mine_only !== undefined) queryParams.append("mine_only", params.mine_only);
    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);

    const url = `${BASE_URL}/workflow-instances${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

export const getWorkflowInstanceById = async (id) => {
    const response = await apiClient.get(`${BASE_URL}/workflow-instances/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const cancelWorkflow = async (id, comment) => {
    const response = await apiClient.post(
        `${BASE_URL}/workflow-instances/${id}/cancel`,
        { action: "CANCEL", comment },
        { headers: getAuthHeaders() }
    );
    return response.data;
};

// ==================== Workflow Approvals ====================

export const getPendingApprovals = async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.entity_type) queryParams.append("entity_type", params.entity_type);
    if (params.include_delegated !== undefined) queryParams.append("include_delegated", params.include_delegated);
    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);

    const url = `${BASE_URL}/workflow-approvals/pending${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

// `options` also accepts `commentStyle` ("TEXT" | "STICKY_NOTE") and, when
// commentStyle is STICKY_NOTE, `pinX`/`pinY` (0-100 percentages) — the same
// comment/sticky-note shape used by submitDocument and the other two
// approval actions below. Optional fields are only sent when present, same
// as the existing signature_id/otp_code handling.
export const approveStep = async (stepApproverId, options = {}) => {
    const { comment, signatureId, otpCode, commentStyle, pinX, pinY } = options;
    const body = { action: "APPROVE", comment };
    if (signatureId) body.signature_id = signatureId;
    if (otpCode) body.otp_code = otpCode;
    if (commentStyle) body.comment_style = commentStyle;
    if (pinX != null) body.pin_x = pinX;
    if (pinY != null) body.pin_y = pinY;
    const response = await apiClient.post(
        `${BASE_URL}/workflow-approvals/${stepApproverId}/action`,
        body,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const rejectStep = async (stepApproverId, options = {}) => {
    const { comment, commentStyle, pinX, pinY } = options;
    const body = { action: "REJECT", comment };
    if (commentStyle) body.comment_style = commentStyle;
    if (pinX != null) body.pin_x = pinX;
    if (pinY != null) body.pin_y = pinY;
    const response = await apiClient.post(
        `${BASE_URL}/workflow-approvals/${stepApproverId}/action`,
        body,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const sendBackStep = async (stepApproverId, options = {}) => {
    const { comment, targetStepOrder, commentStyle, pinX, pinY } = options;
    const body = { comment, target_step_order: targetStepOrder };
    if (commentStyle) body.comment_style = commentStyle;
    if (pinX != null) body.pin_x = pinX;
    if (pinY != null) body.pin_y = pinY;
    const response = await apiClient.post(
        `${BASE_URL}/workflow-approvals/${stepApproverId}/send-back`,
        body,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const resubmitWorkflow = async (workflowInstanceId, comment) => {
    const response = await apiClient.post(
        `${BASE_URL}/workflow-approvals/${workflowInstanceId}/resubmit`,
        comment ? { comment } : {},
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const delegateApproval = async (stepApproverId, options = {}) => {
    const { delegatedToUserId, comment, commentStyle, pinX, pinY } = options;
    const body = { delegated_to_user_id: delegatedToUserId, comment };
    if (commentStyle) body.comment_style = commentStyle;
    if (pinX != null) body.pin_x = pinX;
    if (pinY != null) body.pin_y = pinY;
    const response = await apiClient.post(
        `${BASE_URL}/workflow-approvals/${stepApproverId}/delegate`,
        body,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const getApprovalHistory = async (workflowInstanceId) => {
    const response = await apiClient.get(`${BASE_URL}/workflow-approvals/history/${workflowInstanceId}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getWorkflowApprovalSteps = async (workflowInstanceId) => {
    const response = await apiClient.get(
        `${BASE_URL}/workflow-approvals/${workflowInstanceId}/steps`,
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const getWorkflowStepDetails = async (workflowInstanceId, stepOrder, options = {}) => {
    const queryParams = new URLSearchParams();
    if (options.includeSignatureDetails) queryParams.append("include_signature_details", "true");

    const url = `${BASE_URL}/workflow-approvals/${workflowInstanceId}/steps/${stepOrder}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

export const getWorkflowEntityDetails = async (workflowInstanceId, options = {}) => {
    const queryParams = new URLSearchParams();
    if (options.live !== undefined) queryParams.append("live", options.live);

    const url = `${BASE_URL}/workflow-approvals/${workflowInstanceId}/entity-details${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

// ==================== Workflow Delegations ====================

export const createDelegation = async (data) => {
    const response = await apiClient.post(`${BASE_URL}/workflow-delegations`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getMyDelegations = async (activeOnly = true) => {
    const url = `${BASE_URL}/workflow-delegations${activeOnly ? "?active_only=true" : ""}`;
    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

export const getDelegationsToMe = async (activeOnly = true) => {
    const url = `${BASE_URL}/workflow-delegations/delegated-to-me${activeOnly ? "?active_only=true" : ""}`;
    const response = await apiClient.get(url, { headers: getAuthHeaders() });
    return response.data;
};

export const updateDelegation = async (id, data) => {
    const response = await apiClient.put(`${BASE_URL}/workflow-delegations/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deleteDelegation = async (id) => {
    const response = await apiClient.delete(`${BASE_URL}/workflow-delegations/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// ==================== Workflow Enums ====================

export const getWorkflowEnums = async () => {
    const response = await apiClient.get(`${BASE_URL}/enums/all`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export default {
    // Workflow Definitions
    getWorkflowDefinitions,
    getWorkflowDefinitionById,
    createWorkflowDefinition,
    updateWorkflowDefinition,
    deactivateWorkflowDefinition,
    updateStepApprovers,
    
    // Workflow Instances
    startWorkflow,
    getWorkflowInstances,
    getWorkflowInstanceById,
    cancelWorkflow,
    
    // Workflow Approvals
    getPendingApprovals,
    getWorkflowApprovalSteps,
    getWorkflowStepDetails,
    getWorkflowEntityDetails,
    approveStep,
    rejectStep,
    sendBackStep,
    resubmitWorkflow,
    delegateApproval,
    getApprovalHistory,
    
    // Workflow Delegations
    createDelegation,
    getMyDelegations,
    getDelegationsToMe,
    updateDelegation,
    deleteDelegation,

    // Workflow Enums
    getWorkflowEnums
};
