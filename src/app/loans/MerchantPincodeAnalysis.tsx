'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Users, FileText, ChevronRight, Loader2, Sparkles, Download } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PincodeSummary {
    pincode: string;
    merchants: number;
    approved_loans: number;
}

interface LoanDetail {
    id: number;
    display_id: string;
    applicant: string;
    amount: number;
    status: string;
    pincode: string;
}

interface Props {
    onClose: () => void;
}

const MerchantPincodeAnalysis: React.FC<Props> = ({ onClose }) => {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState<{ summary: PincodeSummary[], details: Record<string, LoanDetail[]> } | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [expandedPin, setExpandedPin] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const blob = await apiFetch('/admin/analytics/pincode-stats/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pincode_analysis_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiFetch('/admin/analytics/pincode-stats');
                setData(response);
            } catch (error) {
                console.error('Error fetching pincode stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
        // Trigger unroll animation after mount
        const timer = setTimeout(() => setIsOpen(true), 100);
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/40 backdrop-blur-md overflow-hidden">
            <div 
                ref={modalRef}
                className={`relative w-full max-w-4xl transition-all duration-1000 ease-out flex flex-col items-center perspective-[1200px] ${
                    isOpen ? 'opacity-100' : 'opacity-0 scale-95'
                }`}
            >
                {/* Close Button - Outside the unrolling manuscript for usability */}
                <button 
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/20 hover:rotate-90"
                >
                    <X size={24} />
                </button>

                {/* Top Roller */}
                <div className="w-full h-16 relative z-30 rounded-t-2xl shadow-2xl transition-transform duration-1000"
                    style={{
                        background: 'linear-gradient(to bottom, #111 0%, #333 15%, #f8f8f8 40%, #ddd 65%, #222 95%, #000 100%)',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.5)'
                    }}
                >
                    <div className="absolute left-[-15px] top-2 bottom-2 w-8 bg-gradient-to-r from-black via-zinc-800 to-black rounded-full" />
                    <div className="absolute right-[-15px] top-2 bottom-2 w-8 bg-gradient-to-r from-black via-zinc-800 to-black rounded-full" />
                </div>

                {/* Manuscript Paper Background */}
                <div 
                    className={`relative w-[96%] bg-white z-20 shadow-2xl transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex flex-col ${
                        isOpen ? 'h-[75vh]' : 'h-0'
                    }`}
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 20% 30%, rgba(200,200,250,0.05) 0%, transparent 40%),
                            radial-gradient(circle at 80% 70%, rgba(250,200,250,0.05) 0%, transparent 50%),
                            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
                        `,
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.03), inset 12px 0 24px rgba(0,0,0,0.05), inset -12px 0 24px rgba(0,0,0,0.05)'
                    }}
                >
                    <div className={`p-8 sm:p-12 w-full transition-opacity duration-700 delay-500 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b-2 border-slate-100 pb-8">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight mb-2">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                        Pincode Audit
                                    </span>
                                </h1>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles size={14} className="text-blue-500 animate-pulse" />
                                    Merchant & Loan Geographic Matrix
                                </p>
                            </div>
                            <div className="flex gap-3 items-center">
                                <button 
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200 flex items-center gap-2 group/export disabled:opacity-50"
                                >
                                    {exporting ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Download size={18} className="group-hover/export:-translate-y-1 transition-transform" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Export Excel</span>
                                </button>
                                <div className="px-4 py-2 bg-pink-50 rounded-2xl border border-pink-100 shadow-sm">
                                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest leading-none mb-1">Total Regions</p>
                                    <p className="text-xl font-black text-pink-600 leading-none">{data?.summary.length || 0}</p>
                                </div>
                                <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Total Merchants</p>
                                    <p className="text-xl font-black text-blue-600 leading-none">
                                        {data?.summary.reduce((acc, curr) => acc + curr.merchants, 0) || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 size={40} className="text-blue-500 animate-spin" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Geographic Data...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Tabular Summary */}
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pincode</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Merchants</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Approved Loans</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {data?.summary.map((row) => (
                                                <React.Fragment key={row.pincode}>
                                                    <tr className={`group hover:bg-slate-50/50 transition-colors ${expandedPin === row.pincode ? 'bg-slate-50/80' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center shadow-sm">
                                                                    <MapPin size={16} />
                                                                </div>
                                                                <span className="text-sm font-black text-slate-900 font-mono drop-shadow-[0_0_8px_rgba(236,72,153,0.1)]">
                                                                    {row.pincode}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-full shadow-sm">
                                                                {row.merchants}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 text-xs font-black rounded-full shadow-sm ${
                                                                row.approved_loans > 0 
                                                                ? 'bg-green-50 text-green-600' 
                                                                : 'bg-slate-50 text-slate-400'
                                                            }`}>
                                                                {row.approved_loans}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => setExpandedPin(expandedPin === row.pincode ? null : row.pincode)}
                                                                disabled={row.approved_loans === 0}
                                                                className={`p-2 rounded-xl transition-all ${
                                                                    expandedPin === row.pincode 
                                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                                                                    : 'text-blue-400 hover:bg-blue-50 disabled:opacity-20'
                                                                }`}
                                                            >
                                                                <ChevronRight size={18} className={`transition-transform duration-300 ${expandedPin === row.pincode ? 'rotate-90' : ''}`} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    
                                                    {/* Expanded Loan Details */}
                                                    {expandedPin === row.pincode && data.details[row.pincode] && (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-6 bg-slate-50/80 border-t border-slate-100">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {data.details[row.pincode].map((loan) => (
                                                                        <div key={loan.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all flex items-center justify-between group/loan">
                                                                            <div className="min-w-0 pr-4">
                                                                                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">
                                                                                    #{loan.display_id || loan.id}
                                                                                </p>
                                                                                <p className="text-sm font-black text-slate-800 truncate">{loan.applicant}</p>
                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                        ₹{loan.amount.toLocaleString()}
                                                                                    </span>
                                                                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                                                                                        {loan.status}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/loan:bg-blue-50 group-hover/loan:text-blue-500 transition-colors">
                                                                                <FileText size={18} />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-12 flex items-center gap-3 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                            <div className="w-10 h-10 rounded-2xl bg-white text-blue-500 flex items-center justify-center shadow-sm">
                                <Sparkles size={20} />
                            </div>
                            <p className="text-xs font-bold text-blue-600/70 leading-relaxed">
                                This audit data helps identify high-density business hubs and correlated loan risks within specific postal codes. Expanded views reveal individual applicant performance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Roller */}
                <div className={`w-full h-16 relative z-30 rounded-b-2xl shadow-2xl transition-transform duration-1000 ${
                    isOpen ? 'translate-y-0' : 'translate-y-[-75vh]'
                }`}
                    style={{
                        background: 'linear-gradient(to bottom, #000 0%, #222 5%, #ddd 35%, #f8f8f8 60%, #333 85%, #111 100%)',
                        boxShadow: '0 -15px 35px rgba(0,0,0,0.5)'
                    }}
                >
                    <div className="absolute left-[-15px] top-2 bottom-2 w-8 bg-gradient-to-r from-black via-zinc-800 to-black rounded-full" />
                    <div className="absolute right-[-15px] top-2 bottom-2 w-8 bg-gradient-to-r from-black via-zinc-800 to-black rounded-full" />
                </div>
            </div>

            <style jsx>{`
                .perspective-1200 {
                    perspective: 1200px;
                }
            `}</style>
        </div>
    );
};

export default MerchantPincodeAnalysis;
