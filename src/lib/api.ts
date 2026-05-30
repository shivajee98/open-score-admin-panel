

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';
// Trigger redeploy to bake in new API URL: https://api.msmeloan.sbs/api

export const getStorageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Normalize BASE_URL by removing trailing slashes and the /api suffix
    const apiHost = BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
    
    // Remove 'storage/' prefix if it exists to avoid duplication
    const cleanPath = path.replace(/^storage\//, '').replace(/^\//, '');
    
    return `${apiHost}/storage/${cleanPath}`;
};

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

export const apiFetch = async (endpoint: string, options: RequestInit & { responseType?: 'json' | 'blob' | 'text' } = {}) => {
    const { responseType = 'json', ...fetchOptions } = options;
    const token = await getToken();

    const isFormData = fetchOptions.body instanceof FormData;

    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...fetchOptions.headers,
    };

    const url = endpoint.startsWith('/') ? `${BASE_URL}${endpoint}` : `${BASE_URL}/${endpoint}`;

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
            const isLoginPage = window.location.pathname.includes('/login');
            if (isLoginPage) return response.json();

            clearTokenCache();
            window.location.href = '/login';
            throw new Error('Unauthenticated. Please log in again.');
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

    if (responseType === 'blob') {
        return response.blob();
    }

    if (responseType === 'text') {
        return response.text();
    }

    return response.json();
};
