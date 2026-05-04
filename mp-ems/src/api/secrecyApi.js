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
    }
};
