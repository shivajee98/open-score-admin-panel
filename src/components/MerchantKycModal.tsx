'use client';

import { X, ShieldCheck, Clock, MapPin, Smartphone, Mail, Calendar, Building2, Store, CreditCard, ExternalLink, Image as ImageIcon, CheckCircle, Ban, ArrowRight, User, Hash, History, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface MerchantKycModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchant: any;
    isAdmin: boolean;
    onSuccess: () => void;
}

export default function MerchantKycModal({ isOpen, onClose, merchant, isAdmin, onSuccess }: MerchantKycModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !merchant) return null;

    const handleApprove = async (status: 'FIELD_VERIFIED' | 'FULL_VERIFIED') => {
        if (!confirm(`Are you sure you want to mark this merchant as ${status.replace('_', ' ')}?`)) return;
        setIsSubmitting(true);
        try {
            await apiFetch(`/admin/users/${merchant.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kyc_status: status })
            });
            alert('Status updated successfully!');
            onSuccess();
            onClose();
        } catch (e: any) {
            alert('Error updating status: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this merchant\'s KYC? This will reset their status to Pending.')) return;
        setIsSubmitting(true);
        try {
            await apiFetch(`/admin/users/${merchant.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kyc_status: 'PENDING' })
            });
            alert('KYC Rejected and status reset to Pending.');
            onSuccess();
            onClose();
        } catch (e: any) {
            alert('Error rejecting: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const InfoBlock = ({ label, value, icon: Icon, className }: any) => (
        <div className={cn("bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3", className)}>
            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                <Icon size={16} />
            </div>
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{label}</span>
                <p className="text-sm font-bold text-slate-700 leading-tight">{value || 'Not Provided'}</p>
            </div>
        </div>
    );

    const ImagePreview = ({ label, src, fallbackLabel }: any) => (
        <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</span>
            {src ? (
                <a href={src} target="_blank" rel="noopener noreferrer" className="block relative group aspect-[4/3] rounded-[2rem] overflow-hidden border-2 border-slate-100 bg-slate-50 transition-all hover:border-blue-200">
                    <img src={src} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 flex items-center gap-2">
                            <ExternalLink size={14} className="text-white" />
                            <span className="text-xs font-bold text-white">View Full Image</span>
                        </div>
                    </div>
                </a>
            ) : (
                <div className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <ImageIcon size={32} />
                    <span className="text-xs font-bold">No {fallbackLabel} Uploaded</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white shadow-xl rotate-3 transition-transform hover:rotate-0 duration-300">
                            <img src={merchant.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(merchant.name)}&background=random`} alt={merchant.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{merchant.name}</h2>
                                {merchant.kyc_status === 'FULL_VERIFIED' ? (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200">
                                        <ShieldCheck size={12} /> Full Verified
                                    </span>
                                ) : merchant.kyc_status === 'FIELD_VERIFIED' ? (
                                    <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-200">
                                        <Clock size={12} /> Field Verified
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-200">
                                        <Ban size={12} /> Pending KYC
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Hash size={14} className="text-blue-500" /> ID: {merchant.id}
                                </p>
                                <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                                    <Calendar size={14} /> Joined {merchant.date_of_join ? new Date(merchant.date_of_join).toLocaleDateString() : (merchant.created_at ? new Date(merchant.created_at).toLocaleDateString() : 'N/A')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-3xl transition-all hover:rotate-90 relative z-10 border border-slate-100 overflow-hidden group">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* Left Column - Details */}
                        <div className="col-span-12 lg:col-span-7 space-y-10">
                            
                            {/* Personal & Contact */}
                            <section>
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <User size={14} /> Personal & Contact Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoBlock icon={Smartphone} label="Mobile Number" value={merchant.mobile_number} className="col-span-1" />
                                    <InfoBlock icon={Mail} label="Email Address" value={merchant.email} className="col-span-1" />
                                    <InfoBlock icon={Calendar} label="Date of Birth" value={merchant.date_of_birth ? new Date(merchant.date_of_birth).toLocaleDateString() : null} className="col-span-1" />
                                    <InfoBlock icon={ShieldCheck} label="Referral Code" value={merchant.my_referral_code} className="col-span-1 border-blue-100 bg-blue-50/30" />
                                </div>
                            </section>

                            {/* Business Info */}
                            <section>
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Building2 size={14} /> Business Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <InfoBlock icon={Store} label="Business Name" value={merchant.business_name} className="col-span-2 bg-indigo-50/20 border-indigo-100" />
                                    <InfoBlock icon={ArrowRight} label="Business Nature" value={merchant.business_nature} />
                                    <InfoBlock icon={ArrowRight} label="Business Segment" value={merchant.business_segment} />
                                    <InfoBlock icon={History} label="Daily Turnover" value={merchant.daily_turnover} />
                                    <InfoBlock icon={Clock} label="Shop Timing" value={merchant.shop_timing} />
                                    <InfoBlock icon={MapPin} label="Full Address" value={merchant.business_address} className="col-span-2" />
                                    <div className="col-span-2 grid grid-cols-3 gap-2">
                                        <InfoBlock icon={MapPin} label="City" value={merchant.city} />
                                        <InfoBlock icon={MapPin} label="State" value={merchant.state} />
                                        <InfoBlock icon={Hash} label="Pincode" value={merchant.pincode} />
                                    </div>
                                    {merchant.map_location_url && (
                                        <a href={merchant.map_location_url} target="_blank" rel="noopener noreferrer" className="col-span-2 p-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200">
                                            <MapPin size={18} /> View Store On Google Maps
                                        </a>
                                    )}
                                </div>
                            </section>

                            {/* Bank Details */}
                            <section>
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Landmark size={14} /> Bank Account Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4 bg-emerald-50/20 p-6 rounded-[2.5rem] border border-emerald-100">
                                    <InfoBlock icon={User} label="Account Holder" value={merchant.account_holder_name} className="col-span-2 bg-white" />
                                    <InfoBlock icon={Hash} label="Account Number" value={merchant.account_number} className="bg-white" />
                                    <InfoBlock icon={Landmark} label="IFSC Code" value={merchant.ifsc_code} className="bg-white" />
                                    <InfoBlock icon={Building2} label="Bank Name" value={merchant.bank_name} className="col-span-2 bg-white" />
                                </div>
                            </section>
                        </div>

                        {/* Right Column - Images */}
                        <div className="col-span-12 lg:col-span-5 space-y-8">
                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-right justify-end">
                                Document Verification <CreditCard size={14} />
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Aadhar Verification</span>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 mb-4 inline-flex items-center gap-2">
                                            <Hash size={14} className="text-slate-400" />
                                            <span className="text-sm font-mono font-bold">{merchant.aadhar_number || 'Number Not Provided'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ImagePreview label="Aadhar Front" src={merchant.aadhar_image} fallbackLabel="Front" />
                                        <ImagePreview label="Aadhar Back" src={merchant.aadhar_back_image} fallbackLabel="Back" />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">PAN Verification</span>
                                        <div className="bg-white p-3 rounded-2xl border border-slate-100 mb-4 inline-flex items-center gap-2">
                                            <CreditCard size={14} className="text-slate-400" />
                                            <span className="text-sm font-mono font-bold uppercase">{merchant.pan_number || 'Number Not Provided'}</span>
                                        </div>
                                    </div>
                                    <ImagePreview label="PAN Card Image" src={merchant.pan_image} fallbackLabel="PAN Image" />
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Additional Merchant Proofs</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ImagePreview label="Electricity Bill" src={merchant.electricity_bill} fallbackLabel="Bill" />
                                        <ImagePreview label="Rent/Shop Agreement" src={merchant.shop_rent_doc} fallbackLabel="Doc" />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 px-1">Shop/Store Images</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {merchant.shop_images && merchant.shop_images.length > 0 ? (
                                            merchant.shop_images.map((img: string, idx: number) => (
                                                <ImagePreview key={idx} label={`Store View ${idx + 1}`} src={img} fallbackLabel="Store Image" />
                                            ))
                                        ) : (
                                            <div className="col-span-2 py-8 text-center text-slate-300 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                                                No Shop Images Uploaded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full animate-pulse", merchant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')}></div>
                            <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{merchant.status} ACCOUNT</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-200">
                            Close Review
                        </button>
                        {isAdmin ? (
                            <>
                                {merchant.kyc_status === 'PENDING' && (
                                    <button 
                                        onClick={() => handleApprove('FIELD_VERIFIED')}
                                        disabled={isSubmitting}
                                        className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Clock size={20} /> Mark Field Verified
                                    </button>
                                )}
                                {merchant.kyc_status !== 'FULL_VERIFIED' && (
                                    <button 
                                        onClick={() => handleApprove('FULL_VERIFIED')}
                                        disabled={isSubmitting}
                                        className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <ShieldCheck size={20} /> Fully Approve
                                    </button>
                                )}
                                {merchant.kyc_status !== 'PENDING' && (
                                    <button 
                                        onClick={handleReject}
                                        disabled={isSubmitting}
                                        className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Ban size={20} /> Reject KYC
                                    </button>
                                )}
                            </>
                        ) : (
                            /* For Field Agent/Staff */
                            merchant.kyc_status === 'PENDING' && (
                                <button 
                                    onClick={() => handleApprove('FIELD_VERIFIED')}
                                    disabled={isSubmitting}
                                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle size={20} /> Complete Field Verification
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
