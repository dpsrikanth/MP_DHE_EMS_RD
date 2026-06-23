import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      roleName: null,
      userId: null,
      collegeId: null,
      departmentId: null,
      universityId: null,
      user: null,

      setAuth: (token, roleName, userId, collegeId, departmentId, universityId, userObj) => {
        set({
          token,
          roleName,
          userId,
          collegeId: collegeId || null,
          departmentId: departmentId || null,
          universityId: universityId || null,
          user: userObj || null,
        });
      },

      logout: () => {
        set({
          token: null,
          roleName: null,
          userId: null,
          collegeId: null,
          departmentId: null,
          universityId: null,
          user: null,
        });
      },

      isAuthenticated: () => !!get().token,
      
      isAdmin: () => {
        const role = get().roleName;
        return role === "superadmin" || role === "superAdmin" || role === "admin" || role === "university_admin";
      },
      
      isSystemAdmin: () => {
        const role = get().roleName;
        return role === "superadmin" || role === "superAdmin";
      },
      
      isUniversityAdmin: () => get().roleName === "university_admin",
      isCollegeAdmin: () => get().roleName === "college_admin",
      isHOD: () => get().roleName === "HOD",
      isFaculty: () => {
        const role = get().roleName;
        if (!role) return false;
        const normalized = role.toLowerCase();
        return normalized === "faculty" || normalized === "teacher";
      },
      isStudent: () => get().roleName?.toLowerCase() === "student",
      isExternalFaculty: () => get().roleName === "External Faculty",
      isSecrecy: () => {
        const role = get().roleName;
        if (!role) return false;
        const normalized = role.toLowerCase();
        return normalized === "secrecy" || normalized === "secrecy_dept";
      },
      isPaperSetter: () => get().roleName === "PAPER_SETTER",
      
      getUserEmail: () => {
        const user = get().user;
        return user?.email || null;
      },
      
      getAuthHeader: () => ({
        Authorization: `Bearer ${get().token}`
      }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      // getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
    }
  )
);

export default useAuthStore;
