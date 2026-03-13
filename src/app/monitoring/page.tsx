'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { BadgeCheck } from 'lucide-react';

interface MonitoringAlert {
    id: number;
    amount: number;
    threshold: number;
    created_at: string;
    is_acknowledged: boolean;
    payer: {
        id: number;
        name: string;
        mobile_number: string;
        role: string;
    } | null;
    payee: {
        id: number;
        name: string;
        mobile_number: string;
        role: string;
    } | null;
}

export default function MonitoringPage() {
    const formatAlertDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const [threshold, setThreshold] = useState('');
    const [thresholdLoading, setThresholdLoading] = useState(false);
    const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [userDetail, setUserDetail] = useState<any>(null);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [activeLoan, setActiveLoan] = useState<any>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);

    useEffect(() => {
        fetchThreshold();
        fetchAlerts();
    }, []);

    const fetchThreshold = async () => {
        try {
            const res = await apiFetch('/admin/monitoring-settings');
            if (res && !res.error) {
                setThreshold(res.threshold?.toString() || '');
            }
        } catch (e) {
            console.error('Failed to load threshold', e);
        }
    };

    const saveThreshold = async () => {
        setThresholdLoading(true);
        try {
            const res = await apiFetch('/admin/monitoring-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threshold: parseFloat(threshold) || 0 })
            });
            if (res && !res.error) {
                setThreshold(res.threshold?.toString() || '');
            }
        } catch (e) {
            console.error('Failed to save threshold', e);
        } finally {
            setThresholdLoading(false);
        }
    };

    const fetchAlerts = async (page = 1) => {
        setAlertsLoading(true);
        try {
            const res = await apiFetch(`/admin/monitoring-alerts?per_page=20&page=${page}`);
            if (res && !res.error) {
                setAlerts(res.alerts || []);
                setMeta({
                    current_page: res.meta?.current_page || page,
                    last_page: res.meta?.last_page || page,
                    total: res.meta?.total || 0
                });
            }
        } catch (e) {
            console.error('Failed to load monitoring alerts', e);
        } finally {
            setAlertsLoading(false);
        }
    };

    const loadUserDetail = async (userId: number) => {
        setDetailLoading(true);
        try {
            const [userRes, txRes, loanRes] = await Promise.all([
                apiFetch(`/admin/users/${userId}/full-details`),
                apiFetch(`/admin/users/${userId}/transactions`),
                apiFetch(`/admin/users/${userId}/active-loan`)
            ]);
            setUserDetail(userRes?.user || null);
            setUserTransactions(txRes || []);
            setActiveLoan(loanRes?.loan || null);
        } catch (e) {
            console.error('Failed to load user detail', e);
        } finally {
            setDetailLoading(false);
        }
    };

    const onSelectAlert = (alert: MonitoringAlert) => {
        setSelectedAlert(alert);
        if (alert.payer?.id) {
            loadUserDetail(alert.payer.id);
        }
    };

    const toggleUserStatus = async () => {
        if (!selectedAlert || !userDetail) return;
        const newStatus = userDetail.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'reactivate' : 'suspend'} this user?`)) {
            return;
        }
        setStatusUpdating(true);
        try {
            await apiFetch(`/admin/users/${userDetail.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadUserDetail(userDetail.id);
            fetchAlerts(meta.current_page);
        } catch (e) {
            console.error('Failed to toggle status', e);
        } finally {
            setStatusUpdating(false);
        }
    };

    const markReviewed = async () => {
        if (!selectedAlert) return;
        setReviewLoading(true);
        try {
            await apiFetch(`/admin/monitoring-alerts/${selectedAlert.id}/acknowledge`, { method: 'POST' });
            fetchAlerts(meta.current_page);
        } catch (e) {
            console.error('Failed to mark alert reviewed', e);
        } finally {
            setReviewLoading(false);
        }
    };

    const renderAlertsTable = () => {
        if (alertsLoading) {
            return <p className="p-6 text-sm text-slate-500">Loading alerts...</p>;
        }

        if (alerts.length === 0) {
            return <p className="p-6 text-sm text-slate-500">No monitoring alerts yet.</p>;
        }

        return (
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs uppercase text-slate-400 tracking-[0.3em] border-b border-slate-100">
                        <th className="p-3">Time</th>
                        <th className="p-3">Payer</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payee Role</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {alerts.map(alert => (
                        <tr
                            key={alert.id}
                            onClick={() => onSelectAlert(alert)}
                            className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedAlert?.id === alert.id ? 'bg-slate-100' : ''}`}
                        >
                            <td className="p-3 text-sm text-slate-700">
                                {formatAlertDate(alert.created_at)}
                            </td>
                            <td className="p-3 text-sm">
                                {alert.payer?.name || 'Unknown'}<br />
                                <span className="text-xs text-slate-400">{alert.payer?.mobile_number}</span>
                            </td>
                            <td className="p-3 text-sm font-black text-emerald-600">
                                ₹{alert.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-sm text-slate-700">{alert.payee?.role}</td>
                            <td className="p-3 text-sm">
                                {alert.is_acknowledged ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[11px] font-bold">
                                        <BadgeCheck className="w-3 h-3" />
                                        Reviewed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                        Pending
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const renderDetailPanel = () => {
        if (!selectedAlert) {
            return (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
                    Select an alert to view the payer profile and available actions.
                </div>
            );
        }

        if (detailLoading) {
            return (
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm text-slate-500">
                    Loading user details...
                </div>
            );
        }

        if (!userDetail) {
            return (
                <div className="p-6 rounded-2xl border border-slate-200 text-sm text-slate-500">
                    User details are currently unavailable.
                </div>
            );
        }

        return (
            <div className="space-y-5 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Payer Information</p>
                    <h3 className="text-xl font-black text-slate-900">{userDetail.name}</h3>
                    <p className="text-sm text-slate-500">{userDetail.mobile_number}</p>
                    <p className="text-sm text-slate-500">Role: {userDetail.role}</p>
                    <p className="text-sm text-slate-500">Status: {userDetail.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50">
                        <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Wallet</p>
                        <p className="text-xl font-black text-slate-900">₹{(userDetail.wallet_balance || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[11px] text-slate-500">Balance</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50">
                        <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Open Loans</p>
                        <p className="text-xl font-black text-slate-900">{activeLoan ? activeLoan.plan?.display_name || activeLoan.plan?.name : '—'}</p>
                        <p className="text-[11px] text-slate-500">{activeLoan ? `₹${activeLoan.amount.toLocaleString('en-IN')} · ${activeLoan.status}` : 'No active loan'}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Transactions</p>
                        <button
                            onClick={() => userTransactions?.length && window?.open(`/users/${userDetail.id}`, '_blank')}
                            className="text-xs font-black text-slate-600 underline"
                        >
                            View all
                        </button>
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-2">
                        {userTransactions.slice(0, 4).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between text-sm text-slate-600">
                                <div>
                                    <p className="font-bold text-slate-900">{tx.description}</p>
                                    <p className="text-[11px] text-slate-400">{formatAlertDate(tx.created_at)}</p>
                                </div>
                                <div className="font-black text-slate-900">
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                        {userTransactions.length === 0 && (
                            <p className="text-xs text-slate-400">No recorded transactions yet.</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleUserStatus}
                        disabled={statusUpdating}
                        className="flex-1 px-4 py-2 rounded-2xl bg-slate-900 text-white font-bold uppercase text-[11px] tracking-[0.3em] transition-colors disabled:opacity-60"
                    >
                        {userDetail.status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account'}
                    </button>
                    <button
                        onClick={markReviewed}
                        disabled={reviewLoading || selectedAlert?.is_acknowledged}
                        className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-[0.3em] disabled:opacity-50"
                    >
                        Mark as reviewed
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout title="Monitoring Alerts">
            <div className="space-y-6">
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Threshold</p>
                            <h3 className="text-2xl font-black text-slate-900">High-value monitor</h3>
                            <p className="text-sm text-slate-500">Anyone sending above this amount to merchants, customers, or students triggers an alert.</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                className="w-32 px-3 py-2 border border-slate-200 rounded-2xl text-sm font-mono"
                                placeholder="₹"
                            />
                            <button
                                onClick={saveThreshold}
                                disabled={thresholdLoading}
                                className="px-4 py-2 rounded-2xl bg-rose-500 text-white font-bold text-xs uppercase tracking-[0.3em] disabled:opacity-60"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-900">Alerts</h3>
                            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{meta.total} total</span>
                        </div>
                        <div className="overflow-x-auto">{renderAlertsTable()}</div>
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
                            <button
                                onClick={() => fetchAlerts(Math.max(1, meta.current_page - 1))}
                                disabled={meta.current_page === 1}
                                className="font-bold"
                            >
                                Previous
                            </button>
                            <span>
                                Page {meta.current_page} / {meta.last_page}
                            </span>
                            <button
                                onClick={() => fetchAlerts(Math.min(meta.last_page, meta.current_page + 1))}
                                disabled={meta.current_page === meta.last_page}
                                className="font-bold"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                    <div>
                        {renderDetailPanel()}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
