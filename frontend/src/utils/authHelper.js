/**
 * Helper functions for authentication
 */

export const hasValidToken = () => {
  const token = localStorage.getItem("admin_token");
  return !!token; // Return true if token exists
};

export const getToken = () => {
  return localStorage.getItem("admin_token");
};

export const clearAuth = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("role");
  localStorage.removeItem("userEmail");
};

export const isAdmin = () => {
  const role = localStorage.getItem("role");
  return role === "admin";
};

export const getUserEmail = () => {
  return localStorage.getItem("userEmail");
};
