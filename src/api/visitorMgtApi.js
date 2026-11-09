import apiClient from './apiClient';

const BASE_PATH = '/visitormgtapi/api';

// ============= SITES =============
export const sitesApi = {
  getAll: (includeInactive = false) => 
    apiClient.get(`${BASE_PATH}/sites`, { params: { includeInactive } }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/sites/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/sites`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/sites/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/sites/${id}`),
};

// ============= VISITORS =============
export const visitorsApi = {
  // Visitor Types
  types: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/visitors/types`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/visitors/types`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/visitors/types/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/visitors/types/${id}`),
  },

  // Visitors
  getAll: (params = {}) => 
    apiClient.get(`${BASE_PATH}/visitors`, { params }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/visitors/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/visitors`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/visitors/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/visitors/${id}`),

  // Agreements
  agreements: {
    getByVisitor: (visitorId) => 
      apiClient.get(`${BASE_PATH}/visitors/${visitorId}/agreements`),
    
    create: (visitorId, data) => 
      apiClient.post(`${BASE_PATH}/visitors/${visitorId}/agreements`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/visitors/agreements/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/visitors/agreements/${id}`),
  },
};

// ============= HOSTS =============
export const hostsApi = {
  // Host Types
  types: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/hosts/types`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/hosts/types`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/hosts/types/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/hosts/types/${id}`),
  },

  // Hosts
  getAll: (params = {}) => 
    apiClient.get(`${BASE_PATH}/hosts`, { params }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/hosts/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/hosts`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/hosts/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/hosts/${id}`),
};

// ============= VISITS =============
export const visitsApi = {
  // Visit Statuses
  statuses: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/visits/statuses`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/visits/statuses`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/visits/statuses/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/visits/statuses/${id}`),
  },

  // Visits
  getAll: (params = {}) => 
    apiClient.get(`${BASE_PATH}/visits`, { params }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/visits/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/visits`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/visits/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/visits/${id}`),

  // Visit Actions
  checkIn: (id, data) => 
    apiClient.post(`${BASE_PATH}/visits/${id}/checkin`, data),
  
  checkOut: (id, data) => 
    apiClient.post(`${BASE_PATH}/visits/${id}/checkout`, data),
  
  approve: (id) => 
    apiClient.post(`${BASE_PATH}/visits/${id}/approve`),

  // Visit Visitors
  visitors: {
    get: (visitId) => 
      apiClient.get(`${BASE_PATH}/visits/${visitId}/visitors`),
    
    add: (visitId, visitorIds) => 
      apiClient.post(`${BASE_PATH}/visits/${visitId}/visitors`, { visitor_ids: visitorIds }),
    
    remove: (visitId, visitorId) => 
      apiClient.delete(`${BASE_PATH}/visits/${visitId}/visitors/${visitorId}`),
  },

  // Audit Logs
  auditLogs: (id) => 
    apiClient.get(`${BASE_PATH}/visits/${id}/audit-logs`),

  // Notification Logs
  notificationLogs: {
    get: (visitId) => 
      apiClient.get(`${BASE_PATH}/visits/${visitId}/notification-logs`),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/visits/notification-logs`, data),
  },
};

// ============= ITEMS =============
export const itemsApi = {
  // Item Types
  types: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/items/types`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/items/types`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/items/types/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/items/types/${id}`),
  },

  // Items
  getAll: (params = {}) => 
    apiClient.get(`${BASE_PATH}/items`, { params }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/items/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/items`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/items/${id}`, data),
  
  approve: (id, approvalStatusId) => 
    apiClient.post(`${BASE_PATH}/items/${id}/approve`, { approval_status_id: approvalStatusId }),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/items/${id}`),

  // Item Policies
  policies: {
    getAll: (params = {}) => 
      apiClient.get(`${BASE_PATH}/items/policies`, { params }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/items/policies`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/items/policies/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/items/policies/${id}`),
  },
};

// ============= VEHICLES =============
export const vehiclesApi = {
  // Vehicle Types
  types: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/vehicles/types`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/vehicles/types`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/vehicles/types/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/vehicles/types/${id}`),
  },

  // Vehicles
  getAll: (params = {}) => 
    apiClient.get(`${BASE_PATH}/vehicles`, { params }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/vehicles/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/vehicles`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/vehicles/${id}`, data),
  
  approve: (id, approvalStatusId) => 
    apiClient.post(`${BASE_PATH}/vehicles/${id}/approve`, { approval_status_id: approvalStatusId }),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/vehicles/${id}`),

  // Vehicle Policies
  policies: {
    getAll: (params = {}) => 
      apiClient.get(`${BASE_PATH}/vehicles/policies`, { params }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/vehicles/policies`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/vehicles/policies/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/vehicles/policies/${id}`),
  },
};

// ============= WEAPONS =============
export const weaponsApi = {
  // Weapon Types
  types: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/weapons/types`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/weapons/types`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/weapons/types/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/weapons/types/${id}`),
  },

  // Weapons
  getAll: (params = {}) => 
    apiClient.get(`${BASE_PATH}/weapons`, { params }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/weapons/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/weapons`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/weapons/${id}`, data),
  
  approve: (id, approvalStatusId) => 
    apiClient.post(`${BASE_PATH}/weapons/${id}/approve`, { approval_status_id: approvalStatusId }),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/weapons/${id}`),

  // Weapon Policies
  policies: {
    getAll: (params = {}) => 
      apiClient.get(`${BASE_PATH}/weapons/policies`, { params }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/weapons/policies`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/weapons/policies/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/weapons/policies/${id}`),
  },
};

// ============= ACCESS CONTROL =============
export const accessControlApi = {
  // Access Levels
  levels: {
    getAll: (includeInactive = false) => 
      apiClient.get(`${BASE_PATH}/access/levels`, { params: { includeInactive } }),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/access/levels`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/access/levels/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/access/levels/${id}`),
  },

  // Access Zones
  zones: {
    getAll: (params = {}) => 
      apiClient.get(`${BASE_PATH}/access/zones`, { params }),
    
    getById: (id) => 
      apiClient.get(`${BASE_PATH}/access/zones/${id}`),
    
    create: (data) => 
      apiClient.post(`${BASE_PATH}/access/zones`, data),
    
    update: (id, data) => 
      apiClient.put(`${BASE_PATH}/access/zones/${id}`, data),
    
    delete: (id) => 
      apiClient.delete(`${BASE_PATH}/access/zones/${id}`),
  },

  // Visit Access Zones
  visitZones: {
    get: (visitId) => 
      apiClient.get(`${BASE_PATH}/access/visits/${visitId}/zones`),
    
    assign: (visitId, zoneIds) => 
      apiClient.post(`${BASE_PATH}/access/visits/${visitId}/zones`, { access_zone_ids: zoneIds }),
    
    remove: (visitId, zoneId) => 
      apiClient.delete(`${BASE_PATH}/access/visits/${visitId}/zones/${zoneId}`),
  },
};

// ============= APPROVAL STATUSES =============
export const approvalStatusesApi = {
  getAll: (includeInactive = false) => 
    apiClient.get(`${BASE_PATH}/statuses`, { params: { includeInactive } }),
  
  getById: (id) => 
    apiClient.get(`${BASE_PATH}/statuses/${id}`),
  
  create: (data) => 
    apiClient.post(`${BASE_PATH}/statuses`, data),
  
  update: (id, data) => 
    apiClient.put(`${BASE_PATH}/statuses/${id}`, data),
  
  delete: (id) => 
    apiClient.delete(`${BASE_PATH}/statuses/${id}`),
};
