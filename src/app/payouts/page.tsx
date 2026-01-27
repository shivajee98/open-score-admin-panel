'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadPayouts = async () => {
        try {
            const data = await apiFetch('/payouts');
            setPayouts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayouts();
    }, []);

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this payout?')) return;
        try {
            const res = await apiFetch(`/payouts/${id}/approve`, { method: 'POST' });
            if (res.ok) {
                toast.success('Payout Approved');
                loadPayouts();
            } else {
                toast.error('Failed to approve payout');
            }
        } catch (e: any) {
            toast.error(e.message || 'Error approving payout');
        }
    };

    return (
        <AdminLayout title="Payout Requests">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900">Withdrawal Requests</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage merchant Payouts.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-8">Merchant</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Bank Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payouts.map((payout: any) => (
                                <tr key={payout.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-6 pl-8">
                                        <p className="font-bold text-slate-900">{payout.merchant_name || 'Unknown'}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className="font-mono font-bold text-slate-700">₹{parseFloat(payout.amount).toLocaleString('en-IN')}</span>
                                    </td>
                                    <td className="p-6 text-sm">
                                        <p><span className="font-bold text-slate-500">Acct:</span> {payout.account_number}</p>
                                        <p><span className="font-bold text-slate-500">IFSC:</span> {payout.ifsc_code}</p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${payout.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {payout.status === 'COMPLETED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {payout.status}
                                        </span>
                                    </td>
                                    <td className="p-6 pr-8 text-right">
                                        {payout.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleApprove(payout.id)}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm"
                                            >
                                                Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {payouts.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">No payout requests found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
