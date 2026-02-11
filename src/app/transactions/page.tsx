'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowUpRight, ArrowDownLeft, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';

interface Transaction {
    id: number;
    amount: string;
    type: string;
    status: string;
    description: string;
    created_at: string;
    wallet: {
        id: number;
        user: {
            id: number;
            name: string;
            mobile_number: string;
            role: string;
        } | null;
    };
    source_type: string;
    // sourceWallet might be null if not loaded or not applicable
}

export default function GlobalTransactionsPage() {
    const { user, status } = useAuth();
    const router = useRouter();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchTransactions();
        }
    }, [status, page, debouncedSearch, typeFilter, statusFilter]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                per_page: '20',
                search: debouncedSearch,
                type: typeFilter,
                status: statusFilter
            });

            const res = await apiFetch(`/admin/transactions/all?${queryParams.toString()}`);
            if (res && res.data) {
                setTransactions(res.data);
                setTotalPages(res.last_page);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'FAILED': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'AGENT_APPROVED': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'CREDIT': return 'text-emerald-600';
            case 'DEBIT': return 'text-rose-600';
            default: return 'text-slate-600';
        }
    };

    return (
        <AdminLayout title="Global Transactions">
            <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Description, User Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                                className="bg-transparent border-none text-sm font-medium text-slate-600 focus:outline-none"
                            >
                                <option value="ALL">All Types</option>
                                <option value="CREDIT">Credit</option>
                                <option value="DEBIT">Debit</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                className="bg-transparent border-none text-sm font-medium text-slate-600 focus:outline-none"
                            >
                                <option value="ALL">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Transaction ID</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                                <p className="text-slate-500 font-medium">Loading transactions...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                                <p className="text-slate-500 font-medium">No transactions found matching your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-500">#{tx.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{tx.wallet?.user?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-slate-500">{tx.wallet?.user?.mobile_number}</span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{tx.wallet?.user?.role}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`flex items-center gap-1.5 font-bold ${getTypeColor(tx.type)}`}>
                                                    {tx.type === 'CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    {tx.type}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${getTypeColor(tx.type)}`}>
                                                {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={tx.description}>
                                                {tx.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(tx.status)}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                {formatDate(tx.created_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
