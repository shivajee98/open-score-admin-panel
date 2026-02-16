'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Gift, Search, Filter, ChevronLeft, ChevronRight, IndianRupee } from 'lucide-react';

export default function CashbackLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                search: search,
                source_type: typeFilter,
                page: page.toString(),
                per_page: '20'
            });
            const response = await apiFetch(`/admin/cashback-logs?${query}`);
            if (response && response.data) {
                setLogs(Array.isArray(response.data) ? response.data : []);
                setTotalPages(response.last_page || 1);
                setTotalLogs(response.total || 0);
            } else {
                setLogs([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(loadLogs, 300);
        return () => clearTimeout(timeout);
    }, [search, typeFilter, page]);

    return (
        <AdminLayout title="Cashback Transfer Logs">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner border border-purple-100">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Reward Disbursal History</h3>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                {totalLogs} Rewards Filtered
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search Name, Phone or Type..."
                                className="pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-purple-100 transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            <select
                                className="pl-11 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-purple-100 cursor-pointer"
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            >
                                <option value="ALL">All Sources</option>
                                <option value="CASHBACK">Standard Cashback</option>
                                <option value="SIGNUP_BONUS">Signup Bonus</option>
                                <option value="ONBOARDING_BONUS">Onboarding Bonus</option>
                                <option value="REFERRAL_BONUS">Referral Bonus</option>
                                <option value="AGENT_COMMISSION">Agent Commission</option>
                                <option value="LOAN_REFERRAL_BONUS">Loan Referral Bonus</option>
                                <option value="REFERRAL_WELCOME_BONUS">Referral Welcome bonus</option>
                                <option value="SUB_USER_REFERRAL_BONUS">Sub User Referral</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8">Recipient</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Type</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                {tx.wallet?.user?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{tx.wallet?.user?.name || 'Deleted User'}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{tx.wallet?.user?.mobile_number || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="font-mono font-black text-[9px] text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 uppercase tracking-tighter">
                                            {tx.source_type?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-bold text-slate-600 max-w-xs truncate" title={tx.description}>
                                            {tx.description}
                                        </p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-1 text-emerald-600">
                                            <IndianRupee size={12} className="stroke-[3]" />
                                            <span className="text-sm font-black">{tx.amount}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 pr-8 text-right">
                                        <p className="text-xs font-black text-slate-700">
                                            {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Rewards...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-24 text-center">
                                        <p className="text-slate-300 font-black text-lg">No reward transfers found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
