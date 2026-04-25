'use client';

import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Clock, Check, AlertCircle, Loader2, Send, X, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';

interface UserResult {
    id: number;
    name: string;
    mobile_number: string;
    role: string;
    has_active_loan: boolean;
    has_active_emi: boolean;
}

interface AdminMessage {
    id: number;
    title?: string;
    message: string;
    receiver: {
        name: string;
        mobile_number: string;
        role: string;
    };
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export default function DirectMessagingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<AdminMessage[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await apiFetch('/admin/admin-messages?type=sent');
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsLoading(true);
                try {
                    const results = await apiFetch(`/admin/admin-messages/search-users?query=${searchQuery}`);
                    setSearchResults(results);
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSendMessage = async () => {
        if (!selectedUser || !message.trim()) return;

        setIsSending(true);
        try {
            await apiFetch('/admin/admin-messages', {
                method: 'POST',
                body: JSON.stringify({
                    receiver_id: selectedUser.id,
                    title: title,
                    message: message
                })
            });
            toast.success('Message sent to ' + selectedUser.name);
            setTitle('');
            setMessage('');
            setSelectedUser(null);
            setSearchQuery('');
            fetchHistory(); // Refresh history
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <AdminLayout title="Direct Messaging">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                        <MessageSquare className="text-white w-6 h-6" />
                    </div>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        showHistory 
                        ? 'bg-slate-900 text-white shadow-xl translate-y--1' 
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-900'
                    }`}
                >
                    {showHistory ? 'Compose Message' : 'View Send History'}
                </button>
            </div>

            {showHistory ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Transmission Logs</h3>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{history.length} Logs recorded</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30">
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Recipient</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Subject & Message</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Sent At</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Read Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoadingHistory ? (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-slate-300 mb-4" size={32} />
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Decrypting logs...</p>
                                        </td>
                                    </tr>
                                ) : history.length > 0 ? (
                                    history.map((msg) => (
                                        <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                                                        {msg.receiver.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{msg.receiver.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] font-bold text-slate-400 font-mono italic">{msg.receiver.mobile_number}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 max-w-md">
                                                {msg.title && (
                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight mb-1">{msg.title}</p>
                                                )}
                                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed truncate uppercase italic" title={msg.message}>{msg.message}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{formatDate(msg.created_at)}</p>
                                            </td>
                                            <td className="p-4">
                                                {msg.is_read ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                                            <CheckCircle2 size={12} strokeWidth={3} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Read & Ack</span>
                                                        </div>
                                                        {msg.read_at && (
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">@ {formatDate(msg.read_at)}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-300">
                                                        <AlertCircle size={12} strokeWidth={3} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Delivered</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-slate-300 uppercase">
                                            No transmissions recorded
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col lg:flex-row min-h-[calc(100vh-200px)] shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Search Panel */}
                    <div className="w-full lg:w-[450px] border-r border-slate-100 flex flex-col h-full bg-slate-50/20">
                        <div className="p-8 border-b border-slate-100 bg-white">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="SEARCH NAME OR NUMBER..."
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black tracking-wider text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300 uppercase underline-offset-4"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                    <Loader2 className="animate-spin text-blue-500 mb-4" size={24} />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Scanning user database...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full text-left p-5 rounded-3xl border-2 transition-all group relative overflow-hidden ${
                                            selectedUser?.id === user.id
                                                ? 'border-blue-500 bg-blue-50/50 shadow-md ring-4 ring-blue-50'
                                                : 'border-white bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                                    selectedUser?.id === user.id ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                }`}>
                                                    <User size={20} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{user.name}</h4>
                                                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[7px] font-black rounded uppercase tracking-wider">{user.role}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{user.mobile_number}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100/50">
                                            {user.has_active_loan && (
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 border border-emerald-200/50">
                                                    <CheckCircle2 size={8} strokeWidth={4} />
                                                    Active Loan
                                                </span>
                                            )}
                                            {user.has_active_emi && (
                                                <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[8px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 border border-rose-200/50">
                                                    <AlertCircle size={8} strokeWidth={4} />
                                                    Active EMI
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : searchQuery.length >= 3 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                    <Search size={32} strokeWidth={1} className="mb-4 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No matching users</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                    <MessageSquare size={48} strokeWidth={0.5} className="mb-6 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-10 leading-loose">Input 3+ characters to initiate database search</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Panel */}
                    <div className="flex-1 bg-slate-50/30 flex flex-col items-center justify-center p-8 lg:p-16">
                        {selectedUser ? (
                            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-900 border-2 border-slate-50 select-none">
                                        <span className="text-xl font-black tracking-tighter">{selectedUser.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{selectedUser.name}</h3>
                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded-md uppercase tracking-widest border border-blue-200/50">{selectedUser.role}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedUser.mobile_number}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedUser(null)}
                                        className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-all px-4 py-2 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="mb-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block px-2">Message Heading</label>
                                        <input
                                            type="text"
                                            placeholder="ENTER SUBJECT/HEADING (OPTIONAL)..."
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-200 uppercase"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-3 px-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Message Content</label>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{message.length} chars</span>
                                        </div>
                                        <textarea
                                            rows={6}
                                            placeholder="INPUT THE NOTIFICATION CONTENT HERE..."
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none shadow-inner placeholder:text-slate-300 leading-relaxed uppercase"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-6 flex gap-3 items-start shadow-sm">
                                        <div className="p-1.5 bg-white rounded-md shadow-sm text-indigo-500 border border-indigo-100 shrink-0">
                                            <AlertCircle size={14} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-0.5">Protocol Warning</p>
                                            <p className="text-[8px] font-bold text-indigo-600/70 leading-relaxed uppercase">Force-read interactions ensure message delivery acknowledgement.</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!message.trim() || isSending}
                                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:active:scale-100 ${
                                            isSending ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-900 hover:bg-blue-600 hover:shadow-blue-200/50 text-white'
                                        }`}
                                    >
                                        {isSending ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <>
                                                <span className="text-sm font-black uppercase tracking-[0.4em]">Execute Transmission</span>
                                                <Send size={22} strokeWidth={3} className="-rotate-12 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center animate-in fade-in duration-1000">
                                <div className="w-32 h-32 bg-white rounded-[3.5rem] border-[3px] border-dashed border-slate-100 flex items-center justify-center mx-auto mb-10 shadow-sm relative">
                                    <MessageSquare size={48} strokeWidth={1} className="text-slate-100" />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full animate-bounce" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Priority Comms Center</h3>
                                <p className="text-base font-medium text-slate-400 max-w-[400px] mx-auto italic leading-relaxed">Initiate a secure communication link by selecting a target user from the registry on the left.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
