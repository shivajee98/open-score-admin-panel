'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    mobile_number: string;
    referral_code?: string;
    credit_balance?: number;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
    const router = useRouter();

    useEffect(() => {
        // Read from localStorage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setStatus('authenticated');
            } catch (e) {
                console.error('Failed to parse user data', e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setStatus('unauthenticated');
            }
        } else {
            setStatus('unauthenticated');
        }
    }, []);

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
        }
        setUser(null);
        setStatus('unauthenticated');
        router.push('/login');
    };

    return {
        user,
        status,
        logout,
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading'
    };
}
