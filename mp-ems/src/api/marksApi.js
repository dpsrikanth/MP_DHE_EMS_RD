import apiClient from './client';

export const marksApi = {
    // --- Internal Marks (Faculty) ---
    getStudentsForMarks: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/marks/students?${queryParams}`);
        return response.data;
    },
    
    saveInternalMarks: async (data) => {
        const response = await apiClient.post('/marks/teacher-save', data);
        return response.data;
    },
    
    bulkUploadMarks: async (data) => {
        const response = await apiClient.post('/marks/bulk-upload', data);
        return response.data;
    },

    // --- Internal Marks (HOD Approvals) ---
    getApprovals: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/marks/approvals?${queryParams}`);
        return response.data;
    },

    approveRejectMarks: async (data) => {
        const response = await apiClient.post('/marks/approve-reject', data);
        return response.data;
    },

    // --- External Marks (External Faculty) ---
    getExternalAssignments: async () => {
        const response = await apiClient.get('/external-faculty/assignments');
        return response.data;
    },

    saveExternalMarks: async (data) => {
        const response = await apiClient.post('/external-faculty/save-marks', data);
        return response.data;
    },

    finalizeExternalMarks: async (data) => {
        const response = await apiClient.post('/external-faculty/finalize-marks', data);
        return response.data;
    },

    unlockExternalSubject: async (data) => {
        const response = await apiClient.post('/external-faculty/unlock-subject', data);
        return response.data;
    },
    
    bulkUploadExternalMarks: async (data) => {
        const response = await apiClient.post('/external-faculty/bulk-upload', data);
        return response.data;
    },

    // --- Grading Config ---
    getGradingConfig: async (targetUniversityId) => {
        let url = '/grading/config';
        if (targetUniversityId) url += `?targetUniversityId=${targetUniversityId}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    saveGradingConfig: async (data) => {
        const response = await apiClient.post('/grading/config', data);
        return response.data;
    }
};
