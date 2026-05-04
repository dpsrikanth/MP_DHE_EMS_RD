import apiClient from './client';

export const secrecyApi = {
    getPapers: async () => {
        const response = await apiClient.get('/secrecy/papers');
        return response.data;
    },
    updatePaperStatus: async (assignment_id, status, feedback = '') => {
        const response = await apiClient.post('/secrecy/papers/status', {
            assignment_id,
            status,
            feedback
        });
        return response.data;
    },
    downloadPaper: async (paper_id) => {
        const response = await apiClient.get(`/paper-setter/download/${paper_id}`, {
            responseType: 'blob'
        });
        
        // Return both the blob and the headers so we can extract the filename
        return {
            blob: response.data,
            headers: response.headers
        };
    },

    /**
     * Get secrecy dashboard stats
     */
    getStats: async () => {
        const response = await apiClient.get('/secrecy/stats');
        return response.data;
    },

    /**
     * Get recent activity
     */
    getActivity: async () => {
        const response = await apiClient.get('/secrecy/activity');
        return response.data;
    },

    /**
     * Get all paper setters
     */
    getPaperSetters: async () => {
        const response = await apiClient.get('/secrecy/setters');
        return response.data;
    },

    /**
     * Create new paper setter
     */
    createPaperSetter: async (data) => {
        const response = await apiClient.post('/secrecy/setters/new', data);
        return response.data;
    },

    /**
     * Update paper setter
     */
    updatePaperSetter: async (id, data) => {
        const response = await apiClient.put(`/secrecy/setters/${id}`, data);
        return response.data;
    },

    /**
     * Get payments
     */
    getPayments: async () => {
        const response = await apiClient.get('/secrecy/payments');
        return response.data;
    },

    /**
     * Process payment
     */
    processPayment: async (data) => {
        const response = await apiClient.post('/secrecy/payments/process', data);
        return response.data;
    }
};
