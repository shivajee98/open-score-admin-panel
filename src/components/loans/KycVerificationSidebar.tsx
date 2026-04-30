'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Shield, Fingerprint, CreditCard, ChevronRight, Loader2, CheckCircle2, XCircle, AlertCircle, X, MapPin, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Tab = 'PAN' | 'AADHAAR';

interface KycVerificationSidebarProps {
    loan?: any;
    onClose: () => void;
}

export default function KycVerificationSidebar({ loan, onClose }: KycVerificationSidebarProps) {
    const [activeTab, setActiveTab] = useState<Tab>('PAN');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // PAN State
    const [panData, setPanData] = useState({ pan: '', name: '', dob: '' });

    // Aadhaar State
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [otpPhase, setOtpPhase] = useState(false);
    const [otp, setOtp] = useState('');
    const [referenceId, setReferenceId] = useState('');

    const resetState = () => {
        setResult(null);
        setError(null);
        setLoading(false);
    };

    const handlePanVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        resetState();
        setLoading(true);

        try {
            const res = await apiFetch('/admin/sandbox/pan/verify', {
                method: 'POST',
                body: JSON.stringify(panData)
            });
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAadhaarOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        resetState();
        setLoading(true);

        try {
            const res = await apiFetch('/admin/sandbox/aadhaar/otp', {
                method: 'POST',
                body: JSON.stringify({ aadhaar_number: aadhaarNumber })
            });

            if (res.code === 200 && res.data?.reference_id) {
                setReferenceId(res.data.reference_id);
                setOtpPhase(true);
            } else {
                setError(res.message || 'Failed to generate OTP');
            }
        } catch (err: any) {
            setError(err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAadhaarVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        resetState();
        setLoading(true);

        try {
            const res = await apiFetch('/admin/sandbox/aadhaar/verify', {
                method: 'POST',
                body: JSON.stringify({ otp, reference_id: referenceId })
            });
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const user = loan?.user || {};
    const formData = loan?.form_data || {};
    const locationUrl = formData.location_url || user.location_url;

    return (
        <aside className="w-full lg:w-96 shrink-0 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 sticky top-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                            <Shield size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Identity Center</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sandbox Verification</p>
                        </div>
                    </div>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                            title="Close Verification Center"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Location Section */}
                {locationUrl && (
                    <div className="mb-8 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                                <MapPin size={16} className="text-blue-600" />
                            </div>
                            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Live Location</span>
                        </div>
                        <a 
                            href={locationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100 shadow-sm hover:border-blue-300 transition-all group"
                        >
                            <span className="text-sm font-bold text-slate-900">View on Google Maps</span>
                            <ExternalLink size={16} className="text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                    <button
                        onClick={() => { setActiveTab('PAN'); setOtpPhase(false); resetState(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'PAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <CreditCard size={14} /> PAN
                    </button>
                    <button
                        onClick={() => { setActiveTab('AADHAAR'); resetState(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'AADHAAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <Fingerprint size={14} /> ADHAR
                    </button>
                </div>

                {/* Forms */}
                <div className="space-y-6">
                    {activeTab === 'PAN' ? (
                        <form onSubmit={handlePanVerify} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">PAN Number</label>
                                <Input
                                    value={panData.pan}
                                    onChange={e => setPanData({ ...panData, pan: e.target.value.toUpperCase() })}
                                    placeholder="ABCDE1234F"
                                    className="rounded-2xl border-slate-200 h-12 font-mono font-bold uppercase"
                                    maxLength={10}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name (As per PAN)</label>
                                <Input
                                    value={panData.name}
                                    onChange={e => setPanData({ ...panData, name: e.target.value.toUpperCase() })}
                                    placeholder="Enter Name"
                                    className="rounded-2xl border-slate-200 h-12 font-bold uppercase"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date of Birth</label>
                                <Input
                                    type="text"
                                    value={panData.dob}
                                    onChange={e => setPanData({ ...panData, dob: e.target.value })}
                                    placeholder="DD/MM/YYYY"
                                    className="rounded-2xl border-slate-200 h-12 font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Verify PAN'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {!otpPhase ? (
                                <form onSubmit={handleAadhaarOtp} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Aadhaar Number</label>
                                        <Input
                                            value={aadhaarNumber}
                                            onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                                            placeholder="XXXX XXXX XXXX"
                                            className="rounded-2xl border-slate-200 h-12 font-bold"
                                            maxLength={12}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Generate OTP'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleAadhaarVerify} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 mb-4">
                                        <AlertCircle className="text-amber-500 shrink-0" size={16} />
                                        <div>
                                            <p className="text-[10px] font-black text-amber-900 uppercase">OTP Sent!</p>
                                            <p className="text-[9px] font-medium text-amber-700">Please enter the 6-digit code sent to your registered mobile.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Enter OTP</label>
                                        <Input
                                            value={otp}
                                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="123456"
                                            className="rounded-2xl border-slate-200 h-12 font-bold tracking-[0.5em] text-center"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOtpPhase(false)}
                                            className="px-4 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Verify OTP'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Result Messages */}
                    {error && (
                        <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100 flex items-start gap-3 animate-in shake">
                            <XCircle className="text-rose-500 shrink-0" size={18} />
                            <div>
                                <p className="text-[10px] font-black text-rose-900 uppercase">Verification Error</p>
                                <p className="text-[11px] font-medium text-rose-700 mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={`p-6 rounded-[2rem] border animate-in zoom-in duration-300 ${result.code === 200 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                {result.code === 200 ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-rose-500" size={20} />}
                                <h5 className={`text-xs font-black uppercase ${result.code === 200 ? 'text-emerald-900' : 'text-rose-900'}`}>
                                    {result.code === 200 ? 'Match Found' : 'Verification Failed'}
                                </h5>
                            </div>

                            <div className="space-y-3">
                                {result.data?.message && (
                                    <p className={`text-[11px] font-bold ${result.code === 200 ? 'text-emerald-700' : 'text-rose-700'}`}>{result.data.message}</p>
                                )}
                                
                                {result.code === 200 && (
                                    <div className="grid grid-cols-1 gap-2 border-t border-emerald-100 pt-4 mt-4">
                                        <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                                            <span className="text-[10px] font-black text-emerald-600">VERIFIED</span>
                                        </div>
                                        {result.data?.aadhaar_seeding_status && (
                                            <div className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Aadhaar Linked</span>
                                                <span className="text-[10px] font-black text-emerald-600">{result.data.aadhaar_seeding_status}</span>
                                            </div>
                                        )}
                                        {result.data?.full_name && (
                                            <div className="flex flex-col bg-white/50 p-2 rounded-xl">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Full Name</span>
                                                <span className="text-[11px] font-black text-slate-900">{result.data.full_name}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50">
                    <p className="text-[9px] font-medium text-slate-400 leading-relaxed text-center">
                        All verifications are processed via Sandbox production environment. Data matches are performed against official records.
                    </p>
                </div>
            </div>
        </aside>
    );
}
