'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Info, ReceiptIndianRupee, Calendar, Clock, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MaintenanceRule {
    id: number;
    name: string;
    amount: number;
    type: 'FLAT' | 'PERCENTAGE';
    frequency: 'ONCE' | 'DAILY';
    description: string;
    users_count?: number;
}

interface MaintenanceChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUserIds: number[];
    onSuccess: () => void;
}

export default function MaintenanceChargeModal({ isOpen, onClose, selectedUserIds, onSuccess }: MaintenanceChargeModalProps) {
    const [rules, setRules] = useState<MaintenanceRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Rule State
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newType, setNewType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');
    const [newFrequency, setNewFrequency] = useState<'ONCE' | 'DAILY'>('ONCE');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadRules();
        }
    }, [isOpen]);

    const loadRules = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/maintenance-rules');
            setRules(data);
        } catch (e) {
            console.error("Failed to load maintenance rules", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiFetch('/admin/maintenance-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    amount: parseFloat(newAmount),
                    type: newType,
                    frequency: newFrequency,
                    description: newDescription
                })
            });
            setIsCreating(false);
            setNewName('');
            setNewAmount('');
            setNewDescription('');
            loadRules();
        } catch (e) {
            alert("Failed to create rule");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm("Are you sure? This will unassign all users from this rule.")) return;
        try {
            await apiFetch(`/admin/maintenance-rules/${id}`, { method: 'DELETE' });
            loadRules();
            if (selectedRuleId === id) setSelectedRuleId(null);
        } catch (e) {
            alert("Failed to delete rule");
        }
    };

    const handleAssign = async () => {
        if (!selectedRuleId) return;
        setIsSubmitting(true);
        try {
            await apiFetch('/admin/maintenance-rules/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: selectedUserIds,
                    maintenance_rule_id: selectedRuleId
                })
            });
            alert("Success! Maintenance rule assigned.");
            onSuccess();
            onClose();
        } catch (e) {
            alert("Failed to assign rule");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-red-50/50 to-transparent">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <ReceiptIndianRupee className="text-red-600" size={28} />
                            Maintenance Charge
                        </h2>
                        <p className="text-sm font-bold text-slate-500 mt-1">
                            Applying to {selectedUserIds.length} selected users
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {!isCreating ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Existing Rule</h3>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                                >
                                    <Plus size={16} />
                                    Define New Rule
                                </button>
                            </div>

                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                </div>
                            ) : rules.length === 0 ? (
                                <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <Info className="mx-auto text-slate-300 mb-2" size={32} />
                                    <p className="font-bold text-slate-400">No maintenance rules defined yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            onClick={() => setSelectedRuleId(rule.id)}
                                            className={cn(
                                                "p-5 rounded-3xl border-2 transition-all cursor-pointer relative group",
                                                selectedRuleId === rule.id
                                                    ? "border-red-500 bg-red-50/30 ring-4 ring-red-500/10"
                                                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-lg">{rule.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                            rule.frequency === 'DAILY' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                                        )}>
                                                            {rule.frequency}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {rule.users_count || 0} users
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-red-600">
                                                        {rule.type === 'FLAT' ? `₹${rule.amount}` : `${rule.amount}%`}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rule.type}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 pr-10">{rule.description}</p>
                                            
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteRule(rule.id); }}
                                                className="absolute bottom-5 right-5 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleCreateRule} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <span className="text-slate-200">/</span>
                                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest">Define New Rule</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rule Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Monthly Account Maintenance"
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Charge Type</label>
                                        <div className="flex bg-slate-50 p-1 rounded-2xl">
                                            <button
                                                type="button"
                                                onClick={() => setNewType('FLAT')}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    newType === 'FLAT' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                                                )}
                                            >
                                                Flat (₹)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewType('PERCENTAGE')}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    newType === 'PERCENTAGE' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                                                )}
                                            >
                                                Percentage (%)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                        <div className="flex bg-slate-50 p-1 rounded-2xl">
                                            <button
                                                type="button"
                                                onClick={() => setNewFrequency('ONCE')}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    newFrequency === 'ONCE' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                                                )}
                                            >
                                                One-Time
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewFrequency('DAILY')}
                                                className={cn(
                                                    "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    newFrequency === 'DAILY' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                                                )}
                                            >
                                                Daily (12 AM)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">
                                            {newType === 'FLAT' ? '₹' : '%'}
                                        </span>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                            value={newAmount}
                                            onChange={(e) => setNewAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Visible in History)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                                        placeholder="Enter reason for charge..."
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? "Creating..." : "Save Maintenance Rule"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                {!isCreating && (
                    <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-xs font-bold text-red-700 leading-relaxed">
                                IMPORTANT: Assigning a <span className="font-black underline font-mono italic px-1 bg-red-100 rounded">One-Time</span> rule will deduct the amount <span className="font-black italic">IMMEDIATELY</span>. Daily rules will be deducted every night at 12:00 AM.
                            </p>
                        </div>
                        
                        <button
                            disabled={!selectedRuleId || isSubmitting}
                            onClick={handleAssign}
                            className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? "Processing..." : (
                                <>
                                    Apply Charge to Users
                                    <ReceiptIndianRupee size={20} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
