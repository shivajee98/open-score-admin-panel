export const API_BASE_URL = '/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    // In a real app, you'd handle auth tokens here (e.g. from cookies or localStorage)
    // For this demo, we'll assume the token is stored in localStorage by the login page
    let token = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('token');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            // Redirect to login if unauthorized
            // window.location.href = '/login'; 
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'API request failed');
    }

    return response;
};
