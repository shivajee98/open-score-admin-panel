'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Banknote, Users, CheckCircle, XCircle, Settings, X, Search } from 'lucide-react';
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

    useEffect(() => {
        loadTransfers();
    }, []);

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

    // User Search for Rules
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await apiFetch(`/admin/users?search=${encodeURIComponent(searchQuery)}&per_page=5`);
                setSearchResults(res.data?.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        const timeoutId = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSaveRules = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const userIds = applyToAll ? 'ALL' : selectedUsers.map(u => u.id);
            if (!applyToAll && userIds.length === 0) {
                throw new Error("Please select at least one user.");
            }

            const res = await apiFetch('/admin/team-transfers/rules', {
                method: 'POST',
                body: JSON.stringify({
                    user_ids: userIds,
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
            setSearchQuery('');
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
        <AdminLayout title="Team Earning Transfers">
            <div className="space-y-6">
                <div className="flex justify-end">
                     <button
                        onClick={() => setRulesModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                     >
                         <Settings size={18} /> Configure Rules
                     </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                                    <Settings size={22} className="text-indigo-600" /> Transfer Rules
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Configure limits and intervals for team earning requests.</p>
                            </div>
                            <button onClick={() => setRulesModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Target Selection */}
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60">
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
                                        <span className="font-bold text-sm text-slate-900 block">Apply to ALL Workers & Merchants</span>
                                        <span className="text-xs text-slate-500">Applies rule to everyone active. Leave unchecked to target specific users.</span>
                                    </div>
                                </label>

                                {!applyToAll && (
                                    <div className="mt-4 space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search user by name or mobile..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                            />
                                            
                                            {searchResults.length > 0 && (
                                                <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-10">
                                                    {searchResults.map(user => (
                                                        <button
                                                            key={user.id}
                                                            type="button"
                                                            onClick={() => {
                                                                if (!selectedUsers.find(u => u.id === user.id)) {
                                                                    setSelectedUsers([...selectedUsers, user]);
                                                                }
                                                                setSearchQuery('');
                                                                setSearchResults([]);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                                                        >
                                                            <div className="font-medium text-sm text-slate-900">{user.name}</div>
                                                            <div className="text-xs text-slate-500">{user.mobile_number}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {/* Selected Badges */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedUsers.map(u => (
                                                <div key={u.id} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                                    {u.name}
                                                    <button onClick={() => setSelectedUsers(selectedUsers.filter(x => x.id !== u.id))} className="text-indigo-400 hover:text-indigo-600"><X size={14}/></button>
                                                </div>
                                            ))}
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
