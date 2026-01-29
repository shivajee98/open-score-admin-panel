import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    let token = null;

    // Try to get token from NextAuth session first
    if (typeof window !== 'undefined') {
        const session = await getSession();
        if (session && (session as any).accessToken) {
            token = (session as any).accessToken;
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
        if (response.status === 401 && typeof window !== 'undefined') {
            // Force sign out to clear stale session and prevent middleware loop
            signOut({ callbackUrl: '/login' });
            return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'API request failed');
    }

    return response.json();
};
