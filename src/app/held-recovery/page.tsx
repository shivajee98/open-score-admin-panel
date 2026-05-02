'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Filter,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Wallet,
    RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function HeldRecoveryPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isConfirming, setIsConfirming] = useState<string | null>(null);

    const fetchHeldTransactions = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/funds/held');
            setTransactions(data);
        } catch (err) {
            toast.error("Failed to load held transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHeldTransactions();
    }, []);

    const handleConfirm = async (id: string) => {
        if (!confirm("Are you sure you want to release these funds to the user's wallet?")) return;
        
        setIsConfirming(id);
        try {
            await apiFetch(`/admin/funds/${id}/confirm-held`, {
                method: 'POST'
            });
            toast.success("Funds released successfully");
            fetchHeldTransactions();
        } catch (err: any) {
            toast.error(err.message || "Failed to confirm transaction");
        } finally {
            setIsConfirming(null);
        }
    };

    const filteredTransactions = transactions.filter(tx => 
        tx.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.user_mobile?.includes(searchQuery) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatIST = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatISTTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout title="Held Funds Recovery">
            <div className="p-6 md:p-10 bg-slate-50/50 min-h-screen font-sans">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Audit & Release funds held under process</p>
                        </div>
                        <button 
                            onClick={fetchHeldTransactions}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-50 transition-all"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            REFRESH
                        </button>
                    </div>

                    <div className="mb-8 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by user name, mobile, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold text-slate-600"
                        />
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason / Description</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Held Since</th>
                                        <th className="px-8 py-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading && transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
                                                Loading held transactions...
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs">
                                                No held transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((tx) => (
                                            <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                                                            {tx.user_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{tx.user_name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{tx.user_mobile}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-base font-black text-indigo-600">₹{tx.amount?.toLocaleString('en-IN')}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="max-w-xs">
                                                        <p className="text-xs font-bold text-slate-600">{tx.description}</p>
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase">Audit Correction</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[10px] font-black text-slate-900">{formatIST(tx.created_at)}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{formatISTTime(tx.created_at)}</p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => handleConfirm(tx.id)}
                                                        disabled={isConfirming === tx.id}
                                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isConfirming === tx.id ? 'Processing...' : 'Release Funds'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
