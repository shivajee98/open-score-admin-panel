'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Gift, Users, TrendingUp, Settings, Save } from 'lucide-react';

export default function ReferralSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        is_enabled: true,
        signup_bonus: 100,
        loan_disbursement_bonus: 250,
        agent_signup_bonus: 50
    });
    const [referrals, setReferrals] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total_referrals: 0,
        total_signup_paid: 0,
        total_loan_paid: 0,
        total_amount_paid: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch settings
            const settingsData = await apiFetch('/admin/referral-settings');
            setSettings(settingsData);

            // Fetch all referrals
            const referralsData = await apiFetch('/admin/all-referrals');
            const referralList = referralsData.data || [];
            setReferrals(referralList);

            // Calculate stats
            const totalReferrals = referralList.length;
            const totalSignupPaid = referralList.reduce((sum: number, r: any) =>
                sum + (r.signup_bonus_paid ? Number(r.signup_bonus_earned) : 0), 0);
            const totalLoanPaid = referralList.reduce((sum: number, r: any) =>
                sum + (r.loan_bonus_paid ? Number(r.loan_bonus_earned) : 0), 0);

            setStats({
                total_referrals: totalReferrals,
                total_signup_paid: totalSignupPaid,
                total_loan_paid: totalLoanPaid,
                total_amount_paid: totalSignupPaid + totalLoanPaid
            });

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch('/admin/referral-settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <AdminLayout title="Referral Settings">
            <title>Referral Settings | OpenScore</title>
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Referral System</h1>
                    <p className="text-slate-600">Manage referral settings and track performance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-slate-500 text-sm font-medium">Total Referrals</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{stats.total_referrals}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Gift className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-slate-500 text-sm font-medium">Signup Bonuses</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">₹{stats.total_signup_paid.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-slate-500 text-sm font-medium">Loan Bonuses</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">₹{stats.total_loan_paid.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Gift className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white/80 text-sm font-medium">Total Paid</span>
                        </div>
                        <p className="text-3xl font-black">₹{stats.total_amount_paid.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Settings className="w-6 h-6 text-slate-900" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Referral Settings</h2>
                            <p className="text-slate-500 text-sm">Configure referral bonus amounts</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900">Enable Share & Earn</p>
                                <p className="text-sm text-slate-500">Allow users to earn referral bonuses</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
                                className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.is_enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.is_enabled ? 'translate-x-6' : ''}`}></div>
                            </button>
                        </div>

                        {/* Signup Bonus */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Signup Bonus Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={settings.signup_bonus}
                                    onChange={(e) => setSettings({ ...settings, signup_bonus: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                                    min="0"
                                    step="10"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Bonus credited to referrer when new user signs up (default: ₹100)
                            </p>
                        </div>


                        {/* Loan Disbursement Bonus */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Loan Disbursement Bonus Amount (User Reward)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={settings.loan_disbursement_bonus}
                                    onChange={(e) => setSettings({ ...settings, loan_disbursement_bonus: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                                    min="0"
                                    step="10"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Bonus credited to referrer when referred user's loan is disbursed (default: ₹250)
                            </p>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Referrals List */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h2 className="text-xl font-black text-slate-900 mb-6">Recent Referrals</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Referrer</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Referred</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Code</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Signup Bonus</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Loan Bonus</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {referrals.slice(0, 20).map((referral: any, index: number) => (
                                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                            {referral.referrer?.name || referral.referrer?.mobile_number || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                                            {referral.referred?.name || referral.referred?.mobile_number || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-mono font-bold text-slate-600">
                                            {referral.referral_code}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-green-600">
                                                    ₹{Number(referral.signup_bonus_earned || 0).toLocaleString('en-IN')}
                                                </span>
                                                {referral.signup_bonus_paid && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Paid</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-purple-600">
                                                    ₹{Number(referral.loan_bonus_earned || 0).toLocaleString('en-IN')}
                                                </span>
                                                {referral.loan_bonus_paid && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Paid</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-slate-500">
                                            {new Date(referral.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {referrals.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No referrals yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
