

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

            // Prevent Redirect Loops
            const isLoginPage = window.location.pathname.includes('/login');
            if (isLoginPage) return response.json(); // Don't redirect if already on login

            // DEBUGGING: Log token status
            // console.warn('[API] 401 Unauthorized - clearing token cache');
            // clearTokenCache();

            // Debounced Redirect
            // window.location.href = '/admin/login';
            console.warn('[API] 401 Error. Token retained for debug.');
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
