'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { apiFetch } from '@/lib/api';
import { Printer, ArrowLeft, Info, CheckCircle, UserCheck, Trash2, Search, Zap, ChevronLeft, ChevronRight, Filter, Settings, Copy, Plus, FolderPlus, CheckSquare, Square, DownloadCloud } from 'lucide-react';
import JSZip from 'jszip';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/AdminLayout';

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
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // New states for selection, filtering and pagination
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'active'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [selectedCodes, setSelectedCodes] = useState<number[]>([]);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [targetBatchId, setTargetBatchId] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState('');
    const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
    const [batchSearchText, setBatchSearchText] = useState('');

    // Zip Export States
    const [isExportingZip, setIsExportingZip] = useState(false);
    const [exportFormat, setExportFormat] = useState<'zip' | 'pdf' | 'sample'>('zip');
    const [exportProgress, setExportProgress] = useState(0);
    // Batch Export States
    const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [batchExportData, setBatchExportData] = useState<any>(null);
    const pollingInterval = useRef<any>(null);

    const zipSandboxRef = useRef<HTMLDivElement>(null);

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
        setCurrentPage(1); // Reset to page 1 on batch change
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

    const handleDeleteUnmappedInBatch = async () => {
        if (!selectedBatchId) return;
        const batch = batches.find(b => b.id.toString() === selectedBatchId.toString());
        if (!confirm(`Are you sure you want to delete ALL UNMAPPED QR codes in "${batch?.name || 'this batch'}"? Mapped QRs will be preserved.`)) return;

        setLoading(true);
        try {
            await apiFetch(`/admin/qr/batches/${selectedBatchId}/unmapped`, { method: 'DELETE' });
            await fetchBatches();
            if (selectedBatchId) fetchCodes(selectedBatchId);
        } catch (e: any) {
            alert(e.message || 'Failed to delete codes');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnmappedGlobal = async () => {
        if (!confirm('CRITICAL ACTION: Are you sure you want to delete ALL UNMAPPED QR codes across ALL batches? Mapped QRs will be preserved.')) return;

        setLoading(true);
        try {
            await apiFetch('/admin/qr/unmapped', { method: 'DELETE' });
            await fetchBatches();
            setCodes([]);
            setSelectedBatchId('');
        } catch (e: any) {
            alert(e.message || 'Failed to delete all unmapped codes');
        } finally {
            setLoading(false);
        }
    };

    const filteredCodes = codes.filter(c => {
        const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.merchant_name && c.merchant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.merchant_mobile && c.merchant_mobile.includes(searchQuery));

        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const handlePrint = () => {
        setIsPreparingPrint(true);
        // Trigger a Sample JPEG export (first 10) to fulfill "also exports in jpeg" 
        // without the long wait of a full batch ZIP export.
        handleSampleExport();

        // Give the browser time to render the print view
        setTimeout(() => {
            window.print();
            setIsPreparingPrint(false);
        }, 1500);
    };

    const [batchToExport, setBatchToExport] = useState<any[] | null>(null);
    const [zipInstance, setZipInstance] = useState<JSZip | null>(null);
    const [pdfInstance, setPdfInstance] = useState<jsPDF | null>(null);
    const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

    const handleZipExport = async () => {
        if (filteredCodes.length === 0) return;
        setExportFormat('zip');
        setIsExportingZip(true);
        setExportProgress(0);
        setCurrentBatchIndex(0);

        const zip = new JSZip();
        setZipInstance(zip);

        const firstBatch = filteredCodes.slice(0, 10);
        setBatchToExport(firstBatch);
    };

    const handlePdfExport = async () => {
        if (filteredCodes.length === 0) return;
        setExportFormat('pdf');
        setIsExportingZip(true);
        setExportProgress(0);
        setCurrentBatchIndex(0);

        // 13x19 inches (Landscape)
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [482.6, 330.2]
        });
        setPdfInstance(pdf);

        const firstBatch = filteredCodes.slice(0, 10);
        setBatchToExport(firstBatch);
    };

    const handleSampleExport = async () => {
        if (filteredCodes.length === 0) return;
        setExportFormat('sample');
        setIsExportingZip(true);
        setBatchToExport(filteredCodes.slice(0, 10));
    };

    // Effect to handle export batch by batch (ZIP or PDF)
    useEffect(() => {
        if (!batchToExport || !isExportingZip) return;

        const captureAndNext = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));

                const element = document.getElementById('zip-export-sandbox');
                if (element) {
                    // Use JPEG with quality for ZIP/PDF to save size, Keep PNG for sample if needed
                    const dataUrl = await toJpeg(element, { 
                        pixelRatio: 1.5, 
                        backgroundColor: 'white',
                        quality: 0.85 // High quality JPEG compression (SWEET SPOT)
                    });

                    if (exportFormat === 'sample') {
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = `QR_Sample_13x19_${new Date().getTime()}.jpg`;
                        link.click();
                        setIsExportingZip(false);
                        setBatchToExport(null);
                        return;
                    }

                    if (exportFormat === 'zip' && zipInstance) {
                        const base64Data = dataUrl.split(',')[1];
                        zipInstance.file(`QR_Batch_${currentBatchIndex + 1}_13x19.jpg`, base64Data, { base64: true });
                    } else if (exportFormat === 'pdf' && pdfInstance) {
                        if (currentBatchIndex > 0) pdfInstance.addPage([482.6, 330.2], 'landscape');
                        pdfInstance.addImage(dataUrl, 'JPEG', 0, 0, 482.6, 330.2, undefined, 'FAST');
                    }

                    const nextIndex = currentBatchIndex + 1;
                    const batchSize = 10;
                    const totalBatches = Math.ceil(filteredCodes.length / batchSize);

                    if (nextIndex < totalBatches) {
                        setExportProgress(Math.round((nextIndex / totalBatches) * 100));
                        setCurrentPage(nextIndex + 1); // Optional: Sync UI to show which batch is printing
                        setCurrentBatchIndex(nextIndex);
                        setBatchToExport(filteredCodes.slice(nextIndex * batchSize, nextIndex * batchSize + batchSize));
                    } else {
                        setExportProgress(100);
                        if (exportFormat === 'zip' && zipInstance) {
                            const content = await zipInstance.generateAsync({ type: 'blob' });
                            const url = URL.createObjectURL(content);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `QR_Export_13x19_JPG_${new Date().getTime()}.zip`;
                            link.click();
                        } else if (exportFormat === 'pdf' && pdfInstance) {
                            pdfInstance.save(`QR_Export_13x19_${new Date().getTime()}.pdf`);
                        }

                        setIsExportingZip(false);
                        setBatchToExport(null);
                        setZipInstance(null);
                        setPdfInstance(null);
                    }
                }
            } catch (err) {
                console.error('Export failed:', err);
                setIsExportingZip(false);
                setBatchToExport(null);
                setZipInstance(null);
                setPdfInstance(null);
                alert('Export failed.');
            }
        };

        captureAndNext();
    }, [batchToExport, zipInstance, pdfInstance, isExportingZip, currentBatchIndex, filteredCodes, exportFormat]);

    const handleSendToBatchExport = async () => {
        if (!selectedBatchId) return;
        setExportStatus('processing');
        try {
            const res = await apiFetch(`/admin/qr/batches/${selectedBatchId}/export`, {
                method: 'POST'
            });
            startPollingStatus();
        } catch (e: any) {
            alert(e.message || 'Failed to start batch export');
            setExportStatus('idle');
        }
    };

    const startPollingStatus = () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        
        pollingInterval.current = setInterval(async () => {
            try {
                const res = await apiFetch(`/admin/qr/batches/${selectedBatchId}/export-status`);
                setBatchExportData(res);
                if (res.status === 'completed' || res.status === 'failed') {
                    setExportStatus(res.status);
                    clearInterval(pollingInterval.current);
                } else if (res.status === 'processing') {
                    setExportStatus('processing');
                }
            } catch (e) {
                console.error('Polling failed', e);
            }
        }, 3000);
    };

    const handleBatchDownload = async (type: 'pdf' | 'csv') => {
        if (!batchExportData) return;
        const url = type === 'pdf' ? batchExportData.pdf_url : batchExportData.csv_url;
        if (!url) return;

        // Increment download count
        try {
            await apiFetch(`/admin/qr/batches/${selectedBatchId}/downloaded`, { method: 'POST' });
            // Refresh batch data to show updated count
            const statusRes = await apiFetch(`/admin/qr/batches/${selectedBatchId}/export-status`);
            setBatchExportData(statusRes);
        } catch (e) {
            console.error('Failed to update download count', e);
        }

        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    // Also check status when batch changes
    useEffect(() => {
        if (selectedBatchId) {
            const checkInitialStatus = async () => {
                try {
                    const res = await apiFetch(`/admin/qr/batches/${selectedBatchId}/export-status`);
                    setBatchExportData(res);
                    if (res.status === 'processing') {
                        setExportStatus('processing');
                        startPollingStatus();
                    } else {
                        setExportStatus(res.status || 'idle');
                    }
                } catch (e) {
                    setExportStatus('idle');
                }
            };
            checkInitialStatus();
        }
    }, [selectedBatchId]);



    // Removed the previous definition of filteredCodes downstream

    const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);
    const paginatedCodes = filteredCodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleCodeSelection = (id: number) => {
        setSelectedCodes(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCodes.length === paginatedCodes.length) {
            setSelectedCodes([]);
        } else {
            setSelectedCodes(paginatedCodes.map(c => c.id));
        }
    };

    const handleMoveToGroup = async () => {
        if (selectedCodes.length === 0) return;
        if (!targetBatchId && !newGroupName) {
            alert('Please select a group or enter a new group name');
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/admin/qr/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_ids: selectedCodes,
                    batch_id: targetBatchId || null,
                    new_batch_name: newGroupName || null
                }),
            });
            await fetchBatches();
            if (selectedBatchId) fetchCodes(selectedBatchId);
            setSelectedCodes([]);
            setIsGroupModalOpen(false);
            setNewGroupName('');
            setTargetBatchId('');
        } catch (e: any) {
            alert(e.message || 'Failed to move QR codes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="QR Control Center">
            <title>QR Control Center | OpenScore</title>
            <div className="min-h-screen bg-slate-50 p-6 pb-24 print:p-0 print:bg-white">
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
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide EVERYTHING by default */
                    body > * {
                        display: none !important;
                    }
                    /* Then show only our sandbox */
                    .print-sandbox-root {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    .print-page {
                        width: 297mm !important;
                        height: 210mm !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 3mm !important;
                        padding: 3mm !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        background: white !important;
                        justify-content: flex-start !important;
                    }
                    .print-page:last-child {
                        page-break-after: avoid !important;
                    }
                    .qr-card-branded {
                        width: 95mm !important;
                        height: 200mm !important;
                        background: #012b39 !important;
                        border-radius: 0 !important;
                        padding: 6mm !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
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
                    .qr-outline-wrapper {
                        background: linear-gradient(165deg, #0a3d4f 0%, #0d5a6e 40%, #0f6b7a 70%, #1a8090 100%) !important;
                        border: 3px solid rgba(100, 210, 200, 0.5) !important;
                        border-radius: 8mm !important;
                        padding: 5mm 4mm !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        height: 100% !important;
                        box-sizing: border-box !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-line-break {
                        display: flex !important;
                        align-items: center !important;
                        gap: 3mm !important;
                        width: 100% !important;
                        position: relative !important;
                        z-index: 1 !important;
                        margin-bottom: 4mm !important;
                    }
                    .qr-line-break .line {
                        flex: 1 !important;
                        height: 1px !important;
                        background: rgba(100, 210, 200, 0.4) !important;
                    }
                    .qr-line-break .text {
                        font-size: 26pt !important;
                        font-weight: 900 !important;
                        color: white !important;
                        letter-spacing: 0.05em !important;
                        white-space: nowrap !important;
                    }
                    .qr-line-break-bottom {
                        display: flex !important;
                        align-items: center !important;
                        gap: 3mm !important;
                        width: 100% !important;
                        position: relative !important;
                        z-index: 1 !important;
                        margin-top: 4mm !important;
                    }
                    .qr-line-break-bottom .line {
                        flex: 1 !important;
                        height: 1px !important;
                        background: rgba(100, 210, 200, 0.4) !important;
                    }
                    .qr-line-break-bottom .text {
                        font-size: 20pt !important;
                        font-weight: 900 !important;
                        color: white !important;
                        letter-spacing: 0.1em !important;
                        white-space: nowrap !important;
                    }
                    .qr-ring-container {
                        position: relative !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        z-index: 1 !important;
                    }
                    .qr-box {
                        background: white !important;
                        padding: 6mm !important;
                        border-radius: 2mm !important;
                        position: relative !important;
                        z-index: 2 !important;
                        border: 3px solid rgba(100, 210, 200, 0.6) !important;
                    }
                    .qr-bottom {
                        text-align: center !important;
                        margin-top: 3mm !important;
                        position: relative !important;
                        z-index: 1 !important;
                    }
                    .qr-bottom .cashback-text {
                        font-size: 10pt !important;
                        color: white !important;
                        margin-top: 2mm !important;
                        font-weight: 900 !important;
                    }
                    .qr-bottom .cashback-text span {
                        color: #fcd34d !important;
                        font-weight: 900 !important;
                    }
                    .qr-bottom .for-text {
                        font-size: 8pt !important;
                        color: rgba(255,255,255,0.7) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.1em !important;
                        margin-top: 2mm !important;
                        font-weight: 900 !important;
                    }
                    .qr-footer {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        margin-top: 3mm !important;
                        padding-top: 3mm !important;
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
                        width: 5mm !important;
                        height: 5mm !important;
                        background: #22c55e !important;
                        border-radius: 50% !important;
                    }
                    .qr-footer .powered span {
                        font-size: 7pt !important;
                        color: rgba(255,255,255,0.9) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        font-weight: 900 !important;
                    }
                    .qr-footer .date {
                        font-size: 6pt !important;
                        color: rgba(255,255,255,0.5) !important;
                    }
                }
            `}</style>

                {/* Header - Hide on print */}
                <div className="no-print">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight invisible h-0">QR Control Center</h1>
                        <div className="flex items-center gap-3">
                            {/* Filter Buttons */}
                            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mr-4">
                                <button
                                    onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === 'all' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('assigned'); setCurrentPage(1); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === 'assigned' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Mapped QR
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        filterStatus === 'active' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Unmapped
                                </button>
                            </div>

                            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                                <Zap size={14} /> Total Batches: {batches.length}
                            </div>
                            <Link
                                href="/qr-control"
                                className="bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                            >
                                <FolderPlus size={14} /> All QR
                            </Link>
                            <button
                                onClick={handleDeleteUnmappedGlobal}
                                className="bg-rose-50 text-rose-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={12} /> Wipe All Unmapped
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="md:col-span-1 relative">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Active Batch</label>

                                {/* Custom Dropdown Trigger */}
                                <button
                                    onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                                    className="w-full bg-slate-50 rounded-2xl p-4 flex items-center justify-between font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all text-left"
                                >
                                    <span className="truncate">
                                        {selectedBatchId
                                            ? `${batches.find(b => b.id.toString() === selectedBatchId.toString())?.name || 'Unknown'} (${batches.find(b => b.id.toString() === selectedBatchId.toString())?.count || 0})`
                                            : 'Select Batch...'}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                        <ChevronLeft className="w-2.5 h-2.5 rotate-90 text-slate-400" />
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isBatchDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                                        {/* Search Input inside Dropdown */}
                                        <div className="p-3 border-b border-slate-100 relative">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search batches..."
                                                className="w-full bg-slate-50 pl-10 pr-4 py-2 rounded-xl text-sm font-bold text-slate-900 outline-none"
                                                value={batchSearchText}
                                                onChange={(e) => setBatchSearchText(e.target.value)}
                                            />
                                        </div>

                                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                            {batches.filter(b => b.name.toLowerCase().includes(batchSearchText.toLowerCase())).length === 0 && (
                                                <p className="text-center text-xs font-bold text-slate-400 py-4">No matching batches</p>
                                            )}

                                            {batches.filter(b => b.name.toLowerCase().includes(batchSearchText.toLowerCase())).map((b: any) => (








                                                <button
                                                    key={b.id}
                                                    onClick={() => {
                                                        handleBatchChange(b.id);
                                                        setIsBatchDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group",
                                                        selectedBatchId === b.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <span>{b.name}</span>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-lg",
                                                        selectedBatchId === b.id ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                                    )}>
                                                        {b.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                        onClick={handleDeleteUnmappedInBatch}
                                        disabled={loading || !selectedBatchId}
                                        className="w-full py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={12} /> Delete Unmapped in Batch
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Local Search and Controls */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Locate Specific QR / Merchant Mapping..."
                                className="w-full pl-16 pr-8 py-4 bg-white border border-slate-100 rounded-3xl font-bold text-slate-900 placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex items-center bg-white border border-slate-100 rounded-3xl px-4 py-2 shadow-sm">
                                <Settings size={16} className="text-slate-400 mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                                >
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={60}>60</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <button
                                onClick={handlePrint}
                                disabled={loading || isPreparingPrint}
                                className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex-1 md:flex-initial justify-center"
                            >
                                {isPreparingPrint ? <Zap className="animate-pulse" size={18} /> : <Printer size={18} />}
                                {isPreparingPrint ? 'Preparing...' : 'Print'}
                            </button>

                            <button
                                onClick={handleZipExport}
                                disabled={loading || isExportingZip || filteredCodes.length === 0}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 flex-1 md:flex-initial justify-center relative overflow-hidden",
                                    isExportingZip && "bg-indigo-500"
                                )}
                            >
                                {isExportingZip && exportFormat === 'zip' ? (
                                    <>
                                        <div className="absolute inset-0 bg-indigo-700 opacity-50" style={{ width: `${exportProgress}%`, transition: 'width 0.3s ease' }} />
                                        <DownloadCloud className="animate-bounce relative z-10" size={18} />
                                        <span className="relative z-10">{exportProgress}% ZIP Export...</span>
                                    </>
                                ) : (
                                    <>
                                        <DownloadCloud size={18} />
                                        <span>Download Compressed ZIP</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handlePdfExport}
                                disabled={loading || isExportingZip || filteredCodes.length === 0}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 flex-1 md:flex-initial justify-center relative overflow-hidden",
                                    isExportingZip && exportFormat === 'pdf' && "bg-emerald-500"
                                )}
                            >
                                {isExportingZip && exportFormat === 'pdf' ? (
                                    <>
                                        <div className="absolute inset-0 bg-emerald-700 opacity-50" style={{ width: `${exportProgress}%`, transition: 'width 0.3s ease' }} />
                                        <DownloadCloud className="animate-bounce relative z-10" size={18} />
                                        <span className="relative z-10">{exportProgress}% PDF Export...</span>
                                    </>
                                ) : (
                                    <>
                                        <DownloadCloud size={18} />
                                        <span>Download Compressed PDF</span>
                                    </>
                                )}
                            </button>

                            {/* New Batch Processing Button */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSendToBatchExport}
                                    disabled={loading || exportStatus === 'processing' || !selectedBatchId}
                                    className={cn(
                                        "flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex-1 md:flex-initial justify-center border-2",
                                        exportStatus === 'processing' 
                                            ? "bg-amber-50 border-amber-200 text-amber-600 animate-pulse" 
                                            : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                    )}
                                >
                                    {exportStatus === 'processing' ? <Zap className="animate-spin" size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin invisible" />}
                                    <span>{exportStatus === 'processing' ? 'Processing on Server...' : 'Send to Batch Processing'}</span>
                                </button>
                                
                                {exportStatus === 'completed' && batchExportData && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleBatchDownload('pdf')}
                                            className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <DownloadCloud size={14} /> PDF ({batchExportData.download_count || 0})
                                        </button>
                                        <button
                                            onClick={() => handleBatchDownload('csv')}
                                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Copy size={14} /> CSV Backup
                                        </button>
                                    </div>
                                )}
                                
                                {exportStatus === 'failed' && (
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mt-1">
                                        Server export failed. Try again.
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleSampleExport}
                                disabled={loading || isExportingZip || filteredCodes.length === 0}
                                className="flex items-center gap-3 px-6 py-4 bg-sky-50 text-sky-600 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-sky-100 transition-all flex-1 md:flex-initial justify-center"
                            >
                                <Copy size={18} />
                                <span>Generate Sample Image</span>
                            </button>
                        </div>
                    </div>

                    {/* Selection Actions Header */}
                    {selectedCodes.length > 0 && (
                        <div className="mb-6 bg-blue-600 p-4 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-blue-600/20 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black">{selectedCodes.length} QR Codes Selected</span>
                                <button
                                    onClick={() => setSelectedCodes([])}
                                    className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-xl hover:bg-white/30 transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsGroupModalOpen(true)}
                                    className="bg-white text-blue-600 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2"
                                >
                                    <FolderPlus size={16} /> Move to Group
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="no-print">
                    {codes.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="flex justify-between items-center mb-6 px-1">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    {selectedCodes.length === paginatedCodes.length && paginatedCodes.length > 0 ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                                    Select All on Page
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Page {currentPage} of {totalPages || 1}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                {paginatedCodes.map((code) => (
                                    <div
                                        key={code.id}
                                        onClick={() => toggleCodeSelection(code.id)}
                                        className={cn(
                                            "bg-white p-6 rounded-[2rem] border-2 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl relative group",
                                            selectedCodes.includes(code.id) ? 'border-blue-500 shadow-xl shadow-blue-500/10' :
                                                (code.status === 'assigned' ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-50')
                                        )}
                                    >
                                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); toggleCodeSelection(code.id); }}>
                                            {selectedCodes.includes(code.id) ? (
                                                <div className="bg-blue-600 p-1.5 rounded-full text-white shadow-lg"><CheckSquare size={12} strokeWidth={3} /></div>
                                            ) : (
                                                <div className="bg-slate-200 p-1.5 rounded-full text-slate-500 border border-white"><Plus size={12} strokeWidth={3} /></div>
                                            )}
                                        </div>

                                        <div className="absolute top-3 right-3" onClick={e => { e.stopPropagation(); setSelectedCode(code); }}>
                                            {code.status === 'assigned' ? (
                                                <div className="bg-indigo-600 p-1.5 rounded-full text-white shadow-lg"><UserCheck size={12} strokeWidth={3} /></div>
                                            ) : (
                                                <div className="bg-emerald-500 p-1.5 rounded-full text-white shadow-lg"><CheckCircle size={12} strokeWidth={3} /></div>
                                            )}
                                        </div>

                                        <div className="mb-4 mt-2">
                                            <div className="p-3 bg-white rounded-3xl shadow-lg border border-slate-100">
                                                <QRCode value={`https://openscore.msmeloan.sbs/qr?id=${code.code}`} size={160} level="H" />
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

                                        {selectedCodes.includes(code.id) && (
                                            <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white scale-110 animate-in zoom-in">
                                                <CheckSquare size={12} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center gap-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            let pageNum = i + 1;
                                            if (totalPages > 5 && currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-2xl font-black text-xs transition-all shadow-sm",
                                                        currentPage === pageNum ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
                                                    )}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    Displaying {paginatedCodes.length} of {filteredCodes.length} results
                                </p>
                            </div>

                            {filteredCodes.length === 0 && (
                                <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                    <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No matching QR found with current filters</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Print View Sandbox */}
                {isPreparingPrint && filteredCodes.length > 0 && (
                    <QrPrintSandbox codes={filteredCodes} />
                )}

                {/* 13x19 Export Sandbox (Used for PNG generation) */}
                {isExportingZip && batchToExport && (
                    <QrExportSandbox13x19 codes={batchToExport} />
                )}

                {/* Code Details Modal */}
                {selectedCode && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 no-print" onClick={() => setSelectedCode(null)}>
                        <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col items-center">
                                <div className="p-4 bg-white rounded-[2rem] shadow-2xl border-4 border-slate-50 mb-8">
                                    <QRCode value={`https://openscore.msmeloan.sbs/qr?id=${selectedCode.code}`} size={180} />
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
                {/* Move to Group Modal */}
                {isGroupModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6 no-print" onClick={() => setIsGroupModalOpen(false)}>
                        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Move to Group</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Selected {selectedCodes.length} QR Codes</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Select Existing Group</label>
                                        <select
                                            value={targetBatchId}
                                            onChange={e => { setTargetBatchId(e.target.value); if (e.target.value) setNewGroupName(''); }}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="">Choose an existing batch...</option>
                                            {batches.map((b: any) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-slate-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="bg-white px-4 text-slate-300">Or</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Create New (e.g. Pincode)</label>
                                        <div className="relative">
                                            <FolderPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="text"
                                                value={newGroupName}
                                                onChange={e => { setNewGroupName(e.target.value); if (e.target.value) setTargetBatchId(''); }}
                                                placeholder="Enter New Group Name or Pincode..."
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            onClick={() => setIsGroupModalOpen(false)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={loading || (!targetBatchId && !newGroupName)}
                                            onClick={handleMoveToGroup}
                                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Moving...' : 'Confirm Move'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// Separate Sandbox for Printing — renders via portal directly into <body>
const QrPrintSandbox = ({ codes }: { codes: any[] }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return createPortal(
        <div className="print-sandbox-root" style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'white' }}>
            {Array.from({ length: Math.ceil(codes.length / 3) }).map((_, pageIndex) => (
                <div key={pageIndex} className="print-page" style={{ display: 'flex', alignItems: 'center', gap: '3mm', padding: '3mm' }}>
                    {codes.slice(pageIndex * 3, pageIndex * 3 + 3).map((code) => (
                        <div key={code.id} className="qr-card-branded">
                            <div className="qr-outline-wrapper">
                                <div className="qr-line-break">
                                    <div className="line"></div>
                                    <div className="text">OPEN SCORE</div>
                                    <div className="line"></div>
                                </div>
                                <div className="qr-ring-container">
                                    <div className="qr-box">
                                        <QRCode value={`https://openscore.msmeloan.sbs/qr?id=${code.code}`} size={220} level="H" />
                                    </div>
                                </div>
                                <div className="qr-line-break-bottom">
                                    <div className="line"></div>
                                    <div className="text">SCAN & PAY</div>
                                    <div className="line"></div>
                                </div>
                                <div className="qr-bottom">
                                    <div className="cashback-text">Get <span>Instant Cashback</span> on Every Transaction!</div>
                                    <div className="for-text">For Businesses & Customers</div>
                                </div>
                                <div className="qr-footer">
                                    <div className="powered">
                                        <div className="icon"></div>
                                        <span style={{ fontWeight: 900 }}>Powered by MSME Shakti</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>,
        document.body
    );
};


// 13x19 EXPORT SANDBOX (2x5 Grid for 10 QRs per sheet)
const QrExportSandbox13x19 = ({ codes }: { codes: any[] }) => {
    return createPortal(
        <div
            id="zip-export-sandbox"
            className="export-sandbox-root"
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '482.6mm', // 19 inches (Landscape)
                height: '330.2mm', // 13 inches
                background: 'white',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)', // 5 columns
                gridTemplateRows: 'repeat(2, 1fr)', // 2 rows
                padding: '0',
                gap: '0',
                zIndex: -200,
                opacity: 1, // Full opacity for crisp capture
                pointerEvents: 'none',
                boxSizing: 'border-box'
            }}
        >
            {codes.map((code) => (
                <div key={code.id} style={{
                    width: '100%',
                    height: '100%',
                    background: '#012b39',
                    padding: '6mm',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                }}>
                    {/* Outer rounded outline */}
                    <div style={{
                        background: 'linear-gradient(165deg, #0a3d4f 0%, #0d5a6e 40%, #0f6b7a 70%, #1a8090 100%)',
                        border: '3px solid rgba(100, 210, 200, 0.5)',
                        borderRadius: '8mm',
                        padding: '5mm 4mm',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        boxSizing: 'border-box',
                        position: 'relative'
                    }}>
                        {/* Top text with line breaks */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', width: '100%', zIndex: 1, marginBottom: '3mm' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(100, 210, 200, 0.4)' }}></div>
                            <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: '24pt', fontWeight: 900, color: 'white', letterSpacing: '0.05em', lineHeight: 1 }}>OPEN SCORE</div>
                            </div>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(100, 210, 200, 0.4)' }}></div>
                        </div>

                        {/* QR box with outline */}
                        <div style={{
                            background: 'white',
                            padding: '8mm',
                            borderRadius: '2mm',
                            position: 'relative',
                            zIndex: 2,
                            border: '3px solid rgba(100, 210, 200, 0.6)',
                            width: '58mm',
                            height: '58mm',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '2mm 0'
                        }}>
                            <QRCode value={`https://openscore.msmeloan.sbs/qr?id=${code.code}`} size={220} level="H" />
                        </div>

                        {/* Bottom text with line breaks */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3mm', width: '100%', zIndex: 1, marginTop: '3mm' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(100, 210, 200, 0.4)' }}></div>
                            <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: '20pt', fontWeight: 900, color: 'white', letterSpacing: '0.12em' }}>SCAN & PAY</div>
                            </div>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(100, 210, 200, 0.4)' }}></div>
                        </div>

                        <div style={{ textAlign: 'center', zIndex: 1, width: '100%', marginTop: '2mm' }}>
                            <div style={{ fontSize: '9pt', color: 'rgba(255,255,255,0.9)', fontWeight: 900 }}>Get <span style={{ color: '#fcd34d', fontWeight: 900 }}>Instant Cashback</span> on Every Transaction!</div>
                            <div style={{ fontSize: '7pt', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2mm', fontWeight: 900 }}>
                                {code.status === 'assigned' ? (code.merchant_name || 'FOR BUSINESSES') : 'FOR BUSINESSES & CUSTOMERS'}
                            </div>

                            <div style={{
                                width: '100%',
                                marginTop: '3mm',
                                paddingTop: '3mm',
                                borderTop: '1px solid rgba(255,255,255,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2mm'
                            }}>
                                <div style={{ width: '4mm', height: '4mm', background: '#22c55e', borderRadius: '50%' }}></div>
                                <span style={{ fontSize: '7pt', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 900 }}>Powered by MSME Shakti</span>
                            </div>

                            <div style={{ fontSize: '5pt', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: '2mm', wordBreak: 'break-all' }}>
                                {code.code}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
};
