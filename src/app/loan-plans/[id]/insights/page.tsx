'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { ArrowLeft, Users, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function LoanPlanInsights() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const loadInsights = async () => {
            try {
                const res = await apiFetch(`/admin/loan-plans/${id}/insights`);
                setData(res);
            } catch (error) {
                console.error('Failed to load insights', error);
                alert('Failed to load insights');
            } finally {
                setLoading(false);
            }
        };
        loadInsights();
    }, [id]);

    if (loading) {
        return (
            <AdminLayout title="Plan Insights">
                <div className="flex justify-center items-center h-96">
                    <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!data) return null;

    const { plan, stats } = data;

    return (
        <AdminLayout title={`${plan.name} Insights`}>
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Plans
                </button>

                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-2 h-8 rounded-full ${plan.plan_color || 'bg-slate-200'}`}></div>
                            <h2 className="text-3xl font-black text-slate-900">{plan.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${plan.deleted_at ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {plan.deleted_at ? 'Archived' : 'Active'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium">
                            {plan.tag_text} • ₹{parseFloat(plan.amount).toLocaleString()} • {plan.configurations?.length} Tenure Options
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{plan.loans_count}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Applications</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{plan.active_loans_count}</p>
                    <p className="text-sm font-medium text-emerald-600 mt-1">Currently Active</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Wallet size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Disbursed</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">₹{(stats.total_disbursed / 1000).toFixed(1)}k</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Total Volume</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                            <AlertCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defaults</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{plan.defaulted_loans_count}</p>
                    <p className="text-sm font-medium text-rose-600 mt-1">Needs Attention</p>
                </div>
            </div>

            {/* Detailed Config View */}
            <h3 className="text-xl font-bold text-slate-900 mb-6">Configuration Details</h3>
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Tenure</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Interest</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Frequencies</th>
                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Extra Fees</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {plan.configurations?.map((config: any, index: number) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                                <td className="p-6 font-bold text-slate-900">{config.tenure_days} Days</td>
                                <td className="p-6 font-medium text-slate-600">{config.interest_rate}%</td>
                                <td className="p-6">
                                    <div className="flex gap-2 flex-wrap">
                                        {config.allowed_frequencies.map((f: string) => (
                                            <span key={f} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">{f}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-slate-500">
                                    {config.fees?.length > 0 ? (
                                        config.fees.map((fee: any, i: number) => (
                                            <div key={i}>{fee.name}: ₹{fee.amount}</div>
                                        ))
                                    ) : 'None'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
