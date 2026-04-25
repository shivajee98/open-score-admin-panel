import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { BadgeCheck, X, Calendar, CreditCard, User, AlertCircle, Clock, CheckCircle2, Eye, ShieldCheck, XCircle, Image as ImageIcon, ExternalLink, Shield, Calculator, FileText, MapPin, Briefcase, Landmark, Camera, ChevronRight, Plus, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.msmeloan.sbs/api';

interface LoanDetailModalProps {
    loanId: number;
    onClose: () => void;
    onUpdate: () => void;
}

export default function LoanDetailModal({ loanId, onClose, onUpdate }: LoanDetailModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Manual Collection State
    const [collectingId, setCollectingId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    // Payment Proof Modal State
    const [viewingProof, setViewingProof] = useState<any>(null);

    // Reject Modal State
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Image Upload State
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedUploadField, setSelectedUploadField] = useState<string | null>(null);
    const [reuploadFields, setReuploadFields] = useState<string[]>([]);
    const [reuploadRemarks, setReuploadRemarks] = useState('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUploadField) return;

        setUploadingField(selectedUploadField);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', selectedUploadField);

        try {
            await apiFetch(`/admin/loans/${loanId}/add-image`, {
                method: 'POST',
                body: formData
            });
            loadDetails(); // Refresh the data
            onUpdate();
        } catch (error: any) {
            alert(error.message || 'Failed to upload image');
        } finally {
            setUploadingField(null);
            setSelectedUploadField(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        loadDetails();
    }, [loanId]);

    const getStorageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://api.msmeloan.sbs/storage/${path}`;
    };

    const loadDetails = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/loans/${loanId}/details`);
            if (res && res.loan) {
                setData(res);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to load details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleManualCollect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collectingId) return;

        setActionLoading(`collect-${collectingId}`);
        try {
            await apiFetch(`/admin/loans/repayments/${collectingId}/manual-collect`, {
                method: 'POST',
                body: JSON.stringify({ amount, notes })
            });
            alert('Collection recorded! Waiting for approval.');
            setCollectingId(null);
            setAmount('');
            setNotes('');
            loadDetails();
            onUpdate();
        } catch (e) {
            alert('Failed to record collection');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveCollection = async (repaymentId: number) => {
        if (!confirm('Approve this manual collection?')) return;

        setActionLoading(`approve-${repaymentId}`);
        try {
            await apiFetch(`/admin/loans/repayments/${repaymentId}/approve`, {
                method: 'POST'
            });
            alert('Collection approved!');
            loadDetails();
            onUpdate();
        } catch (e) {
            alert('Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveRepayment = async (repaymentId: number) => {
        if (!confirm('Approve this payment and mark EMI as PAID?')) return;

        setActionLoading(`approve-repayment-${repaymentId}`);
        try {
            await apiFetch(`/admin/repayments/${repaymentId}/approve`, {
                method: 'POST'
            });
            setViewingProof(null);
            loadDetails();
            onUpdate();
        } catch (e: any) {
            alert(e.message || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRepayment = async () => {
        if (!rejectingId || !rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setActionLoading(`reject-${rejectingId}`);
        try {
            await apiFetch(`/admin/repayments/${rejectingId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason: rejectReason })
            });
            setRejectingId(null);
            setRejectReason('');
            setViewingProof(null);
            loadDetails();
            onUpdate();
        } catch (e: any) {
            alert(e.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRequestReupload = async () => {
        if (reuploadFields.length === 0) return;
        if (!confirm(`Ask user to re-upload ${reuploadFields.length} field(s)?`)) return;

        setActionLoading('reupload');
        try {
            await apiFetch(`/admin/loans/${loanId}/request-reupload`, {
                method: 'POST',
                body: JSON.stringify({
                    fields: reuploadFields,
                    remarks: reuploadRemarks
                })
            });
            alert('Re-upload request sent! User will see correction prompts.');
            setReuploadFields([]);
            setReuploadRemarks('');
            loadDetails();
            onUpdate();
        } catch (e: any) {
            alert(e.message || 'Failed to send request');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || !data) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
                    <p className="font-bold text-slate-500">Loading details...</p>
                </div>
            </div>
        );
    }

    const { loan, repayments } = data;

    return (
        <div className="contents">
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <div className="bg-slate-50 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto relative">

                    {/* Header */}
                    <div className="bg-white p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10 shadow-sm">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h2 className="text-2xl font-black text-slate-900">{loan.user?.name}</h2>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">#{loan.display_id || loan.id}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-black text-slate-700 tabular-nums">{loan.user?.mobile_number || loan.form_data?.phone || '—'}</span>
                                {loan.user?.alternate_number?.phone && (
                                    <>
                                        <span className="text-slate-300 text-xs">·</span>
                                        <span className="text-xs font-bold text-slate-400 tabular-nums" title="Alternate Number">{loan.user.alternate_number.phone}</span>
                                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tight">Alt</span>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <User size={16} className="text-blue-500" />
                                    Approved by: <span className="text-slate-900 font-bold">{loan.approver?.name || 'System/Admin'}</span>
                                </div>
                                {loan.disbursed_at && (
                                    <div className="flex items-center gap-1.5">
                                        <BadgeCheck size={16} className="text-emerald-500" />
                                        Disbursed: <span className="text-slate-900 font-bold">₹{parseFloat(loan.amount).toLocaleString()}</span> on {new Date(loan.disbursed_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 sm:p-8 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Loan</p>
                                <p className="text-lg font-black text-slate-900">₹{parseFloat(loan.amount).toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid Amount</p>
                                <p className="text-lg font-black text-emerald-600">₹{parseFloat(loan.paid_amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenure</p>
                                <p className="text-lg font-black text-slate-900">{loan.tenure} <span className="text-xs text-slate-400">{Number(loan.tenure) > 6 ? 'Days' : 'Months'}</span></p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-black uppercase ${loan.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                    }`}>{loan.status}</span>
                            </div>
                        </div>

                        {/* Calculations Breakdown */}
                        {loan.calculations && (
                            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    Pricing Breakdown
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-6">
                                    {Object.entries(loan.calculations).map(([key, val]: [string, any]) => (
                                        typeof val !== 'object' && val !== null && val !== undefined && (
                                            <div key={key}>
                                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">{key.replace(/_/g, ' ')}</p>
                                                <p className="text-sm font-black text-emerald-900">
                                                    {typeof val === 'number' ?
                                                        (key.includes('rate') ? `${val}%` : `₹${val.toLocaleString()}`)
                                                        : String(val)}
                                                </p>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* KYC & Form Data Integrated (Same as FormDetailsModal) */}
                        {loan.form_data && Object.keys(loan.form_data).length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        Applicant KYC & Form Data
                                    </h3>
                                    <div className="flex gap-2 text-[10px] font-black text-slate-400">
                                        {loan.form_data.auto_approved && (
                                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                <Shield size={10} /> AUTO-APPROVED
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 sm:p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Personal & Contact */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <User size={16} className="text-blue-500" />
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Personal & Contact</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Full Name</p>
                                                        <p className="text-sm font-bold text-slate-900">{loan.form_data.first_name} {loan.form_data.last_name}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const key = 'full_name';
                                                            setReuploadFields(prev =>
                                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('full_name')
                                                                ? "bg-rose-500 text-white border-rose-500"
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                        title="Mark for Re-upload"
                                                    >
                                                        <Shield size={10} fill={reuploadFields.includes('full_name') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mobile Number</p>
                                                        <p className="text-sm font-bold text-slate-900">{loan.form_data.phone || loan.user?.mobile_number || 'N/A'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const key = 'phone';
                                                            setReuploadFields(prev =>
                                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('phone')
                                                                ? "bg-rose-500 text-white border-rose-500"
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                        title="Mark for Re-upload"
                                                    >
                                                        <Shield size={10} fill={reuploadFields.includes('phone') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Alternate Mobile</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {loan.user?.alternate_number?.phone || 'N/A'}
                                                        </p>
                                                        {loan.user?.alternate_number?.verified_at && (
                                                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tight">Verified</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date of Birth</p>
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {loan.form_data.birth_day && loan.form_data.birth_month && loan.form_data.birth_year
                                                                ? `${loan.form_data.birth_day}/${loan.form_data.birth_month}/${loan.form_data.birth_year}`
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const key = 'date_of_birth';
                                                            setReuploadFields(prev =>
                                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('date_of_birth')
                                                                ? "bg-rose-500 text-white border-rose-500"
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                        title="Mark for Re-upload"
                                                    >
                                                        <Shield size={10} fill={reuploadFields.includes('date_of_birth') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Marital Status</p>
                                                    <p className="text-sm font-bold text-slate-900 uppercase">{loan.form_data.marital_status || 'N/A'}</p>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Father's Name</p>
                                                        <p className="text-sm font-bold text-slate-900">{loan.form_data.father_name || loan.user?.family_detail?.father_name || 'N/A'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const key = 'father_name';
                                                            setReuploadFields(prev =>
                                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('father_name')
                                                                ? "bg-rose-500 text-white border-rose-500"
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                        title="Mark for Re-upload"
                                                    >
                                                        <Shield size={10} fill={reuploadFields.includes('father_name') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mother's Name</p>
                                                        <p className="text-sm font-bold text-slate-900">{loan.form_data.mother_name || loan.user?.family_detail?.mother_name || 'N/A'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const key = 'mother_name';
                                                            setReuploadFields(prev =>
                                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('mother_name')
                                                                ? "bg-rose-500 text-white border-rose-500"
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                        title="Mark for Re-upload"
                                                    >
                                                        <Shield size={10} fill={reuploadFields.includes('mother_name') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Loan Usage / Purpose</p>
                                                    <p className="text-sm font-bold text-slate-900">{loan.form_data.loan_usage || 'N/A'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                                    <p className="text-sm font-bold text-slate-900">{loan.form_data.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 space-y-4">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-emerald-500" />
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Address Information</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const key = 'address_details';
                                                        setReuploadFields(prev =>
                                                            prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                        );
                                                    }}
                                                    className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('address_details')
                                                            ? "bg-rose-500 text-white border-rose-500"
                                                            : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                        }`}
                                                    title="Mark Address for Re-upload"
                                                >
                                                    <Shield size={10} fill={reuploadFields.includes('address_details') ? "currentColor" : "none"} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Current Address</p>
                                                        {loan.user?.is_permanent_same && (
                                                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Primary</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                        {[loan.form_data.street_address, loan.form_data.street_address_2, loan.form_data.city, loan.form_data.state, loan.form_data.postal_code || loan.form_data.pincode]
                                                            .filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Permanent Address</p>
                                                        {loan.form_data.is_permanent_same !== false && (
                                                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Same as Current</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                        {loan.form_data.is_permanent_same !== false
                                                            ? [loan.form_data.street_address, loan.form_data.street_address_2, loan.form_data.city, loan.form_data.state, loan.form_data.postal_code || loan.form_data.pincode].filter(Boolean).join(', ')
                                                            : [loan.form_data.permanent_street_address, loan.form_data.permanent_city, loan.form_data.permanent_state, loan.form_data.permanent_postal_code || loan.form_data.permanent_pincode].filter(Boolean).join(', ')
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {loan.form_data.location_url && (
                                                <a
                                                    href={loan.form_data.location_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors uppercase tracking-wider w-fit"
                                                >
                                                    <ExternalLink size={10} /> View Address on Google Maps
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                {/* Work & Identity */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Briefcase size={16} className="text-amber-500" />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Identity & Employment</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 flex justify-between items-start">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pan Card Number</p>
                                                <p className="text-sm font-black text-slate-900 uppercase font-mono">{loan.form_data.pan_number || 'N/A'}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const key = 'pan_number';
                                                    setReuploadFields(prev =>
                                                        prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                    );
                                                }}
                                                className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('pan_number')
                                                        ? "bg-rose-500 text-white border-rose-500"
                                                        : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                    }`}
                                                title="Mark for Re-upload"
                                            >
                                                <Shield size={10} fill={reuploadFields.includes('pan_number') ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <div className="col-span-2 flex justify-between items-start">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Aadhaar Card Number</p>
                                                <p className="text-sm font-black text-slate-900 font-mono">{loan.form_data.aadhar_number || 'N/A'}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const key = 'aadhar_number';
                                                    setReuploadFields(prev =>
                                                        prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                    );
                                                }}
                                                className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('aadhar_number')
                                                        ? "bg-rose-500 text-white border-rose-500"
                                                        : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                    }`}
                                                title="Mark for Re-upload"
                                            >
                                                <Shield size={10} fill={reuploadFields.includes('aadhar_number') ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Monthly Income</p>
                                            <p className="text-sm font-bold text-emerald-600">₹{parseFloat(loan.form_data.gross_monthly_income || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Occupation</p>
                                            <p className="text-sm font-bold text-slate-900">{loan.form_data.occupation || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Employment Type: <span className="text-blue-600 ml-1 underline decoration-2 underline-offset-4 font-mono">{loan.form_data.employment_type?.replace(/_/g, ' ').toUpperCase() || 'UNSPECIFIED'}</span></p>

                                            {loan.form_data.employment_type === 'self_employed' && (
                                                <div className="grid grid-cols-2 gap-4 bg-amber-50/30 p-3 rounded-xl border border-amber-100/50">
                                                    <div>
                                                        <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Business Type</p>
                                                        <p className="text-xs font-bold text-amber-900">{loan.form_data.business_type || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Location</p>
                                                        <p className="text-xs font-bold text-amber-900">{loan.form_data.business_location || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {loan.form_data.employment_type === 'employed' && (
                                                <div className="space-y-3 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                                                    <div>
                                                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Company Name</p>
                                                        <p className="text-xs font-bold text-blue-900">{loan.form_data.company_name || 'N/A'}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Role</p>
                                                            <p className="text-xs font-bold text-blue-900">{loan.form_data.job_role || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Location</p>
                                                            <p className="text-xs font-bold text-blue-900">{loan.form_data.company_location || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>


                        {(loan.form_data.bank_name || loan.user?.bank_name) && (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Landmark size={16} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Payout Info</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const key = 'bank_details';
                                            setReuploadFields(prev =>
                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                            );
                                        }}
                                        className={`p-1 rounded-lg transition-all border ${reuploadFields.includes('bank_details')
                                                ? "bg-rose-500 text-white border-rose-500"
                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                            }`}
                                        title="Mark Bank Account for Re-upload"
                                    >
                                        <Shield size={10} fill={reuploadFields.includes('bank_details') ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bank Name</p>
                                        <p className="text-sm font-bold text-slate-900">{loan.user?.bank_name || loan.form_data.bank_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Acc Number</p>
                                        <p className="text-sm font-black text-slate-900 font-mono">{loan.user?.account_number || loan.form_data.account_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">IFSC Code</p>
                                        <p className="text-sm font-black text-slate-900 font-mono">{loan.user?.ifsc_code || loan.form_data.ifsc_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Holder Name</p>
                                        <p className="text-sm font-bold text-slate-900">{loan.user?.account_holder_name || loan.form_data.account_holder_name}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KYC Images */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10">
                            {[
                                { id: 'aadhar_front', label: 'Aadhaar Front', aliases: ['aadhaar_front'] },
                                { id: 'aadhar_back', label: 'Aadhaar Back', aliases: ['aadhaar_back'] },
                                { id: 'pan_card', label: 'PAN Card', aliases: ['pan_front', 'pan_number_card'] },
                                { id: 'applicant_selfie', label: 'Applicant Selfie', aliases: ['selfie'] },
                                { id: 'selfie_with_agent', label: 'Selfie with Agent', aliases: ['agent_selfie'] },
                                { id: 'prop_1', label: 'Property Side 1', aliases: ['property_1'] },
                                { id: 'prop_2', label: 'Property Side 2', aliases: ['property_2'] },
                                { id: 'prop_3', label: 'Property Side 3', aliases: ['property_3'] }
                            ].map(field => {
                                // Check multiple locations and aliases for the image data
                                const getRawFile = () => {
                                    const searchKeys = [field.id, ...(field.aliases || [])];

                                    for (const key of searchKeys) {
                                        // 1. Check root level of form_data
                                        if (loan.form_data?.[key]) return loan.form_data[key];

                                        // 2. Check kyc_images object (standard for customer uploads)
                                        if (loan.form_data?.kyc_images?.[key]) return loan.form_data.kyc_images[key];

                                        // 3. Check kycImages (camelCase variation)
                                        if (loan.form_data?.kycImages?.[key]) return loan.form_data.kycImages[key];

                                        // 4. Check direct key on loan object (sometimes returned flat)
                                        if (loan[key]) return loan[key];
                                    }
                                    return null;
                                };

                                const rawFile = getRawFile();

                                // Normalize to array of image objects: [{ url: string, geo?: any, added_by_admin?: boolean }]
                                const normalize = (val: any): any[] => {
                                    if (!val) return [];

                                    // Handle Array (bulk uploads or multiple versions)
                                    if (Array.isArray(val)) {
                                        return val.map(item => {
                                            if (typeof item === 'string') return { url: item };
                                            if (item && typeof item === 'object') {
                                                return { ...item, url: item.url || item.path || item.filePath };
                                            }
                                            return null;
                                        }).filter(i => i && i.url);
                                    }

                                    // Handle single object { url: '...', geo: '...' }
                                    if (typeof val === 'object') {
                                        const url = val.url || val.path || val.filePath;
                                        if (url) return [{ ...val, url }];
                                        // Might be an object that IS the file if keys are actually files?
                                        // (Unlikely, but let's check for a few common keys)
                                        if (val.url) return [val];
                                    }

                                    // Handle single string (path/URL)
                                    if (typeof val === 'string') {
                                        return [{ url: val }];
                                    }

                                    return [];
                                };

                                const files = normalize(rawFile);
                                const hasImages = files.length > 0;

                                return (
                                    <div key={field.id} className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center truncate">
                                                {field.label}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReuploadFields(prev =>
                                                        prev.includes(field.id) ? prev.filter(f => f !== field.id) : [...prev, field.id]
                                                    );
                                                }}
                                                className={`p-1 rounded-lg transition-all border ${reuploadFields.includes(field.id)
                                                        ? "bg-rose-500 text-white border-rose-500"
                                                        : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                    }`}
                                                title="Mark for Re-upload"
                                            >
                                                <Shield size={10} fill={reuploadFields.includes(field.id) ? "currentColor" : "none"} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {files.map((file, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <a href={getStorageUrl(file.url) || ''} target="_blank" rel="noopener noreferrer" className={`block relative group aspect-video sm:aspect-square overflow-hidden rounded-2xl border-2 transition-all ${reuploadFields.includes(field.id) ? 'border-rose-500 shadow-lg shadow-rose-500/20' : 'border-slate-100 bg-white'} shadow-sm`}>
                                                        <img src={getStorageUrl(file.url) || ''} alt={`${field.label} ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                                            <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all text-slate-900 shadow-xl">
                                                                <ExternalLink className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                        {file.added_by_admin && (
                                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-[8px] font-black text-white rounded-full shadow-lg border border-blue-400">
                                                                ADMIN ADDED
                                                            </div>
                                                        )}
                                                        {reuploadFields.includes(field.id) && (
                                                            <div className="absolute top-2 left-2 bg-rose-500 text-white p-1 rounded-lg">
                                                                <BadgeCheck size={12} />
                                                            </div>
                                                        )}
                                                    </a>
                                                    {file.geo && (
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <div className="flex flex-col text-[8px] font-bold text-slate-400 items-center italic leading-tight">
                                                                <span>{file.geo.lat?.toFixed(4)}, {file.geo.lng?.toFixed(4)}</span>
                                                            </div>
                                                            <a
                                                                href={`https://www.google.com/maps/search/?api=1&query=${file.geo.lat},${file.geo.lng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-[8px] font-black text-blue-500 hover:text-blue-700 transition-colors uppercase tracking-widest"
                                                            >
                                                                <MapPin size={10} /> View Map
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {!hasImages && (
                                                <div className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-4 text-center ${reuploadFields.includes(field.id) ? 'border-rose-500 shadow-lg shadow-rose-500/20 bg-rose-50 text-rose-500' : 'border-dashed border-slate-200 bg-slate-50 text-slate-300'}`}>
                                                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-[9px] font-black uppercase tracking-tighter leading-tight">Missing<br />Document</p>
                                                </div>
                                            )}

                                            <button
                                                disabled={uploadingField !== null}
                                                onClick={() => { setSelectedUploadField(field.id); fileInputRef.current?.click(); }}
                                                className={`w-full py-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all
                                                                ${uploadingField === field.id
                                                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-blue-400 hover:text-blue-500 hover:shadow-md'
                                                    }
                                                            `}
                                            >
                                                {uploadingField === field.id ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                                            <Plus className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{hasImages ? 'Add More' : 'Add Image'}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bulk Re-upload Action */}
                        {reuploadFields.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
                                <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100 px-6 py-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                            <Shield size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Re-upload Feedback</span>
                                    </div>
                                    <textarea
                                        value={reuploadRemarks}
                                        onChange={(e) => setReuploadRemarks(e.target.value)}
                                        placeholder="Explain why these fields need re-upload (e.g. 'Images are blurred', 'Address mismatch')..."
                                        className="w-full bg-white border border-rose-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:text-rose-200 min-h-[100px]"
                                    />
                                </div>
                                <div className="flex justify-end p-6 pt-0">
                                    <button
                                        disabled={actionLoading === 'reupload'}
                                        onClick={handleRequestReupload}
                                        className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-500/30 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === 'reupload' ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                                        Request KYC Update ({reuploadFields.length} Items)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                        )}

                {/* EMI Table */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            Repayment Schedule
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                <tr>
                                    <th className="p-4 pl-6 w-16">#</th>
                                    <th className="p-4">Due Date</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {repayments.map((emi: any, index: number) => (
                                    <tr key={emi.id} className={`transition-colors ${emi.status === 'PENDING_VERIFICATION' || emi.status === 'AGENT_APPROVED'
                                        ? 'bg-amber-50/40 hover:bg-amber-50/60'
                                        : 'hover:bg-blue-50/30'
                                        }`}>
                                        <td className="p-4 pl-6 font-mono text-slate-400">#{index + 1}</td>
                                        <td className="p-4 font-medium text-slate-900">
                                            {new Date(emi.due_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-black text-slate-900">
                                                ₹{parseFloat(emi.amount).toLocaleString()}
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter" title="Principal">P: ₹{parseFloat(emi.principal_component || 0).toLocaleString()}</span>
                                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter" title="Interest (Profit)">I: ₹{parseFloat(emi.interest_component || 0).toLocaleString()}</span>
                                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter" title="Fees">F: ₹{parseFloat(emi.fee_component || 0).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {emi.status === 'PAID' ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Paid
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {emi.payment_mode || 'ONLINE'}
                                                    </span>
                                                </div>
                                            ) : emi.status === 'PENDING_VERIFICATION' ? (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 animate-pulse">
                                                    <Clock size={12} /> Awaiting Approval
                                                </span>
                                            ) : emi.status === 'AGENT_APPROVED' ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                        <ShieldCheck size={12} /> Agent Approved
                                                    </span>
                                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                                        Needs Admin Final
                                                    </span>
                                                </div>
                                            ) : emi.status === 'MANUAL_VERIFICATION' ? (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                    <Clock size={12} /> Verification
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                                                    Pending
                                                </span>
                                            )}

                                            {/* Transaction ID */}
                                            {emi.transaction_id && (
                                                <p className="text-[10px] text-slate-500 mt-1 font-mono" title={emi.transaction_id}>
                                                    TXN: {emi.transaction_id}
                                                </p>
                                            )}

                                            {/* Verification Note */}
                                            {(emi.status === 'MANUAL_VERIFICATION' || (emi.status === 'PAID' && emi.payment_mode === 'MANUAL')) && emi.notes && (
                                                <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={emi.notes}>
                                                    Note: {emi.notes}
                                                </p>
                                            )}

                                            {/* Admin rejection note */}
                                            {emi.admin_note && emi.status === 'PENDING' && (
                                                <p className="text-[10px] text-rose-500 mt-1 max-w-[150px] truncate font-bold" title={emi.admin_note}>
                                                    ⚠ Rejected: {emi.admin_note}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                {/* PENDING_VERIFICATION or AGENT_APPROVED — show View Proof + Approve + Reject */}
                                                {(emi.status === 'PENDING_VERIFICATION' || emi.status === 'AGENT_APPROVED') && (
                                                    <div className="flex gap-2 flex-wrap justify-end">
                                                        {/* View Proof */}
                                                        {emi.proof_image && (
                                                            <button
                                                                onClick={() => setViewingProof(emi)}
                                                                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100"
                                                            >
                                                                <Eye size={12} /> View Proof
                                                            </button>
                                                        )}
                                                        {/* Approve */}
                                                        <button
                                                            onClick={() => handleApproveRepayment(emi.id)}
                                                            disabled={!!actionLoading}
                                                            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={12} /> {actionLoading === `approve-repayment-${emi.id}` ? '...' : 'Approve'}
                                                        </button>
                                                        {/* Reject */}
                                                        <button
                                                            onClick={() => { setRejectingId(emi.id); setRejectReason(''); }}
                                                            disabled={!!actionLoading}
                                                            className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50"
                                                        >
                                                            <XCircle size={12} /> Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {/* PENDING — Collect Manual */}
                                                {emi.status === 'PENDING' && (
                                                    collectingId === emi.id ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px] bg-slate-50 p-3 rounded-xl border border-blue-100 shadow-lg relative z-10">
                                                            <p className="text-xs font-bold text-slate-900 text-left">Manual Collection</p>
                                                            <input
                                                                type="number"
                                                                placeholder="Amount"
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-bold"
                                                                value={amount}
                                                                onChange={e => setAmount(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Ref/Notes (Optional)"
                                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                                                                value={notes}
                                                                onChange={e => setNotes(e.target.value)}
                                                            />
                                                            <div className="flex gap-2 mt-1">
                                                                <button
                                                                    onClick={handleManualCollect}
                                                                    disabled={!amount || !!actionLoading}
                                                                    className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                                                                >
                                                                    {actionLoading ? '...' : 'Submit'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setCollectingId(null)}
                                                                    className="px-3 bg-slate-200 text-slate-600 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setCollectingId(emi.id);
                                                                setAmount(emi.amount); // Default to full amount
                                                                setNotes('');
                                                            }}
                                                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                        >
                                                            Collect Manual
                                                        </button>
                                                    )
                                                )}

                                                {emi.status === 'MANUAL_VERIFICATION' && (
                                                    <button
                                                        onClick={() => handleApproveCollection(emi.id)}
                                                        disabled={!!actionLoading}
                                                        className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-600 hover:shadow-emerald-500/20 transition-all"
                                                    >
                                                        {actionLoading === `approve-${emi.id}` ? '...' : 'Approve'}
                                                    </button>
                                                )}

                                                {/* Show proof thumbnail for PAID with proof */}
                                                {emi.status === 'PAID' && emi.proof_image && (
                                                    <button
                                                        onClick={() => setViewingProof(emi)}
                                                        className="inline-flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors"
                                                    >
                                                        <Eye size={10} /> Receipt
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
            </div >

        {/* ===== Payment Proof Viewer Modal ===== */ }
    {
        viewingProof && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => setViewingProof(null)}>
                <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                    {/* Image Side */}
                    <div className="lg:w-2/3 bg-slate-900 flex items-center justify-center relative overflow-hidden p-6 min-h-[300px]">
                        {viewingProof.proof_image ? (
                            <div className="relative group">
                                <img
                                    src={getStorageUrl(viewingProof.proof_image)}
                                    alt="Payment Proof"
                                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border-2 border-white/10"
                                />
                                <button
                                    onClick={() => window.open(getStorageUrl(viewingProof.proof_image), '_blank')}
                                    className="absolute top-3 right-3 p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ExternalLink size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-white/40">
                                <ImageIcon size={64} className="mx-auto mb-4 opacity-30" />
                                <p className="font-black uppercase tracking-widest text-sm">No Proof Uploaded</p>
                            </div>
                        )}
                    </div>

                    {/* Details Side */}
                    <div className="lg:w-1/3 flex flex-col p-6 lg:p-8 shrink-0 overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Payment Proof</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    EMI #{repayments.findIndex((r: any) => r.id === viewingProof.id) + 1}
                                </p>
                            </div>
                            <button onClick={() => setViewingProof(null)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all">
                                <X size={18} className="text-slate-600" />
                            </button>
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Amount */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                                <p className="text-2xl font-black text-blue-600">₹{parseFloat(viewingProof.amount).toLocaleString()}</p>
                            </div>

                            {/* Transaction ID */}
                            {viewingProof.transaction_id && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID (UTR)</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 bg-slate-200 px-2 py-1 rounded-md break-all inline-block">{viewingProof.transaction_id}</p>
                                </div>
                            )}

                            {/* Due Date */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                <p className="text-sm font-black text-slate-700">{new Date(viewingProof.due_date).toLocaleDateString()}</p>
                            </div>

                            {/* Status */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${viewingProof.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                    viewingProof.status === 'AGENT_APPROVED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {viewingProof.status === 'AGENT_APPROVED' ? 'Awaiting Approval' : viewingProof.status.replace(/_/g, ' ')}
                                </span>
                            </div>

                            {/* Loan Breakdown for Verification */}
                            {loan.calculations && (
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Calculator size={12} /> Loan Breakdown
                                    </p>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Sanctioned</p>
                                            <p className="text-xs font-black text-emerald-900">₹{parseFloat(loan.calculations.principal || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Disbursed</p>
                                            <p className="text-xs font-black text-emerald-900">₹{parseFloat(loan.calculations.disbursal_amount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Interest ({loan.calculations.interest_rate}%)</p>
                                            <p className="text-xs font-black text-emerald-900">₹{parseFloat(loan.calculations.total_interest || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Net Payable</p>
                                            <p className="text-xs font-black text-indigo-700">₹{parseFloat(loan.calculations.net_payable_amount || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {viewingProof.notes && (
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Notes</p>
                                    <p className="text-xs font-medium text-amber-800">{viewingProof.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {(viewingProof.status === 'PENDING_VERIFICATION' || viewingProof.status === 'AGENT_APPROVED') && (
                            <div className="pt-6 space-y-2 mt-auto border-t border-slate-100">
                                <button
                                    onClick={() => handleApproveRepayment(viewingProof.id)}
                                    disabled={!!actionLoading}
                                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} /> {actionLoading?.startsWith('approve') ? 'Approving...' : 'Approve Payment'}
                                </button>
                                <button
                                    onClick={() => { setRejectingId(viewingProof.id); setRejectReason(''); }}
                                    disabled={!!actionLoading}
                                    className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black hover:bg-rose-100 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2 border border-rose-100 disabled:opacity-50"
                                >
                                    <XCircle size={16} /> Reject Payment
                                </button>
                                <button
                                    onClick={() => setViewingProof(null)}
                                    className="w-full py-3 text-slate-400 rounded-2xl text-xs font-black hover:bg-slate-50 active:scale-[0.98] transition-all uppercase tracking-widest"
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {viewingProof.status === 'PAID' && (
                            <div className="pt-6 mt-auto">
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                                    <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Payment Verified</p>
                                    {viewingProof.paid_at && (
                                        <p className="text-[10px] text-emerald-500 mt-1">
                                            {new Date(viewingProof.paid_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    {/* ===== Reject Reason Modal ===== */ }
    {
        rejectingId && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setRejectingId(null)}>
                <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center">
                            <XCircle size={24} className="text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Reject Payment</h3>
                            <p className="text-xs text-slate-400 font-bold">Provide a reason for the customer</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Quick reasons */}
                        <div className="flex flex-wrap gap-2">
                            {['Invalid screenshot', 'Amount mismatch', 'Duplicate submission', 'Unreadable proof'].map(reason => (
                                <button
                                    key={reason}
                                    onClick={() => setRejectReason(reason)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${rejectReason === reason
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-200 hover:bg-rose-50'
                                        }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="flex-1 py-3.5 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRejectRepayment}
                            disabled={!rejectReason.trim() || !!actionLoading}
                            className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {actionLoading?.startsWith('reject') ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }
        </div >
    );
}
