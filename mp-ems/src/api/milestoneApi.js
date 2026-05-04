import apiClient from './client';

export const milestoneApi = {
    /**
     * Get all milestones with filters
     */
    getMilestones: async (params) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/milestones?${queryParams}`);
        return response.data;
    },

    /**
     * Create new milestone
     */
    createMilestone: async (data) => {
        const response = await apiClient.post('/milestones', data);
        return response.data;
    },

    /**
     * Update milestone
     */
    updateMilestone: async (id, data) => {
        const response = await apiClient.put(`/milestones/${id}`, data);
        return response.data;
    },

    /**
     * Delete milestone
     */
    deleteMilestone: async (id) => {
        const response = await apiClient.delete(`/milestones/${id}`);
        return response.data;
    },

    /**
     * Get roadmap validation setting
     */
    getValidationSetting: async () => {
        const response = await apiClient.get('/settings/roadmap_validation');
        return response.data;
    },

    /**
     * Update roadmap validation setting
     */
    updateValidationSetting: async (enabled) => {
        const response = await apiClient.put('/settings/roadmap_validation', { 
            value: { enabled } 
        });
        return response.data;
    }
};
