'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck, User, MapPin, Package, Truck, Home } from 'lucide-react';
import { toast } from 'sonner';
import QrStatusStepper from './QrStatusStepper';

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
                {bookings.map((item) => (
                    <div key={item.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                    <User className="text-indigo-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 leading-none">{item.user?.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Requested On: {new Date(item.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusTheme(item.status)}`}>
                                {item.status.replace('_', ' ')}
                            </div>
                        </div>

                        <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">


                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Delivery Details</p>
                                    <div className="bg-white p-5 rounded-3xl border border-slate-100 flex gap-4 items-start shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                                        <MapPin className="text-indigo-500 shrink-0 mt-1" size={20} />
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-x-3 mb-2">
                                                <p className="text-[13px] font-black text-slate-900">To: {item.full_name || item.user?.name}</p>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">PH:</span>
                                                    <span className="text-[10px] font-bold text-slate-900">{item.mobile_number || item.user?.mobile_number}</span>
                                                </div>
                                                {item.alternate_mobile && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">ALT:</span>
                                                        <span className="text-[10px] font-bold text-indigo-600">{item.alternate_mobile}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-extrabold text-slate-900 leading-relaxed">{item.address}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wide">
                                                {item.landmark && <span className="text-indigo-600/70">{item.landmark} • </span>}
                                                {item.city} - <span className="text-slate-900">{item.pin_code}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Proof</p>
                                        <a href={getImageUrl(item.payment_screenshot)} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                    <div className="aspect-[4/3] bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200 group relative cursor-zoom-in shadow-inner">
                                        <img
                                            src={getImageUrl(item.payment_screenshot)}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt="Payment Screenshot"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="bg-white text-slate-900 text-[10px] font-black px-6 py-3 rounded-2xl shadow-2xl uppercase tracking-widest">Enlarge Proof</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#f2fbf8] rounded-2xl p-4 w-56 h-32 flex flex-col justify-between shadow-sm border border-[#e6f5ef]">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[#007f6e] text-sm font-medium">Deposit</span>
                                    {/* Top right diagonal arrow icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#007f6e]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                </div>

                                <div className="text-3xl font-black text-[#006d5b] mb-2 tracking-tight">
                                    ₹{item.security_amount}
                                </div>

                                <div className="text-xs text-[#00a38f] font-medium truncate">
                                    Agent: {item.sub_user?.name || 'N/A'}
                                </div>
                            </div>

                            <div className="space-y-6 mb-8 mt-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-2">Lifecycle Progress</p>
                                <QrTimelineToggle item={item} />
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
                ))}
            </div>
        </div>
    );
}
