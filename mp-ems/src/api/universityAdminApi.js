import apiClient from './client';

export const universityAdminApi = {
    getResultHubData: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/university-admin/result-hub-data?${queryParams}`);
        return response.data;
    },
    publishResults: async (examId, data) => {
        const response = await apiClient.put(`/exams/${examId}/publish-results`, data);
        return response.data;
    },
    allocateStudents: async (data) => {
        const response = await apiClient.post('/university-admin/allocate-students', data);
        return response.data;
    },
    getStudentsForAllocation: async (collegeId, params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/university-admin/students-for-allocation/${collegeId}?${queryParams}`);
        return response.data;
    },
    getPendingHallApprovals: async () => {
        const response = await apiClient.get('/examination-halls/pending');
        return response.data;
    },
    getShortageRequests: async () => {
        const response = await apiClient.get('/examination-halls/shortage-requests');
        return response.data;
    },
    approveRejectHall: async (hallId, data) => {
        const response = await apiClient.put(`/examination-halls/${hallId}/approve-reject`, data);
        return response.data;
    },
    allocateShortageRequest: async (requestId, data) => {
        const response = await apiClient.put(`/examination-halls/shortage-requests/${requestId}/allocate`, data);
        return response.data;
    },
    getExternalFaculties: async () => {
        const response = await apiClient.get('/university-admin/external-faculties');
        return response.data;
    },
    getPendingExternalAssignments: async () => {
        const response = await apiClient.get('/university-admin/pending-external-assignments');
        return response.data;
    },
    getExternalAssignments: async () => {
        const response = await apiClient.get('/university-admin/external-assignments');
        return response.data;
    },
    assignExternalFaculty: async (data) => {
        const response = await apiClient.post('/university-admin/assign-external-faculty', data);
        return response.data;
    },
    getHallShortageRequests: async () => {
        const response = await apiClient.get('/examination-halls/shortage-requests');
        return response.data;
    },
    allocateHallShortage: async (requestId, data) => {
        const response = await apiClient.post(`/examination-halls/shortage-requests/${requestId}/allocate`, data);
        return response.data;
    },
    getInstitutionalRanking: async () => {
        const response = await apiClient.get('/reports/institutional-ranking');
        return response.data;
    },
    getInfrastructureAnalytics: async (examId) => {
        let url = '/reports/infrastructure-analytics';
        if (examId) url += `?exam_id=${examId}`;
        const response = await apiClient.get(url);
        return response.data;
    },
    getGlobalExamStats: async (examId) => {
        let url = '/reports/global-exam-stats';
        if (examId) url += `?exam_id=${examId}`;
        const response = await apiClient.get(url);
        return response.data;
    },
    getStudentSearchDetails: async (admissionNo) => {
        const response = await apiClient.get(`/university-admin/student-search/${admissionNo}`);
        return response.data;
    }
};
