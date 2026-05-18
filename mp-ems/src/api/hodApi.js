import apiClient from './client';

export const hodApi = {
    /**
     * Get pending marks approvals for HOD
     */
    getPendingApprovals: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/marks/approvals?${queryParams}`);
        return response.data;
    },

    /**
     * Get assessment acceptance list
     */
    getAssessmentAcceptance: async () => {
        const response = await apiClient.get('/college-admin/pending-component-approvals');
        return response.data;
    },

    /**
     * Approve a component unlock request
     */
    approveComponentUnlock: async (data) => {
        const response = await apiClient.post('/college-admin/approve-component-unlock', data);
        return response.data;
    },

    /**
     * Reject a component mark
     */
    rejectComponent: async (data) => {
        const response = await apiClient.post('/college-admin/reject-component', data);
        return response.data;
    },

    /**
     * Fetch students + their marks for a specific component (for HOD inline view)
     */
    getComponentStudentMarks: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/college-admin/component-student-marks?${queryParams}`);
        return response.data;
    }
};
