import apiClient from "./apiClient";

// Starts a conversation. Pass `recipient_user_ids` (an array) — one id
// continues the existing 1:1 chat with that person, two or more start a
// group. `recipient_user_id` (single) still works.
export async function sendMessage(payload) {
  const response = await apiClient.post("/CommunicationAPI/api/messages", payload);
  return response.data;
}

// Replies within an already-open conversation. replyToMessageId quotes a
// specific earlier message in the same thread (optional).
export async function replyToConversation(conversationId, body, replyToMessageId) {
  const response = await apiClient.post(`/CommunicationAPI/api/conversations/${conversationId}/messages`, {
    body,
    reply_to_message_id: replyToMessageId || undefined,
  });
  return response.data;
}

// Loops more people into a conversation (1:1 becomes a group). Resolves to the
// updated participant list.
export async function addConversationParticipants(conversationId, userIds) {
  const response = await apiClient.post(`/CommunicationAPI/api/conversations/${conversationId}/participants`, {
    user_ids: userIds,
  });
  return response.data?.data || [];
}

// Removes a person from a group, or leaves it when userId is your own id.
export async function removeConversationParticipant(conversationId, userId) {
  await apiClient.delete(`/CommunicationAPI/api/conversations/${conversationId}/participants/${userId}`);
}

// Renames a group; an empty name clears it.
export async function renameConversation(conversationId, topic) {
  const response = await apiClient.patch(`/CommunicationAPI/api/conversations/${conversationId}`, { topic });
  return response.data?.data || null;
}

export async function getConversations() {
  const response = await apiClient.get("/CommunicationAPI/api/conversations");
  return response.data;
}

export async function getConversation(conversationId) {
  const response = await apiClient.get(`/CommunicationAPI/api/conversations/${conversationId}`);
  return response.data?.data || null;
}

// Fetching a page also marks the other side's messages read as a side
// effect — same read-on-GET convention notificationsApi.js relies on.
export async function getConversationMessages(conversationId, params = {}) {
  const response = await apiClient.get(`/CommunicationAPI/api/conversations/${conversationId}/messages`, { params });
  return response.data;
}

export async function getUnreadMessagesCount() {
  const response = await apiClient.get("/CommunicationAPI/api/conversations");
  return response.data?.total_unread ?? 0;
}

// Most recent conversations with any activity, for the navbar bell's hover
// preview — reuses the same list the full conversation view uses.
export async function getRecentConversations(limit = 6) {
  const response = await apiClient.get("/CommunicationAPI/api/conversations");
  const items = (response.data?.data || []).slice(0, limit);
  return { items, unreadCount: response.data?.total_unread ?? 0 };
}
