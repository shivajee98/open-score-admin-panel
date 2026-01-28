
'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { BadgeCheck, Ban, Clock, ChevronRight, Calculator, IndianRupee } from 'lucide-react';

export default function LoanApprovals() {
    const [loans, setLoans] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');
    const [previewLoan, setPreviewLoan] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadLoans = async () => {
        setLoading(true);
        try {
            const [pendingData, historyData] = await Promise.all([
                apiFetch('/admin/loans'),
                apiFetch('/admin/loans/history')
            ]);
            setLoans(pendingData);
            setHistory(historyData);
        } catch (error) {
            console.error('Failed to load loans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLoans();
    }, []);

    const handleAction = async (id: number, endpoint: string, successMsg: string) => {
        setActionLoading(`${id}-${endpoint}`);
        try {
            await apiFetch(`/admin/loans/${id}/${endpoint}`, { method: 'POST' });
            alert(successMsg);
            loadLoans();
        } catch (e) {
            alert('Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const displayedLoans = activeTab === 'requests' ? loans : history;

    return (
        <AdminLayout title="Loan Approvals">
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'requests'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Pending Requests
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history'
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Loan History
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">
                            {activeTab === 'requests' ? 'Pending Loan Requests' : 'Past Loan Records'}
                        </h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {activeTab === 'requests'
                                ? 'Review applicant details and approve disbursals.'
                                : 'Archive of disbursed, rejected, and closed loans.'}
                        </p>
                    </div>
                    {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                </div>

                {displayedLoans.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BadgeCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No records found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Applicant</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Terms</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedLoans.map((loan: any) => (
                                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                                                    {loan.user?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{loan.user?.name || 'Unknown User'}</p>
                                                    <p className="text-xs font-medium text-slate-500">ID: {loan.user_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <IndianRupee size={16} className="text-slate-400" />
                                                <span className="font-black text-slate-900 text-lg">
                                                    {parseFloat(loan.amount).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Clock size={12} />
                                                    {loan.tenure} Months
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                                                    <Calculator size={12} />
                                                    {loan.payout_frequency}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-medium text-slate-500 text-sm">
                                            {new Date(loan.created_at).toLocaleDateString()}
                                            <br />
                                            <span className="text-xs text-slate-400">{new Date(loan.created_at).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide ${loan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                                    loan.status === 'DISBURSED' ? 'bg-blue-100 text-blue-600' :
                                                        loan.status === 'KC_SENT' ? 'bg-amber-100 text-amber-600' :
                                                            loan.status === 'FORM_SUBMITTED' ? 'bg-purple-100 text-purple-600' :
                                                                loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                                                                    loan.status === 'CANCELLED' ? 'bg-slate-200 text-slate-600 line-through' :
                                                                        'bg-slate-100 text-slate-600'
                                                }`}>{loan.status}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {loan.status === 'PENDING' && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleAction(loan.id, 'proceed', 'Loan Proceeded!')}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all"
                                                    >
                                                        Proceed
                                                    </button>
                                                )}

                                                {loan.status === 'PROCEEDED' && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleAction(loan.id, 'send-kyc', 'KYC Form Link Sent!')}
                                                        className="px-4 py-2 bg-amber-400 text-slate-900 rounded-lg font-bold text-xs hover:bg-amber-500 transition-all"
                                                    >
                                                        Send KYC Form Link
                                                    </button>
                                                )}

                                                {loan.status === 'KYC_SENT' && (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Awaiting KYC</span>
                                                        <button
                                                            disabled={!!actionLoading}
                                                            onClick={() => handleAction(loan.id, 'send-kyc', 'KYC Form Link Sent!')}
                                                            className="px-4 py-2 bg-amber-400/10 text-amber-600 border border-amber-200 rounded-lg font-bold text-[10px] hover:bg-amber-400/20 transition-all"
                                                        >
                                                            Resend link
                                                        </button>
                                                    </div>
                                                )}

                                                {loan.status === 'FORM_SUBMITTED' && (
                                                    <>
                                                        <button
                                                            onClick={() => setPreviewLoan(loan)}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200 transition-all"
                                                        >
                                                            Preview Details
                                                        </button>
                                                        <button
                                                            disabled={!!actionLoading}
                                                            onClick={() => handleAction(loan.id, 'send-kyc', 'KYC Form Link Sent!')}
                                                            className="px-4 py-2 bg-amber-400 text-slate-900 rounded-lg font-bold text-xs hover:bg-amber-500 transition-all"
                                                        >
                                                            Resend KYC Link
                                                        </button>
                                                        <button
                                                            disabled={!!actionLoading}
                                                            onClick={() => handleAction(loan.id, 'approve', 'Loan Approved!')}
                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-all"
                                                        >
                                                            Approve Loan
                                                        </button>
                                                    </>
                                                )}

                                                {loan.status === 'APPROVED' && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => {
                                                            if (confirm('Release funds to user wallet?')) handleAction(loan.id, 'release', 'Funds Released!');
                                                        }}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all"
                                                    >
                                                        Release Funds
                                                    </button>
                                                )}

                                                {/* History Actions - Mostly View Only */}
                                                {(loan.status === 'DISBURSED' || loan.status === 'REJECTED' || loan.status === 'CLOSED' || loan.status === 'CANCELLED') && (
                                                    <button
                                                        onClick={() => setPreviewLoan(loan)}
                                                        className="px-4 py-2 bg-slate-50 text-slate-400 rounded-lg font-bold text-xs hover:bg-slate-100 transition-all"
                                                    >
                                                        View Data
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Preview Modal */}
            {previewLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">KYC Form Details</h2>
                                <p className="text-sm text-slate-500">Submitted on {new Date(previewLoan.updated_at).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setPreviewLoan(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                                <BadgeCheck className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            {previewLoan.form_data ? (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                    {Object.entries(previewLoan.form_data).map(([key, value]: [string, any]) => {
                                        const isImageObject = value && typeof value === 'object' && value.url;
                                        return (
                                            <div key={key} className={isImageObject ? "col-span-2 sm:col-span-1" : ""}>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                                                {isImageObject ? (
                                                    <div className="space-y-2">
                                                        <a href={value.url} target="_blank" rel="noopener noreferrer" className="block relative group aspect-video overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                                                            <img src={value.url} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                                                <ChevronRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                        </a>
                                                        {value.geo && (
                                                            <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                <span>Lat: {value.geo.lat?.toFixed(6)}</span>
                                                                <span>Lng: {value.geo.lng?.toFixed(6)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-slate-900 break-words">{String(value)}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No form data submitted.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
