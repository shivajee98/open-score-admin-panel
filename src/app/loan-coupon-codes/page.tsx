'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Plus, Trash2, ToggleLeft, ToggleRight, Eye, X, Copy, Check } from 'lucide-react';

interface LoanPlan {
    id: number;
    name: string;
    amount: number;
    configurations: any[];
}

interface Coupon {
    id: number;
    code: string;
    name: string | null;
    discount_type: 'flat' | 'percentage';
    discount_value: number;
    max_discount: number | null;
    loan_plan_ids: number[] | null;
    tenure_days: number[] | null;
    frequencies: string[] | null;
    max_uses: number;
    used_count: number;
    max_per_user: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
    usages_count: number;
    plan_details: { id: number; name: string; amount: number }[];
}

export default function LoanCouponCodesPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [plans, setPlans] = useState<LoanPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [viewUsages, setViewUsages] = useState<{ coupon: Coupon; usages: any[] } | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Form state
    const [form, setForm] = useState({
        code: '',
        name: '',
        discount_type: 'flat' as 'flat' | 'percentage',
        discount_value: '',
        max_discount: '',
        loan_plan_ids: [] as number[],
        tenure_days: [] as number[],
        frequencies: [] as string[],
        max_uses: '100',
        max_per_user: '1',
        valid_from: '',
        valid_until: '',
    });
    const [creating, setCreating] = useState(false);

    const fetchCoupons = useCallback(async () => {
        try {
            const data = await apiFetch('/admin/loan-coupons');
            setCoupons(data);
        } catch (e) { console.error(e); }
    }, []);

    const fetchPlans = useCallback(async () => {
        try {
            const data = await apiFetch('/admin/loan-plans');
            setPlans(data);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        Promise.all([fetchCoupons(), fetchPlans()]).finally(() => setLoading(false));
    }, [fetchCoupons, fetchPlans]);

    const handleCreate = async () => {
        if (!form.discount_value) return;
        setCreating(true);
        try {
            await apiFetch('/admin/loan-coupons', {
                method: 'POST',
                body: JSON.stringify({
                    code: form.code || undefined,
                    name: form.name || undefined,
                    discount_type: form.discount_type,
                    discount_value: Number(form.discount_value),
                    max_discount: form.max_discount ? Number(form.max_discount) : undefined,
                    loan_plan_ids: form.loan_plan_ids.length ? form.loan_plan_ids : undefined,
                    tenure_days: form.tenure_days.length ? form.tenure_days : undefined,
                    frequencies: form.frequencies.length ? form.frequencies : undefined,
                    max_uses: Number(form.max_uses) || 100,
                    max_per_user: Number(form.max_per_user) || 1,
                    valid_from: form.valid_from || undefined,
                    valid_until: form.valid_until || undefined,
                }),
            });
            setShowCreate(false);
            setForm({ code: '', name: '', discount_type: 'flat', discount_value: '', max_discount: '', loan_plan_ids: [], tenure_days: [], frequencies: [], max_uses: '100', max_per_user: '1', valid_from: '', valid_until: '' });
            fetchCoupons();
        } catch (e: any) {
            alert(e.message || 'Failed to create coupon');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await apiFetch(`/admin/loan-coupons/${id}/toggle`, { method: 'POST' });
            fetchCoupons();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this coupon permanently?')) return;
        try {
            await apiFetch(`/admin/loan-coupons/${id}`, { method: 'DELETE' });
            fetchCoupons();
        } catch (e) { console.error(e); }
    };

    const handleViewUsages = async (coupon: Coupon) => {
        try {
            const usages = await apiFetch(`/admin/loan-coupons/${coupon.id}/usages`);
            setViewUsages({ coupon, usages });
        } catch (e) { console.error(e); }
    };

    const copyCode = (code: string, id: number) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Extract all unique tenures and frequencies from plans
    const allTenures = Array.from(new Set(plans.flatMap(p => (p.configurations || []).map((c: any) => c.tenure_days)))).sort((a, b) => a - b);
    const allFrequencies = Array.from(new Set(plans.flatMap(p => (p.configurations || []).flatMap((c: any) => c.allowed_frequencies || []))));

    const togglePlan = (planId: number) => {
        setForm(prev => ({
            ...prev,
            loan_plan_ids: prev.loan_plan_ids.includes(planId)
                ? prev.loan_plan_ids.filter(id => id !== planId)
                : [...prev.loan_plan_ids, planId]
        }));
    };

    const toggleTenure = (days: number) => {
        setForm(prev => ({
            ...prev,
            tenure_days: prev.tenure_days.includes(days)
                ? prev.tenure_days.filter(d => d !== days)
                : [...prev.tenure_days, days]
        }));
    };

    const toggleFrequency = (freq: string) => {
        setForm(prev => ({
            ...prev,
            frequencies: prev.frequencies.includes(freq)
                ? prev.frequencies.filter(f => f !== freq)
                : [...prev.frequencies, freq]
        }));
    };

    return (
        <AdminLayout title="Loan Coupon Codes">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Create and manage processing fee discount coupons for loan applications.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Coupon
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Coupons', value: coupons.length },
                        { label: 'Active', value: coupons.filter(c => c.is_active).length },
                        { label: 'Total Uses', value: coupons.reduce((s, c) => s + c.used_count, 0) },
                        { label: 'Exhausted', value: coupons.filter(c => c.used_count >= c.max_uses).length },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Coupons Table */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-300 rounded-full animate-spin border-t-slate-900" /></div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 font-medium">No loan coupons created yet.</div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Code</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Discount</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:table-cell">Plans</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hidden lg:table-cell">Usage</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hidden lg:table-cell">Validity</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map(coupon => (
                                        <tr key={coupon.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-slate-900 tracking-wide">{coupon.code}</span>
                                                    <button onClick={() => copyCode(coupon.code, coupon.id)} className="text-slate-300 hover:text-slate-600 transition-colors">
                                                        {copiedId === coupon.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                                {coupon.name && <p className="text-xs text-slate-400 mt-0.5">{coupon.name}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-900">
                                                    {coupon.discount_type === 'flat' ? `₹${coupon.discount_value}` : `${coupon.discount_value}%`}
                                                </span>
                                                {coupon.discount_type === 'percentage' && coupon.max_discount && (
                                                    <span className="text-xs text-slate-400 ml-1">(max ₹{coupon.max_discount})</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {coupon.plan_details?.length ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {coupon.plan_details.map(p => (
                                                            <span key={p.id} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                                                ₹{Number(p.amount).toLocaleString('en-IN')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-xs text-slate-400">All Plans</span>}
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className={`font-bold ${coupon.used_count >= coupon.max_uses ? 'text-rose-500' : 'text-slate-700'}`}>
                                                    {coupon.used_count}/{coupon.max_uses}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
                                                {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'No Expiry'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${coupon.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleViewUsages(coupon)} className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="View Usages">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleToggle(coupon.id)} className="p-2 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-600 transition-colors" title="Toggle">
                                                        {coupon.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create Coupon Slide-over */}
                {showCreate && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                        <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                                <h3 className="text-lg font-black text-slate-900">Create Loan Coupon</h3>
                                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* Code & Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Code (auto if empty)</label>
                                        <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE50" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-400" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Label</label>
                                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Diwali Offer" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-400" />
                                    </div>
                                </div>

                                {/* Discount Type & Value */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Discount</label>
                                    <div className="flex gap-2">
                                        <div className="flex bg-slate-100 rounded-lg p-0.5">
                                            {(['flat', 'percentage'] as const).map(t => (
                                                <button key={t} onClick={() => setForm(p => ({ ...p, discount_type: t }))} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${form.discount_type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                                                    {t === 'flat' ? '₹ Flat' : '% Percent'}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))} placeholder="Value" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-400" />
                                        {form.discount_type === 'percentage' && (
                                            <input type="number" value={form.max_discount} onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))} placeholder="Max ₹" className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Target Plans */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Target Loan Plans <span className="text-slate-300 normal-case font-medium">(none = all)</span></label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {plans.map(plan => (
                                            <button key={plan.id} onClick={() => togglePlan(plan.id)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${form.loan_plan_ids.includes(plan.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                ₹{Number(plan.amount).toLocaleString('en-IN')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Tenures */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Target Tenures <span className="text-slate-300 normal-case font-medium">(none = all)</span></label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allTenures.map(days => (
                                            <button key={days} onClick={() => toggleTenure(days)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${form.tenure_days.includes(days) ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                {days} days
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Frequencies */}
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Target Frequencies <span className="text-slate-300 normal-case font-medium">(none = all)</span></label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {allFrequencies.map(freq => (
                                            <button key={freq} onClick={() => toggleFrequency(freq)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${form.frequencies.includes(freq) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Usage Limits */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Max Total Uses</label>
                                        <input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-400" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Max Per User</label>
                                        <input type="number" value={form.max_per_user} onChange={e => setForm(p => ({ ...p, max_per_user: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-blue-400" />
                                    </div>
                                </div>

                                {/* Validity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Valid From</label>
                                        <input type="date" value={form.valid_from} onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Valid Until</label>
                                        <input type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                                    </div>
                                </div>

                                <button onClick={handleCreate} disabled={creating || !form.discount_value} className="w-full py-3 bg-slate-900 text-white rounded-lg font-black text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {creating ? 'Creating...' : 'Create Coupon'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Usages Modal */}
                {viewUsages && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setViewUsages(null)} />
                        <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[70vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-slate-900">Usage History</h3>
                                    <p className="text-xs text-slate-400 font-bold">{viewUsages.coupon.code}</p>
                                </div>
                                <button onClick={() => setViewUsages(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-5">
                                {viewUsages.usages.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8 font-medium">No usages recorded yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {viewUsages.usages.map((u: any) => (
                                            <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{u.user?.name || 'User'}</p>
                                                    <p className="text-xs text-slate-400">{u.user?.mobile_number} · Loan #{u.loan?.display_id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-600 text-sm">-₹{Number(u.discount_applied).toLocaleString('en-IN')}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(u.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
