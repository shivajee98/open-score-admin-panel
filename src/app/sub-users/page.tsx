'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { UserPlus, Plus, Shield, Users as UsersIcon, Wallet, ArrowRight, TrendingUp } from 'lucide-react';

interface SubUser {
    id: number;
    name: string;
    mobile_number: string;
    email: string | null;
    referral_code: string;
    credit_balance: number;
    credit_limit: number;
    default_signup_amount: number;
    is_active: boolean;
}

export default function SubUsersPage() {
    const router = useRouter();
    const [subUsers, setSubUsers] = useState<SubUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSubUser, setSelectedSubUser] = useState<SubUser | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        credit_limit: '',
        default_signup_amount: ''
    });

    const [creditAmount, setCreditAmount] = useState('');

    useEffect(() => {
        fetchSubUsers();
    }, []);

    const fetchSubUsers = async () => {
        try {
            const data = await apiFetch('/admin/sub-users');
            setSubUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error('Failed to load sub-users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/admin/sub-users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success('Sub-user created successfully');
            setShowModal(false);
            setFormData({ name: '', mobile_number: '', credit_limit: '', default_signup_amount: '' });
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to create sub-user');
        }
    };

    const handleAddCredit = async (subUserId: number) => {
        if (!creditAmount || parseFloat(creditAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        try {
            await apiFetch(`/admin/sub-users/${subUserId}/credit`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(creditAmount) })
            });
            toast.success('Credit added successfully');
            setCreditAmount('');
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to add credit');
        }
    };

    return (
        <AdminLayout title="Sub-Users Management">
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Agent Network</h2>
                        <p className="text-slate-500 text-sm font-medium">Manage sub-users and their credit limits.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus className="w-5 h-5" />
                        Create Sub-User
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {subUsers.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 italic text-slate-400 font-bold uppercase tracking-widest text-sm">
                                No agents created in the system yet.
                            </div>
                        ) : (
                            subUsers.map((subUser) => (
                                <div
                                    key={subUser.id}
                                    className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer"
                                    onClick={() => router.push(`/sub-users/${subUser.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black group-hover:bg-blue-600 transition-colors">
                                            {subUser.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{subUser.name}</h3>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                <UsersIcon className="w-3 h-3 text-blue-500" />
                                                Agent #{subUser.id} • {subUser.mobile_number}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 max-w-2xl px-4">
                                        <div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Referral Code</p>
                                            <p className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg text-slate-900 inline-block font-black">{subUser.referral_code}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Credit Wallet</p>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-900">₹{parseFloat(subUser.credit_balance.toString()).toLocaleString()}</p>
                                                <span className="text-slate-300">/</span>
                                                <p className="text-xs font-bold text-slate-500">₹{parseFloat(subUser.credit_limit.toString()).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Signup Amount</p>
                                            <p className="font-black text-emerald-600">₹{parseFloat(subUser.default_signup_amount.toString()).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 transition-all"
                                                value={selectedSubUser?.id === subUser.id ? creditAmount : ''}
                                                onChange={(e) => {
                                                    setSelectedSubUser(subUser);
                                                    setCreditAmount(e.target.value);
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleAddCredit(subUser.id)}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                        >
                                            Add Credit
                                        </button>
                                        <button
                                            onClick={() => router.push(`/sub-users/${subUser.id}`)}
                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                        >
                                            <TrendingUp size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Agent</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">New Sub-User Profile</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateSubUser} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.name}
                                    placeholder="e.g. John Agent"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.mobile_number}
                                    placeholder="+91 xxxxxxxxxx"
                                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.credit_limit}
                                        placeholder="50000"
                                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signup Bonus</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.default_signup_amount}
                                        placeholder="250"
                                        onChange={(e) => setFormData({ ...formData, default_signup_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                                >
                                    Confirm Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
