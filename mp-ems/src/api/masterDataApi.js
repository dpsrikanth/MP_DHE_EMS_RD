import apiClient from './client';

export const masterDataApi = {
    // --- Academic Years ---
    getAcademicYears: async () => {
        const response = await apiClient.get('/academic-years');
        return response.data;
    },
    getAcademicYearById: async (id) => {
        const response = await apiClient.get(`/academic-years/${id}`);
        return response.data;
    },
    createAcademicYear: async (data) => {
        const response = await apiClient.post('/academic-years', data);
        return response.data;
    },
    updateAcademicYear: async (id, data) => {
        const response = await apiClient.put(`/academic-years/${id}`, data);
        return response.data;
    },
    deleteAcademicYear: async (id) => {
        const response = await apiClient.delete(`/academic-years/${id}`);
        return response.data;
    },
    getMasters: async () => {
        const response = await apiClient.get('/masters');
        return response.data;
    },
    getMasterDetails: async () => {
        const response = await apiClient.get('/masterDetails');
        return response.data;
    },
    mapAcademicYear: async (data) => {
        const response = await apiClient.post('/master-academic-years/map', data);
        return response.data;
    },
    unmapAcademicYear: async (id) => {
        const response = await apiClient.delete(`/master-academic-years/unmap/${id}`);
        return response.data;
    },

    // --- Colleges ---
    getColleges: async () => {
        const response = await apiClient.get('/colleges');
        return response.data;
    },
    getCollegeById: async (id) => {
        const response = await apiClient.get(`/colleges/${id}`);
        return response.data;
    },
    createCollege: async (data) => {
        const response = await apiClient.post('/colleges', data);
        return response.data;
    },
    updateCollege: async (id, data) => {
        const response = await apiClient.put(`/colleges/${id}`, data);
        return response.data;
    },
    deleteCollege: async (id) => {
        const response = await apiClient.delete(`/colleges/${id}`);
        return response.data;
    },
    getCollegeConfig: async (id) => {
        const response = await apiClient.get(`/colleges/${id}/config`);
        return response.data;
    },
    updateCollegeConfig: async (id, data) => {
        const response = await apiClient.put(`/colleges/${id}/config`, data);
        return response.data;
    },
    getCollegeSemesters: async (id) => {
        const response = await apiClient.get(`/colleges/${id}/semesters`);
        return response.data;
    },
    getCollegePrograms: async (id) => {
        const response = await apiClient.get(`/colleges/${id}/programs`);
        return response.data;
    },
    getCollegePolicies: async (id) => {
        const response = await apiClient.get(`/colleges/${id}/policies`);
        return response.data;
    },
    getCollegeAcademicYears: async (id) => {
        const response = await apiClient.get(`/colleges/${id}/academic-years`);
        return response.data;
    },

    // --- Universities ---
    getUniversities: async () => {
        const response = await apiClient.get('/universities');
        return response.data;
    },
    getUniversityById: async (id) => {
        const response = await apiClient.get(`/universities/${id}`);
        return response.data;
    },
    createUniversity: async (data) => {
        const response = await apiClient.post('/universities', data);
        return response.data;
    },
    updateUniversity: async (id, data) => {
        const response = await apiClient.put(`/universities/${id}`, data);
        return response.data;
    },
    deleteUniversity: async (id) => {
        const response = await apiClient.delete(`/universities/${id}`);
        return response.data;
    },
    getUniversityConfig: async (id) => {
        const response = await apiClient.get(`/universities/${id}/config`);
        return response.data;
    },
    updateUniversityConfig: async (id, data) => {
        const response = await apiClient.put(`/universities/${id}/config`, data);
        return response.data;
    },

    // --- Programs ---
    getPrograms: async () => {
        const response = await apiClient.get('/master-programs');
        return response.data;
    },
    getProgramById: async (id) => {
        const response = await apiClient.get(`/master-programs/${id}`);
        return response.data;
    },
    createProgram: async (data) => {
        const response = await apiClient.post('/master-programs', data);
        return response.data;
    },
    updateProgram: async (id, data) => {
        const response = await apiClient.put(`/master-programs/${id}`, data);
        return response.data;
    },
    deleteProgram: async (id) => {
        const response = await apiClient.delete(`/master-programs/${id}`);
        return response.data;
    },
    mapProgram: async (data) => {
        const response = await apiClient.post('/master-programs/map', data);
        return response.data;
    },
    unmapProgram: async (id) => {
        const response = await apiClient.delete(`/master-programs/unmap/${id}`);
        return response.data;
    },

    // --- Departments ---
    getDepartments: async () => {
        const response = await apiClient.get('/master-departments');
        return response.data;
    },
    getDepartmentById: async (id) => {
        const response = await apiClient.get(`/master-departments/${id}`);
        return response.data;
    },
    createDepartment: async (data) => {
        const response = await apiClient.post('/master-departments', data);
        return response.data;
    },
    updateDepartment: async (id, data) => {
        const response = await apiClient.put(`/master-departments/${id}`, data);
        return response.data;
    },
    deleteDepartment: async (id) => {
        const response = await apiClient.delete(`/master-departments/${id}`);
        return response.data;
    },

    // --- Batches ---
    getBatches: async () => {
        const response = await apiClient.get('/master-batches');
        return response.data;
    },
    getBatchById: async (id) => {
        const response = await apiClient.get(`/master-batches/${id}`);
        return response.data;
    },
    createBatch: async (data) => {
        const response = await apiClient.post('/master-batches', data);
        return response.data;
    },
    updateBatch: async (id, data) => {
        const response = await apiClient.put(`/master-batches/${id}`, data);
        return response.data;
    },
    deleteBatch: async (id) => {
        const response = await apiClient.delete(`/master-batches/${id}`);
        return response.data;
    },

    // --- Policies ---
    getPolicies: async () => {
        const response = await apiClient.get('/master-policies');
        return response.data;
    },
    getPolicyById: async (id) => {
        const response = await apiClient.get(`/master-policies/${id}`);
        return response.data;
    },
    createPolicy: async (data) => {
        const response = await apiClient.post('/master-policies', data);
        return response.data;
    },
    updatePolicy: async (id, data) => {
        const response = await apiClient.put(`/master-policies/${id}`, data);
        return response.data;
    },
    deletePolicy: async (id) => {
        const response = await apiClient.delete(`/master-policies/${id}`);
        return response.data;
    },

    // --- Semesters ---
    getSemesters: async () => {
        const response = await apiClient.get('/semesters');
        return response.data;
    },
    getSemesterById: async (id) => {
        const response = await apiClient.get(`/semesters/${id}`);
        return response.data;
    },
    createSemester: async (data) => {
        const response = await apiClient.post('/master-semesters', data);
        return response.data;
    },
    updateSemester: async (id, data) => {
        const response = await apiClient.put(`/master-semesters/${id}`, data);
        return response.data;
    },
    deleteSemester: async (id) => {
        const response = await apiClient.delete(`/master-semesters/${id}`);
        return response.data;
    },
    mapSemester: async (data) => {
        const response = await apiClient.post('/master-semesters/map', data);
        return response.data;
    },
    unmapSemester: async (id) => {
        const response = await apiClient.delete(`/master-semesters/unmap/${id}`);
        return response.data;
    },

    // --- Teachers ---
    getDesignations: async () => {
        const response = await apiClient.get('/master-designations');
        return response.data;
    },

    // --- Teachers ---
    getTeachers: async (params) => {
        const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await apiClient.get(`/master-teachers${queryParams}`);
        return response.data;
    },
    getTeacherById: async (id) => {
        const response = await apiClient.get(`/master-teachers/${id}`);
        return response.data;
    },
    createTeacher: async (data) => {
        const response = await apiClient.post('/master-teachers', data);
        return response.data;
    },
    updateTeacher: async (id, data) => {
        const response = await apiClient.put(`/master-teachers/${id}`, data);
        return response.data;
    },
    deleteTeacher: async (id) => {
        const response = await apiClient.delete(`/master-teachers/${id}`);
        return response.data;
    },

    // --- Subjects ---
    getSubjects: async (params) => {
        const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await apiClient.get(`/master-subjects${queryParams}`);
        return response.data;
    },
    getSubjectById: async (id) => {
        const response = await apiClient.get(`/master-subjects/${id}`);
        return response.data;
    },
    createSubject: async (data) => {
        const response = await apiClient.post('/master-subjects', data);
        return response.data;
    },
    updateSubject: async (id, data) => {
        const response = await apiClient.put(`/master-subjects/${id}`, data);
        return response.data;
    },
    deleteSubject: async (id) => {
        const response = await apiClient.delete(`/master-subjects/${id}`);
        return response.data;
    },
    getSubjectMappings: async () => {
        const response = await apiClient.get('/subject-mappings');
        return response.data;
    },

    // --- Students ---
    getStudents: async (params) => {
        const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await apiClient.get(`/students${queryParams}`);
        return response.data;
    },
    getStudentById: async (id) => {
        const response = await apiClient.get(`/students/${id}`);
        return response.data;
    },
    createStudent: async (data) => {
        const response = await apiClient.post('/students', data);
        return response.data;
    },
    updateStudent: async (id, data) => {
        const response = await apiClient.put(`/students/${id}`, data);
        return response.data;
    },
    deleteStudent: async (id) => {
        const response = await apiClient.delete(`/students/${id}`);
        return response.data;
    },
    getNextStudentSerial: async (year, dept) => {
        const response = await apiClient.get(`/students/next-serial/${encodeURIComponent(year)}/${encodeURIComponent(dept)}`);
        return response.data;
    },

    // --- Users ---
    getUsers: async () => {
        const response = await apiClient.get('/users');
        return response.data;
    },
    getUserById: async (id) => {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },
    createUser: async (data) => {
        const response = await apiClient.post('/users', data);
        return response.data;
    },
    updateUser: async (id, data) => {
        const response = await apiClient.put(`/users/${id}`, data);
        return response.data;
    },
    deleteUser: async (id) => {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    },

    // --- Roles ---
    getRoles: async () => {
        const response = await apiClient.get('/roles');
        return response.data;
    },
    getRoleById: async (id) => {
        const response = await apiClient.get(`/roles/${id}`);
        return response.data;
    },
    createRole: async (data) => {
        const response = await apiClient.post('/roles', data);
        return response.data;
    },
    updateRole: async (id, data) => {
        const response = await apiClient.put(`/roles/${id}`, data);
        return response.data;
    },
    deleteRole: async (id) => {
        const response = await apiClient.delete(`/roles/${id}`);
        return response.data;
    },
};
