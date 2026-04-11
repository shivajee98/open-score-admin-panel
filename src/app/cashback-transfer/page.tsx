'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Wallet, Save, Loader2, Info, Plus, Trash2, Users, User, X, Search, CheckCircle, ArrowRightLeft } from 'lucide-react';

interface CashbackRule {
    id: number;
    target_type: string;
    target_user_id: number | null;
    user_category: string | null;
    threshold_amount: number;
    usage_percentage: number;
    is_active: boolean;
    type: string;
    targetUser?: { id: number; name: string; mobile_number: string; business_name: string | null; } | null;
}

export default function CashbackTransferSettings() {
    const [rules, setRules] = useState<CashbackRule[]>([]);
    const [globalThreshold, setGlobalThreshold] = useState<string>('200');
    const [isLoading, setIsLoading] = useState(true);
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);
    const [isGlobalSaving, setIsGlobalSaving] = useState(false);

    // Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [targetType, setTargetType] = useState('ALL_USERS');
    const [userCategory, setUserCategory] = useState('CUSTOMER');
    const [threshold, setThreshold] = useState<string>('200');

    // Target User Selection
    const [targetableUsers, setTargetableUsers] = useState<any[]>([]);
    const [selectedTargetUserIds, setSelectedTargetUserIds] = useState<number[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchRules();
        fetchGlobalSetting();
    }, []);

    useEffect(() => {
        if (isWizardOpen && targetType === 'SPECIFIC_USER' && targetableUsers.length === 0) {
            fetchTargetableUsers();
        }
    }, [isWizardOpen, targetType]);

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/admin/cashback-rules?type=TRANSFER');
            setRules(data || []);
        } catch (error) {
            toast.error('Failed to load cashback transfer rules');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGlobalSetting = async () => {
        setIsGlobalLoading(true);
        try {
            const data = await apiFetch('/admin/system-settings');
            const setting = data.find((s: any) => s.key === 'cashback_threshold_amount');
            if (setting) {
                setGlobalThreshold(setting.value);
            }
        } catch (error) {
            toast.error('Failed to load global threshold');
        } finally {
            setIsGlobalLoading(false);
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

    const handleSaveGlobal = async () => {
        setIsGlobalSaving(true);
        try {
            await apiFetch('/admin/system-settings', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        cashback_threshold_amount: globalThreshold
                    }
                })
            });
            toast.success('Global threshold updated successfully');
        } catch (e) {
            toast.error('Failed to update global threshold');
        } finally {
            setIsGlobalSaving(false);
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm('Are you sure you want to delete this specific override?')) return;
        try {
            await apiFetch(`/admin/cashback-rules/${id}`, { method: 'DELETE' });
            toast.success('Override removed successfully');
            fetchRules();
        } catch (e: any) {
            toast.error(e.message || 'Failed to remove override');
        }
    };

    const handleSaveNewRule = async () => {
        const threshVal = parseFloat(threshold);
        
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
                type: 'TRANSFER',
                target_type: targetType,
                user_category: targetType === 'ALL_USERS' ? userCategory : null,
                target_user_ids: targetType === 'SPECIFIC_USER' ? selectedTargetUserIds : null,
                rules: [
                    {
                        usage_percentage: 0, // Not used for transfer rules
                        threshold_amount: threshVal,
                        is_active: true
                    }
                ]
            };

            await apiFetch('/admin/cashback-rules', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            
            toast.success('Rule applied successfully');
            setIsWizardOpen(false);
            fetchRules();
        } catch (error) {
            toast.error('Failed to save override');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleUserSelection = (userId: number) => {
        setSelectedTargetUserIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsersList = targetableUsers.filter(u => {
        if (!userSearch) return true;
        const q = userSearch.toLowerCase();
        return (u.name?.toLowerCase().includes(q) || u.mobile_number?.includes(q) || u.business_name?.toLowerCase().includes(q));
    });

    const categoryRulesCount = rules.filter(r => r.target_type === 'ALL_USERS').length;
    const individualRulesCount = rules.filter(r => r.target_type === 'SPECIFIC_USER').length;

    return (
        <AdminLayout title="Cashback Thresholds">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Transfer Eligibility Rules</h2>
                    <p className="text-slate-500 font-medium">Control minimum balance required to move rewards to wallet</p>
                </div>
                <button
                    onClick={() => setIsWizardOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Create Override
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Configuration Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative">
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                                <Wallet className="w-7 h-7 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Global Default</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                Base threshold applied to all accounts unless overridden by a specific policy.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Minimum Amount (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                                        <input
                                            type="number"
                                            value={globalThreshold}
                                            onChange={(e) => setGlobalThreshold(e.target.value)}
                                            className="w-full h-14 pl-10 pr-4 bg-slate-50 border-none rounded-2xl text-xl font-black text-slate-900 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                                            placeholder="200"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveGlobal}
                                    disabled={isGlobalSaving || isGlobalLoading}
                                    className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isGlobalSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Update Global Base
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mb-24 -mr-24 blur-3xl"></div>
                        <div className="relative">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-lg font-black mb-2">Priority Logic</h4>
                            <ul className="space-y-4 text-indigo-100 text-sm font-medium">
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">1</span>
                                    Specific User Overrides
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">2</span>
                                    Category Policies (Merchants, etc.)
                                </li>
                                <li className="flex gap-3 text-white">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center text-[10px] font-black">3</span>
                                    Global Base Default
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Overrides Table Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Category Rules */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Category Policies
                            </h3>
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">{categoryRulesCount} Active</span>
                        </div>
                        {rules.filter(r => r.target_type === 'ALL_USERS').length === 0 && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                                <p className="text-slate-400 font-bold">No category-wide overrides set.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rules.filter(r => r.target_type === 'ALL_USERS').map(rule => (
                                <div key={rule.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rule.user_category}</p>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">₹{rule.threshold_amount}</h4>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Individual Rules */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <User className="w-4 h-4" /> Individual Account Overrides
                            </h3>
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">{individualRulesCount} Active</span>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            {rules.filter(r => r.target_type === 'SPECIFIC_USER').length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No individual overrides configured.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Account</th>
                                                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile</th>
                                                <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Threshold</th>
                                                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {rules.filter(r => r.target_type === 'SPECIFIC_USER').map(rule => (
                                                <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                                {rule.targetUser?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900">{rule.targetUser?.name || 'Unknown'}</p>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rule.targetUser?.business_name || 'Individual'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-500">{rule.targetUser?.mobile_number}</td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-center">
                                                            <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-sm font-black tracking-tight">₹{rule.threshold_amount}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteRule(rule.id)}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Creation Modal */}
            {isWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    Create Eligibility Policy
                                </h3>
                                <p className="text-slate-500 font-medium ml-1">Define transfer thresholds for Specific Accounts or Groups</p>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 transition-all hover:scale-110 active:scale-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl">
                                <button 
                                    onClick={() => setTargetType('ALL_USERS')}
                                    className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${targetType === 'ALL_USERS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Users className="w-4 h-4" /> Group Policy
                                </button>
                                <button 
                                    onClick={() => setTargetType('SPECIFIC_USER')}
                                    className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${targetType === 'SPECIFIC_USER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <User className="w-4 h-4" /> Account Override
                                </button>
                            </div>

                            {targetType === 'ALL_USERS' ? (
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Select Profile Role</label>
                                    <select 
                                        value={userCategory}
                                        onChange={(e) => setUserCategory(e.target.value)}
                                        className="w-full h-14 px-6 rounded-2xl border-none bg-slate-50 font-black text-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                                    >
                                        <option value="CUSTOMER">Standard Customers</option>
                                        <option value="MERCHANT">Merchants & Vendors</option>
                                        <option value="STUDENT">Student Accounts</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
                                    <div className="p-4 relative">
                                        <Search className="w-4 h-4 text-slate-300 absolute left-8 top-1/2 -translate-y-1/2" />
                                        <input 
                                            className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-white shadow-sm font-bold text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900/5"
                                            placeholder="Search by name, mobile or business..."
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-60 overflow-y-auto px-4 pb-4">
                                        {isSearching ? (
                                            <div className="flex h-full items-center justify-center text-slate-400 text-xs font-black uppercase tracking-widest gap-3">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Verifying connections...
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {filteredUsersList.map(u => {
                                                    const isSelected = selectedTargetUserIds.includes(u.id);
                                                    return (
                                                        <div 
                                                            key={u.id}
                                                            onClick={() => toggleUserSelection(u.id)}
                                                            className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                                    {u.name?.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className={`font-black text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>{u.name}</div>
                                                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>{u.mobile_number} • {u.role}</div>
                                                                </div>
                                                            </div>
                                                            {isSelected && <CheckCircle className="w-5 h-5 text-white fill-emerald-500 border-none" strokeWidth={3} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Override Threshold (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">₹</span>
                                    <input
                                        type="number"
                                        value={threshold}
                                        onChange={(e) => setThreshold(e.target.value)}
                                        className="w-full h-20 pl-14 pr-8 rounded-[1.5rem] bg-slate-50 border-none font-black text-3xl text-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                                        placeholder="500"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-4 ml-1 flex items-center gap-2">
                                    <ArrowRightLeft size={12} />
                                    Users must hold this minimum rewards balance to transfer.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsWizardOpen(false)}
                                className="px-8 py-4 rounded-2xl font-black text-slate-600 hover:bg-slate-200 transition"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSaveNewRule}
                                disabled={isSaving}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                                Deploy Policy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
