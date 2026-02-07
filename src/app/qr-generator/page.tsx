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
    const [displayLimit, setDisplayLimit] = useState(60);
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

    const handleDeleteAll = async () => {
        if (!confirm('CRITICAL ACTION: Are you sure you want to delete ALL QR batches and codes? This cannot be undone and all existing physical QR codes will become invalid.')) return;

        setLoading(true);
        try {
            await apiFetch('/admin/qr/delete-all', { method: 'DELETE' });
            setBatches([]);
            setCodes([]);
            setSelectedBatchId('');
            alert('All QR data has been wiped successfully.');
        } catch (e: any) {
            alert(e.message || 'Failed to delete all batches');
        } finally {
            setLoading(false);
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
                        width: 297mm !important;
                        height: 210mm !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 3mm !important;
                        padding: 3mm !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        background: white !important;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                    }
                    .qr-card-branded {
                        width: 95mm !important;
                        height: 200mm !important;
                        background: linear-gradient(165deg, #0a3d4f 0%, #0d5a6e 40%, #0f6b7a 70%, #1a8090 100%) !important;
                        border-radius: 6mm !important;
                        padding: 8mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        position: relative !important;
                        overflow: hidden !important;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
                    }
                    .qr-card-branded::before {
                        content: '' !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        background: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h20v2H10zM40 30h30v2H40zM20 50h15v2H20zM60 60h25v2H60zM5 80h20v2H5z' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E") !important;
                        pointer-events: none !important;
                    }
                    .qr-brand-top {
                        text-align: center !important;
                        margin-bottom: 5mm !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-brand-top .msme {
                        font-size: 12pt !important;
                        font-weight: 700 !important;
                        color: #d4af37 !important;
                        letter-spacing: 0.15em !important;
                        text-transform: uppercase !important;
                    }
                    .qr-brand-top .openscore {
                        font-size: 26pt !important;
                        font-weight: 900 !important;
                        color: white !important;
                        letter-spacing: 0.05em !important;
                        margin-top: 2mm !important;
                    }
                    .qr-brand-top .tagline {
                        font-size: 11pt !important;
                        color: #5fd4d4 !important;
                        font-style: italic !important;
                        margin-top: 2mm !important;
                    }
                    .qr-ring-container {
                        position: relative !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        flex: 1 !important;
                        z-index: 1 !important;
                        width: 100% !important;
                    }
                    .qr-ring {
                        position: absolute !important;
                        width: 75mm !important;
                        height: 75mm !important;
                        border: 4px solid #00d4d4 !important;
                        border-radius: 50% !important;
                        box-shadow: 0 0 30px rgba(0,212,212,0.5), inset 0 0 30px rgba(0,212,212,0.15) !important;
                    }
                    .qr-box {
                        background: white !important;
                        padding: 6mm !important;
                        border-radius: 5mm !important;
                        position: relative !important;
                        z-index: 2 !important;
                    }
                    .qr-box .check-badge {
                        position: absolute !important;
                        top: -3mm !important;
                        right: -3mm !important;
                        width: 10mm !important;
                        height: 10mm !important;
                        background: #22c55e !important;
                        border-radius: 50% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border: 3px solid white !important;
                    }
                    .qr-box .check-badge svg {
                        width: 6mm !important;
                        height: 6mm !important;
                        color: white !important;
                    }
                    .qr-bottom {
                        text-align: center !important;
                        margin-top: 5mm !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-bottom .scan-pay {
                        font-size: 20pt !important;
                        font-weight: 900 !important;
                        color: white !important;
                        letter-spacing: 0.1em !important;
                    }
                    .qr-bottom .cashback-text {
                        font-size: 11pt !important;
                        color: white !important;
                        margin-top: 2mm !important;
                    }
                    .qr-bottom .cashback-text span {
                        color: #fcd34d !important;
                        font-weight: 700 !important;
                    }
                    .qr-bottom .for-text {
                        font-size: 9pt !important;
                        color: rgba(255,255,255,0.6) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.1em !important;
                        margin-top: 3mm !important;
                    }
                    .qr-footer {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        margin-top: 5mm !important;
                        padding-top: 4mm !important;
                        border-top: 1px solid rgba(255,255,255,0.15) !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-footer .powered {
                        display: flex !important;
                        align-items: center !important;
                        gap: 2mm !important;
                    }
                    .qr-footer .powered .icon {
                        width: 6mm !important;
                        height: 6mm !important;
                        background: #22c55e !important;
                        border-radius: 50% !important;
                    }
                    .qr-footer .powered span {
                        font-size: 8pt !important;
                        color: rgba(255,255,255,0.8) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                    }
                    .qr-footer .date {
                        font-size: 6pt !important;
                        color: rgba(255,255,255,0.5) !important;
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
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={count}
                                onChange={e => setCount(Number(e.target.value))}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={generateCodes}
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Generate New Batch'}
                            </button>
                            {batches.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={loading}
                                    className="w-full py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={12} /> Delete All Data
                                </button>
                            )}
                        </div>
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
                            {filteredCodes.slice(0, displayLimit).map((code) => (
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

                        {filteredCodes.length > displayLimit && (
                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => setDisplayLimit(displayLimit + 60)}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                                >
                                    Load More ({filteredCodes.length - displayLimit} Remaining)
                                </button>
                                <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    Displaying {displayLimit} of {filteredCodes.length} QR codes to preserve performance.
                                </p>
                            </div>
                        )}
                        {filteredCodes.length === 0 && (
                            <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No matching QR found in this batch</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Print View - Branded MSME Shakti Cards (3 per page, individually cuttable) */}
            {filteredCodes.length > 0 && (
                <div className="hidden print:block">
                    {Array.from({ length: Math.ceil(filteredCodes.length / 3) }).map((_, pageIndex) => (
                        <div key={pageIndex} className="print-page">
                            {filteredCodes.slice(pageIndex * 3, pageIndex * 3 + 3).map((code) => (
                                <div key={code.id} className="qr-card-branded">
                                    {/* Top Branding */}
                                    <div className="qr-brand-top">
                                        <div className="msme">MSME SHAKTI</div>
                                        <div className="openscore">OPEN SCORE</div>
                                        <div className="tagline">Unlock Cashback Rewards!</div>
                                    </div>

                                    {/* QR with Glow Ring */}
                                    <div className="qr-ring-container">
                                        <div className="qr-ring"></div>
                                        <div className="qr-box">
                                            <QRCode value={code.code} size={220} level="H" />
                                            <div className="check-badge">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Text */}
                                    <div className="qr-bottom">
                                        <div className="scan-pay">SCAN & PAY</div>
                                        <div className="cashback-text">Get <span>Instant Cashback</span> on Every Transaction!</div>
                                        <div className="for-text">For Businesses & Customers</div>
                                    </div>

                                    {/* Footer */}
                                    <div className="qr-footer">
                                        <div className="powered">
                                            <div className="icon"></div>
                                            <span>Powered by MSME Shakti</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
