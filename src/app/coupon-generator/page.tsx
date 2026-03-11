'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { apiFetch } from '@/lib/api';
import { Printer, Info, CheckCircle, Trash2, Search, Zap, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/AdminLayout';

export default function CouponGenerator() {
    const [count, setCount] = useState(12);
    const [amount, setAmount] = useState(50);
    const [loading, setLoading] = useState(false);
    const [codes, setCodes] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [batchName, setBatchName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
    const [batchSearchText, setBatchSearchText] = useState('');

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const res = await apiFetch('/admin/coupons/batches');
            setBatches(res);
            if (res.length > 0 && !selectedBatchId) {
                setSelectedBatchId(res[0].id);
                fetchCodes(res[0].id);
            }
        } catch (e) {
            console.error('Failed to fetch batches', e);
        }
    };

    const fetchCodes = async (batchId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/coupons/batches/${batchId}`);
            setCodes(res);
        } catch (e) {
            alert('Failed to fetch codes');
        } finally {
            setLoading(false);
        }
    };

    const handleBatchChange = (id: string) => {
        setSelectedBatchId(id);
        setCurrentPage(1);
        fetchCodes(id);
    };

    const generateCodes = async () => {
        if (amount <= 0) {
            alert("Amount must be greater than zero.");
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/admin/coupons/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count, amount, name: batchName }),
            });
            await fetchBatches();
            setSelectedBatchId(res.batch_id);
            fetchCodes(res.batch_id);
            setBatchName('');
        } catch (e) {
            alert('Failed to generate codes');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnclaimedInBatch = async () => {
        if (!selectedBatchId) return;
        const batch = batches.find(b => b.id.toString() === selectedBatchId.toString());
        if (!confirm(`Are you sure you want to delete ALL UNCLAIMED coupons in "${batch?.name || 'this batch'}"?`)) return;

        setLoading(true);
        try {
            await apiFetch(`/admin/coupons/batches/${selectedBatchId}/unmapped`, { method: 'DELETE' });
            await fetchBatches();
            if (selectedBatchId) fetchCodes(selectedBatchId);
        } catch (e) {
            alert('Failed to delete codes');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        setIsPreparingPrint(true);
        setTimeout(() => {
            window.print();
            setIsPreparingPrint(false);
        }, 1500);
    };

    const filteredCodes = codes.filter(c => {
        const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.claim?.user?.name && c.claim.user.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
    const paginatedCodes = filteredCodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const activeBatch = batches.find(b => b.id.toString() === selectedBatchId.toString());

    return (
        <AdminLayout title="Coupon Control Center">
            <title>Coupons | OpenScore</title>
            <div className="min-h-screen bg-slate-50 p-6 pb-24 print:p-0 print:bg-white">
                <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print, header, aside, .sidebar {
                        display: none !important;
                    }
                    .print-page {
                        width: 210mm !important;
                        height: 297mm !important;
                        display: flex !important;
                        flex-wrap: wrap !important;
                        align-content: flex-start !important;
                        gap: 2mm !important;
                        padding: 5mm !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        background: white !important;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                    }
                    .coupon-card {
                        width: 64mm !important;
                        height: 85mm !important;
                        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
                        border-radius: 4mm !important;
                        padding: 4mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        position: relative !important;
                        overflow: hidden !important;
                        border: 1px dotted #475569 !important;
                    }
                    .coupon-header {
                        text-align: center !important;
                        margin-bottom: 3mm !important;
                        z-index: 2 !important;
                    }
                    .coupon-msme {
                        font-size: 8pt !important;
                        color: #fbbf24 !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.1em !important;
                    }
                    .coupon-title {
                        font-size: 14pt !important;
                        color: white !important;
                        font-weight: 900 !important;
                        line-height: 1 !important;
                    }
                    .coupon-amount {
                        font-size: 16pt !important;
                        color: #10b981 !important;
                        font-weight: 900 !important;
                        margin-top: 2mm !important;
                        text-shadow: 0 0 10px rgba(16, 185, 129, 0.4) !important;
                    }
                    .coupon-qr-box {
                        background: white !important;
                        padding: 3mm !important;
                        border-radius: 2mm !important;
                        margin: 2mm 0 !important;
                        z-index: 2 !important;
                    }
                    .coupon-footer {
                        text-align: center !important;
                        color: rgba(255,255,255,0.7) !important;
                        font-size: 6pt !important;
                        margin-top: auto !important;
                    }
                }
            `}</style>

                <div className="no-print">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                                <Gift size={14} /> Coupon Batches: {batches.length}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-1 relative">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Active Batch</label>
                                <button
                                    onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between font-bold text-slate-800 outline-none text-left text-sm"
                                >
                                    <span className="truncate">
                                        {selectedBatchId
                                            ? `${activeBatch?.name || 'Unknown'} (${activeBatch?.count || 0})`
                                            : 'Select Batch...'}
                                    </span>
                                    <ChevronLeft className="w-3 h-3 rotate-90 text-slate-400" />
                                </button>
                                {isBatchDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search..."
                                                className="w-full bg-slate-50 pl-8 pr-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 outline-none"
                                                value={batchSearchText}
                                                onChange={(e) => setBatchSearchText(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {batches.filter(b => b.name.toLowerCase().includes(batchSearchText.toLowerCase())).map((b: any) => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => {
                                                        handleBatchChange(b.id);
                                                        setIsBatchDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                                                        selectedBatchId === b.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span>{b.name} - ₹{parseFloat(b.amount).toFixed(0)}</span>
                                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-md">{b.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Batch Label</label>
                                <input
                                    type="text"
                                    value={batchName}
                                    onChange={e => setBatchName(e.target.value)}
                                    placeholder="Diwali Promo..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Cashback Amount (₹)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={count}
                                    onChange={e => setCount(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-1 flex flex-col gap-2">
                                <button
                                    onClick={generateCodes}
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {loading ? 'Working...' : 'Create Batch'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                            <input
                                type="text"
                                placeholder="Search UUID or claimed user..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 transition-colors"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {batches.length > 0 && selectedBatchId && (
                                <button
                                    onClick={handleDeleteUnclaimedInBatch}
                                    disabled={loading}
                                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Clear Unclaimed
                                </button>
                            )}
                            <button
                                onClick={handlePrint}
                                disabled={loading || isPreparingPrint || filteredCodes.length === 0}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                                <Printer size={14} /> Print
                            </button>
                        </div>
                    </div>

                    {codes.length > 0 && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {paginatedCodes.map((code) => (
                                    <div
                                        key={code.id}
                                        className={cn(
                                            "bg-white p-4 rounded-2xl border flex flex-col items-center text-center relative pointer-events-none",
                                            code.status === 'claimed' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'
                                        )}
                                    >
                                        <div className="absolute top-2 right-2">
                                            {code.status === 'claimed' ? (
                                                <CheckCircle size={14} className="text-emerald-500" />
                                            ) : (
                                                <Zap size={14} className="text-amber-400" />
                                            )}
                                        </div>

                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-50 mb-3">
                                            <QRCode value={code.code} size={80} level="M" />
                                        </div>

                                        <p className="text-[8px] font-mono text-slate-500 font-bold mb-1 truncate w-full">{code.code}</p>
                                        
                                        <div className="mt-auto pt-2 border-t w-full border-slate-100">
                                            {code.status === 'claimed' ? (
                                                <p className="text-[9px] font-bold text-emerald-700 truncate">{code.claim?.user?.name || 'Claimed'}</p>
                                            ) : (
                                                <p className="text-[9px] font-bold text-slate-400">UNCLAIMED</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="p-2 rounded-md border border-slate-200 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-bold text-slate-600 px-4">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="p-2 rounded-md border border-slate-200 disabled:opacity-50"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Print View */}
                {isPreparingPrint && filteredCodes.length > 0 && (
                    <div className="fixed inset-0 z-[-1] bg-white print:static print:z-auto">
                        {Array.from({ length: Math.ceil(filteredCodes.length / 9) }).map((_, pageIndex) => (
                            <div key={pageIndex} className="print-page">
                                {filteredCodes.slice(pageIndex * 9, pageIndex * 9 + 9).map((code) => (
                                    <div key={code.id} className="coupon-card">
                                        <div className="coupon-header">
                                            <div className="coupon-msme">OPEN SCORE</div>
                                            <div className="coupon-title">CASHBACK</div>
                                            <div className="coupon-amount">₹{activeBatch ? parseFloat(activeBatch.amount).toFixed(0) : '0'}</div>
                                        </div>
                                        <div className="coupon-qr-box">
                                            <QRCode value={code.code} size={110} level="H" />
                                        </div>
                                        <div className="coupon-footer">
                                            Scan to claim on OpenScore
                                            <br />
                                            {code.code.substring(0, 13)}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
