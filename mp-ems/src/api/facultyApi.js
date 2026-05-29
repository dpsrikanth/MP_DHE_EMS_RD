import apiClient from './client';

export const facultyApi = {
    // --- Assigned Subjects ---
    getAssignedSubjects: async (teacherId) => {
        const response = await apiClient.get(`/faculty-marks/assigned-subjects/${teacherId}`);
        return response.data;
    },

    // --- Marks Structure (shared with college admin but used by faculty) ---
    getMarksStructure: async (subjectId) => {
        const response = await apiClient.get(`/college-admin/marks-structure/${subjectId}`);
        return response.data;
    },

    // --- Student Retrieval ---
    getStudentsForSubject: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/faculty-marks/students?${queryParams}`);
        return response.data;
    },

    getStudentsForRound: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/faculty-marks/students-for-round?${queryParams}`);
        return response.data;
    },

    // --- Marks Management ---
    getEnteredMarks: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/faculty-marks/entered-marks?${queryParams}`);
        return response.data;
    },

    saveMarks: async (data) => {
        const response = await apiClient.post('/faculty-marks/enter-marks', data);
        return response.data;
    },

    submitMarks: async (data) => {
        const response = await apiClient.post('/faculty-marks/submit-marks', data);
        return response.data;
    },

    publishRound: async (data) => {
        const response = await apiClient.post('/faculty-marks/publish-round', data);
        return response.data;
    },

    requestRoundUnlock: async (data) => {
        const response = await apiClient.post('/faculty-marks/request-round-unlock', data);
        return response.data;
    },

    requestUnlock: async (data) => {
        const response = await apiClient.post('/faculty-marks/request-unlock', data);
        return response.data;
    },

    // --- Exam Rounds & Schedules ---
    getExamRounds: async (teacherId, academicYearId = null, semesterId = null) => {
        let url = `/faculty-marks/exam-rounds?teacher_id=${teacherId}`;
        if (academicYearId) url += `&academic_year_id=${academicYearId}`;
        if (semesterId) url += `&semester_id=${semesterId}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    getInternalSchedules: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/internal-exams/schedules?${queryParams}`);
        return response.data;
    },
    
    // --- Dashboard ---
    getDashboardData: async () => {
        const response = await apiClient.get('/faculty-marks/dashboard');
        return response.data;
    },

    checkAssigned: async () => {
        const response = await apiClient.get('/paper-setter/faculty/check-assigned');
        return response.data;
    },
    /**
     * Get attendance for a specific session
     */
    getAttendance: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/faculty-marks/attendance?${queryParams}`);
        return response.data;
    },

    /**
     * Get attendance summary for a subject/section
     */
    getAttendanceSummary: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/faculty-marks/attendance-summary?${queryParams}`);
        return response.data;
    },

    /**
     * Save attendance for a session
     */
    saveAttendance: async (data) => {
        const response = await apiClient.post('/faculty-marks/attendance', data);
        return response.data;
    },
    getPendingDiscrepancies: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/faculty-marks/pending-discrepancies?${queryParams}`);
        return response.data;
    },
    resolveDiscrepancy: async (data) => {
        const response = await apiClient.post('/faculty-marks/resolve-discrepancy', data);
        return response.data;
    },

    // --- Invigilation Duties ---
    getInvigilationDuties: async () => {
        const response = await apiClient.get('/faculty-marks/invigilation/duties');
        return response.data;
    },

    getInvigilationHallStudents: async (examId, hallId) => {
        const response = await apiClient.get(`/faculty-marks/invigilation/hall-students?exam_id=${examId}&hall_id=${hallId}`);
        return response.data;
    },

    saveExternalAttendance: async (data) => {
        const response = await apiClient.post('/faculty-marks/invigilation/attendance/save', data);
        return response.data;
    },

    /**
     * Get attendance shortage report for faculty's assigned subjects
     */
    getAttendanceShortage: async (params) => {
        const response = await apiClient.get('/reports/faculty-attendance-shortage', { params });
        return response.data;
    }
};

