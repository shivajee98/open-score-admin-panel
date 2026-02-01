'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Edit, Trash2, RotateCcw, Users, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoanPlansList() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const router = useRouter();

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/admin/loan-plans?status=${activeTab}`, { cache: 'no-store' });
            setPlans(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load plans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, [activeTab]);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to archive this plan?')) return;
        try {
            await apiFetch(`/admin/loan-plans/${id}`, { method: 'DELETE' });
            loadPlans();
        } catch (e) {
            alert('Failed to archive plan');
        }
    };

    const handleRestore = async (id: number) => {
        if (!confirm('Are you sure you want to restore this plan?')) return;
        try {
            await apiFetch(`/admin/loan-plans/${id}/restore`, { method: 'POST' });
            loadPlans();
        } catch (e) {
            alert('Failed to restore plan');
        }
    };

    return (
        <AdminLayout title="Loan Configurations">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Loan Plans</h2>
                    <p className="text-slate-500 text-sm font-medium">Manage amounts, tenures, and fees.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'active' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'archived' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Archived
                        </button>
                    </div>
                    <Link href="/loan-plans/create" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all">
                        <Plus size={16} /> Create New Plan
                    </Link>
                </div>
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
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Config</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Insights</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                                        No {activeTab} plans found.
                                    </td>
                                </tr>
                            ) : plans.map((plan: any) => (
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
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-slate-700">
                                                {(plan.configurations || []).length} Tenure Options
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5" title="Total Applications">
                                                <Users size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700">{plan.loans_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Active Loans">
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                <span className="text-xs font-bold text-emerald-700">{plan.active_loans_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Defaulted Loans">
                                                <AlertCircle size={14} className="text-red-500" />
                                                <span className="text-xs font-bold text-red-700">{plan.defaulted_loans_count || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/loan-plans/${plan.id}/insights`}>
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Insights">
                                                    <Info size={16} />
                                                </button>
                                            </Link>
                                            {activeTab === 'active' ? (
                                                <>
                                                    <button onClick={() => router.push(`/loan-plans/edit/${plan.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(plan.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Archive">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleRestore(plan.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Restore">
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
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
