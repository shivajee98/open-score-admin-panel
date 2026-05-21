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
    Landmark,
    ArrowRight,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    ArrowRightLeft,
    ChevronDown,
    ChevronUp,
    Download,
    Pencil,
    Check,
    X,
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function PayoutsAdminPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [selectedPayout, setSelectedPayout] = useState<any>(null);
    const [adminNote, setAdminNote] = useState('');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [draftNote, setDraftNote] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

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

    const handleAction = async (status: 'PAID' | 'REJECTED' | 'WAITING') => {
        if (!selectedPayout) return;

        try {
            let endpoint: string;

            if (selectedPayout.type === 'BANK_TRANSFER') {
                if (status === 'WAITING') {
                    endpoint = `/admin/bank-transfers/${selectedPayout.batch_id}/waiting`;
                } else {
                    endpoint = status === 'PAID'
                        ? `/admin/bank-transfers/${selectedPayout.batch_id}/approve`
                        : `/admin/bank-transfers/${selectedPayout.batch_id}/reject`;
                }
            } else {
                if (status === 'WAITING') {
                    endpoint = `/admin/payouts/${selectedPayout.id}/waiting`;
                } else {
                    endpoint = status === 'PAID'
                        ? `/admin/payouts/${selectedPayout.id}/approve`
                        : `/admin/payouts/${selectedPayout.id}/reject`;
                }
            }

            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ admin_note: adminNote })
            });

            const actionLabel = status === 'PAID' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'set to waiting';
            toast.success(`${selectedPayout.type === 'BANK_TRANSFER' ? 'Batch' : 'Payout'} ${actionLabel} successfully`);
            setIsActionModalOpen(false);
            setAdminNote('');
            setSelectedPayout(null);
            fetchPayouts();
        } catch (err: any) {
            toast.error(err.message || `Failed to process`);
        }
    };

    const handleUpdateNote = async (payoutId: number) => {
        setNoteLoading(true);
        try {
            await apiFetch(`/admin/payouts/${payoutId}/update-note`, {
                method: 'POST',
                body: JSON.stringify({ admin_note: draftNote }),
            });
            toast.success('Remark updated');
            setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, admin_note: draftNote } : p));
            setEditingNoteId(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to update remark');
        } finally {
            setNoteLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('query', searchQuery);
            if (statusFilter !== 'ALL') params.append('status', statusFilter);
            if (typeFilter !== 'ALL') params.append('type', typeFilter);

            const blob = await apiFetch(`/admin/payouts/export?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payouts_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Export started");
        } catch (err) {
            toast.error("Export failed");
        }
    };

    const filteredPayouts = payouts.filter(p => {
        const matchesSearch =
            p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user?.mobile_number?.includes(searchQuery) ||
            p.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.batch_id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter || (typeFilter === 'VAULT' && p.source === 'VAULT');

        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
    const paginatedPayouts = filteredPayouts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID':
            case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'WAITING': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';

        }
    };

    const formatIST = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatISTTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout title="Payout Management">
            <div className="p-6 md:p-10 bg-slate-50/50 min-h-screen font-sans">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Process and monitor withdrawal &amp; transfer requests</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">
                                    {payouts.filter(p => p.status === 'PENDING').length} PENDING
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    EXPORT AS EXCEL
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, mobile, bank, or batch ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold text-slate-600"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 appearance-none font-bold text-slate-600 cursor-pointer"
                            >
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="WAITING">Waiting</option>
                                <option value="PAID">Paid</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>

                            </select>
                        </div>

                        <div className="relative">
                            <ArrowRightLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 appearance-none font-bold text-slate-600 cursor-pointer"
                            >
                                <option value="ALL">All Types</option>
                                <option value="WITHDRAWAL">Withdrawals</option>
                                <option value="VAULT">Vault Withdrawals</option>
                                <option value="BANK_TRANSFER">Bank Transfers</option>
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-transparent border-none text-sm font-black text-slate-900 outline-none cursor-pointer"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={60}>60</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
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
                                            <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
                                                Loading Payout Requests...
                                            </td>
                                        </tr>
                                    ) : filteredPayouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs">
                                                No payout requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPayouts.map((payout) => (
                                            <>
                                                <tr key={payout.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wide ${payout.type === 'BANK_TRANSFER'
                                                            ? 'bg-violet-50 text-violet-600 border border-violet-100'
                                                            : payout.source === 'VAULT'
                                                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                                                            }`}>
                                                            {payout.type === 'BANK_TRANSFER' ? (
                                                                <><ArrowRightLeft className="w-3 h-3" /> Bulk Pay</>
                                                            ) : payout.source === 'VAULT' ? (
                                                                <><Landmark className="w-3 h-3" /> Vault</>
                                                            ) : (
                                                                <><Landmark className="w-3 h-3" /> Withdrawal</>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                                                                {payout.user?.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <p className="text-sm font-black text-slate-900">{payout.user?.name}</p>
                                                                    {payout.user?.role && (
                                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${payout.user.role === 'MERCHANT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                            payout.user.role === 'STUDENT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                            }`}>
                                                                            {payout.user.role}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400">{payout.user?.mobile_number}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-black text-slate-900 italic">₹{(payout.net_amount || payout.amount)?.toLocaleString('en-IN')}</span>
                                                                {payout.charge_amount > 0 && (
                                                                    <span className="text-[10px] font-bold text-rose-500 whitespace-nowrap">(-₹{payout.charge_amount})</span>
                                                                )}
                                                            </div>
                                                            {payout.charge_amount > 0 && (
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Gross: ₹{payout.amount?.toLocaleString('en-IN')}</p>
                                                            )}
                                                            {payout.type === 'BANK_TRANSFER' && payout.recipient_count && (
                                                                <span className="text-[9px] font-black text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full inline-block">
                                                                    {payout.recipient_count} recipients
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        {payout.type === 'BANK_TRANSFER' ? (
                                                            <button
                                                                onClick={() => setExpandedBatch(expandedBatch === payout.batch_id ? null : payout.batch_id)}
                                                                className="flex items-center gap-1 text-[10px] font-black text-violet-600 hover:text-violet-800 transition-colors"
                                                            >
                                                                {expandedBatch === payout.batch_id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                View {payout.recipient_count} recipients
                                                            </button>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-900">
                                                                    <Landmark className="w-3 h-3 text-slate-300" />
                                                                    {payout.bank_name}
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400">A/C: {payout.account_number}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">IFSC: {payout.ifsc_code}</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1.5">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wide ${getStatusStyle(payout.status)}`}>
                                                                {payout.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                                {(payout.status === 'PAID' || payout.status === 'APPROVED') && <CheckCircle2 className="w-3 h-3" />}
                                                                {payout.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                                {payout.status}
                                                            </div>
                                                            {payout.admin_note && editingNoteId !== payout.id && (
                                                                <p className="text-[9px] font-bold text-slate-400 max-w-[160px] truncate" title={payout.admin_note}>
                                                                    📝 {payout.admin_note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-[10px] font-black text-slate-900">{formatIST(payout.created_at)}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{formatISTTime(payout.created_at)}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {(payout.status === 'PENDING' || payout.status === 'WAITING') && (
                                                                <button
                                                                    onClick={() => { setSelectedPayout(payout); setIsActionModalOpen(true); }}
                                                                    className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-90"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {payout.type !== 'BANK_TRANSFER' && (
                                                                <button
                                                                    onClick={() => { setEditingNoteId(payout.id); setDraftNote(payout.admin_note || ''); }}
                                                                    className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all active:scale-90"
                                                                    title="Edit remark"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Inline Note Editor */}
                                                {editingNoteId === payout.id && (
                                                    <tr key={`${payout.id}-note-edit`}>
                                                        <td colSpan={7} className="px-8 pb-5 bg-amber-50/40">
                                                            <div className="flex items-start gap-3">
                                                                <textarea
                                                                    autoFocus
                                                                    rows={2}
                                                                    value={draftNote}
                                                                    onChange={(e) => setDraftNote(e.target.value)}
                                                                    placeholder="Add or update admin remark..."
                                                                    className="flex-1 p-3 bg-white border-2 border-amber-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-400 transition-all resize-none"
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateNote(payout.id)}
                                                                    disabled={noteLoading}
                                                                    className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-90 disabled:opacity-60"
                                                                    title="Save remark"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingNoteId(null)}
                                                                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all active:scale-90"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                {/* Expanded recipients for bank transfers */}
                                                {payout.type === 'BANK_TRANSFER' && expandedBatch === payout.batch_id && payout.recipients && (
                                                    <tr key={`${payout.id}-detail`}>
                                                        <td colSpan={7} className="px-8 py-4 bg-violet-50/30">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {payout.recipients.map((r: any, i: number) => (
                                                                    <div key={i} className="bg-white rounded-xl p-4 border border-violet-100 space-y-1">
                                                                        <p className="text-xs font-black text-slate-900">{r.recipient_name}</p>
                                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                                            <Landmark className="w-3 h-3" /> {r.bank_name}
                                                                        </div>
                                                                        <p className="text-[10px] font-bold text-slate-400 font-mono">A/C: {r.account_number}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400 font-mono">IFSC: {r.ifsc_code}</p>
                                                                        <p className="text-sm font-black text-emerald-600 mt-1">₹{r.amount?.toLocaleString('en-IN')}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Modal */}
                {isActionModalOpen && selectedPayout && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsActionModalOpen(false)}></div>
                        <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                {selectedPayout.type === 'BANK_TRANSFER' ? 'Process Bulk Transfer' : 'Process Payout'}
                            </h2>
                            <p className="text-slate-500 font-bold mb-8 uppercase text-[10px] tracking-widest">
                                {selectedPayout.type === 'BANK_TRANSFER' ? `Batch: ${selectedPayout.batch_id}` : 'Request Details'}
                            </p>

                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-400 uppercase text-[10px]">User</span>
                                    <span className="font-black text-slate-900">{selectedPayout.user?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                    <span className="font-bold text-slate-400 uppercase text-[10px]">Gross Amount</span>
                                    <span className={`font-black ${selectedPayout.charge_amount > 0 ? 'text-slate-400 line-through' : 'text-slate-900'}`}>₹{selectedPayout.amount?.toLocaleString('en-IN')}</span>
                                </div>
                                {selectedPayout.charge_amount > 0 && (
                                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                                        <span className="font-bold text-slate-400 uppercase text-[10px]">System Charges ({((selectedPayout.charge_amount / selectedPayout.amount) * 100).toFixed(1)}%)</span>
                                        <span className="font-black text-rose-600">-₹{selectedPayout.charge_amount?.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="font-bold text-slate-400 uppercase text-[10px]">Net Payable (Admin Pays)</span>
                                    <span className="text-xl font-black text-emerald-600">₹{(selectedPayout.net_amount || selectedPayout.amount)?.toLocaleString('en-IN')}</span>
                                </div>

                                {selectedPayout.type === 'BANK_TRANSFER' && selectedPayout.recipients && (
                                    <>
                                        <div className="h-px bg-slate-200"></div>
                                        <p className="font-bold text-slate-400 uppercase text-[10px]">Recipients ({selectedPayout.recipient_count})</p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {selectedPayout.recipients.map((r: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-white rounded-xl p-3">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900">{r.recipient_name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400">{r.bank_name} • {r.account_number}</p>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600">₹{r.amount?.toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {selectedPayout.type === 'WITHDRAWAL' && (
                                    <>
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
                                    </>
                                )}
                            </div>

                            <div className="mb-8">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block italic">Waiting Duration Presets</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[
                                        { label: '2 Hours', text: 'Bank server is experiencing a delay. Funds will be sent within 2 hours.' },
                                        { label: '6 Hours', text: 'Verification in progress. Expect settlement within 6 hours.' },
                                        { label: '24 Hours', text: 'Manual verification required. Will be processed within 24 hours.' },
                                        { label: '48 Hours', text: 'Delayed due to bank holidays. Will be processed within 48 hours.' },
                                        { label: 'System Issue', text: 'Technical glitch at nodal bank. We are resolving this. Funds safe.' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setAdminNote(preset.text)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase transition-all"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Admin Note (visible to user)</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add any details about payment reference, waiting duration or rejection reason..."
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all h-24"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleAction('PAID')}
                                    className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> {selectedPayout.type === 'BANK_TRANSFER' ? 'Approve' : 'Paid'}
                                </button>
                                <button
                                    onClick={() => handleAction('WAITING')}
                                    className="py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95"
                                >
                                    <Clock className="w-4 h-4" /> Wait
                                </button>
                                <button
                                    onClick={() => handleAction('REJECTED')}
                                    className="py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
