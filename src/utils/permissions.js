/**
 * Permission utility functions for role-based access control
 */

/**
 * Check if user has a specific permission
 * @param {Object} requiredPermission - { resource, action }
 * @returns {boolean}
 */
export const hasPermission = (requiredPermission) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?.permissions) return false;
  
  return user.permissions.some(p => 
    p.resource_name?.toLowerCase() === requiredPermission.resource?.toLowerCase() && 
    p.action_name?.toLowerCase() === requiredPermission.action?.toLowerCase()
  );
};

/**
 * Check if user has any of the specified permissions
 * @param {Array} permissions - Array of { resource, action } objects
 * @returns {boolean}
 */
export const hasAnyPermission = (permissions) => {
  if (!permissions || permissions.length === 0) return true;
  return permissions.some(p => hasPermission(p));
};

/**
 * Check if user has all of the specified permissions
 * @param {Array} permissions - Array of { resource, action } objects
 * @returns {boolean}
 */
export const hasAllPermissions = (permissions) => {
  if (!permissions || permissions.length === 0) return true;
  return permissions.every(p => hasPermission(p));
};

/**
 * Check if user has access to a module based on sidebar API response
 * @param {string} moduleKey - The key of the menu module (e.g., 'accounting', 'hr_management')
 * @param {Array} sidebarData - The response from /api/modules/sidebar
 * @returns {boolean}
 */
export const hasModuleAccess = (moduleKey, sidebarData) => {
  if (!sidebarData || sidebarData.length === 0) return false;
  
  // Map menu keys to module names that come from backend
  const moduleKeyMap = {
    'dashboard': 'Intelligence',
    'accounting': 'Accounting',
    'payables': 'Payables',
    'receivables': 'Receivables',
    'procurement': 'Procurement',
    'inventory': 'Inventory',
    'sales': 'Sales',
    'hr_management': 'HR Management',
    'payroll_management': 'Payroll Management',
    'user_management': 'Users Management',
  };

  const moduleName = moduleKeyMap[moduleKey];
  if (!moduleName) return false;

  // Check if user has access to this module
  return sidebarData.some(module => 
    module.module_name?.toLowerCase() === moduleName.toLowerCase()
  );
};

/**
 * Check if user has access to a specific resource within a module
 * @param {string} resourcePath - The path of the resource (e.g., '/users', '/roles')
 * @param {Array} sidebarData - The response from /api/modules/sidebar
 * @returns {boolean}
 */
export const hasResourceAccess = (resourcePath, sidebarData) => {
  if (!sidebarData || sidebarData.length === 0) return false;
  if (!resourcePath) return false;

  // Check if any module contains a resource with this path
  for (const module of sidebarData) {
    if (module.resources) {
      for (const resource of module.resources) {
        if (resource.resource_route === resourcePath) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Filter menu items based on user's sidebar permissions
 * @param {Array} menus - Array of menu items
 * @param {Array} sidebarData - The response from /api/modules/sidebar
 * @returns {Array} Filtered menu items
 */
export const filterMenusByPermissions = (menus, sidebarData) => {
  if (!sidebarData || sidebarData.length === 0) return [];
  
  return menus.filter(menu => {
    // Always show dashboard menu (unrestricted access)
    if (menu.key === 'dashboard') return true;
    
    // Check if user has access to this module
    const hasAccess = hasModuleAccess(menu.key, sidebarData);
    
    if (!hasAccess) return false;
    
    // If user has access to the module, show ALL children (no filtering)
    // This gives access to the whole menu if user has at least one permission to the module
    return true;
  });
};

/**
 * Get user's role name
 * @returns {string}
 */
export const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.roles?.length > 0 ? user.roles[0].role_name : "User";
};

/**
 * Get user's full name
 * @returns {string}
 */
export const getUserFullName = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.full_name || "User";
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

/**
 * Get the landing page ("Role Center") key configured on the user's role.
 * Falls back to "default" (the generic module-launcher dashboard) when the
 * role has none configured.
 * @returns {string}
 */
export const getUserLandingPageKey = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.landing_page_key || user?.roles?.[0]?.landing_page_key || "default";
};
