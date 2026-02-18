'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Trash2, Ban, CheckCircle, MoreVertical, ReceiptIndianRupee, CheckSquare, Square, Save, Eye, Clock, X, Check, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Sub-component for individual user rows to handle local input state
const UserRow = ({ user, selectedIds, toggleSelect, toggleStatus, handleDelete, setSelectedUser, setIsCreditsModalOpen, reloadUsers, currentUser }: any) => {
    const [cashbackPercent, setCashbackPercent] = useState(user.cashback_percentage ?? '');
    const [cashbackFlat, setCashbackFlat] = useState(user.cashback_flat_amount ?? '');
    const [receivePercent, setReceivePercent] = useState(user.receive_cashback_percentage ?? '');
    const [receiveFlat, setReceiveFlat] = useState(user.receive_cashback_flat_amount ?? '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync state if user prop changes (e.g. after reload)
    useEffect(() => {
        setCashbackPercent(user.cashback_percentage ?? '');
        setCashbackFlat(user.cashback_flat_amount ?? '');
        setReceivePercent(user.receive_cashback_percentage ?? '');
        setReceiveFlat(user.receive_cashback_flat_amount ?? '');
    }, [user.cashback_percentage, user.cashback_flat_amount, user.receive_cashback_percentage, user.receive_cashback_flat_amount]);

    const handleSenderPercentChange = (val: string) => {
        setCashbackPercent(val);
        if (parseFloat(val) > 0) setCashbackFlat('');
    };

    const handleSenderFlatChange = (val: string) => {
        setCashbackFlat(val);
        if (parseFloat(val) > 0) setCashbackPercent('');
    };

    const handleReceiverPercentChange = (val: string) => {
        setReceivePercent(val);
        if (parseFloat(val) > 0) setReceiveFlat('');
    };

    const handleReceiverFlatChange = (val: string) => {
        setReceiveFlat(val);
        if (parseFloat(val) > 0) setReceivePercent('');
    };

    const handleSaveCashback = async () => {
        setIsSaving(true);
        try {
            const pPercent = parseFloat(cashbackPercent) || 0;
            const pFlat = parseFloat(cashbackFlat) || 0;
            const rPercent = parseFloat(receivePercent) || 0;
            const rFlat = parseFloat(receiveFlat) || 0;

            if (pPercent < 0 || pFlat < 0 || rPercent < 0 || rFlat < 0) {
                alert("Values cannot be negative");
                return;
            }

            await apiFetch('/admin/users/bulk-cashback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: [user.id],
                    cashback_percentage: pPercent,
                    cashback_flat_amount: pFlat,
                    receive_cashback_percentage: rPercent,
                    receive_cashback_flat_amount: rFlat
                })
            });
            alert('Cashback updated!');
            reloadUsers();
        } catch (e) {
            alert('Error updating cashback');
        } finally {
            setIsSaving(false);
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <tr className={cn("hover:bg-slate-50/80 transition-colors group", selectedIds.includes(user.id) && "bg-blue-50/30")}>
            <td className="p-6 text-center">
                {isAdmin && (
                    <button onClick={() => toggleSelect(user.id)}>
                        {selectedIds.includes(user.id) ?
                            <CheckSquare className="text-blue-600" /> : <Square className="text-slate-300 group-hover:text-slate-400" />
                        }
                    </button>
                )}
            </td>
            <td className="p-6 pl-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">
                        {(user.name || 'U')[0]}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{user.name || 'Unknown User'}</p>
                        <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                    </div>
                </div>
            </td>
            <td className="p-6">
                <span className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'MERCHANT' ? 'bg-blue-100 text-blue-700' : user.role === 'STUDENT' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                )}>
                    {user.role}
                </span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
            </td>

            {/* Inline Cashback Inputs - Only for Admin & Only for Agents */}
            <td className="p-6">
                {isAdmin && user.role === 'SUPPORT_AGENT' ? (
                    <div className="flex flex-col gap-1">
                        <input
                            type="number" min="0" max="100" step="0.01" placeholder="Pay %"
                            className={cn(
                                "w-20 bg-slate-100 border-none rounded-lg p-2 font-mono text-xs font-bold text-purple-600 focus:ring-2 focus:ring-purple-200",
                                parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed"
                            )}
                            value={cashbackPercent}
                            onChange={(e) => handleSenderPercentChange(e.target.value)}
                            disabled={parseFloat(cashbackFlat) > 0}
                        />
                        <input
                            type="number" min="0" max="100" step="0.01" placeholder="Rec %"
                            className={cn(
                                "w-20 bg-blue-50 border-none rounded-lg p-2 font-mono text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-200",
                                parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed"
                            )}
                            value={receivePercent}
                            onChange={(e) => handleReceiverPercentChange(e.target.value)}
                            disabled={parseFloat(receiveFlat) > 0}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col text-[10px] font-mono">
                        <span className="text-purple-600">P: {user.cashback_percentage || 0}%</span>
                        <span className="text-blue-600">R: {user.receive_cashback_percentage || 0}%</span>
                    </div>
                )}
            </td>
            <td className="p-6">
                {isAdmin && user.role === 'SUPPORT_AGENT' ? (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                            <input
                                type="number" min="0" step="0.01" placeholder="Pay ₹"
                                className={cn(
                                    "w-24 bg-slate-100 border-none rounded-lg p-2 font-mono text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-200",
                                    parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                value={cashbackFlat}
                                onChange={(e) => handleSenderFlatChange(e.target.value)}
                                disabled={parseFloat(cashbackPercent) > 0}
                            />
                            <input
                                type="number" min="0" step="0.01" placeholder="Rec ₹"
                                className={cn(
                                    "w-24 bg-blue-50 border-none rounded-lg p-2 font-mono text-xs font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-200",
                                    parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                value={receiveFlat}
                                onChange={(e) => handleReceiverFlatChange(e.target.value)}
                                disabled={parseFloat(receivePercent) > 0}
                            />
                        </div>
                        <button
                            onClick={handleSaveCashback}
                            disabled={isSaving}
                            className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors ml-2"
                            title="Update Cashback Rules"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col text-[10px] font-mono">
                        <span className="text-emerald-600">P: ₹{user.cashback_flat_amount || 0}</span>
                        <span className="text-indigo-600">R: ₹{user.receive_cashback_flat_amount || 0}</span>
                    </div>
                )}
            </td>

            <td className="p-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-sm font-bold text-slate-600">{user.status}</span>
                </div>
            </td>
            <td className="p-6 pr-8 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/users/detail?id=${user.id}`}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Full Details"
                    >
                        <Eye className="w-5 h-5" />
                    </Link>

                    {isAdmin && (
                        <button
                            onClick={() => toggleStatus(user)}
                            className={`p-2 rounded-lg transition-colors ${user.status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            title={user.status === 'SUSPENDED' ? 'Activate User' : 'Suspend User'}
                        >
                            {user.status === 'SUSPENDED' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </button>
                    )}

                    <button
                        onClick={() => { setSelectedUser(user); setIsCreditsModalOpen(true); }}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Add Funds"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {isAdmin && user.role !== 'SYSTEM' && user.role !== 'ADMIN' && (
                        <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default function InternalUsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [pendingTransactions, setPendingTransactions] = useState([]);
    const [pendingServiceFees, setPendingServiceFees] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Add Funds Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [creditType, setCreditType] = useState('WALLET_TOPUP');
    const [description, setDescription] = useState('');
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

    // Bulk Cashback States
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCashbackModalOpen, setIsCashbackModalOpen] = useState(false);
    const [cashbackPercent, setCashbackPercent] = useState('');
    const [cashbackFlat, setCashbackFlat] = useState('');
    const [receivePercent, setReceivePercent] = useState('');
    const [receiveFlat, setReceiveFlat] = useState('');

    const handleModalSenderPercentChange = (val: string) => {
        setCashbackPercent(val);
        if (parseFloat(val) > 0) setCashbackFlat('');
    };

    const handleModalSenderFlatChange = (val: string) => {
        setCashbackFlat(val);
        if (parseFloat(val) > 0) setCashbackPercent('');
    };

    const handleModalReceiverPercentChange = (val: string) => {
        setReceivePercent(val);
        if (parseFloat(val) > 0) setReceiveFlat('');
    };

    const handleModalReceiverFlatChange = (val: string) => {
        setReceiveFlat(val);
        if (parseFloat(val) > 0) setReceivePercent('');
    };

    const loadUsers = async () => {
        try {
            const data = await apiFetch('/admin/users?type=internal');
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingTransactions = async () => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            const data = await apiFetch('/admin/funds/pending');
            setPendingTransactions(data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadPendingServiceFees = async () => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            const data: any = await apiFetch('/admin/support/payment-tickets?status=AGENT_APPROVED');
            setPendingServiceFees(data.data || []);
        } catch (e) {
            console.error("Failed to load service fee requests", e);
        }
    };

    useEffect(() => {
        loadUsers();
        if (currentUser?.role === 'ADMIN') {
            loadPendingTransactions();
            loadPendingServiceFees();
        }
    }, [currentUser]);

    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch(`/admin/users/${selectedUser.id}/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    type: creditType,
                    description: description
                })
            });

            const msg = currentUser?.role === 'ADMIN'
                ? 'Success! Funds added successfully.'
                : 'Request Submitted! Pending Admin Approval.';

            alert(msg);
            setIsCreditsModalOpen(false);
            setAmount('');
            setDescription('');
            setCreditType('WALLET_TOPUP');

            loadUsers();
            if (currentUser?.role === 'ADMIN') loadPendingTransactions();
        } catch (e) {
            alert('Error adding funds');
        }
    };

    const handleApproveFund = async (id: number) => {
        if (!confirm('Approve this transaction?')) return;
        try {
            await apiFetch(`/admin/funds/${id}/approve`, { method: 'POST' });
            loadPendingTransactions();
            loadUsers(); // Update balances
        } catch (e) {
            alert('Failed to approve');
        }
    };

    const handleRejectFund = async (id: number) => {
        if (!confirm('Reject this transaction?')) return;
        try {
            await apiFetch(`/admin/funds/${id}/reject`, { method: 'POST' });
            loadPendingTransactions();
        } catch (e) {
            alert('Failed to reject');
        }
    };

    const handleApproveServiceFee = async (id: number) => {
        if (!confirm('Approve this service fee payment?')) return;
        try {
            await apiFetch(`/admin/support/tickets/${id}/approve-payment`, { method: 'POST' });
            loadPendingServiceFees();
            loadUsers(); // Update balances as needed
        } catch (e) {
            alert('Failed to approve service fee');
        }
    };

    const handleRejectServiceFee = async (id: number) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await apiFetch(`/admin/support/tickets/${id}/reject-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            loadPendingServiceFees();
        } catch (e) {
            alert('Failed to reject service fee');
        }
    };

    const handleBulkCashback = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/admin/users/bulk-cashback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: selectedIds,
                    cashback_percentage: parseFloat(cashbackPercent) || 0,
                    cashback_flat_amount: parseFloat(cashbackFlat) || 0,
                    receive_cashback_percentage: parseFloat(receivePercent) || 0,
                    receive_cashback_flat_amount: parseFloat(receiveFlat) || 0
                })
            });

            alert('Success! Cashback settings updated.');
            setIsCashbackModalOpen(false);
            setCashbackPercent('');
            setCashbackFlat('');
            setReceivePercent('');
            setReceiveFlat('');
            setSelectedIds([]);
            loadUsers();
        } catch (e: any) {
            console.error(e);
            alert('Error updating cashback settings');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
    };

    const toggleStatus = async (user: any) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this user?`)) return;

        try {
            await apiFetch(`/admin/users/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadUsers();
        } catch (e) {
            alert('Error updating status');
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredUsers = users.filter((u: any) =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.mobile_number || '').includes(search)
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedUsers.map((u: any) => u.id));
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <AdminLayout title="Internal Team & Funds">

            {/* Pending Approvals Section (Admin Only) */}
            {isAdmin && pendingTransactions.length > 0 && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="text-amber-500" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Fund Requests</h3>
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-black">{pendingTransactions.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingTransactions.map((tx: any) => (
                            <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-lg shadow-amber-500/5 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Clock size={48} className="text-amber-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Amount</p>
                                            <p className="text-2xl font-black text-slate-900">₹{parseFloat(tx.amount).toLocaleString()}</p>
                                            <span className={cn(
                                                "inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                                                tx.type === 'CASHBACK' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                            )}>
                                                {tx.type === 'CASHBACK' ? 'System Cashback' : 'Wallet Deposit'}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                            <Clock size={20} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Beneficiary (User)</p>
                                            <p className="font-bold text-slate-800 text-sm">{tx.user_name}</p>
                                            <p className="font-mono text-xs text-slate-500">{tx.user_mobile}</p>
                                        </div>
                                        {tx.agent_name && (
                                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Requested By (Agent)</p>
                                                <p className="font-bold text-blue-800 text-sm">{tx.agent_name}</p>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase">{tx.agent_role}</p>
                                            </div>
                                        )}
                                        {tx.description && (
                                            <div className="p-2">
                                                <p className="text-[10px] text-slate-500 italic">"{tx.description}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRejectFund(tx.id)}
                                            className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApproveFund(tx.id)}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Service/Platform Fees Section (Admin Only) */}
            {isAdmin && pendingServiceFees.length > 0 && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-500 delay-100">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="text-indigo-500" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Service Fee Payment Approvals</h3>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-black">{pendingServiceFees.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingServiceFees.map((ticket: any) => (
                            <div key={ticket.id} className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-lg shadow-indigo-500/5 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ReceiptIndianRupee size={48} className="text-indigo-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Amount</p>
                                            <p className="text-2xl font-black text-slate-900">₹{parseFloat(ticket.payment_amount).toLocaleString()}</p>
                                        </div>
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <CheckCircle size={20} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">User Details</p>
                                            <p className="font-bold text-slate-800 text-sm">{ticket.user?.name}</p>
                                            <p className="font-mono text-xs text-slate-500">{ticket.user?.mobile_number}</p>
                                        </div>
                                        {ticket.assigned_agent && (
                                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Completed By (Agent)</p>
                                                <p className="font-bold text-blue-800 text-sm">{ticket.assigned_agent.name}</p>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase">AGENT_APPROVED</p>
                                            </div>
                                        )}
                                        <div className="p-2">
                                            <p className="text-[10px] text-slate-500 italic">Action: {ticket.sub_action?.replace(/_/g, ' ') || 'Service Fee'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRejectServiceFee(ticket.id)}
                                            className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApproveServiceFee(ticket.id)}
                                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Actions */}
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const res = await apiFetch('/admin/users/export?search=' + search);
                                const url = window.URL.createObjectURL(new Blob([res]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                            } catch (e) {
                                alert('Export failed. Please try again.');
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        <Download className="w-5 h-5" />
                        Bulk Data Download
                    </button>

                    <div className="flex items-center bg-slate-50 border-none rounded-2xl px-4 py-2">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                        >
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={60}>60</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {isAdmin && selectedIds.length > 0 && (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-10">
                            <span className="font-bold text-slate-500">{selectedIds.length} Selected</span>
                            <button
                                onClick={() => setIsCashbackModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                            >
                                <ReceiptIndianRupee size={20} />
                                Set Cashback
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 w-16 text-center">
                                    {isAdmin && (
                                        <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100">
                                            {selectedIds.length > 0 && selectedIds.length === filteredUsers.length ?
                                                <CheckSquare className="text-blue-600" /> : <Square className="text-slate-400" />
                                            }
                                        </button>
                                    )}
                                </th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">User Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback % (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Flat Bonus (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedUsers.map((user: any) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    selectedIds={selectedIds}
                                    toggleSelect={toggleSelect}
                                    toggleStatus={toggleStatus}
                                    handleDelete={handleDelete}
                                    setSelectedUser={setSelectedUser}
                                    setIsCreditsModalOpen={setIsCreditsModalOpen}
                                    reloadUsers={loadUsers}
                                    currentUser={currentUser}
                                />
                            ))}
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

            {/* Add Funds Modal */}
            {isCreditsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{isAdmin ? 'Add Funds' : 'Request Funds'}</h3>
                        <p className="text-slate-500 font-medium mb-6">
                            {isAdmin ? 'Add funds directly to' : 'Submit a request to add funds for'} <span className="text-slate-900 font-bold">{selectedUser?.name}</span>.
                        </p>

                        <form onSubmit={handleAddFunds}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transaction Type</label>
                                    <select
                                        value={creditType}
                                        onChange={(e) => setCreditType(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                                    >
                                        <option value="WALLET_TOPUP">Wallet Top-up</option>
                                        <option value="SERVICE_FEE">Service Fee Payment</option>
                                        <option value="OTHER">Other Adjustment</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Note</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                                        placeholder="Reason for this credit..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreditsModalOpen(false)}
                                    className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    {isAdmin ? 'Add Funds' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Cashback Modal (Admin Only) */}
            {isAdmin && isCashbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Cashback Settings</h3>
                        <p className="text-slate-500 font-medium mb-6">Configure guaranteed cashback for <span className="text-slate-900 font-bold">{selectedIds.length} users</span>.</p>

                        <form onSubmit={handleBulkCashback}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Pay/Sender Rules</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number" min="0" step="0.01"
                                            className={cn(
                                                "w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-purple-100",
                                                parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Flat ₹"
                                            value={cashbackFlat}
                                            onChange={e => handleModalSenderFlatChange(e.target.value)}
                                            disabled={parseFloat(cashbackPercent) > 0}
                                        />
                                        <input
                                            type="number" min="0" max="100" step="0.01"
                                            className={cn(
                                                "w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-purple-100",
                                                parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Percent %"
                                            value={cashbackPercent}
                                            onChange={e => handleModalSenderPercentChange(e.target.value)}
                                            disabled={parseFloat(cashbackFlat) > 0}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Receive/Payee Rules</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number" min="0" step="0.01"
                                            className={cn(
                                                "w-full bg-blue-50/50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100",
                                                parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Flat ₹"
                                            value={receiveFlat}
                                            onChange={e => handleModalReceiverFlatChange(e.target.value)}
                                            disabled={parseFloat(receivePercent) > 0}
                                        />
                                        <input
                                            type="number" min="0" max="100" step="0.01"
                                            className={cn(
                                                "w-full bg-blue-50/50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100",
                                                parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Percent %"
                                            value={receivePercent}
                                            onChange={e => handleModalReceiverPercentChange(e.target.value)}
                                            disabled={parseFloat(receiveFlat) > 0}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-4 font-bold px-1">
                                        Logic: (Amount * Rate%) + Flat Amount. P = Payer, R = Receiver.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCashbackModalOpen(false)}
                                    className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                >
                                    Save Rules
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
