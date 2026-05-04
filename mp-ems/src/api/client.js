import axios from 'axios';
import authUtils from '../utils/authUtils';

// Helper to get base URL since it's loaded dynamically in public/json/config.js
const getBaseUrl = () => {
    return window.EMS_CONFIG?.API_BASE_URL || "http://localhost:8080/api";
};

// Create a configured axios instance
const apiClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    // We don't set baseURL here immediately in case window.EMS_CONFIG isn't loaded yet when this module is parsed
});

// Request interceptor to attach the auth token and dynamic baseURL
apiClient.interceptors.request.use(
    (config) => {
        config.baseURL = getBaseUrl();
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is likely expired or invalid
            console.error('Session expired or unauthorized. Logging out...');
            authUtils.logout(); // This clears local storage and handles redirect
            
            // If authUtils doesn't hard-redirect, we could do:
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
