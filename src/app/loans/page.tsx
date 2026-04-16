'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BadgeCheck, Clock, ChevronRight, Calculator, IndianRupee, Search, Filter, Trash2, XCircle, ChevronLeft, Eye, FileText, Download, MapPin, Briefcase, Landmark, Camera, User, Mail, Phone, Shield, ExternalLink, X, Info, RotateCcw, MessageSquare, Ban } from 'lucide-react';
import LoanDetailModal from '@/components/loans/LoanDetailModal';
import ActionConfirmationDialog, { ActionType } from '@/components/loans/ActionConfirmationDialog';
import KycVerificationSidebar from '@/components/loans/KycVerificationSidebar';
import MerchantPincodeAnalysis from './MerchantPincodeAnalysis';
import { Sparkles } from 'lucide-react';
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
    const [cancelLoanModal, setCancelLoanModal] = useState<{ isOpen: boolean; loanId: number | null }>({ isOpen: false, loanId: null });
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [reuploadFields, setReuploadFields] = useState<string[]>([]);
    const [reuploadRemarks, setReuploadRemarks] = useState('');
    const [showKycSidebar, setShowKycSidebar] = useState(false);
    const [showRiskSidebar, setShowRiskSidebar] = useState(false);
    const [showPincodeModal, setShowPincodeModal] = useState(false);
    const [dismissedClusters, setDismissedClusters] = useState<string[]>([]);

    // Confirmation Dialog State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        action: ActionType;
        loanId: number;
        customerName: string;
        amount: string;
        successMsg: string;
        endpoint?: string;
        method?: string;
        repaymentId?: number;
    }>({
        isOpen: false,
        action: 'PROCEED',
        loanId: 0,
        customerName: '',
        amount: '',
        successMsg: ''
    });


    // Group loans by location clashes
    const locationClusters = useMemo(() => {
        const clusters: Record<string, any[]> = {};
        
        loans.forEach(loan => {
            if (!loan.form_data) return;
            
            // Collect all unique coordinates for this loan
            const coords = new Set<string>();
            Object.values(loan.form_data).forEach((val: any) => {
                // Handle both older format (string geo) and newer format (object geo)
                if (val && typeof val === 'object' && val.geo) {
                    let lat = null, lng = null;
                    if (typeof val.geo === 'object') {
                        lat = val.geo.lat;
                        lng = val.geo.lng;
                    } else if (typeof val.geo === 'string' && val.geo.includes(',')) {
                        [lat, lng] = val.geo.split(',').map((s: string) => s.trim());
                    }

                    if (lat && lng) {
                        const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
                        coords.add(key);
                    }
                }
            });

            coords.forEach(coord => {
                if (!clusters[coord]) clusters[coord] = [];
                clusters[coord].push({
                    id: loan.id,
                    display_id: loan.display_id,
                    name: loan.user?.name || 'Unknown',
                    mobile: loan.user?.mobile_number,
                    status: loan.status
                });
            });
        });

        // Filter out clusters with only one loan or those marked as seen
        return Object.entries(clusters)
            .filter(([coord, memberLoans]) => {
                const uniqueIds = new Set(memberLoans.map(l => l.id));
                return uniqueIds.size > 1 && !dismissedClusters.includes(coord);
            })
            .map(([coord, memberLoans]) => ({
                coord,
                loans: Array.from(new Map(memberLoans.map(l => [l.id, l])).values()) // unique by ID
            }));
    }, [loans, dismissedClusters]);

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
                per_page: itemsPerPage.toString(),
                sort_by: 'updated_at',
                order: 'desc'
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
        const loan = loans.find(l => l.id === id);
        setConfirmModal({
            isOpen: true,
            action: endpoint.toUpperCase().replace('-', '_') as ActionType || (method === 'DELETE' ? 'DELETE' : 'PROCEED'),
            loanId: id,
            customerName: loan?.user?.name || 'Customer',
            amount: loan?.amount || '0',
            successMsg,
            endpoint,
            method
        });
    };

    const executeAction = async () => {
        const { loanId, endpoint, method, successMsg, action } = confirmModal;
        
        setActionLoading(`${loanId}-${endpoint}`);
        try {
            let response;
            if (action === 'REDO') {
                response = await apiFetch(`/admin/loans/${loanId}/redo`, { method: 'POST' });
            } else if (confirmModal.repaymentId) {
                 await apiFetch(`/admin/repayments/${confirmModal.repaymentId}/approve`, { method: 'POST' });
                 response = { message: 'Fee approved!' };
            } else {
                const path = endpoint ? (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : '';
                response = await apiFetch(`/admin/loans/${loanId}${path}`, { method });
            }

            if (response && (response.data?.kyc_link || response.kyc_link)) {
                const link = response.data?.kyc_link || response.kyc_link;
                // Use a better way than prompt? For now, we follow the old logic but in a safer way.
                window.prompt("KYC Link generated (Copy below):", link);
            } else {
                // We could use a custom toast here, but alert is what was there.
                // toast.success(successMsg); // if we had a toast system
                alert(response?.message || successMsg);
            }
            loadLoans();
        } catch (e: any) {
            alert(e.message || 'Action failed');
        } finally {
            setActionLoading(null);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleApproveFee = async (e: React.MouseEvent, loan: any, repaymentId: number) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            action: 'APPROVE',
            loanId: loan.id,
            customerName: loan.user?.name || 'Customer',
            amount: loan.amount,
            successMsg: 'Fee approved successfully!',
            repaymentId
        });
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
        if (!confirm('FINAL WARNING: This action cannot be reversed. Delete all selected records now?')) return;

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
                per_page: '999',
                sort_by: 'updated_at',
                order: 'desc'
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
                    'Desired Amount': formData.desired_amount || '',
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
                    'Current PIN Code': formData.postal_code || formData.pincode || user.pincode || '',
                    'Address Duration': formData.address_duration || '',
                    'Is Permanent Same?': (formData.is_permanent_same === true || user.is_permanent_same === true) ? 'Yes' : 'No',
                    'Permanent Street Address': formData.permanent_street_address || user.permanent_street_address || '',
                    'Permanent City': formData.permanent_city || user.permanent_city || '',
                    'Permanent State': formData.permanent_state || user.permanent_state || '',
                    'Permanent PIN Code': formData.permanent_postal_code || formData.permanent_pincode || user.permanent_pincode || '',
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
                    'Down Payment': formData.down_payment || '',
                    'Loan Usage': formData.loan_usage || '',
                    'Aadhaar Number': formData.aadhar_number || '',
                    'PAN Number': formData.pan_number || '',
                    'Comments': formData.comments || '',
                    'Bank References': formData.bank_references || '',
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
                    'Selfie with Agent': getStorageUrl(formData.agent_selfie?.url || formData.agent_selfie || formData.selfie_with_agent?.url || formData.selfie_with_agent || ''),
                    'Property Photo 1': getStorageUrl(formData.prop_1?.url || formData.prop_1 || ''),
                    'Property Photo 2': getStorageUrl(formData.prop_2?.url || formData.prop_2 || ''),
                    'Property Photo 3': getStorageUrl(formData.prop_3?.url || formData.prop_3 || ''),
                    'Address Photo': getStorageUrl(formData.address_photo?.url || formData.address_photo || ''),
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
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0">

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

                    <button
                        onClick={() => setShowKycSidebar(!showKycSidebar)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                            showKycSidebar 
                                ? 'bg-blue-600 text-white shadow-blue-500/20' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 shadow-slate-200/50'
                        }`}
                    >
                        <Shield size={16} className={showKycSidebar ? 'text-white' : 'text-blue-500'} />
                        <span className="hidden sm:inline">{showKycSidebar ? 'Close Identity' : 'Identity Center'}</span>
                    </button>

                    <button
                        onClick={() => setShowPincodeModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-lg shadow-indigo-100/50 group/pin"
                    >
                        <MapPin size={16} className="text-indigo-500 group-hover/pin:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Pin Analysis</span>
                    </button>

                    <button
                        onClick={() => setShowRiskSidebar(!showRiskSidebar)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg relative ${
                            showRiskSidebar 
                                ? 'bg-orange-600 text-white shadow-orange-500/20' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-200 shadow-slate-200/50'
                        }`}
                    >
                        <Shield size={16} className={showRiskSidebar ? 'text-white' : 'text-orange-500'} />
                        <span className="hidden sm:inline">{showRiskSidebar ? 'Close Risk' : 'Risk Alerts'}</span>
                        {locationClusters.length > 0 && !showRiskSidebar && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg border-2 border-white animate-bounce">
                                {locationClusters.length}
                            </span>
                        )}
                    </button>

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
                            {activeTab === 'requests' ? 'Live Loan Pipeline' : 'Historical Loan Records'}
                        </h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {activeTab === 'requests'
                                ? 'Review applicant details, manage KYC and approve disbursals.'
                                : 'Audit logs and records of closed, cancelled or previously rejected requests.'}
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
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">#{loan.display_id || loan.id} • {loan.user?.mobile_number}</p>
                                                        {loan.user?.kyc_status === 'FIELD_VERIFIED' ? (
                                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 border border-cyan-200">FIELD KYC VERIFIED</span>
                                                        ) : loan.user?.kyc_status === 'FULL_VERIFIED' ? (
                                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">FULL KYC VERIFIED</span>
                                                        ) : (
                                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">KYC PENDING</span>
                                                        )}
                                                    </div>

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
                                                            onClick={(e) => { e.stopPropagation(); setSelectedLoan(loan.id); }}
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
                                                                onClick={(e) => handleApproveFee(e, loan, getPendingPlatformFee(loan).id)}
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

                                                {/* Redo Button */}
                                                {['DISBURSED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(loan.status) === false && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'redo', 'Step redone successfully!'); }}
                                                        className="p-2.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                        title="Redo Step / Revert to Previous State"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}

                                                {/* View Full Details Button (Combined View) */}
                                                <button
                                                    onClick={() => setSelectedLoan(loan.id)}
                                                    className="p-2.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="View Full Details"
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
                                                        onClick={(e) => { e.stopPropagation(); setCancelLoanModal({ isOpen: true, loanId: loan.id }); }}
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Cancel Loan"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
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
                </div>

                {/* Verification & Risk Sidebars */}
                {(showKycSidebar || (locationClusters.length > 0 && showRiskSidebar)) && (
                    <div className="w-full lg:w-96 shrink-0 space-y-8 animate-in slide-in-from-right duration-300">
                        {showKycSidebar && (
                            <KycVerificationSidebar onClose={() => setShowKycSidebar(false)} />
                        )}

                        {/* Risk Sidebar (Location Clashes) */}
                        {locationClusters.length > 0 && showRiskSidebar && (
                            <aside className="w-full space-y-6">
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 sticky top-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-[1.25rem] bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">
                                                <Shield size={24} className="stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Risk Alerts</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location Similarity</p>
                                                    {locationClusters.length > 0 && (
                                                        <button 
                                                            onClick={() => setDismissedClusters(locationClusters.map(c => c.coord))}
                                                            className="text-[8px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-colors"
                                                        >
                                                            Dismiss All
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowRiskSidebar(false)}
                                            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all font-black"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {locationClusters.map((cluster, i) => (
                                            <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-orange-200 transition-colors group/box">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                            <MapPin size={12} className="text-orange-500" />
                                                        </div>
                                                        <span className="text-[10px] font-black font-mono text-slate-500 tracking-tighter">{cluster.coord}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 bg-white text-orange-600 text-[9px] font-black rounded-lg shadow-sm">
                                                            {cluster.loans.length}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDismissedClusters(prev => [...prev, cluster.coord]);
                                                            }}
                                                            className="p-1 hover:bg-white rounded-lg text-slate-300 hover:text-slate-600 transition-all"
                                                            title="Mark as Seen"
                                                        >
                                                            <BadgeCheck size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {cluster.loans.map(l => (
                                                        <button 
                                                            key={l.id} 
                                                            onClick={() => setSelectedLoan(l.id)}
                                                            className="w-full text-left flex items-center justify-between group/item p-2 -m-2 hover:bg-white rounded-xl transition-all"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-black text-slate-800 truncate group-hover/item:text-blue-600">
                                                                    #{l.display_id || l.id} {l.name}
                                                                </p>
                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{l.status}</p>
                                                            </div>
                                                            <ChevronRight size={14} className="text-slate-300 group-hover/item:text-blue-500 transition-transform group-hover/item:translate-x-1" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Info size={14} />
                                            <p className="text-[9px] font-bold leading-relaxed">
                                                Multiple applications from the same location may indicate organized fraud or related accounts.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        )}                    </div>
                )}
            </div> {/* End main flex container */}


            {/* Preview Modal (legacy KYC preview) */}
            {previewLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-slate-50 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto relative">
                        {/* Header */}
                        <div className="bg-white p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10 shadow-sm">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-black text-slate-900">KYC Verification Details</h2>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                        LOAN #{previewLoan.display_id || previewLoan.id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                    <Clock size={16} className="text-blue-500" />
                                    <span>Submitted on {new Date(previewLoan.kyc_submitted_at || previewLoan.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setPreviewLoan(null); setReuploadFields([]); }} 
                                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-red-500 hover:rotate-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 space-y-8">
                            {previewLoan.form_data ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Side: Personal & Employment */}
                                        <div className="space-y-8">
                                            {/* Personal Info */}
                                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                                        <User size={18} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Personal & Contact</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                                    <div className="col-span-2 flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                                                            <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.first_name} {previewLoan.form_data.last_name}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const key = 'full_name';
                                                                setReuploadFields(prev => 
                                                                    prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                                );
                                                            }}
                                                            className={`p-1 rounded-lg transition-all border ${
                                                                reuploadFields.includes('full_name') 
                                                                ? "bg-rose-500 text-white border-rose-500" 
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={10} fill={reuploadFields.includes('full_name') ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile</p>
                                                        <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.phone || previewLoan.user?.mobile_number}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                                        <p className="text-sm font-bold text-slate-900 truncate" title={previewLoan.form_data.email}>{previewLoan.form_data.email || 'N/A'}</p>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">DOB</p>
                                                            <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.date_of_birth || previewLoan.form_data.birth_date || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const key = 'date_of_birth';
                                                                setReuploadFields(prev => 
                                                                    prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                                );
                                                            }}
                                                            className={`p-1 rounded-lg transition-all border ${
                                                                reuploadFields.includes('date_of_birth') 
                                                                ? "bg-rose-500 text-white border-rose-500" 
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={10} fill={reuploadFields.includes('date_of_birth') ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Usage</p>
                                                        <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.loan_usage || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Employment Info */}
                                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                                        <Briefcase size={18} />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Job & Identity</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN Number</p>
                                                            <p className="text-sm font-black text-slate-900 font-mono">{previewLoan.form_data.pan_number || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const key = 'pan_number';
                                                                setReuploadFields(prev => 
                                                                    prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                                );
                                                            }}
                                                            className={`p-1 rounded-lg transition-all border ${
                                                                reuploadFields.includes('pan_number') 
                                                                ? "bg-rose-500 text-white border-rose-500" 
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={10} fill={reuploadFields.includes('pan_number') ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aadhar Number</p>
                                                            <p className="text-sm font-black text-slate-900 font-mono">{previewLoan.form_data.aadhar_number || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const key = 'aadhar_number';
                                                                setReuploadFields(prev => 
                                                                    prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                                );
                                                            }}
                                                            className={`p-1 rounded-lg transition-all border ${
                                                                reuploadFields.includes('aadhar_number') 
                                                                ? "bg-rose-500 text-white border-rose-500" 
                                                                : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                            }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={10} fill={reuploadFields.includes('aadhar_number') ? "currentColor" : "none"} />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Employment</p>
                                                        <p className="text-sm font-bold text-slate-900 uppercase">{previewLoan.form_data.employment_type || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Income</p>
                                                        <p className="text-sm font-bold text-emerald-600">₹{parseFloat(previewLoan.form_data.annual_income || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Company/Employer</p>
                                                        <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.company_name || previewLoan.form_data.employer || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Address & Bank & Pricing */}
                                        <div className="space-y-8">
                                            {/* Address Details (Single Div) */}
                                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                                <div className="flex items-center justify-between gap-2 mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                            <MapPin size={18} />
                                                        </div>
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
                                                        className={`p-1.5 rounded-lg transition-all border ${
                                                            reuploadFields.includes('address_details') 
                                                            ? "bg-rose-500 text-white border-rose-500" 
                                                            : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                        }`}
                                                        title="Mark Address for Re-upload"
                                                    >
                                                        <Shield size={12} fill={reuploadFields.includes('address_details') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Current Address</p>
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                            {[previewLoan.form_data.street_address, previewLoan.form_data.city, previewLoan.form_data.state, previewLoan.form_data.postal_code || previewLoan.form_data.pincode].filter(Boolean).join(', ')}
                                                        </p>
                                                        {previewLoan.form_data.location_url && (
                                                            <a href={previewLoan.form_data.location_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors">
                                                                <ExternalLink size={10} /> View on Map
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Permanent Address</p>
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                                            {previewLoan.form_data.is_permanent_same === true || previewLoan.form_data.is_address_same === true
                                                                ? "Same as Current Address"
                                                                : [previewLoan.form_data.permanent_street_address, previewLoan.form_data.permanent_city, previewLoan.form_data.permanent_state, previewLoan.form_data.permanent_postal_code || previewLoan.form_data.permanent_pincode].filter(Boolean).join(', ')
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bank Info */}
                                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                                <div className="flex items-center justify-between gap-2 mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                                            <Landmark size={18} />
                                                        </div>
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Bank Details</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const key = 'bank_details';
                                                            setReuploadFields(prev => 
                                                                prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                            );
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-all border ${
                                                            reuploadFields.includes('bank_details') 
                                                            ? "bg-rose-500 text-white border-rose-500" 
                                                            : "text-rose-300 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                        }`}
                                                        title="Mark Bank for Re-upload"
                                                    >
                                                        <Shield size={12} fill={reuploadFields.includes('bank_details') ? "currentColor" : "none"} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bank Name</p>
                                                        <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.bank_name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">IFSC Code</p>
                                                        <p className="text-sm font-black text-slate-900 font-mono uppercase">{previewLoan.form_data.ifsc_code || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                                                        <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{previewLoan.form_data.account_number || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing & Fees Table */}
                                    {previewLoan.calculations?.fee_structure && (
                                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <div className="px-6 py-4 bg-emerald-50/50 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calculator className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pricing & Fee Structure</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Santioned Amount</p>
                                                        <p className="text-sm font-black text-emerald-900">₹{parseFloat(previewLoan.calculations.principal).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net Disbursal</p>
                                                        <p className="text-sm font-black text-blue-600">₹{parseFloat(previewLoan.calculations.disbursal_amount).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-0 overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fee Component</th>
                                                            <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {previewLoan.calculations.fee_structure.map((fee: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-3 text-xs font-bold text-slate-900">{fee.name}</td>
                                                                <td className="px-6 py-3 text-xs font-black text-slate-900 text-right">₹{fee.amount.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-slate-50/30">
                                                            <td className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Total Deductions</td>
                                                            <td className="px-6 py-3 text-sm font-black text-rose-500 text-right">₹{previewLoan.calculations.total_deductions.toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* KYC Images Grid */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <Camera size={18} />
                                            </div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">KYC Documents & Photos</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {['aadhar_front', 'aadhar_back', 'pan_front', 'applicant_selfie', 'selfie', 'agent_selfie', 'selfie_with_agent', 'prop_1', 'prop_2', 'prop_3'].map(key => {
                                                const value = previewLoan.form_data[key];
                                                if (!value || (typeof value === 'object' && !value.url)) return null;
                                                const imgUrl = typeof value === 'string' ? value : value.url;
                                                const isSelected = reuploadFields.includes(key);

                                                return (
                                                    <div key={key} className="space-y-2">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                                                                {key === 'selfie' || key === 'agent_selfie' || key === 'selfie_with_agent' 
                                                                    ? 'Selfie with Agent' 
                                                                    : key === 'applicant_selfie' 
                                                                        ? 'Applicant Selfie' 
                                                                        : key.replace(/_/g, ' ')}
                                                            </p>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReuploadFields(prev => 
                                                                        prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
                                                                    );
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-all border ${
                                                                    isSelected 
                                                                    ? "bg-rose-500 text-white border-rose-500" 
                                                                    : "text-rose-400 border-slate-100 hover:text-rose-500 hover:bg-rose-50"
                                                                }`}
                                                                title="Mark for Re-upload"
                                                            >
                                                                <Shield size={12} fill={isSelected ? "currentColor" : "none"} />
                                                            </button>
                                                        </div>
                                                        <div className={`relative group aspect-square rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-rose-500 shadow-lg shadow-rose-500/20' : 'border-slate-100'}`}>
                                                            <img src={imgUrl} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all">
                                                                    <Eye size={20} />
                                                                </a>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-lg">
                                                                    <BadgeCheck size={12} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {typeof value === 'object' && value.geo && (
                                                            <div className="flex flex-col gap-1 mt-1">
                                                                <div className="flex flex-col text-[8px] font-bold text-slate-400 italic leading-tight">
                                                                    <span>LAT: {typeof value.geo.lat === 'number' ? value.geo.lat.toFixed(4) : (value.geo.lat || 'N/A')}</span>
                                                                    <span>LNG: {typeof value.geo.lng === 'number' ? value.geo.lng.toFixed(4) : (value.geo.lng || 'N/A')}</span>
                                                                </div>
                                                                {(value.geo.lat && value.geo.lng) && (
                                                                    <a 
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${value.geo.lat},${value.geo.lng}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-[8px] font-black text-blue-500 hover:text-blue-700 transition-colors uppercase"
                                                                    >
                                                                        <ExternalLink size={10} /> View on Maps
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bulk Re-upload Action */}
                                    {reuploadFields.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
                                            <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                                        <MessageSquare size={16} />
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
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(`Ask user to re-upload ${reuploadFields.length} field(s)?`)) return;
                                                        try {
                                                            await apiFetch(`/admin/loans/${previewLoan.id}/request-reupload`, {
                                                                method: 'POST',
                                                                body: JSON.stringify({ 
                                                                    fields: reuploadFields,
                                                                    remarks: reuploadRemarks 
                                                                })
                                                            });
                                                            alert('Re-upload request sent!');
                                                            setPreviewLoan(null);
                                                            setReuploadFields([]);
                                                            setReuploadRemarks('');
                                                            loadLoans();
                                                        } catch (err) {
                                                            alert('Failed to send request');
                                                        }
                                                    }}
                                                    className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-500/30 transition-all flex items-center gap-3 active:scale-95"
                                                >
                                                    <Shield size={16} />
                                                    Request Re-upload ({reuploadFields.length} Items)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <FileText className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 mb-1">No data submitted</h4>
                                    <p className="text-slate-400 font-medium">Applicant has not completed the form yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}




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
            {showPincodeModal && (
                <MerchantPincodeAnalysis onClose={() => setShowPincodeModal(false)} />
            )}
            {/* Cancel Loan Modal */}
            {cancelLoanModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900">Cancel Loan Request</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Please provide a reason for cancelling this loan. This will be visible to the customer.</p>
                        </div>
                        <div className="p-8">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cancellation Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-rose-100 focus:border-rose-300 outline-none transition-all resize-none"
                                placeholder="Enter reason for cancellation (e.g. Document mismatch, User request, Policy violation...)"
                            />
                        </div>
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                            <button
                                onClick={() => { setCancelLoanModal({ isOpen: false, loanId: null }); setRemarks(''); }}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Close
                            </button>
                            <button
                                disabled={!remarks.trim() || actionLoading === 'cancelling'}
                                onClick={async () => {
                                    if (!cancelLoanModal.loanId) return;
                                    setActionLoading('cancelling');
                                    try {
                                        await apiFetch(`/admin/loans/${cancelLoanModal.loanId}/cancel`, {
                                            method: 'POST',
                                            body: JSON.stringify({ remarks })
                                        });
                                        setCancelLoanModal({ isOpen: false, loanId: null });
                                        setRemarks('');
                                        loadLoans();
                                    } catch (e: any) {
                                        alert(e.message || 'Failed to cancel loan');
                                    } finally {
                                        setActionLoading(null);
                                    }
                                }}
                                className="flex-none px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-500/20 transition-all disabled:opacity-50"
                            >
                                {actionLoading === 'cancelling' ? 'Processing...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ActionConfirmationDialog 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeAction}
                action={confirmModal.action}
                loanId={confirmModal.loanId}
                customerName={confirmModal.customerName}
                amount={confirmModal.amount}
            />
        </AdminLayout >
    );
}
