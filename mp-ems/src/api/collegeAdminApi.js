import apiClient from './client';

export const collegeAdminApi = {
    /**
     * Fetch KPI stats for the college admin dashboard
     */
    getDashboardStats: async () => {
        const response = await apiClient.get('/college-admin/dashboard-stats');
        return response.data;
    },

    /**
     * Fetch notifications for the college admin dashboard
     */
    getNotifications: async () => {
        const response = await apiClient.get('/college-admin/notifications');
        return response.data;
    },

    /**
     * Mark a notification as read
     */
    markNotificationAsRead: async (id) => {
        const response = await apiClient.put(`/college-admin/notifications/${id}/read`);
        return response.data;
    }
};
