import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient, { logout as clearAuthSession } from "../api/apiClient";

const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sidebarMenus, setSidebarMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err);
      }
    }
    setLoading(false);
  }, []);

  // Fetch sidebar menus when user is available
  useEffect(() => {
    if (user && localStorage.getItem("token")) {
      fetchSidebarMenus();
    }
  }, [user]);

  const fetchSidebarMenus = async () => {
    try {
      const res = await apiClient.get("/IAmAPI/api/modules/sidebar", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setSidebarMenus(res.data);
    } catch (err) {
      console.error("Failed to fetch sidebar menus:", err);
      setError("Failed to load menus");
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setSidebarMenus([]);
    clearAuthSession();
  };

  const hasPermission = (requiredPermission) => {
    if (!user?.permissions) return false;
    return user.permissions.some(
      (p) =>
        p.resource_name?.toLowerCase() === requiredPermission.resource?.toLowerCase() &&
        p.action_name?.toLowerCase() === requiredPermission.action?.toLowerCase()
    );
  };

  const hasModuleAccess = (moduleKey) => {
    const moduleKeyMap = {
      dashboard: "Intelligence",
      accounting: "Accounting",
      payables: "Payables",
      receivables: "Receivables",
      procurement: "Procurement",
      inventory: "Inventory",
      sales: "Sales",
      hr_management: "HR Management",
      "Payroll Management": "Payroll Management",
      user_management: "Users Management",
    };

    const moduleName = moduleKeyMap[moduleKey];
    if (!moduleName || !sidebarMenus.length) return false;

    return sidebarMenus.some(
      (module) => module.module_name?.toLowerCase() === moduleName.toLowerCase()
    );
  };

  const value = {
    user,
    sidebarMenus,
    loading,
    error,
    updateUser,
    logout,
    hasPermission,
    hasModuleAccess,
    refreshSidebarMenus: fetchSidebarMenus,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
