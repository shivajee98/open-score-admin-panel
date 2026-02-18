'use client';
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { apiFetch } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

// Interfaces for V2 Structure
interface FeeConfig {
    name: string;
    amount: number;
}

interface TenureConfig {
    tenure_days: number;
    interest_rate: number; // Default rate
    interest_rates: Record<string, number>; // Specific rate per frequency
    fees: FeeConfig[];
    allowed_frequencies: string[];
    cashback: Record<string, number>;
    gst_rate?: number;
}

const formatTenure = (days: number, type: string = 'months') => {
    if (!days) return "";

    if (type === 'days') {
        return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    }

    if (type === 'decimal') {
        const months = (days / 30).toFixed(1);
        return `${months} ${months === '1.0' ? 'Month' : 'Months'}`;
    }

    // Default: months (rounded)
    if (days % 30 === 0) {
        const months = days / 30;
        return `${months} ${months === 1 ? 'Month' : 'Months'}`;
    }
    const months = Math.round(days / 30);
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
};

// Client Component only
export default function EditLoanPlan() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id || searchParams.get('id');
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        plan_color: 'bg-indigo-500',
        tag_text: '',
        configurations: [] as TenureConfig[],
        is_public: true,
        is_locked: false,
        tenure_type: 'months',
        assigned_user_ids: [] as number[]
    });

    const [targetableUsers, setTargetableUsers] = useState<any[]>([]);
    const [userFilters, setUserFilters] = useState({
        min_loan_completed: '',
        min_loans_count: '',
        search: ''
    });
    const [searching, setSearching] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            loadPlan();
        }
    }, [id]);

    const loadPlan = async () => {
        try {
            // Fetch all plans using apiFetch
            const plans = await apiFetch('/admin/loan-plans');
            const plan = plans.find((p: any) => p.id == id);

            if (plan) {
                // Parse configurations if it's JSON from DB (it comes as array from Laravel casts usually)
                let configs = plan.configurations || [];

                // Ensure interest_rates, allowed_frequencies, fees, and cashback exist for each config
                const sanitizedConfigs = (Array.isArray(configs) ? configs : []).map((c: any) => ({
                    ...c,
                    interest_rates: c.interest_rates || {},
                    allowed_frequencies: c.allowed_frequencies || [],
                    fees: c.fees || [],
                    cashback: c.cashback || {},
                    gst_rate: c.gst_rate !== undefined ? c.gst_rate : 18
                }));

                setFormData({
                    name: plan.name,
                    amount: plan.amount,
                    plan_color: plan.plan_color || 'bg-indigo-500',
                    tag_text: plan.tag_text || '',
                    configurations: sanitizedConfigs,
                    is_public: plan.is_public ?? true,
                    is_locked: plan.is_locked ?? false,
                    tenure_type: plan.tenure_type || 'months',
                    assigned_user_ids: plan.assigned_user_ids || []
                });

                // If it's targeted, pre-fetch assigned users or at least some users
                if (!plan.is_public) {
                    const data = await apiFetch(`/admin/users/targetable`);
                    setTargetableUsers(data);
                }
            }
        } catch (err) {
            setError("Could not load plan details");
        } finally {
            setLoading(false);
        }
    };

    // Helper to add a new default configuration
    const addConfiguration = () => {
        setFormData(prev => ({
            ...prev,
            configurations: [
                ...prev.configurations,
                {
                    tenure_days: 30,
                    interest_rate: 0,
                    interest_rates: {},
                    fees: [{ name: 'Processing Fee', amount: 0 }],
                    allowed_frequencies: ['MONTHLY'],
                    cashback: {},
                    gst_rate: 18
                }
            ]
        }));
    };

    const updateConfig = (index: number, field: keyof TenureConfig, value: any) => {
        const newConfigs = [...formData.configurations];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        setFormData({ ...formData, configurations: newConfigs });
    };

    const removeConfig = (index: number) => {
        const newConfigs = formData.configurations.filter((_, i) => i !== index);
        setFormData({ ...formData, configurations: newConfigs });
    };

    const fetchTargetableUsers = async () => {
        setSearching(true);
        try {
            // Fetch ALL targetable users once, then filter on frontend for instant response
            const data = await apiFetch(`/admin/users/targetable`);
            setTargetableUsers(data);
        } catch (err) {
            console.error("Failed to fetch targetable users", err);
        } finally {
            setSearching(false);
        }
    };

    // Fetch once when targeted mode is toggled ON
    useEffect(() => {
        if (!formData.is_public && targetableUsers.length === 0) {
            fetchTargetableUsers();
        }
    }, [formData.is_public]);

    const filteredUsersList = targetableUsers.filter(user => {
        // Search Filter
        if (userFilters.search) {
            const s = userFilters.search.toLowerCase();
            const matchesSearch =
                user.name?.toLowerCase().includes(s) ||
                user.mobile_number?.includes(s) ||
                user.business_name?.toLowerCase().includes(s);
            if (!matchesSearch) return false;
        }

        // Min Loan Completed Filter
        if (userFilters.min_loan_completed) {
            const minAmount = parseFloat(userFilters.min_loan_completed);
            if ((user.max_loan_completed || 0) < minAmount) return false;
        }

        // Min Loans Count Filter
        if (userFilters.min_loans_count) {
            const minCount = parseInt(userFilters.min_loans_count);
            if ((user.loans_count || 0) < minCount) return false;
        }

        return true;
    });

    const toggleUser = (userId: number) => {
        const current = [...formData.assigned_user_ids];
        const index = current.indexOf(userId);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(userId);
        }
        setFormData({ ...formData, assigned_user_ids: current });
    };

    const selectAllFiltered = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        const combined = Array.from(new Set([...formData.assigned_user_ids, ...filteredIds]));
        setFormData({ ...formData, assigned_user_ids: combined });
    };

    const deselectAllFiltered = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        const remaining = formData.assigned_user_ids.filter(id => !filteredIds.includes(id));
        setFormData({ ...formData, assigned_user_ids: remaining });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (formData.configurations.length === 0) {
            setError("Please add at least one tenure configuration.");
            setSubmitting(false);
            return;
        }

        try {
            await apiFetch(`/admin/loan-plans/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...formData,
                    amount: Number(formData.amount),
                    configurations: formData.configurations.map(c => ({
                        ...c,
                        tenure_days: Number(c.tenure_days),
                        interest_rate: Number(c.interest_rate || 0),
                        interest_rates: Object.fromEntries(
                            Object.entries(c.interest_rates || {}).map(([k, v]) => [k, Number(v)])
                        ),
                        fees: (c.fees || []).map(f => ({ ...f, amount: Number(f.amount) }))
                    }))
                })
            });

            router.push('/loan-plans');
        } catch (err: any) {
            setError(err.message || 'Failed to update plan');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <AdminLayout title="Edit Loan Plan"><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout title="Edit Loan Plan">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="mb-4 text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold">
                    <ArrowLeft size={16} /> Back to Plans
                </button>

                <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Loan Plan</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Top Level Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Basic Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Loan Amount</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color Theme</label>
                                <select
                                    value={formData.plan_color}
                                    onChange={(e) => setFormData({ ...formData, plan_color: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                >
                                    <option value="bg-indigo-500">Indigo (Default)</option>
                                    <option value="bg-blue-500">Blue</option>
                                    <option value="bg-sky-500">Sky Blue</option>
                                    <option value="bg-cyan-500">Cyan</option>
                                    <option value="bg-teal-500">Teal</option>
                                    <option value="bg-emerald-500">Emerald</option>
                                    <option value="bg-lime-500">Lime</option>
                                    <option value="bg-yellow-500">Yellow</option>
                                    <option value="bg-amber-500">Amber</option>
                                    <option value="bg-orange-500">Orange</option>
                                    <option value="bg-rose-500">Rose Red</option>
                                    <option value="bg-pink-500">Pink</option>
                                    <option value="bg-fuchsia-500">Fuchsia</option>
                                    <option value="bg-purple-500">Purple</option>
                                    <option value="bg-violet-500">Violet</option>
                                    <option value="bg-slate-900">Dark</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Badge Text (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.tag_text}
                                    onChange={(e) => setFormData({ ...formData, tag_text: e.target.value })}
                                    placeholder="e.g. Popular, Best Value"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenure Display Type</label>
                                <select
                                    value={formData.tenure_type}
                                    onChange={(e) => setFormData({ ...formData, tenure_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                >
                                    <option value="months">Months (Rounded)</option>
                                    <option value="decimal">Months (Decimal)</option>
                                    <option value="days">Exact Days</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tenure Configurations */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">Tenure Configurations</h3>
                            <button type="button" onClick={addConfiguration} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition">
                                + Add Tenure Variant
                            </button>
                        </div>

                        {formData.configurations.map((config, idx) => {
                            const totalFees = config.fees.reduce((acc, fee) => acc + (Number(fee.amount) || 0), 0);
                            const estimatedGst = Math.round(totalFees * ((config.gst_rate ?? 18) / 100));

                            return (
                                <div key={idx} className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeConfig(idx)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="md:col-span-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="block text-xs font-bold text-slate-500 uppercase">Tenure (Days)</label>
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tight">
                                                    {formatTenure(config.tenure_days, formData.tenure_type)}
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                value={config.tenure_days}
                                                onChange={(e) => updateConfig(idx, 'tenure_days', parseInt(e.target.value))}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Rate (%)</label>
                                            <input
                                                type="number"
                                                value={config.gst_rate ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                    updateConfig(idx, 'gst_rate', val);
                                                }}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                                                placeholder="18"
                                            />
                                        </div>
                                    </div>

                                    {/* Frequencies */}
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Allowed Frequencies & Cashback</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {['DAILY', 'WEEKLY', 'MONTHLY', '15_DAYS', ...(config.allowed_frequencies || []).filter(f => !['DAILY', 'WEEKLY', 'MONTHLY', '15_DAYS'].includes(f))].map(freq => (
                                                <div key={freq} className={`p-3 rounded-lg border ${config.allowed_frequencies.includes(freq) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={config.allowed_frequencies.includes(freq)}
                                                                onChange={(e) => {
                                                                    const current = config.allowed_frequencies;
                                                                    const newFreqs = e.target.checked
                                                                        ? [...current, freq]
                                                                        : current.filter(f => f !== freq);
                                                                    updateConfig(idx, 'allowed_frequencies', newFreqs);
                                                                }}
                                                                className="w-4 h-4 text-indigo-600 rounded"
                                                            />
                                                            <span className="text-sm font-bold text-slate-700">{freq.replace('_', ' ')}</span>
                                                        </label>
                                                    </div>

                                                    {config.allowed_frequencies.includes(freq) && (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-slate-400 block">Int. Rate (%/mo)</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                    value={config.interest_rates[freq] ?? config.interest_rate}
                                                                    onChange={(e) => {
                                                                        const newRates = { ...config.interest_rates, [freq]: parseFloat(e.target.value) };
                                                                        updateConfig(idx, 'interest_rates', newRates);
                                                                    }}
                                                                    className="w-full px-2 py-1 text-sm border-b border-slate-300 bg-transparent focus:outline-none focus:border-indigo-500 font-bold"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-slate-400 block">Cashback (₹)</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={config.cashback[freq] || 0}
                                                                    onChange={(e) => {
                                                                        const newCb = { ...config.cashback, [freq]: parseFloat(e.target.value) };
                                                                        updateConfig(idx, 'cashback', newCb);
                                                                    }}
                                                                    className="w-full px-2 py-1 text-sm border-b border-slate-300 bg-transparent focus:outline-none focus:border-indigo-500 font-bold"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Custom Frequency Adder */}
                                            <div className="p-3 rounded-lg border border-dashed border-slate-300 flex flex-col justify-center items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">Add Custom Days</span>
                                                <div className="flex gap-1 w-full">
                                                    <input
                                                        type="number"
                                                        placeholder="Days"
                                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm font-bold"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const val = parseInt(e.currentTarget.value);
                                                                if (val > 0) {
                                                                    const newFreq = `${val} DAYS`;
                                                                    if (!config.allowed_frequencies.includes(newFreq)) {
                                                                        updateConfig(idx, 'allowed_frequencies', [...config.allowed_frequencies, newFreq]);
                                                                    }
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-400 text-center">Type & Enter (e.g. 13)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Fees */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Fee Structure</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFees = [...config.fees, { name: '', amount: 0 }];
                                                    updateConfig(idx, 'fees', newFees);
                                                }}
                                                className="text-indigo-600 text-xs font-bold hover:underline"
                                            >
                                                + Add Fee Field
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {config.fees.map((fee, feeIdx) => (
                                                <div key={feeIdx} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Fee Name (e.g. Insurance)"
                                                        value={fee.name}
                                                        onChange={(e) => {
                                                            const newFees = [...config.fees];
                                                            newFees[feeIdx].name = e.target.value;
                                                            updateConfig(idx, 'fees', newFees);
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={fee.amount}
                                                        onChange={(e) => {
                                                            const newFees = [...config.fees];
                                                            newFees[feeIdx].amount = parseFloat(e.target.value);
                                                            updateConfig(idx, 'fees', newFees);
                                                        }}
                                                        className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newFees = config.fees.filter((_, i) => i !== feeIdx);
                                                            updateConfig(idx, 'fees', newFees);
                                                        }}
                                                        className="text-red-400 hover:text-red-500 px-2"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary Display */}
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-600 mt-4">
                                        <span>Total Fees: ₹{totalFees}</span>
                                        <span>+ Est. GST ({config.gst_rate ?? 18}%): ₹{isNaN(estimatedGst) ? 0 : estimatedGst}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {formData.configurations.length === 0 && (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No tenure configurations found.</p>
                                <p className="text-sm text-slate-400">This plan is missing tenure details.</p>
                            </div>
                        )}
                    </div>

                    {/* Targeting Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-700">Targeting & Visibility</h3>
                                <p className="text-xs font-medium text-slate-400">Control who can see and apply for this loan plan.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.is_public ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {formData.is_public ? 'Global (All Users)' : 'Targeted (Specific Users)'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_public ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_public ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Lock Feature Toggle */}
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                                <h4 className="text-sm font-bold text-slate-700">Lock for all users?</h4>
                                <p className="text-[11px] font-medium text-slate-400">If locked, users will see the plan but won't be able to apply.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.is_locked ? 'text-amber-500' : 'text-slate-400'}`}>
                                    {formData.is_locked ? 'Locked' : 'Unlocked'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_locked: !formData.is_locked })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_locked ? 'bg-amber-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_locked ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {!formData.is_public && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                {/* WhatsApp Style Search Bar */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={userFilters.search}
                                        onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold pl-12 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                                        placeholder="Search by name, mobile number or business..."
                                    />
                                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>

                                {/* Mini Filters Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mx-1">Min Loan Completed (₹)</label>
                                        <input
                                            type="number"
                                            value={userFilters.min_loan_completed}
                                            onChange={(e) => setUserFilters({ ...userFilters, min_loan_completed: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-bold"
                                            placeholder="Filter by amount..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mx-1">Min Loans Count</label>
                                        <input
                                            type="number"
                                            value={userFilters.min_loans_count}
                                            onChange={(e) => setUserFilters({ ...userFilters, min_loans_count: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-bold"
                                            placeholder="Filter by count..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                                {filteredUsersList.length} Users Listed
                                            </span>
                                            <span className="text-[10px] font-bold text-indigo-500">
                                                {formData.assigned_user_ids.length} Total Selected
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

                                    <div className="max-h-[400px] overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-sm custom-scrollbar scroll-smooth">
                                        {searching ? (
                                            <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Fetching users...</div>
                                        ) : filteredUsersList.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {filteredUsersList.map(user => (
                                                    <div
                                                        key={user.id}
                                                        onClick={() => toggleUser(user.id)}
                                                        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-all ${formData.assigned_user_ids.includes(user.id) ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${formData.assigned_user_ids.includes(user.id) ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                                                {user.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-800">{user.name}</h4>
                                                                <p className="text-[11px] text-slate-500 font-bold tracking-tight">{user.mobile_number} {user.business_name && <span className="text-slate-300 mx-1">|</span>} {user.business_name}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${formData.assigned_user_ids.includes(user.id) ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-md' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                                            {formData.assigned_user_ids.includes(user.id) && (
                                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 text-center">
                                                <p className="text-slate-400 font-bold">No users found matching your criteria</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold">{error}</div>}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition disabled:opacity-50"
                        >
                            {submitting ? 'Updating...' : 'Update Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
