// Authentication utility functions

export const authUtils = {
  setAuth: (token, roleName, userId, collegeId, userObj, departmentId, universityId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("roleName", roleName);
    localStorage.setItem("userId", userId);
    if (collegeId) localStorage.setItem("collegeId", collegeId);
    if (departmentId) localStorage.setItem("departmentId", departmentId);
    if (universityId) localStorage.setItem("universityId", universityId);
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

  getUserEmail: () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.email;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
    }
    return null;
  },

  isSystemAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "superadmin" || roleName === "superAdmin";
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Check if user is admin
  isAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "superadmin" || roleName === "superAdmin" || roleName === "admin" || roleName === "university_admin";
  },

  isSuperAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "superadmin" || roleName === "superAdmin";
  },

  isUniversityAdmin: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "university_admin";
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

  isSecrecy: () => {
    const roleName = localStorage.getItem("roleName");
    if (!roleName) return false;
    const normalized = roleName.toLowerCase();
    return normalized === "secrecy" || normalized === "secrecy_dept";
  },

  isPaperSetter: () => {
    const roleName = localStorage.getItem("roleName");
    return roleName === "PAPER_SETTER";
  },

  // Logout and clear auth data
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roleName");
    localStorage.removeItem("userId");
    localStorage.removeItem("collegeId");
    localStorage.removeItem("departmentId");
    localStorage.removeItem("universityId");
    localStorage.removeItem("user");
  },

  // Get authorization header
  getAuthHeader: () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }),

  getUniversityId: () => {
    return localStorage.getItem("universityId");
  },
};

export default authUtils;
