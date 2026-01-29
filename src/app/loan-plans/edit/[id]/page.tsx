'use client';
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
    interest_rate: number;
    fees: FeeConfig[];
    allowed_frequencies: string[];
    cashback: Record<string, number>;
}

export default function EditLoanPlan() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        plan_color: 'bg-indigo-500',
        tag_text: '',
        configurations: [] as TenureConfig[]
    });

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

                setFormData({
                    name: plan.name,
                    amount: plan.amount,
                    plan_color: plan.plan_color,
                    tag_text: plan.tag_text || '',
                    configurations: configs
                });
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
                    fees: [{ name: 'Processing Fee', amount: 0 }],
                    allowed_frequencies: ['MONTHLY'],
                    cashback: {}
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
                        interest_rate: Number(c.interest_rate),
                        fees: c.fees.map(f => ({ ...f, amount: Number(f.amount) }))
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
                                    <option value="bg-emerald-500">Emerald</option>
                                    <option value="bg-purple-500">Purple</option>
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

                        {formData.configurations.map((config, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm relative group">
                                <button
                                    type="button"
                                    onClick={() => removeConfig(idx)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tenure (Days)</label>
                                        <input
                                            type="number"
                                            value={config.tenure_days}
                                            onChange={(e) => updateConfig(idx, 'tenure_days', parseInt(e.target.value))}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interest Rate (%/month)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={config.interest_rate}
                                            onChange={(e) => updateConfig(idx, 'interest_rate', parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                {/* Frequencies */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Allowed Frequencies & Cashback</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['DAILY', 'WEEKLY', 'MONTHLY', '15_DAYS'].map(freq => (
                                            <div key={freq} className={`p-3 rounded-lg border ${config.allowed_frequencies.includes(freq) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
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

                                                {config.allowed_frequencies.includes(freq) && (
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-slate-400">Cashback</label>
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
                                                )}
                                            </div>
                                        ))}
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
                            </div>
                        ))}

                        {formData.configurations.length === 0 && (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500">No tenure configurations found.</p>
                                <p className="text-sm text-slate-400">This plan is missing tenure details.</p>
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
