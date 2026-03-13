'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Banknote, Users, CheckCircle, XCircle, Settings, X, Search, Trash2 } from 'lucide-react';
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

    // Approval Modal State
    const [approveModal, setApproveModal] = useState<{ isOpen: boolean, transfer: TeamTransfer | null }>({ isOpen: false, transfer: null });
    const [approvedAmount, setApprovedAmount] = useState<string>('');

    // Rules Modal State
    const [rulesModal, setRulesModal] = useState(false);
    const [applyToAll, setApplyToAll] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [intervalDays, setIntervalDays] = useState('0');
    const [intervalHours, setIntervalHours] = useState('0');
    const [minAmount, setMinAmount] = useState('0');
    const [autoApprovalMode, setAutoApprovalMode] = useState('MANUAL');
    const [autoApprovalLimit, setAutoApprovalLimit] = useState('0');
    const [autoApprovalPercentage, setAutoApprovalPercentage] = useState('0');
    const [isVendorConfig, setIsVendorConfig] = useState(false);

    // New Selection States (Loan Plan Style)
    const [targetableUsers, setTargetableUsers] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [userFilters, setUserFilters] = useState({
        search: '',
        min_loan_completed: '',
        min_loans_count: ''
    });

    const [ruleHistory, setRuleHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        loadTransfers();
        loadRuleHistory();
    }, []);

    const loadRuleHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await apiFetch('/admin/team-transfers/rule-history');
            setRuleHistory(res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadTransfers = async () => {
        try {
            const res = await apiFetch('/admin/team-transfers');
            setTransfers(res?.data?.data || res?.data || []);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load transfers');
        } finally {
            setLoading(false);
        }
    };

    const loadSettingsData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/team-transfers/recent');
            setTransfers(res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditRule = (log: any) => {
        let details = log.details;
        if (typeof details === 'string') {
            try { details = JSON.parse(details); } catch (e) { details = null; }
        }

        if (details) {
            setIsVendorConfig(details.target_type === 'VENDOR');
            setApplyToAll(details.user_ids === 'ALL');
            if (Array.isArray(details.user_ids)) {
                setSelectedUsers(details.user_ids);
            } else {
                setSelectedUsers([]);
            }
            setIntervalDays(String(details.interval_days || '0'));
            setIntervalHours(String(details.interval_hours || '0'));
            setMinAmount(String(details.min_amount || '0'));
            setAutoApprovalMode(details.auto_approval_mode || 'MANUAL');
            setAutoApprovalLimit(String(details.auto_approval_limit || '0'));
            setAutoApprovalPercentage(String(details.auto_approval_percentage || '0'));
            
            setRulesModal(true);
            toast.info('Rule configuration loaded. You can now adjust and deploy.');
        } else if (log.description) {
            // Fallback: Parse from description string
            const desc = log.description;
            const daysMatch = desc.match(/(\d+)d/);
            const hoursMatch = desc.match(/(\d+)h/);
            const minAmountMatch = desc.match(/Min ₹([\d\.]+)/);
            const modeMatch = desc.match(/Mode: (\w+)/);

            setIntervalDays(daysMatch ? daysMatch[1] : '0');
            setIntervalHours(hoursMatch ? hoursMatch[1] : '0');
            setMinAmount(minAmountMatch ? minAmountMatch[1] : '0');
            setAutoApprovalMode(modeMatch ? modeMatch[1] : 'MANUAL');
            
            setApplyToAll(true); 
            setRulesModal(true);
            toast.success('Partially recovered configuration from legacy log description.');
        } else {
            toast.error('Could not recover configuration for this log entry.');
        }
    };

    const handleDeleteHistory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule history? This action cannot be undone.')) return;
        
        setActionLoading(true);
        try {
            const res = await apiFetch(`/admin/team-transfers/rule-history/${id}`, { method: 'DELETE' });
            if (res.error) throw new Error(res.error);
            toast.success('Rule history deleted.');
            loadRuleHistory();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete history');
        } finally {
            setActionLoading(true);
        }
    };

    const handleApproveFormSubmit = async (e: React.FormEvent) => {
         e.preventDefault();
         if (!approveModal.transfer) return;

         setActionLoading(true);
         try {
             const res = await apiFetch(`/admin/team-transfers/${approveModal.transfer.id}/approve`, {
                 method: 'POST',
                 body: JSON.stringify({ approved_amount: approvedAmount })
             });
             if (res.error) throw new Error(res.error);
             toast.success('Transfer Approved');
             setApproveModal({ isOpen: false, transfer: null });
             loadTransfers();
         } catch (e: any) {
             toast.error(e.message || 'Approval failed');
         } finally {
             setActionLoading(false);
         }
    };

    const openApproveModal = (transfer: TeamTransfer) => {
        setApprovedAmount(transfer.amount);
        setApproveModal({ isOpen: true, transfer });
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

    const fetchTargetableUsers = async () => {
        setSearching(true);
        try {
            const endpoint = isVendorConfig ? '/admin/sub-users' : '/admin/users/targetable?linked_only=1';
            const res = await apiFetch(endpoint);
            setTargetableUsers(res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (rulesModal) {
            fetchTargetableUsers();
        }
    }, [rulesModal, isVendorConfig]);


    const filteredUsersList = targetableUsers.filter(user => {
        const matchesSearch = !userFilters.search || 
            user.name?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
            user.mobile_number?.includes(userFilters.search) ||
            user.mobile?.includes(userFilters.search);
        
        return matchesSearch;
    });

    const toggleUser = (id: number) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(uid => uid !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    const selectAllFiltered = () => {
        const allIds = filteredUsersList.map(u => u.id);
        const newSelected = Array.from(new Set([...selectedUsers, ...allIds]));
        setSelectedUsers(newSelected);
    };

    const deselectAllFiltered = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        setSelectedUsers(selectedUsers.filter(id => !filteredIds.includes(id)));
    };

    const handleSaveRules = async () => {
        setActionLoading(true);
        try {
            const userIds = applyToAll ? 'ALL' : selectedUsers;
            if (!applyToAll && userIds.length === 0) {
                throw new Error("Please select at least one user.");
            }

            const res = await apiFetch('/admin/team-transfers/rules', {
                method: 'POST',
                body: JSON.stringify({
                    user_ids: userIds,
                    target_type: isVendorConfig ? 'VENDOR' : 'WORKER',
                    interval_days: parseInt(intervalDays || '0'),
                    interval_hours: parseInt(intervalHours || '0'),
                    min_amount: parseFloat(minAmount || '0'),
                    auto_approval_mode: autoApprovalMode,
                    auto_approval_limit: parseFloat(autoApprovalLimit || '0'),
                    auto_approval_percentage: parseFloat(autoApprovalPercentage || '0')
                })
            });
            if (res.error) throw new Error(res.error);
            toast.success('Transfer Rules Updated Successfully.');
            setRulesModal(false);
            setSelectedUsers([]);
            setUserFilters({ ...userFilters, search: '' });
            loadRuleHistory();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update rules');
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
        <AdminLayout title="Team Transfers">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Transfers</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage worker payouts and withdrawal rules</p>
                    </div>
                    <div className="flex gap-3">
                         <button
                            onClick={() => {
                                setIsVendorConfig(false);
                                setRulesModal(true);
                            }}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                         >
                             <Users size={18} /> Configure Workers
                         </button>
                         <button
                            onClick={() => {
                                setIsVendorConfig(true);
                                setRulesModal(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                         >
                             <Settings size={18} /> Configure Vendors
                         </button>
                    </div>
                </div>

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
                                                        onClick={() => openApproveModal(t)}
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

                {/* Rule History Section */}
                <div className="mt-12 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Deployed Rules History</h3>
                            <p className="text-sm text-slate-500 font-medium">Click on any card to re-apply or edit the configuration</p>
                        </div>
                    </div>

                    {loadingHistory ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-44" />
                            ))}
                        </div>
                    ) : ruleHistory.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
                             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Settings size={32} />
                             </div>
                             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No implementation history found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ruleHistory.map((log) => (
                                <div 
                                    key={log.id} 
                                    className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100/50 transition-colors" />
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleDeleteHistory(log.id)}
                                                    className="p-2 bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                                                    title="Delete History"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-white group-hover:scale-110 transition-all border border-transparent group-hover:border-slate-100">
                                                    <Settings size={16} className="text-slate-400 group-hover:text-indigo-600" />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6 line-clamp-3">
                                            {log.description}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => handleEditRule(log)}
                                        className="w-full py-3 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                                    >
                                        Edit Configuration
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Approval Modal */}
            {approveModal.isOpen && approveModal.transfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900">Approve Transfer</h3>
                            <button onClick={() => setApproveModal({ isOpen: false, transfer: null })} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleApproveFormSubmit} className="p-6 space-y-6">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Requested By</span>
                                <span className="font-bold text-slate-900">{approveModal.transfer.wallet?.user?.name || 'Unknown'}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Requested Amount = ₹{approveModal.transfer.amount}</label>
                                <label className="block text-xs font-medium text-slate-500 mb-2">You can optionally approve a partial amount. The remaining will drop back to their available pool.</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={approveModal.transfer.amount}
                                        step="0.01"
                                        value={approvedAmount}
                                        onChange={(e) => setApprovedAmount(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                <CheckCircle size={20} />
                                {actionLoading ? 'Processing...' : 'Confirm Approval'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Rules Configuration Modal */}
            {rulesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="shrink-0 relative z-10">
                                <h2 className="text-2xl font-black tracking-tight">{isVendorConfig ? 'Configure Vendors' : 'Configure Workers'}</h2>
                                <p className="text-indigo-100 text-xs font-medium uppercase tracking-widest mt-1">Transfer Withdrawal Rules</p>
                            </div>
                            <button onClick={() => setRulesModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors relative z-10">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={applyToAll}
                                            onChange={(e) => setApplyToAll(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-6 h-6 rounded-lg border-2 border-slate-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center">
                                            <CheckCircle size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-sm text-slate-900 block">Apply to ALL {isVendorConfig ? 'Vendors' : 'Workers'}</span>
                                        <span className="text-xs text-slate-500">Applies rule to everyone active. Leave unchecked to target specific users.</span>
                                    </div>
                                </label>

                                {!applyToAll && (
                                    <div className="mt-4 space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search user by name or mobile..."
                                                value={userFilters.search}
                                                onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">
                                                        {filteredUsersList.length} Found
                                                    </span>
                                                    <span className="text-[10px] font-bold text-indigo-600">
                                                        {selectedUsers.length} Selected
                                                    </span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={selectAllFiltered}
                                                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={deselectAllFiltered}
                                                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl bg-white/50 space-y-1 p-1">
                                                {searching ? (
                                                    <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Fetching...</div>
                                                ) : filteredUsersList.length > 0 ? (
                                                    filteredUsersList.map(user => (
                                                        <div
                                                            key={user.id}
                                                            onClick={() => toggleUser(user.id)}
                                                            className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition-all ${selectedUsers.includes(user.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${selectedUsers.includes(user.id) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                    {user.name?.[0] || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                                                    <p className="text-[10px] text-slate-500 font-medium">{user.mobile_number}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedUsers.includes(user.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                                {selectedUsers.includes(user.id) && <CheckCircle size={12} className="text-white" />}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-slate-400 text-xs italic">No users found</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Cooldown (Days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={intervalDays}
                                        onChange={(e) => setIntervalDays(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Cooldown (Hours)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={intervalHours}
                                        onChange={(e) => setIntervalHours(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl py-2.5 px-4 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Minimum Transfer Amount (₹)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-lg text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Setting to 0 disables minimum requirement constraint.</p>
                            </div>

                            <hr className="border-slate-100 border-t-2 border-dashed" />
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Auto Approval System</label>
                                <select 
                                    value={autoApprovalMode} 
                                    onChange={(e) => setAutoApprovalMode(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 mb-4"
                                >
                                    <option value="MANUAL">Manual Approval (Default)</option>
                                    <option value="INSTANT">Instant Transfer (100% Auto)</option>
                                    <option value="LIMIT_BASED">Limit Based Transfer</option>
                                    <option value="PERCENTAGE">Percentage Based Transfer</option>
                                </select>
                                
                                {autoApprovalMode === 'LIMIT_BASED' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Max Auto-Approve Limit (₹)</label>
                                        <div className="relative mb-2">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-slate-400 font-bold">₹</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                value={autoApprovalLimit}
                                                onChange={(e) => setAutoApprovalLimit(e.target.value)}
                                                className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                                placeholder="e.g. 5000"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">Amounts up to this limit are approved instantly. Excessive amounts revert to manual PENDING state.</p>
                                    </div>
                                )}

                                {autoApprovalMode === 'PERCENTAGE' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Auto-Approve Percentage (%)</label>
                                        <div className="relative mb-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={autoApprovalPercentage}
                                                onChange={(e) => setAutoApprovalPercentage(e.target.value)}
                                                className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                                placeholder="e.g. 70"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <span className="text-slate-400 font-bold">%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">This percentage of the requested amount is paid instantly. The remaining is held for manual approval.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                            <button
                                onClick={handleSaveRules}
                                disabled={actionLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                                {actionLoading ? 'Saving...' : 'Deploy Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
