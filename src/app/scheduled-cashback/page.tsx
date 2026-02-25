'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Tier {
    id: number;
    tier_name: string;
    min_turnover: string;
    max_turnover: string;
    cashback_min: string;
    cashback_max: string;
    is_active: boolean;
}

export default function ScheduledCashbackPage() {
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        tier_name: '',
        min_turnover: '',
        max_turnover: '',
        cashback_min: '',
        cashback_max: ''
    });

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/admin/cashback/tiers');
            // Sort by min_turnover ascending
            const sortedData = (data || []).sort((a: Tier, b: Tier) =>
                parseFloat(a.min_turnover) - parseFloat(b.min_turnover)
            );
            setTiers(sortedData);
        } catch (error) {
            toast.error('Failed to load cashback tiers');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic frontend validation for contiguity
        const minTurnover = parseFloat(formData.min_turnover);
        const maxTurnover = parseFloat(formData.max_turnover);

        if (minTurnover >= maxTurnover) {
            toast.error('Maximum turnover must be greater than minimum turnover');
            return;
        }

        const highestMax = tiers.reduce((max, tier) => {
            const currentMax = parseFloat(tier.max_turnover);
            return currentMax > max ? currentMax : max;
        }, 0);

        if (minTurnover <= highestMax && tiers.length > 0) {
            toast.error(`Minimum turnover must be strictly greater than ${highestMax} (previous tier's max).`);
            return;
        }

        try {
            setIsSubmitting(true);
            await apiFetch('/admin/cashback/tiers', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    is_active: true
                })
            });
            toast.success('Cashback tier created successfully');
            setFormData({
                tier_name: '',
                min_turnover: '',
                max_turnover: '',
                cashback_min: '',
                cashback_max: ''
            });
            fetchTiers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create tier');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Scheduled Cashback">
            <div className="space-y-6">

                {/* Add New Tier Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        Add New Tier
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tier Name (e.g. Silver)</label>
                            <input
                                type="text"
                                name="tier_name"
                                value={formData.tier_name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Silver Tier"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Tx Bound (₹)</label>
                            <input
                                type="number"
                                name="min_turnover"
                                value={formData.min_turnover}
                                onChange={handleInputChange}
                                required
                                min="0"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="1000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Tx Bound (₹)</label>
                            <input
                                type="number"
                                name="max_turnover"
                                value={formData.max_turnover}
                                onChange={handleInputChange}
                                required
                                min="0"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="5000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fixed Cashback (₹)</label>
                            <input
                                type="number"
                                name="cashback_min"
                                value={formData.cashback_min}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    setFormData(prev => ({ ...prev, cashback_max: e.target.value }));
                                }}
                                required
                                min="0"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Tier'}
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                        New tier's minimum bound must be strictly greater than the highest maximum bound of existing tiers. Nightly calculation uses fixed cashback.
                    </p>
                </div>

                {/* Existing Tiers */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Active Cashback Tiers</h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
                            Loading tiers...
                        </div>
                    ) : tiers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 font-medium">
                            No scheduled cashback tiers found. Add one above.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Tier Name</th>
                                        <th className="px-6 py-4">Turnover Range (₹)</th>
                                        <th className="px-6 py-4">Cashback Amount (₹)</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tiers.map((tier) => (
                                        <tr key={tier.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {tier.tier_name}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                ₹{parseFloat(tier.min_turnover).toLocaleString('en-IN')} - ₹{parseFloat(tier.max_turnover).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-emerald-600">
                                                ₹{parseFloat(tier.cashback_min).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${tier.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {tier.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    );
}
