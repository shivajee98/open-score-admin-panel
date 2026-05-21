'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Settings, Save, AlertCircle, ShieldCheck, CreditCard, Users, Hash, UserCheck, Calendar, Briefcase, Search } from 'lucide-react';

export default function MerchantActivationSettingsPage() {
    const [settings, setSettings] = useState({
        qr_reward_min_tx_count: 0,
        qr_reward_min_amount: 0,
        qr_reward_min_unique_payers: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Verified Merchants State
    const [verifiedMerchants, setVerifiedMerchants] = useState<any[]>([]);
    const [merchantsLoading, setMerchantsLoading] = useState(true);
    const [merchantsSearch, setMerchantsSearch] = useState('');
    const [merchantsPage, setMerchantsPage] = useState(1);
    const [merchantsTotal, setMerchantsTotal] = useState(0);

    // Activated Users (Qualified Payers) State
    const [activeSidebarTab, setActiveSidebarTab] = useState<'MERCHANTS' | 'USERS'>('MERCHANTS');
    const [qualifiedPayers, setQualifiedPayers] = useState<any[]>([]);
    const [payersLoading, setPayersLoading] = useState(true);
    const [payersSearch, setPayersSearch] = useState('');
    const [payersPage, setPayersPage] = useState(1);
    const [payersTotal, setPayersTotal] = useState(0);

    useEffect(() => {
        fetchSettings();
        fetchVerifiedMerchants(1, merchantsSearch);
        fetchQualifiedPayers(1, payersSearch);
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiFetch('/admin/system-settings');
            const kv: Record<string, any> = {};
            if (Array.isArray(data)) {
                data.forEach((s: any) => {
                    kv[s.key] = s.value;
                });
            } else if (data && typeof data === 'object') {
                Object.assign(kv, data);
            }
            
            setSettings({
                qr_reward_min_tx_count: Number(kv.qr_reward_min_tx_count) || 0,
                qr_reward_min_amount: Number(kv.qr_reward_min_amount) || 0,
                qr_reward_min_unique_payers: Number(kv.qr_reward_min_unique_payers) || 0
            });
        } catch (e) {
            toast.error('Failed to load merchant activation settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchVerifiedMerchants = async (page = 1, search = '') => {
        setMerchantsLoading(true);
        try {
            const data = await apiFetch(`/admin/verified-merchants?page=${page}&search=${search}`);
            setVerifiedMerchants(data.data || []);
            setMerchantsTotal(data.total || 0);
            setMerchantsPage(data.current_page || 1);
        } catch (e) {
            toast.error('Failed to load verified merchants');
        } finally {
            setMerchantsLoading(false);
        }
    };

    const fetchQualifiedPayers = async (page = 1, search = '') => {
        setPayersLoading(true);
        try {
            const data = await apiFetch(`/admin/qualified-payers?page=${page}&search=${search}`);
            setQualifiedPayers(data.data || []);
            setPayersTotal(data.total || 0);
            setPayersPage(data.current_page || 1);
        } catch (e) {
            toast.error('Failed to load activated users');
        } finally {
            setPayersLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await apiFetch(`/admin/system-settings`, {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        qr_reward_min_tx_count: Number(settings.qr_reward_min_tx_count),
                        qr_reward_min_amount: Number(settings.qr_reward_min_amount),
                        qr_reward_min_unique_payers: Number(settings.qr_reward_min_unique_payers)
                    }
                })
            });
            toast.success('Activation rules updated successfully');
            fetchSettings();
        } catch (e) {
            toast.error('Error updating activation rules');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Activation Rules">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Settings */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Merchant Activation Rules</h2>
                                <p className="text-slate-500 text-sm font-medium">Define transaction thresholds required for a Merchant QR map to become 'Verified' for earnings.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                
                                {/* TX Count */}
                                <div className="group bg-slate-50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-100 text-blue-600">
                                            <Hash size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Minimum Transactions</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Required count of QR payments</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            className="pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-32 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-slate-900 transition-all text-center"
                                            value={settings.qr_reward_min_tx_count}
                                            onChange={(e) => setSettings({...settings, qr_reward_min_tx_count: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                {/* Min Amount */}
                                <div className="group bg-slate-50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-100 text-emerald-600">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Minimum Amount</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total value (₹) of QR payments</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-32 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-slate-900 transition-all"
                                            value={settings.qr_reward_min_amount}
                                            onChange={(e) => setSettings({...settings, qr_reward_min_amount: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                {/* Unique Payers */}
                                <div className="group bg-slate-50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-100 text-amber-600">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Unique Customers</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Distinct payers required</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            className="pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-32 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-slate-900 transition-all text-center"
                                            value={settings.qr_reward_min_unique_payers}
                                            onChange={(e) => setSettings({...settings, qr_reward_min_unique_payers: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                                    >
                                        <Save size={18} />
                                        {saving ? 'Saving...' : 'Save Rules'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex gap-4 shadow-sm">
                        <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">How these rules work</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
                                When an agent maps a QR code to a merchant, the earning is held in an "Unverified" state. The earning will automatically move to the user's available balance to transfer once the merchant receives payments on their QR code that meet or exceed all the thresholds defined here.
                                <br/><br/>
                                Setting a value to <b>0</b> will disable that specific requirement. Setting all to 0 will instantly verify new QR maps unconditionally.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Tabbed Lists */}
                <div className="lg:col-span-5 h-[calc(100vh-140px)] flex flex-col">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
                        
                        {/* Tabs Header */}
                        <div className="p-2 bg-slate-50/50 border-b border-slate-100 flex gap-1">
                            <button
                                onClick={() => setActiveSidebarTab('MERCHANTS')}
                                className={cn(
                                    "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    activeSidebarTab === 'MERCHANTS' 
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <UserCheck size={14} />
                                Verified Merchants
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('USERS')}
                                className={cn(
                                    "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    activeSidebarTab === 'USERS' 
                                        ? "bg-white text-emerald-600 shadow-sm border border-slate-100" 
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <CreditCard size={14} />
                                Activated Users
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-6 border-b border-slate-50 bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                                    {activeSidebarTab === 'MERCHANTS' ? 'Verified Merchants' : 'Qualified Payers (Loan Users)'}
                                </h3>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    activeSidebarTab === 'MERCHANTS' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    {activeSidebarTab === 'MERCHANTS' ? merchantsTotal : payersTotal} Total
                                </div>
                            </div>
                            
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={activeSidebarTab === 'MERCHANTS' ? "Search merchant or agent..." : "Search loan user..."}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                    value={activeSidebarTab === 'MERCHANTS' ? merchantsSearch : payersSearch}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (activeSidebarTab === 'MERCHANTS') {
                                            setMerchantsSearch(val);
                                            fetchVerifiedMerchants(1, val);
                                        } else {
                                            setPayersSearch(val);
                                            fetchQualifiedPayers(1, val);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/20">
                            {activeSidebarTab === 'MERCHANTS' ? (
                                merchantsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Merchants...</p>
                                    </div>
                                ) : verifiedMerchants.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <Users size={32} className="text-slate-200 mb-4" />
                                        <p className="text-slate-900 font-black">No Records</p>
                                    </div>
                                ) : (
                                    verifiedMerchants.map((merchant: any) => (
                                        <div key={merchant.id} className="group p-4 rounded-2xl border border-slate-50 bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-black text-slate-900 leading-none">{merchant.merchant_name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{merchant.business_name || 'Individual Merchant'}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={12} />
                                                    <span className="text-[10px] font-bold">
                                                        {new Date(merchant.verified_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100/50">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Agent</span>
                                                    <p className="text-[10px] font-extrabold text-slate-700 truncate">{merchant.agent_name || 'N/A'}</p>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100/50">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Vendor</span>
                                                    <p className="text-[10px] font-extrabold text-slate-700 truncate">{merchant.vendor_name || 'Direct'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                payersLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Users...</p>
                                    </div>
                                ) : qualifiedPayers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <Users size={32} className="text-slate-200 mb-4" />
                                        <p className="text-slate-900 font-black">No Qualified Users</p>
                                    </div>
                                ) : (
                                    qualifiedPayers.map((user: any) => (
                                        <div key={user.id} className="group p-4 rounded-2xl border border-slate-50 bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-300">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                        {user.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 leading-none">{user.name}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{user.mobile_number}</p>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px] font-black uppercase">
                                                    ACTIVATED
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                        
                        {/* Pagination Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                            <button
                                disabled={activeSidebarTab === 'MERCHANTS' ? (merchantsPage <= 1 || merchantsLoading) : (payersPage <= 1 || payersLoading)}
                                onClick={() => {
                                    if (activeSidebarTab === 'MERCHANTS') {
                                        fetchVerifiedMerchants(merchantsPage - 1, merchantsSearch);
                                    } else {
                                        fetchQualifiedPayers(payersPage - 1, payersSearch);
                                    }
                                }}
                                className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 disabled:opacity-30 transition-all"
                            >
                                Previous
                            </button>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {activeSidebarTab === 'MERCHANTS' ? merchantsPage : payersPage} of {Math.max(1, Math.ceil((activeSidebarTab === 'MERCHANTS' ? merchantsTotal : payersTotal) / 20))}
                            </span>
                            <button
                                disabled={activeSidebarTab === 'MERCHANTS' 
                                    ? (merchantsPage >= Math.ceil(merchantsTotal / 20) || merchantsLoading) 
                                    : (payersPage >= Math.ceil(payersTotal / 20) || payersLoading)
                                }
                                onClick={() => {
                                    if (activeSidebarTab === 'MERCHANTS') {
                                        fetchVerifiedMerchants(merchantsPage + 1, merchantsSearch);
                                    } else {
                                        fetchQualifiedPayers(payersPage + 1, payersSearch);
                                    }
                                }}
                                className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 disabled:opacity-30 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </AdminLayout>
    );
}
