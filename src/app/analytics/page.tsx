'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    TrendingUp, TrendingDown, ArrowRight, Activity,
    PieChart as IconPieChart, BarChart as IconBarChart, DollarSign
} from 'lucide-react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart as RechartsAreaChart,
    Area
} from 'recharts';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const res = await apiFetch('/admin/analytics/deep');
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <AdminLayout title="Deep Analytics">
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Financial Intelligence">
            {/* Money Flow Overview */}
            <div className="mb-10">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Capital Flow Map
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    {/* Source: Admin */}
                    <div className="flex flex-col items-center p-6 bg-slate-50 border border-slate-100 rounded-3xl relative">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Inflow</span>
                        <span className="text-2xl font-black text-slate-900">₹{parseFloat(data.money_flow.admin_to_users).toLocaleString('en-IN')}</span>
                        <div className="mt-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">
                            Disbursed & Credits
                        </div>

                        {/* Connection Line */}
                        <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                            <ArrowRight className="w-6 h-6 text-slate-300" />
                        </div>
                    </div>

                    {/* Node: Users */}
                    <div className="flex flex-col items-center p-6 bg-blue-50/50 border border-blue-100 rounded-3xl relative">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">User Volume</span>
                        <div className="space-y-4 w-full">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-600">To Merchants</span>
                                <span className="font-black text-slate-900">₹{parseFloat(data.money_flow.users_to_merchants).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-600">Repayment</span>
                                <span className="font-black text-slate-900">₹{parseFloat(data.money_flow.users_to_admin).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Connection Line */}
                        <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                            <ArrowRight className="w-6 h-6 text-slate-300" />
                        </div>
                    </div>

                    {/* Sink: Merchants/Admin */}
                    <div className="flex flex-col items-center p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">System Value</span>
                        <span className="text-2xl font-black text-slate-900">
                            ₹{parseFloat(data.money_flow.merchants_out).toLocaleString('en-IN')} {/* Using withdrawals as 'realized' value */}
                        </span>
                        <div className="mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                            Merchant Withdrawals
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Loan Performance Stats */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Loan Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Applications</p>
                            <p className="text-xl font-black text-slate-900">{data.loan_performance.total_applications}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Approval Rate</p>
                            <p className="text-xl font-black text-slate-900">{data.loan_performance.approval_rate.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Loan Size</p>
                            <p className="text-xl font-black text-slate-900">₹{Math.round(data.loan_performance.average_loan_size).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Default Rate</p>
                            <p className="text-xl font-black text-rose-500">{data.loan_performance.default_rate}%</p>
                        </div>
                    </div>
                </div>

                {/* User Growth Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        User Growth
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsAreaChart data={data.user_growth}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                            </RechartsAreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Transaction Volume */}
            <div className="mt-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6">30-Day Transaction Volume</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={data.daily_volume}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(val) => new Date(val).getDate().toString()} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </AdminLayout>
    );
}
