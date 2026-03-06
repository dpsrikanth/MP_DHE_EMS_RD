// Authentication utility functions

export const authUtils = {
  // Store authentication data
  setAuth: (token, roleName, userId, collegeId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("roleName", roleName);
    localStorage.setItem("userId", userId);
    if (collegeId) localStorage.setItem("collegeId", collegeId);
  },

  // Get authentication data
  getAuth: () => ({
    token: localStorage.getItem("token"),
    roleName: localStorage.getItem("roleName"),
    userId: localStorage.getItem("userId"),
    collegeId: localStorage.getItem("collegeId"),
  }),

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Check if user is admin
  isAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "SUPER_ADMIN" || roleName === "admin" || roleName === "superAdmin";
  },

  isCollegeAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "college_admin";
  },

  isFaculty: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "Faculty" || roleName === "Teacher";
  },

  // Logout and clear auth data
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roleName");
    localStorage.removeItem("userId");
    localStorage.removeItem("collegeId");
  },

  // Get authorization header
  getAuthHeader: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),
};

export default authUtils;
