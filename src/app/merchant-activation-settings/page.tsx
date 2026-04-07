'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { Settings, Save, AlertCircle, ShieldCheck, CreditCard, Users, Hash } from 'lucide-react';

export default function MerchantActivationSettingsPage() {
    const [settings, setSettings] = useState({
        qr_reward_min_tx_count: 0,
        qr_reward_min_amount: 0,
        qr_reward_min_unique_payers: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
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
            <div className="max-w-4xl space-y-6">
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
        </AdminLayout>
    );
}
