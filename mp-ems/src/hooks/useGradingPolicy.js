import { useState, useEffect } from 'react';
import { marksApi } from '../api/marksApi';

/**
 * Custom hook to fetch the grading configuration for the current university.
 */
export const useGradingPolicy = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await marksApi.getGradingConfig();

                if (data) {
                    // Ensure grade_scale is sorted descending
                    if (data.grade_scale && Array.isArray(data.grade_scale)) {
                        data.grade_scale.sort((a, b) => b.min - a.min);
                    }
                    setConfig(data);
                } else {
                    setError("Failed to fetch grading policy");
                }
            } catch (err) {
                setError(err.response?.data?.message || err.response?.data?.error || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return { config, loading, error };
};
