'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, Info, Filter, Calendar, Zap, Award, ChevronDown, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'sonner';

interface EarningRecord {
    id: string;
    date: string;
    agent_name: string;
    parent_vendor_name?: string | null;
    agent_role: 'AGENT' | 'VENDOR';
    type: string;
    subject: string;
    amount: number;
    status: string;
    raw_status: string;
}

export default function AgentHistoryPage() {
    const [records, setRecords] = useState<EarningRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        min_amount: '',
        max_amount: '',
        start_date: '',
        end_date: '',
        min_qr: '',
        min_loans: ''
    });

    const loadHistory = useCallback(async (pageNum: number = 1, searchQuery: string = '', currentFilters: any = filters) => {
        setLoading(true);
        try {
            let url = `/admin/agent-earning-history?page=${pageNum}&search=${searchQuery}`;
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value) url += `&${key}=${value}`;
            });
            const res = await apiFetch(url);
            setRecords(res.data || []);
            setTotalPages(res.last_page || 1);
            setPage(res.current_page || 1);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadHistory(1, search, filters);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, filters, loadHistory]);

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'held':
                return 'bg-amber-100 text-amber-700 border-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.1)]';
            case 'transferred':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_2px_10px_rgba(16,185,129,0.1)]';
            case 'processing':
                return 'bg-blue-100 text-blue-700 border-blue-200 shadow-[0_2px_10px_rgba(59,130,246,0.1)]';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AdminLayout title="Agent & Vendor History">
            <div className="space-y-8 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Earning Feed</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Agent & Vendor History</h2>
                        <p className="text-slate-500 font-medium max-w-md">Monitor real-time agent commissions, QR onboarding rewards and payout states across your hierarchy.</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="relative group max-w-md w-full">
                            <div className="absolute inset-0 bg-blue-500/5 blur-2xl group-focus-within:bg-blue-500/10 transition-all rounded-3xl"></div>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-blue-500 z-10" />
                            <input
                                type="text"
                                placeholder="Search by agent, mobile, or parent vendor..."
                                className="relative z-10 w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-4 rounded-2xl border transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px] ${showFilters ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                        >
                            <Filter className={`w-4 h-4 ${showFilters ? 'text-blue-400' : 'text-slate-400'}`} />
                            {showFilters ? 'Hide Filters' : 'Filters'}
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-8 bg-white border border-slate-200 rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Date Range
                            </label>
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                                />
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Amount
                            </label>
                            <div className="flex flex-col gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Min ₹"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                    value={filters.min_amount}
                                    onChange={(e) => setFilters({...filters, min_amount: e.target.value})}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Max ₹"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                    value={filters.max_amount}
                                    onChange={(e) => setFilters({...filters, max_amount: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Award className="w-3 h-3" /> QR Onboarded
                            </label>
                            <input 
                                type="number" 
                                placeholder="Min QRs..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                value={filters.min_qr}
                                onChange={(e) => setFilters({...filters, min_qr: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Loans Approved
                            </label>
                            <input 
                                type="number" 
                                placeholder="Min Loans..."
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                                value={filters.min_loans}
                                onChange={(e) => setFilters({...filters, min_loans: e.target.value})}
                            />
                        </div>

                        <div className="flex flex-col justify-end gap-2 pb-1">
                            <button 
                                onClick={() => {
                                    setFilters({
                                        min_amount: '',
                                        max_amount: '',
                                        start_date: '',
                                        end_date: '',
                                        min_qr: '',
                                        min_loans: ''
                                    });
                                    setSearch('');
                                }}
                                className="w-full py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-3 h-3" /> Reset all
                            </button>
                        </div>
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="pl-8 pr-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Timestamp</th>
                                    <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Beneficiary</th>
                                    <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Category</th>
                                    <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Transaction Details</th>
                                    <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Credit</th>
                                    <th className="pl-6 pr-8 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                     <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                                                </div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-32 text-center">
                                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 inline-flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                                    <Search className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-slate-900 font-bold">No Records Found</p>
                                                    <p className="text-slate-400 text-sm">Try adjusting your search filters</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record, idx) => (
                                        <tr key={record.id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="pl-8 pr-6 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-300 text-xs shadow-sm">
                                                        {idx + 1 + (page - 1) * 50}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">
                                                            {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                            {new Date(record.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-colors ${record.agent_role === 'VENDOR' ? 'bg-indigo-50 border-indigo-100 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500' : 'bg-blue-50 border-blue-100 text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500'}`}>
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 capitalize group-hover:text-slate-900 transition-colors">{record.agent_name}</span>
                                                        {record.parent_vendor_name && (
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                via {record.parent_vendor_name}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${record.agent_role === 'VENDOR' ? 'text-indigo-400' : 'text-blue-400'}`}>
                                                            {record.agent_role === 'VENDOR' ? 'District Head / Vendor' : 'On-Field Agent'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bonus Type</span>
                                                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm whitespace-nowrap self-start">
                                                        {record.type.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="max-w-[280px]">
                                                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                                                        <Info className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                                                        <p className="text-xs text-slate-500 leading-relaxed font-bold">
                                                            {record.subject}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-lg font-black text-slate-900 tracking-tight">
                                                        ₹{Number(record.amount).toLocaleString('en-IN')}
                                                    </span>
                                                    <div className="w-12 h-1 bg-blue-100 rounded-full mt-1 opacity-50"></div>
                                                </div>
                                            </td>
                                            <td className="pl-6 pr-8 py-6 text-center">
                                                <div className={`inline-flex items-center px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all group-hover:scale-105 duration-300 ${getStatusStyles(record.status)}`}>
                                                    {record.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    {records.length > 0 && (
                        <div className="px-8 py-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(3, totalPages))].map((_, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-50 bg-slate-200"></div>
                                    ))}
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Page {page} of {totalPages} results</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button
                                    disabled={page === 1 || loading}
                                    onClick={() => loadHistory(page - 1, search)}
                                    className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-100 transition-all shadow-sm"
                                >
                                    Prev
                                </button>
                                <div className="h-1 w-8 bg-slate-200 rounded-full mx-2"></div>
                                <button
                                    disabled={page === totalPages || loading}
                                    onClick={() => loadHistory(page + 1, search)}
                                    className="px-8 py-3 bg-blue-600 border-2 border-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-blue-700 hover:border-blue-700 disabled:opacity-30 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
