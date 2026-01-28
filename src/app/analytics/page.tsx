'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    Activity, ArrowRight, ShieldAlert,
    Users as IconUsers, Target, Zap, TrendingUp, AlertTriangle, Layers, CreditCard, Server, BarChart3
} from 'lucide-react';
import {
    BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart as RechartsAreaChart, Area
} from 'recharts';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('LIQUIDITY');

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
            <AdminLayout title="Intelligence Core">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Calibrating Decision Engine...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const { sections, money_flow: moneyFlow } = data;

    const tabs = [
        { id: 'LIQUIDITY', label: 'Liquidity & Capital', icon: <Activity className="w-4 h-4" /> },
        { id: 'RISK', label: 'Risk Engine', icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'MERCHANTS', label: 'Merchant Intel', icon: <IslandsIcon className="w-4 h-4" /> },
        { id: 'FRAUD', label: 'Fraud & Abuse', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'ECONOMICS', label: 'Unit Economics', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'SYSTEM', label: 'System Health', icon: <Server className="w-4 h-4" /> },
    ];

    return (
        <AdminLayout title="Decision Engine">
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}

            {/* 1. LIQUIDITY TAB */}
            {activeTab === 'LIQUIDITY' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard label="Capital Velocity (CRS)" value={`${sections.liquidity.crs_days} Days`} sub="Avg rotation cycle" icon={<Zap className="w-5 h-5 text-amber-500" />} />
                        <StatCard label="Idle Capital" value={`${sections.liquidity.idle_capital_percent}%`} sub="Stagnant efficiency" icon={<Layers className="w-5 h-5 text-slate-500" />} />
                        <StatCard label="Liquidity Half-Life" value={`${sections.liquidity.liquidity_half_life} Days`} sub="Return cycle" icon={<Activity className="w-5 h-5 text-blue-500" />} />
                        <StatCard label="Runway (Stress Test)" value={`${sections.liquidity.stress_test.repayment_drop_20.runway_days} Days`} sub="If repayment drops 20%" icon={<AlertTriangle className="w-5 h-5 text-rose-500" />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6 pl-2">Liquidity Projection (30 Days)</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsAreaChart data={[
                                        { day: '1', level: 85 }, { day: '5', level: 82 }, { day: '10', level: 90 },
                                        { day: '15', level: 75 }, { day: '20', level: 88 }, { day: '25', level: 95 },
                                        { day: '30', level: 80 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLevel)" />
                                    </RechartsAreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" />
                                Capital Flow
                            </h3>
                            <div className="space-y-6">
                                <FlowCard label="Admin Inflow" value={moneyFlow.admin_to_users} color="slate" />
                                <FlowCard label="User Loop" value={moneyFlow.users_to_merchants} color="blue" />
                                <FlowCard label="Recovered" value={moneyFlow.users_to_admin} color="emerald" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. RISK TAB */}
            {activeTab === 'RISK' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="D+1 Delinquency" value={sections.risk.delinquency.d_1} sub="Immediate attention" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} />
                        <StatCard label="D+30 Default Risk" value={sections.risk.delinquency.d_30} sub="Likely write-off" icon={<ShieldAlert className="w-5 h-5 text-rose-500" />} />
                        <StatCard label="Approval Rate" value={`${sections.risk.approval_rate.toFixed(1)}%`} sub="Funnel strictness" icon={<Target className="w-5 h-5 text-emerald-500" />} />
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6 pl-2">Risk Distribution & Delinquency Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={[
                                    { name: 'D+1', value: sections.risk.delinquency.d_1 },
                                    { name: 'D+7', value: sections.risk.delinquency.d_7 },
                                    { name: 'D+30', value: sections.risk.delinquency.d_30 },
                                    { name: 'Written Off', value: Math.floor(sections.risk.delinquency.d_30 * 0.5) },
                                ]} barSize={60}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#f43f5e" radius={[8, 8, 8, 8]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. MERCHANTS TAB */}
            {activeTab === 'MERCHANTS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Top Merchant Concentration</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4 rounded-l-xl">Merchant Name</th>
                                            <th className="p-4">Est. GMV</th>
                                            <th className="p-4 rounded-r-xl text-right">Risk Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sections.merchants.top.map((m: any, i: number) => (
                                            <tr key={i}>
                                                <td className="p-4 font-bold text-slate-900">{m.name}</td>
                                                <td className="p-4 font-mono text-slate-600">₹{m.gmv.toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-1 rounded text-xs font-black ${m.risk_score > 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {m.risk_score}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Risk Distribution</h4>
                                <div className="relative w-40 h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={sections.merchants.top} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" hide />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="risk_score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={8} background={{ fill: '#e2e8f0', radius: 4 }} />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-slate-400 mt-4">Merchant Risk Scores Viz</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. FRAUD TAB */}
            {activeTab === 'FRAUD' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
                            <h3 className="text-lg font-black text-rose-900 mb-2">Abuse Signals</h3>
                            <p className="text-rose-600/70 text-sm font-bold mb-8">Detected anomalies requiring review.</p>
                            <div className="space-y-4">
                                <FraudItem label="Circular Loops" count={sections.fraud.circular_loops} />
                                <FraudItem label="Velocity Spikes" count={sections.fraud.velocity_anomalies} />
                                <FraudItem label="Cluster Rings" count={sections.fraud.suspicious_clusters} />
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 mb-6">Anomaly Heatmap (Simulated)</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsAreaChart data={[
                                        { time: '00:00', anomalies: 2 }, { time: '04:00', anomalies: 1 },
                                        { time: '08:00', anomalies: 5 }, { time: '12:00', anomalies: 12 },
                                        { time: '16:00', anomalies: 8 }, { time: '20:00', anomalies: 4 },
                                        { time: '23:59', anomalies: 3 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="step" dataKey="anomalies" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorFraud)" />
                                    </RechartsAreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. SYSTEM TAB */}
            {activeTab === 'SYSTEM' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard label="Throughput" value={`${sections.health.tx_sec} TPS`} sub="Avg Load" icon={<Server className="w-5 h-5 text-indigo-500" />} />
                        <StatCard label="P95 Latency" value={sections.health.p95_latency} sub="Network lag" icon={<Activity className="w-5 h-5 text-slate-500" />} />
                        <StatCard label="Error Rate" value={`${sections.health.failed_tx_rate}%`} sub="Transaction failures" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} />
                        <StatCard label="Peak Hour" value={sections.health.peak_load_hour} sub="Max Stress" icon={<Zap className="w-5 h-5 text-purple-500" />} />
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                        <h3 className="text-lg font-black text-white mb-6">System Load vs Latency</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsAreaChart data={[
                                    { time: '10:00', load: 45, latency: 120 }, { time: '11:00', load: 55, latency: 130 },
                                    { time: '12:00', load: 70, latency: 150 }, { time: '13:00', load: 85, latency: 200 },
                                    { time: '14:00', load: 60, latency: 140 }, { time: '15:00', load: 50, latency: 125 },
                                ]}>
                                    <defs>
                                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }} itemStyle={{ color: '#e2e8f0' }} />
                                    <Area type="monotone" dataKey="load" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                                    <Area type="monotone" dataKey="latency" stroke="#38bdf8" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
                                </RechartsAreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. ECONOMICS TAB */}
            {activeTab === 'ECONOMICS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Rev Per ₹100" value={`₹${sections.economics.rev_per_100}`} sub="Gross Yield" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
                        <StatCard label="Net Yield" value={`${sections.economics.net_yield}%`} sub="After defaults" icon={<Target className="w-5 h-5 text-blue-500" />} />
                        <StatCard label="CAC" value={`₹${sections.economics.cac}`} sub="Cost of Acquisition" icon={<IconUsers className="w-5 h-5 text-slate-500" />} />
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Unit Economics & Margins</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={[
                                    { category: 'Gross Yield', val: 4.5, fill: '#10b981' },
                                    { category: 'Cost of Capital', val: 0.8, fill: '#f59e0b' },
                                    { category: 'OpEx + CAC', val: 1.2, fill: '#64748b' },
                                    { category: 'Defaults', val: sections.risk.default_rate, fill: '#ef4444' },
                                    { category: 'Net Margin', val: sections.economics.net_yield, fill: '#3b82f6' },
                                ]} layout="vertical" barSize={30}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="category" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="val" radius={[0, 6, 6, 0]}>
                                        {/* Colors handled in data */}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}

function StatCard({ label, value, sub, icon }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4">{icon}</div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-900 mb-1">{value}</p>
            <p className="text-[10px] font-bold text-slate-400">{sub}</p>
        </div>
    );
}

function FlowCard({ label, value, color }: any) {
    const colors: any = {
        slate: 'bg-slate-50 border-slate-100 text-slate-900',
        blue: 'bg-blue-50/50 border-blue-100 text-blue-900',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900'
    };
    return (
        <div className={`flex-1 p-6 rounded-3xl text-center border ${colors[color] || colors.slate}`}>
            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">{label}</span>
            <p className="text-2xl font-black mt-1">₹{parseFloat(value).toLocaleString('en-IN')}</p>
        </div>
    );
}

function FraudItem({ label, count }: any) {
    return (
        <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl border border-rose-100">
            <span className="font-bold text-rose-900 text-sm">{label}</span>
            <span className="font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-lg">{count}</span>
        </div>
    );
}

// Icon wrapper for Merchants tab to avoid Lucide collision if any
function IslandsIcon(props: any) {
    return <CreditCard {...props} />;
}
