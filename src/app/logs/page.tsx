'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Shield, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                search: search,
                action: actionFilter,
                page: page.toString(),
                per_page: '20'
            });
            const response = await apiFetch(`/logs?${query}`);
            if (response && response.data) {
                setLogs(Array.isArray(response.data) ? response.data : []);
                setTotalPages(response.last_page || 1);
                setTotalLogs(response.total || 0);
            } else if (Array.isArray(response)) {
                setLogs(response);
                setTotalPages(1);
                setTotalLogs(response.length);
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
    }, [search, actionFilter, page]);

    return (
        <AdminLayout title="Audit Logs">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shadow-inner">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">System Audit Trail</h3>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                {totalLogs} Events Captured
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, phone or action..."
                                className="pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-100 transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            <select
                                className="pl-11 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                value={actionFilter}
                                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            >
                                <option value="ALL">All Actions</option>
                                <option value="loan_approved">Loan Approvals</option>
                                <option value="loan_disbursed">Disbursals</option>
                                <option value="user_deleted">Deletions</option>
                                <option value="manual_credit">Credits</option>
                                <option value="payout_approved">Payouts</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8">Action</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrator</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="p-6 pl-8">
                                        <span className="font-mono font-black text-[10px] text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm uppercase">
                                            {log.action?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-md">
                                            {log.description}
                                        </p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                {log.admin_name?.[0] || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{log.admin_name || 'Admin'}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{log.admin_mobile || log.admin_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 pr-8 text-right">
                                        <p className="text-sm font-black text-slate-900">
                                            {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full shadow-lg shadow-blue-500/20" />
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Fetching Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-24 text-center">
                                        <p className="text-slate-300 font-black text-lg">No audit events found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
