'use client';

import { useState, useEffect } from 'react';
import { BadgeCheck, Ban, Filter, Search, Eye, AlertCircle, CheckCircle2, DollarSign, Wallet, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface Ticket {
    id: number;
    unique_ticket_id: string;
    subject: string;
    message: string;
    payment_status: 'PENDING_VERIFICATION' | 'AGENT_APPROVED' | 'ADMIN_APPROVED' | 'REJECTED';
    payment_amount: string | null;
    sub_action: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        mobile_number: string;
    };
    assignedAgent?: {
        name: string;
    };
    approvedByAgent?: {
        name: string;
    };
    attachment_url?: string; // Guessing field name
}

export default function PaymentTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Process Form Data
    const [processData, setProcessData] = useState({
        action: 'recharge', // default
        amount: '',
        target_id: '',
        notes: ''
    });

    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (statusFilter !== 'ALL') query.append('status', statusFilter);

            const res = await apiFetch(`/admin/support/payment-tickets?${query.toString()}`);
            setTickets(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load tickets');
        } finally {
            setIsLoading(false);
        }
    };

    const openProcessModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setProcessData({
            action: ticket.sub_action || 'recharge',
            amount: ticket.payment_amount ? parseFloat(ticket.payment_amount).toString() : '',
            target_id: '', // We don't have easy access to this from ticket list usually, unless stored
            notes: ''
        });
        setProcessModalOpen(true);
    };

    const openRejectModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;

        if (!processData.amount || parseFloat(processData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            await apiFetch(`/admin/support/tickets/${selectedTicket.id}/process-action`, {
                method: 'POST',
                body: JSON.stringify({
                    action: processData.action,
                    amount: processData.amount,
                    target_id: processData.target_id
                })
            });
            toast.success('Ticket Processed Successfully');
            setProcessModalOpen(false);
            fetchTickets();
        } catch (error: any) {
            toast.error(error.message || 'Processing failed');
        }
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket) return;

        if (!rejectReason.trim()) {
            toast.error('Please provide a reason');
            return;
        }

        try {
            await apiFetch(`/admin/support/tickets/${selectedTicket.id}/reject-payment`, {
                method: 'POST',
                body: JSON.stringify({ reason: rejectReason })
            });
            toast.success('Ticket Rejected');
            setRejectModalOpen(false);
            fetchTickets();
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        }
    };

    return (
        <AdminLayout title="Payment Tickets">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Tickets</h1>
                        <p className="text-slate-500 font-medium">Approve wallet recharges and payment verifications</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                        {['ALL', 'PENDING_VERIFICATION', 'AGENT_APPROVED', 'ADMIN_APPROVED', 'REJECTED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === s
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No tickets found</h3>
                            <p className="text-slate-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Ticket</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Request</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                                        #{ticket.id}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{ticket.subject}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(ticket.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900 text-sm">{ticket.user?.name}</p>
                                                <p className="text-xs font-mono text-slate-500">{ticket.user?.mobile_number}</p>
                                            </td>
                                            <td className="p-6">
                                                {ticket.payment_amount ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-black">
                                                            ₹{parseFloat(ticket.payment_amount).toLocaleString()}
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-500 uppercase">{ticket.sub_action || 'Unknown'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Not set</span>
                                                )}
                                                {ticket.message && (
                                                    <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{ticket.message}</p>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <StatusBadge status={ticket.payment_status} />
                                                {ticket.payment_status === 'AGENT_APPROVED' && ticket.approvedByAgent && (
                                                    <p className="text-[10px] text-purple-600 mt-1 font-medium">
                                                        by {ticket.approvedByAgent.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-6 text-right">
                                                {['PENDING_VERIFICATION', 'AGENT_APPROVED'].includes(ticket.payment_status) ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openRejectModal(ticket)}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                            title="Reject"
                                                        >
                                                            <Ban size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => openProcessModal(ticket)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                                        >
                                                            <BadgeCheck size={16} />
                                                            {ticket.payment_status === 'AGENT_APPROVED' ? 'Final Approve' : 'Process'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium">Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Process Modal */}
            {processModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setProcessModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-in zoom-in-95">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Process Payment</h2>
                        <p className="text-slate-500 text-sm mb-6">Verify and execute the transaction.</p>

                        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">User</span>
                                <span className="text-sm font-bold text-slate-700">{selectedTicket.user?.name}</span>
                            </div>
                            <div className="text-sm text-slate-600 italic">
                                "{selectedTicket.message}"
                            </div>
                        </div>

                        <form onSubmit={handleProcess} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Action Type</label>
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setProcessData({ ...processData, action: 'recharge' })}
                                        className={`w-full p-3 rounded-xl border-2 flex items-center gap-4 transition-all ${processData.action === 'recharge'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${processData.action === 'recharge' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                                            <Wallet size={16} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight">1. Wallet Recharge</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setProcessData({ ...processData, action: 'emi' })}
                                        className={`w-full p-3 rounded-xl border-2 flex items-center gap-4 transition-all ${processData.action === 'emi'
                                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${processData.action === 'emi' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>
                                            <BadgeCheck size={16} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight">2. Loan EMI Payment</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setProcessData({ ...processData, action: 'platform_fee' })}
                                        className={`w-full p-3 rounded-xl border-2 flex items-center gap-4 transition-all ${processData.action === 'platform_fee'
                                            ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                                            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${processData.action === 'platform_fee' ? 'bg-white text-slate-900' : 'bg-slate-100'}`}>
                                            <ShieldAlert size={16} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-tight">3. Platform Fee</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={processData.amount}
                                    onChange={e => setProcessData({ ...processData, amount: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            {processData.action === 'emi' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Repayment ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={processData.target_id}
                                        onChange={e => setProcessData({ ...processData, target_id: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder="Specific Repayment ID"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">If blank, will pay oldest pending EMI.</p>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={20} />
                                    <span>Confirm Approval</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative z-10 animate-in zoom-in-95">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Reject Payment</h2>
                        <p className="text-slate-500 text-sm mb-6">This will mark the ticket as rejected.</p>

                        <form onSubmit={handleReject}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Reason</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none h-24 resize-none"
                                    placeholder="Why is it being rejected?"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRejectModalOpen(false)}
                                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'PENDING_VERIFICATION': 'bg-amber-100 text-amber-700',
        'AGENT_APPROVED': 'bg-purple-100 text-purple-700',
        'ADMIN_APPROVED': 'bg-emerald-100 text-emerald-700',
        'REJECTED': 'bg-rose-100 text-rose-700',
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
            {status.replace('_', ' ')}
        </span>
    );
}
