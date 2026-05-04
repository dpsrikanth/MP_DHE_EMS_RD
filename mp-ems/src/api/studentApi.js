import apiClient from './client';

export const studentApi = {
    getResults: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/student/results?${queryParams}`);
        return response.data;
    },
    getExams: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/student/exams?${queryParams}`);
        return response.data;
    },
    registerExams: async (data) => {
        const response = await apiClient.post('/student/exams/register', data);
        return response.data;
    },
    getAttendanceSummary: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/student/attendance?${queryParams}`);
        return response.data;
    },
    getAttendanceHistory: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/student/attendance-history?${queryParams}`);
        return response.data;
    },
    getAttendanceDetail: async (subjectId) => {
        const response = await apiClient.get(`/student/attendance-detail/${subjectId}`);
        return response.data;
    },
    getResultSheet: async (examName) => {
        const response = await apiClient.get(`/student/result-sheet/${encodeURIComponent(examName)}`);
        return response.data;
    },
    getHallTicket: async (examName, semesterId) => {
        const response = await apiClient.get(`/student/hall-ticket/${encodeURIComponent(examName)}/${semesterId}`);
        return response.data;
    }
};
