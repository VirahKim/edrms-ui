import apiClient from "./apiClient";

/**
 * WhatsApp API Service
 * Handles all WhatsApp-related API calls including WABA management,
 * contacts, conversations, messaging, and templates
 */

const whatsappApi = {
  // ==================== WABA Management ====================
  
  /**
   * Get all WhatsApp Business Accounts
   * @returns {Promise} List of WABAs
   */
  getWABAs: () => {
    return apiClient.get("/CommunicationAPI/api/waba");
  },

  /**
   * Create a new WABA
   * @param {Object} data - WABA data
   * @returns {Promise} Created WABA
   */
  createWABA: (data) => {
    return apiClient.post("/CommunicationAPI/api/waba", data);
  },

  /**
   * Update WABA
   * @param {number} id - WABA ID
   * @param {Object} data - Updated WABA data
   * @returns {Promise} Updated WABA
   */
  updateWABA: (id, data) => {
    return apiClient.put(`/CommunicationAPI/api/waba/${id}`, data);
  },

  /**
   * Delete WABA
   * @param {number} id - WABA ID
   * @returns {Promise}
   */
  deleteWABA: (id) => {
    return apiClient.delete(`/CommunicationAPI/api/waba/${id}`);
  },

  /**
   * Add phone number to WABA
   * @param {number} wabaId - WABA ID
   * @param {Object} data - Phone number data
   * @returns {Promise} Added phone number
   */
  addPhoneNumber: (wabaId, data) => {
    return apiClient.post(`/CommunicationAPI/api/waba/${wabaId}/phones`, data);
  },

  /**
   * Update phone number
   * @param {number} wabaId - WABA ID
   * @param {number} phoneId - Phone number ID
   * @param {Object} data - Updated phone number data
   * @returns {Promise} Updated phone number
   */
  updatePhoneNumber: (wabaId, phoneId, data) => {
    return apiClient.put(`/CommunicationAPI/api/waba/${wabaId}/phones/${phoneId}`, data);
  },

  /**
   * Delete phone number
   * @param {number} wabaId - WABA ID
   * @param {number} phoneId - Phone number ID
   * @returns {Promise}
   */
  deletePhoneNumber: (wabaId, phoneId) => {
    return apiClient.delete(`/CommunicationAPI/api/waba/${wabaId}/phones/${phoneId}`);
  },

  // ==================== Contacts ====================

  /**
   * Get WhatsApp contacts
   * @param {Object} params - Query parameters (search, skip, take)
   * @returns {Promise} List of contacts
   */
  getContacts: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/whatsapp/contacts", { params });
  },

  /**
   * Get contact by ID
   * @param {number} id - Contact ID
   * @returns {Promise} Contact details
   */
  getContact: (id) => {
    return apiClient.get(`/CommunicationAPI/api/whatsapp/contacts/${id}`);
  },

  /**
   * Get conversations for a contact
   * @param {number} contactId - Contact ID
   * @returns {Promise} List of conversations
   */
  getContactConversations: (contactId) => {
    return apiClient.get(`/CommunicationAPI/api/whatsapp/contacts/${contactId}/conversations`);
  },

  // ==================== Conversations ====================

  /**
   * Get conversations
   * @param {Object} params - Query parameters (isOpen, phoneNumberId)
   * @returns {Promise} List of conversations
   */
  getConversations: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/whatsapp/conversations", { params });
  },

  /**
   * Get conversations grouped by contact
   * @param {Object} params - Query parameters (phoneNumberId, hasOpenConversation)
   * @returns {Promise} List of contacts with their conversations
   */
  getGroupedConversations: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/whatsapp/conversations/grouped", { params });
  },

  /**
   * Get conversation by ID
   * @param {number} id - Conversation ID
   * @returns {Promise} Conversation details
   */
  getConversation: (id) => {
    return apiClient.get(`/CommunicationAPI/api/whatsapp/conversations/${id}`);
  },

  /**
   * Get messages in a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise} List of messages
   */
  getMessages: (conversationId) => {
    return apiClient.get(`/CommunicationAPI/api/whatsapp/conversations/${conversationId}/messages`);
  },

  /**
   * Mark conversation as read
   * @param {number} conversationId - Conversation ID
   * @returns {Promise}
   */
  markConversationAsRead: (conversationId) => {
    return apiClient.patch(`/CommunicationAPI/api/whatsapp/conversations/${conversationId}/read`);
  },

  /**
   * Close conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise}
   */
  closeConversation: (conversationId) => {
    return apiClient.put(`/CommunicationAPI/api/whatsapp/conversations/${conversationId}/close`);
  },

  /**
   * Reopen conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise}
   */
  reopenConversation: (conversationId) => {
    return apiClient.put(`/CommunicationAPI/api/whatsapp/conversations/${conversationId}/reopen`);
  },

  // ==================== Messaging ====================

  /**
   * Send a WhatsApp message (text or media)
   * @param {Object} data - Message data
   * @returns {Promise} Sent message details
   */
  sendMessage: (data) => {
    return apiClient.post("/CommunicationAPI/api/whatsapp/messages/send", data);
  },

  /**
   * Send a template message
   * @param {Object} data - Template message data
   * @returns {Promise} Sent message details
   */
  sendTemplateMessage: (data) => {
    return apiClient.post("/CommunicationAPI/api/whatsapp/messages/send-template", data);
  },

  /**
   * Broadcast template to multiple recipients
   * @param {Object} data - Broadcast data
   * @returns {Promise} Broadcast results
   */
  broadcastTemplate: (data) => {
    return apiClient.post("/CommunicationAPI/api/whatsapp/messages/broadcast-template", data);
  },

  /**
   * Mark message as read
   * @param {string} metaMessageId - Meta message ID
   * @returns {Promise}
   */
  markMessageAsRead: (metaMessageId) => {
    return apiClient.post("/CommunicationAPI/api/whatsapp/messages/mark-read", { metaMessageId });
  },

  // ==================== Media Management ====================

  /**
   * Upload media file
   * @param {FormData} formData - Form data containing the file
   * @returns {Promise} Media upload response
   */
  uploadMedia: (formData) => {
    return apiClient.post("/CommunicationAPI/api/whatsapp/media", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  },

  /**
   * Get media URL for download
   * @param {string} path - Media file path
   * @returns {string} Media download URL
   */
  getMediaUrl: (path) => {
    return `${import.meta.env.VITE_API_BASE_URL}/CommunicationAPI/api/whatsapp/media?path=${encodeURIComponent(path)}`;
  },

  /**
   * Download media file
   * @param {string} path - Media file path
   * @returns {Promise} Media file blob
   */
  downloadMedia: (path) => {
    return apiClient.get(`/CommunicationAPI/api/whatsapp/media?path=${encodeURIComponent(path)}`, {
      responseType: "blob"
    });
  },

  // ==================== Templates ====================

  /**
   * Get WhatsApp templates
   * @param {Object} params - Query parameters
   * @returns {Promise} List of templates
   */
  getTemplates: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/templates/whatsapp", { params });
  },

  /**
   * Get template by ID
   * @param {number} id - Template ID
   * @returns {Promise} Template details
   */
  getTemplate: (id) => {
    return apiClient.get(`/CommunicationAPI/api/templates/whatsapp/${id}`);
  },

  /**
   * Create a new WhatsApp template (Admin only)
   * @param {Object} data - Template data
   * @returns {Promise} Created template
   */
  createTemplate: (data) => {
    return apiClient.post("/CommunicationAPI/api/templates/whatsapp", data);
  },

  /**
   * Update template
   * @param {number} id - Template ID
   * @param {Object} data - Updated template data
   * @returns {Promise} Updated template
   */
  updateTemplate: (id, data) => {
    return apiClient.put(`/CommunicationAPI/api/templates/whatsapp/${id}`, data);
  },

  /**
   * Sync templates from Meta (Admin only)
   * @returns {Promise} Sync result
   */
  syncTemplates: () => {
    return apiClient.post("/CommunicationAPI/api/templates/whatsapp/sync");
  },

  /**
   * Delete template
   * @param {number} id - Template ID
   * @returns {Promise}
   */
  deleteTemplate: (id) => {
    return apiClient.delete(`/CommunicationAPI/api/templates/whatsapp/${id}`);
  },

  // ==================== Statistics & Analytics ====================

  /**
   * Get conversation statistics
   * @param {Object} params - Query parameters (dateFrom, dateTo, phoneNumberId)
   * @returns {Promise} Statistics data
   */
  getConversationStats: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/whatsapp/stats/conversations", { params });
  },

  /**
   * Get message statistics
   * @param {Object} params - Query parameters (dateFrom, dateTo, phoneNumberId)
   * @returns {Promise} Statistics data
   */
  getMessageStats: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/whatsapp/stats/messages", { params });
  },

  /**
   * Get unread messages statistics
   * @param {Object} params - Query parameters (phoneNumberId)
   * @returns {Promise} Unread statistics (totalConversationsWithUnread, totalUnreadMessages)
   */
  getUnreadStats: (params = {}) => {
    return apiClient.get("/CommunicationAPI/api/whatsapp/stats/unread", { params });
  }
};

export default whatsappApi;
