'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import {
    Users,
    Wallet,
    TrendingUp,
    ArrowLeft,
    Shield,
    User,
    Store,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    FileText,
    History
} from 'lucide-react';

interface SubUserDetails {
    sub_user: {
        id: number;
        name: string;
        mobile_number: string;
        referral_code: string;
        credit_balance: number;
        credit_limit: number;
        is_active: boolean;
    };
    stats: {
        total_users: number;
        customers: number;
        merchants: number;
        loans: {
            total: number;
            approved: number;
            disbursed: number;
            volume: number;
        }
    };
    recent_users: any[];
    recent_transactions: any[];
    recent_loans: any[];
}

// Client Component only
export default function SubUserDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id || searchParams.get('id');
    const router = useRouter();
    const [data, setData] = useState<SubUserDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await apiFetch(`/admin/sub-users/${id}`);
            setData(res);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load agent details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Agent Insights">
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                </div>
            </AdminLayout>
        );
    }

    if (!data) return null;

    return (
        <AdminLayout title="Agent Performance Insights">
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>

                    <div className="flex items-center gap-6 relative">
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{data.sub_user.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${data.sub_user.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {data.sub_user.is_active ? 'Active Agent' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs">
                                Global Referral ID: <span className="text-indigo-600 font-black">{data.sub_user.referral_code}</span> • {data.sub_user.mobile_number}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Availability</p>
                            <p className="text-2xl font-black text-slate-900">₹{parseFloat(data.sub_user.credit_balance.toString()).toLocaleString()}</p>
                            <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500"
                                    style={{ width: `${(data.sub_user.credit_balance / data.sub_user.credit_limit) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Growth Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Network</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{data.stats.total_users}</h3>
                        <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-blue-500">{data.stats.customers} Customers</span>
                            <span className="text-emerald-500">{data.stats.merchants} Merchants</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-amber-200 transition-all">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loan Portfolio</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{data.stats.loans.total}</h3>
                        <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-emerald-500">{data.stats.loans.approved} Approved</span>
                            <span className="text-blue-500">{data.stats.loans.disbursed} Disbursed</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">₹{data.stats.loans.volume.toLocaleString()}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Processed Loan Value</p>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-rose-200 transition-all">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Shield size={24} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Success Rate</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">
                            {data.stats.loans.total > 0
                                ? Math.round((data.stats.loans.approved / data.stats.loans.total) * 100)
                                : 0}%
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Approval Efficiency</p>
                    </div>
                </div>

                {/* Tabs / Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Recent Transactions */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Financial Pipeline</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Recent Transactions in Network</p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <History className="text-slate-400 w-5 h-5" />
                            </div>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {data.recent_transactions.length > 0 ? (
                                data.recent_transactions.map((tx: any) => (
                                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'DEBIT' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                {tx.type === 'DEBIT' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 uppercase text-sm">{tx.user?.business_name || tx.user?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black ${tx.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {tx.type === 'DEBIT' ? '-' : '+'}₹{parseFloat(tx.amount).toLocaleString()}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center text-slate-300 italic font-black uppercase text-xs tracking-widest">No activity reported</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Users Section */}
                    <div className="space-y-8">
                        {/* Users Box */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-indigo-600 text-white">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Agent Network</h3>
                                    <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1">Recently Onboarded Accounts</p>
                                </div>
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-1 gap-3">
                                {data.recent_users.length > 0 ? (
                                    data.recent_users.map((user: any) => (
                                        <div key={user.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-indigo-200 hover:bg-white transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.role === 'MERCHANT' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {user.role[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm uppercase">{user.business_name || user.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{user.mobile_number}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase">{new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-300 font-black uppercase text-xs">No users found</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Loans */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Applications</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Latest Loan Requests</p>
                                </div>
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                    <Clock className="text-slate-400 w-5 h-5" />
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {data.recent_loans.length > 0 ? (
                                    data.recent_loans.map((loan: any) => (
                                        <div key={loan.id} className="p-6 flex items-center justify-between">
                                            <div>
                                                <p className="font-black text-slate-900 uppercase text-sm">{loan.user?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">₹{parseFloat(loan.amount).toLocaleString()} • {loan.tenure} Days</p>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                                loan.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                {loan.status}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No active loans</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
