'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    Plus,
    Trash2,
    Users,
    Layers,
    CreditCard,
    Activity,
    Shield,
    CheckCircle2,
    XCircle,
    Search,
    AlertCircle,
    Pencil
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function WithdrawalRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        user_type: 'CUSTOMER',
        min_withdrawal_amount: '',
        max_withdrawal_amount: '',
        min_spend_amount: '',
        min_txn_count: '',
        daily_txn_limit: '',
        target_mode: 'ALL', // ALL | SPECIFIC
        target_users_input: '', // Comma separated IDs for now
        is_active: true,
        is_charge_enabled: false,
        charge_threshold: '',
        charge_percent: '',
        min_charge_amount: '',
        max_charge_amount: '',
        monthly_free_count: ''
    });

    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userLoading, setUserLoading] = useState(false);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, usersRes] = await Promise.all([
                apiFetch('/admin/withdrawal-rules'),
                apiFetch('/admin/users')
            ]);
            setRules(Array.isArray(rulesRes) ? rulesRes : (rulesRes?.data || []));
            // Users are now fetched dynamically via useEffect below
        } catch (err) {
            console.error(err);
            // Fail silently or toast, plans might be empty
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Dynamic User Fetching
    const fetchUsers = async (role: string, search: string) => {
        setUserLoading(true);
        try {
            const params = new URLSearchParams({
                type: role.toLowerCase(),
                search: search,
                per_page: '50' // Fetch more for selection
            });
            const res = await apiFetch(`/admin/users?${params.toString()}`);
            setAllUsers(Array.isArray(res) ? res : (res?.data || []));
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        if (!isModalOpen || formData.target_mode !== 'SPECIFIC') return;
        
        const timer = setTimeout(() => {
            fetchUsers(formData.user_type, userSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.user_type, userSearch, isModalOpen, formData.target_mode]);

    // Helper to toggle user selection
    const toggleUser = (userId: number) => {
        const currentIds = formData.target_users_input
            ? formData.target_users_input.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const idStr = userId.toString();
        let newIds;

        if (currentIds.includes(idStr)) {
            newIds = currentIds.filter(id => id !== idStr);
        } else {
            newIds = [...currentIds, idStr];
        }

        setFormData({
            ...formData,
            target_users_input: newIds.join(',')
        });
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                user_type: formData.user_type,
                min_withdrawal_amount: parseFloat(formData.min_withdrawal_amount || '0'),
                max_withdrawal_amount: parseFloat(formData.max_withdrawal_amount || '0'),
                min_spend_amount: parseFloat(formData.min_spend_amount || '0'),
                min_txn_count: parseInt(formData.min_txn_count || '0'),
                daily_txn_limit: formData.daily_txn_limit ? parseInt(formData.daily_txn_limit) : null,
                target_users: formData.target_mode === 'ALL' ? ['*'] : formData.target_users_input.split(',').map(s => s.trim()).filter(Boolean),
                is_active: formData.is_active,
                is_charge_enabled: formData.is_charge_enabled,
                charge_threshold: parseFloat(formData.charge_threshold || '0'),
                charge_percent: parseFloat(formData.charge_percent || '0'),
                min_charge_amount: parseFloat(formData.min_charge_amount || '0'),
                max_charge_amount: parseFloat(formData.max_charge_amount || '0'),
                monthly_free_count: parseInt(formData.monthly_free_count || '0')
            };

            const url = editingId ? `/admin/withdrawal-rules/${editingId}` : '/admin/withdrawal-rules';
            const method = editingId ? 'PUT' : 'POST';

            await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            toast.success(editingId ? "Rule updated successfully" : "Rule created successfully");
            setIsModalOpen(false);
            setEditingId(null);
            fetchData();
            // Reset form
            setFormData({
                user_type: 'CUSTOMER',
                min_withdrawal_amount: '',
                max_withdrawal_amount: '',
                min_spend_amount: '',
                min_txn_count: '',
                daily_txn_limit: '',
                target_mode: 'ALL',
                target_users_input: '',
                is_active: true,
                is_charge_enabled: false,
                charge_threshold: '',
                charge_percent: '',
                min_charge_amount: '',
                max_charge_amount: '',
                monthly_free_count: ''
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to create rule");
        }
    };

    const handleEdit = (rule: any) => {
        setEditingId(rule.id);
        setFormData({
            user_type: rule.user_type,
            min_withdrawal_amount: rule.min_withdrawal_amount?.toString() || '',
            max_withdrawal_amount: rule.max_withdrawal_amount?.toString() || '',
            min_spend_amount: rule.min_spend_amount?.toString() || '',
            min_txn_count: rule.min_txn_count?.toString() || '',
            daily_txn_limit: rule.daily_txn_limit?.toString() || '',
            target_mode: rule.target_users?.includes('*') ? 'ALL' : 'SPECIFIC',
            target_users_input: rule.target_users?.includes('*') ? '' : rule.target_users.join(','),
            is_active: !!rule.is_active,
            is_charge_enabled: !!rule.is_charge_enabled,
            charge_threshold: rule.charge_threshold?.toString() || '',
            charge_percent: rule.charge_percent?.toString() || '',
            min_charge_amount: rule.min_charge_amount?.toString() || '',
            max_charge_amount: rule.max_charge_amount?.toString() || '',
            monthly_free_count: rule.monthly_free_count?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        try {
            await apiFetch(`/admin/withdrawal-rules/${id}`, { method: 'DELETE' });
            toast.success("Rule deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete rule");
        }
    };

    return (
        <AdminLayout title="Withdrawal Configuration">
            <div className="p-6 md:p-10 bg-slate-50/50 min-h-screen font-sans">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Configuration</p>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Withdrawal Processes</h1>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create New Process
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {Array.isArray(rules) && rules.map((rule) => (
                            <div key={rule.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleEdit(rule)} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(rule.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-4 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${rule.user_type === 'MERCHANT' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {rule.user_type === 'MERCHANT' ? <Activity className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{rule.user_type}</span>
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">Withdrawal Range: ₹{rule.min_withdrawal_amount} - ₹{rule.max_withdrawal_amount}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            Daily Request Limit: {rule.daily_txn_limit || 'Unlimited'} 
                                            {rule.daily_txn_limit && <span className="text-xs text-slate-400 font-bold ml-2">Times/Day</span>}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Unlock Conditions</p>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700">Min Spend: ₹{rule.min_spend_amount}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700">Min Txns: {rule.min_txn_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Targeting</p>
                                        <div className="flex items-center gap-2 h-full">
                                            <Users className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700">
                                                {rule.target_users?.includes('*') ? 'All Users' : `Specific Users (${rule.target_users?.length || 0})`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {rules.length === 0 && !loading && (
                            <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs">
                                No active withdrawal processes found
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setEditingId(null); }}></div>
                        <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingId ? 'Edit Withdrawal Process' : 'New Withdrawal Process'}</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">User Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['CUSTOMER', 'MERCHANT', 'STUDENT'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, user_type: type })}
                                                className={`py-3 rounded-xl text-[10px] font-black transition-all ${formData.user_type === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Min Single Withdrawal</label>
                                        <input
                                            type="number"
                                            value={formData.min_withdrawal_amount}
                                            onChange={(e) => setFormData({ ...formData, min_withdrawal_amount: e.target.value })}
                                            placeholder="e.g. 5000"
                                            className="w-full p-4 bg-emerald-50 text-emerald-900 rounded-2xl text-sm font-bold focus:outline-none placeholder:text-emerald-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Max Single Withdrawal</label>
                                        <input
                                            type="number"
                                            value={formData.max_withdrawal_amount}
                                            onChange={(e) => setFormData({ ...formData, max_withdrawal_amount: e.target.value })}
                                            placeholder="e.g. 10000"
                                            className={`w-full p-4 rounded-2xl text-sm font-bold focus:outline-none transition-all ${
                                                formData.max_withdrawal_amount && parseFloat(formData.max_withdrawal_amount) < parseFloat(formData.min_withdrawal_amount || '0')
                                                ? 'bg-rose-50 text-rose-900 ring-1 ring-rose-200'
                                                : 'bg-emerald-50 text-emerald-900 placeholder:text-emerald-200'
                                            }`}
                                        />
                                        {formData.max_withdrawal_amount && parseFloat(formData.max_withdrawal_amount) < parseFloat(formData.min_withdrawal_amount || '0') && (
                                            <p className="text-[9px] font-bold text-rose-500 mt-1 ml-1 animate-pulse">Max must be ≥ Min</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Min Spend (Unlocking)</label>
                                        <input
                                            type="number"
                                            value={formData.min_spend_amount}
                                            onChange={(e) => setFormData({ ...formData, min_spend_amount: e.target.value })}
                                            placeholder="0"
                                            className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Min Txns (Unlocking)</label>
                                        <input
                                            type="number"
                                            value={formData.min_txn_count}
                                            onChange={(e) => setFormData({ ...formData, min_txn_count: e.target.value })}
                                            placeholder="0"
                                            className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Daily Request Limit</label>
                                    <input
                                        type="number"
                                        value={formData.daily_txn_limit}
                                        onChange={(e) => setFormData({ ...formData, daily_txn_limit: e.target.value })}
                                        placeholder="e.g. 1"
                                        className="w-full p-4 bg-indigo-50 text-indigo-900 rounded-2xl text-sm font-bold focus:outline-none placeholder:text-indigo-300"
                                    />
                                </div>

                                <div className="p-6 bg-slate-900 rounded-[2rem] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${formData.is_charge_enabled ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Transfer Charge</p>
                                                <p className="text-[9px] font-bold text-slate-400">Charge fee based on threshold</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setFormData({ ...formData, is_charge_enabled: !formData.is_charge_enabled })}
                                            className={`w-12 h-6 rounded-full transition-all relative ${formData.is_charge_enabled ? 'bg-amber-500' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_charge_enabled ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    {formData.is_charge_enabled && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Free Monthly Count</label>
                                                    <input
                                                        type="number"
                                                        value={formData.monthly_free_count}
                                                        onChange={(e) => setFormData({ ...formData, monthly_free_count: e.target.value })}
                                                        placeholder="e.g. 5"
                                                        className="w-full p-3 bg-slate-800 border-none text-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-amber-500/50 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Charge (%)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.charge_percent}
                                                        onChange={(e) => setFormData({ ...formData, charge_percent: e.target.value })}
                                                        placeholder="e.g. 4"
                                                        className="w-full p-3 bg-slate-800 border-none text-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-amber-500/50 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3">Chargeable Range (Paid Tier)</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Min Amount (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={formData.min_charge_amount}
                                                            onChange={(e) => setFormData({ ...formData, min_charge_amount: e.target.value })}
                                                            placeholder="0"
                                                            className="w-full p-3 bg-slate-800 border-none text-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-amber-500/50 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Max Amount (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={formData.max_charge_amount}
                                                            onChange={(e) => setFormData({ ...formData, max_charge_amount: e.target.value })}
                                                            placeholder="0"
                                                            className="w-full p-3 bg-slate-800 border-none text-white rounded-xl text-xs font-bold focus:ring-1 focus:ring-amber-500/50 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-500 italic mt-3 px-1">
                                                    * Allows withdrawal below standard min if within ₹{formData.min_charge_amount || '0'} - ₹{formData.max_charge_amount || '0'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Targeting</label>
                                    <select
                                        value={formData.target_mode}
                                        onChange={(e) => setFormData({ ...formData, target_mode: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none mb-3"
                                    >
                                        <option value="ALL">All Users</option>
                                        <option value="SPECIFIC">Specific Users</option>
                                    </select>

                                    {formData.target_mode === 'SPECIFIC' && (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder={`Search ${formData.user_type.toLowerCase()}s...`}
                                                    value={userSearch}
                                                    onChange={(e) => setUserSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                                />
                                            </div>

                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-60 overflow-y-auto space-y-2 relative">
                                                {userLoading && (
                                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                                                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                {Array.isArray(allUsers) && allUsers
                                                .filter(u => u.role === formData.user_type)
                                                .map(user => {
                                                    const isSelected = formData.target_users_input
                                                        .split(',')
                                                        .map(s => s.trim())
                                                        .includes(user.id.toString());

                                                    return (
                                                        <label key={user.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={() => toggleUser(user.id)}
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-xs font-black text-slate-900">{user.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{user.mobile_number}</p>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            }
                                            {allUsers.filter(u => u.role === formData.user_type).length === 0 && !userLoading && (
                                                <p className="text-center text-xs text-slate-400 font-bold py-4">No {formData.user_type.toLowerCase()}s found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-base hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    {editingId ? 'Update Process' : 'Activate Process'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
