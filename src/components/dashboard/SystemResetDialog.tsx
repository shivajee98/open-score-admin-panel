'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCcw, AlertOctagon, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

const RESET_OPTIONS = [
    { id: 'loans', label: 'Loans & Repayments', description: 'Truncates loans, EMIs, and allocations.', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'users', label: 'Customers & Merchants', description: 'Deletes all users except Admins and System.', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'agents', label: 'Agents (Sub-Users)', description: 'Deletes all agent records and their stats.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'transactions', label: 'Wallet Transactions', description: 'Clears all ledger history for all wallets.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'treasury', label: 'Treasury Balance', description: 'Resets System Treasury (AdminFund) to ₹0.', color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function SystemResetDialog() {
    const [selected, setSelected] = useState<string[]>([]);
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleReset = async () => {
        if (confirmText !== 'RESET') {
            toast.error("Please type RESET to confirm");
            return;
        }

        if (selected.length === 0) {
            toast.error("Select at least one component to reset");
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiFetch('/admin/system/reset', {
                method: 'POST',
                body: JSON.stringify({ components: selected })
            });

            toast.success("System Reset Successful");
            setIsOpen(false);
            setConfirmText('');
            setSelected([]);
            window.location.reload(); // Reload to refresh all stats
        } catch (error: any) {
            toast.error(error.message || "Reset failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-2 font-bold rounded-xl h-11 px-6 shadow-sm">
                    <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    System Reset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <div className="bg-rose-600 p-8 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Factory Reset</DialogTitle>
                    </div>
                    <DialogDescription className="text-rose-100 font-medium leading-relaxed">
                        This action is <strong>irreversible</strong>. Select the data modules you wish to wipe from the production environment.
                    </DialogDescription>
                </div>

                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-3">
                        {RESET_OPTIONS.map((opt) => {
                            const isChecked = selected.includes(opt.id);
                            return (
                                <div
                                    key={opt.id}
                                    onClick={() => toggleOption(opt.id)}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer",
                                        isChecked ? "border-rose-500 bg-rose-50/50" : "border-slate-100 bg-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                                        isChecked ? "bg-rose-500 text-white" : cn(opt.bg, opt.color)
                                    )}>
                                        {isChecked ? <Check className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("font-black text-sm uppercase tracking-tight", isChecked ? "text-rose-900" : "text-slate-800")}>{opt.label}</p>
                                        <p className="text-[10px] font-medium text-slate-500">{opt.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Security Confirmation</Label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder='Type "RESET" to confirm'
                            className="h-14 rounded-2xl border-rose-100 bg-rose-50/20 px-6 font-black text-rose-600 placeholder:text-rose-300 focus:ring-rose-200 transition-all"
                        />
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50 flex items-center justify-between sm:justify-between border-t border-slate-100">
                    <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-700" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={isLoading || confirmText !== 'RESET' || selected.length === 0}
                        onClick={handleReset}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest h-14 px-10 rounded-2xl shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                        {isLoading ? "Wiping Data..." : "Execute Reset"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
