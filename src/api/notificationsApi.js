import apiClient from "./apiClient";

export async function getUnreadNotificationsCount() {
  const response = await apiClient.get("/CommunicationAPI/api/notifications/me", {
    params: { page: 1, page_size: 1 }
  });
  return response.data?.pagination?.unread_count ?? 0;
}

// Most recent notifications for a quick hover preview (e.g. the navbar bell).
export async function getRecentNotifications(limit = 6) {
  const response = await apiClient.get("/CommunicationAPI/api/notifications/me", {
    params: { page: 1, page_size: limit }
  });
  return {
    items: response.data?.data || [],
    unreadCount: response.data?.pagination?.unread_count ?? 0
  };
}

// Fetching a single notification marks it read server-side as a side effect —
// this just calls that endpoint for its read-marking behavior, discarding the
// body, for callers (like the bell preview) that only need the side effect.
export async function markNotificationRead(id) {
  await apiClient.get(`/CommunicationAPI/api/notifications/${id}`);
}
