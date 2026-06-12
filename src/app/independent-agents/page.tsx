'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { ShieldCheck, UserMinus, Settings2, TrendingUp, Search, History, Save, X, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndependentAgent {
    id: number;
    name: string;
    mobile_number: string;
    my_referral_code: string;
    is_independent: boolean;
    independent_at: string;
    merchant_onboarding_amount: string | number;
    loan_disbursement_commission: string | number;
    vault_card_commission: string | number;
    total_loans: number;
    total_qr: number;
    total_earnings: number;
    former_vendor?: {
        id: number;
        name: string;
        mobile_number: string;
        referral_code: string;
    };
}

const AgentRow = ({ agent, onReload }: { agent: IndependentAgent; onReload: () => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Editable state
    const [qrComm, setQrComm] = useState(agent.merchant_onboarding_amount || 0);
    const [loanComm, setLoanComm] = useState(agent.loan_disbursement_commission || 0);
    const [vaultComm, setVaultComm] = useState(agent.vault_card_commission || 0);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiFetch(`/admin/users/${agent.id}/independent-commissions`, {
                method: 'PUT',
                body: JSON.stringify({
                    merchant_onboarding_amount: parseFloat(qrComm as string),
                    loan_disbursement_commission: parseFloat(loanComm as string),
                    vault_card_commission: parseFloat(vaultComm as string),
                })
            });
            toast.success("Commissions updated for future payouts.");
            setIsEditing(false);
            onReload();
        } catch (e: any) {
            toast.error(e.message || "Failed to update rates.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <tr className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-300">
            {/* Agent Info */}
            <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{agent.name}</span>
                        <span className="text-xs font-mono text-slate-500 tracking-tight">{agent.mobile_number}</span>
                    </div>
                </div>
            </td>

            {/* Former Vendor */}
            <td className="py-4 px-6">
                {agent.former_vendor ? (
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-600">{agent.former_vendor.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">Code: {agent.former_vendor.referral_code || 'N/A'}</span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 italic">Direct/Unknown</span>
                )}
            </td>

            {/* Date Made Independent */}
            <td className="py-4 px-6">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">
                        {new Date(agent.independent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 italic">
                        {new Date(agent.independent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </td>

            {/* Stats */}
            <td className="py-4 px-6">
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Loans</span>
                        <span className="text-sm font-black text-blue-600 font-mono">{agent.total_loans}</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-100 pl-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QR</span>
                        <span className="text-sm font-black text-teal-600 font-mono">{agent.total_qr}</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-100 pl-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Earned</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">₹{agent.total_earnings.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </td>

            {/* Commissions Editor */}
            <td className="py-4 px-6 min-w-[300px]">
                {isEditing ? (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">QR (₹)</span>
                            <input 
                                type="number" 
                                className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                                value={qrComm}
                                onChange={e => setQrComm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Loan (₹)</span>
                            <input 
                                type="number" 
                                className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                                value={loanComm}
                                onChange={e => setLoanComm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Vault (₹)</span>
                            <input 
                                type="number" 
                                className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                                value={vaultComm}
                                onChange={e => setVaultComm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => {
                                    setIsEditing(false);
                                    setQrComm(agent.merchant_onboarding_amount || 0);
                                    setLoanComm(agent.loan_disbursement_commission || 0);
                                    setVaultComm(agent.vault_card_commission || 0);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group/edit">
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">QR Comm.</span>
                                <span className="text-sm font-mono font-black text-slate-700">₹{parseFloat(agent.merchant_onboarding_amount as string || '0')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Loan Comm.</span>
                                <span className="text-sm font-mono font-black text-slate-700">₹{parseFloat(agent.loan_disbursement_commission as string || '0')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Vault Comm.</span>
                                <span className="text-sm font-mono font-black text-slate-700">₹{parseFloat(agent.vault_card_commission as string || '0')}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover/edit:opacity-100">
                            <button 
                                onClick={async () => {
                                    if(!confirm('Rejoin this agent to the main system? They will be direct-connected without a vendor.')) return;
                                    try {
                                        await apiFetch(`/admin/users/${agent.id}/rejoin-system`, { method: 'POST' });
                                        toast.success('Agent rejoined system successfully.');
                                        onReload();
                                    } catch (e: any) {
                                        toast.error(e.message || 'Failed to rejoin system');
                                    }
                                }}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-500 hover:text-emerald-600 rounded-xl transition-all duration-200 border border-emerald-100 shadow-sm"
                                title="Rejoin System"
                            >
                                <Activity className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all duration-200 border border-slate-100 shadow-sm"
                                title="Edit Commissions"
                            >
                                <Settings2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
};

export default function IndependentAgentsPage() {
    const [agents, setAgents] = useState<IndependentAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const loadAgents = async (page = 1) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/independent-agents?page=${page}&per_page=20&search=${encodeURIComponent(search)}`);
            if (res.data) {
                setAgents(res.data);
                setCurrentPage(res.current_page);
                setTotalPages(res.last_page);
                setTotalItems(res.total);
            }
        } catch (e: any) {
            toast.error("Failed to load independent agents.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            loadAgents(1);
        }, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    return (
        <AdminLayout title="Independent Agents">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-3">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">Admin Override</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">Independent Agents</h1>
                        <p className="text-slate-500 text-sm max-w-xl">
                            Manage agents who have been detached from their parent vendors. Their historical earnings remain untouched, but you can adjust their future commission rates here.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="text-xs font-bold text-slate-400 flex items-center gap-2 px-2">
                            <UserMinus className="w-4 h-4 text-amber-500" />
                            {totalItems} Total Unlinked Agents
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Agent Details</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Former Vendor</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Unlinked On</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Historical Stats</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Future Commission Rates</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : agents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400 font-bold italic">
                                        No independent agents found.
                                    </td>
                                </tr>
                            ) : (
                                agents.map(agent => (
                                    <AgentRow key={agent.id} agent={agent} onReload={() => loadAgents(currentPage)} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold">
                            Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => loadAgents(currentPage - 1)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                            >
                                Prev
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => loadAgents(currentPage + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
