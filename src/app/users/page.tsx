'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Trash2, Ban, CheckCircle, MoreVertical } from 'lucide-react';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

    const loadUsers = async () => {
        try {
            const res = await apiFetch('/users');
            const data = await res.json();
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
            const res = await apiFetch(`/users/${selectedUser.id}/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(amount) })
            });

            if (res.ok) {
                alert('Success! Funds requested for approval.');
                setIsCreditsModalOpen(false);
                setAmount('');
                loadUsers();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed');
            }
        } catch (e) {
            alert('Error adding funds');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const res = await apiFetch(`/users/${id}`, { method: 'DELETE' });
        if (res.ok) loadUsers();
    };

    const filteredUsers = users.filter((u: any) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile_number.includes(search)
    );

    return (
        <AdminLayout title="User Management">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-8">User Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user: any) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'MERCHANT' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance).toLocaleString('en-IN')}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="text-sm font-bold text-slate-600">{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 pr-8 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setSelectedUser(user); setIsCreditsModalOpen(true); }}
                                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                                title="Add Funds"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Funds Modal */}
            {isCreditsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Add Funds</h3>
                        <p className="text-slate-500 font-medium mb-6">Request funds for <span className="text-slate-900 font-bold">{selectedUser?.name}</span>. This will require approval.</p>

                        <form onSubmit={handleAddFunds}>
                            <div className="mb-6">
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
                                    Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
