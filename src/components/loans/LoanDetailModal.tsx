import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { BadgeCheck, X, Calendar, CreditCard, User, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

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

    useEffect(() => {
        loadDetails();
    }, [loanId]);

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
                                        <tr key={emi.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 pl-6 font-mono text-slate-400">#{index + 1}</td>
                                            <td className="p-4 font-medium text-slate-900">
                                                {new Date(emi.due_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-black text-slate-900">
                                                ₹{parseFloat(emi.amount).toLocaleString()}
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
                                                ) : emi.status === 'MANUAL_VERIFICATION' ? (
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                        <Clock size={12} /> Verification
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                                                        Pending
                                                    </span>
                                                )}

                                                {/* Verification Note */}
                                                {(emi.status === 'MANUAL_VERIFICATION' || (emi.status === 'PAID' && emi.payment_mode === 'MANUAL')) && emi.notes && (
                                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={emi.notes}>
                                                        Note: {emi.notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
