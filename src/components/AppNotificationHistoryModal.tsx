'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { X, Send, AlertTriangle, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Bell, Clock, Users, FileText } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface AppNotificationHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientType: 'user' | 'sub_user';
    selectedIds?: number[];
    onSuccess?: () => void;
}

export default function AppNotificationHistoryModal({ 
    isOpen, 
    onClose, 
    recipientType, 
    selectedIds = [], 
    onSuccess 
}: AppNotificationHistoryModalProps) {
    const [activeTab, setActiveTab] = useState<'history' | 'compose'>('history');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total_overall: 0,
        total_unread: 0
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/notification-logs?page=${page}`);
            setStats({
                total_overall: res.total_overall || 0,
                total_unread: res.total_unread || 0
            });
            if (res.logs) {
                setLogs(res.logs.data || []);
                setCurrentPage(res.logs.current_page || 1);
                setLastPage(res.logs.last_page || 1);
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to fetch notification logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (selectedIds.length > 0) {
                setActiveTab('compose');
            } else {
                setActiveTab('history');
            }
            fetchLogs(1);
        }
    }, [isOpen, selectedIds]);

    if (!isOpen) return null;

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            toast.error('No recipients selected. Close this modal and select users first.');
            return;
        }

        setIsSending(true);
        try {
            const res = await apiFetch('/admin/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_ids: selectedIds,
                    recipient_type: recipientType,
                    title,
                    body,
                })
            });

            toast.success(res.message || 'Notifications sent successfully!');
            setTitle('');
            setBody('');
            setActiveTab('history');
            fetchLogs(1);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send notifications.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 ease-out duration-300 flex flex-col my-8 max-h-[85vh]">
                
                {/* Header Section */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">App Notifications Control</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Send real-time alerts & manage user notification feeds</p>
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
                            Broadcast Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('compose')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'compose' 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            Send Alert {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>
                    </div>

                    {/* Stats counters */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-none bg-indigo-50 border border-indigo-100/50 rounded-2xl px-5 py-3 text-center md:text-left shadow-sm">
                            <span className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">TOTAL SENT</span>
                            <span className="text-xl font-black text-indigo-800 font-mono mt-1 block leading-none">{stats.total_overall}</span>
                        </div>
                        <div className="flex-1 md:flex-none bg-amber-50 border border-amber-100/50 rounded-2xl px-5 py-3 text-center md:text-left shadow-sm">
                            <span className="block text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">UNREAD</span>
                            <span className="text-xl font-black text-amber-800 font-mono mt-1 block leading-none">{stats.total_unread}</span>
                        </div>
                    </div>
                </div>

                {/* Content Panel */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    {activeTab === 'history' ? (
                        loading && logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Clock className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                                <p className="text-sm font-bold">Querying notification dispatch logs...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-[2rem] bg-white">
                                <Bell className="w-12 h-12 text-slate-300 mb-4" />
                                <h4 className="text-base font-black text-slate-700">No Notifications Logged</h4>
                                <p className="text-xs text-slate-400 max-w-[280px] text-center mt-1 font-medium">Compose new individual or bulk app notifications from user directories to track records.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => {
                                    const isExpanded = expandedLogId === log.id;
                                    return (
                                        <div 
                                            key={log.id} 
                                            className="bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:border-slate-200 transition-all overflow-hidden"
                                        >
                                            <div 
                                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                        log.is_read ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-600"
                                                    )}>
                                                        <Bell size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-2">
                                                            To: <span className="text-slate-800 font-extrabold">{log.recipient_name}</span>
                                                            <span className="font-mono text-xs font-semibold text-slate-500">({log.recipient_mobile})</span>
                                                            <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">{log.recipient_type === 'sub_user' ? 'Sub User / Vendor' : 'Customer'}</span>
                                                        </p>
                                                        <h4 className="font-black text-slate-700 text-sm mt-1">{log.title}</h4>
                                                    </div>
                                                </div>

                                                <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 pl-14 md:pl-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                        log.is_read ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                                                    )}>
                                                        {log.is_read ? 'Read' : 'Unread'}
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
                                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notification Body</span>
                                                        <p className="whitespace-pre-wrap font-medium text-xs text-slate-700 leading-relaxed">{log.body}</p>
                                                    </div>
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
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                            {selectedIds.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h4 className="text-lg font-black text-slate-800">No Recipients Selected</h4>
                                    <p className="text-xs text-slate-400 max-w-[280px] mx-auto mt-1 font-medium">Please close the modal, select one or more users from the grid directory, and click App Notification to send.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSendNotification} className="space-y-6">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                                            {selectedIds.length}
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 font-bold">Target Audience:</span>
                                            <p className="text-xs font-black text-slate-900 mt-0.5">{selectedIds.length} Recipient(s) via database dialogue & real-time FCM channels.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notification Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                                placeholder="e.g. System Alert 🔔"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notification Body</label>
                                            <textarea
                                                required
                                                rows={5}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none font-medium transition-all"
                                                placeholder="Type your message details here..."
                                                value={body}
                                                onChange={e => setBody(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all text-sm active:scale-98"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSending}
                                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {isSending ? (
                                                <>
                                                    <Clock size={16} className="animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} />
                                                    Shoot Alert
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
