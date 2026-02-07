'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { Wallet, Users, Link as LinkIcon, Copy, TrendingUp, QrCode, User, Shield, HelpCircle, FileText, Mail, LogOut, Lightbulb } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Stats {
    total_users: number;
    customers: number;
    merchants: number;
    total_emis_paid: number;
    total_cashback_given: number;
    loans: {
        total: number;
        approved: number;
        disbursed: number;
        pending: number;
        volume: number;
    };
}

export default function SubUserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [recentLoans, setRecentLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user) {
            setUser(session.user);
            if ((session.user as any).id) {
                fetchStats((session.user as any).id);
            }
        }
    }, [session, status, router]);

    const fetchStats = async (id: number) => {
        try {
            const data = await apiFetch(`/admin/sub-users/${id}`);
            if (data.stats) {
                setStats(data.stats);
                setRecentUsers(data.recent_users || []);
                setRecentTransactions(data.recent_transactions || []);
                setRecentLoans(data.recent_loans || []);
            }
        } catch (e) {
            console.error('Failed to load stats', e);
        } finally {
            setLoading(false);
        }
    };

    const copyReferralLink = () => {
        if (!user?.referral_code) return;
        const shareLink = `https://openscore.msmeloan.sbs/?ref=${user.referral_code}`;
        navigator.clipboard.writeText(shareLink);
        toast.success('Referral link copied!');
    };

    if (loading && !user) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold italic animate-pulse">Initializing Agent Environment...</div>
    }

    return (
        <AdminLayout title="Agent Overview">
            <div className="space-y-6">
                {/* Hero Header - Compact */}
                <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/10">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2">Welcome, {user?.name}</h2>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-sm">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Authorized Credit Agent</p>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                                <Wallet size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit Balance</p>
                                <p className="text-2xl font-black text-white">₹{parseFloat(user?.credit_balance || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Shortened Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referrals</p>
                        <p className="text-xl font-black text-slate-900">{stats?.total_users || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Merchants</p>
                        <p className="text-xl font-black text-emerald-600">{stats?.merchants || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total EMIs</p>
                        <p className="text-xl font-black text-blue-600">₹{(stats?.total_emis_paid || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loans</p>
                        <p className="text-xl font-black text-slate-900">{stats?.loans?.total || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cashback</p>
                        <p className="text-xl font-black text-amber-600">₹{(stats?.total_cashback_given || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Vol.</p>
                        <p className="text-xl font-black text-rose-600">₹{parseFloat(stats?.loans?.volume?.toString() || '0').toLocaleString()}</p>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - User Activity */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Transactions - Compact Table */}
                        <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Global Activity</h3>
                                <TrendingUp size={16} className="text-slate-400" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Referral Name</th>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentTransactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-900 text-xs">{tx.user?.name || 'Customer'}</p>
                                                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">ROLE: {tx.user?.role}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'DEBIT' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                        <span className={`font-black text-xs ${tx.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {tx.type === 'DEBIT' ? '-' : '+'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right text-[10px] font-bold text-slate-400">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Loan Roadmap - Tracking */}
                        <div className="bg-white rounded-[1.5rem] border border-slate-100 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Loan Tracking</h3>
                                <Shield size={16} className="text-slate-400" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Stage</th>
                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">View</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentLoans.map((loan) => (
                                            <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <p className="font-bold text-slate-900 text-xs">{loan.user?.name}</p>
                                                    <p className="text-[9px] font-medium text-slate-400">ID: {loan.id}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <p className="font-black text-slate-700 text-xs">₹{parseFloat(loan.amount).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${loan.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            loan.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                'bg-slate-50 text-slate-500 border-slate-100'
                                                        }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button disabled className="text-[10px] font-bold text-slate-400 cursor-not-allowed italic">Read Only</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Toolbox */}
                    <div className="space-y-6">
                        {/* Share & Onboard */}
                        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-lg shadow-indigo-900/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <LinkIcon size={20} />
                                </div>
                                <h3 className="font-black text-lg tracking-tight">Onboard User</h3>
                            </div>
                            <p className="text-indigo-100 text-xs font-bold leading-relaxed mb-6">Generated link with SU_ID: {user?.referral_code}. Bonus auto-applied.</p>
                            <button
                                onClick={copyReferralLink}
                                className="w-full bg-white text-indigo-700 font-black text-xs uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                <Copy size={16} />
                                Copy Agent Link
                            </button>
                        </div>

                        {/* Recent User list */}
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-4">Community Growth</h3>
                            <div className="space-y-4">
                                {recentUsers.slice(0, 4).map((u) => (
                                    <div key={u.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                {u.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900">{u.name || u.mobile_number}</p>
                                                <p className="text-[9px] font-bold text-slate-400">{u.role}</p>
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">NEW</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center">
                            <Shield size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Notice: Disbursal / Release Fund access restricted to Primary Admin</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
