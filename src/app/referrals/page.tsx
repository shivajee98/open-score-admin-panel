'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Users, Copy, CheckCircle2, Ticket, Link as LinkIcon } from 'lucide-react';

const CUSTOMER_APP_URL = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || 'https://openscore.msmeloan.sbs';

export default function ReferralsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ name: '', code: '', cashback_amount: '' });
    const [creating, setCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyLink = (code: string, id: string) => {
        const link = `${CUSTOMER_APP_URL}/?ref=${code}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/referrals');
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to load campaigns', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await apiFetch('/admin/referrals', {
                method: 'POST',
                body: JSON.stringify(newCampaign)
            });
            setIsModalOpen(false);
            setNewCampaign({ name: '', code: '', cashback_amount: '' });
            loadCampaigns();
        } catch (e) {
            alert('Failed to create campaign. Code must be unique.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <AdminLayout title="Referral System">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900">Referral Campaigns</h2>
                    <p className="text-slate-500 text-sm font-medium">Create and track invite links.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                    <Plus size={16} /> Create Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-12 flex justify-center">
                        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
                        No active referral campaigns. Create one to get started!
                    </div>
                ) : (
                    campaigns.map((camp: any) => (
                        <div key={camp.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Ticket size={24} />
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Active
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 mb-1">{camp.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <button
                                    onClick={() => handleCopyLink(camp.code, camp.id)}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors group w-full justify-center border border-slate-200"
                                >
                                    {copiedId === camp.id ? (
                                        <>
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon size={14} className="text-slate-400 group-hover:text-slate-600" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Copy Invite Link</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cashback</p>
                                    <p className="text-xl font-black text-slate-900">₹{parseFloat(camp.cashback_amount).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signups</p>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Users size={14} className="text-slate-400" />
                                        <p className="text-xl font-black text-slate-900">{camp.users_count}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-slate-900 mb-6">New Campaign</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Campaign Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Sale 2026"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newCampaign.name}
                                    onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Referral Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SUMMER50"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                                    value={newCampaign.code}
                                    onChange={e => setNewCampaign({ ...newCampaign, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cashback Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newCampaign.cashback_amount}
                                    onChange={e => setNewCampaign({ ...newCampaign, cashback_amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'Creating...' : 'Create Campaign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
