'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Banknote, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TeamTransfer {
    id: number;
    amount: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    created_at: string;
    description: string;
    wallet: {
        user: {
            id: number;
            name: string;
            mobile_number: string;
        }
    };
}

export default function TeamTransfersPage() {
    const [transfers, setTransfers] = useState<TeamTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadTransfers();
    }, []);

    const loadTransfers = async () => {
        try {
            const res = await apiFetch('/admin/team-transfers');
            // Support paginated or direct array response
            setTransfers(res?.data?.data || res?.data || []);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load transfers');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (transfer: TeamTransfer) => {
        if (!confirm('Are you sure you want to APPROVE this transfer? The amount will be credited to the user\'s wallet.')) return;

        setActionLoading(true);
        try {
            const res = await apiFetch(`/admin/team-transfers/${transfer.id}/approve`, {
                method: 'POST'
            });
            if (res.error) throw new Error(res.error);
            toast.success('Transfer Approved');
            loadTransfers();
        } catch (e: any) {
            toast.error(e.message || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (transfer: TeamTransfer) => {
        if (!confirm('Are you sure you want to REJECT this transfer request?')) return;

        setActionLoading(true);
        try {
            const res = await apiFetch(`/admin/team-transfers/${transfer.id}/reject`, {
                method: 'POST'
            });
            if (res.error) throw new Error(res.error);
            toast.success('Transfer Rejected');
            loadTransfers();
        } catch (e: any) {
            toast.error(e.message || 'Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
            COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            FAILED: 'bg-rose-100 text-rose-700 border-rose-200'
        };
        const activeStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
        return (
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${activeStyle}`}>
                {status}
            </span>
        );
    };

    return (
        <AdminLayout title="Team Earning Transfers">
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
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest pl-8">User</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transfers.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                                                        {t.wallet?.user?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{t.wallet?.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{t.wallet?.user?.mobile_number || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-lg font-black text-slate-900 tracking-tight">
                                                    ₹{parseFloat(t.amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <StatusBadge status={t.status} />
                                            </td>
                                            <td className="p-6 text-sm font-medium text-slate-500">
                                                {new Date(t.created_at).toLocaleDateString()}
                                                <span className="block text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {new Date(t.created_at).toLocaleTimeString()}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right pr-8">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReject(t)}
                                                        disabled={actionLoading}
                                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reject Transfer"
                                                    >
                                                        <XCircle size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(t)}
                                                        disabled={actionLoading}
                                                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Approve Transfer"
                                                    >
                                                        <CheckCircle size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {transfers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                                                No pending transfer requests found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
