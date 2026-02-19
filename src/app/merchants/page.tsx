'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Trash2, Ban, CheckCircle, MoreVertical, ReceiptIndianRupee, CheckSquare, Square, Save, Eye, Clock, X, Check, ChevronLeft, ChevronRight, Download, AlertTriangle } from 'lucide-react';
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
                        {(user.name || 'M')[0]}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{user.name || 'Unknown Merchant'}</p>
                        <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                    </div>
                </div>
            </td>
            <td className="p-6">
                <span className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    "bg-blue-100 text-blue-700"
                )}>
                    {user.role}
                </span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
            </td>

            <td className="p-6">
                {isAdmin ? (
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
            <td className="p-6 text-right">
                {isAdmin ? (
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
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-slate-700">{new Date(user.date_of_join).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-mono italic">{new Date(user.date_of_join).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </td>
            <td className="p-6">
                {user.referred_by ? (
                    <div className="flex flex-col">
                        <p className="text-xs font-black text-blue-600">{user.referred_by.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{user.referred_by.mobile}</p>
                    </div>
                ) : (
                    <span className="text-xs text-slate-300 font-medium italic">Direct Join</span>
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

export default function MerchantsPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
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

    const loadUsers = async () => {
        try {
            const data = await apiFetch('/admin/users?type=merchant');
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

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
        } catch (e) {
            alert('Error adding funds');
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
        if (!confirm('Are you sure you want to delete this merchant?')) return;
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
    };

    const toggleStatus = async (user: any) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this merchant?`)) return;

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
        <AdminLayout title="Merchant Management">
            {/* Header Actions */}
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search merchants..."
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const res = await apiFetch('/admin/users/export?search=' + search + '&role=MERCHANT');
                                const url = window.URL.createObjectURL(new Blob([res]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `merchants_export_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                            } catch (e) {
                                alert('Export failed. Please try again.');
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        <Download className="w-5 h-5" />
                        Download CSV
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
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Merchant Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback % (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Flat Bonus (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Referred By</th>
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
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Note</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Reason for crediting funds..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreditsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                                >
                                    {isAdmin ? 'Add Funds Now' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Cashback Modal */}
            {isCashbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Bulk Merchant Cashback</h3>
                                <p className="text-slate-500 font-medium">Updating {selectedIds.length} selected merchants</p>
                            </div>
                            <button onClick={() => setIsCashbackModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleBulkCashback} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay (Outbound)</p>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" max="100" placeholder="Percent %"
                                                className={cn("w-full bg-slate-50 border-none rounded-2xl p-4 font-mono font-bold text-purple-600", parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={cashbackPercent}
                                                onChange={(e) => setCashbackPercent(e.target.value)}
                                                disabled={parseFloat(cashbackFlat) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-purple-300">%</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" placeholder="Flat Amount ₹"
                                                className={cn("w-full bg-slate-50 border-none rounded-2xl p-4 font-mono font-bold text-emerald-600", parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={cashbackFlat}
                                                onChange={(e) => setCashbackFlat(e.target.value)}
                                                disabled={parseFloat(cashbackPercent) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-emerald-300">₹</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receive (Inbound)</p>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" max="100" placeholder="Percent %"
                                                className={cn("w-full bg-indigo-50/50 border-none rounded-2xl p-4 font-mono font-bold text-blue-600", parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={receivePercent}
                                                onChange={(e) => setReceivePercent(e.target.value)}
                                                disabled={parseFloat(receiveFlat) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-blue-300">%</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" placeholder="Flat Amount ₹"
                                                className={cn("w-full bg-indigo-50/50 border-none rounded-2xl p-4 font-mono font-bold text-indigo-600", parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={receiveFlat}
                                                onChange={(e) => setReceiveFlat(e.target.value)}
                                                disabled={parseFloat(receivePercent) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-indigo-300">₹</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                    Note: Setting a percentage will clear any existing flat amount for these merchants, and vice-versa. Percentage takes priority if both are accidentally sent.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all active:scale-95"
                            >
                                Apply Changes to {selectedIds.length} Merchants
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
