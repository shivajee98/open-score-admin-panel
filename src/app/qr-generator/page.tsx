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
                        size: A4 landscape;
                        margin: 0;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-page {
                        width: 100vw !important;
                        height: 100vh !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 1.5cm !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%) !important;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                    }
                    .print-header {
                        text-align: center !important;
                        margin-bottom: 1cm !important;
                    }
                    .print-header h1 {
                        font-size: 32pt !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                        margin: 0 !important;
                        letter-spacing: -0.02em !important;
                    }
                    .print-header p {
                        font-size: 12pt !important;
                        color: #64748b !important;
                        margin: 0.3cm 0 0 0 !important;
                        font-weight: 600 !important;
                    }
                    .print-qr-row {
                        display: flex !important;
                        justify-content: center !important;
                        align-items: stretch !important;
                        gap: 1.5cm !important;
                        flex: 1 !important;
                    }
                    .print-qr-card {
                        width: 7cm !important;
                        background: white !important;
                        border: 2px solid #e2e8f0 !important;
                        border-radius: 1cm !important;
                        padding: 0.8cm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-shadow: 0 4px 24px rgba(0,0,0,0.08) !important;
                    }
                    .print-qr-card .qr-wrapper {
                        padding: 0.4cm !important;
                        background: white !important;
                        border: 2px solid #f1f5f9 !important;
                        border-radius: 0.5cm !important;
                        margin-bottom: 0.5cm !important;
                    }
                    .print-qr-card .merchant-name {
                        font-size: 11pt !important;
                        font-weight: 800 !important;
                        color: #0f172a !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        text-align: center !important;
                        margin-bottom: 0.2cm !important;
                    }
                    .print-qr-card .qr-id {
                        font-size: 8pt !important;
                        font-family: monospace !important;
                        color: #94a3b8 !important;
                        font-weight: 600 !important;
                    }
                    .print-qr-card .brand-footer {
                        margin-top: 0.4cm !important;
                        padding-top: 0.3cm !important;
                        border-top: 1px solid #f1f5f9 !important;
                        width: 100% !important;
                        text-align: center !important;
                    }
                    .print-qr-card .brand-footer span {
                        font-size: 8pt !important;
                        font-weight: 700 !important;
                        color: #3b82f6 !important;
                        letter-spacing: 0.1em !important;
                    }
                    .print-footer {
                        text-align: center !important;
                        margin-top: 0.8cm !important;
                    }
                    .print-footer p {
                        font-size: 9pt !important;
                        color: #94a3b8 !important;
                        font-weight: 600 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 0.3cm !important;
                    }
                    .print-footer .shield {
                        width: 12pt !important;
                        height: 12pt !important;
                        color: #22c55e !important;
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

            {/* Screen View - Grid */}
            <div className="no-print">
                {codes.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {filteredCodes.map((code) => (
                                <div
                                    key={code.id}
                                    onClick={() => setSelectedCode(code)}
                                    className={cn(
                                        "bg-white p-6 rounded-[2rem] border-2 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl relative",
                                        code.status === 'assigned' ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-50'
                                    )}
                                >
                                    <div className="absolute top-3 right-3">
                                        {code.status === 'assigned' ? (
                                            <div className="bg-indigo-600 p-1.5 rounded-full text-white shadow-lg"><UserCheck size={12} strokeWidth={3} /></div>
                                        ) : (
                                            <div className="bg-emerald-500 p-1.5 rounded-full text-white shadow-lg"><CheckCircle size={12} strokeWidth={3} /></div>
                                        )}
                                    </div>

                                    <div className="mb-4 mt-2">
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

                                    <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2 grayscale opacity-40">
                                        <span className="text-[8px] font-black italic">OpenScore Pay</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {filteredCodes.length === 0 && (
                            <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No matching QR found in this batch</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Print View - 3 QR per landscape page */}
            {filteredCodes.length > 0 && (
                <div className="hidden print:block">
                    {/* Group codes into chunks of 3 */}
                    {Array.from({ length: Math.ceil(filteredCodes.length / 3) }).map((_, pageIndex) => (
                        <div key={pageIndex} className="print-page">
                            <div className="print-header">
                                <h1>Pay Now</h1>
                                <p>Scan any QR code to complete payment</p>
                            </div>

                            <div className="print-qr-row">
                                {filteredCodes.slice(pageIndex * 3, pageIndex * 3 + 3).map((code) => (
                                    <div key={code.id} className="print-qr-card">
                                        <div className="qr-wrapper">
                                            <QRCode value={code.code} size={180} level="H" />
                                        </div>
                                        <div className="merchant-name">
                                            {code.status === 'assigned' ? (code.merchant_name || 'Merchant') : 'OpenScore Pay'}
                                        </div>
                                        <div className="qr-id">{code.code.substring(0, 16)}</div>
                                        <div className="brand-footer">
                                            <span>OPENSCORE PAY</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="print-footer">
                                <p>
                                    <svg className="shield" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    100% Secure Payment • Powered by OpenScore
                                </p>
                            </div>
                        </div>
                    ))}
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
