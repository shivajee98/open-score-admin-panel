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

    const { sections, moneyFlow } = data;

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

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Capital Mapping Flow
                        </h3>
                        <div className="flex flex-col md:flex-row items-stretch gap-6">
                            <FlowCard label="Admin Inflow" value={moneyFlow.admin_to_users} color="slate" />
                            <ArrowRight className="w-6 h-6 text-slate-300 self-center hidden md:block" />
                            <FlowCard label="User Loop" value={moneyFlow.users_to_merchants} color="blue" />
                            <ArrowRight className="w-6 h-6 text-slate-300 self-center hidden md:block" />
                            <FlowCard label="Recovered" value={moneyFlow.users_to_admin} color="emerald" />
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
                </div>
            )}

            {/* 3. MERCHANTS TAB */}
            {activeTab === 'MERCHANTS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 mb-6">Top Merchant Concentration</h3>
                        <div className="overflow-x-auto">
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
                    </div>
                </div>
            )}

            {/* 4. FRAUD TAB */}
            {activeTab === 'FRAUD' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
                        <h3 className="text-lg font-black text-rose-900 mb-2">Abuse Signals</h3>
                        <p className="text-rose-600/70 text-sm font-bold mb-8">Detected anomalies requiring review.</p>
                        <div className="space-y-4">
                            <FraudItem label="Circular Loops" count={sections.fraud.circular_loops} />
                            <FraudItem label="Velocity Spikes" count={sections.fraud.velocity_anomalies} />
                            <FraudItem label="Cluster Rings" count={sections.fraud.suspicious_clusters} />
                        </div>
                    </div>
                </div>
            )}

            {/* 5. SYSTEM TAB */}
            {activeTab === 'SYSTEM' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StatCard label="Throughput" value={`${sections.health.tx_sec} TPS`} sub="Avg Load" icon={<Server className="w-5 h-5 text-indigo-500" />} />
                    <StatCard label="P95 Latency" value={sections.health.p95_latency} sub="Network lag" icon={<Activity className="w-5 h-5 text-slate-500" />} />
                    <StatCard label="Error Rate" value={`${sections.health.failed_tx_rate}%`} sub="Transaction failures" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} />
                </div>
            )}

            {/* 6. ECONOMICS TAB */}
            {activeTab === 'ECONOMICS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StatCard label="Rev Per ₹100" value={`₹${sections.economics.rev_per_100}`} sub="Gross Yield" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
                    <StatCard label="Net Yield" value={`${sections.economics.net_yield}%`} sub="After defaults" icon={<Target className="w-5 h-5 text-blue-500" />} />
                    <StatCard label="CAC" value={`₹${sections.economics.cac}`} sub="Cost of Acquisition" icon={<IconUsers className="w-5 h-5 text-slate-500" />} />
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
