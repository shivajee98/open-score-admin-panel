'use client';

import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { apiFetch } from '@/lib/api';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QrGenerator() {
    const [count, setCount] = useState(12);
    const [loading, setLoading] = useState(false);
    const [codes, setCodes] = useState<any[]>([]);
    const [batchName, setBatchName] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const generateCodes = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count, name: batchName }),
            });
            // After generating batch, fetch the codes
            const batchRes = await apiFetch(`/admin/qr/batches/${res.batch_id}`);
            setCodes(batchRes);
        } catch (e) {
            alert('Failed to generate codes');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24 print:p-0 print:bg-white">
            {/* Header - Hide on print */}
            <div className="print:hidden">
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-blue-600 mb-6 font-bold text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
                <h1 className="text-2xl font-black text-slate-900 mb-6">QR Code Generator</h1>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-blue-900/5 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Batch Name (Optional)</label>
                            <input
                                type="text"
                                value={batchName}
                                onChange={e => setBatchName(e.target.value)}
                                placeholder="e.g. Pune Merchants Phase 1"
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
                            <div key={code.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center break-inside-avoid print:border shadow-sm print:shadow-none">
                                <div className="mb-3">
                                    <QRCode value={code.code} size={120} />
                                </div>
                                <p className="text-[10px] font-mono text-slate-400 uppercase break-all">{code.code.substring(0, 8)}...</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">OpenScore Pay</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
