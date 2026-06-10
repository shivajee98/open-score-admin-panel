'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { 
    Clock, Search, Trash2, ChevronLeft, ChevronRight, Eye, FileText, 
    Download, MapPin, Briefcase, Landmark, Camera, User, Mail, Phone, 
    Shield, ExternalLink, X, Info, Send, CheckCircle2, ShieldCheck, 
    Percent, Bell, Building2, Check, RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import EmailHistoryModal from '@/components/EmailHistoryModal';
import AppNotificationHistoryModal from '@/components/AppNotificationHistoryModal';

export default function ConstructionLoanAdmin() {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Selected items for bulk operations
    const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);

    // Detail Modal / Remarks States
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [isEditingJson, setIsEditingJson] = useState(false);
    const [editJsonStr, setEditJsonStr] = useState('');

    // Email Modal States
    const [isEmailHistoryOpen, setIsEmailHistoryOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTargetIds, setEmailTargetIds] = useState<number[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // App Notification Modal States
    const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = useState(false);
    const [notificationTargetIds, setNotificationTargetIds] = useState<number[]>([]);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const endpoint = `/admin/construction-loans?page=${page}&status=${statusFilter}&search=${encodeURIComponent(search)}`;
            const response = await apiFetch(endpoint);
            if (response && response.data) {
                setLoans(response.data);
                setTotalPages(response.last_page || 1);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to load construction loans.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [page, statusFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLoans();
    };

    // Bulk Email Modal Trigger
    const handleOpenBulkEmailModal = () => {
        const userIds = loans
            .filter(l => selectedLoanIds.includes(l.id))
            .map(l => l.user?.id)
            .filter((id): id is number => !!id);
        const uniqueUserIds = Array.from(new Set(userIds));

        if (uniqueUserIds.length === 0) {
            toast.error('None of the selected applications have valid user records.');
            return;
        }

        setEmailTargetIds(uniqueUserIds);
        setEmailSubject('');
        setEmailMessage('');
        setIsEmailModalOpen(true);
    };

    // Single Email Modal Trigger
    const handleOpenSingleEmailModal = (userId: number) => {
        setEmailTargetIds([userId]);
        setEmailSubject('');
        setEmailMessage('');
        setIsEmailModalOpen(true);
    };

    const handleSendEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingEmail(true);
        try {
            for (const id of emailTargetIds) {
                await apiFetch('/admin/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient_ids: [id],
                        recipient_type: 'user',
                        subject: emailSubject,
                        message: emailMessage,
                    })
                });
                // Small sleep to rotate SMTP cleanly
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            toast.success('Emails scheduled successfully!');
            setIsEmailModalOpen(false);
            setSelectedLoanIds([]);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send emails.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    // Bulk/Single App Notification Triggers
    const handleOpenBulkNotification = () => {
        const userIds = loans
            .filter(l => selectedLoanIds.includes(l.id))
            .map(l => l.user?.id)
            .filter((id): id is number => !!id);
        const uniqueUserIds = Array.from(new Set(userIds));

        if (uniqueUserIds.length === 0) {
            toast.error('None of the selected applications have valid user records.');
            return;
        }

        setNotificationTargetIds(uniqueUserIds);
        setIsNotificationHistoryOpen(true);
    };

    const handleOpenSingleNotification = (userId: number) => {
        setNotificationTargetIds([userId]);
        setIsNotificationHistoryOpen(true);
    };

    // Handle single row selection toggle
    const handleSelectRow = (id: number) => {
        setSelectedLoanIds(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    // Select/Deselect All Rows
    const handleSelectAllRows = () => {
        const pageLoanIds = loans.map(l => l.id);
        const allSelected = pageLoanIds.every(id => selectedLoanIds.includes(id));
        
        if (allSelected) {
            setSelectedLoanIds(prev => prev.filter(id => !pageLoanIds.includes(id)));
        } else {
            setSelectedLoanIds(prev => Array.from(new Set([...prev, ...pageLoanIds])));
        }
    };

    // Update Status Action
    const handleUpdateStatus = async (status: string) => {
        if (!selectedLoan) return;
        setActionLoading(true);

        try {
            const response = await apiFetch(`/admin/construction-loans/${selectedLoan.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    remarks
                })
            });

            if (response && response.loan) {
                toast.success(`Application status updated to ${status}`);
                setSelectedLoan(null);
                setRemarks('');
                fetchLoans();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update application status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteLoan = async (id: number) => {
        if (!confirm('Are you sure you want to permanently delete this application?')) return;
        setActionLoading(true);
        try {
            await apiFetch(`/admin/construction-loans/${id}`, {
                method: 'DELETE'
            });
            toast.success('Application deleted successfully');
            setSelectedLoan(null);
            fetchLoans();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete application.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateDetails = async () => {
        if (!selectedLoan) return;
        try {
            const parsedData = JSON.parse(editJsonStr);
            setActionLoading(true);
            const response = await apiFetch(`/admin/construction-loans/${selectedLoan.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: selectedLoan.amount,
                    form_data: parsedData
                })
            });
            if (response && response.loan) {
                toast.success('Details updated successfully');
                setSelectedLoan(response.loan);
                setIsEditingJson(false);
                fetchLoans();
            }
        } catch (e: any) {
            toast.error(e.message || 'Invalid JSON format or update failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Direct Excel/CSV Export
    const handleExportExcel = () => {
        const token = localStorage.getItem('token');
        const exportUrl = `https://api.msmeloan.sbs/api/admin/construction-loans/export?token=${token}`;
        window.open(exportUrl, '_blank');
        toast.success('Construction loan spreadsheet export started!');
    };

    return (
        <AdminLayout title="Construction Loan Applications">
            <div className="space-y-6 font-sans">
                
                {/* Analytics Counters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => {
                        const count = loans.filter(l => l.status === st).length;
                        return (
                            <div key={st} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{st} Apps</p>
                                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                                        {count > 0 ? count : 0} <span className="text-xs text-slate-400 font-semibold">on screen</span>
                                    </h3>
                                </div>
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                    st === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                    st === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                    st === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                                    'bg-slate-50 text-slate-600'
                                }`}>
                                    {st[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Filters, Controls & Excel Trigger */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        
                        {/* Search submission */}
                        <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-md">
                            <input 
                                type="text" 
                                placeholder="Search by applicant name, mobile, email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                        </form>

                        {/* Excel Export & Global dispatchers */}
                        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
                            <button 
                                onClick={handleExportExcel}
                                className="bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest px-5 py-4 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                            >
                                <Download size={14} /> Export to Excel
                            </button>
                            <button 
                                onClick={() => setIsEmailHistoryOpen(true)}
                                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest px-4 py-4 rounded-2xl flex items-center gap-2 transition-colors"
                            >
                                <Mail size={14} /> Email History
                            </button>
                            <button 
                                onClick={() => setIsNotificationHistoryOpen(true)}
                                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest px-4 py-4 rounded-2xl flex items-center gap-2 transition-colors"
                            >
                                <Bell size={14} /> Push Logs
                            </button>
                        </div>
                    </div>

                    {/* Horizontal Status tabs */}
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 overflow-x-auto whitespace-nowrap scrollbar-none">
                        <div className="flex items-center gap-2">
                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
                                <button 
                                    key={st}
                                    onClick={() => { setStatusFilter(st); setPage(1); }}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                        statusFilter === st ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={fetchLoans}
                            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all active:scale-95 shrink-0"
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Loans Grid Table */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-5 w-10">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAllRows}
                                            checked={loans.length > 0 && loans.every(l => selectedLoanIds.includes(l.id))}
                                            className="rounded border-slate-300 text-slate-950 focus:ring-slate-950 w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Amount</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied Date</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            Loading applications...
                                        </td>
                                    </tr>
                                ) : loans.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            No construction loan records found.
                                        </td>
                                    </tr>
                                ) : (
                                    loans.map((loan) => {
                                        const isSelected = selectedLoanIds.includes(loan.id);
                                        return (
                                            <tr key={loan.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(loan.id)}
                                                        className="rounded border-slate-300 text-slate-950 focus:ring-slate-950 w-4 h-4 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="p-5 text-xs font-black text-slate-400">#{loan.id}</td>
                                                <td className="p-5">
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-950">{loan.user?.name || 'N/A'}</h4>
                                                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{loan.user?.mobile_number || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-sm font-black text-slate-900">₹ {parseFloat(loan.amount).toLocaleString('en-IN')}</span>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                                        {loan.form_data?.construction_purpose || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-xs font-bold text-slate-400">
                                                    {new Date(loan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-5">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                                                        loan.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        loan.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        loan.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                        'bg-slate-50 text-slate-600 border border-slate-100'
                                                    }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => { setSelectedLoan(loan); setRemarks(loan.remarks || ''); }}
                                                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all"
                                                            title="Inspect Application"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        {loan.user && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleOpenSingleEmailModal(loan.user.id)}
                                                                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all"
                                                                    title="Email Applicant"
                                                                >
                                                                    <Mail size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleOpenSingleNotification(loan.user.id)}
                                                                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all"
                                                                    title="Send App Notification"
                                                                >
                                                                    <Bell size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer */}
                    {!loading && totalPages > 1 && (
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</span>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk Operations Overlay (Floating) */}
                {selectedLoanIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-950 text-white rounded-3xl px-6 py-4 flex items-center gap-6 shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                            {selectedLoanIds.length} apps selected
                        </span>
                        <div className="h-4 w-[1px] bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleOpenBulkEmailModal}
                                className="bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 hover:bg-teal-700 transition-all"
                            >
                                <Send className="w-3.5 h-3.5" /> Bulk Email
                            </button>
                            <button 
                                onClick={handleOpenBulkNotification}
                                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-700 transition-all"
                            >
                                <Bell className="w-3.5 h-3.5" /> Bulk Push
                            </button>
                            <button 
                                onClick={() => setSelectedLoanIds([])}
                                className="text-slate-400 hover:text-white px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Detailed Inspector Modal */}
                {selectedLoan && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                            
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Inspector</span>
                                    <h3 className="text-xl font-black text-slate-900 mt-0.5">#{selectedLoan.id} - {selectedLoan.user?.name}</h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedLoan(null)} 
                                    className="p-2 bg-white hover:bg-slate-100 text-slate-500 rounded-full border border-slate-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable details */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-8 font-sans">
                                
                                {/* 9-Step Submitted Form Data Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    
                                    {/* 1. Basic details */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Applicant Personal details</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Father/Husband Name:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.father_husband_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Alternate Mobile:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.alternate_mobile || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Aadhaar Number:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.aadhar_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">PAN Number:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.pan_number || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">DOB & Gender:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.dob || 'N/A'} | {selectedLoan.form_data?.gender || 'N/A'}</span>
                                            </div>
                                            {selectedLoan.form_data?.selfie_url && (
                                                <div className="mt-3">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Live selfie photo</p>
                                                    <a href={selectedLoan.form_data.selfie_url} target="_blank" rel="noreferrer" className="inline-block relative rounded-2xl overflow-hidden border border-slate-200">
                                                        <img src={selectedLoan.form_data.selfie_url} className="w-24 h-24 object-cover hover:scale-105 transition-all" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Employment details */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Employment / Professional details</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Profile Type:</span>
                                                <span className="font-black text-slate-900 uppercase">{selectedLoan.form_data?.emp_type || 'N/A'}</span>
                                            </div>
                                            {selectedLoan.form_data?.emp_type === 'Job Person' ? (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-semibold">Company & Title:</span>
                                                        <span className="font-bold text-slate-900">{selectedLoan.form_data?.company_name} | {selectedLoan.form_data?.designation}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-semibold">Monthly Salary:</span>
                                                        <span className="font-bold text-slate-900">₹ {selectedLoan.form_data?.monthly_salary}</span>
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        {selectedLoan.form_data?.salary_slip_url && (
                                                            <a href={selectedLoan.form_data.salary_slip_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                <FileText size={10} /> Salary Slip
                                                            </a>
                                                        )}
                                                        {selectedLoan.form_data?.bank_statement_6m_url && (
                                                            <a href={selectedLoan.form_data.bank_statement_6m_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                <FileText size={10} /> Bank Statement
                                                            </a>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-semibold">Business Name:</span>
                                                        <span className="font-bold text-slate-900">{selectedLoan.form_data?.business_name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-semibold">Nature & Turnover:</span>
                                                        <span className="font-bold text-slate-900">{selectedLoan.form_data?.nature_of_business} | ₹ {selectedLoan.form_data?.monthly_turnover}/pm</span>
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        {selectedLoan.form_data?.business_proof_url && (
                                                            <a href={selectedLoan.form_data.business_proof_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                <FileText size={10} /> MSME / Proof
                                                            </a>
                                                        )}
                                                        {selectedLoan.form_data?.shop_photos_url && (
                                                            <a href={selectedLoan.form_data.shop_photos_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                <Camera size={10} /> Shop Photo
                                                            </a>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Construction details */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Construction Property Details</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Owner Name:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.property_owner_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Plot Size & Address:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.plot_size || 'N/A'} - {selectedLoan.form_data?.property_address || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Estimated Cost:</span>
                                                <span className="font-bold text-slate-900">₹ {selectedLoan.form_data?.estimated_cost || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Expected Timeline:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.start_date} to {selectedLoan.form_data?.completion_date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Property Documents */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">4. Land Registry / Property Documents</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLoan.form_data?.registry_url && (
                                                <a href={selectedLoan.form_data.registry_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <FileText size={10} /> Registry Deed
                                                </a>
                                            )}
                                            {selectedLoan.form_data?.khata_khasra_url && (
                                                <a href={selectedLoan.form_data.khata_khasra_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <FileText size={10} /> Khata Mutation
                                                </a>
                                            )}
                                            {selectedLoan.form_data?.approved_map_url && (
                                                <a href={selectedLoan.form_data.approved_map_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <FileText size={10} /> Approved Map
                                                </a>
                                            )}
                                            {selectedLoan.form_data?.municipal_approval_url && (
                                                <a href={selectedLoan.form_data.municipal_approval_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <FileText size={10} /> MCD Permit
                                                </a>
                                            )}
                                            {selectedLoan.form_data?.electricity_bill_url && (
                                                <a href={selectedLoan.form_data.electricity_bill_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <FileText size={10} /> Electricity Bill
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* 5. Bank details & Guarantor */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">5 & 6. Disbursal Bank Details</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Account Holder Name:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.account_holder_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Bank Name & IFSC:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.bank_name} | {selectedLoan.form_data?.ifsc_code}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Account Number:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.account_number || 'N/A'}</span>
                                            </div>
                                            {selectedLoan.form_data?.cancelled_cheque_url && (
                                                <div className="mt-2">
                                                    <a href={selectedLoan.form_data.cancelled_cheque_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                                        <FileText size={10} /> Cancelled Cheque Copy
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 7 & 8. Site physical verification & Guarantor */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">7 & 8. Site GPS & Physical Verification</h4>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">GPS Geo Location Tag:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.geo_location || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Guarantor Name:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.guarantor_name || 'N/A'} ({selectedLoan.form_data?.guarantor_relationship || 'N/A'})</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 font-semibold">Neighbor Remarks:</span>
                                                <span className="font-bold text-slate-900">{selectedLoan.form_data?.neighbour_verification || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedLoan.form_data?.plot_front_photo_url && (
                                                    <a href={selectedLoan.form_data.plot_front_photo_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                        <Camera size={10} /> Plot Front Photo
                                                    </a>
                                                )}
                                                {selectedLoan.form_data?.applicant_site_photo_url && (
                                                    <a href={selectedLoan.form_data.applicant_site_photo_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                        <Camera size={10} /> Applicant on Site
                                                    </a>
                                                )}
                                                {selectedLoan.form_data?.site_video_url && (
                                                    <a href={selectedLoan.form_data.site_video_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                        <ExternalLink size={10} /> Site 360 Video
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* 9. Internal Risk Check Details block */}
                                <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50 space-y-3">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                                        <Shield size={14} className="text-blue-600" />
                                        9. Internal risk verification matching checklist
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
                                            <Check size={12} className="text-emerald-500" />
                                            Device ID Signature Match
                                        </div>
                                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
                                            <Check size={12} className="text-emerald-500" />
                                            IP Signature Verify
                                        </div>
                                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100">
                                            <Check size={12} className="text-emerald-500" />
                                            Area risk checklist verified
                                        </div>
                                    </div>
                                </div>

                                {/* Administrative Update Status Form */}
                                <div className="bg-slate-50 border border-slate-150 p-6 rounded-3xl space-y-4">
                                    <h4 className="text-sm font-black text-slate-900">Administrative Decision Portal</h4>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Remarks / Decision Notes</label>
                                        <textarea 
                                            rows={3}
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Write remarks or reasons for approval/rejection..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-slate-400 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => handleUpdateStatus('APPROVED')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            Approve Application
                                        </button>
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => handleUpdateStatus('REJECTED')}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            Reject Application
                                        </button>
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => handleUpdateStatus('RE_EDIT')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            Ask for Re-Edit
                                        </button>
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => handleUpdateStatus('CANCELLED')}
                                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            Cancel Application
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200">
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setEditJsonStr(JSON.stringify(selectedLoan.form_data || {}, null, 2));
                                                setIsEditingJson(true);
                                            }}
                                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            Edit Details JSON
                                        </button>
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => handleDeleteLoan(selectedLoan.id)}
                                            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 ml-auto"
                                        >
                                            <Trash2 size={14} /> Delete Application
                                        </button>
                                    </div>
                                </div>
                                
                                {isEditingJson && (
                                    <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
                                        <div className="bg-white rounded-3xl p-6 w-full max-w-2xl">
                                            <h3 className="text-xl font-black text-slate-900 mb-4">Edit Form Data (JSON)</h3>
                                            <textarea 
                                                className="w-full h-96 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none"
                                                value={editJsonStr}
                                                onChange={(e) => setEditJsonStr(e.target.value)}
                                            />
                                            <div className="flex gap-3 mt-4 justify-end">
                                                <button onClick={() => setIsEditingJson(false)} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl">Cancel</button>
                                                <button onClick={handleUpdateDetails} disabled={actionLoading} className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase rounded-xl">Save Changes</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}

                {/* Email History Modal */}
                <EmailHistoryModal
                    isOpen={isEmailHistoryOpen}
                    onClose={() => setIsEmailHistoryOpen(false)}
                />

                {/* App Notification History Modal */}
                <AppNotificationHistoryModal
                    isOpen={isNotificationHistoryOpen}
                    onClose={() => {
                        setIsNotificationHistoryOpen(false);
                        setNotificationTargetIds([]);
                    }}
                    recipientType="user"
                    selectedIds={notificationTargetIds}
                />

                {/* Send Email Modal */}
                {isEmailModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-2xl font-black text-slate-900">Send Email</h3>
                                <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <p className="text-slate-500 font-medium mb-6">
                                Sending email to <span className="text-slate-900 font-bold">{emailTargetIds.length} selected recipients</span>.
                            </p>

                            <form onSubmit={handleSendEmailSubmit}>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-base font-bold text-slate-900 focus:ring-2 focus:ring-teal-100 outline-none"
                                            placeholder="Enter email subject"
                                            value={emailSubject}
                                            onChange={e => setEmailSubject(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Message Content</label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-900 focus:ring-2 focus:ring-teal-100 outline-none font-medium"
                                            placeholder="Type your message here..."
                                            value={emailMessage}
                                            onChange={e => setEmailMessage(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEmailModalOpen(false)}
                                        className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSendingEmail}
                                        className="py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
                                    >
                                        {isSendingEmail ? 'Sending...' : 'Dispatch Email'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
