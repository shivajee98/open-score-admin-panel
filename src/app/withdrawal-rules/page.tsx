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
    AlertCircle
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function WithdrawalRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [loanPlans, setLoanPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        user_type: 'CUSTOMER',
        loan_plan_id: '',
        min_spend_amount: '',
        min_txn_count: '',
        daily_limit: '',
        target_mode: 'ALL', // ALL | SPECIFIC
        target_users_input: '', // Comma separated IDs for now
        is_active: true
    });

    const [allUsers, setAllUsers] = useState<any[]>([]);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesData, plansData, usersData] = await Promise.all([
                apiFetch('/admin/withdrawal-rules'),
                apiFetch('/admin/loan-plans'),
                apiFetch('/admin/users')
            ]);
            setRules(rulesData);
            setLoanPlans(plansData);
            setAllUsers(usersData);
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
                loan_plan_id: formData.loan_plan_id || null,
                min_spend_amount: parseFloat(formData.min_spend_amount || '0'),
                min_txn_count: parseInt(formData.min_txn_count || '0'),
                daily_limit: formData.daily_limit ? parseFloat(formData.daily_limit) : null,
                target_users: formData.target_mode === 'ALL' ? ['*'] : formData.target_users_input.split(',').map(s => s.trim()).filter(Boolean),
                is_active: formData.is_active
            };

            await apiFetch('/admin/withdrawal-rules', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success("Rule created successfully");
            setIsModalOpen(false);
            fetchData();
            // Reset form
            setFormData({
                user_type: 'CUSTOMER',
                loan_plan_id: '',
                min_spend_amount: '',
                min_txn_count: '',
                daily_limit: '',
                target_mode: 'ALL',
                target_users_input: '',
                is_active: true
            });
        } catch (err: any) {
            toast.error(err.message || "Failed to create rule");
        }
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
                        {rules.map((rule) => (
                            <div key={rule.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                            {rule.loan_plan ? (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">{rule.loan_plan.name}</span>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">Global Rule</span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            {rule.daily_limit ? `Daily Limit: ₹${rule.daily_limit}` : 'No Daily Limit'}
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
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                        <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">New Withdrawal Process</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">User Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['CUSTOMER', 'MERCHANT'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFormData({ ...formData, user_type: type })}
                                                className={`py-3 rounded-xl text-xs font-black transition-all ${formData.user_type === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Loan Plan (Optional)</label>
                                    <select
                                        value={formData.loan_plan_id}
                                        onChange={(e) => setFormData({ ...formData, loan_plan_id: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                                    >
                                        <option value="">Apply Globally (No specific plan)</option>
                                        {loanPlans.map(plan => (
                                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                                        ))}
                                    </select>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Daily Withdrawal Limit</label>
                                    <input
                                        type="number"
                                        value={formData.daily_limit}
                                        onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                                        placeholder="e.g. 1000 (Leave empty for no limit)"
                                        className="w-full p-4 bg-indigo-50 text-indigo-900 rounded-2xl text-sm font-bold focus:outline-none placeholder:text-indigo-300"
                                    />
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
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-60 overflow-y-auto space-y-2">
                                            {allUsers
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
                                            {allUsers.filter(u => u.role === formData.user_type).length === 0 && (
                                                <p className="text-center text-xs text-slate-400 font-bold py-4">No {formData.user_type.toLowerCase()}s found.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-base hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    Activate Process
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
