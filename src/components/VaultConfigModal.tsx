'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { X, Plus, Trash2, Eye, EyeOff, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSuccess: () => void;
}

export default function VaultConfigModal({ isOpen, onClose, user, onSuccess }: VaultConfigModalProps) {
    const [loading, setLoading] = useState(true);
    const [vault, setVault] = useState<any>(null);
    const [rates, setRates] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);

    // Enable form
    const [expiryDate, setExpiryDate] = useState('');
    const [enabling, setEnabling] = useState(false);

    // Add rate form
    const [newTenure, setNewTenure] = useState('');
    const [newRate, setNewRate] = useState('');
    const [newPenaltyFlat, setNewPenaltyFlat] = useState('');
    const [newPenaltyRate, setNewPenaltyRate] = useState('');
    const [newHidePenalty, setNewHidePenalty] = useState(false);
    const [addingRate, setAddingRate] = useState(false);

    const fetchVault = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await apiFetch(`/admin/users/${user.id}/vault`);
            setVault(data.vault);
            setRates(data.rates || []);
            setDeposits(data.deposits || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchVault();
        }
    }, [isOpen, user]);

    const handleEnable = async () => {
        if (!expiryDate) return alert('Set an expiry date');
        setEnabling(true);
        try {
            await apiFetch(`/admin/users/${user.id}/vault/enable`, {
                method: 'POST',
                body: JSON.stringify({ expiry_date: expiryDate }),
            });
            await fetchVault();
            onSuccess();
        } catch (e: any) {
            alert(e.message || 'Failed to enable');
        } finally {
            setEnabling(false);
        }
    };

    const handleDisable = async () => {
        if (!confirm('Disable vault? Data will be preserved but hidden from the user.')) return;
        try {
            await apiFetch(`/admin/users/${user.id}/vault/disable`, { method: 'POST' });
            await fetchVault();
            onSuccess();
        } catch (e: any) {
            alert(e.message || 'Failed');
        }
    };

    const handleAddRate = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingRate(true);
        try {
            await apiFetch(`/admin/users/${user.id}/vault/rate`, {
                method: 'POST',
                body: JSON.stringify({
                    tenure_days: parseInt(newTenure),
                    interest_rate: parseFloat(newRate),
                    penalty_flat: parseFloat(newPenaltyFlat) || 0,
                    penalty_rate: parseFloat(newPenaltyRate) || 0,
                    hide_penalty: newHidePenalty,
                }),
            });
            setNewTenure('');
            setNewRate('');
            setNewPenaltyFlat('');
            setNewPenaltyRate('');
            setNewHidePenalty(false);
            await fetchVault();
        } catch (e: any) {
            alert(e.message || 'Error');
        } finally {
            setAddingRate(false);
        }
    };

    const handleRemoveRate = async (tenureDays: number) => {
        if (!confirm(`Remove ${tenureDays}-day rate?`)) return;
        try {
            await apiFetch(`/admin/users/${user.id}/vault/rate/remove`, {
                method: 'POST',
                body: JSON.stringify({ tenure_days: tenureDays }),
            });
            await fetchVault();
        } catch (e: any) {
            alert(e.message || 'Error');
        }
    };

    if (!isOpen) return null;

    const formatCard = (num: string) => {
        if (!num) return '—';
        return num.replace(/(.{4})/g, '$1 ').trim();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Vault Configuration</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.name} • {user?.mobile_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Card Preview */}
                            {vault?.card_number && (
                                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl p-5 text-white relative overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 opacity-40" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Open Score Vault</span>
                                        </div>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                            vault.is_enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                        )}>
                                            {vault.is_enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <p className="text-lg font-mono tracking-[0.25em] mb-3 opacity-90">{formatCard(vault.card_number)}</p>
                                    <div className="flex items-center gap-6 text-[10px] font-bold opacity-50">
                                        <div>
                                            <span className="uppercase tracking-wider block text-[8px]">Expiry</span>
                                            {vault.expiry_date ? new Date(vault.expiry_date).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) : '—'}
                                        </div>
                                        <div>
                                            <span className="uppercase tracking-wider block text-[8px]">CVC</span>
                                            {vault.cvc || '—'}
                                        </div>
                                        <div>
                                            <span className="uppercase tracking-wider block text-[8px]">Balance</span>
                                            <span className="text-white opacity-100 text-sm font-black">₹{parseFloat(vault.balance || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Toggle Section */}
                            <div className="flex items-center gap-4">
                                {!vault?.is_enabled ? (
                                    <div className="flex-1 flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Card Expiry Date</label>
                                            <input
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                        <button
                                            onClick={handleEnable}
                                            disabled={enabling || !expiryDate}
                                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-40 shadow-lg shadow-emerald-200"
                                        >
                                            {enabling ? '...' : 'Enable Vault'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDisable}
                                        className="px-5 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-200"
                                    >
                                        Disable Vault
                                    </button>
                                )}
                            </div>

                            {/* Rate Configuration */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tenure & Rate Plans</h4>

                                {rates.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {rates.map((rate: any) => (
                                            <div key={rate.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <span className="text-lg font-black text-slate-900">{rate.tenure_days}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase block">days</span>
                                                    </div>
                                                    <div className="h-6 w-px bg-slate-200" />
                                                    <div>
                                                        <span className="text-sm font-black text-emerald-600">{rate.interest_rate}%</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase block">interest</span>
                                                    </div>
                                                    <div className="h-6 w-px bg-slate-200" />
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-rose-500">
                                                                {rate.penalty_flat > 0 ? `₹${rate.penalty_flat} flat` : ''}
                                                                {rate.penalty_flat > 0 && rate.penalty_rate > 0 ? ' + ' : ''}
                                                                {rate.penalty_rate > 0 ? `${rate.penalty_rate}%` : ''}
                                                                {rate.penalty_flat == 0 && rate.penalty_rate == 0 ? 'No Penalty' : ''}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase block">penalty</span>
                                                        </div>
                                                        {rate.hide_penalty && (
                                                            <span title="Penalty hidden from user" className="p-1 bg-amber-50 rounded text-amber-500">
                                                                <EyeOff className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveRate(rate.tenure_days)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <form onSubmit={handleAddRate} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tenure (Days)</label>
                                            <input type="number" min="1" value={newTenure} onChange={(e) => setNewTenure(e.target.value)} required
                                                className="w-full px-3 py-2.5 bg-white border border-indigo-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" placeholder="30" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Interest Rate (%)</label>
                                            <input type="number" step="0.01" min="0" value={newRate} onChange={(e) => setNewRate(e.target.value)} required
                                                className="w-full px-3 py-2.5 bg-white border border-indigo-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-200" placeholder="5.00" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Penalty Flat (₹)</label>
                                            <input type="number" step="0.01" min="0" value={newPenaltyFlat} onChange={(e) => setNewPenaltyFlat(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-rose-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-rose-200" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Penalty Rate (%)</label>
                                            <input type="number" step="0.01" min="0" max="100" value={newPenaltyRate} onChange={(e) => setNewPenaltyRate(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-rose-100 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-rose-200" placeholder="0" />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => setNewHidePenalty(!newHidePenalty)}
                                                className={cn(
                                                    "w-full py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border",
                                                    newHidePenalty
                                                        ? "bg-amber-50 text-amber-600 border-amber-200"
                                                        : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                                )}
                                            >
                                                {newHidePenalty ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                {newHidePenalty ? 'Hidden' : 'Visible'}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={addingRate}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {addingRate ? 'Saving...' : 'Add Rate Plan'}
                                    </button>
                                </form>
                            </div>

                            {/* Active Deposits */}
                            {deposits.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Deposits</h4>
                                    <div className="space-y-2">
                                        {deposits.map((d: any) => (
                                            <div key={d.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-black text-slate-900">₹{parseFloat(d.amount).toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{d.tenure_days}d • {d.interest_rate}%</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                                        d.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                                    )}>{d.status}</span>
                                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">
                                                        Cycle: {new Date(d.cycle_start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
