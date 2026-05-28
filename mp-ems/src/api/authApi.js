import apiClient from './client';

export const authApi = {
    /**
     * Login user
     */
    login: async (credentials) => {
        const response = await apiClient.post('/login', credentials);
        return response.data;
    },

    /**
     * Refresh the session token using HttpOnly cookies
     */
    refreshToken: async () => {
        const response = await apiClient.post('/refresh-token', {}, { withCredentials: true });
        return response.data;
    },

    /**
     * Change user password
     */
    changePassword: async (data) => {
        const response = await apiClient.post('/change-password', data);
        return response.data;
    },

    /**
     * Request password reset link
     */
    forgotPassword: async (data) => {
        const response = await apiClient.post('/forgot-password', { email: data });
        return response.data;
    },

    /**
     * Reset password using token
     */
    resetPassword: async (data) => {
        const response = await apiClient.post('/reset-password', data);
        return response.data;
    },

    /**
     * Get login history
     */
    getLoginHistory: async () => {
        const response = await apiClient.get('/login-history');
        return response.data;
    },
    /**
     * Initiate registration (Email Check)
     */
    register: async (email) => {
        const response = await apiClient.post('/register', { email });
        return response.data;
    },

    /**
     * Verify OTP for registration
     */
    verifyOtp: async (email, otp) => {
        const response = await apiClient.post('/verify-otp', { email, otp });
        return response.data;
    },

    /**
     * Set password after OTP verification
     */
    setPassword: async (email, password) => {
        const response = await apiClient.post('/set-password', { email, password });
        return response.data;
    },

    /**
     * Logout user
     */
    logout: async () => {
        const response = await apiClient.post('/logout');
        return response.data;
    },

};
