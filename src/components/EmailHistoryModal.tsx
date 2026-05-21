'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { X, Send, AlertTriangle, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Mail, Clock, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface EmailHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EmailHistoryModal({ isOpen, onClose }: EmailHistoryModalProps) {
    const [activeTab, setActiveTab] = useState<'history' | 'smtp'>('history');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total_sent: 0,
        total_failed: 0,
        total_overall: 0
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/email-logs?page=${page}`);
            setStats({
                total_sent: res.total_sent || 0,
                total_failed: res.total_failed || 0,
                total_overall: res.total_overall || 0
            });
            if (res.logs) {
                setLogs(res.logs.data || []);
                setCurrentPage(res.logs.current_page || 1);
                setLastPage(res.logs.last_page || 1);
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to fetch email logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs(1);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const smtpAccounts = [
        'alert.openscore@msmeloan.sbs',
        'alert.openscore.1@msmeloan.sbs',
        'alert.openscore.2@msmeloan.sbs',
        'alert.openscore.3@msmeloan.sbs',
        'alert.openscore.4@msmeloan.sbs',
        'alert.openscore.5@msmeloan.sbs',
        'alert.openscore.6@msmeloan.sbs',
    ];

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 ease-out duration-300 flex flex-col my-8 max-h-[85vh]">
                
                {/* Header Section */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Email System Records</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Rotated SMTP delivery logs & execution counters</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => fetchLogs(currentPage)}
                            disabled={loading}
                            className="p-3 bg-white border border-slate-200 hover:border-slate-300 active:scale-95 text-slate-600 rounded-2xl transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                            title="Refresh logs"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                        <button 
                            onClick={onClose} 
                            className="p-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 hover:text-slate-800 rounded-2xl transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs & Stats */}
                <div className="px-8 pt-6 pb-2 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'history' 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Delivery Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('smtp')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'smtp' 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            SMTP Senders
                        </button>
                    </div>

                    {/* Execution Counters */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-none bg-emerald-50 border border-emerald-100/50 rounded-2xl px-5 py-3 text-center md:text-left shadow-sm">
                            <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">SENT</span>
                            <span className="text-xl font-black text-emerald-800 font-mono mt-1 block leading-none">{stats.total_sent}</span>
                        </div>
                        <div className="flex-1 md:flex-none bg-rose-50 border border-rose-100/50 rounded-2xl px-5 py-3 text-center md:text-left shadow-sm">
                            <span className="block text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">FAILED</span>
                            <span className="text-xl font-black text-rose-800 font-mono mt-1 block leading-none">{stats.total_failed}</span>
                        </div>
                        <div className="flex-1 md:flex-none bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-center md:text-left shadow-sm">
                            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">OVERALL</span>
                            <span className="text-xl font-black text-slate-800 font-mono mt-1 block leading-none">{stats.total_overall}</span>
                        </div>
                    </div>
                </div>

                {/* Content Panel */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    {activeTab === 'history' ? (
                        loading && logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Clock className="w-10 h-10 animate-spin text-teal-500 mb-4" />
                                <p className="text-sm font-bold">Querying email dispatch logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-[2rem] bg-white">
                                <Mail className="w-12 h-12 text-slate-300 mb-4" />
                                <h4 className="text-base font-black text-slate-700">No Emails Logged</h4>
                                <p className="text-xs text-slate-400 max-w-[280px] text-center mt-1 font-medium">Compose new individual or bulk emails from user directories to track records.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => {
                                    const isExpanded = expandedLogId === log.id;
                                    return (
                                        <div 
                                            key={log.id} 
                                            className={cn(
                                                "bg-white border rounded-[1.5rem] shadow-sm transition-all overflow-hidden",
                                                log.status === 'failed' ? "border-rose-100 hover:border-rose-200" : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <div 
                                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                        log.status === 'sent' ? "bg-emerald-50 text-emerald-600" : 
                                                        log.status === 'failed' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600 animate-pulse"
                                                    )}>
                                                        {log.status === 'sent' ? <CheckCircle size={18} /> : 
                                                         log.status === 'failed' ? <AlertTriangle size={18} /> : <Send size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-2">
                                                            To: <span className="font-mono text-xs font-semibold text-slate-600 break-all">{log.recipient_email}</span>
                                                        </p>
                                                        <h4 className="font-black text-slate-700 text-sm mt-1">{log.subject}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                                                            <span>From rotated SMTP:</span>
                                                            <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-normal">{log.sender_email || 'System'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 pl-14 md:pl-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                        log.status === 'sent' ? "bg-emerald-100 text-emerald-700" : 
                                                        log.status === 'failed' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700 animate-pulse"
                                                    )}>
                                                        {log.status}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold mt-1.5">
                                                        {new Date(log.created_at).toLocaleString('en-IN', {
                                                            hour12: true,
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/20 text-slate-700 text-sm space-y-4">
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message Content</span>
                                                        <p className="whitespace-pre-wrap font-medium text-xs text-slate-700 leading-relaxed">{log.message}</p>
                                                    </div>

                                                    {log.status === 'failed' && log.error_message && (
                                                        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-rose-800 text-xs">
                                                            <span className="block text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Failure Reason</span>
                                                            <p className="font-mono font-bold leading-normal">{log.error_message}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Pagination Row */}
                                {lastPage > 1 && (
                                    <div className="flex justify-between items-center pt-6 border-t border-slate-200/50">
                                        <button
                                            disabled={currentPage === 1 || loading}
                                            onClick={() => fetchLogs(currentPage - 1)}
                                            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            <ChevronLeft size={16} />
                                            Prev
                                        </button>
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                            Page {currentPage} of {lastPage}
                                        </span>
                                        <button
                                            disabled={currentPage === lastPage || loading}
                                            onClick={() => fetchLogs(currentPage + 1)}
                                            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            Next
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                                <div className="flex items-center gap-3 text-teal-600 mb-4">
                                    <ShieldCheck size={22} />
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Active SMTP Routing Sequence</h4>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                                    MSME Loan Systems routes all dynamically generated and scheduled communications through a cycled sequence of Hosted SMTP connections below. Each dispatch shifts to the next index sequentially, reducing server load and avoiding email blacklisting.
                                </p>
                                
                                <div className="space-y-3">
                                    {smtpAccounts.map((email, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-mono font-bold text-xs">
                                                    {idx}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-slate-700">{email}</span>
                                            </div>
                                            <span className="px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded-md text-[9px] font-black uppercase tracking-wider">
                                                Active Rotating
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
