'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, MessageSquare, Clock, CheckCircle2, User, Send, Paperclip, ShieldAlert, Wallet, BadgeCheck, Ban, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface Ticket {
    id: number;
    unique_ticket_id: string;
    subject: string;
    status: 'OPEN' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';
    payment_status?: 'PENDING_VERIFICATION' | 'AGENT_APPROVED' | 'ADMIN_APPROVED' | 'REJECTED';
    payment_amount?: string;
    sub_action?: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        mobile_number: string;
    };
    messages?: any[];
}

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageLoading, setIsMessageLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState('active'); // Default to active chats
    const scrollRef = useRef<HTMLDivElement>(null);

    // Modals for payment
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [processData, setProcessData] = useState({ action: 'recharge', amount: '', target_id: '' });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    useEffect(() => {
        if (selectedTicket) {
            const interval = setInterval(() => {
                fetchMessages(selectedTicket.id, true);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedTicket?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedTicket?.messages]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/admin/support/tickets?status=${statusFilter}`);
            setTickets(res.data || []);
        } catch (error) {
            toast.error('Failed to load tickets');
        } finally {
            setIsLoading(false);
        }
    };

    const selectTicket = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
        fetchMessages(ticket.id);
    };

    const fetchMessages = async (ticketId: number, silent = false) => {
        if (!silent) setIsMessageLoading(true);
        try {
            const res = await apiFetch(`/support/tickets/${ticketId}/messages`);
            setSelectedTicket(prev => {
                if (prev?.id === ticketId) {
                    return { ...prev, messages: res.messages };
                }
                return prev;
            });
        } catch (error) {
            console.error('Failed to load messages');
        } finally {
            if (!silent) setIsMessageLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedTicket) return;

        const msg = newMessage;
        setNewMessage('');

        try {
            await apiFetch(`/support/tickets/${selectedTicket.id}/message`, {
                method: 'POST',
                body: JSON.stringify({ message: msg })
            });
            fetchMessages(selectedTicket.id, true);
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const updateTicketStatus = async (ticketId: number, newStatus: string) => {
        try {
            await apiFetch(`/support/tickets/${ticketId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            toast.success(`Ticket marked as ${newStatus}`);
            fetchTickets();
            if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    // Payment Logic
    const openProcessModal = () => {
        if (!selectedTicket) return;
        setProcessData({
            action: selectedTicket.sub_action || 'recharge',
            amount: selectedTicket.payment_amount ? parseFloat(selectedTicket.payment_amount).toString() : '',
            target_id: ''
        });
        setProcessModalOpen(true);
    };

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;
        try {
            await apiFetch(`/admin/support/tickets/${selectedTicket.id}/process-action`, {
                method: 'POST',
                body: JSON.stringify(processData)
            });
            toast.success('Action processed successfully');
            setProcessModalOpen(false);
            fetchTickets();
            setSelectedTicket(null);
        } catch (error: any) {
            toast.error(error.message || 'Processing failed');
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;
        try {
            await apiFetch(`/admin/support/tickets/${selectedTicket.id}/reject-payment`, {
                method: 'POST',
                body: JSON.stringify({ reason: rejectReason })
            });
            toast.success('Payment rejected');
            setRejectModalOpen(false);
            fetchTickets();
            setSelectedTicket(null);
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        }
    };

    return (
        <AdminLayout title="Support Inbox">
            <div className="flex h-[calc(100vh-160px)] bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Left: Ticket List */}
                <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                    <div className="p-4 border-b border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-900">Inboxes</h3>
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{tickets.length}</span>
                        </div>
                        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                            {[
                                { id: 'active', label: 'ONGOING' },
                                { id: 'RESOLVED', label: 'RESOLVED' },
                                { id: 'CLOSED', label: 'CLOSED' }
                            ].map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatusFilter(s.id)}
                                    className={`flex-1 py-1.5 rounded-md text-[10px] font-black tracking-tight transition-all ${statusFilter === s.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center"><div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div></div>
                        ) : tickets.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm font-medium">No {statusFilter.toLowerCase()} chats</div>
                        ) : (
                            tickets.map(ticket => (
                                <button
                                    key={ticket.id}
                                    onClick={() => selectTicket(ticket)}
                                    className={`w-full p-4 text-left border-b border-slate-100 transition-all hover:bg-white flex items-start gap-3 ${selectedTicket?.id === ticket.id ? 'bg-white border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                        <User size={18} className="text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-blue-600">#{ticket.unique_ticket_id}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-900 truncate">{ticket.subject}</h4>
                                        <p className="text-[11px] text-slate-500 truncate">{ticket.user.name}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Chat View */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{selectedTicket.user.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-mono">{selectedTicket.user.mobile_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTicket.payment_status && ['PENDING_VERIFICATION', 'AGENT_APPROVED'].includes(selectedTicket.payment_status) && (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setRejectModalOpen(true)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"><Ban size={16} /></button>
                                            <button onClick={openProcessModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition-colors shadow-sm"><Wallet size={14} /> Process Payment</button>
                                        </div>
                                    )}
                                    {selectedTicket.status !== 'CLOSED' && (
                                        <button
                                            onClick={() => updateTicketStatus(selectedTicket.id, 'CLOSED')}
                                            className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-50 transition-colors"
                                        >
                                            Complete Chat
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chat History */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {isMessageLoading ? (
                                    <div className="text-center py-8 text-slate-400">Loading conversation...</div>
                                ) : selectedTicket.messages?.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${msg.is_admin_reply ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                            <span className={`text-[9px] mt-1 block opacity-50 ${msg.is_admin_reply ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Message Input */}
                            {selectedTicket.status !== 'CLOSED' && (
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"><Send size={18} /></button>
                                    </div>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4"><MessageSquare size={32} /></div>
                            <h4 className="text-sm font-black text-slate-900">Select an Inbox</h4>
                            <p className="text-xs font-medium">Click on a chat to view the conversation and take actions.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Process Modal */}
            {processModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setProcessModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-in zoom-in-95">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Process Payment</h2>
                        <p className="text-slate-500 text-sm mb-6">Verify and execute the transaction.</p>
                        <form onSubmit={handleProcess} className="space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                                {['recharge', 'emi', 'platform_fee'].map(action => (
                                    <button
                                        key={action}
                                        type="button"
                                        onClick={() => setProcessData({ ...processData, action })}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${processData.action === action ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${processData.action === action ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                                            {action === 'recharge' ? <Wallet size={16} /> : action === 'emi' ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                                        </div>
                                        <span className="text-[11px] font-black uppercase">{action.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Amount (₹)</label>
                                <input type="number" value={processData.amount} onChange={e => setProcessData({ ...processData, amount: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all">Confirm Approval</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative z-10">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Reject Payment</h2>
                        <form onSubmit={handleReject} className="space-y-4 pt-4">
                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 h-24 resize-none" placeholder="Reason for rejection..." required />
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setRejectModalOpen(false)} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="py-3 bg-rose-600 text-white rounded-xl font-bold">Reject</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
