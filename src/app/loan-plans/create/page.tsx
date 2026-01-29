'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function CreateLoanPlan() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        tenure_days: '',
        interest_rate: '0',
        processing_fee: '0',
        application_fee: '0',
        other_fee: '0',
        repayment_frequency: 'MONTHLY',
        cashback_amount: '0',
        plan_color: 'bg-blue-500',
        tag_text: '',
        is_active: true
    });

    const handleChange = (e: any) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/admin/loan-plans', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('Plan created successfully!');
            router.push('/loan-plans');
        } catch (error: any) {
            alert(error.message || 'Failed to create plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Create Loan Plan">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => router.back()} className="mb-4 text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold">
                    <ArrowLeft size={16} /> Back to Plans
                </button>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900 mb-6">New Plan Construct</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Plan Name</label>
                                <input name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900" placeholder="e.g. Gold Credit" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Loan Amount (₹)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tenure (Days)</label>
                                <input type="number" name="tenure_days" value={formData.tenure_days} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Interest Rate (%/month)</label>
                                <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Repayment Freq</label>
                                <select name="repayment_frequency" value={formData.repayment_frequency} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900">
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Fees Structure</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Processing</label>
                                    <input type="number" name="processing_fee" value={formData.processing_fee} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Login/App Fee</label>
                                    <input type="number" name="application_fee" value={formData.application_fee} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Other/Field</label>
                                    <input type="number" name="other_fee" value={formData.other_fee} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Appearance & Extras</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Color Class</label>
                                    <select name="plan_color" value={formData.plan_color} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 text-sm">
                                        <option value="bg-blue-500">Blue</option>
                                        <option value="bg-emerald-500">Emerald</option>
                                        <option value="bg-purple-500">Purple</option>
                                        <option value="bg-indigo-500">Indigo</option>
                                        <option value="bg-rose-500">Rose</option>
                                        <option value="bg-amber-500">Amber</option>
                                        <option value="bg-slate-900">Black</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tag Text</label>
                                    <input name="tag_text" value={formData.tag_text} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 text-sm" placeholder="e.g. Best Value" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cashback (₹)</label>
                                    <input type="number" name="cashback_amount" value={formData.cashback_amount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 text-sm" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-base shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all">
                            {loading ? 'Creating...' : 'Create Plan'}
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
