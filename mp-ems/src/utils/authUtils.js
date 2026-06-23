import { useAuthStore } from '../store/useAuthStore';

// Authentication utility functions
// These simply proxy to the Zustand store, allowing non-React files 
// to interact with auth state without using hooks.

export const authUtils = {
  setAuth: (token, roleName, userId, collegeId, userObj, departmentId, universityId) => {
    useAuthStore.getState().setAuth(
      token, 
      roleName, 
      userId, 
      collegeId, 
      departmentId, 
      universityId, 
      userObj
    );
  },

  // Get authentication data
  getAuth: () => ({
    token: useAuthStore.getState().token,
    roleName: useAuthStore.getState().roleName,
    userId: useAuthStore.getState().userId,
    collegeId: useAuthStore.getState().collegeId,
    departmentId: useAuthStore.getState().departmentId,
  }),

  getUserEmail: () => useAuthStore.getState().getUserEmail(),

  isSystemAdmin: () => useAuthStore.getState().isSystemAdmin(),

  // Check if user is authenticated
  isAuthenticated: () => useAuthStore.getState().isAuthenticated(),

  // Check if user is admin
  isAdmin: () => useAuthStore.getState().isAdmin(),

  isSuperAdmin: () => useAuthStore.getState().isSystemAdmin(),

  isUniversityAdmin: () => useAuthStore.getState().isUniversityAdmin(),

  isCollegeAdmin: () => useAuthStore.getState().isCollegeAdmin(),

  isHOD: () => useAuthStore.getState().isHOD(),

  isFaculty: () => useAuthStore.getState().isFaculty(),

  isStudent: () => useAuthStore.getState().isStudent(),

  isExternalFaculty: () => useAuthStore.getState().isExternalFaculty(),

  isSecrecy: () => useAuthStore.getState().isSecrecy(),

  isPaperSetter: () => useAuthStore.getState().isPaperSetter(),

  // Logout and clear auth data
  logout: () => {
    useAuthStore.getState().logout();
  },

  // Get authorization header
  getAuthHeader: () => useAuthStore.getState().getAuthHeader(),

  getUniversityId: () => useAuthStore.getState().universityId,
};

export default authUtils;
