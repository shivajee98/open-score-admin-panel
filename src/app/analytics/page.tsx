'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    TrendingUp, TrendingDown, ArrowRight, Activity,
    PieChart as IconPieChart, BarChart as IconBarChart, DollarSign,
    Users as IconUsers, Target, Zap
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
    Area,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Intelligence Core">
            {/* Top Stats - Quick Read */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <Zap className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth Index</p>
                    <p className="text-2xl font-black text-slate-900">+{data.loan_performance.approval_rate.toFixed(1)}%</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Avg Ticket</p>
                    <p className="text-2xl font-black text-slate-900">₹{Math.round(data.loan_performance.average_loan_size).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                        <Target className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Risk Rate</p>
                    <p className="text-2xl font-black text-rose-500">{data.loan_performance.default_rate}%</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <IconUsers className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Ops</p>
                    <p className="text-2xl font-black text-slate-900">{data.loan_performance.total_applications}</p>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                {/* Money Flow - Left Column */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Transactional Capital Mapping
                    </h3>

                    <div className="flex flex-col md:flex-row items-stretch gap-6 mb-10">
                        <div className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Inflow</span>
                            <p className="text-2xl font-black text-slate-900 mt-1">₹{parseFloat(data.money_flow.admin_to_users).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <ArrowRight className="w-6 h-6 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex-1 p-6 bg-blue-50/50 border border-blue-100 rounded-3xl text-center">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">User Loop</span>
                            <p className="text-2xl font-black text-slate-900 mt-1">₹{parseFloat(data.money_flow.users_to_merchants).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center justify-center">
                            <ArrowRight className="w-6 h-6 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex-1 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Recovered</span>
                            <p className="text-2xl font-black text-slate-900 mt-1">₹{parseFloat(data.money_flow.users_to_admin).toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsAreaChart data={data.user_growth}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                            </RechartsAreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Pie - Right Column */}
                <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 mb-8">Role Distribution</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={data.user_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.user_distribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                        {data.user_distribution.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{item.name}</span>
                                <span className="font-black text-slate-900">{item.value} Users</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row - Bar Chart */}
            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-indigo-200/50 mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
                    <Zap className="w-64 h-64 text-indigo-400 rotate-12" />
                </div>

                <div className="relative z-10">
                    <h3 className="text-xl font-black text-white mb-2">30-Day Liquidity Index</h3>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Daily transaction volume processed through the system.</p>

                    <div className="h-[300px] w-full mt-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={data.daily_volume}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(val) => new Date(val).getDate().toString()}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', background: '#1e293b', color: '#fff' }}
                                />
                                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={20} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
