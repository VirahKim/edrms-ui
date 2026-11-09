import apiClient from "./apiClient";

const API_BASE = "/HRmsAPI/api/staffgroups";

/**
 * Create a new staff group
 * @param {Object} groupData - Staff group data
 * @returns {Promise<Object>} Created staff group
 */
export const createStaffGroup = async (groupData) => {
  try {
    const response = await apiClient.post(API_BASE, groupData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all staff groups
 * @param {Object} filters - Query filters (is_active, etc.)
 * @returns {Promise<Array>} List of staff groups
 */
export const getAllStaffGroups = async (filters = {}) => {
  try {
    const response = await apiClient.get(API_BASE, { params: filters });
    return response.data || [];
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get active staff groups for dropdown
 * @returns {Promise<Array>} List of active staff groups
 */
export const getActiveStaffGroups = async () => {
  try {
    const response = await apiClient.get(`${API_BASE}/dropdown/active`);
    return response.data || [];
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get staff group by ID with member details
 * @param {number} id - Staff group ID
 * @returns {Promise<Object>} Staff group details
 */
export const getStaffGroupById = async (id) => {
  try {
    const response = await apiClient.get(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update a staff group
 * @param {number} id - Staff group ID
 * @param {Object} groupData - Updated staff group data
 * @returns {Promise<void>}
 */
export const updateStaffGroup = async (id, groupData) => {
  try {
    await apiClient.put(`${API_BASE}/${id}`, groupData);
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete a staff group
 * @param {number} id - Staff group ID
 * @returns {Promise<void>}
 */
export const deleteStaffGroup = async (id) => {
  try {
    await apiClient.delete(`${API_BASE}/${id}`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Reset numbering sequence for a staff group
 * @param {number} id - Staff group ID
 * @param {string} reason - Reason for reset
 * @returns {Promise<Object>} Reset result with new sequence
 */
export const resetGroupSequence = async (id, reason) => {
  try {
    const response = await apiClient.post(`${API_BASE}/${id}/reset-sequence`, {
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get numbering history for a staff group
 * @param {number} id - Staff group ID
 * @returns {Promise<Array>} Numbering history records
 */
export const getNumberingHistory = async (id) => {
  try {
    const response = await apiClient.get(`${API_BASE}/${id}/numbering-history`);
    return response.data || [];
  } catch (error) {
    throw error.response?.data || error;
  }
};
