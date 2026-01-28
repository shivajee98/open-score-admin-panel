'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { BadgeCheck, Ban, Clock, TrendingUp, Users, Wallet, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMerchants: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        pendingCount: 0
    });
    const [pendingTx, setPendingTx] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            // Parallel fetch for speed
            const [analytics, pending, users] = await Promise.all([
                apiFetch('/admin/analytics/dashboard'),
                apiFetch('/admin/funds/pending'),
                apiFetch('/admin/users') // Keeping for user list if needed elsewhere or remove if analytics covers it
            ]);

            setStats({
                totalUsers: analytics.total_users,
                totalMerchants: analytics.total_merchants,
                totalDisbursed: analytics.total_disbursed,
                totalRepaid: analytics.total_repaid,
                pendingCount: pending.length
            });
            setPendingTx(pending);
        } catch (error) {
            console.error('Failed to load admin data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this transaction?')) return;
        try {
            const res = await apiFetch(`/admin/funds/${id}/approve`, { method: 'POST' });
            if (res.ok) {
                alert('Funds Approved!');
                loadData();
            }
        } catch (e) {
            alert('Approval failed');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Reject this transaction?')) return;
        try {
            const res = await apiFetch(`/admin/funds/${id}/reject`, { method: 'POST' });
            if (res.ok) {
                alert('Request Rejected');
                loadData();
            }
        } catch (e) {
            alert('Rejection failed');
        }
    };

    return (
        <AdminLayout title="System Overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Users className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Wallet className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Disbursed (Loans)</p>
                        <p className="text-3xl font-black text-slate-900">₹{stats.totalDisbursed.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Loans Repaid</p>
                        <p className="text-3xl font-black text-emerald-600">₹{stats.totalRepaid.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Approvals</p>
                        <p className="text-3xl font-black text-slate-900">{stats.pendingCount}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <Link href="/qr-generator" className="inline-flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">QR Generator</h3>
                        <p className="text-slate-400 text-xs font-medium">Create & print merchant codes</p>
                    </div>
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Pending Fund Approvals</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Review and approve manual fund additions.</p>
                    </div>
                    {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                </div>

                {pendingTx.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BadgeCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No pending approvals</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingTx.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6">
                                            <p className="font-bold text-slate-900">{tx.user_name}</p>
                                            <p className="text-xs font-medium text-slate-500">{tx.user_mobile}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                                +₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="p-6 font-medium text-slate-500 text-sm">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleReject(tx.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    <Ban className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(tx.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                                >
                                                    <BadgeCheck className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
