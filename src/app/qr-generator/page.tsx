'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { apiFetch } from '@/lib/api';
import { Printer, ArrowLeft, Info, CheckCircle, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function QrGenerator() {
    const [count, setCount] = useState(12);
    const [loading, setLoading] = useState(false);
    const [codes, setCodes] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string>('');
    const [batchName, setBatchName] = useState('');
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
                // Determine latest batch to show
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
            // Refresh batches and select new one
            await fetchBatches();
            setSelectedBatchId(res.batch_id);
            const batchRes = await apiFetch(`/admin/qr/batches/${res.batch_id}`);
            setCodes(batchRes);
            setBatchName(''); // Reset input
        } catch (e: any) {
            alert(e.message || 'Failed to generate codes');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const [selectedCode, setSelectedCode] = useState<any>(null);

    const handleCodeClick = (code: any) => {
        setSelectedCode(code);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24 print:p-0 print:bg-white">
            {/* Header - Hide on print */}
            <div className="print:hidden">
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-blue-600 mb-6 font-bold text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-slate-900">QR Code Generator</h1>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Select Batch</label>
                            <select
                                value={selectedBatchId}
                                onChange={e => handleBatchChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                            >
                                {batches.map((b: any) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.count} codes) - {new Date(b.created_at).toLocaleDateString()}
                                    </option>
                                ))}
                                {batches.length === 0 && <option value="">No batches found</option>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">New Batch Name</label>
                            <input
                                type="text"
                                value={batchName}
                                onChange={e => setBatchName(e.target.value)}
                                placeholder="e.g. Pune Merchants"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 outline-none focus:border-blue-600 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Quantity</label>
                            <select
                                value={count}
                                onChange={e => setCount(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                            >
                                {[1, 5, 10, 12, 20, 24, 50, 100].map(n => <option key={n} value={n}>{n} Codes</option>)}
                            </select>
                        </div>
                        <button
                            onClick={generateCodes}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Batch'}
                        </button>
                    </div>
                </div>
            </div>

            {codes.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="flex justify-between items-center mb-6 print:hidden">
                        <h2 className="text-lg font-bold text-slate-900">Preview ({codes.length} Codes)</h2>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                            <Printer size={16} /> Print Codes
                        </button>
                    </div>

                    <div ref={printRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-4 print:w-full">
                        {codes.map((code) => (
                            <div
                                key={code.id}
                                onClick={() => handleCodeClick(code)}
                                className={`bg-white p-4 rounded-xl border flex flex-col items-center text-center break-inside-avoid print:border shadow-sm print:shadow-none relative transition-all ${code.status === 'assigned' ? 'border-purple-200 cursor-pointer hover:border-purple-400' : 'border-slate-200'
                                    }`}
                            >
                                {/* Status Badge */}
                                <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider print:hidden ${code.status === 'assigned'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {code.status === 'assigned' ? <UserCheck size={10} /> : <CheckCircle size={10} />}
                                    {code.status === 'assigned' ? 'Assigned' : 'Available'}
                                </div>

                                <div className="mb-3 mt-4">
                                    <QRCode value={code.code} size={120} />
                                </div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase break-all">{code.code.substring(0, 8)}...</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">OpenScore Pay</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Code Details Modal */}
            {selectedCode && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 print:hidden" onClick={() => setSelectedCode(null)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300 relative" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-2 shadow-xl">
                            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center">
                                <QRCode value={selectedCode.code} size={64} />
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <div className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-mono font-bold text-xs uppercase tracking-widest mb-4">
                                ID: {selectedCode.code}
                            </div>

                            {selectedCode.status === 'assigned' ? (
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned Merchant</p>
                                        <h3 className="text-xl font-black text-slate-900">{selectedCode.merchant_name || 'N/A'}</h3>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Number</p>
                                        <h3 className="text-xl font-black text-slate-900 font-mono tracking-tight">{selectedCode.merchant_mobile || 'N/A'}</h3>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mapped On</p>
                                        <p className="text-sm font-bold text-slate-600">{selectedCode.updated_at ? new Date(selectedCode.updated_at).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center text-sm font-bold">
                                        Active & Receiving Payments
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 text-blue-700 p-6 rounded-xl text-center">
                                        <p className="font-bold mb-1">Ready to Map</p>
                                        <p className="text-xs opacity-70">This QR code is generated and ready to be assigned to a merchant.</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedCode(null)}
                                className="mt-8 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
