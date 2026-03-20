import { useState, useEffect } from 'react';

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
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const res = await fetch('http://localhost:8080/api/grading/config', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Ensure grade_scale is sorted descending
                    if (data.grade_scale && Array.isArray(data.grade_scale)) {
                        data.grade_scale.sort((a, b) => b.min - a.min);
                    }
                    setConfig(data);
                } else {
                    setError("Failed to fetch grading policy");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return { config, loading, error };
};
