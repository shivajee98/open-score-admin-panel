import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
// Trigger redeploy to bake in new API URL: https://api.msmeloan.sbs/api

// In-memory cache for token
let cachedToken: string | null = null;
let sessionFetchPromise: Promise<any> | null = null;

const getToken = async (): Promise<string | null> => {
    // Return cached token if available
    if (cachedToken) return cachedToken;

    // Check localStorage first (faster than API call)
    if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            cachedToken = storedToken;
            return storedToken;
        }
    }

    // Only call getSession if we don't have a token
    // Use a singleton promise to avoid concurrent calls
    if (typeof window !== 'undefined' && !sessionFetchPromise) {
        sessionFetchPromise = getSession().then(session => {
            if (session && (session as any).accessToken) {
                cachedToken = (session as any).accessToken;
                localStorage.setItem('token', cachedToken!);
                if ((session as any).user) {
                    localStorage.setItem('user', JSON.stringify((session as any).user));
                }
            }
            sessionFetchPromise = null;
            return cachedToken;
        }).catch(() => {
            sessionFetchPromise = null;
            return null;
        });
    }

    if (sessionFetchPromise) {
        return sessionFetchPromise;
    }

    return null;
};

// Clear cache when needed (e.g., on logout)
export const clearTokenCache = () => {
    cachedToken = null;
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
            console.warn('[API] 401 Unauthorized - clearing token cache');
            clearTokenCache();
            // signOut({ callbackUrl: '/login' });
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
