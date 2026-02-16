import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { BadgeCheck, X, Calendar, CreditCard, User, AlertCircle, Clock, CheckCircle2, Eye, ShieldCheck, XCircle, Image as ImageIcon, ExternalLink, Shield } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';

interface LoanDetailModalProps {
    loanId: number;
    onClose: () => void;
    onUpdate: () => void;
}

export default function LoanDetailModal({ loanId, onClose, onUpdate }: LoanDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Manual Collection State
    const [collectingId, setCollectingId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    // Payment Proof Modal State
    const [viewingProof, setViewingProof] = useState<any>(null);

    // Reject Modal State
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadDetails();
    }, [loanId]);

    const getStorageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://api.msmeloan.sbs/storage/${path}`;
    };

    const loadDetails = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/loans/${loanId}/details`);
            if (res && res.loan) {
                setData(res);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to load details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleManualCollect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collectingId) return;

        setActionLoading(`collect-${collectingId}`);
        try {
            await apiFetch(`/admin/loans/repayments/${collectingId}/manual-collect`, {
                method: 'POST',
                body: JSON.stringify({ amount, notes })
            });
            alert('Collection recorded! Waiting for approval.');
            setCollectingId(null);
            setAmount('');
            setNotes('');
            loadDetails();
            onUpdate();
        } catch (e) {
            alert('Failed to record collection');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveCollection = async (repaymentId: number) => {
        if (!confirm('Approve this manual collection?')) return;

        setActionLoading(`approve-${repaymentId}`);
        try {
            await apiFetch(`/admin/loans/repayments/${repaymentId}/approve`, {
                method: 'POST'
            });
            alert('Collection approved!');
            loadDetails();
            onUpdate();
        } catch (e) {
            alert('Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveRepayment = async (repaymentId: number) => {
        if (!confirm('Approve this payment and mark EMI as PAID?')) return;

        setActionLoading(`approve-repayment-${repaymentId}`);
        try {
            await apiFetch(`/admin/repayments/${repaymentId}/approve`, {
                method: 'POST'
            });
            setViewingProof(null);
            loadDetails();
            onUpdate();
        } catch (e: any) {
            alert(e.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRepayment = async () => {
        if (!rejectingId || !rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setActionLoading(`reject-${rejectingId}`);
        try {
            await apiFetch(`/admin/repayments/${rejectingId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason: rejectReason })
            });
            setRejectingId(null);
            setRejectReason('');
            setViewingProof(null);
            loadDetails();
            onUpdate();
        } catch (e: any) {
            alert(e.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || !data) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
                    <p className="font-bold text-slate-500">Loading details...</p>
                </div>
            </div>
        );
    }

    const { loan, repayments } = data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-50 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto relative">

                {/* Header */}
                <div className="bg-white p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-black text-slate-900">{loan.user?.name}</h2>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">#{loan.display_id || loan.id}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                                <User size={16} className="text-blue-500" />
                                Approved by: <span className="text-slate-900 font-bold">{loan.approver?.name || 'System/Admin'}</span>
                            </div>
                            {loan.disbursed_at && (
                                <div className="flex items-center gap-1.5">
                                    <BadgeCheck size={16} className="text-emerald-500" />
                                    Disbursed: <span className="text-slate-900 font-bold">₹{parseFloat(loan.amount).toLocaleString()}</span> on {new Date(loan.disbursed_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Loan</p>
                            <p className="text-lg font-black text-slate-900">₹{parseFloat(loan.amount).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid Amount</p>
                            <p className="text-lg font-black text-emerald-600">₹{parseFloat(loan.paid_amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenure</p>
                            <p className="text-lg font-black text-slate-900">{loan.tenure} <span className="text-xs text-slate-400">{Number(loan.tenure) > 6 ? 'Days' : 'Months'}</span></p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-black uppercase ${loan.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>{loan.status}</span>
                        </div>
                    </div>

                    {/* EMI Table */}
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                Repayment Schedule
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 pl-6 w-16">#</th>
                                        <th className="p-4">Due Date</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right pr-6">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {repayments.map((emi: any, index: number) => (
                                        <tr key={emi.id} className={`transition-colors ${emi.status === 'PENDING_VERIFICATION' || emi.status === 'AGENT_APPROVED'
                                            ? 'bg-amber-50/40 hover:bg-amber-50/60'
                                            : 'hover:bg-blue-50/30'
                                            }`}>
                                            <td className="p-4 pl-6 font-mono text-slate-400">#{index + 1}</td>
                                            <td className="p-4 font-medium text-slate-900">
                                                {new Date(emi.due_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-black text-slate-900">
                                                    ₹{parseFloat(emi.amount).toLocaleString()}
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter" title="Principal">P: ₹{parseFloat(emi.principal_component || 0).toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter" title="Interest (Profit)">I: ₹{parseFloat(emi.interest_component || 0).toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter" title="Fees">F: ₹{parseFloat(emi.fee_component || 0).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {emi.status === 'PAID' ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                            <CheckCircle2 size={12} /> Paid
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                            {emi.payment_mode || 'ONLINE'}
                                                        </span>
                                                    </div>
                                                ) : emi.status === 'PENDING_VERIFICATION' ? (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 animate-pulse">
                                                        <Clock size={12} /> Awaiting Approval
                                                    </span>
                                                ) : emi.status === 'AGENT_APPROVED' ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                            <ShieldCheck size={12} /> Agent Approved
                                                        </span>
                                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                                            Needs Admin Final
                                                        </span>
                                                    </div>
                                                ) : emi.status === 'MANUAL_VERIFICATION' ? (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                        <Clock size={12} /> Verification
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                                                        Pending
                                                    </span>
                                                )}

                                                {/* Transaction ID */}
                                                {emi.transaction_id && (
                                                    <p className="text-[10px] text-slate-500 mt-1 font-mono" title={emi.transaction_id}>
                                                        TXN: {emi.transaction_id}
                                                    </p>
                                                )}

                                                {/* Verification Note */}
                                                {(emi.status === 'MANUAL_VERIFICATION' || (emi.status === 'PAID' && emi.payment_mode === 'MANUAL')) && emi.notes && (
                                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={emi.notes}>
                                                        Note: {emi.notes}
                                                    </p>
                                                )}

                                                {/* Admin rejection note */}
                                                {emi.admin_note && emi.status === 'PENDING' && (
                                                    <p className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate font-bold" title={emi.admin_note}>
                                                        ⚠ Rejected: {emi.admin_note}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex flex-col items-end gap-2">
                                                    {/* PENDING_VERIFICATION or AGENT_APPROVED — show View Proof + Approve + Reject */}
                                                    {(emi.status === 'PENDING_VERIFICATION' || emi.status === 'AGENT_APPROVED') && (
                                                        <div className="flex gap-2 flex-wrap justify-end">
                                                            {/* View Proof */}
                                                            {emi.proof_image && (
                                                                <button
                                                                    onClick={() => setViewingProof(emi)}
                                                                    className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100"
                                                                >
                                                                    <Eye size={12} /> View Proof
                                                                </button>
                                                            )}
                                                            {/* Approve */}
                                                            <button
                                                                onClick={() => handleApproveRepayment(emi.id)}
                                                                disabled={!!actionLoading}
                                                                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 size={12} /> {actionLoading === `approve-repayment-${emi.id}` ? '...' : 'Approve'}
                                                            </button>
                                                            {/* Reject */}
                                                            <button
                                                                onClick={() => { setRejectingId(emi.id); setRejectReason(''); }}
                                                                disabled={!!actionLoading}
                                                                className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50"
                                                            >
                                                                <XCircle size={12} /> Reject
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* PENDING — Collect Manual */}
                                                    {emi.status === 'PENDING' && (
                                                        collectingId === emi.id ? (
                                                            <div className="flex flex-col gap-2 min-w-[200px] bg-slate-50 p-3 rounded-xl border border-blue-100 shadow-lg relative z-10">
                                                                <p className="text-xs font-bold text-slate-900 text-left">Manual Collection</p>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Amount"
                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-bold"
                                                                    value={amount}
                                                                    onChange={e => setAmount(e.target.value)}
                                                                    autoFocus
                                                                />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ref/Notes (Optional)"
                                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                                                                    value={notes}
                                                                    onChange={e => setNotes(e.target.value)}
                                                                />
                                                                <div className="flex gap-2 mt-1">
                                                                    <button
                                                                        onClick={handleManualCollect}
                                                                        disabled={!amount || !!actionLoading}
                                                                        className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                                                    >
                                                                        {actionLoading ? '...' : 'Submit'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setCollectingId(null)}
                                                                        className="px-3 bg-slate-200 text-slate-600 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setCollectingId(emi.id);
                                                                    setAmount(emi.amount); // Default to full amount
                                                                    setNotes('');
                                                                }}
                                                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                            >
                                                                Collect Manual
                                                            </button>
                                                        )
                                                    )}

                                                    {emi.status === 'MANUAL_VERIFICATION' && (
                                                        <button
                                                            onClick={() => handleApproveCollection(emi.id)}
                                                            disabled={!!actionLoading}
                                                            className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-600 hover:shadow-emerald-500/20 transition-all"
                                                        >
                                                            {actionLoading === `approve-${emi.id}` ? '...' : 'Approve'}
                                                        </button>
                                                    )}

                                                    {/* Show proof thumbnail for PAID with proof */}
                                                    {emi.status === 'PAID' && emi.proof_image && (
                                                        <button
                                                            onClick={() => setViewingProof(emi)}
                                                            className="inline-flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors"
                                                        >
                                                            <Eye size={10} /> Receipt
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Payment Proof Viewer Modal ===== */}
            {viewingProof && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setViewingProof(null)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                        {/* Image Side */}
                        <div className="lg:w-2/3 bg-slate-900 flex items-center justify-center relative overflow-hidden p-6 min-h-[300px]">
                            {viewingProof.proof_image ? (
                                <div className="relative group">
                                    <img
                                        src={getStorageUrl(viewingProof.proof_image)}
                                        alt="Payment Proof"
                                        className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border-2 border-white/10"
                                    />
                                    <button
                                        onClick={() => window.open(getStorageUrl(viewingProof.proof_image), '_blank')}
                                        className="absolute top-3 right-3 p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ExternalLink size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center text-white/40">
                                    <ImageIcon size={64} className="mx-auto mb-4 opacity-30" />
                                    <p className="font-black uppercase tracking-widest text-sm">No Proof Uploaded</p>
                                </div>
                            )}
                        </div>

                        {/* Details Side */}
                        <div className="lg:w-1/3 flex flex-col p-6 lg:p-8 shrink-0 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Payment Proof</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        EMI #{repayments.findIndex((r: any) => r.id === viewingProof.id) + 1}
                                    </p>
                                </div>
                                <button onClick={() => setViewingProof(null)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all">
                                    <X size={18} className="text-slate-600" />
                                </button>
                            </div>

                            <div className="space-y-4 flex-1">
                                {/* Amount */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                    <p className="text-2xl font-black text-blue-600">₹{parseFloat(viewingProof.amount).toLocaleString()}</p>
                                </div>

                                {/* Transaction ID */}
                                {viewingProof.transaction_id && (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID (UTR)</p>
                                        <p className="text-sm font-mono font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded-md break-all inline-block">{viewingProof.transaction_id}</p>
                                    </div>
                                )}

                                {/* Due Date */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                    <p className="text-sm font-black text-slate-700">{new Date(viewingProof.due_date).toLocaleDateString()}</p>
                                </div>

                                {/* Status */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${viewingProof.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                        viewingProof.status === 'AGENT_APPROVED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {viewingProof.status === 'PENDING_VERIFICATION' ? 'Awaiting Approval' : viewingProof.status.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                {/* Notes */}
                                {viewingProof.notes && (
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Notes</p>
                                        <p className="text-xs font-medium text-amber-800">{viewingProof.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {(viewingProof.status === 'PENDING_VERIFICATION' || viewingProof.status === 'AGENT_APPROVED') && (
                                <div className="pt-6 space-y-2 mt-auto border-t border-slate-100">
                                    <button
                                        onClick={() => handleApproveRepayment(viewingProof.id)}
                                        disabled={!!actionLoading}
                                        className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <CheckCircle2 size={16} /> {actionLoading?.startsWith('approve') ? 'Approving...' : 'Approve Payment'}
                                    </button>
                                    <button
                                        onClick={() => { setRejectingId(viewingProof.id); setRejectReason(''); }}
                                        disabled={!!actionLoading}
                                        className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black hover:bg-rose-100 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-100 disabled:opacity-50"
                                    >
                                        <XCircle size={16} /> Reject Payment
                                    </button>
                                    <button
                                        onClick={() => setViewingProof(null)}
                                        className="w-full py-3 text-slate-400 rounded-2xl text-xs font-black hover:bg-slate-50 active:scale-[0.98] transition-all uppercase tracking-widest"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {viewingProof.status === 'PAID' && (
                                <div className="pt-6 mt-auto">
                                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                                        <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Payment Verified</p>
                                        {viewingProof.paid_at && (
                                            <p className="text-[10px] text-emerald-500 mt-1">
                                                {new Date(viewingProof.paid_at).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Reject Reason Modal ===== */}
            {rejectingId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setRejectingId(null)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                                <XCircle size={24} className="text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Reject Payment</h3>
                                <p className="text-xs text-slate-400 font-bold">Provide a reason for the customer</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Quick reasons */}
                            <div className="flex flex-wrap gap-2">
                                {['Invalid screenshot', 'Amount mismatch', 'Duplicate submission', 'Unreadable proof'].map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => setRejectReason(reason)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${rejectReason === reason
                                            ? 'bg-rose-600 text-white border-rose-600'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-200 hover:bg-rose-50'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none min-h-[100px] resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                className="flex-1 py-3.5 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectRepayment}
                                disabled={!rejectReason.trim() || !!actionLoading}
                                className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading?.startsWith('reject') ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
