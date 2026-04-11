'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck, User, MapPin, Package, Truck, Home, Download, ChevronLeft, ChevronRight, Inbox, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import QrStatusStepper from './QrStatusStepper';

const escapeHtml = (value?: string | number) => {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br/>');
};

function QrTimelineToggle({ item }: { item: any }) {
    const [showTimeline, setShowTimeline] = useState(false);

    return (
        <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[7px] font-black uppercase tracking-widest text-slate-400">
                    {showTimeline ? 'Visible' : 'Hidden'}
                </div>
                <button 
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all"
                >
                    {showTimeline ? 'Hide' : 'Progess'}
                </button>
            </div>
            {showTimeline && (
                <div className="pt-1 animate-in slide-in-from-top-4 fade-in duration-300">
                    <QrStatusStepper status={item.status} trackingUrl={item.tracking_url} />
                </div>
            )}
        </div>
    );
}

interface AdminQrReviewProps {
    searchTerm?: string;
}

export default function AdminQrReview({ searchTerm = '' }: AdminQrReviewProps) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState<{ [key: number]: string }>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [isArchivedView, setIsArchivedView] = useState(false);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchBookings();
    }, [searchTerm, isArchivedView]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            let endpoint = `/admin/qr-bookings?limit=1000`;
            if (isArchivedView) {
                endpoint += `&status=archived`;
            }
            if (searchTerm) {
                endpoint += `&search=${encodeURIComponent(searchTerm)}`;
            }
            const res = await apiFetch(endpoint);
            if (res.data) setBookings(res.data);
            else if (res.bookings) setBookings(res.bookings);
            else if (Array.isArray(res)) setBookings(res);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch QR bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to permanently delete this booking?")) return;
        setProcessingId(id);
        try {
            await apiFetch(`/admin/qr-bookings/${id}`, { method: 'DELETE' });
            toast.success("Booking deleted permanently");
            fetchBookings();
        } catch (err: any) {
            toast.error(err.message || "Deletion failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleVerify = async (id: number, status: string, trackingUrl?: string) => {
        const reason = rejectionReason[id];
        if (status === 'rejected' && (!reason || !reason.trim())) {
            toast.error("Please provide a rejection reason");
            return;
        }

        setProcessingId(id);
        try {
            await apiFetch(`/admin/qr-bookings/${id}/verify`, {
                method: 'POST',
                body: JSON.stringify({
                    status,
                    rejection_reason: reason,
                    tracking_url: trackingUrl
                })
            });
            toast.success(`Booking status updated to ${status.replace('_', ' ')}`);
            fetchBookings();
        } catch (err: any) {
            toast.error(err.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://api.msmeloan.sbs${path}`;
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-slate-50 text-slate-500 border-slate-100';
            case 'agent_approved': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'payment_confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'dispatched': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'delivering': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'completed': return 'bg-emerald-600 text-white border-emerald-600';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    const printDeliverySlip = (item: any) => {
        if (typeof window === 'undefined') return;
        const receiver = item.full_name || item.user?.name || 'N/A';
        const primaryPhone = (item.mobile_number || item.user?.mobile_number || 'N/A').toString().replace(/^0+/, '');
        const alternatePhone = (item.alternate_mobile || '').toString().replace(/^0+/, '');
        const address = item.address || 'N/A';
        const city = item.city || '';
        const state = item.state || '';
        const pinCode = item.pin_code || '';
        const landmark = item.landmark || '';

        const html = `<!doctype html>
        <html>
        <head>
            <title>Shipping Label</title>
            <style>
                @page { size: 100mm 50mm; margin: 0; }
                body { margin: 0; padding: 0; background: #fff; font-family: 'Arial', sans-serif; }
                .label { width: 100mm; height: 50mm; padding: 5mm 6mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 2mm; border: 1px dashed #ccc; }
                .row { font-size: 10pt; font-weight: 600; color: #111; line-height: 1.4; display: flex; flex-wrap: wrap; gap: 4px; }
                .row b { font-weight: 950; color: #000; text-transform: uppercase; font-size: 8pt; opacity: 0.6; width: 60px; display: inline-block; }
                .val { flex: 1; }
                @media print { body { background: #fff; } .label { border: none; } }
            </style>
        </head>
        <body>
            <div class="label">
                <div class="row"><b>TO:</b> <span class="val">${escapeHtml(receiver)}</span></div>
                <div class="row"><b>Contact:</b> <span class="val">${escapeHtml(primaryPhone)}${alternatePhone ? ` &bull; ${escapeHtml(alternatePhone)}` : ''}</span></div>
                <div class="row"><b>Address:</b> <span class="val">${escapeHtml(address)}</span></div>
                <div class="row"><b>Location:</b> <span class="val">${escapeHtml(city)}${state ? `, ${escapeHtml(state)}` : ''} - ${escapeHtml(pinCode)}</span></div>
                ${landmark ? `<div class="row"><b>Landmark:</b> <span class="val">${escapeHtml(landmark)}</span></div>` : ''}
            </div>
            <script>
                window.onload = () => { setTimeout(() => window.print(), 200); };
            </script>
        </body>
        </html>`;

        const printWindow = window.open('', '_blank', 'width=500,height=300');
        if (!printWindow) return;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
    };

    const totalPages = Math.ceil(bookings.length / itemsPerPage);
    const paginatedBookings = bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <div className="text-center py-20 font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading QR Requests...</div>;

    if (bookings.length === 0) return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto">
                <button 
                    onClick={() => setIsArchivedView(false)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isArchivedView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Inbox size={14} /> Inbox
                </button>
                <button 
                    onClick={() => setIsArchivedView(true)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isArchivedView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Archive size={14} /> Archived
                </button>
            </div>
            
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-xl max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-slate-300 mb-4">
                    {isArchivedView ? <Archive size={32} /> : <ShieldCheck size={32} />}
                </div>
                <h3 className="font-black text-slate-900 text-xl">{isArchivedView ? "Archive is Empty" : "No Pending Validations"}</h3>
                <p className="text-sm text-slate-500 font-medium mt-2">{isArchivedView ? "Bookings you archive will appear here." : "All active requests have been processed."}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto lg:mx-0">
                <button 
                    onClick={() => setIsArchivedView(false)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isArchivedView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Inbox size={14} /> Inbox
                </button>
                <button 
                    onClick={() => setIsArchivedView(true)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isArchivedView ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Archive size={14} /> Archived
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        {isArchivedView ? <Archive size={20} /> : <Package size={20} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{isArchivedView ? 'Archive' : 'Validations'}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bookings.length} {isArchivedView ? 'Archived Records' : 'Active Requests'}</p>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedBookings.map((item) => {
                    const receiverName = item.full_name || item.user?.name || 'Not provided';
                    const contactPhone = item.mobile_number || item.user?.mobile_number || 'Not provided';
                    const altPhone = item.alternate_mobile || 'Not provided';
                    const cityStatePin = [item.city, item.state, item.pin_code].filter(Boolean).join(' • ') || 'Not provided';
                    const address = item.address || 'Not provided';
                    const landmarkValue = item.landmark || 'Not provided';
                    const detailRows = [
                        { label: 'Receiver', value: receiverName },
                        { label: 'Phone', value: contactPhone },
                        { label: 'Alternate', value: altPhone },
                        { label: 'City State PIN', value: cityStatePin },
                        { label: 'Landmark', value: landmarkValue },
                        { label: 'Address', value: address, fullWidth: true }
                    ];
                    return (
                        <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-md shadow-blue-900/5 border border-slate-100 flex flex-col relative">
                            <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                                        <User className="text-indigo-600" size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xs leading-none">
                                            {item.is_public ? `${item.full_name} (Individual)` : item.user?.name}
                                        </h3>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: #{item.id} • {new Date(item.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.is_public && (
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.protocol}//${window.location.hostname.replace('admin.', '')}${window.location.port === '3001' ? ':3000' : ''}/qr-update/${item.id}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success('Tracking Link Copied!');
                                            }}
                                            className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-full transition-all"
                                            title="Copy Public Tracking Link"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    )}
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusTheme(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 space-y-3 flex-1">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 text-[11px] font-bold text-slate-700 leading-[1.6] bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 uppercase tracking-tight">
                                        <p className="flex items-center gap-2">
                                            <span className="text-slate-400 text-[9px] font-black">TO:</span> 
                                            <span className="text-slate-900">{receiverName}</span>
                                            <span className="text-slate-300 mx-1">|</span>
                                            <span className="text-slate-400 text-[9px] font-black">Contact:</span> 
                                            <span className="text-emerald-600">{contactPhone}</span>
                                        </p>
                                        <p className="mt-1">
                                            <span className="text-slate-400 text-[9px] font-black">Address:</span> 
                                            <span className="text-slate-800 ml-1">{address}</span>
                                        </p>
                                        {(item.city || item.state) && (
                                            <p className="mt-0.5">
                                                <span className="text-slate-400 text-[9px] font-black">City:</span> 
                                                <span className="text-slate-800 ml-1">{item.city || 'N/A'}</span>
                                                <span className="text-slate-300 mx-1">|</span>
                                                <span className="text-slate-400 text-[9px] font-black">State:</span> 
                                                <span className="text-slate-800 ml-1">{item.state || 'N/A'}</span>
                                            </p>
                                        )}
                                        
                                        {/* Configuration Payload */}
                                        {item.payload && (
                                            <div className="mt-3 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-center justify-between">
                                                {(() => {
                                                    try {
                                                        const p = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
                                                        return (
                                                            <>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Configuration</span>
                                                                    <span className="text-[10px] font-black text-indigo-900 uppercase">{p.package_name || 'Standard'}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Content</span>
                                                                    <p className="text-[10px] font-black text-indigo-900 uppercase">{p.description || 'N/A'}</p>
                                                                </div>
                                                            </>
                                                        );
                                                    } catch (e) {
                                                        return <span className="text-[9px] text-slate-400 font-bold uppercase">Legacy Booking Data</span>;
                                                    }
                                                })()}
                                            </div>
                                        )}
                                        <p className="mt-1.5">
                                            <span className="text-slate-400 text-[9px] font-black">PIN Code:</span> 
                                            <span className="text-slate-800 ml-1">{item.pin_code}</span>
                                            {item.landmark && (
                                                <>
                                                    <span className="text-slate-300 mx-1">|</span>
                                                    <span className="text-slate-400 text-[9px] font-black">Landmark:</span> 
                                                    <span className="text-slate-800 ml-1">{item.landmark}</span>
                                                </>
                                            )}
                                            {item.alternate_mobile && (
                                                <>
                                                    <span className="text-slate-300 mx-1">|</span>
                                                    <span className="text-slate-400 text-[9px] font-black">Alt Phone:</span> 
                                                    <span className="text-emerald-700 ml-1">{item.alternate_mobile}</span>
                                                </>
                                            )}
                                        </p>
                                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-black text-[9px]">
                                                    PAYMENT: ₹{item.security_amount}
                                                </div>
                                                <span className="text-[8px] text-slate-400 font-bold tracking-widest">AGENT: {item.sub_user?.name || 'N/A'}</span>
                                            </div>
                                            <button
                                                onClick={() => printDeliverySlip(item)}
                                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-widest bg-white hover:bg-slate-50 transition-all"
                                            >
                                                <Download size={10} /> Slip
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-32 flex flex-col gap-2 shrink-0">
                                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm aspect-square group">
                                            <img
                                                src={getImageUrl(item.payment_screenshot)}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                alt="Payment Screenshot"
                                            />
                                            <a 
                                                href={getImageUrl(item.payment_screenshot)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                                            >
                                                <ExternalLink size={12} className="text-white" />
                                            </a>
                                        </div>
                                        <QrTimelineToggle item={item} />
                                    </div>
                                </div>
                            </div>

                            {item.status !== 'archived' && (
                                <div className="p-3 bg-slate-950/95 backdrop-blur-md border-t border-white/5 space-y-3 sticky bottom-0 z-10 mx-1 mb-1 rounded-2xl shadow-2xl">
                                    {(item.status === 'agent_approved' || item.status === 'pending') && (
                                        <input
                                            type="text"
                                            placeholder="Reason for rejection (mandatory)"
                                            className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-white placeholder:text-white/20 shadow-inner outline-none focus:ring-2 focus:ring-white/10 transition-all"
                                            value={rejectionReason[item.id] || ''}
                                            onChange={(e) => setRejectionReason({ ...rejectionReason, [item.id]: e.target.value })}
                                        />
                                    )}

                                    <div className="flex gap-2 w-full">
                                        {(item.status === 'agent_approved' || item.status === 'pending') ? (
                                            <>
                                                <button
                                                    onClick={() => handleVerify(item.id, 'rejected')}
                                                    disabled={processingId === item.id}
                                                    className="flex-1 py-3 bg-white/5 text-rose-400 border border-white/10 rounded-xl font-black text-[8px] uppercase tracking-[0.1em] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    <XCircle size={14} /> Reject
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(item.id, 'payment_confirmed')}
                                                    disabled={processingId === item.id}
                                                    className="flex-[1.8] py-3 bg-white text-slate-900 rounded-xl font-black text-[8px] uppercase tracking-[0.1em] hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-xl group disabled:opacity-50"
                                                >
                                                    <ShieldCheck size={14} /> Approve Payment
                                                </button>
                                            </>
                                        ) : item.status === 'payment_confirmed' ? (
                                            <button
                                                onClick={() => handleVerify(item.id, 'dispatched')}
                                                disabled={processingId === item.id}
                                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[8px] uppercase tracking-[0.1em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg group"
                                            >
                                                <Package size={14} /> Mark Dispatched
                                            </button>
                                        ) : item.status === 'dispatched' ? (
                                            <button
                                                onClick={() => {
                                                    const url = window.prompt("Enter Tracking Link (Optional):", item.tracking_url || "");
                                                    handleVerify(item.id, 'delivering', url || undefined);
                                                }}
                                                disabled={processingId === item.id}
                                                className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-[8px] uppercase tracking-[0.1em] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg group"
                                            >
                                                <Truck size={14} /> Set Out for Delivery
                                            </button>
                                        ) : item.status === 'delivering' ? (
                                            <button
                                                onClick={() => {
                                                    const url = window.prompt("Update Tracking Link (Optional):", item.tracking_url || "");
                                                    handleVerify(item.id, 'completed', url || undefined);
                                                }}
                                                disabled={processingId === item.id}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[8px] uppercase tracking-[0.1em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg group"
                                            >
                                                <Home size={14} /> Mark Delivered
                                            </button>
                                        ) : item.status === 'completed' ? (
                                            <button
                                                onClick={() => handleVerify(item.id, 'archived')}
                                                disabled={processingId === item.id}
                                                className="w-full py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                            >
                                                <Archive size={14} /> Archive Booking
                                            </button>
                                        ) : item.status === 'rejected' ? (
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={processingId === item.id}
                                                className="w-full py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                            >
                                                <Trash2 size={14} /> Delete Permanently
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            {(item.status === 'completed' || item.status === 'rejected') && item.rejection_reason && (
                                <div className="p-3 bg-slate-50 border-t border-slate-100">
                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">Remark: {item.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Page {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
