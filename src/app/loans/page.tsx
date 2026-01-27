
'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { BadgeCheck, Ban, Clock, ChevronRight, Calculator, IndianRupee } from 'lucide-react';

export default function LoanApprovals() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLoans = async () => {
        try {
            const data = await apiFetch('/admin/loans');
            setLoans(data);
        } catch (error) {
            console.error('Failed to load loans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLoans();
    }, []);

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this loan? Funds will be credited to user wallet.')) return;
        try {
            await apiFetch(`/admin/loans/${id}/approve`, { method: 'POST' });
            alert('Loan Approved!');
            loadLoans();
        } catch (e) {
            alert('Approval failed');
        }
    };

    return (
        <AdminLayout title="Loan Approvals">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Pending Loan Requests</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Review applicant details and approve disbursals.</p>
                    </div>
                    {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                </div>

                {loans.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BadgeCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No pending loans</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Applicant</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Terms</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan: any) => (
                                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                                                    {loan.user?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{loan.user?.name || 'Unknown User'}</p>
                                                    <p className="text-xs font-medium text-slate-500">ID: {loan.user_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <IndianRupee size={16} className="text-slate-400" />
                                                <span className="font-black text-slate-900 text-lg">
                                                    {parseFloat(loan.amount).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Clock size={12} />
                                                    {loan.tenure} Months
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                                    <Calculator size={12} />
                                                    {loan.payout_frequency}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-medium text-slate-500 text-sm">
                                            {new Date(loan.created_at).toLocaleDateString()}
                                            <br />
                                            <span className="text-xs text-slate-400">{new Date(loan.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => handleApprove(loan.id)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 active:scale-95"
                                            >
                                                <BadgeCheck className="w-4 h-4" />
                                                Approve Loan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
