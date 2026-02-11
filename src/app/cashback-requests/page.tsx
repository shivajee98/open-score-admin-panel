'use client';

import { useState, useEffect } from 'react';
import { BadgeCheck, Ban, Filter, Search, Eye, TrendingUp, Store } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface CashbackRequest {
    id: number;
    merchant_id: number;
    merchant: {
        name: string;
        business_name: string;
        mobile_number: string;
    };
    tier?: {
        tier_name: string;
    };
    cashback_amount: string;
    daily_turnover: string;
    cashback_date: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    notes?: string;
    created_at: string;
    approvedBy?: {
        name: string;
    };
}

export default function CashbackRequestsPage() {
    const [requests, setRequests] = useState<CashbackRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('PENDING');

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (statusFilter !== 'ALL') query.append('status', statusFilter);

            const res = await apiFetch(`/admin/cashback?${query.toString()}`);
            setRequests(res.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load cashback requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this cashback request? This will credit the merchant wallet immediately.')) return;

        try {
            await apiFetch(`/admin/cashback/${id}/approve`, { method: 'POST' });
            toast.success('Cashback Approved');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || 'Approval failed');
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Reason for rejection (optional):');
        if (reason === null) return; // Cancelled

        try {
            await apiFetch(`/admin/cashback/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ notes: reason })
            });
            toast.success('Cashback Rejected');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        }
    };

    return (
        <AdminLayout title="Cashback Requests">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cashback Requests</h1>
                        <p className="text-slate-500 font-medium">Review and approve daily merchant cashback</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === s
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No requests found</h3>
                            <p className="text-slate-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Merchant</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Turnover</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Cashback</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6 font-medium text-slate-500 text-sm">
                                                {new Date(req.cashback_date).toLocaleDateString()}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                                        <Store size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{req.merchant?.business_name || req.merchant?.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{req.merchant?.mobile_number}</p>
                                                    </div>
                                                </div>
                                                {req.tier && (
                                                    <span className="mt-1 inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                                        {req.tier.tier_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="font-bold text-slate-700">₹{parseFloat(req.daily_turnover).toLocaleString()}</p>
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="font-black text-emerald-600 text-lg">₹{parseFloat(req.cashback_amount).toLocaleString()}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {req.status === 'PENDING' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                            title="Reject"
                                                        >
                                                            <Ban size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                                        >
                                                            <BadgeCheck size={16} />
                                                            Approve
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
        </AdminLayout>
    );
}
