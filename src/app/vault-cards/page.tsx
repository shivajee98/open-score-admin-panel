'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { 
    Search, CreditCard, Clock, CheckCircle, XCircle, 
    MoreVertical, Eye, IndianRupee, ShieldCheck, 
    Filter, ChevronLeft, ChevronRight, Calendar,
    AlertCircle, Check, X, Camera, Save, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function VaultCardsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [activationFee, setActivationFee] = useState<number>(0);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [activationCharge, setActivationCharge] = useState('');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'CHARGE' | 'APPROVE_PAYMENT' | 'VIEW'>('VIEW');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [page, statusFilter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/admin/vault-cards?status=${statusFilter}&page=${page}&search=${searchQuery}`);
            // Assuming data is an array or paginated object
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                setRequests(data.data || []);
                setTotalPages(data.last_page || 1);
            }

            // Also fetch current activation fee
            const settings = await apiFetch('/admin/referral-settings');
            setActivationFee(settings.vault_card_activation_fee || 0);
        } catch (error) {
            console.error('Failed to load requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        try {
            const currentSettings = await apiFetch('/admin/referral-settings');
            await apiFetch('/admin/referral-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    ...currentSettings,
                    vault_card_activation_fee: Number(activationFee)
                })
            });
            toast.success('Configuration updated');
            setIsConfigModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update configuration');
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadRequests();
    };

    const handleAction = async (requestId: number, data: any) => {
        setIsProcessing(true);
        try {
            await apiFetch(`/admin/vault-cards/${requestId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            toast.success('Action successful');
            setIsActionModalOpen(false);
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (requestId: number, reason: string) => {
        if (!confirm('Are you sure you want to reject this request?')) return;
        setIsProcessing(true);
        try {
            await apiFetch(`/admin/vault-cards/${requestId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejection_reason: reason })
            });
            toast.success('Request rejected');
            setIsActionModalOpen(false);
            loadRequests();
        } catch (error: any) {
            toast.error(error.message || 'Rejection failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVATED': return 'bg-emerald-100 text-emerald-700';
            case 'PENDING_CHARGE': return 'bg-amber-100 text-amber-700';
            case 'PENDING_PAYMENT': return 'bg-blue-100 text-blue-700';
            case 'PENDING_APPROVAL': return 'bg-indigo-100 text-indigo-700';
            case 'REJECTED': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <AdminLayout title="Vault Card Management">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vault Card Management</h1>
                    <p className="text-slate-400 text-sm font-medium">Manage and configure card activation requests</p>
                </div>
                <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                    <Settings className="w-4 h-4" />
                    Configure Card
                </button>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pending Charge</p>
                            <h3 className="text-2xl font-black text-slate-900">{requests.filter(r => r.status === 'PENDING_CHARGE').length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pending Payments</p>
                            <h3 className="text-2xl font-black text-slate-900">{requests.filter(r => r.status === 'PENDING_APPROVAL').length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <BadgeCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Activated Cards</p>
                            <h3 className="text-2xl font-black text-slate-900">{requests.filter(r => r.status === 'ACTIVATED').length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Requests</p>
                            <h3 className="text-2xl font-black text-slate-900">{requests.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Agent Name or Mobile..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'PENDING_CHARGE', 'PENDING_PAYMENT', 'PENDING_APPROVAL', 'ACTIVATED', 'REJECTED'].map((stat) => (
                        <button
                            key={stat}
                            onClick={() => { setStatusFilter(stat); setPage(1); }}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                statusFilter === stat ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                        >
                            {stat.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Agent / Requested For</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Charge</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Date</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">No requests found matching filters</td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 pl-8">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-black text-slate-900">{req.agent_name}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    <span>Agent: {req.agent_mobile}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className="text-indigo-600">Customer: {req.customer_mobile}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                                                getStatusColor(req.status)
                                            )}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {req.activation_charge ? (
                                                <p className="text-sm font-black text-slate-900">₹{req.activation_charge}</p>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 italic">Not set</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-400">
                                            {new Date(req.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right pr-8">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === 'PENDING_CHARGE' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setActionType('CHARGE');
                                                            setActivationCharge('');
                                                            setIsActionModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-sm"
                                                    >
                                                        Set Charge
                                                    </button>
                                                )}
                                                {req.status === 'PENDING_APPROVAL' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setActionType('APPROVE_PAYMENT');
                                                            setIsActionModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
                                                    >
                                                        Review Pay
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActionType('VIEW');
                                                        setIsActionModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {isActionModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isProcessing && setIsActionModalOpen(false)} />
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <button onClick={() => setIsActionModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                {actionType === 'CHARGE' ? 'Set Activation Charge' : actionType === 'APPROVE_PAYMENT' ? 'Review Payment' : 'Request Registry'}
                            </h2>
                            <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mt-1">ID #{selectedRequest.id} • {selectedRequest.agent_name}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            {actionType === 'CHARGE' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Activation Fees (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                autoFocus
                                                value={activationCharge}
                                                onChange={(e) => setActivationCharge(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-lg transition-all"
                                                placeholder="Enter amount..."
                                            />
                                        </div>
                                        <p className="mt-4 text-[10px] text-slate-400 font-medium italic">Setting this charge will notify the agent and unlock the payment screen.</p>
                                    </div>
                                    <button
                                        onClick={() => handleAction(selectedRequest.id, { activation_charge: activationCharge })}
                                        disabled={!activationCharge || isProcessing}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save & Send Charge</>}
                                    </button>
                                </div>
                            )}

                            {actionType === 'APPROVE_PAYMENT' && (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Camera className="w-3 h-3" /> Payment Screenshot
                                        </p>
                                        <div className="rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-white aspect-[9/16] relative group">
                                            <img 
                                                src={`${process.env.NEXT_PUBLIC_API_URL || ''}/storage/${selectedRequest.payment_screenshot}`} 
                                                className="w-full h-full object-contain"
                                                alt="Payment Proof"
                                            />
                                            <a 
                                                href={`${process.env.NEXT_PUBLIC_API_URL || ''}/storage/${selectedRequest.payment_screenshot}`} 
                                                target="_blank" 
                                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                                            >
                                                <span className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Open Full Size</span>
                                            </a>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Enter rejection reason:');
                                                if (reason) handleReject(selectedRequest.id, reason);
                                            }}
                                            disabled={isProcessing}
                                            className="py-4 border-2 border-rose-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> REJECT
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedRequest.id, { action: 'approve' })}
                                            disabled={isProcessing}
                                            className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> APPROVE & PAY COMM
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                                        Approving will immediately record the activation and distribute commission to the hierarchy.
                                    </p>
                                </div>
                            )}

                            {actionType === 'VIEW' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-sm font-black text-slate-900">{selectedRequest.status.replace('_', ' ')}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Charge</p>
                                            <p className="text-sm font-black text-slate-900">₹{selectedRequest.activation_charge || 0}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Agent</p>
                                            <p className="text-sm font-black text-slate-900">{selectedRequest.agent_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 font-mono italic">{selectedRequest.agent_mobile}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                                            <p className="text-sm font-black text-indigo-600">{selectedRequest.customer_mobile}</p>
                                            <p className="text-[10px] font-bold text-slate-400">Created: {new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    {selectedRequest.status === 'REJECTED' && (
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                                            <p className="text-sm font-bold text-rose-700 italic">"{selectedRequest.rejection_reason}"</p>
                                        </div>
                                    )}

                                    {selectedRequest.payment_screenshot && (
                                        <div className="p-4 bg-slate-900 rounded-2xl">
                                            <button 
                                                onClick={() => {
                                                    setActionType('APPROVE_PAYMENT');
                                                }}
                                                className="w-full flex items-center justify-between text-white"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Camera className="w-5 h-5 text-blue-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">View Payment Screenshot</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-0">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSavingConfig && setIsConfigModalOpen(false)} />
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-slate-100 rounded-2xl">
                                    <Settings className="w-6 h-6 text-slate-900" />
                                </div>
                                <button onClick={() => setIsConfigModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Configure Activation Charge</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Set the default price for all card requests</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Default Activation Fee (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="number"
                                            autoFocus
                                            value={activationFee}
                                            onChange={(e) => setActivationFee(Number(e.target.value))}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-slate-900 font-black text-lg transition-all"
                                            placeholder="Enter amount..."
                                        />
                                    </div>
                                    <p className="mt-4 text-[10px] text-amber-600 font-black uppercase tracking-tight leading-relaxed">
                                        Warning: Changing this will affect all new card requests immediately.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSaveConfig}
                                    disabled={isSavingConfig}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                                >
                                    {isSavingConfig ? <Clock className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Configuration</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions used for stats */}
            <style jsx global>{`
                .BadgeCheck { width: 24px; height: 24px; }
            `}</style>
        </AdminLayout>
    );
}

// Sub-component to avoid clutter
function BadgeCheck({ className }: { className?: string }) {
    return <ShieldCheck className={className} />;
}
