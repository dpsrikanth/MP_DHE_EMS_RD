import apiClient from './client';

export const dashboardApi = {
    /**
     * Get system-wide dashboard statistics
     */
    getStats: async () => {
        const response = await apiClient.get('/dashboard/stats');
        return response.data;
    }
};
