

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';
// Trigger redeploy to bake in new API URL: https://api.msmeloan.sbs/api

const getToken = async (): Promise<string | null> => {
    // Check localStorage
    if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            return storedToken;
        }
    }
    return null;
};

// Clear cache when needed (e.g., on logout)
export const clearTokenCache = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const url = endpoint.startsWith('/') ? `${BASE_URL}${endpoint}` : `${BASE_URL}/${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
            const isLoginPage = window.location.pathname.includes('/login');
            if (isLoginPage) return response.json();

            // Check for session-expired (single-session enforcement)
            try {
                const cloned = response.clone();
                const body = await cloned.json();
                if (body.code === 'SESSION_EXPIRED') {
                    clearTokenCache();
                    alert('Session expired. You have been logged in from another device.');
                    window.location.href = '/login';
                    throw new Error(body.error);
                }
            } catch (e) {
                // If parsing fails, just continue to the normal error handling below
            }
        }

        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch (e) {
            console.error('[API] Failed to parse error response', e);
        }

        const errorMessage = errorData.error || errorData.message || `HTTP Error ${response.status}`;
        console.error(`[API Error] ${errorMessage}`, errorData);
        throw new Error(errorMessage);
    }

    return response.json();
};
