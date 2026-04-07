'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Percent, Save, Loader2, Info, Plus, Trash2, Edit2, Users, User, X, Search, CheckCircle } from 'lucide-react';

interface CashbackRule {
    id: number;
    target_type: string;
    target_user_id: number | null;
    user_category: string | null;
    usage_percentage: number;
    threshold_amount: number;
    is_active: boolean;
    targetUser?: { id: number; name: string; mobile_number: string; business_name: string | null; } | null;
}

export default function CashbackSettings() {
    const [rules, setRules] = useState<CashbackRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [targetType, setTargetType] = useState('ALL_USERS');
    const [userCategory, setUserCategory] = useState('CUSTOMER');
    
    // Limits
    const [percentage, setPercentage] = useState<string>('0');
    const [threshold, setThreshold] = useState<string>('0');

    // Target User Selection
    const [targetableUsers, setTargetableUsers] = useState<any[]>([]);
    const [selectedTargetUserIds, setSelectedTargetUserIds] = useState<number[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    useEffect(() => {
        if (isWizardOpen && targetType === 'SPECIFIC_USER' && targetableUsers.length === 0) {
            fetchTargetableUsers();
        }
    }, [isWizardOpen, targetType]);

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/admin/cashback-rules');
            setRules(data || []);
        } catch (error) {
            toast.error('Failed to load cashback rules');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTargetableUsers = async () => {
        setIsSearching(true);
        try {
            const res = await apiFetch('/admin/users/targetable');
            setTargetableUsers(res || []);
        } catch (e) {
            toast.error("Failed to load users");
        } finally {
            setIsSearching(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await apiFetch(`/admin/cashback-rules/${id}`, { method: 'DELETE' });
            if (res.error) throw new Error(res.error);
            toast.success('Rule deleted successfully');
            fetchRules();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete rule');
        }
    };

    const handleOpenNewRule = () => {
        setTargetType('ALL_USERS');
        setUserCategory('CUSTOMER');
        setPercentage('0');
        setThreshold('0');
        setSelectedTargetUserIds([]);
        setIsWizardOpen(true);
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

        if (targetType === 'SPECIFIC_USER' && selectedTargetUserIds.length === 0) {
            toast.error('Please select at least one target user');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                target_type: targetType,
                user_category: targetType === 'ALL_USERS' ? userCategory : null,
                target_user_ids: targetType === 'SPECIFIC_USER' ? selectedTargetUserIds : null,
                rules: [
                    {
                        usage_percentage: val,
                        threshold_amount: threshVal,
                        is_active: true
                    }
                ]
            };

            await apiFetch('/admin/cashback-rules', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            
            toast.success('Cashback rule saved successfully');
            setIsWizardOpen(false);
            fetchRules();
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleUser = (userId: number) => {
        if (selectedTargetUserIds.includes(userId)) {
            setSelectedTargetUserIds(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedTargetUserIds([...selectedTargetUserIds, userId]);
        }
    };

    const filteredUsersList = targetableUsers.filter(u => {
        if (!userSearch) return true;
        const q = userSearch.toLowerCase();
        return (u.name?.toLowerCase().includes(q) || u.mobile_number?.includes(q) || u.business_name?.toLowerCase().includes(q));
    });

    const globalRules = rules.filter(r => r.target_type === 'ALL_USERS');
    const specificRules = rules.filter(r => r.target_type === 'SPECIFIC_USER');

    return (
        <AdminLayout title="Cashback Usage Rules">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Usage Logic Settings</h2>
                    <p className="text-sm text-slate-500">Configure what percentage of balance is automatically consumed per transaction</p>
                </div>
                <button
                    onClick={handleOpenNewRule}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" /> Add Configuration
                </button>
            </div>

            <div className="max-w-6xl space-y-6">
                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Info className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-blue-900 font-bold text-lg">How Multiple Rules Apply</h3>
                        <p className="text-blue-700 mt-1 leading-relaxed">
                            If a user has a <strong>Specific User Rule</strong>, it will override any <strong>Global Category Rule</strong>.
                            Cashback usage dynamically calculates percentages up to the bill limit if available wallet constraints check out over the threshold.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Global List Section */}
                    <div className="space-y-4">
                        <h3 className="text-md font-bold text-slate-700 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Global Category Rules
                        </h3>
                        {globalRules.length === 0 && !isLoading && (
                            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-dashed border-slate-200 text-center text-slate-500">
                                No global logic configured. Zero usage applied.
                            </div>
                        )}
                        {globalRules.map(rule => (
                            <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-1 bg-slate-100 text-slate-600 font-bold uppercase text-xs rounded-md">
                                            {rule.user_category || "ALL"}
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg">
                                        {rule.usage_percentage}% Consumed
                                    </h4>
                                    <p className="text-sm font-medium text-slate-500">
                                        Requires minimum balance of ₹{rule.threshold_amount}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(rule.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Specific List Section */}
                    <div className="space-y-4">
                        <h3 className="text-md font-bold text-slate-700 flex items-center gap-2">
                            <User className="w-5 h-5" /> Specific User Rules
                        </h3>
                        {specificRules.length === 0 && !isLoading && (
                            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-dashed border-slate-200 text-center text-slate-500">
                                No specific individual overrides.
                            </div>
                        )}
                        {specificRules.map(rule => (
                            <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 flex items-center justify-between gap-4">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-blue-700 uppercase">
                                                {rule.targetUser?.name?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-700 text-sm truncate">
                                            {rule.targetUser?.name || 'Unknown'} - {rule.targetUser?.mobile_number}
                                        </span>
                                    </div>
                                    <h4 className="font-black text-blue-600 text-lg group-hover:text-blue-700">
                                        {rule.usage_percentage}% Override
                                    </h4>
                                    <p className="text-xs font-bold text-slate-400">
                                        Min balance: ₹{rule.threshold_amount}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(rule.id)} className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Creation Wizard */}
            {isWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Define Usage Logic</h3>
                                <p className="text-sm text-slate-500">Configure global or specific cashback consumption overrides</p>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all hover:scale-105">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Type Toggle */}
                                <div>
                                    <label className="text-sm font-bold text-slate-700 mb-3 block">Target Applicability</label>
                                    <div className="flex bg-slate-100 p-1.5 rounded-xl">
                                        <button 
                                            onClick={() => setTargetType('ALL_USERS')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${targetType === 'ALL_USERS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Users className="w-4 h-4" /> Global Targeting
                                        </button>
                                        <button 
                                            onClick={() => setTargetType('SPECIFIC_USER')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${targetType === 'SPECIFIC_USER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <User className="w-4 h-4" /> Specific Accounts
                                        </button>
                                    </div>
                                </div>

                                {/* Category Pick (Global) */}
                                {targetType === 'ALL_USERS' && (
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 mb-3 block">Profile Category</label>
                                        <select 
                                            value={userCategory}
                                            onChange={(e) => setUserCategory(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="CUSTOMER">Customer Profiles</option>
                                            <option value="MERCHANT">Merchant Profiles</option>
                                            <option value="STUDENT">Student Profiles</option>
                                        </select>
                                    </div>
                                )}

                                {/* Specific Users List */}
                                {targetType === 'SPECIFIC_USER' && (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                                        <div className="p-3 border-b border-slate-200 bg-slate-50 relative">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
                                            <input 
                                                className="w-full h-10 pl-10 pr-4 rounded-lg border-none bg-white shadow-sm font-medium text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                                                placeholder="Search by name or mobile number..."
                                                value={userSearch}
                                                onChange={e => setUserSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="h-48 overflow-y-auto bg-white p-2">
                                            {isSearching ? (
                                                <div className="flex h-full items-center justify-center text-slate-400 text-sm gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Fetching accounts...
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-50">
                                                    {filteredUsersList.map(u => {
                                                        const selected = selectedTargetUserIds.includes(u.id);
                                                        return (
                                                            <div 
                                                                key={u.id}
                                                                onClick={() => toggleUser(u.id)}
                                                                className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${selected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                                                            >
                                                                <div>
                                                                    <div className="font-bold text-sm text-slate-800">{u.name}</div>
                                                                    <div className="text-xs text-slate-500 font-medium">{u.mobile_number} • {u.role}</div>
                                                                </div>
                                                                {selected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="h-px bg-slate-100 my-4" />

                                <div className="grid grid-cols-2 gap-4">
                                     <label className="block">
                                        <span className="text-slate-700 font-bold mb-2 block">Contribution %</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={percentage}
                                                onChange={(e) => setPercentage(e.target.value)}
                                                className="w-full h-14 pl-4 pr-12 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-black text-xl text-slate-900"
                                                placeholder="10"
                                                min="0" max="100"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</div>
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="text-slate-700 font-bold mb-2 block">Minimum Holding (₹)</span>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={threshold}
                                                onChange={(e) => setThreshold(e.target.value)}
                                                className="w-full h-14 pl-8 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-black text-xl text-slate-900"
                                                placeholder="500"
                                                min="0"
                                            />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsWizardOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition active:scale-95 disabled:opacity-50"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Activate Policy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
