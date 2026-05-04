import apiClient from './client';

export const collegeAdminApi = {
    /**
     * Fetch KPI stats for the college admin dashboard
     */
    getDashboardStats: async () => {
        const response = await apiClient.get('/college-admin/dashboard-stats');
        return response.data;
    },

    /**
     * Fetch notifications for the college admin dashboard
     */
    getNotifications: async () => {
        const response = await apiClient.get('/college-admin/notifications');
        return response.data;
    },

    /**
     * Mark a notification as read
     */
    markNotificationAsRead: async (id) => {
        const response = await apiClient.put(`/college-admin/notifications/${id}/read`);
        return response.data;
    },

    /**
     * Get marks structure for a subject
     */
    getMarksStructure: async (subjectId) => {
        const response = await apiClient.get(`/college-admin/marks-structure/${subjectId}`);
        return response.data;
    },

    /**
     * Get marks for review (grouped by student)
     */
    getReviewMarks: async (params) => {
        const response = await apiClient.get('/college-admin/review-marks', { params });
        return response.data;
    },

    /**
     * Get workflow status for monitoring
     */
    getWorkflowStatus: async (params) => {
        const response = await apiClient.get('/college-admin/workflow-status', { params });
        return response.data;
    },

    /**
     * Update workflow status (Approve section)
     */
    updateWorkflowStatus: async (data) => {
        const response = await apiClient.post('/college-admin/workflow-status', data);
        return response.data;
    },

    /**
     * Lock marks and process results
     */
    lockMarks: async (data) => {
        const response = await apiClient.post('/college-admin/lock-marks', data);
        return response.data;
    },

    /**
     * Reject a whole workflow section
     */
    rejectWorkflowSection: async (data) => {
        const response = await apiClient.post('/college-admin/reject-workflow-section', data);
        return response.data;
    },

    /**
     * Send correction request back to college admin
     */
    sendBackCorrection: async (data) => {
        const response = await apiClient.post('/college-admin/send-back-correction', data);
        return response.data;
    },

    /**
     * Save review for an individual student's marks
     */
    saveStudentReview: async (data) => {
        const response = await apiClient.post('/college-admin/save-student-review', data);
        return response.data;
    },

    /**
     * Get all marks structures
     */
    getAllMarksStructures: async () => {
        const response = await apiClient.get('/college-admin/all-marks-structures');
        return response.data;
    },

    /**
     * Save marks structure component
     */
    saveMarksStructure: async (data) => {
        const response = await apiClient.post('/college-admin/marks-structure', data);
        return response.data;
    },

    /**
     * Update marks structure component
     */
    updateMarksStructure: async (id, data) => {
        const response = await apiClient.put(`/college-admin/marks-structure/${id}`, data);
        return response.data;
    },

    /**
     * Delete marks structure component
     */
    deleteMarksStructure: async (id) => {
        const response = await apiClient.delete(`/college-admin/marks-structure/${id}`);
        return response.data;
    },

    /**
     * Get policy mappings for the current college
     */
    getPolicyMappings: async () => {
        const response = await apiClient.get('/college-admin/policy-mappings');
        return response.data;
    },

    /**
     * Map program/semester to policy
     */
    mapPolicy: async (data) => {
        const response = await apiClient.post('/college-admin/map-policy', data);
        return response.data;
    },

    /**
     * Map subject to policy
     */
    mapSubject: async (data) => {
        const response = await apiClient.post('/college-admin/map-subject', data);
        return response.data;
    },

    /**
     * Update policy mapping
     */
    updatePolicyMapping: async (id, data) => {
        const response = await apiClient.put(`/college-admin/policy-mappings/${id}`, data);
        return response.data;
    },

    /**
     * Delete policy mapping
     */
    deletePolicyMapping: async (id) => {
        const response = await apiClient.delete(`/college-admin/policy-mappings/${id}`);
        return response.data;
    },

    /**
     * Unlock marks for faculty editing
     */
    unlockMarks: async (data) => {
        const response = await apiClient.post('/college-admin/unlock-marks', data);
        return response.data;
    },

    /**
     * Get marks audit log
     */
    getMarksAuditLog: async (params) => {
        const response = await apiClient.get('/college-admin/marks-audit-log', { params });
        return response.data;
    },

    /**
     * Get faculty grading status report
     */
    getFacultyGradingStatus: async (params) => {
        const response = await apiClient.get('/reports/faculty-grading-status', { params });
        return response.data;
    },

    /**
     * Get faculty assignments for a college
     */
    getFacultyAssignments: async (collegeId) => {
        const response = await apiClient.get(`/college-admin/faculty-assignments/${collegeId}`);
        return response.data;
    },

    /**
     * Assign faculty to a subject/section
     */
    assignFaculty: async (data) => {
        const response = await apiClient.post('/college-admin/assign-faculty', data);
        return response.data;
    },

    /**
     * Update faculty assignment
     */
    updateFacultyAssignment: async (id, data) => {
        const response = await apiClient.put(`/college-admin/faculty-assignments/${id}`, data);
        return response.data;
    },

    /**
     * Delete faculty assignment
     */
    deleteFacultyAssignment: async (id) => {
        const response = await apiClient.delete(`/college-admin/faculty-assignments/${id}`);
        return response.data;
    },

    /**
     * Get published exams
     */
    getExams: async () => {
        const response = await apiClient.get('/exams/published');
        return response.data;
    },

    /**
     * Get examination halls
     */
    getHalls: async () => {
        const response = await apiClient.get('/examination-halls');
        return response.data;
    },

    /**
     * Create examination hall mapping
     */
    createHallMapping: async (data) => {
        const response = await apiClient.post('/examination-halls', data);
        return response.data;
    },

    /**
     * Update examination hall mapping
     */
    updateHallMapping: async (id, data) => {
        const response = await apiClient.put(`/examination-halls/${id}`, data);
        return response.data;
    },

    /**
     * Delete examination hall mapping
     */
    deleteHallMapping: async (id) => {
        const response = await apiClient.delete(`/examination-halls/${id}`);
        return response.data;
    },

    /**
     * Submit hall mapping for approval
     */
    submitHallMapping: async (id) => {
        const response = await apiClient.post(`/examination-halls/${id}/submit`);
        return response.data;
    },

    /**
     * Get seating requirement for an exam
     */
    getSeatingRequirement: async (examId) => {
        const url = examId ? `/examination-halls/requirement?exam_id=${examId}` : '/examination-halls/requirement';
        const response = await apiClient.get(url);
        return response.data;
    },

    /**
     * Get shortage requests
     */
    getShortages: async () => {
        const response = await apiClient.get('/examination-halls/shortages');
        return response.data;
    },

    /**
     * Request shortage reporting
     */
    requestShortage: async (data) => {
        const response = await apiClient.post('/examination-halls/report-shortage', data);
        return response.data;
    },

    /**
     * Get marks report report
     */
    getMarksReport: async (params) => {
        const response = await apiClient.get('/college-admin/marks-report', { params });
        return response.data;
    },

    /**
     * Get seating arrangements
     */
    getSeatingArrangements: async (params) => {
        const response = await apiClient.get('/college-admin/seating-arrangements', { params });
        return response.data;
    },

    /**
     * Auto-allocate seats
     */
    autoAllocateSeats: async (data) => {
        const response = await apiClient.post('/college-admin/auto-allocate-seats', data);
        return response.data;
    },

    /**
     * Lock/Unlock seating
     */
    lockSeating: async (data) => {
        const response = await apiClient.post('/college-admin/lock-seating', data);
        return response.data;
    },

    /**
     * Clear seating assignments
     */
    clearSeatingAssignments: async (data) => {
        const response = await apiClient.post('/college-admin/clear-seating-assignments', data);
        return response.data;
    },

    /**
     * Get college performance report
     */
    getCollegePerformance: async () => {
        const response = await apiClient.get('/reports/college-performance');
        return response.data;
    },

    /**
     * Get total rooms
     */
    getTotalRooms: async () => {
        const response = await apiClient.get('/college-admin/total-rooms');
        return response.data;
    },

    /**
     * Update total rooms
     */
    updateTotalRooms: async (data) => {
        const response = await apiClient.put('/college-admin/total-rooms', data);
        return response.data;
    }
};
