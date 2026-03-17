// Authentication utility functions

export const authUtils = {
  setAuth: (token, roleName, userId, collegeId, userObj, departmentId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("roleName", roleName);
    localStorage.setItem("userId", userId);
    if (collegeId) localStorage.setItem("collegeId", collegeId);
    if (departmentId) localStorage.setItem("departmentId", departmentId);
    if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
  },

  // Get authentication data
  getAuth: () => ({
    token: localStorage.getItem("token"),
    roleName: localStorage.getItem("roleName"),
    userId: localStorage.getItem("userId"),
    collegeId: localStorage.getItem("collegeId"),
    departmentId: localStorage.getItem("departmentId"),
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

  isHOD: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "HOD";
  },

  isFaculty: () => {
    const roleName = localStorage.getItem("roleName");
    if (!roleName) return false;
    const normalizedRole = roleName.toLowerCase();
    return normalizedRole === "faculty" || normalizedRole === "teacher";
  },

  isStudent: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName?.toLowerCase() === "student";
  },

  isExternalFaculty: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "External Faculty";
  },

  // Logout and clear auth data
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roleName");
    localStorage.removeItem("userId");
    localStorage.removeItem("collegeId");
    localStorage.removeItem("departmentId");
    localStorage.removeItem("user");
  },

  // Get authorization header
  getAuthHeader: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),
};

export default authUtils;
