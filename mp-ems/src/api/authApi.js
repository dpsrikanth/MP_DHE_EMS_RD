import apiClient from './client';

export const authApi = {
    /**
     * Authenticate a user with email and password
     */
    login: async (credentials) => {
        const response = await apiClient.post('/login', credentials);
        return response.data;
    },
    
    // Future additions:
    // register: async (data) => ...
    // changePassword: async (data) => ...
};
