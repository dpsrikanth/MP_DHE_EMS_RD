import apiClient from './client';

export const paperSetterApi = {
    /**
     * Get dashboard data for paper setter
     */
    getDashData: async () => {
        const response = await apiClient.get('/paper-setter/faculty/dash-data');
        return response.data;
    },

    /**
     * Upload question paper
     */
    uploadPaper: async (formData) => {
        const response = await apiClient.post('/paper-setter/faculty/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Get submitted papers
     */
    getSubmittedPapers: async () => {
        const response = await apiClient.get('/paper-setter/faculty/submitted-papers');
        return response.data;
    },

    /**
     * Download question paper
     */
    downloadPaper: async (paperId) => {
        const response = await apiClient.get(`/paper-setter/download/${paperId}`, {
            responseType: 'blob'
        });
        return response;
    }
};
