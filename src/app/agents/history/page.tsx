'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Download, Archive, User, Calendar, FileText, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentHistoryPage() {
    const [archives, setArchives] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const loadArchives = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/agent-archives');
            setArchives(data);
        } catch (e) {
            console.error('Failed to load archives', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchives();
    }, []);

    const filteredArchives = archives.filter((a: any) => 
        a.name?.toLowerCase().includes(search.toLowerCase()) || 
        a.mobile_number?.includes(search) ||
        a.vendor?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => {
        const headers = ["Unlinked At", "Agent Name", "Mobile", "Vendor", "Total Loans", "Total QR", "Paid Earnings", "Pending Earnings"];
        const rows = filteredArchives.map((a: any) => [
            new Date(a.created_at).toLocaleString(),
            a.name,
            a.mobile_number,
            a.vendor?.name || 'N/A',
            a.total_loans,
            a.total_qr,
            a.earnings_paid,
            a.earnings_pending
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `agent_unlink_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout title="Unlinked Agents History">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search unlinked agents or vendors..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                    <Download className="w-5 h-5" />
                    Export to Excel (CSV)
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Unlinked At</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Agent Details</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Former Vendor</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Work Stats</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Lifetime Earnings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredArchives.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400 font-bold italic">
                                        No unlinking history found.
                                    </td>
                                </tr>
                            ) : (
                                filteredArchives.map((archive: any) => (
                                    <tr key={archive.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{new Date(archive.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <span className="text-[10px] text-slate-400 font-mono italic">{new Date(archive.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{archive.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono tracking-tighter">{archive.mobile_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {archive.vendor ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-indigo-600">{archive.vendor.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">Code: {archive.vendor.referral_code}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300 italic">Deleted Vendor</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="inline-flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Loans</span>
                                                    <span className="text-sm font-black text-blue-600 font-mono">{archive.total_loans}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-100 pl-4">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">QR</span>
                                                    <span className="text-sm font-black text-teal-600 font-mono">{archive.total_qr}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex flex-col">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400">PAID:</span>
                                                    <span className="text-sm font-black text-emerald-600 font-mono">₹{archive.earnings_paid.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-[10px] font-bold text-slate-400">PENDING:</span>
                                                    <span className="text-xs font-bold text-amber-500 font-mono">₹{archive.earnings_pending.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
