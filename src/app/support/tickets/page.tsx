'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, MessageSquare, Clock, CheckCircle2, User, Send, Paperclip, ShieldAlert, Wallet, BadgeCheck, Ban, AlertCircle, Briefcase, PlayCircle, ExternalLink, Eye, XCircle, TrendingUp, IndianRupee } from 'lucide-react';
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
    const [loanDetails, setLoanDetails] = useState<any>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Cashback state
    const [cashbackModalOpen, setCashbackModalOpen] = useState(false);
    const [cashbackAmount, setCashbackAmount] = useState('');
    const [cashbackReason, setCashbackReason] = useState('Support Ticket Reward');
    const [isProcessingCashback, setIsProcessingCashback] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchTickets(true);
        }, 15000); // 15s poll for new tickets
        return () => clearInterval(interval);
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

    const fetchTickets = async (silent = false) => {
        if (!silent) setIsLoading(true);
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
        fetchUserLoans(ticket.user.id);
    };

    const fetchUserLoans = async (userId: number) => {
        try {
            const loanRes: any = await apiFetch(`/admin/users/${userId}/active-loan`);
            if (loanRes && loanRes.loan) {
                const fullLoanRes: any = await apiFetch(`/admin/loans/${loanRes.loan.id}/details`);
                setLoanDetails(fullLoanRes);
            } else {
                setLoanDetails(null);
            }
        } catch (error) {
            console.error("Failed to fetch user loan details", error);
            setLoanDetails(null);
        }
    };

    const fetchMessages = async (ticketId: number, silent = false) => {
        if (!silent) setIsMessageLoading(true);
        try {
            const res = await apiFetch(`/support/tickets/${ticketId}/messages`);
            const messages = Array.isArray(res) ? res : (res.messages || []);
            setSelectedTicket(prev => {
                if (prev?.id === ticketId) {
                    return { ...prev, messages };
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

    const handleLoanAction = async (loanId: number, endpoint: string, successMsg: string) => {
        if (!confirm(`Are you sure you want to ${endpoint.replace('-', ' ')}?`)) return;
        setIsActionLoading(true);
        try {
            await apiFetch(`/admin/loans/${loanId}/${endpoint}`, { method: 'POST' });
            toast.success(successMsg);
            if (selectedTicket) fetchUserLoans(selectedTicket.user.id);
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRejectLoan = async (loanId: number) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        setIsActionLoading(true);
        try {
            await apiFetch(`/admin/loans/${loanId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            toast.success('Loan rejected');
            if (selectedTicket) fetchUserLoans(selectedTicket.user.id);
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAddCashback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;
        if (!cashbackAmount || isNaN(Number(cashbackAmount))) {
            toast.error('Enter valid amount');
            return;
        }
        setIsProcessingCashback(true);
        try {
            await apiFetch(`/admin/users/${selectedTicket.user.id}/credit-cashback`, {
                method: 'POST',
                body: JSON.stringify({ amount: Number(cashbackAmount), description: cashbackReason })
            });
            toast.success('Cashback processed successfully');
            setCashbackModalOpen(false);
            setCashbackAmount('');
            fetchUserLoans(selectedTicket.user.id);
        } catch (error: any) {
            toast.error(error.message || 'Cashback operation failed');
        } finally {
            setIsProcessingCashback(false);
        }
    };

    const handleApproveEMI = async (repaymentId: number) => {
        if (!confirm('Approve this EMI repayment?')) return;
        setIsActionLoading(true);
        try {
            await apiFetch(`/admin/repayments/${repaymentId}/approve`, { method: 'POST' });
            toast.success('EMI approved successfully');
            if (selectedTicket) fetchUserLoans(selectedTicket.user.id);
        } catch (error: any) {
            toast.error(error.message || 'EMI approval failed');
        } finally {
            setIsActionLoading(false);
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
                                { id: 'resolved', label: 'RESOLVED' },
                                { id: 'closed', label: 'CLOSED' }
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
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {ticket.messages && ticket.messages.length > 0
                                                ? ticket.messages[0].message
                                                : ticket.user.name}
                                        </p>
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

                {/* Right: Portfolio Actions */}
                {selectedTicket && (
                    <div className="w-80 border-l border-slate-100 flex flex-col bg-slate-50/10">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">User Portfolio</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Loan Action Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-900 text-white">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Briefcase size={16} className="text-blue-400" />
                                        <h4 className="text-xs font-black uppercase tracking-widest">Loan Management</h4>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">Process current application</p>
                                </div>

                                <div className="p-4 space-y-4">
                                    {!loanDetails ? (
                                        <div className="text-center py-6">
                                            <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">No active loan found</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="text-slate-400 tracking-tighter uppercase">Status</span>
                                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] tracking-widest font-black uppercase shadow-sm shadow-blue-200">{loanDetails.loan.status}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="text-slate-400 tracking-tighter uppercase">Amount</span>
                                                    <span className="text-slate-900">₹{Number(loanDetails.loan.amount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="text-slate-400 tracking-tighter uppercase">Applied</span>
                                                    <span className="text-slate-900 font-mono">{new Date(loanDetails.loan.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                {loanDetails.loan.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleLoanAction(loanDetails.loan.id, 'proceed', 'Loan marked as proceed')}
                                                        disabled={isActionLoading}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <PlayCircle size={14} /> Proceed Application
                                                    </button>
                                                )}

                                                {(loanDetails.loan.status === 'PROCEEDED' || loanDetails.loan.status === 'KYC_SENT') && (
                                                    <button
                                                        onClick={() => handleLoanAction(loanDetails.loan.id, 'send-kyc', 'KYC link sent to customer')}
                                                        disabled={isActionLoading}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200"
                                                    >
                                                        <ExternalLink size={14} /> {loanDetails.loan.status === 'KYC_SENT' ? 'Resend KYC Link' : 'Send KYC Link'}
                                                    </button>
                                                )}

                                                {['FORM_SUBMITTED', 'PROCEEDED', 'KYC_SENT'].includes(loanDetails.loan.status) && (
                                                    <button
                                                        onClick={() => handleLoanAction(loanDetails.loan.id, 'approve', 'Loan approved successfully')}
                                                        disabled={isActionLoading}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-200"
                                                    >
                                                        <BadgeCheck size={14} /> Approve Loan
                                                    </button>
                                                )}

                                                {['PENDING', 'PROCEEDED', 'KYC_SENT', 'FORM_SUBMITTED'].includes(loanDetails.loan.status) && (
                                                    <button
                                                        onClick={() => handleRejectLoan(loanDetails.loan.id)}
                                                        disabled={isActionLoading}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        <XCircle size={14} /> Reject Application
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => window.open(`/admin/loans/${loanDetails.loan.id}`, '_blank')}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                                >
                                                    <Eye size={14} /> View Full File
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* EMI Verification Card */}
                            {loanDetails?.repayments?.some((r: any) => r.status === 'PENDING') && (
                                <div className="bg-white rounded-2xl border-2 border-amber-100 shadow-sm overflow-hidden">
                                    <div className="p-3 bg-amber-500 text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="animate-pulse" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Pending EMI</h4>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {loanDetails.repayments.filter((r: any) => r.status === 'PENDING').map((rem: any) => (
                                            <div key={rem.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[11px] font-black text-slate-900">₹{Number(rem.amount).toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(rem.due_date).toLocaleDateString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleApproveEMI(rem.id)}
                                                    disabled={isActionLoading}
                                                    className="w-full py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
                                                >
                                                    Verify & Approve EMI
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Wallet Insight Card */}
                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={16} className="text-blue-200" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">Customer Wallet</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-blue-200 tracking-tighter uppercase leading-none">Available Balance</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-xl font-black tracking-tight">₹{loanDetails?.user?.wallet?.balance || '0.00'}</span>
                                        <IndianRupee size={12} className="mb-1 opacity-50" />
                                    </div>
                                    <button
                                        onClick={() => setCashbackModalOpen(true)}
                                        className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        + Instantly Credit Cashback
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
            {/* Cashback Modal */}
            {cashbackModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCashbackModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative z-10">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Credit Wallet</h2>
                        <p className="text-slate-500 text-xs mb-6">Instantly add funds to user's available balance.</p>
                        <form onSubmit={handleAddCashback} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={cashbackAmount}
                                    onChange={e => setCashbackAmount(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">Reason / Remark</label>
                                <input
                                    type="text"
                                    value={cashbackReason}
                                    onChange={e => setCashbackReason(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessingCashback}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isProcessingCashback ? 'Processing...' : 'Verify & Credit Funds'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
