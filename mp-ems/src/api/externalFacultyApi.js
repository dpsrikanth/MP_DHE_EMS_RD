import apiClient from './client';

export const externalFacultyApi = {
    /**
     * Get assigned external evaluations
     */
    getAssignments: async () => {
        const response = await apiClient.get('/external-faculty/assignments');
        return response.data;
    },

    /**
     * Save/Submit external marks
     */
    saveMarks: async (data) => {
        const response = await apiClient.post('/external-faculty/save-marks', data);
        return response.data;
    }
};
