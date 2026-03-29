'use client';

import { useState, useEffect } from 'react';
import { Target, Shield, Info, Save, QrCode, Wallet, ChevronRight, AlertCircle, ArrowUpRight, CheckCircle2, Calendar, Coins } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

export default function AgentSettings() {
    const [settings, setSettings] = useState({
        min_qr_onboard_for_transfer: '25',
        min_qr_onboard_for_loan_referral: '50',
        min_merchant_transaction_amount: '0',
        min_merchant_account_days: '0',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await apiFetch('/admin/system-settings');
            const newSettings = { ...settings };
            if (Array.isArray(data)) {
                data.forEach((s: any) => {
                    if (s.key in settings) {
                        newSettings[s.key as keyof typeof settings] = s.value;
                    }
                });
            } else if (typeof data === 'object') {
                 // Handle object response if modified
                 Object.keys(data).forEach(key => {
                    if (key in settings) {
                         newSettings[key as keyof typeof settings] = data[key];
                    }
                 });
            }
            setSettings(newSettings);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: keyof typeof settings) => {
        setSaving(key);
        try {
            await apiFetch('/admin/system-settings', {
                method: 'POST',
                body: JSON.stringify({ 
                    settings: { [key]: settings[key] } 
                }),
            });
            toast.success('Configuration updated successfully');
        } catch (error) {
            toast.error('Failed to update setting');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Agent Setting">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Agent Setting">
            <div className="max-w-6xl mx-auto space-y-12 pb-20">
                {/* Header Section */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Configuration Portal</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Vendor Eligibility Rules</h1>
                    <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Define the operational thresholds and onboarding milestones required for vendors to unlock financial features within the ecosystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Transfer to Wallet Card */}
                    <div className="bg-[#f8fafc] rounded-[2.5rem] p-10 border border-slate-100 flex flex-col h-full group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wallet className="w-32 h-32 text-blue-600" />
                        </div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Transfer to Wallet</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet activation requirements</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 w-fit">Service Description</p>
                                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                    Controls the eligibility for vendors to move funds from their collection balance to their digital wallet. High thresholds ensure vendor stability before liquidity access.
                                </p>
                            </div>

                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mt-4 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Onboarding Milestone</p>
                                        <h4 className="text-sm font-black text-slate-900">Min QR Onboards Required</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current setting</p>
                                        <p className="text-lg font-black text-blue-600">{settings.min_qr_onboard_for_transfer}</p>
                                    </div>
                                </div>

                                <div className="relative group/input">
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.min_qr_onboard_for_transfer}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setSettings({ ...settings, min_qr_onboard_for_transfer: val.toString() });
                                        }}
                                        className="w-full bg-slate-50 rounded-2xl py-6 px-8 text-2xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all border border-slate-100 focus:border-blue-500"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                         <button onClick={() => setSettings({...settings, min_qr_onboard_for_transfer: (parseInt(settings.min_qr_onboard_for_transfer) + 1).toString()})} className="hover:text-blue-600 transition-colors pointer-events-auto">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                         </button>
                                         <button onClick={() => setSettings({...settings, min_qr_onboard_for_transfer: Math.max(0, parseInt(settings.min_qr_onboard_for_transfer) - 1).toString()})} className="hover:text-blue-600 transition-colors pointer-events-auto">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                         </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide italic">Recommended: 15-30 units for standard vendors.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave('min_qr_onboard_for_transfer')}
                                disabled={saving === 'min_qr_onboard_for_transfer'}
                                className="w-full mt-4 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                            >
                                {saving === 'min_qr_onboard_for_transfer' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                        Save Transfer Rules
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Loan Referrals Card */}
                    <div className="bg-[#fdfcfb] rounded-[2.5rem] p-10 border border-slate-100 flex flex-col h-full group hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <QrCode className="w-32 h-32 text-orange-600" />
                        </div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform duration-500">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Loan Referrals</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referral program eligibility</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 w-fit">Program Description</p>
                                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                    Defines when a vendor can begin earning commissions by referring customers to credit products. Requires a proven track record of customer engagement.
                                </p>
                            </div>

                            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mt-4 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Onboarding Milestone</p>
                                        <h4 className="text-sm font-black text-slate-900">Min QR Onboards Required</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current setting</p>
                                        <p className="text-lg font-black text-orange-600">{settings.min_qr_onboard_for_loan_referral}</p>
                                    </div>
                                </div>

                                <div className="relative group/input">
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.min_qr_onboard_for_loan_referral}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setSettings({ ...settings, min_qr_onboard_for_loan_referral: val.toString() });
                                        }}
                                        className="w-full bg-slate-50 rounded-2xl py-6 px-8 text-2xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all border border-slate-100 focus:border-orange-500"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                         <button onClick={() => setSettings({...settings, min_qr_onboard_for_loan_referral: (parseInt(settings.min_qr_onboard_for_loan_referral) + 1).toString()})} className="hover:text-orange-600 transition-colors pointer-events-auto">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                         </button>
                                         <button onClick={() => setSettings({...settings, min_qr_onboard_for_loan_referral: Math.max(0, parseInt(settings.min_qr_onboard_for_loan_referral) - 1).toString()})} className="hover:text-orange-600 transition-colors pointer-events-auto">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                         </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Program Reach Threshold</span>
                                        <span>{Math.min(100, (parseInt(settings.min_qr_onboard_for_loan_referral) / 75 * 100)).toFixed(0)}% Optimal</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-orange-600 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, (parseInt(settings.min_qr_onboard_for_loan_referral) / 75 * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave('min_qr_onboard_for_loan_referral')}
                                disabled={saving === 'min_qr_onboard_for_loan_referral'}
                                className="w-full mt-4 py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                            >
                                {saving === 'min_qr_onboard_for_loan_referral' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                        Save Referral Rules
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Onboarding Validation Rules Card */}
                <div className="bg-[#f0f9ff] rounded-[2.5rem] p-10 border border-blue-100 flex flex-col group hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 className="w-32 h-32 text-blue-600" />
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Onboarding Quality Rules</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global validation criteria for valid counts</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 w-fit">Validation Logic</p>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                These rules define what constitutes a "Valid Onboard". Both Transfer and Loan eligibility counts will only include merchants that satisfy these quality checks.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Min Transaction Amount */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Coins className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Merchant Activity</p>
                                        <h4 className="text-xs font-black text-slate-900">Min Transaction Amount (₹)</h4>
                                    </div>
                                </div>
                                
                                <div className="relative group/input">
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.min_merchant_transaction_amount}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setSettings({ ...settings, min_merchant_transaction_amount: val.toString() });
                                        }}
                                        className="w-full bg-slate-50 rounded-xl py-4 px-6 text-xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all border border-slate-100 focus:border-emerald-500"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold italic uppercase">Merchant must have at least one transaction ≥ this amount.</p>
                            </div>

                            {/* Min Account Age */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-purple-600">Account Maturity</p>
                                        <h4 className="text-xs font-black text-slate-900">Min Account Age (Days)</h4>
                                    </div>
                                </div>
                                
                                <div className="relative group/input">
                                    <input
                                        type="number"
                                        min="0"
                                        value={settings.min_merchant_account_days}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setSettings({ ...settings, min_merchant_account_days: val.toString() });
                                        }}
                                        className="w-full bg-slate-50 rounded-xl py-4 px-6 text-xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all border border-slate-100 focus:border-purple-500"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold italic uppercase">Merchant account must be active for at least this many days.</p>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                setSaving('validation_rules');
                                try {
                                    await apiFetch('/admin/system-settings', {
                                        method: 'POST',
                                        body: JSON.stringify({ 
                                            settings: { 
                                                min_merchant_transaction_amount: settings.min_merchant_transaction_amount,
                                                min_merchant_account_days: settings.min_merchant_account_days
                                            } 
                                        }),
                                    });
                                    toast.success('Validation rules updated');
                                } catch (error) {
                                    toast.error('Failed to update validation rules');
                                } finally {
                                    setSaving(null);
                                }
                            }}
                            disabled={saving === 'validation_rules'}
                            className="w-full mt-4 py-5 bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                        >
                            {saving === 'validation_rules' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                    Save Validation Rules
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Global Review Card */}
                <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Review Compliance</p>
                            <h3 className="text-xl font-black tracking-tight">System-Wide Impact Verification</h3>
                            <p className="text-xs text-slate-500 font-medium">Changes apply immediately to all active agent accounts across the platform.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 max-w-[140px] leading-tight">
                            Ensure thresholds align with current liquidity targets.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
