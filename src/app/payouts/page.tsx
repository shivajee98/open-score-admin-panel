'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    Landmark,
    User,
    MoreVertical,
    ArrowRight,
    Ban,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function PayoutsAdminPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedPayout, setSelectedPayout] = useState<any>(null);
    const [adminNote, setAdminNote] = useState('');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/payouts');
            setPayouts(data);
        } catch (err) {
            toast.error("Failed to load payouts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayouts();
    }, []);

    const handleAction = async (status: 'PAID' | 'REJECTED') => {
        if (!selectedPayout) return;

        try {
            const endpoint = status === 'PAID'
                ? `/admin/payouts/${selectedPayout.id}/approve`
                : `/admin/payouts/${selectedPayout.id}/reject`;

            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ admin_note: adminNote })
            });

            toast.success(`Payout ${status.toLowerCase()} successfully`);
            setIsActionModalOpen(false);
            setAdminNote('');
            setSelectedPayout(null);
            fetchPayouts();
        } catch (err: any) {
            toast.error(err.message || `Failed to ${status.toLowerCase()} payout`);
        }
    };

    const filteredPayouts = payouts.filter(p => {
        const matchesSearch =
            p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user?.mobile_number?.includes(searchQuery) ||
            p.bank_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="p-6 md:p-10 bg-slate-50/50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Payout Management</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Process and monitor withdrawal requests</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">
                                {payouts.filter(p => p.status === 'PENDING').length} PENDING
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, or bank..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold text-slate-600"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 appearance-none font-bold text-slate-600"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending Approval</option>
                            <option value="PAID">Already Paid</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User / Merchant</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Details</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested At</th>
                                    <th className="px-8 py-6 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
                                            Loading Payout Requests...
                                        </td>
                                    </tr>
                                ) : filteredPayouts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs">
                                            No payout requests found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayouts.map((payout) => (
                                        <tr key={payout.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                                                        {payout.user?.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{payout.user?.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{payout.user?.mobile_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-base font-black text-slate-900 italic">₹{payout.amount}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-900">
                                                        <Landmark className="w-3 h-3 text-slate-300" />
                                                        {payout.bank_name}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400">A/C: {payout.account_number}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">IFSC: {payout.ifsc_code}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wide ${getStatusStyle(payout.status)}`}>
                                                    {payout.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                    {payout.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                                                    {payout.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                    {payout.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-black text-slate-900">{new Date(payout.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{new Date(payout.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                {payout.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => { setSelectedPayout(payout); setIsActionModalOpen(true); }}
                                                        className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-90"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {isActionModalOpen && selectedPayout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsActionModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-100 overflow-hidden">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Process Payout</h2>
                        <p className="text-slate-500 font-bold mb-8 uppercase text-[10px] tracking-widest">Request Details</p>

                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-400 uppercase text-[10px]">User</span>
                                <span className="font-black text-slate-900">{selectedPayout.user?.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-400 uppercase text-[10px]">Amount</span>
                                <span className="text-lg font-black text-emerald-600">₹{selectedPayout.amount}</span>
                            </div>
                            <div className="h-px bg-slate-200"></div>
                            <div className="space-y-2">
                                <p className="font-bold text-slate-400 uppercase text-[10px]">Settlement Account</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400">Bank</p>
                                        <p className="text-xs font-black text-slate-900">{selectedPayout.bank_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400">A/C Number</p>
                                        <p className="text-xs font-black text-slate-900">{selectedPayout.account_number}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Admin Note (Internal)</label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add any details about payment reference or rejection reason..."
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all h-24"
                            ></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => handleAction('PAID')}
                                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-base hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95"
                            >
                                <CheckCircle2 className="w-5 h-5" /> Mark as Paid
                            </button>
                            <button
                                onClick={() => handleAction('REJECTED')}
                                className="flex-1 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-base hover:bg-rose-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <XCircle className="w-5 h-5" /> Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
