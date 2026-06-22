import apiClient from './client';

export const examApi = {
    // --- Exams ---
    getExams: async () => {
        const response = await apiClient.get('/exams');
        return response.data;
    },
    getExamById: async (id) => {
        const response = await apiClient.get(`/exams/${id}`);
        return response.data;
    },
    createExam: async (data) => {
        const response = await apiClient.post('/exams', data);
        return response.data;
    },
    updateExam: async (id, data) => {
        const response = await apiClient.put(`/exams/${id}`, data);
        return response.data;
    },
    deleteExam: async (id) => {
        const response = await apiClient.delete(`/exams/${id}`);
        return response.data;
    },
    publishExam: async (id, data) => {
        const response = await apiClient.put(`/exams/${id}/publish`, data);
        return response.data;
    },
    publishResults: async (id, data) => {
        const response = await apiClient.put(`/exams/${id}/publish-results`, data);
        return response.data;
    },
    toggleApplications: async (id, data) => {
        const response = await apiClient.put(`/exams/${id}/toggle-applications`, data);
        return response.data;
    },

    // --- Exam Types ---
    getExamTypes: async () => {
        const response = await apiClient.get('/exam-types');
        return response.data;
    },

    // --- Internal Exams & Schedules ---
    getMilestones: async () => {
        const response = await apiClient.get('/milestones');
        return response.data;
    },
    getInternalSchedules: async (collegeId) => {
        const qs = collegeId ? `?college_id=${collegeId}` : '';
        const response = await apiClient.get(`/internal-exams/schedules${qs}`);
        return response.data;
    },
    getInternalRounds: async () => {
        const response = await apiClient.get('/internal-exams/rounds');
        return response.data;
    },
    createInternalRound: async (data) => {
        const response = await apiClient.post('/internal-exams/rounds', data);
        return response.data;
    },
    updateInternalRound: async (id, data) => {
        const response = await apiClient.put(`/internal-exams/rounds/${id}`, data);
        return response.data;
    },

    // --- Examination Halls ---
    getHalls: async () => {
        const response = await apiClient.get('/examination-halls');
        return response.data;
    },
    getSeatingRequirement: async (examId) => {
        const url = examId ? `/examination-halls/seating-requirement?exam_id=${examId}` : `/examination-halls/seating-requirement`;
        const response = await apiClient.get(url);
        return response.data;
    },
    getHallMappings: async (examId) => {
        const response = await apiClient.get(`/examination-halls/${examId}`);
        return response.data;
    },
    createHallMapping: async (data) => {
        const response = await apiClient.post('/examination-halls', data);
        return response.data;
    },
    updateHallMapping: async (id, data) => {
        const response = await apiClient.put(`/examination-halls/${id}`, data);
        return response.data;
    },
    deleteHallMapping: async (id) => {
        const response = await apiClient.delete(`/examination-halls/${id}`);
        return response.data;
    },
    submitHallMapping: async (examId) => {
        const response = await apiClient.post(`/examination-halls/${examId}/submit`);
        return response.data;
    },
    getShortages: async () => {
        const response = await apiClient.get('/examination-halls/shortage');
        return response.data;
    },
    requestShortage: async (data) => {
        const response = await apiClient.post('/examination-halls/shortage-request', data);
        return response.data;
    },
    getTotalRooms: async () => {
        const response = await apiClient.get('/college-admin/total-rooms');
        return response.data;
    },
    updateTotalRooms: async (data) => {
        const response = await apiClient.put('/college-admin/total-rooms', data);
        return response.data;
    },
    getComponents: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/college-admin/get-components?${queryParams}`);
        return response.data;
    }
};
