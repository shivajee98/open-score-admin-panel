'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CashbackSetting {
    id: number;
    role: 'CUSTOMER' | 'MERCHANT' | 'STUDENT';
    cashback_amount: number;
    is_active: boolean;
}

export default function CashbackSettingsPage() {
    const [settings, setSettings] = useState<CashbackSetting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiFetch('/admin/cashback-settings');
            setSettings(data);
        } catch (e) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (role: string, amount: number) => {
        try {
            await apiFetch(`/admin/cashback-settings/${role.toLowerCase()}`, {
                method: 'PUT',
                body: JSON.stringify({ cashback_amount: amount })
            });
            toast.success('Settings updated successfully');
            fetchSettings();
        } catch (e) {
            toast.error('Error updating setting');
        }
    };

    return (
        <AdminLayout title="System Configurations">
            <div className="max-w-4xl space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Signup Bonus Settings</h2>
                            <p className="text-slate-500 text-sm font-medium">Configure global cashback amounts for new registrations.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {settings.map((setting) => (
                                <div key={setting.id} className="group bg-slate-50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${setting.role === 'MERCHANT' ? 'bg-amber-100 text-amber-600' : setting.role === 'STUDENT' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {setting.role[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{setting.role} ONBOARDING</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Default Bonus</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-32 focus:ring-4 focus:ring-indigo-100 outline-none font-black text-slate-900 transition-all"
                                                    value={setting.cashback_amount}
                                                    onChange={(e) => {
                                                        const newSettings = settings.map(s =>
                                                            s.id === setting.id
                                                                ? { ...s, cashback_amount: parseFloat(e.target.value) || 0 }
                                                                : s
                                                        );
                                                        setSettings(newSettings);
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleUpdate(setting.role, setting.cashback_amount)}
                                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                            >
                                                <Save size={18} />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">Important Note</h4>
                        <p className="text-sm text-amber-700 font-medium leading-relaxed">
                            These settings define the default welcome bonus for users who register without a specific referral link.
                            Users referred by Agents (Sub-Users) will receive the bonus amount defined in that specific Agent's profile.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
