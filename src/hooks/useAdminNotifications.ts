'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export interface MonitoringAlert {
    id: number;
    amount: number;
    threshold: number;
    created_at: string;
    is_acknowledged: boolean;
    payer?: {
        id: number;
        name: string;
        mobile_number: string;
        role: string;
    };
    payee?: {
        id: number;
        name: string;
        mobile_number: string;
        role: string;
    };
}

export function useAdminNotifications() {
    const [counts, setCounts] = useState({ loans: 0, kyc: 0 });
    const [monitoring, setMonitoring] = useState<{
        latestAlert: MonitoringAlert | null;
        unread: number;
    }>({
        latestAlert: null,
        unread: 0
    });

    const fetchCounts = async () => {
        try {
            const res = await apiFetch('/admin/notifications');
            if (res && !res.error) {
                setCounts({
                    loans: res.loans || 0,
                    kyc: res.kyc || 0
                });
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    const fetchMonitoring = async () => {
        try {
            const res = await apiFetch('/admin/monitoring-alerts/recent');
            if (res && !res.error) {
                setMonitoring({
                    latestAlert: res.latest_alert || null,
                    unread: res.unread_count || 0
                });
            }
        } catch (e) {
            console.error('Failed to fetch monitoring alerts', e);
        }
    };

    useEffect(() => {
        fetchCounts();
        fetchMonitoring();
        const interval = setInterval(() => {
            fetchCounts();
            fetchMonitoring();
        }, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    return { counts, monitoring, refresh: fetchCounts, refreshMonitoring: fetchMonitoring };
}
