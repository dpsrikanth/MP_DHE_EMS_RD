// Authentication utility functions

export const authUtils = {
  // Store authentication data
  setAuth: (token, roleName, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("roleName", roleName);
    localStorage.setItem("userId", userId);
  },

  // Get authentication data
  getAuth: () => ({
    token: localStorage.getItem("token"),
    roleName: localStorage.getItem("roleName"),
    userId: localStorage.getItem("userId"),
  }),

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Check if user is admin
  isAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName  === "SUPER_ADMIN";
  },

  // Logout and clear auth data
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roleName");
    localStorage.removeItem("userId");
  },

  // Get authorization header
  getAuthHeader: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),
};

export default authUtils;
