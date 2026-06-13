'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { 
    Mail, 
    Search, 
    AlertTriangle, 
    CheckCircle, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Copy, 
    RefreshCw, 
    X, 
    ChevronDown, 
    ChevronUp,
    Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmailLogsPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed'>('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total_sent: 0,
        total_failed: 0,
        total_overall: 0
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const loadLogs = async (targetPage = page, isRefresh = false) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: targetPage.toString(),
                search: search.trim()
            });
            
            // Note: the backend `/admin/email-logs` returns paginated logs.
            // If we have a local status filter, we can let the admin filter locally 
            // or we could let the endpoint return overall.
            const response = await apiFetch(`/admin/email-logs?${queryParams.toString()}`);
            
            if (response) {
                setStats({
                    total_sent: response.total_sent || 0,
                    total_failed: response.total_failed || 0,
                    total_overall: response.total_overall || 0
                });
                
                if (response.logs) {
                    setLogs(response.logs.data || []);
                    setPage(response.logs.current_page || 1);
                    setTotalPages(response.logs.last_page || 1);
                } else {
                    setLogs([]);
                }
            }
            if (isRefresh) {
                toast.success('Logs refreshed successfully');
            }
        } catch (e: any) {
            console.error('Failed to load email logs:', e);
            toast.error(e.message || 'Failed to fetch email logs');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const handler = setTimeout(() => {
            loadLogs(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // Reload logs when page changes
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            loadLogs(newPage);
        }
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success('Message content copied to clipboard');
    };

    // Local status filter
    const filteredLogs = logs.filter(log => {
        if (statusFilter === 'all') return true;
        return log.status === statusFilter;
    });

    return (
        <AdminLayout title="Email Communication Logs">
            <div className="space-y-6 w-full">
                {/* Stats Counters Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TOTAL SENT</span>
                            <span className="text-3xl font-black text-emerald-600 font-mono mt-2 block leading-none">{stats.total_sent}</span>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TOTAL FAILED</span>
                            <span className="text-3xl font-black text-rose-600 font-mono mt-2 block leading-none">{stats.total_failed}</span>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">OVERALL RECORDED</span>
                            <span className="text-3xl font-black text-slate-800 font-mono mt-2 block leading-none">{stats.total_overall}</span>
                        </div>
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                            <Mail className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Main Filter and Search Bar */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Search Delivery Logs</h3>
                            <p className="text-slate-500 font-medium text-xs">Lookup email history by recipient address, sender SMTP account, or keywords.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Input */}
                            <div className="relative group flex-1 md:flex-none">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search email, subject..."
                                    className="pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all shadow-sm"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                                {search && (
                                    <button 
                                        onClick={() => { setSearch(''); setPage(1); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Tab Buttons */}
                            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl shadow-sm">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                        statusFilter === 'all' 
                                            ? "bg-white text-slate-900 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setStatusFilter('sent')}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                        statusFilter === 'sent' 
                                            ? "bg-white text-emerald-600 shadow-sm" 
                                            : "text-slate-500 hover:text-emerald-500"
                                    )}
                                >
                                    Sent
                                </button>
                                <button
                                    onClick={() => setStatusFilter('failed')}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                        statusFilter === 'failed' 
                                            ? "bg-white text-rose-600 shadow-sm" 
                                            : "text-slate-500 hover:text-rose-500"
                                    )}
                                >
                                    Failed
                                </button>
                            </div>

                            {/* Refresh Button */}
                            <button
                                onClick={() => loadLogs(page, true)}
                                disabled={loading}
                                className="p-3 bg-white border border-slate-200 hover:border-slate-300 active:scale-95 text-slate-600 rounded-2xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    {/* Table and Detail Side-by-Side Flex Section */}
                    <div className="flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        
                        {/* Left Side: Table / List Section */}
                        <div className={cn(
                            "flex-1 overflow-x-auto transition-all duration-300",
                            expandedLogId !== null && "md:max-w-[50%]"
                        )}>
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8">Status</th>
                                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recipient</th>
                                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject & Sender</th>
                                        <th className={cn("p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]", expandedLogId !== null && "hidden xl:table-cell")}>Date & Time</th>
                                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loading && filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full shadow-lg shadow-teal-500/20" />
                                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Querying database logs...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Mail className="w-12 h-12 text-slate-300 mb-3" />
                                                    <h4 className="text-base font-black text-slate-700">No Emails Found</h4>
                                                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                                                        No email dispatches match the current filters or search query.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log: any) => {
                                            const isExpanded = expandedLogId === log.id;
                                            return (
                                                <tr 
                                                    key={log.id} 
                                                    className={cn(
                                                        "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                                                        isExpanded && "bg-slate-50/30"
                                                    )}
                                                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                >
                                                    <td className="p-5 pl-8">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm inline-flex items-center gap-1.5",
                                                            log.status === 'sent' 
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                                : "bg-rose-50 text-rose-700 border-rose-100"
                                                        )}>
                                                            <span className={cn("w-1.5 h-1.5 rounded-full", log.status === 'sent' ? "bg-emerald-500" : "bg-rose-500")} />
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className="font-mono text-xs font-bold text-slate-700 block break-all max-w-[150px] lg:max-w-[200px] truncate">{log.recipient_email}</span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="space-y-0.5">
                                                            <h4 className="font-bold text-slate-800 text-sm max-w-[150px] lg:max-w-[200px] truncate">{log.subject}</h4>
                                                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                                <span>Via:</span>
                                                                <span className="font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded truncate max-w-[120px]">{log.sender_email || 'Default SMTP'}</span>
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className={cn("p-5", expandedLogId !== null && "hidden xl:table-cell")}>
                                                        <div className="space-y-0.5 text-xs text-slate-600 font-medium">
                                                            <p className="text-slate-800 font-bold whitespace-nowrap">
                                                                {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-bold">
                                                                {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 pr-8 text-right">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={(e) => handleCopy(log.message, e)}
                                                                className="p-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-sm"
                                                                title="Copy email content"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Right Side: Message Details Panel */}
                        {expandedLogId !== null && (
                            (() => {
                                const expandedLog = logs.find(l => l.id === expandedLogId);
                                if (!expandedLog) return null;
                                return (
                                    <div className="w-full md:w-[50%] p-6 md:p-8 bg-slate-50/15 overflow-y-auto animate-in slide-in-from-right duration-300 space-y-6">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Email Details</h4>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">ID: #{expandedLog.id}</p>
                                            </div>
                                            <button 
                                                onClick={() => setExpandedLogId(null)}
                                                className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                                            >
                                                Close Detail
                                            </button>
                                        </div>

                                        {/* Message Body Content */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative group">
                                            <button
                                                onClick={(e) => handleCopy(expandedLog.message, e)}
                                                className="absolute right-4 top-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-slate-200 shadow-sm"
                                                title="Copy content"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Message Content</span>
                                            <p className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50/30 p-4 rounded-xl border border-slate-100/50">
                                                {expandedLog.message}
                                            </p>
                                        </div>

                                        {/* SMTP Metadata Diagnostics */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">SMTP Diagnostics</span>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Recipient</span>
                                                    <span className="font-mono text-xs font-bold text-slate-800 break-all">{expandedLog.recipient_email}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">SMTP Sender</span>
                                                    <span className="font-mono text-xs font-bold text-slate-800 break-all">{expandedLog.sender_email || 'System Default'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Status</span>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block mt-0.5 border shadow-sm",
                                                        expandedLog.status === 'sent' 
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                            : "bg-rose-50 text-rose-700 border-rose-100"
                                                    )}>
                                                        {expandedLog.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-slate-400 font-bold uppercase">Timestamp</span>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {new Date(expandedLog.created_at).toLocaleString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Failure Diagnostics if status is failed */}
                                        {expandedLog.status === 'failed' && expandedLog.error_message && (
                                            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-rose-900 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2 text-rose-700">
                                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Failure Diagnostics</span>
                                                </div>
                                                <p className="font-mono text-xs font-bold leading-relaxed whitespace-pre-wrap break-all">
                                                    {expandedLog.error_message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        )}

                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1 || loading}
                                    onClick={() => handlePageChange(page - 1)}
                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={page === totalPages || loading}
                                    onClick={() => handlePageChange(page + 1)}
                                    className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
