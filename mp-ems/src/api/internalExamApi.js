import apiClient from './client';

export const internalExamApi = {
    /**
     * Get internal exam rounds.
     * @param {number|string} [collegeId] - required for super/university admins
     */
    getRounds: async (collegeId) => {
        const qs = collegeId ? `?college_id=${collegeId}` : '';
        const response = await apiClient.get(`/internal-exams/rounds${qs}`);
        return response.data;
    },

    /**
     * Get available contexts for a round.
     * @param {number|string} roundId
     * @param {number|string} [collegeId] - required for super/university admins
     */
    getAvailableContexts: async (roundId, collegeId) => {
        const params = new URLSearchParams({ round_id: roundId });
        if (collegeId) params.append('college_id', collegeId);
        const response = await apiClient.get(`/internal-exams/available-contexts?${params.toString()}`);
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
