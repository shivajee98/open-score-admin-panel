'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck, User, MapPin, Package, Truck, Home, Download } from 'lucide-react';
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
        <div className="bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {showTimeline ? 'Status Timeline Visible' : 'Status Timeline Hidden'}
                    </div>
                </div>
                <button 
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all"
                >
                    {showTimeline ? 'Hide Details' : 'View Details'}
                </button>
            </div>
            {showTimeline && (
                <div className="pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                    <QrStatusStepper status={item.status} trackingUrl={item.tracking_url} />
                </div>
            )}
        </div>
    );
}

export default function AdminQrReview() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/qr-bookings');
            if (res.data) setBookings(res.data);
            else if (res.bookings) setBookings(res.bookings);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch QR bookings");
        } finally {
            setLoading(false);
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
        const receiver = item.full_name || item.user?.name || 'Receiver details pending';
        const primaryPhone = item.mobile_number || item.user?.mobile_number || 'N/A';
        const altPhone = item.alternate_mobile || '—';
        const address = item.address || 'Address not provided';
        const landmark = item.landmark || 'Landmark not set';
        const cityPin = [item.city, item.pin_code].filter(Boolean).join(' • ') || 'City / PIN not set';
        const bookingDate = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date pending';
        const slipFields = [
            { label: 'Receiver', value: receiver },
            { label: 'Phone', value: primaryPhone },
            { label: 'Alternate', value: altPhone },
            { label: 'City / PIN', value: cityPin },
            { label: 'Landmark', value: landmark },
            { label: 'Address', value: address }
        ];

        const slipCard = `<div class="slip-card">
            <div class="slip-header">Delivery Details / Booking #${escapeHtml(item.id)}</div>
            <div class="slip-grid">
                ${slipFields.map((field) => `
                    <div class="slip-row">
                        <span class="label">${escapeHtml(field.label)}</span>
                        <span class="value">${escapeHtml(field.value)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="slip-footer">
                <div>
                    <p class="label">Deposit</p>
                    <p class="value">₹${escapeHtml(item.security_amount || '0')}</p>
                </div>
                <div>
                    <p class="label">Requested On</p>
                    <p class="value">${escapeHtml(bookingDate)}</p>
                </div>
            </div>
        </div>`;

        const page = `<div class="page">
            ${Array.from({ length: 4 }).map(() => slipCard).join('')}
        </div>`;

        const html = `<!doctype html>
        <html>
        <head>
            <title>Delivery Details Slip</title>
            <style>
                @page { size: A4 portrait; margin: 12mm; }
                body { margin: 0; background: #f4f7f5; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
                .page { width: 210mm; min-height: 297mm; padding: 12mm; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 12mm; box-sizing: border-box; }
                .slip-card { border: 1px dashed #007f66; border-radius: 12px; padding: 10mm; display: flex; flex-direction: column; justify-content: space-between; background: #fff; box-shadow: 0 5px 18px rgba(0,0,0,0.08); }
                .slip-header { font-size: 11px; letter-spacing: 0.4em; text-transform: uppercase; font-weight: 700; color: #005248; margin-bottom: 0.5rem; }
                .slip-grid { display: flex; flex-direction: column; gap: 0.35rem; }
                .slip-row { display: flex; justify-content: space-between; gap: 0.75rem; font-size: 12px; }
                .slip-row .label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b9d9a; flex: 0 0 40%; }
                .slip-row .value { flex: 1; font-weight: 700; color: #0f1f24; text-align: right; }
                .slip-footer { margin-top: 1rem; display: flex; justify-content: space-between; gap: 1.5rem; }
                .slip-footer .label { font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #0f7765; }
                .slip-footer .value { font-size: 16px; font-weight: 800; color: #014539; }
                @media print { body { background: #fff; } }
            </style>
        </head>
        <body>
            ${page}
            <script>
                window.onload = () => { setTimeout(() => window.print(), 120); };
            </script>
        </body>
        </html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
    };

    if (loading) return <div className="text-center py-20 font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading QR Requests...</div>;

    if (bookings.length === 0) return (
        <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-xl">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-slate-300 mb-4">
                <ShieldCheck size={32} />
            </div>
            <h3 className="font-black text-slate-900 text-xl">No Pending QR Validations</h3>
            <p className="text-sm text-slate-500 font-medium mt-2">All requests have been processed.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bookings.map((item) => {
                    const receiverName = item.full_name || item.user?.name || 'Not provided';
                    const contactPhone = item.mobile_number || item.user?.mobile_number || 'Not provided';
                    const altPhone = item.alternate_mobile || 'Not provided';
                    const cityPin = [item.city, item.pin_code].filter(Boolean).join(' • ') || 'Not provided';
                    const address = item.address || 'Not provided';
                    const landmarkValue = item.landmark || 'Not provided';
                    const detailRows = [
                        { label: 'Receiver', value: receiverName },
                        { label: 'Phone', value: contactPhone },
                        { label: 'Alternate', value: altPhone },
                        { label: 'City / PIN', value: cityPin },
                        { label: 'Landmark', value: landmarkValue },
                        { label: 'Address', value: address, fullWidth: true }
                    ];
                    const formattedRequestedOn = item.created_at
                        ? new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Date pending';
                    return (
                        <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col">
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                        <User className="text-indigo-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 leading-none">
                                            {item.is_public ? `${item.full_name} (Individual)` : item.user?.name}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Requested On: {new Date(item.created_at).toLocaleDateString()}</p>
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
                                    <div className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusTheme(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Delivery Details</p>
                                        <button
                                            onClick={() => printDeliverySlip(item)}
                                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] bg-white shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                                        >
                                            <Download size={14} />
                                            Download Slip
                                        </button>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2.25rem] border border-slate-100 shadow-sm flex gap-4 items-start bg-gradient-to-tr from-white to-slate-50/70">
                                        <MapPin className="text-emerald-600 shrink-0 mt-1" size={24} />
                                        <div className="flex-1">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {detailRows.map((row) => (
                                                    <div
                                                        key={row.label}
                                                        className={`space-y-1 ${row.fullWidth ? 'sm:col-span-2' : ''}`}
                                                    >
                                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 block">{row.label}</span>
                                                        <p className="text-sm font-black text-slate-900 leading-tight break-words">{row.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Proof</p>
                                            <a
                                                href={getImageUrl(item.payment_screenshot)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600"
                                            >
                                                <ExternalLink size={14} />
                                                View Proof
                                            </a>
                                        </div>
                                        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-100 shadow-inner aspect-[5/3] group">
                                            <img
                                                src={getImageUrl(item.payment_screenshot)}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt="Payment Screenshot"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                <span className="bg-white text-slate-900 text-[10px] font-black px-8 py-3 rounded-2xl shadow-2xl uppercase tracking-[0.4em]">Enlarge Proof</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-[#f2fbf8] rounded-[2.25rem] p-6 border border-[#e6f5ef] shadow-sm flex flex-col gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007f6e]">Deposit</p>
                                                <p className="text-3xl font-black text-[#005a4c]">₹{item.security_amount}</p>
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] flex flex-col gap-1">
                                                <span>Booking ID: {item.id}</span>
                                                <span>Agent: {item.sub_user?.name || 'N/A'}</span>
                                                <span className="text-[#0f7765] font-black">Requested On: {formattedRequestedOn}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle Progress</p>
                                            <QrTimelineToggle item={item} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {item.status !== 'completed' && item.status !== 'rejected' && (
                                <div className="p-8 bg-slate-950 border-t border-white/5 space-y-6">
                                    {(item.status === 'agent_approved' || item.status === 'pending') && (
                                        <input
                                            type="text"
                                            placeholder="Reason for rejection (mandatory for negative action)"
                                            className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-white/20 shadow-inner outline-none focus:ring-4 focus:ring-white/5 focus:border-white/20 transition-all"
                                            value={rejectionReason[item.id] || ''}
                                            onChange={(e) => setRejectionReason({ ...rejectionReason, [item.id]: e.target.value })}
                                        />
                                    )}

                                    <div className="flex flex-wrap gap-4 w-full">
                                        {(item.status === 'agent_approved' || item.status === 'pending') ? (
                                            <>
                                                <button
                                                    onClick={() => handleVerify(item.id, 'rejected')}
                                                    disabled={processingId === item.id}
                                                    className="flex-1 py-5 bg-white/5 text-rose-400 border border-white/10 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                                >
                                                    <XCircle size={18} className="group-hover:rotate-12 transition-transform" /> Reject Request
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(item.id, 'payment_confirmed')}
                                                    disabled={processingId === item.id}
                                                    className="flex-[1.5] py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/5 group disabled:opacity-50"
                                                >
                                                    <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" /> Approve Payment
                                                </button>
                                            </>
                                        ) : item.status === 'payment_confirmed' ? (
                                            <button
                                                onClick={() => handleVerify(item.id, 'dispatched')}
                                                disabled={processingId === item.id}
                                                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 group"
                                            >
                                                <Package size={20} className="group-hover:-translate-y-1 transition-transform" /> Mark as Dispatched
                                            </button>
                                        ) : item.status === 'dispatched' ? (
                                            <button
                                                onClick={() => {
                                                    const url = window.prompt("Enter Tracking Link (Optional):", item.tracking_url || "");
                                                    handleVerify(item.id, 'delivering', url || undefined);
                                                }}
                                                disabled={processingId === item.id}
                                                className="w-full py-5 bg-amber-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 group"
                                            >
                                                <Truck size={20} className="group-hover:translate-x-1 transition-transform" /> Mark Out for Delivery
                                            </button>
                                        ) : item.status === 'delivering' ? (
                                            <button
                                                onClick={() => {
                                                    const url = window.prompt("Update Tracking Link (Optional):", item.tracking_url || "");
                                                    handleVerify(item.id, 'completed', url || undefined);
                                                }}
                                                disabled={processingId === item.id}
                                                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 group"
                                            >
                                                <Home size={20} className="group-hover:scale-110 transition-transform" /> Confirm Delivered
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            {(item.status === 'completed' || item.status === 'rejected') && item.rejection_reason && (
                                <div className="p-6 bg-slate-50 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">Admin Remark: {item.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
