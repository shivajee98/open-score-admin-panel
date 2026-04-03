'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BadgeCheck, Clock, ChevronRight, Calculator, IndianRupee, Search, Filter, Trash2, XCircle, ChevronLeft, Eye, FileText, Download } from 'lucide-react';
import LoanDetailModal from '@/components/loans/LoanDetailModal';
import FormDetailsModal from '@/components/loans/FormDetailsModal';
import { useSearchParams } from 'next/navigation';

// Helper: Check if platform fee (EMI #0) has been paid for a loan
const isPlatformFeePaid = (loan: any): boolean => {
    if (!loan.repayments || !Array.isArray(loan.repayments)) return false;
    const emi0 = loan.repayments.find((r: any) => r.emi_number === 0);
    return emi0?.status === 'PAID';
};

// Helper: Check if platform fee (EMI #0) exists (pending or paid)
const hasPlatformFee = (loan: any): boolean => {
    if (!loan.repayments || !Array.isArray(loan.repayments)) return false;
    return loan.repayments.some((r: any) => r.emi_number === 0);
};

// Helper: Get the pending platform fee repayment object if it exists
const getPendingPlatformFee = (loan: any) => {
    if (!loan.repayments || !Array.isArray(loan.repayments)) return null;
    return loan.repayments.find((r: any) => r.emi_number === 0 && ['PENDING_VERIFICATION', 'AGENT_APPROVED', 'MANUAL_VERIFICATION'].includes(r.status));
};

export default function LoanApprovals() {
    const { counts } = useAdminNotifications();
    const searchParams = useSearchParams();
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requests');
    const [previewLoan, setPreviewLoan] = useState<any>(null);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [formDetailLoan, setFormDetailLoan] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Initial query param setup
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        const openLoanId = searchParams.get('openLoan');
        if (urlSearch) setSearch(urlSearch);
        if (openLoanId) setSelectedLoan(parseInt(openLoanId));
    }, [searchParams]);

    const loadLoans = async () => {
        setLoading(true);
        setSelectedLoanIds([]);
        try {
            const endpoint = activeTab === 'requests' ? '/admin/loans' : '/admin/loans/history';
            const query = new URLSearchParams({
                search: search,
                status: statusFilter,
                page: page.toString(),
                per_page: itemsPerPage.toString()
            });
            const response = await apiFetch(`${endpoint}?${query}`);
            if (response && response.data) {
                setLoans(Array.isArray(response.data) ? response.data : []);
                setTotalPages(response.last_page || 1);
            } else if (Array.isArray(response)) {
                setLoans(response);
                setTotalPages(1);
            } else {
                setLoans([]);
            }
        } catch (error) {
            console.error('Failed to load loans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(loadLoans, 300);
        return () => clearTimeout(timeout);
    }, [activeTab, search, statusFilter, page, itemsPerPage]);

    const handleAction = async (id: number, endpoint: string, successMsg: string, method = 'POST') => {
        if (!confirm('Are you sure you want to perform this action?')) return;

        setActionLoading(`${id}-${endpoint}`);
        try {
            // Normalize path
            const path = endpoint ? (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : '';
            const response = await apiFetch(`/admin/loans/${id}${path}`, { method });

            if (response && response.data && response.data.kyc_link) {
                prompt("KYC Link generated (Copy below):", response.data.kyc_link);
            } else if (response && response.kyc_link) {
                prompt("KYC Link generated (Copy below):", response.kyc_link);
            } else {
                alert(successMsg);
            }
            loadLoans();
        } catch (e) {
            alert('Action failed');
        } finally {
            setActionLoading(null);
            loadLoans();
        }
    };

    const handleApproveFee = async (e: React.MouseEvent, repaymentId: number) => {
        e.stopPropagation();
        if (!confirm('Confirm receipt of platform fee?')) return;
        setActionLoading(`approve-fee-${repaymentId}`);
        try {
            await apiFetch(`/admin/repayments/${repaymentId}/approve`, { method: 'POST' });
            alert('Fee approved!');
            loadLoans();
        } catch (e: any) {
            alert(e.message || 'Failed to approve fee');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSelection = (e: any, id: number) => {
        e.stopPropagation();
        setSelectedLoanIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllOnPage = () => {
        if (selectedLoanIds.length === loans.length && loans.length > 0) {
            setSelectedLoanIds([]);
        } else {
            setSelectedLoanIds(loans.map(l => l.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedLoanIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedLoanIds.length} selected loans and all their history? This is permanent.`)) return;

        setActionLoading('bulk-delete');
        try {
            const response = await apiFetch('/admin/loans/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids: selectedLoanIds })
            });
            alert(response.message || 'Bulk delete successful');
            setSelectedLoanIds([]);
            loadLoans();
        } catch (e) {
            console.error(e);
            alert('Bulk action failed');
        } finally {
            setActionLoading(null);
        }
    };
    const handleExportExcel = async () => {
        setExporting(true);
        try {
            // Dynamically import xlsx
            const XLSX = await import('xlsx');

            // Fetch ALL loans (not paginated) for export
            const endpoint = activeTab === 'requests' ? '/admin/loans' : '/admin/loans/history';
            const query = new URLSearchParams({
                search: search,
                status: statusFilter,
                page: '1',
                per_page: '999'
            });
            const response = await apiFetch(`${endpoint}?${query}`);
            let allLoans = response?.data || response || [];

            // 🟢 NEW: If there are selected IDs, filter the list to ONLY those.
            if (selectedLoanIds.length > 0) {
                allLoans = allLoans.filter((l: any) => selectedLoanIds.includes(l.id));
            }

            if (!allLoans.length) {
                alert('No data to export');
                setExporting(false);
                return;
            }

            const rows = allLoans.map((loan: any) => {
                const formData = loan.form_data || {};
                const user = loan.user || {};

                // Extract any available geo data
                let latitude = '';
                let longitude = '';
                const photoKeys = ['aadhar_front', 'aadhar_back', 'pan_front', 'applicant_selfie', 'selfie', 'prop_1', 'prop_2', 'prop_3'];
                for (const key of photoKeys) {
                    if (formData[key]?.geo?.lat && formData[key]?.geo?.lng) {
                        latitude = formData[key].geo.lat;
                        longitude = formData[key].geo.lng;
                        break;
                    }
                }

                return {
                    'Loan ID': loan.id,
                    'Display ID': loan.display_id || loan.id,
                    'Status': loan.status,
                    'Applicant Name': user.name || '',
                    'Mobile': user.mobile_number || '',
                    'Email': user.email || formData.email || '',
                    'Amount': loan.amount,
                    'Referral Code': loan.agent
                        ? `${loan.agent.name} (${loan.agent.referral_code})`
                        : loan.referrer
                            ? `${loan.referrer.name} (${loan.referrer.my_referral_code})`
                            : 'Direct',
                    'Tenure': loan.tenure,
                    'Payout Frequency': loan.payout_frequency,
                    'Application Date': loan.created_at ? new Date(loan.created_at).toLocaleDateString() : '',
                    'Approved Date': loan.approved_at ? new Date(loan.approved_at).toLocaleDateString() : '',
                    'Disbursed Date': loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString() : '',
                    'Paid Amount': loan.paid_amount || 0,
                    // GPS Data
                    'Latitude': latitude,
                    'Longitude': longitude,
                    'Google Maps Link': latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : '',
                    // KYC Form Fields
                    'First Name': formData.first_name || '',
                    'Last Name': formData.last_name || '',
                    'Date of Birth': formData.birth_day && formData.birth_month && formData.birth_year
                        ? `${formData.birth_day}/${formData.birth_month}/${formData.birth_year}` : '',
                    'Marital Status': formData.marital_status || '',
                    'Phone': formData.phone || '',
                    'Current Street Address': formData.street_address || user.street_address || '',
                    'Current City': formData.city || user.city || '',
                    'Current State': formData.state || user.state || '',
                    'Current PIN Code': formData.postal_code || user.pincode || '',
                    'Aadhaar Number': formData.aadhar_number || user.aadhar_number || '',
                    'PAN Number': formData.pan_number || user.pan_number || '',
                    'Is Permanent Same?': (formData.is_permanent_same === true || user.is_permanent_same === true) ? 'Yes' : 'No',
                    'Permanent Street Address': formData.permanent_street_address || user.permanent_street_address || '',
                    'Permanent City': formData.permanent_city || user.permanent_city || '',
                    'Permanent State': formData.permanent_state || user.permanent_state || '',
                    'Permanent PIN Code': formData.permanent_pincode || user.permanent_pincode || '',
                    'Employment Type': formData.employment_type || '',
                    'Business Type': formData.business_type || 'N/A',
                    'Business Location': formData.business_location || 'N/A',
                    'Company Name': formData.company_name || 'N/A',
                    'Job Role': formData.job_role || 'N/A',
                    'Company Location': formData.company_location || 'N/A',
                    'Employer': formData.employer || '',
                    'Occupation': formData.occupation || '',
                    'Experience (Years)': formData.experience_years || '',
                    'Gross Monthly Income': formData.gross_monthly_income || '',
                    'Annual Income': formData.annual_income || '',
                    'Rent/Mortgage': formData.rent_mortgage || '',
                    'Loan Usage': formData.loan_usage || '',
                    // Bank Details (from user model)
                    'Bank Name': user.bank_name || formData.bank_name || '',
                    'IFSC Code': user.ifsc_code || formData.ifsc_code || '',
                    'Account Holder': user.account_holder_name || formData.account_holder_name || '',
                    'Account Number': user.account_number || formData.account_number || '',
                    // KYC Photo URLs
                    'Aadhaar Front': getStorageUrl(formData.aadhar_front?.url || formData.aadhar_front || ''),
                    'Aadhaar Back': getStorageUrl(formData.aadhar_back?.url || formData.aadhar_back || ''),
                    'PAN Front': getStorageUrl(formData.pan_front?.url || formData.pan_front || ''),
                    'Applicant Selfie': getStorageUrl(formData.applicant_selfie?.url || formData.applicant_selfie || formData.selfie?.url || formData.selfie || ''),
                    'Selfie with Agent': getStorageUrl(formData.agent_selfie?.url || formData.agent_selfie || ''),
                    'Property Photo 1': getStorageUrl(formData.prop_1?.url || formData.prop_1 || ''),
                    'Property Photo 2': getStorageUrl(formData.prop_2?.url || formData.prop_2 || ''),
                    'Property Photo 3': getStorageUrl(formData.prop_3?.url || formData.prop_3 || ''),
                    'Location URL': formData.location_url || user.location_url || '',
                };
            });

            const ws = XLSX.utils.json_to_sheet(rows);

            // Auto-size columns
            const colWidths = Object.keys(rows[0]).map(key => ({
                wch: Math.max(key.length + 2, ...rows.map((r: any) => String(r[key] || '').length).slice(0, 20))
            }));
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, activeTab === 'requests' ? 'Pending Loans' : 'Loan History');

            const fileName = `openscore_${activeTab === 'requests' ? 'pending_loans' : 'loan_history'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to export Excel file');
        } finally {
            setExporting(false);
        }
    };

    return (
        <AdminLayout title="Loan Approvals">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    <button
                        onClick={() => { setActiveTab('requests'); setStatusFilter('ALL'); setPage(1); }}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'requests'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Pending Requests
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setStatusFilter('ALL'); setPage(1); }}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Loan History
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <select
                            className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-sm"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="ALL">All Status</option>
                            {activeTab === 'requests' ? (
                                <>
                                    <option value="PENDING">Pending (Intake)</option>
                                    <option value="APPLIED">Applied (Intake)</option>
                                    <option value="PROCEEDED">Proceeded (Vetting)</option>
                                    <option value="VETTING">Vetting (Vetting)</option>
                                    <option value="KYC_SENT">KYC Sent</option>
                                    <option value="FORM_SUBMITTED">Form Submitted</option>
                                    <option value="KYC_SUBMITTED">KYC Submitted</option>
                                    <option value="APPROVED">Approved</option>
                                </>
                            ) : (
                                <>
                                    <option value="DISBURSED">Disbursed</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                            className="bg-transparent border-none text-sm font-bold text-slate-600 outline-none cursor-pointer"
                        >
                            <option value={12}>12</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID, Name or Mobile..."
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    {/* Download Excel Button */}
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting || loans.length === 0}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        {exporting ? 'Exporting...' : selectedLoanIds.length > 0 ? `Download (${selectedLoanIds.length})` : 'Excel'}
                    </button>
                </div>
            </div>

            {/* Pipeline Card - Full width with 8px margin */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden -mx-[8px] md:-mx-[24px]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">
                            {activeTab === 'requests' ? 'Live Loan Pipeline' : 'Archived Loan Records'}
                        </h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {activeTab === 'requests'
                                ? 'Review applicant details, manage KYC and approve disbursals.'
                                : 'Comprehensive history of closed, cancelled or rejected requests.'}
                        </p>
                    </div>
                </div>

                {activeTab === 'history' && selectedLoanIds.length > 0 && (
                    <div className="mx-8 mb-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-red-900">{selectedLoanIds.length} Loans Selected</p>
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Caution: Deletion is permanent</p>
                            </div>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            disabled={actionLoading === 'bulk-delete'}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all font-mono"
                        >
                            {actionLoading === 'bulk-delete' ? 'Deleting...' : 'Delete Selected Records'}
                        </button>
                    </div>
                )}

                {loans.length === 0 && !loading ? (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <BadgeCheck className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">No applications found</h4>
                        <p className="text-slate-400 font-medium">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left order-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 pl-8 w-10">
                                        <input
                                            type="checkbox"
                                            checked={loans.length > 0 && selectedLoanIds.length === loans.length}
                                            onChange={toggleAllOnPage}
                                            className="w-4 h-4 text-blue-600 rounded"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Applicant & Loan ID</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan: any) => (
                                    <tr
                                        key={loan.id}
                                        className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                                        onClick={() => setSelectedLoan(loan.id)}
                                    >
                                        <td className="p-6 pl-8" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLoanIds.includes(loan.id)}
                                                onChange={(e) => toggleSelection(e, loan.id)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                        </td>
                                        <td className="p-6 pl-2">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        {loan.user?.name?.[0] || 'U'}
                                                    </div>
                                                    {(loan.status === 'APPLIED' || loan.status === 'KYC_SUBMITTED' || loan.status === 'FORM_SUBMITTED') && (
                                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)] border-2 border-white"></span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{loan.user?.name || 'Unknown User'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">#{loan.display_id || loan.id} • {loan.user?.mobile_number}</p>

                                                    {/* Referral Info */}
                                                    {loan.agent ? (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                                                                AGENT: {loan.agent.name}
                                                            </span>
                                                            <span className="text-[9px] font-mono font-bold text-slate-400">
                                                                {loan.agent.referral_code}
                                                            </span>
                                                        </div>
                                                    ) : loan.referrer ? (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
                                                                REF: {loan.referrer.name}
                                                            </span>
                                                            <span className="text-[9px] font-mono font-bold text-slate-400">
                                                                {loan.referrer.my_referral_code}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1">
                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-100">
                                                                DIRECT
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Approval Info */}
                                                    {loan.sub_user_approver ? (
                                                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                                            Approved by Agent: {loan.sub_user_approver.name}
                                                        </p>
                                                    ) : loan.approver ? (
                                                        <p className="text-[10px] font-bold text-blue-600 mt-0.5">
                                                            Approved by Support: {loan.approver.name}
                                                        </p>
                                                    ) : null}

                                                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border shadow-sm ${loan.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            loan.status === 'DISBURSED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                (loan.status === 'KYC_SENT' || loan.status === 'FORM_SUBMITTED' || loan.status === 'KYC_SUBMITTED') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    (loan.status === 'REJECTED' || loan.status === 'CANCELLED') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                        'bg-slate-50 text-slate-500 border-slate-100'
                                                            }`}>{loan.status}</span>
                                                        {/* Platform Fee Status Indicator */}
                                                        {loan.status === 'APPROVED' && hasPlatformFee(loan) && (
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide border shadow-sm ${isPlatformFeePaid(loan)
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-orange-50 text-orange-600 border-orange-100'
                                                                }`}>
                                                                {isPlatformFeePaid(loan) ? ' Fee Paid' : ' Fee Pending'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Quick KYC Access */}
                                                    {loan.form_data && Object.keys(loan.form_data).length > 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setFormDetailLoan(loan); }}
                                                            className="mt-1 text-[9px] font-bold text-purple-500 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
                                                        >
                                                            <FileText size={10} /> View KYC
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <IndianRupee size={16} className="text-slate-300" />
                                                <span className="font-black text-slate-900 text-xl tracking-tighter">
                                                    {parseFloat(loan.amount).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Application Date: {new Date(loan.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-600">
                                                    <Clock size={12} className="text-slate-400" />
                                                    {loan.tenure} {loan.tenure > 6 ? 'Days' : 'Months'} Tenure
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit border border-blue-100 shadow-sm">
                                                    <Calculator size={12} />
                                                    {loan.payout_frequency} Payout
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 pr-8 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {['PENDING', 'APPLIED'].includes(loan.status) && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'proceed', 'Loan Proceeded!'); }}
                                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all font-mono"
                                                    >
                                                        Proceed
                                                    </button>
                                                )}

                                                {['PROCEEDED', 'VETTING'].includes(loan.status) && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'send-kyc', 'KYC Link Sent!'); }}
                                                        className="px-5 py-2.5 bg-amber-400 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 shadow-xl shadow-amber-500/20 transition-all font-mono"
                                                    >
                                                        Send KYC
                                                    </button>
                                                )}

                                                {['FORM_SUBMITTED', 'KYC_SUBMITTED'].includes(loan.status) && (
                                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPreviewLoan(loan); }}
                                                            className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
                                                            title="Preview KYC"
                                                        >
                                                            <Search size={18} />
                                                        </button>
                                                        <button
                                                            disabled={!!actionLoading}
                                                            onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'approve', 'Loan Approved!'); }}
                                                            className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all font-mono"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                )}

                                                {loan.status === 'APPROVED' && (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        {getPendingPlatformFee(loan) && (
                                                            <button
                                                                disabled={!!actionLoading}
                                                                onClick={(e) => handleApproveFee(e, getPendingPlatformFee(loan).id)}
                                                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all font-mono"
                                                            >
                                                                {actionLoading === `approve-fee-${getPendingPlatformFee(loan).id}` ? '...' : 'Confirm Fee'}
                                                            </button>
                                                        )}
                                                        <button
                                                            disabled={!!actionLoading || (hasPlatformFee(loan) && !isPlatformFeePaid(loan))}
                                                            onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'release', 'Funds Released!'); }}
                                                            className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all font-mono ${hasPlatformFee(loan) && !isPlatformFeePaid(loan)
                                                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30'
                                                                }`}
                                                            title={hasPlatformFee(loan) && !isPlatformFeePaid(loan) ? 'Platform fee must be paid before disbursal' : 'Release funds to customer'}
                                                        >
                                                            Disburse
                                                        </button>
                                                        {hasPlatformFee(loan) && !isPlatformFeePaid(loan) && (
                                                            <span className="text-[9px] font-bold text-orange-500 max-w-[100px] leading-tight">
                                                                {getPendingPlatformFee(loan) ? 'Awaiting Approval' : 'Fee unpaid'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* View Form Details Button */}
                                                <button
                                                    onClick={() => setFormDetailLoan(loan)}
                                                    className="p-2.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                                                    title="View Form Details"
                                                >
                                                    <FileText size={18} />
                                                </button>

                                                {/* View Repayment Schedule Button */}
                                                <button
                                                    onClick={() => setSelectedLoan(loan.id)}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="View Repayment Schedule"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity ml-4 border-l pl-4 border-slate-100" onClick={(e) => e.stopPropagation()}>
                                                    {['DISBURSED'].includes(loan.status) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'close', 'Loan Closed Manually!', 'POST'); }}
                                                            className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                            title="Close Loan"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, '', 'Loan Deleted!', 'DELETE'); }}
                                                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal (legacy KYC preview) */}
            {
                previewLoan && (
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
                )
            }

            {/* Form Details Modal */}
            {
                formDetailLoan && (
                    <FormDetailsModal
                        loan={formDetailLoan}
                        onClose={() => setFormDetailLoan(null)}
                    />
                )
            }

            {/* Repayment Schedule Modal */}
            {
                selectedLoan && (
                    <LoanDetailModal
                        loanId={selectedLoan}
                        onClose={() => setSelectedLoan(null)}
                        onUpdate={() => {
                            loadLoans();
                        }}
                    />
                )
            }
        </AdminLayout >
    );
}
