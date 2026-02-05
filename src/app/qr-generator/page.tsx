'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { apiFetch } from '@/lib/api';
import { Printer, ArrowLeft, Info, CheckCircle, UserCheck, Trash2, Search, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function QrGenerator() {
    const [count, setCount] = useState(12);
    const [loading, setLoading] = useState(false);
    const [codes, setCodes] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [batchName, setBatchName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCode, setSelectedCode] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        fetchBatches();
    }, []);

    // Fetch batches and set initial state
    const fetchBatches = async () => {
        try {
            const res = await apiFetch('/admin/qr/batches');
            setBatches(res);
            if (res.length > 0 && !selectedBatchId) {
                setSelectedBatchId(res[0].id);
                fetchCodes(res[0].id);
            }
        } catch (e: any) {
            console.error('Failed to fetch batches', e);
        }
    };

    // Fetch codes for a specific batch
    const fetchCodes = async (batchId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/qr/batches/${batchId}`);
            setCodes(res);
        } catch (e: any) {
            alert(e.message || 'Failed to fetch codes');
        } finally {
            setLoading(false);
        }
    };

    const handleBatchChange = (id: string) => {
        setSelectedBatchId(id);
        fetchCodes(id);
    };

    const generateCodes = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count, name: batchName }),
            });
            await fetchBatches();
            setSelectedBatchId(res.batch_id);
            fetchCodes(res.batch_id);
            setBatchName('');
        } catch (e: any) {
            alert(e.message || 'Failed to generate codes');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCode = async (id: number) => {
        if (!confirm('Are you sure you want to delete this QR code? It will no longer be valid for payments.')) return;
        try {
            await apiFetch(`/admin/qr/${id}`, { method: 'DELETE' });
            setSelectedCode(null);
            fetchCodes(selectedBatchId);
        } catch (e: any) {
            alert(e.message || 'Failed to delete code');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredCodes = codes.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.merchant_name && c.merchant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.merchant_mobile && c.merchant_mobile.includes(searchQuery))
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24 print:p-0 print:bg-white shadow-inner">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    body {
                        background: white !important;
                    }
                    .print-container {
                        display: block !important;
                    }
                    .print-card {
                        width: 100% !important;
                        height: 28vh !important; /* Approx 3 per page */
                        margin-bottom: 2cm !important;
                        page-break-inside: avoid !important;
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 2rem !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 2rem !important;
                        position: relative !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header - Hide on print */}
            <div className="no-print">
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-blue-600 mb-6 font-bold text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Control Center</h1>
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                            <Zap size={14} /> Total Batches: {batches.length}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Active Batch</label>
                            <select
                                value={selectedBatchId}
                                onChange={e => handleBatchChange(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
                            >
                                {batches.map((b: any) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.count} QR)
                                    </option>
                                ))}
                                {batches.length === 0 && <option value="">No batches found</option>}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">New Batch Label</label>
                            <input
                                type="text"
                                value={batchName}
                                onChange={e => setBatchName(e.target.value)}
                                placeholder=" Pune Hub..."
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Quantity</label>
                            <select
                                value={count}
                                onChange={e => setCount(Number(e.target.value))}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
                            >
                                {[3, 6, 9, 12, 15, 30, 60].map(n => <option key={n} value={n}>{n} Sheets</option>)}
                            </select>
                        </div>
                        <button
                            onClick={generateCodes}
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Generate New Batch'}
                        </button>
                    </div>
                </div>

                {/* Local Search */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Locate Specific QR / Merchant Mapping..."
                            className="w-full pl-16 pr-8 py-4 bg-white border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                        <Printer size={18} /> Print Sheet
                    </button>
                </div>
            </div>

            {codes.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 print:block print:bg-white print:p-0">
                        {filteredCodes.map((code) => (
                            <div
                                key={code.id}
                                onClick={() => setSelectedCode(code)}
                                className={cn(
                                    "bg-white p-6 rounded-[2rem] border-2 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl relative print-card",
                                    code.status === 'assigned' ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-50'
                                )}
                            >
                                <div className="no-print absolute top-3 right-3">
                                    {code.status === 'assigned' ? (
                                        <div className="bg-indigo-600 p-1.5 rounded-full text-white shadow-lg"><UserCheck size={12} strokeWidth={3} /></div>
                                    ) : (
                                        <div className="bg-emerald-500 p-1.5 rounded-full text-white shadow-lg"><CheckCircle size={12} strokeWidth={3} /></div>
                                    )}
                                </div>

                                <div className="mb-4 mt-2 print:mt-0">
                                    <div className="p-3 bg-white rounded-3xl shadow-lg border border-slate-100">
                                        <QRCode value={code.code} size={160} level="H" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate max-w-[140px]">
                                        {code.status === 'assigned' ? (code.merchant_name || 'Assigned') : 'V.1 MAPPABLE'}
                                    </h4>
                                    <p className="text-[9px] font-mono text-slate-400 font-bold">{code.code.substring(0, 13)}</p>
                                </div>

                                {/* UPI App Logos Mockup for styling */}
                                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 grayscale opacity-40">
                                    <span className="text-[8px] font-black italic">OpenScore Pay</span>
                                    <div className="flex gap-1">
                                        <div className="w-4 h-2 bg-slate-300 rounded-sm" />
                                        <div className="w-4 h-2 bg-slate-400 rounded-sm" />
                                        <div className="w-4 h-2 bg-slate-200 rounded-sm" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredCodes.length === 0 && (
                        <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 no-print">
                            <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No matching QR found in this batch</p>
                        </div>
                    )}
                </div>
            )}

            {/* Code Details Modal */}
            {selectedCode && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 no-print" onClick={() => setSelectedCode(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-white rounded-[2rem] shadow-2xl border-4 border-slate-50 mb-8">
                                <QRCode value={selectedCode.code} size={180} />
                            </div>

                            <div className="w-full space-y-6 text-center">
                                <div>
                                    <span className={cn(
                                        "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block",
                                        selectedCode.status === 'assigned' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                    )}>
                                        {selectedCode.status}
                                    </span>
                                    <p className="mt-2 text-xs font-mono font-bold text-slate-400 break-all">{selectedCode.code}</p>
                                </div>

                                {selectedCode.status === 'assigned' ? (
                                    <div className="bg-slate-50 p-6 rounded-[2rem] text-left space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Merchant Profile</p>
                                            <h3 className="font-black text-slate-900 leading-tight">{selectedCode.merchant_name}</h3>
                                            <p className="text-sm font-bold text-indigo-600">{selectedCode.merchant_mobile}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activation Timeline</p>
                                            <p className="text-xs font-bold text-slate-600">{new Date(selectedCode.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                                        <Info className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-blue-900">Unlinked Asset</p>
                                        <p className="text-xs text-blue-600/70 mt-1">This code is ready for merchant deployment.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-5 gap-3">
                                    <button
                                        onClick={() => setSelectedCode(null)}
                                        className="col-span-4 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCode(selectedCode.id)}
                                        className="col-span-1 py-5 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center hover:bg-rose-100 transition-all font-black"
                                        title="Revoke QR permanent"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
