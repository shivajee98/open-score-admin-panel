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

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
            // Force sign out only for non-auth routes (expired session)
            signOut({ callbackUrl: '/login' });
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'API request failed');
    }

    return response.json();
};
