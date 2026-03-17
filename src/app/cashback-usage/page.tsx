'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Percent, Save, Loader2, Info } from 'lucide-react';

export default function CashbackSettings() {
    const [percentage, setPercentage] = useState<string>('0');
    const [threshold, setThreshold] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiFetch('/admin/settings');
            if (res) {
                if (res.cashback_usage_percentage !== undefined) setPercentage(res.cashback_usage_percentage.toString());
                if (res.cashback_threshold_amount !== undefined) setThreshold(res.cashback_threshold_amount.toString());
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const val = parseFloat(percentage);
        const threshVal = parseFloat(threshold);
        
        if (isNaN(val) || val < 0 || val > 100) {
            toast.error('Please enter a valid percentage between 0 and 100');
            return;
        }

        if (isNaN(threshVal) || threshVal < 0) {
            toast.error('Please enter a valid threshold amount');
            return;
        }

        setIsSaving(true);
        try {
            await apiFetch('/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ 
                    cashback_usage_percentage: val,
                    cashback_threshold_amount: threshVal
                }),
            });
            toast.success('Cashback settings updated');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout title="Cashback Settings">
            <div className="max-w-4xl space-y-6">
                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-blue-900 font-bold text-lg">Cashback Usage Logic</h3>
                        <p className="text-blue-700 mt-1 leading-relaxed">
                            This percentage determines how much of a user's <strong>Available Cashback</strong> is automatically used to pay for their transactions. 
                            If set to 10%, every time a user pays, 10% of their cashback balance (capped by the transaction amount) will be used, and the remaining balance will be deducted from their main wallet.
                            <strong> Note:</strong> Cashback usage will only be triggered if the user's cashback balance is above the configured threshold.
                        </p>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <Percent className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Transaction Contribution</h2>
                            <p className="text-slate-500 font-medium">Configure global cashback utilization rate</p>
                        </div>
                    </div>

                    <div className="max-w-md space-y-4">
                        <label className="block">
                            <span className="text-slate-700 font-bold mb-2 block">Contribution Percentage (%)</span>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    className="w-full h-14 pl-6 pr-12 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-xl text-slate-900 appearance-none"
                                    placeholder="e.g., 10"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    disabled={isLoading || isSaving}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl italic">
                                    %
                                </div>
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-slate-700 font-bold mb-2 block">Cashback Usage Threshold (₹)</span>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl italic">₹</span>
                                <input
                                    type="number"
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                    className="w-full h-14 pl-12 pr-6 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-xl text-slate-900 appearance-none"
                                    placeholder="e.g., 2000"
                                    min="0"
                                    disabled={isLoading || isSaving}
                                />
                            </div>
                            <p className="mt-3 text-sm text-slate-400 font-medium">
                                If cashback balance is less than this amount, it will not be used in transfers.
                            </p>
                        </label>

                        <div className="pt-6">
                            <button
                                onClick={handleSave}
                                disabled={isLoading || isSaving}
                                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                SAVE CONFIGURATION
                            </button>
                        </div>
                    </div>
                </div>

                {/* Visual Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                     <div className="p-6 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Example: ₹1,000 Payment</p>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-700">User Cashback Balance: ₹200</p>
                            <p className="text-sm font-medium text-slate-700">Usage Percentage: {percentage}%</p>
                            <div className="h-px bg-slate-200 my-2" />
                            <p className="text-sm font-bold text-blue-600">Contribution: ₹{(200 * (parseFloat(percentage) || 0) / 100).toFixed(2)}</p>
                            <p className="text-sm font-bold text-slate-900">Main Wallet Debit: ₹{(1000 - (200 * (parseFloat(percentage) || 0) / 100)).toFixed(2)}</p>
                        </div>
                     </div>
                </div>
            </div>
        </AdminLayout>
    );
}
