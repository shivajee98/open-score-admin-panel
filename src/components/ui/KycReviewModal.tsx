'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { X, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface KycReviewModalProps {
    agent: any;
    kyc: any;
    onClose: () => void;
    onSuccess: (updatedKyc: any) => void;
}

export default function KycReviewModal({ agent, kyc, onClose, onSuccess }: KycReviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState(kyc?.admin_notes || '');
    
    // Only URL prefixes the API domains if absolute path is not given
    const getUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://api.msmeloan.sbs${path}`;
    };

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (status === 'rejected' && (!notes || notes.trim().length === 0)) {
            alert("Please provide a reason/note for rejection.");
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch(`/admin/sub-users/${agent.id}/kyc-review`, {
                method: 'POST',
                body: JSON.stringify({ status, admin_notes: notes }),
            });
            if (res.kyc) {
                onSuccess(res.kyc);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update KYC status.");
        } finally {
            setLoading(false);
        }
    };

    if (!kyc) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center">
                    <p className="text-slate-500 font-medium mb-4">No KYC documents uploaded by this agent yet.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-800 font-bold rounded-xl hover:bg-slate-200">Close</button>
                </div>
            </div>
        );
    }

    const DocumentViewer = ({ label, path }: { label: string, path: string }) => (
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
            <div className="p-3 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                {label}
                {!path && <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Missing</span>}
            </div>
            <div className="p-2 aspect-video flex items-center justify-center bg-slate-100 relative group">
                {path ? (
                    <a href={getUrl(path)} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center overflow-hidden">
                        <img src={getUrl(path)} alt={label} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                    </a>
                ) : (
                    <p className="text-slate-400 text-sm font-medium italic">Pending Upload</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            Review Agent KYC Documents
                            <span className={`text-[10px] px-2 py-1 rounded-md uppercase tracking-widest ${
                                kyc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                kyc.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {kyc.status}
                            </span>
                        </h2>
                        <p className="text-sm font-medium text-slate-500">Applicant: {agent.name} ({agent.mobile_number})</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    <div className="bg-white p-5 border border-slate-200 rounded-2xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">KYC Full Name</p>
                            <p className="text-sm font-black text-slate-900 mt-1">{kyc.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Business Section</p>
                            <p className="text-sm font-black text-slate-900 mt-1 capitalize">{kyc.section || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Company Name</p>
                            <p className="text-sm font-black text-slate-900 mt-1">{kyc.company_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Business Num</p>
                            <p className="text-sm font-black text-slate-900 mt-1">{kyc.business_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Aadhar Number</p>
                            <p className="text-sm font-black text-slate-900 mt-1">{kyc.aadhar_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">PAN Card</p>
                            <p className="text-sm font-black text-slate-900 mt-1 uppercase">{kyc.pan_number || 'N/A'}</p>
                        </div>
                        {(kyc.latitude && kyc.longitude) && (
                            <div className="col-span-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Onboarding Location</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">
                                        {kyc.latitude}, {kyc.longitude}
                                    </p>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${kyc.latitude},${kyc.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <ExternalLink size={12} /> Google Maps
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <DocumentViewer label="Live Selfie" path={kyc.live_selfie} />
                        <DocumentViewer label="PAN Card" path={kyc.pan_card} />
                        <DocumentViewer label="Aadhar Front" path={kyc.aadhar_front} />
                        <DocumentViewer label="Aadhar Back" path={kyc.aadhar_back} />
                        <DocumentViewer label="Qualification Doc" path={kyc.qualification_doc} />
                    </div>


                    <div className="bg-white p-5 border border-slate-200 rounded-2xl">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Review Notes / Rejection Reason</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any internal notes. Essential if rejecting."
                            rows={3}
                            disabled={loading || kyc.status === 'approved'}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium resize-none disabled:opacity-75"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-4">
                    <button onClick={onClose} disabled={loading} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    {kyc.status !== 'approved' && (
                        <>
                            <button 
                                onClick={() => handleReview('rejected')} 
                                disabled={loading} 
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                                <XCircle size={18} /> Reject
                            </button>
                            <button 
                                onClick={() => handleReview('approved')} 
                                disabled={loading} 
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 rounded-xl transition-colors">
                                <CheckCircle size={18} /> Approve KYC
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
