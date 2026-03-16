'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Trash2, Ban, CheckCircle, Eye, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Sub-component for individual user rows to handle local input state
const UserRow = ({ user, selectedIds, toggleSelect, toggleStatus, handleDelete, setSelectedUser, setIsCreditsModalOpen, reloadUsers, currentUser }: any) => {
    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <tr className={cn(
            "hover:bg-slate-50/80 transition-colors group",
            selectedIds.includes(user.id) && "bg-blue-50/30",
            user.is_payment_pending && "bg-amber-50/60 border-l-4 border-l-amber-500 shadow-sm"
        )}>
            <td className="p-6 text-center">
                {isAdmin && (
                    <button onClick={() => toggleSelect(user.id)}>
                        <div className={cn(
                            "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                             selectedIds.includes(user.id) ? "bg-blue-600 border-blue-600" : "border-slate-300 group-hover:border-slate-400"
                        )}>
                            {selectedIds.includes(user.id) && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                    </button>
                )}
            </td>
            <td className="p-6 pl-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                            {(user.name || 'A')[0]}
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{user.name || 'Unknown Agent'}</p>
                        <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                    </div>
                </div>
            </td>
            <td className="p-6">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    {user.role}
                </span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
            </td>

            <td className="p-6">
                <div className="flex flex-col text-[10px] font-mono">
                    <span className="text-purple-600">P: {user.cashback_percentage || 0}%</span>
                    <span className="text-blue-600">R: {user.receive_cashback_percentage || 0}%</span>
                </div>
            </td>
            <td className="p-6">
                <div className="flex flex-col text-[10px] font-mono">
                    <span className="text-emerald-600">P: ₹{user.cashback_flat_amount || 0}</span>
                    <span className="text-indigo-600">R: ₹{user.receive_cashback_flat_amount || 0}</span>
                </div>
            </td>

            <td className="p-6">
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-slate-700">{new Date(user.date_of_join).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-mono italic">{new Date(user.date_of_join).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </td>
            <td className="p-6">
                <p className="text-xs font-bold text-slate-700">{user.pincode || 'N/A'}</p>
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
                            title={user.status === 'SUSPENDED' ? 'Activate Agent' : 'Suspend Agent'}
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
                            title="Delete Agent"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default function AgentsPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);

    // Add Funds Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [creditType, setCreditType] = useState('WALLET_TOPUP');
    const [description, setDescription] = useState('');
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

    // Bulk Select
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const loadAgents = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/users?type=agent');
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgents();
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

            alert('Success! Funds added successfully.');
            setIsCreditsModalOpen(false);
            setAmount('');
            setDescription('');
            setCreditType('WALLET_TOPUP');
            loadAgents();
        } catch (e) {
            alert('Error adding funds');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this agent?')) return;
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadAgents();
    };

    const toggleStatus = async (user: any) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this agent?`)) return;

        try {
            await apiFetch(`/admin/users/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadAgents();
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

    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <AdminLayout title="Agent Management">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 gap-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 px-1">Active Agents</h2>
                    <p className="text-slate-500 text-sm font-medium px-1">Manage platform agents and their payouts.</p>
                </div>
                <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search Agents..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <button
                   onClick={() => alert("Agents are created by registering regular users with the 'AGENT' role or updating existing ones.")}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    New Agent
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-20">Select</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Agent Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Wallet</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback % (P|R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Flat Bonus (P|R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Pin Code</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Referred By</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="p-20 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm italic">
                                        No agents found Matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user: any) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        selectedIds={selectedIds}
                                        toggleSelect={toggleSelect}
                                        toggleStatus={toggleStatus}
                                        handleDelete={handleDelete}
                                        setSelectedUser={setSelectedUser}
                                        setIsCreditsModalOpen={setIsCreditsModalOpen}
                                        reloadUsers={loadAgents}
                                        currentUser={currentUser}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {currentPage} of {totalPages} ({filteredUsers.length} total)
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
            {isCreditsModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Funds</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Credits For: {selectedUser.name}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddFunds} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-slate-900 transition-all"
                                    value={amount}
                                    placeholder="0.00"
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Memo</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-slate-900 transition-all size-24 resize-none"
                                    value={description}
                                    placeholder="e.g. Performance Bonus"
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreditsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-3 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                >
                                    Add Funds Now
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
