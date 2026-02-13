'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    Search, Filter, TrendingUp, Award, DollarSign, Store,
    ChevronDown, CheckCircle, Clock, XCircle, Download,
    Calendar, Plus, Edit2, Eye, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Merchant {
    id: number;
    name: string;
    mobile_number: string;
    business_name: string;
    business_nature: string;
    daily_turnover: string;
    calculated_daily_turnover: number;
    wallet_balance: string;
    latest_cashback?: any;
}

interface CashbackTier {
    id: number;
    tier_name: string;
    min_turnover: number;
    max_turnover: number;
    cashback_min: number;
    cashback_max: number;
    is_active: boolean;
}

export default function MerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [tiers, setTiers] = useState<CashbackTier[]>([]);
    const [cashbacks, setCashbacks] = useState<any[]>([]);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedTier, setSelectedTier] = useState('ALL');
    const [businessNature, setBusinessNature] = useState('');
    const [cashbackStatus, setCashbackStatus] = useState('PENDING');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'merchants' | 'cashbacks' | 'tiers'>('merchants');
    const [selectedMerchants, setSelectedMerchants] = useState<number[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showTierModal, setShowTierModal] = useState(false);

    // Bulk award state
    const [bulkCashbackDate, setBulkCashbackDate] = useState(new Date().toISOString().split('T')[0]);
    const [bulkTier, setBulkTier] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedTier, businessNature, search]);

    useEffect(() => {
        if (activeTab === 'cashbacks') {
            loadCashbacks();
        }
    }, [activeTab, cashbackStatus]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedTier !== 'ALL') params.append('turnover_tier', selectedTier);
            if (businessNature) params.append('business_nature', businessNature);
            if (search) params.append('search', search);

            const [merchantsData, tiersData] = await Promise.all([
                apiFetch(`/admin/merchants?${params}`),
                apiFetch('/admin/cashback/tiers')
            ]);

            setMerchants(merchantsData.data || []);
            setTiers(tiersData || []);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCashbacks = async () => {
        try {
            const params = new URLSearchParams();
            if (cashbackStatus !== 'ALL') params.append('status', cashbackStatus);

            const data = await apiFetch(`/admin/cashback?${params}`);
            setCashbacks(data.data || []);
        } catch (error) {
            console.error('Failed to load cashbacks', error);
        }
    };

    const toggleMerchantSelection = (merchantId: number) => {
        setSelectedMerchants(prev =>
            prev.includes(merchantId)
                ? prev.filter(id => id !== merchantId)
                : [...prev, merchantId]
        );
    };

    const handleBulkAward = async () => {
        if (selectedMerchants.length === 0 || !bulkTier) {
            alert('Please select merchants and a tier');
            return;
        }

        const tier = tiers.find(t => t.id === parseInt(bulkTier));
        if (!tier) return;

        // Calculate cashback amounts for each merchant based on their turnover
        const cashbackAmounts = selectedMerchants.map(merchantId => {
            const merchant = merchants.find(m => m.id === merchantId);
            const turnover = merchant?.calculated_daily_turnover || 0;

            // Simple calculation: proportional to turnover within tier bounds
            if (turnover < tier.min_turnover) return tier.cashback_min;
            if (turnover > tier.max_turnover) return tier.cashback_max;

            const ratio = (turnover - tier.min_turnover) / (tier.max_turnover - tier.min_turnover);
            return tier.cashback_min + (ratio * (tier.cashback_max - tier.cashback_min));
        });

        try {
            await apiFetch('/admin/cashback/bulk-award', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_ids: selectedMerchants,
                    cashback_amounts: cashbackAmounts,
                    cashback_date: bulkCashbackDate,
                    tier_id: parseInt(bulkTier)
                })
            });

            alert(`Cashback awarded to ${selectedMerchants.length} merchants!`);
            setShowBulkModal(false);
            setSelectedMerchants([]);
            loadData();
        } catch (error) {
            alert('Failed to award cashback');
        }
    };

    const handleApproveCashback = async (cashbackId: number) => {
        if (!confirm('Approve this cashback? Wallet will be credited immediately.')) return;

        try {
            await apiFetch(`/admin/cashback/${cashbackId}/approve`, { method: 'POST' });
            alert('Cashback approved and credited!');
            loadCashbacks();
        } catch (error) {
            alert('Failed to approve cashback');
        }
    };

    const getTierBadgeColor = (turnover: number) => {
        const tier = tiers.find(t => turnover >= t.min_turnover && turnover <= t.max_turnover);
        if (!tier) return 'bg-slate-100 text-slate-600';

        const tierColors: Record<string, string> = {
            '1K-5K': 'bg-blue-100 text-blue-700',
            '5K-10K': 'bg-cyan-100 text-cyan-700',
            '10K-20K': 'bg-emerald-100 text-emerald-700',
            '20K-50K': 'bg-amber-100 text-amber-700',
            '50K-1L': 'bg-orange-100 text-orange-700',
            '1L-2L': 'bg-rose-100 text-rose-700',
            '2L-5L': 'bg-purple-100 text-purple-700',
        };

        return tierColors[tier.tier_name] || 'bg-slate-100 text-slate-600';
    };

    const totalPages = Math.ceil(merchants.length / itemsPerPage);
    const paginatedMerchants = merchants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalCashbackPages = Math.ceil(cashbacks.length / itemsPerPage);
    const paginatedCashbacks = cashbacks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleDeleteMerchant = async (id: number) => {
        if (!confirm('Are you sure you want to delete this merchant record?')) return;
        try {
            await apiFetch(`/admin/merchants/${id}`, { method: 'DELETE' });
            alert('Merchant deleted successfully');
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to delete merchant');
        }
    };

    return (
        <AdminLayout title="Merchant Cashback Management">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Store className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Merchants</p>
                        <p className="text-3xl font-black text-slate-900">{merchants.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Tiers</p>
                        <p className="text-3xl font-black text-slate-900">{tiers.filter(t => t.is_active).length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Cashback</p>
                        <p className="text-3xl font-black text-slate-900">{cashbacks.filter(c => c.status === 'PENDING').length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Award className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Selected</p>
                        <p className="text-3xl font-black text-slate-900">{selectedMerchants.length}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-2 rounded-2xl w-fit">
                {(['merchants', 'cashbacks', 'tiers'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-xl font-bold capitalize transition-all ${activeTab === tab
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Merchants Tab */}
            {activeTab === 'merchants' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    {/* Filters */}
                    <div className="p-8 border-b border-slate-100 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, mobile, or business..."
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <div className="relative min-w-[200px]">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        className="w-full pl-11 pr-10 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer text-sm"
                                        value={selectedTier}
                                        onChange={e => { setSelectedTier(e.target.value); setCurrentPage(1); }}
                                    >
                                        <option value="ALL">All Turnover Tiers</option>
                                        {tiers.map(tier => (
                                            <option key={tier.id} value={tier.id}>
                                                {tier.tier_name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                </div>

                                <div className="flex items-center bg-slate-50 border-none rounded-2xl px-4 py-2">
                                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                                    >
                                        <option value={12}>12</option>
                                        <option value={24}>24</option>
                                        <option value={60}>60</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>

                            {selectedMerchants.length > 0 && (
                                <button
                                    onClick={() => setShowBulkModal(true)}
                                    className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                                >
                                    <Award className="w-5 h-5" />
                                    Bulk Award ({selectedMerchants.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Merchants Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <input
                                            type="checkbox"
                                            checked={selectedMerchants.length === merchants.length && merchants.length > 0}
                                            onChange={() => {
                                                if (selectedMerchants.length === merchants.length) {
                                                    setSelectedMerchants([]);
                                                } else {
                                                    setSelectedMerchants(merchants.map(m => m.id));
                                                }
                                            }}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Merchant Details</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Business</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Turnover</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Tier</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Last Cashback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedMerchants.map(merchant => (
                                    <tr key={merchant.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-6">
                                            <input
                                                type="checkbox"
                                                checked={selectedMerchants.includes(merchant.id)}
                                                onChange={() => toggleMerchantSelection(merchant.id)}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center font-bold text-blue-700">
                                                    {(merchant.name || 'M')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{merchant.name || 'Unknown'}</p>
                                                    <p className="text-xs font-medium text-slate-500">{merchant.mobile_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-bold text-slate-700">{merchant.business_name || '-'}</p>
                                            <p className="text-xs text-slate-500">{merchant.business_nature || '-'}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-mono font-bold text-emerald-600">₹{merchant.calculated_daily_turnover?.toLocaleString('en-IN') || '0'}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${getTierBadgeColor(merchant.calculated_daily_turnover)}`}>
                                                {tiers.find(t => merchant.calculated_daily_turnover >= t.min_turnover && merchant.calculated_daily_turnover <= t.max_turnover)?.tier_name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-mono font-bold text-slate-700">₹{parseFloat(merchant.wallet_balance || '0').toLocaleString('en-IN')}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-between group">
                                                {merchant.latest_cashback ? (
                                                    <div>
                                                        <p className="font-bold text-emerald-600">₹{parseFloat(merchant.latest_cashback.cashback_amount).toLocaleString('en-IN')}</p>
                                                        <p className="text-xs text-slate-400">{new Date(merchant.latest_cashback.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-slate-400 text-sm">Never</p>
                                                )}

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteMerchant(merchant.id); }}
                                                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Cashbacks Tab */}
            {activeTab === 'cashbacks' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex gap-2">
                            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => { setCashbackStatus(status); setCurrentPage(1); }}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${cashbackStatus === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center bg-slate-50 border-none rounded-2xl px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={60}>60</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Merchant</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Turnover</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedCashbacks.map(cashback => (
                                    <tr key={cashback.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6">
                                            <p className="font-bold text-slate-900">{cashback.merchant?.name}</p>
                                            <p className="text-xs text-slate-500">{cashback.merchant?.business_name}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-medium text-slate-700">{new Date(cashback.cashback_date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-mono font-bold text-slate-700">₹{parseFloat(cashback.daily_turnover).toLocaleString('en-IN')}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="font-mono font-bold text-emerald-600">₹{parseFloat(cashback.cashback_amount).toLocaleString('en-IN')}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${cashback.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                cashback.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                {cashback.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                                                {cashback.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                {cashback.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                {cashback.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            {cashback.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleApproveCashback(cashback.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                                >
                                                    Approve & Credit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cashback Pagination Controls */}
                    {totalCashbackPages > 1 && (
                        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {currentPage} of {totalCashbackPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalCashbackPages, prev + 1))}
                                    disabled={currentPage === totalCashbackPages}
                                    className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tiers.map(tier => (
                        <div key={tier.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-black text-slate-900">{tier.tier_name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {tier.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Turnover Range</p>
                                    <p className="font-mono font-bold text-slate-700">₹{tier.min_turnover.toLocaleString('en-IN')} - ₹{tier.max_turnover.toLocaleString('en-IN')}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cashback Range</p>
                                    <p className="font-mono font-bold text-emerald-600">₹{tier.cashback_min.toLocaleString('en-IN')} - ₹{tier.cashback_max.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bulk Award Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-2xl font-black text-slate-900 mb-6">Bulk Award Cashback</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Tier</label>
                                <select
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100"
                                    value={bulkTier}
                                    onChange={e => setBulkTier(e.target.value)}
                                >
                                    <option value="">Choose a tier...</option>
                                    {tiers.map(tier => (
                                        <option key={tier.id} value={tier.id}>
                                            {tier.tier_name} (CB: ₹{tier.cashback_min} - ₹{tier.cashback_max})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cashback Date</label>
                                <input
                                    type="date"
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-100"
                                    value={bulkCashbackDate}
                                    onChange={e => setBulkCashbackDate(e.target.value)}
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl">
                                <p className="text-sm font-bold text-blue-900">
                                    {selectedMerchants.length} merchants selected. Cashback will be calculated based on their individual turnover within the tier range.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAward}
                                className="py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Award Cashback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
