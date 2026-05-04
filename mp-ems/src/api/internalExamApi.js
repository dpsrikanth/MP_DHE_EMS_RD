import apiClient from './client';

export const internalExamApi = {
    /**
     * Get internal exam rounds
     */
    getRounds: async () => {
        const response = await apiClient.get('/internal-exams/rounds');
        return response.data;
    },

    /**
     * Get available contexts for a round
     */
    getAvailableContexts: async (roundId) => {
        const response = await apiClient.get(`/internal-exams/available-contexts?round_id=${roundId}`);
        return response.data;
    },

    /**
     * Get exam schedules
     */
    getSchedules: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/internal-exams/schedules?${queryParams}`);
        return response.data;
    },

    /**
     * Save exam schedules
     */
    saveSchedules: async (data) => {
        const response = await apiClient.post('/internal-exams/schedules', data);
        return response.data;
    }
};
