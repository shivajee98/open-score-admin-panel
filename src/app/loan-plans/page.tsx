'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoanPlansList() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/loan-plans');
            setPlans(data);
        } catch (error) {
            console.error('Failed to load plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to deactivate this plan?')) return;
        try {
            await apiFetch(`/admin/loan-plans/${id}`, { method: 'DELETE' });
            loadPlans();
        } catch (e) {
            alert('Failed to delete plan');
        }
    };

    return (
        <AdminLayout title="Loan Configurations">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Loan Plans</h2>
                    <p className="text-slate-500 text-sm font-medium">Manage amounts, tenures, and fees.</p>
                </div>
                <Link href="/loan-plans/create" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Plus size={16} /> Create New Plan
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Name</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Tenure</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Stats</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {plans.map((plan: any) => (
                                <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-12 rounded-full ${plan.plan_color || 'bg-slate-200'}`}></div>
                                            <div>
                                                <p className="font-bold text-slate-900">{plan.name}</p>
                                                <p className="text-xs font-medium text-slate-500">{plan.tag_text || 'Standard'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="font-black text-slate-900">₹ {parseFloat(plan.amount).toLocaleString()}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="font-bold text-slate-700">{plan.tenure_days} Days</p>
                                        <p className="text-xs text-slate-400">{plan.interest_rate}% Interest</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            {plan.is_active ?
                                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Active</span> :
                                                <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Inactive</span>
                                            }
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => router.push(`/loan-plans/edit/${plan.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(plan.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
