import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

let cachedToken: string | null = null;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    let token = cachedToken;

    // Try to get token if not cached
    if (!token && typeof window !== 'undefined') {
        const session = await getSession();
        if (session && (session as any).accessToken) {
            token = (session as any).accessToken;
            cachedToken = token; // Cache it
        } else {
            // Fallback to localStorage if no session (legacy/backup)
            token = localStorage.getItem('token');
        }
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const url = endpoint.startsWith('/') ? `${BASE_URL}${endpoint}` : `${BASE_URL}/${endpoint}`;

    console.log(`[API Request] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
        ...options,
        headers,
    });

    console.log(`[API Response] ${response.status} ${url}`);

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
            console.warn('[API] 401 Unauthorized - Redirecting to login');
            signOut({ callbackUrl: '/login' });
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
