'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Banknote, Users, CheckCircle, XCircle, Search, Upload, Clock, FileText, ChevronRight, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutRequest {
    id: number;
    sub_user_id: number;
    amount: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    bank_details: string;
    created_at: string;
    processed_at?: string;
    sub_user: {
        id: number;
        name: string;
        mobile_number: string;
        earnings_balance: string;
    };
    admin_message?: string;
    proof_image?: string;
}

export default function AgentPayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Action Form
    const [adminMessage, setAdminMessage] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);

    useEffect(() => {
        loadPayouts();
    }, []);

    const loadPayouts = async () => {
        try {
            const res = await apiFetch('/admin/sub-user-payouts');
            setPayouts(res.data || []);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load payouts');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedPayout) return;
        if (!adminMessage) {
            toast.error('Please enter a message or transaction reference');
            return;
        }

        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('admin_message', adminMessage);
            if (proofFile) {
                formData.append('proof_image', proofFile);
            }

            // Since apiFetch is JSON biased, let's use fetch directly for FormData or configure apiFetch
            // apiFetch handles Authorization, let's construct it manually for FormData
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api'}/admin/sub-user-payouts/${selectedPayout.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Failed to approve');

            toast.success('Payout Approved');
            setSelectedPayout(null);
            setAdminMessage('');
            setProofFile(null);
            loadPayouts();
        } catch (e: any) {
            toast.error(e.message || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPayout) return;
        if (!adminMessage) {
            toast.error('Please enter a rejection reason');
            return;
        }

        if (!confirm('Are you sure you want to REJECT this request? Funds will be refunded to agent earnings.')) return;

        setActionLoading(true);
        try {
            await apiFetch(`/admin/sub-user-payouts/${selectedPayout.id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ admin_message: adminMessage })
            });

            toast.success('Payout Rejected');
            setSelectedPayout(null);
            setAdminMessage('');
            loadPayouts();
        } catch (e: any) {
            toast.error(e.message || 'Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
            APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            REJECTED: 'bg-rose-100 text-rose-700 border-rose-200'
        };
        return (
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[status as keyof typeof styles]}`}>
                {status}
            </span>
        );
    };

    return (
        <AdminLayout title="Agent Cashouts">
            <div className="space-y-6">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest pl-8">Agent</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payouts.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                                                        {p.sub_user.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{p.sub_user.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{p.sub_user.mobile_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-lg font-black text-slate-900 tracking-tight">
                                                    ₹{parseFloat(p.amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <StatusBadge status={p.status} />
                                            </td>
                                            <td className="p-6 text-sm font-medium text-slate-500">
                                                {new Date(p.created_at).toLocaleDateString()}
                                                <span className="block text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {new Date(p.created_at).toLocaleTimeString()}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right pr-8">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPayout(p);
                                                        setAdminMessage(p.admin_message || '');
                                                    }}
                                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {payouts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                                                No cashout requests found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedPayout && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex bg-slate-50 border-b border-slate-100">
                            <div className="flex-1 p-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    Agent Cashout Request
                                    <span className="text-sm font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">#{selectedPayout.id}</span>
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedPayout(null)}
                                className="px-6 hover:bg-rose-50 hover:text-rose-600 transition-colors border-l border-slate-100"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Agent Info & Amount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Requesting Agent</p>
                                    <p className="font-bold text-slate-900 text-lg">{selectedPayout.sub_user.name}</p>
                                    <p className="text-sm text-slate-500 font-medium">{selectedPayout.sub_user.mobile_number}</p>
                                    <div className="mt-3 pt-3 border-t border-indigo-100 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Earnings Balance</span>
                                            <span className="font-black text-slate-900">₹{parseFloat(selectedPayout.sub_user.earnings_balance).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="text-center pt-1">
                                            <a href={`/sub-users/${selectedPayout.sub_user_id}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline flex items-center justify-center gap-1">
                                                View Full Profile <ChevronRight size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Requested Amount</p>
                                    <p className="font-black text-4xl text-emerald-700 tracking-tighter">
                                        ₹{parseFloat(selectedPayout.amount).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Banknote size={14} /> Bank / UPI Details
                                </p>
                                <div className="font-mono text-sm bg-white p-3 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap">
                                    {selectedPayout.bank_details}
                                </div>
                            </div>

                            {/* Admin Action Section */}
                            {selectedPayout.status === 'PENDING' ? (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 mb-2">Message / Transaction Details</label>
                                        <textarea
                                            value={adminMessage}
                                            onChange={(e) => setAdminMessage(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                            placeholder="Enter transaction reference ID or rejection reason..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-700 mb-2">Upload Proof (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors border border-slate-200 text-sm font-bold text-slate-600">
                                                <Upload size={16} />
                                                Choose Image
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                                            </label>
                                            {proofFile && (
                                                <span className="text-xs font-medium text-slate-600 truncate max-w-[200px] bg-blue-50 px-2 py-1 rounded-lg text-blue-600 border border-blue-100">
                                                    {proofFile.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-slate-900">Status:</span>
                                        <StatusBadge status={selectedPayout.status} />
                                    </div>
                                    {selectedPayout.admin_message && (
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Admin Message</span>
                                            <p className="text-sm bg-white p-2 rounded-lg border border-slate-200 text-slate-700">{selectedPayout.admin_message}</p>
                                        </div>
                                    )}
                                    {selectedPayout.proof_image && (
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Proof of Payment</span>
                                            <a href={selectedPayout.proof_image} target="_blank" rel="noreferrer" className="inline-block border border-slate-200 rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                                                <img src={selectedPayout.proof_image} alt="Proof" className="h-20 w-auto object-cover" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedPayout.status === 'PENDING' && (
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="px-6 py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                                >
                                    Reject Request
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {actionLoading ? 'Processing...' : (
                                        <>
                                            <CheckCircle size={18} /> Approve & Send
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
