'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    Search, CreditCard, Clock, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, X, Save, Settings, ArrowLeft, RefreshCw, Edit2, ShieldAlert,
    Plus, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface WithdrawalRule {
    id: number;
    min_withdrawal_amount: string | number;
    max_withdrawal_amount: string | number | null;
    daily_limit: string | number | null;
    daily_txn_limit: number | null;
    min_spend_amount: string | number;
    min_txn_count: number;
    target_users: string[];
    is_active: boolean;
    is_charge_enabled: boolean;
    charge_threshold: string | number;
    charge_percent: string | number;
    min_charge_amount: string | number;
    max_charge_amount: string | number;
    monthly_free_count: number;
    created_at?: string;
    updated_at?: string;
}

interface UserInfo {
    id: number;
    name: string;
    mobile_number: string;
    email: string;
    sub_user_id?: number | null;
    cashback_percentage?: number;
    receive_cashback_percentage?: number;
    cashback_flat_amount?: number;
    receive_cashback_flat_amount?: number;
    max_cashback_times_per_day?: number;
}

interface VaultInfo {
    id: number;
    user_id: number;
    card_number: string;
    balance: string;
    locked_balance: string;
    is_enabled: boolean;
    user: UserInfo;
}

export default function ActivatedUsersPage() {
    const [vaults, setVaults] = useState<VaultInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    // Modal State
    const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTogglingId, setIsTogglingId] = useState<number | null>(null);

    // Form State
    const [cashbackForm, setCashbackForm] = useState({
        cashback_percentage: '',
        receive_cashback_percentage: '',
        cashback_flat_amount: '',
        receive_cashback_flat_amount: '',
        max_cashback_times_per_day: '3'
    });

    // Withdrawal Rules States
    const [viewMode, setViewMode] = useState<'users' | 'rules'>('users');
    const [rules, setRules] = useState<WithdrawalRule[]>([]);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<number | null>(null);

    const [ruleFormData, setRuleFormData] = useState({
        min_withdrawal_amount: '',
        max_withdrawal_amount: '',
        daily_limit: '',
        daily_txn_limit: '',
        min_spend_amount: '',
        min_txn_count: '',
        target_mode: 'ALL', // ALL | SPECIFIC
        target_users_input: '',
        is_active: true,
        is_charge_enabled: false,
        charge_threshold: '',
        charge_percent: '',
        min_charge_amount: '',
        max_charge_amount: '',
        monthly_free_count: ''
    });

    const [targetUsersList, setTargetUsersList] = useState<VaultInfo[]>([]);
    const [targetSearch, setTargetSearch] = useState('');
    const [targetUsersLoading, setTargetUsersLoading] = useState(false);

    const fetchRules = async () => {
        setRulesLoading(true);
        try {
            const data = await apiFetch('/admin/vault-withdrawal-rules');
            setRules(data || []);
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to load rules');
        } finally {
            setRulesLoading(false);
        }
    };

    const fetchTargetUsers = async (search: string) => {
        setTargetUsersLoading(true);
        try {
            const data = await apiFetch(`/admin/vault-cards/activated-users?per_page=100&search=${search}`);
            setTargetUsersList(data?.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setTargetUsersLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'rules') {
            fetchRules();
        }
    }, [viewMode]);

    useEffect(() => {
        if (!isRuleModalOpen || ruleFormData.target_mode !== 'SPECIFIC') return;

        const timer = setTimeout(() => {
            fetchTargetUsers(targetSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [isRuleModalOpen, ruleFormData.target_mode, targetSearch]);

    const toggleTargetUser = (userId: number) => {
        const currentIds = ruleFormData.target_users_input
            ? ruleFormData.target_users_input.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        const idStr = userId.toString();
        let newIds;
        if (currentIds.includes(idStr)) {
            newIds = currentIds.filter(id => id !== idStr);
        } else {
            newIds = [...currentIds, idStr];
        }
        setRuleFormData(prev => ({
            ...prev,
            target_users_input: newIds.join(',')
        }));
    };

    const handleRuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                min_withdrawal_amount: parseFloat(ruleFormData.min_withdrawal_amount || '0'),
                max_withdrawal_amount: ruleFormData.max_withdrawal_amount ? parseFloat(ruleFormData.max_withdrawal_amount) : null,
                daily_limit: ruleFormData.daily_limit ? parseFloat(ruleFormData.daily_limit) : null,
                daily_txn_limit: ruleFormData.daily_txn_limit ? parseInt(ruleFormData.daily_txn_limit) : null,
                min_spend_amount: parseFloat(ruleFormData.min_spend_amount || '0'),
                min_txn_count: parseInt(ruleFormData.min_txn_count || '0'),
                target_users: ruleFormData.target_mode === 'ALL' ? ['*'] : ruleFormData.target_users_input.split(',').map(s => s.trim()).filter(Boolean),
                is_active: ruleFormData.is_active,
                is_charge_enabled: ruleFormData.is_charge_enabled,
                charge_threshold: parseFloat(ruleFormData.charge_threshold || '0'),
                charge_percent: parseFloat(ruleFormData.charge_percent || '0'),
                min_charge_amount: parseFloat(ruleFormData.min_charge_amount || '0'),
                max_charge_amount: parseFloat(ruleFormData.max_charge_amount || '0'),
                monthly_free_count: parseInt(ruleFormData.monthly_free_count || '0')
            };

            const url = editingRuleId ? `/admin/vault-withdrawal-rules/${editingRuleId}` : '/admin/vault-withdrawal-rules';
            const method = editingRuleId ? 'PUT' : 'POST';

            await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            toast.success(editingRuleId ? 'Rule updated successfully' : 'Rule created successfully');
            setIsRuleModalOpen(false);
            setEditingRuleId(null);
            fetchRules();
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to save rule');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditRule = (rule: WithdrawalRule) => {
        setEditingRuleId(rule.id);
        setRuleFormData({
            min_withdrawal_amount: rule.min_withdrawal_amount?.toString() || '',
            max_withdrawal_amount: rule.max_withdrawal_amount?.toString() || '',
            daily_limit: rule.daily_limit?.toString() || '',
            daily_txn_limit: rule.daily_txn_limit?.toString() || '',
            min_spend_amount: rule.min_spend_amount?.toString() || '',
            min_txn_count: rule.min_txn_count?.toString() || '',
            target_mode: rule.target_users?.includes('*') ? 'ALL' : 'SPECIFIC',
            target_users_input: rule.target_users?.includes('*') ? '' : rule.target_users.join(','),
            is_active: !!rule.is_active,
            is_charge_enabled: !!rule.is_charge_enabled,
            charge_threshold: rule.charge_threshold?.toString() || '',
            charge_percent: rule.charge_percent?.toString() || '',
            min_charge_amount: rule.min_charge_amount?.toString() || '',
            max_charge_amount: rule.max_charge_amount?.toString() || '',
            monthly_free_count: rule.monthly_free_count?.toString() || ''
        });
        setIsRuleModalOpen(true);
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await apiFetch(`/admin/vault-withdrawal-rules/${id}`, { method: 'DELETE' });
            toast.success('Rule deleted successfully');
            fetchRules();
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to delete rule');
        }
    };


    const loadActivatedUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/admin/vault-cards/activated-users?page=${page}&search=${searchQuery}&status=${statusFilter}`);
            setVaults(data?.data || []);
            setTotalPages(data?.last_page || 1);
            setTotalResults(data?.total || 0);
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to load vault users');
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, statusFilter]);

    useEffect(() => {
        loadActivatedUsers();
    }, [loadActivatedUsers]);

    // Handle search input with manual trigger or enter trigger
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadActivatedUsers();
    };

    const handleToggleStatus = async (vault: VaultInfo) => {
        if (isTogglingId !== null) return;
        setIsTogglingId(vault.id);
        const newStatus = !vault.is_enabled;
        try {
            const res = await apiFetch(`/admin/vault-cards/${vault.id}/toggle-status`, {
                method: 'POST',
                body: JSON.stringify({ is_enabled: newStatus })
            });
            toast.success(res.message || 'Vault status updated successfully');
            
            // Update local state
            setVaults(prev => prev.map(v => v.id === vault.id ? { ...v, is_enabled: newStatus } : v));
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to toggle status');
        } finally {
            setIsTogglingId(null);
        }
    };

    const openEditModal = (vault: VaultInfo) => {
        setSelectedVault(vault);
        setCashbackForm({
            cashback_percentage: vault.user?.cashback_percentage?.toString() || '0',
            receive_cashback_percentage: vault.user?.receive_cashback_percentage?.toString() || '0',
            cashback_flat_amount: vault.user?.cashback_flat_amount?.toString() || '0',
            receive_cashback_flat_amount: vault.user?.receive_cashback_flat_amount?.toString() || '0',
            max_cashback_times_per_day: vault.user?.max_cashback_times_per_day?.toString() || '3'
        });
        setIsEditModalOpen(true);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVault || !selectedVault.user) return;
        setIsSaving(true);
        try {
            await apiFetch(`/admin/users/${selectedVault.user.id}/cashback`, {
                method: 'POST',
                body: JSON.stringify({
                    cashback_percentage: parseFloat(cashbackForm.cashback_percentage) || 0,
                    receive_cashback_percentage: parseFloat(cashbackForm.receive_cashback_percentage) || 0,
                    cashback_flat_amount: parseFloat(cashbackForm.cashback_flat_amount) || 0,
                    receive_cashback_flat_amount: parseFloat(cashbackForm.receive_cashback_flat_amount) || 0,
                    max_cashback_times_per_day: parseInt(cashbackForm.max_cashback_times_per_day) || 3
                })
            });
            toast.success('User settings updated successfully');
            setIsEditModalOpen(false);
            
            // Reload user data in the vaults list
            loadActivatedUsers();
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout title={viewMode === 'users' ? "Vault Users & Cashback Settings" : "Vault Withdrawal Rules"}>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {/* Back button and title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {viewMode === 'users' ? (
                            <>
                                <Link
                                    href="/vault-cards"
                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Cards
                                </Link>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activated Vault Users</h1>
                                <p className="text-slate-500 text-sm font-medium">Manage enabled status, cashback rules, and daily usage frequencies for active vault holders</p>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setViewMode('users')}
                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors mb-2 text-left"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Users
                                </button>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vault Withdrawal Rules</h1>
                                <p className="text-slate-500 text-sm font-medium">Configure rules and limits for Vault Card to Wallet transfers</p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'users' ? 'rules' : 'users')}
                            className="inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-colors shadow-md"
                        >
                            <Settings className="w-4 h-4" />
                            {viewMode === 'users' ? 'Withdrawal Rules' : 'View Users'}
                        </button>
                        {viewMode === 'users' ? (
                            <button
                                onClick={loadActivatedUsers}
                                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 transition-colors"
                                title="Refresh List"
                            >
                                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingRuleId(null);
                                    setRuleFormData({
                                        min_withdrawal_amount: '',
                                        max_withdrawal_amount: '',
                                        daily_limit: '',
                                        daily_txn_limit: '',
                                        min_spend_amount: '',
                                        min_txn_count: '',
                                        target_mode: 'ALL',
                                        target_users_input: '',
                                        is_active: true,
                                        is_charge_enabled: false,
                                        charge_threshold: '',
                                        charge_percent: '',
                                        min_charge_amount: '',
                                        max_charge_amount: '',
                                        monthly_free_count: ''
                                    });
                                    setIsRuleModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-colors shadow-md"
                            >
                                <Plus className="w-4 h-4" /> New Rule
                            </button>
                        )}
                    </div>
                </div>

                {viewMode === 'users' && (
                    <>
                        {/* Filters and search bar */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-200/60">
                            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by name, mobile, email, or card number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-sm text-slate-800"
                                />
                                <button type="submit" className="hidden" />
                            </form>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200">
                                    {(['all', 'active', 'inactive'] as const).map((stat) => (
                                        <button
                                            key={stat}
                                            onClick={() => {
                                                setStatusFilter(stat);
                                                setPage(1);
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                statusFilter === stat
                                                    ? "bg-slate-900 text-white"
                                                    : "text-slate-500 hover:text-slate-900"
                                            )}
                                        >
                                            {stat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Layout */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Clock className="w-10 h-10 text-indigo-500 animate-spin" />
                                <p className="text-slate-400 font-medium text-sm">Loading vault users...</p>
                            </div>
                        ) : vaults.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                                    <CreditCard className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1">No Vault Users Found</h3>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                    No users matched your filters or search query. Try modifying your search.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">User / Account Details</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Card Number</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Balance</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Cashback Configuration</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vaults.map((vault) => {
                                                const user = vault.user || {};
                                                const hasCustomCashback = 
                                                    ((user.cashback_percentage || 0) > 0) || 
                                                    ((user.receive_cashback_percentage || 0) > 0) || 
                                                    ((user.cashback_flat_amount || 0) > 0) || 
                                                    ((user.receive_cashback_flat_amount || 0) > 0);

                                                return (
                                                    <tr key={vault.id} className="hover:bg-slate-50/50 transition-colors">
                                                        {/* User Info */}
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-800 text-sm">{user.name || 'Unknown User'}</span>
                                                                <span className="text-slate-400 text-xs mt-0.5">{user.mobile_number || 'No phone'}</span>
                                                                <span className="text-slate-400 text-[10px]">{user.email || ''}</span>
                                                            </div>
                                                        </td>

                                                        {/* Card Details */}
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                                    <CreditCard className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-mono text-slate-700 text-sm tracking-wider">
                                                                    {vault.card_number ? vault.card_number.replace(/(.{4})/g, '$1 ').trim() : 'N/A'}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Balance */}
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-800 text-sm inline-flex items-center">
                                                                    {(parseFloat(vault.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                                </span>
                                                                {parseFloat(vault.locked_balance) > 0 && (
                                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                                        Locked: {(parseFloat(vault.locked_balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Cashback Config */}
                                                        <td className="px-6 py-5">
                                                            {hasCustomCashback ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(user.cashback_percentage || 0) > 0 && (
                                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-md border border-emerald-100">
                                                                                Send: {user.cashback_percentage}%
                                                                            </span>
                                                                        )}
                                                                        {(user.cashback_flat_amount || 0) > 0 && (
                                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-md border border-emerald-100">
                                                                                Send: {user.cashback_flat_amount}
                                                                            </span>
                                                                        )}
                                                                        {(user.receive_cashback_percentage || 0) > 0 && (
                                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-md border border-blue-100">
                                                                                Recv: {user.receive_cashback_percentage}%
                                                                            </span>
                                                                        )}
                                                                        {(user.receive_cashback_flat_amount || 0) > 0 && (
                                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-md border border-blue-100">
                                                                                Recv: {user.receive_cashback_flat_amount}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] font-semibold text-slate-400 mt-1">
                                                                        Limit: {user.max_cashback_times_per_day ?? 3} times/day
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-400 text-xs italic">System Default Rules</span>
                                                                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                                                        Limit: {user.max_cashback_times_per_day ?? 3} times/day
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Enable/Disable Status */}
                                                        <td className="px-6 py-5">
                                                            <button
                                                                onClick={() => handleToggleStatus(vault)}
                                                                disabled={isTogglingId !== null}
                                                                className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-50",
                                                                    vault.is_enabled
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50"
                                                                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50"
                                                                )}
                                                            >
                                                                {vault.is_enabled ? (
                                                                    <>
                                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                                        Enabled
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="w-3.5 h-3.5" />
                                                                        Disabled
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-6 py-5 text-right">
                                                            <button
                                                                onClick={() => openEditModal(vault)}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Footer */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                                        <span className="text-slate-400 text-xs font-semibold">
                                            Showing {vaults.length} of {totalResults} active accounts
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                                disabled={page === 1}
                                                className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-slate-700 text-xs font-bold px-3">
                                                Page {page} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={page === totalPages}
                                                className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {viewMode === 'rules' && (
                    <div className="space-y-6">
                        {rulesLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Clock className="w-10 h-10 text-indigo-500 animate-spin" />
                                <p className="text-slate-400 font-medium text-sm">Loading withdrawal rules...</p>
                            </div>
                        ) : rules.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                                    <Settings className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1">No Vault Withdrawal Rules Defined</h3>
                                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                    Create a new rule to specify the withdrawal limits from Vault Card to Wallet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button onClick={() => handleEditRule(rule)} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteRule(rule.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-xl",
                                                rule.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md",
                                                        rule.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                                                    )}>
                                                        {rule.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-black">
                                                        Range: {rule.min_withdrawal_amount} - {rule.max_withdrawal_amount ? `${rule.max_withdrawal_amount}` : 'Unlimited'}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900">
                                                    Daily Limit: {rule.daily_limit ? `${rule.daily_limit}` : 'Unlimited'}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 text-xs font-semibold text-slate-700">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Spend Requirements</p>
                                                <div className="space-y-1">
                                                    <p>Min Spend: {rule.min_spend_amount || '0'}</p>
                                                    <p>Min Transactions: {rule.min_txn_count || '0'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Usage & Targeting</p>
                                                <div className="space-y-1">
                                                    <p>Daily Transactions: {rule.daily_txn_limit || 'Unlimited'}</p>
                                                    <p>Target: {rule.target_users?.includes('*') ? 'All Users' : `Specific Users (${rule.target_users?.length || 0})`}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {rule.is_charge_enabled && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Charges</p>
                                                    <p>Threshold: {rule.charge_threshold}</p>
                                                    <p>Percent: {rule.charge_percent}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Limits & Free Count</p>
                                                    <p>Min/Max: {rule.min_charge_amount}/{rule.max_charge_amount}</p>
                                                    <p>Monthly Free: {rule.monthly_free_count}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Settings Modal */}
            {isEditModalOpen && selectedVault && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => !isSaving && setIsEditModalOpen(false)}
                    />
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                        {/* Header */}
                        <div className="bg-indigo-900 p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/15 rounded-2xl border border-white/20">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                    disabled={isSaving}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Configure User Cashback</h2>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">
                                Settings for {selectedVault.user?.name || 'Account Holder'}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                            {selectedVault.user?.sub_user_id && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
                                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <p className="font-bold">Managed Account</p>
                                        <p className="mt-0.5 text-amber-700/90">This user is managed by a Sub-User. Custom cashback percentages cannot be modified directly.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Max Cashback Times Per Day
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={cashbackForm.max_cashback_times_per_day}
                                        onChange={(e) => setCashbackForm(prev => ({ ...prev, max_cashback_times_per_day: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="e.g. 3"
                                    />
                                    <span className="text-[9px] text-slate-400 ml-1 font-medium">Daily limit on the number of cashback credits this user can earn.</span>
                                </div>

                                {!selectedVault.user?.sub_user_id && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                                Sender Cashback %
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={cashbackForm.cashback_percentage}
                                                disabled={parseFloat(cashbackForm.cashback_flat_amount) > 0}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCashbackForm(prev => ({
                                                        ...prev,
                                                        cashback_percentage: val,
                                                        cashback_flat_amount: parseFloat(val) > 0 ? '' : prev.cashback_flat_amount
                                                    }));
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all",
                                                    parseFloat(cashbackForm.cashback_flat_amount) > 0 && "opacity-50 cursor-not-allowed"
                                                )}
                                                placeholder="e.g. 5"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                                Receiver Cashback %
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={cashbackForm.receive_cashback_percentage}
                                                disabled={parseFloat(cashbackForm.receive_cashback_flat_amount) > 0}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCashbackForm(prev => ({
                                                        ...prev,
                                                        receive_cashback_percentage: val,
                                                        receive_cashback_flat_amount: parseFloat(val) > 0 ? '' : prev.receive_cashback_flat_amount
                                                    }));
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all",
                                                    parseFloat(cashbackForm.receive_cashback_flat_amount) > 0 && "opacity-50 cursor-not-allowed"
                                                )}
                                                placeholder="e.g. 2"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                                Sender Flat Cashback
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={cashbackForm.cashback_flat_amount}
                                                disabled={parseFloat(cashbackForm.cashback_percentage) > 0}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCashbackForm(prev => ({
                                                        ...prev,
                                                        cashback_flat_amount: val,
                                                        cashback_percentage: parseFloat(val) > 0 ? '' : prev.cashback_percentage
                                                    }));
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all",
                                                    parseFloat(cashbackForm.cashback_percentage) > 0 && "opacity-50 cursor-not-allowed"
                                                )}
                                                placeholder="e.g. 100"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                                Receiver Flat Cashback
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={cashbackForm.receive_cashback_flat_amount}
                                                disabled={parseFloat(cashbackForm.receive_cashback_percentage) > 0}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCashbackForm(prev => ({
                                                        ...prev,
                                                        receive_cashback_flat_amount: val,
                                                        receive_cashback_percentage: parseFloat(val) > 0 ? '' : prev.receive_cashback_percentage
                                                    }));
                                                }}
                                                className={cn(
                                                    "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all",
                                                    parseFloat(cashbackForm.receive_cashback_percentage) > 0 && "opacity-50 cursor-not-allowed"
                                                )}
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-indigo-900 hover:bg-indigo-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? (
                                        <Clock className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Save Configuration
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rule Creation / Edit Modal */}
            {isRuleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => !isSaving && setIsRuleModalOpen(false)}
                    />
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-indigo-900 p-8 text-white relative shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/15 rounded-2xl border border-white/20">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => setIsRuleModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                    disabled={isSaving}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                {editingRuleId ? 'Edit Withdrawal Rule' : 'New Withdrawal Rule'}
                            </h2>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">
                                Define constraints for Vault Card to Wallet withdrawals
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRuleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Min Withdrawal Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={ruleFormData.min_withdrawal_amount}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, min_withdrawal_amount: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="e.g. 100"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Max Withdrawal Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={ruleFormData.max_withdrawal_amount}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, max_withdrawal_amount: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="Unlimited"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Daily Limit
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={ruleFormData.daily_limit}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, daily_limit: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="Unlimited"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Daily Transaction Limit (Times)
                                    </label>
                                    <input
                                        type="number"
                                        value={ruleFormData.daily_txn_limit}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, daily_txn_limit: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="Unlimited"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Min Spend Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={ruleFormData.min_spend_amount}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, min_spend_amount: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                        Min Transaction Count
                                    </label>
                                    <input
                                        type="number"
                                        value={ruleFormData.min_txn_count}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, min_txn_count: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-800 focus:bg-white transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Charge Settings */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Enable Transaction Charges</h4>
                                        <p className="text-[10px] text-slate-400 font-medium">Apply a service fee to withdrawals exceeding a threshold.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={ruleFormData.is_charge_enabled}
                                        onChange={(e) => setRuleFormData(prev => ({ ...prev, is_charge_enabled: e.target.checked }))}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                                    />
                                </div>

                                {ruleFormData.is_charge_enabled && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                                Charge Threshold
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={ruleFormData.charge_threshold}
                                                onChange={(e) => setRuleFormData(prev => ({ ...prev, charge_threshold: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800"
                                                placeholder="e.g. 5000"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                                Charge Percent (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={ruleFormData.charge_percent}
                                                onChange={(e) => setRuleFormData(prev => ({ ...prev, charge_percent: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800"
                                                placeholder="e.g. 2.5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                                Min Charge
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={ruleFormData.min_charge_amount}
                                                onChange={(e) => setRuleFormData(prev => ({ ...prev, min_charge_amount: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800"
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                                Max Charge
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={ruleFormData.max_charge_amount}
                                                onChange={(e) => setRuleFormData(prev => ({ ...prev, max_charge_amount: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold text-slate-800"
                                                placeholder="e.g. 150"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                                Monthly Free Count
                                            </label>
                                            <input
                                                type="number"
                                                value={ruleFormData.monthly_free_count}
                                                onChange={(e) => setRuleFormData(prev => ({ ...prev, monthly_free_count: e.target.value }))}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-semibold text-slate-800"
                                                placeholder="e.g. 3"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Targeting */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                                    Targeting
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="target_mode"
                                            value="ALL"
                                            checked={ruleFormData.target_mode === 'ALL'}
                                            onChange={() => setRuleFormData(prev => ({ ...prev, target_mode: 'ALL' }))}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700">All Vault Users</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="target_mode"
                                            value="SPECIFIC"
                                            checked={ruleFormData.target_mode === 'SPECIFIC'}
                                            onChange={() => setRuleFormData(prev => ({ ...prev, target_mode: 'SPECIFIC' }))}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700">Specific Users</span>
                                    </label>
                                </div>

                                {ruleFormData.target_mode === 'SPECIFIC' && (
                                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Search & Select Users</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or phone..."
                                                value={targetSearch}
                                                onChange={(e) => setTargetSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs focus:border-indigo-500 font-medium"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                            {targetUsersLoading ? (
                                                <div className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase">Loading users...</div>
                                            ) : targetUsersList.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase">No users found</div>
                                            ) : targetUsersList.map((vaultItem) => {
                                                const u = vaultItem.user || {};
                                                const isSelected = ruleFormData.target_users_input.split(',').map(s => s.trim()).includes(u.id?.toString());
                                                return (
                                                    <div
                                                        key={vaultItem.id}
                                                        onClick={() => u.id && toggleTargetUser(u.id)}
                                                        className={cn(
                                                            "flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all",
                                                            isSelected ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-800">{u.name || 'Unknown User'}</span>
                                                            <span className="text-[10px] text-slate-400 font-semibold">{u.mobile_number}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-slate-900 bg-indigo-50 px-2 py-1 rounded-lg">
                                                                {(parseFloat(vaultItem.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => {}}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Rule Active Status</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Inactive rules will not be applied to withdrawals.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={ruleFormData.is_active}
                                    onChange={(e) => setRuleFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRuleModalOpen(false)}
                                    className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-indigo-900 hover:bg-indigo-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? (
                                        <Clock className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" /> Save Rule
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
