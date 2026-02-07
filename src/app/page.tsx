'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { BadgeCheck, Ban, Clock, TrendingUp, Users, Wallet, QrCode } from 'lucide-react';
import Link from 'next/link';
import FundsCard from '@/components/dashboard/FundsCard';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMerchants: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        pendingCount: 0,
        activeLoans: 0,
        defaultedLoans: 0,
        pendingLoans: 0,
        recentRepayments: []
    });
    const [pendingTx, setPendingTx] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated' && (session as any)?.user?.role === 'SUB_USER') {
            router.push('/sub-user-dashboard');
        } else if (status === 'authenticated' && (session as any)?.user?.role === 'ADMIN') {
            loadData();
        }
    }, [session, status, router]);

    const loadData = async () => {
        try {
            // Parallel fetch for speed
            const [analytics, pending, users] = await Promise.all([
                apiFetch('/admin/analytics/dashboard'),
                apiFetch('/admin/funds/pending'),
                apiFetch('/admin/users')
            ]);

            setStats({
                totalUsers: analytics?.total_users || 0,
                totalMerchants: analytics?.total_merchants || 0,
                totalDisbursed: analytics?.total_disbursed || 0,
                totalRepaid: analytics?.total_repaid || 0,
                totalOutstanding: analytics?.total_outstanding || 0,
                totalOverdue: analytics?.total_overdue || 0,
                pendingCount: Array.isArray(pending) ? pending.length : 0,
                activeLoans: analytics?.active_loans || 0,
                defaultedLoans: analytics?.defaulted_loans || 0,
                pendingLoans: analytics?.pending_loans || 0,
                recentRepayments: analytics?.recent_repayments || []
            });
            setPendingTx(Array.isArray(pending) ? pending : []);
        } catch (error) {
            console.error('Failed to load admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this transaction?')) return;
        try {
            await apiFetch(`/admin/funds/${id}/approve`, { method: 'POST' });
            alert('Funds Approved!');
            loadData();
        } catch (e) {
            alert('Approval failed');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Reject this transaction?')) return;
        try {
            await apiFetch(`/admin/funds/${id}/reject`, { method: 'POST' });
            alert('Request Rejected');
            loadData();
        } catch (e) {
            alert('Rejection failed');
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }

    if ((session as any)?.user?.role === 'SUB_USER') {
        return null; // Will redirect
    }

    return (
        <AdminLayout title="System Overview">
            <FundsCard />
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
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Recovered</p>
                        <p className="text-3xl font-black text-emerald-600">₹{stats.totalRepaid.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Outstanding</p>
                        <p className="text-3xl font-black text-purple-600">₹{stats.totalOutstanding.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                        <Ban className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Overdue</p>
                        <p className="text-3xl font-black text-red-600">₹{stats.totalOverdue.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Recent Repayments & Health Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900">Recent Repayments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-6">User</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recentRepayments && (stats.recentRepayments as any[]).length > 0 ? (
                                    (stats.recentRepayments as any[]).map((rp: any) => (
                                        <tr key={rp.id}>
                                            <td className="p-4 pl-6">
                                                <p className="font-bold text-slate-900 text-xs">{rp.user_name}</p>
                                                <p className="text-[10px] font-medium text-slate-400">#{rp.id}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-black text-emerald-600 text-sm">
                                                    +₹{parseFloat(rp.amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${rp.mode === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>{rp.mode}</span>
                                            </td>
                                            <td className="p-4 text-right pr-6 text-[10px] font-bold text-slate-400">
                                                {new Date(rp.paid_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-bold">No recent repayments found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vertical Right Column */}
                <div className="space-y-8">
                    {/* Loan Health Stats */}
                    <div>
                        <div className="flex items-center justify-between px-1 mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Loan Status</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Loans</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.activeLoans}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Processing</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.pendingLoans}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                                    <Ban className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Defaulted</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.defaultedLoans}</p>
                                </div>
                            </div>
                        </div>
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
