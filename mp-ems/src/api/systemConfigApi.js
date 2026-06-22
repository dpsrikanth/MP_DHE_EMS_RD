import apiClient from './client';

export const systemConfigApi = {
    /**
     * Get SMTP configuration
     */
    getSmtpConfig: async () => {
        const response = await apiClient.get('/config/smtp');
        return response.data;
    },

    /**
     * Update SMTP configuration
     */
    updateSmtpConfig: async (data) => {
        const response = await apiClient.post('/config/smtp', data);
        return response.data;
    },

    /**
     * Test the active SMTP configuration.
     * @param {{ testEmail?: string }} payload - optional recipient for a real test send
     */
    testSmtpConfig: async (payload = {}) => {
        const response = await apiClient.post('/config/smtp/test', payload);
        return response.data;
    }
};
