'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BadgeCheck, Clock, ChevronRight, Calculator, IndianRupee, Search, Filter, Trash2, XCircle, ChevronLeft, Eye, FileText, Download, MapPin, Briefcase, Landmark, Camera, User, Mail, Phone, Shield, ExternalLink, X, Info, RotateCcw, MessageSquare, Ban, Zap, AlertTriangle, Check, RefreshCw, CheckCircle2, Sliders, Calendar, Star, ShieldCheck, Percent } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import LoanDetailModal from '@/components/loans/LoanDetailModal';
import ActionConfirmationDialog, { ActionType } from '@/components/loans/ActionConfirmationDialog';
import KycVerificationSidebar from '@/components/loans/KycVerificationSidebar';
import MerchantPincodeAnalysis from './MerchantPincodeAnalysis';
import { Sparkles } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

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
    const router = useRouter();
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
    const [stageStats, setStageStats] = useState<{
        approve_stage: number;
        pay_fee_stage: number;
        ready_to_disburse: number;
        risk_stage: number;
        total_pending: number;
        available_funds: number;
        treasury_warning: boolean;
        amount_needed: number;
    } | null>(null);

    const fetchStageStats = async () => {
        try {
            const data = await apiFetch('/admin/loans/stage-counts');
            if (data && !data.error) {
                setStageStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stage stats', error);
        }
    };

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [referralSearch, setReferralSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [reuploadFields, setReuploadFields] = useState<string[]>([]);
    const [reuploadRemarks, setReuploadRemarks] = useState<Record<string, string>>({});
    const [generalRemarks, setGeneralRemarks] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [kycDateFrom, setKycDateFrom] = useState('');
    const [kycDateTo, setKycDateTo] = useState('');
    const [emiDateFrom, setEmiDateFrom] = useState('');
    const [emiDateTo, setEmiDateTo] = useState('');
    const [emiCount, setEmiCount] = useState('');
    const [overdueFilter, setOverdueFilter] = useState('ALL');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const toggleReuploadField = (field: string) => {
        setReuploadFields(prev => {
            if (prev.includes(field)) {
                const newRemarks = { ...reuploadRemarks };
                delete newRemarks[field];
                setReuploadRemarks(newRemarks);
                return prev.filter(f => f !== field);
            }
            return [...prev, field];
        });
    };

    const updateFieldRemark = (field: string, remark: string) => {
        setReuploadRemarks(prev => ({
            ...prev,
            [field]: remark
        }));
    };

    const openLoanPreview = (loan: any) => {
        setPreviewLoan(loan);
        setReuploadFields(Array.isArray(loan.reupload_fields) ? loan.reupload_fields : []);
        setReuploadRemarks(loan.reupload_remarks || {});
    };
    const [showKycSidebar, setShowKycSidebar] = useState(false);
    const [showRiskSidebar, setShowRiskSidebar] = useState(false);
    const [showPincodeModal, setShowPincodeModal] = useState(false);
    const [dismissedClusters, setDismissedClusters] = useState<string[]>([]);

    // Auto Pilot State
    const [autoPilotSettings, setAutoPilotSettings] = useState<{
        enabled: boolean;
        delays: { proceed: number; send_kyc: number; approve: number };
    }>({
        enabled: false,
        delays: { proceed: 0, send_kyc: 3, approve: 15 }
    });
    const [showAutoPilotModal, setShowAutoPilotModal] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const CountdownTimer = ({ loan, delayMinutes, label }: { loan: any, delayMinutes: number, label: string }) => {
        if (!autoPilotSettings.enabled || delayMinutes <= 0) return null;

        // Suspend timer if there are pending re-uploads
        if (loan.reupload_fields && loan.reupload_fields.length > 0) {
            return null;
        }

        const startTime = new Date(loan.updated_at).getTime();
        const endTime = startTime + (delayMinutes * 60 * 1000);
        const remaining = Math.max(0, endTime - currentTime);

        if (remaining === 0) return (
            <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 animate-pulse bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <Zap size={10} />
                AUTO-EXECUTING...
            </div>
        );

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const progress = Math.min(100, (1 - (remaining / (delayMinutes * 60 * 1000))) * 100);

        return (
            <div className="flex flex-col gap-1 min-w-[80px]">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                    <span className="text-[9px] font-mono font-bold text-slate-600">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div
                        className="h-full bg-amber-400 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    };

    // Confirmation Dialog State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        action: ActionType;
        loanId: number;
        customerName: string;
        amount: string;
        successMsg: string;
        endpoint: string;
        method: string;
        isRisk?: boolean;
        repaymentId?: number;
    }>({
        isOpen: false,
        action: 'PROCEED',
        loanId: 0,
        customerName: '',
        amount: '',
        successMsg: '',
        endpoint: '',
        method: ''
    });


    // Group loans by location clashes
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPreviewLoan(null);
                setSelectedLoan(null);
                setShowPincodeModal(false);
                setShowAutoPilotModal(false);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setCancelLoanModal({ isOpen: false, loanId: null });
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

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
        loadAutoPilotSettings();
    }, [searchParams]);

    const loadAutoPilotSettings = async () => {
        try {
            const data = await apiFetch('/admin/loans/autopilot-settings');
            if (data) setAutoPilotSettings(data);
        } catch (error) {
            console.error('Failed to load auto pilot settings', error);
        }
    };

    const saveAutoPilotSettings = async (newSettings: any) => {
        setSavingSettings(true);
        try {
            await apiFetch('/admin/loans/autopilot-settings', {
                method: 'POST',
                body: JSON.stringify(newSettings)
            });
            setAutoPilotSettings(newSettings);
            setShowAutoPilotModal(false);
        } catch (error) {
            console.error('Failed to save auto pilot settings', error);
            alert('Failed to update settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleReverifyKyc = async (loanId: number) => {
        if (!confirm('This will clear all pending re-upload flags and remarks. Proceed?')) return;

        setActionLoading(`reverify-${loanId}`);
        try {
            await apiFetch(`/admin/loans/${loanId}/reverify-kyc`, {
                method: 'POST'
            });
            toast.success('KYC re-verified successfully!');
            if (previewLoan && previewLoan.id === loanId) {
                const updatedLoan = await apiFetch(`/admin/loans/${loanId}/details`);
                if (updatedLoan) openLoanPreview(updatedLoan);
            }
            loadLoans();
        } catch (e: any) {
            toast.error(e.message || 'Failed to re-verify KYC');
        } finally {
            setActionLoading(null);
        }
    };

    const loadLoans = async () => {
        setLoading(true);
        setSelectedLoanIds([]);
        try {
            const endpoint = activeTab === 'requests' ? '/admin/loans' : '/admin/loans/history';
            const query = new URLSearchParams({
                search: search,
                referral_search: referralSearch,
                status: statusFilter,
                page: page.toString(),
                per_page: itemsPerPage.toString(),
                sort_by: 'updated_at',
                order: 'desc',
                ...(dateFrom && { date_from: dateFrom }),
                ...(dateTo && { date_to: dateTo }),
                ...(kycDateFrom && { kyc_date_from: kycDateFrom }),
                ...(kycDateTo && { kyc_date_to: kycDateTo }),
                ...(emiDateFrom && { emi_date_from: emiDateFrom }),
                ...(emiDateTo && { emi_date_to: emiDateTo }),
                ...(emiCount && { emi_count: emiCount }),
                ...(overdueFilter !== 'ALL' && { overdue: overdueFilter }),
                ...(minAmount && { min_amount: minAmount }),
                ...(maxAmount && { max_amount: maxAmount }),
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
            fetchStageStats();
        } catch (error) {
            console.error('Failed to load loans', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(loadLoans, 300);
        return () => clearTimeout(timeout);
    }, [activeTab, search, referralSearch, statusFilter, page, itemsPerPage, dateFrom, dateTo, kycDateFrom, kycDateTo, emiDateFrom, emiDateTo, emiCount, overdueFilter]);

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
            method,
            isRisk: !!loan?.is_auto_pilot_risk
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
        const pendingFee = getPendingPlatformFee(loan);
        setConfirmModal({
            isOpen: true,
            action: 'APPROVE_FEE',
            loanId: loan.id,
            customerName: loan.user?.name || 'Customer',
            amount: pendingFee ? pendingFee.amount : loan.amount,
            successMsg: 'Fee approved successfully!',
            endpoint: '',
            method: '',
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
                    'Marital Status': formData.marital_status || user.marital_status || '',
                    'Father\'s Name': formData.father_name || user.family_detail?.father_name || '',
                    'Mother\'s Name': formData.mother_name || user.family_detail?.mother_name || '',
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
                    'Aadhaar Front': getStorageUrl(formData.aadhar_front?.url || formData.aadhar_front || '') || '',
                    'Aadhaar Back': getStorageUrl(formData.aadhar_back?.url || formData.aadhar_back || '') || '',
                    'PAN Front': getStorageUrl(formData.pan_front?.url || formData.pan_front || '') || '',
                    'Applicant Selfie': getStorageUrl(formData.applicant_selfie?.url || formData.applicant_selfie || formData.selfie?.url || formData.selfie || '') || '',
                    'Selfie with Agent': getStorageUrl(formData.agent_selfie?.url || formData.agent_selfie || formData.selfie_with_agent?.url || formData.selfie_with_agent || '') || '',
                    'Property Photo 1': getStorageUrl(formData.prop_1?.url || formData.prop_1 || '') || '',
                    'Property Photo 2': getStorageUrl(formData.prop_2?.url || formData.prop_2 || '') || '',
                    'Property Photo 3': getStorageUrl(formData.prop_3?.url || formData.prop_3 || '') || '',
                    'Address Photo': getStorageUrl(formData.address_photo?.url || formData.address_photo || '') || '',
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
            XLSX.utils.book_append_sheet(wb, ws, activeTab === 'requests' ? 'Pending Loans' : activeTab === 'cancelled' ? 'Cancelled Loans' : 'Loan History');

            const fileName = `openscore_${activeTab === 'requests' ? 'pending_loans' : activeTab === 'cancelled' ? 'cancelled_loans' : 'loan_history'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

                    {/* Treasury Warning Banner */}
                    {stageStats?.treasury_warning && (
                        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 shadow-md animate-pulse">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 mt-0.5 sm:mt-0">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Low Treasury Balance Warning</h3>
                                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                            The available treasury balance (<strong className="text-rose-600">₹{stageStats.available_funds.toLocaleString('en-IN')}</strong>) is insufficient to support all approved loans currently awaiting disbursal (Requires <strong className="text-slate-800">₹{stageStats.amount_needed.toLocaleString('en-IN')}</strong>). Please add capital to the treasury to resume disbursements.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/users')}
                                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/15 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <Landmark size={13} />
                                    Add Capital
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loan Metric Summary Grid */}
                    {stageStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {/* Card 1: Risk Stage */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Review Queue</span>
                                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{stageStats.risk_stage}</h3>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                    <span>Requires manual intervention</span>
                                </div>
                            </div>

                            {/* Card 2: Approve Stage */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Approvals</span>
                                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{stageStats.approve_stage}</h3>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span>Intake & Vetting</span>
                                </div>
                            </div>

                            {/* Card 3: Pay Fee Stage */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Platform Fee</span>
                                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{stageStats.pay_fee_stage}</h3>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                        <Percent className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span>Fee pending verification</span>
                                </div>
                            </div>

                            {/* Card 4: Ready to Disburse */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to Disburse</span>
                                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{stageStats.ready_to_disburse}</h3>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                        <BadgeCheck className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Funds checks cleared</span>
                                </div>
                            </div>
                        </div>
                    )}

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
                            <button
                                onClick={() => { setActiveTab('cancelled'); setStatusFilter('CANCELLED'); setPage(1); }}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'cancelled'
                                    ? 'bg-white text-rose-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                Cancelled
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
                                    ) : activeTab === 'cancelled' ? (
                                        <option value="CANCELLED">Cancelled Loans Only</option>
                                    ) : (
                                        <>
                                            <option value="DISBURSED">Disbursed</option>
                                            <option value="CLOSED">Closed</option>
                                            <option value="REJECTED">Rejected</option>
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
                                    <option value={200}>200</option>
                                    <option value={300}>300</option>
                                    <option value={400}>400</option>
                                    <option value={500}>500</option>
                                    <option value={1000}>1000</option>
                                    <option value={2000}>2000</option>
                                    <option value={5000}>5000</option>
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
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${showAdvancedFilters
                                        ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 shadow-slate-200/50'
                                    }`}
                            >
                                <Sliders size={16} className={showAdvancedFilters ? 'text-white' : 'text-indigo-500'} />
                                <span className="hidden sm:inline">Advanced Filters</span>
                            </button>

                            <button
                                onClick={() => setShowKycSidebar(!showKycSidebar)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${showKycSidebar
                                        ? 'bg-blue-600 text-white shadow-blue-500/20'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 shadow-slate-200/50'
                                    }`}
                            >
                                <Shield size={16} className={showKycSidebar ? 'text-white' : 'text-blue-500'} />
                                <span className="hidden sm:inline">{showKycSidebar ? 'Close Identity' : 'Identity Center'}</span>
                            </button>

                            <button
                                onClick={() => setShowAutoPilotModal(true)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${autoPilotSettings.enabled
                                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-200 shadow-slate-200/50'
                                    }`}
                            >
                                <Zap size={16} className={autoPilotSettings.enabled ? 'text-white animate-pulse' : 'text-amber-500'} />
                                <span className="hidden sm:inline">Auto Pilot</span>
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
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg relative ${showRiskSidebar
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

                    {showAdvancedFilters && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Application Date Range */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application Date</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={dateFrom}
                                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                        />
                                        <span className="text-slate-300">to</span>
                                        <input
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={dateTo}
                                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>

                                {/* KYC Submitted Date Range */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">KYC Submitted Date</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={kycDateFrom}
                                            onChange={(e) => { setKycDateFrom(e.target.value); setPage(1); }}
                                        />
                                        <span className="text-slate-300">to</span>
                                        <input
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={kycDateTo}
                                            onChange={(e) => { setKycDateTo(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>

                                {/* EMI Payment Date Range */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">EMI Payment Date</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={emiDateFrom}
                                            onChange={(e) => { setEmiDateFrom(e.target.value); setPage(1); }}
                                        />
                                        <span className="text-slate-300">to</span>
                                        <input
                                            type="date"
                                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={emiDateTo}
                                            onChange={(e) => { setEmiDateTo(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>

                                {/* EMI Count & Overdue */}
                                <div className="flex gap-4">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tenure (EMIs)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 12"
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={emiCount}
                                            onChange={(e) => { setEmiCount(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overdue Status</label>
                                        <select
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
                                            value={overdueFilter}
                                            onChange={(e) => { setOverdueFilter(e.target.value); setPage(1); }}
                                        >
                                            <option value="ALL">All Loans</option>
                                            <option value="YES">Overdue Only</option>
                                            <option value="NO">Not Overdue</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Referral Search */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agent/Referrer Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                        <input
                                            type="text"
                                            placeholder="Agent name or referral code..."
                                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={referralSearch}
                                            onChange={(e) => { setReferralSearch(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Loan Amount Range */}
                            <div className="flex flex-col gap-2 mt-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loan Amount Range (₹)</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Min</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={minAmount}
                                            onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                    <span className="text-slate-300 font-bold text-xs shrink-0">—</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Max</span>
                                        <input
                                            type="number"
                                            placeholder="∞"
                                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={maxAmount}
                                            onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                    {(minAmount || maxAmount) && (
                                        <button
                                            onClick={() => { setMinAmount(''); setMaxAmount(''); setPage(1); }}
                                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Clear amount filter"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                        <input
                                            type="text"
                                            placeholder="Global search..."
                                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-100 outline-none"
                                            value={search}
                                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setDateFrom(''); setDateTo('');
                                        setKycDateFrom(''); setKycDateTo('');
                                        setEmiDateFrom(''); setEmiDateTo('');
                                        setEmiCount(''); setOverdueFilter('ALL');
                                        setSearch(''); setReferralSearch(''); setStatusFilter('ALL');
                                        setMinAmount(''); setMaxAmount('');
                                        setPage(1);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold text-xs transition-all"
                                >
                                    <X size={14} />
                                    RESET ALL FILTERS
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pipeline Card - Full width with 8px margin */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden -mx-[8px] md:-mx-[24px]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {activeTab === 'requests' ? 'Live Loan Pipeline' : activeTab === 'cancelled' ? 'Cancelled Loan Repository' : 'Historical Loan Records'}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm mt-1">
                                    {activeTab === 'requests'
                                        ? 'Review applicant details, manage KYC and approve disbursals.'
                                        : activeTab === 'cancelled'
                                            ? 'Detailed logs of applications that were cancelled by the user or system.'
                                            : 'Audit logs and records of disbursed, closed or previously rejected requests.'}
                                </p>
                            </div>
                        </div>

                        {(activeTab === 'history' || activeTab === 'cancelled') && selectedLoanIds.length > 0 && (
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
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Bal.</th>
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
                                                                {(loan.status === 'APPROVED' || (hasPlatformFee(loan) && !isPlatformFeePaid(loan)) || loan.status === 'KYC_SENT') && activeTab === 'requests' && (
                                                                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-sm uppercase tracking-widest border border-rose-500 flex items-center gap-1">
                                                                        <Star size={8} fill="white" /> Priority
                                                                    </span>
                                                                )}
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
                                                                {/* Auto Pilot Risk Indicator */}
                                                                {loan.is_auto_pilot_risk && (
                                                                    <div className="group/risk relative inline-block">
                                                                        <span className="flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/20 border-2 border-white animate-pulse">
                                                                            <AlertTriangle size={8} /> RISK
                                                                        </span>
                                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/risk:block z-50">
                                                                            <div className="bg-slate-900 text-white text-[10px] font-bold p-3 rounded-2xl shadow-2xl border border-slate-700 min-w-[200px] leading-relaxed">
                                                                                <p className="text-rose-400 mb-1 flex items-center gap-1 uppercase tracking-widest text-[8px]">
                                                                                    <Shield size={10} /> Auto-Pilot Flag
                                                                                </p>
                                                                                <div className="space-y-1.5 mt-2">
                                                                                    {loan.auto_pilot_risk_reason?.split(' | ').map((reason: string, i: number) => (
                                                                                        <div key={i} className="flex items-start gap-1.5 text-slate-300 font-medium">
                                                                                            <div className="mt-1 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                                                            <span>{reason}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* Re-upload Flagged Tag */}
                                                                {loan.reupload_fields && loan.reupload_fields.length > 0 && (
                                                                    <div className="group/reupload relative inline-flex">
                                                                        <span className="flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-widest">
                                                                            <AlertTriangle size={8} />
                                                                            Flagged: Re-upload ({loan.reupload_fields.length})
                                                                        </span>
                                                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/reupload:block z-50 pointer-events-none">
                                                                            <div className="bg-orange-950 text-orange-100 text-[10px] font-bold p-3 rounded-2xl shadow-2xl border border-orange-800 min-w-[180px] leading-relaxed">
                                                                                <p className="text-orange-300 mb-1.5 flex items-center gap-1 uppercase tracking-widest text-[8px]">
                                                                                    <AlertTriangle size={9} /> Fields Requested
                                                                                </p>
                                                                                <div className="space-y-1">
                                                                                    {loan.reupload_fields.map((f: string, i: number) => (
                                                                                        <div key={i} className="flex items-center gap-1.5 text-orange-200">
                                                                                            <div className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                                                                            <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
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
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`font-mono font-bold text-lg tracking-tight ${parseFloat(loan.user_wallet_balance || 0) > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                                                            ₹{parseFloat(loan.user_wallet_balance || '0').toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Wallet Balance</p>
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
                                                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                                <CountdownTimer loan={loan} delayMinutes={autoPilotSettings.delays.proceed} label="Auto Proceed" />
                                                                <div className="flex gap-2">
                                                                    {loan.form_data && Object.keys(loan.form_data).length > 0 && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); openLoanPreview(loan); }}
                                                                            className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
                                                                            title="Preview KYC / Request Re-upload"
                                                                        >
                                                                            <Search size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        disabled={!!actionLoading}
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'proceed', 'Loan Proceeded!'); }}
                                                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all font-mono"
                                                                    >
                                                                        Proceed
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {['PROCEEDED', 'VETTING'].includes(loan.status) && (
                                                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                                <CountdownTimer loan={loan} delayMinutes={autoPilotSettings.delays.send_kyc} label="Auto KYC" />
                                                                <div className="flex gap-2">
                                                                    {loan.form_data && Object.keys(loan.form_data).length > 0 && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); openLoanPreview(loan); }}
                                                                            className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
                                                                            title="Preview KYC / Request Re-upload"
                                                                        >
                                                                            <Search size={18} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        disabled={!!actionLoading}
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'send-kyc', 'KYC Link Sent!'); }}
                                                                        className="px-5 py-2.5 bg-amber-400 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 shadow-xl shadow-amber-500/20 transition-all font-mono"
                                                                    >
                                                                        Send KYC
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {['FORM_SUBMITTED', 'KYC_SUBMITTED'].includes(loan.status) && (
                                                            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                                <CountdownTimer loan={loan} delayMinutes={autoPilotSettings.delays.approve} label="Auto Approve" />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openLoanPreview(loan); }}
                                                                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
                                                                        title="Preview KYC / Request Re-upload"
                                                                    >
                                                                        <Search size={18} />
                                                                    </button>
                                                                    {loan.reupload_fields && loan.reupload_fields.length > 0 && loan.kyc_submitted_at && (
                                                                        <button
                                                                            disabled={actionLoading === `reverify-${loan.id}`}
                                                                            onClick={(e) => { e.stopPropagation(); handleReverifyKyc(loan.id); }}
                                                                            className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 flex items-center gap-2"
                                                                            title="Re-verify KYC & Clear Flags"
                                                                        >
                                                                            {actionLoading === `reverify-${loan.id}` ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                                                            Re-verify
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        disabled={!!actionLoading}
                                                                        onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'approve', 'Loan Approved!'); }}
                                                                        className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all font-mono"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {loan.status === 'APPROVED' && (
                                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                {loan.is_auto_pilot_risk && (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl font-bold text-[9px] uppercase tracking-wider shadow-sm animate-pulse">
                                                                        <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                                                                        risk needs manual verification during disbursal
                                                                    </span>
                                                                )}
                                                                {loan.reupload_fields && loan.reupload_fields.length > 0 && loan.kyc_submitted_at && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openLoanPreview(loan); }}
                                                                        disabled={actionLoading === `reverify-${loan.id}`}
                                                                        className="relative flex items-center gap-1.5 px-3 py-2.5 bg-amber-400 text-amber-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 border border-amber-300 animate-pulse hover:animate-none disabled:opacity-60"
                                                                        title={`Re-upload submitted for: ${loan.reupload_fields.join(', ')}`}
                                                                    >
                                                                        <ShieldCheck size={14} />
                                                                        Re-verify
                                                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-white shadow">
                                                                            {loan.reupload_fields.length}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                                {getPendingPlatformFee(loan) && (
                                                                    <button
                                                                        disabled={!!actionLoading}
                                                                        onClick={(e) => handleApproveFee(e, loan, getPendingPlatformFee(loan).id)}
                                                                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all font-mono"
                                                                    >
                                                                        {actionLoading === `approve-fee-${getPendingPlatformFee(loan).id}` ? '...' : 'Confirm Fee'}
                                                                    </button>
                                                                )}

                                                                {isPlatformFeePaid(loan) && (!loan.reupload_fields || loan.reupload_fields.length === 0) && (
                                                                    <button
                                                                        disabled={!!actionLoading}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (window.confirm("Are you sure you want to trigger Aadhaar & PAN Verification for this loan?")) {
                                                                                setActionLoading(`trigger-kyc-${loan.id}`);
                                                                                try {
                                                                                    await apiFetch(`/admin/loans/${loan.id}/request-reupload`, {
                                                                                        method: 'POST',
                                                                                        body: JSON.stringify({
                                                                                            fields: ['aadhar_front', 'aadhar_back', 'pan_card', 'aadhar_number', 'pan_number'],
                                                                                            remarks: "Please complete Aadhaar & PAN verification to disburse your loan."
                                                                                        })
                                                                                    });
                                                                                    alert("Aadhaar & PAN verification triggered successfully!");
                                                                                    loadLoans();
                                                                                } catch (err: any) {
                                                                                    alert(err.message || "Failed to trigger Aadhaar & PAN verification");
                                                                                } finally {
                                                                                    setActionLoading(null);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all font-mono"
                                                                    >
                                                                        Verify Aadhaar/PAN
                                                                    </button>
                                                                )}

                                                                <button
                                                                    disabled={!!actionLoading || (hasPlatformFee(loan) && !isPlatformFeePaid(loan)) || (loan.reupload_fields && loan.reupload_fields.length > 0)}
                                                                    onClick={(e) => { e.stopPropagation(); handleAction(loan.id, 'release', 'Funds Released!'); }}
                                                                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all font-mono ${(hasPlatformFee(loan) && !isPlatformFeePaid(loan)) || (loan.reupload_fields && loan.reupload_fields.length > 0)
                                                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                                                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/30'
                                                                        }`}
                                                                    title={hasPlatformFee(loan) && !isPlatformFeePaid(loan)
                                                                        ? 'Platform fee must be paid before disbursal'
                                                                        : (loan.reupload_fields && loan.reupload_fields.length > 0)
                                                                            ? 'Pending Aadhaar/PAN or other document verification'
                                                                            : 'Release funds to customer'
                                                                    }
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

                                                        {['DISBURSED', 'CLOSED'].includes(loan.status) && (
                                                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                                                {loan.reupload_fields && loan.reupload_fields.length > 0 && loan.kyc_submitted_at && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openLoanPreview(loan); }}
                                                                        disabled={actionLoading === `reverify-${loan.id}`}
                                                                        className="relative flex items-center gap-1.5 px-3 py-2.5 bg-amber-400 text-amber-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 border border-amber-300 animate-pulse hover:animate-none disabled:opacity-60"
                                                                        title={`Re-upload submitted for: ${loan.reupload_fields.join(', ')}`}
                                                                    >
                                                                        <ShieldCheck size={14} />
                                                                        Re-verify
                                                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-white shadow">
                                                                            {loan.reupload_fields.length}
                                                                        </span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); openLoanPreview(loan); }}
                                                                    className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
                                                                    title="Preview KYC / Request Re-upload"
                                                                >
                                                                    <Search size={18} />
                                                                </button>
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
                            <KycVerificationSidebar
                                onClose={() => setShowKycSidebar(false)}
                                loan={previewLoan}
                            />
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
                        )}
                    </div>
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
                                                                toggleReuploadField('full_name');
                                                            }}
                                                            className={`px-2 py-1 rounded-full transition-all border flex items-center gap-1.5 ${reuploadFields.includes('full_name')
                                                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                                : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                                }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={12} fill={reuploadFields.includes('full_name') ? "currentColor" : "none"} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                                                {reuploadFields.includes('full_name') ? 'Flagged' : 'Flag'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {reuploadFields.includes('full_name') && (
                                                        <div className="col-span-2 mt-1 mb-4 animate-in zoom-in-95 duration-200">
                                                            <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-3 flex flex-col gap-2 shadow-xl shadow-rose-900/5">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare size={12} className="text-rose-500" />
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Correction Feedback (Name)</span>
                                                                </div>
                                                                <textarea
                                                                    value={reuploadRemarks['full_name'] || ''}
                                                                    onChange={(e) => updateFieldRemark('full_name', e.target.value)}
                                                                    placeholder="Explain what is wrong with the name..."
                                                                    className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-xl p-2 placeholder:text-rose-300 resize-none min-h-[50px] shadow-inner"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
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
                                                                toggleReuploadField('date_of_birth');
                                                            }}
                                                            className={`px-2 py-1 rounded-full transition-all border flex items-center gap-1.5 ${reuploadFields.includes('date_of_birth')
                                                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                                : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                                }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={12} fill={reuploadFields.includes('date_of_birth') ? "currentColor" : "none"} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                                                {reuploadFields.includes('date_of_birth') ? 'Flagged' : 'Flag'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {reuploadFields.includes('date_of_birth') && (
                                                        <div className="col-span-2 mt-1 mb-4 animate-in zoom-in-95 duration-200">
                                                            <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-3 flex flex-col gap-2 shadow-xl shadow-rose-900/5">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare size={12} className="text-rose-500" />
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest text-center">Remark (DOB)</span>
                                                                </div>
                                                                <textarea
                                                                    value={reuploadRemarks['date_of_birth'] || ''}
                                                                    onChange={(e) => updateFieldRemark('date_of_birth', e.target.value)}
                                                                    placeholder="Reason for re-upload..."
                                                                    className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-xl p-2 placeholder:text-rose-300 resize-none min-h-[50px] shadow-inner"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Marital Status</p>
                                                        <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.marital_status || 'N/A'}</p>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Father's Name</p>
                                                            <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.father_name || previewLoan.user?.family_detail?.father_name || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleReuploadField('father_name');
                                                            }}
                                                            className={`px-2 py-1 rounded-full transition-all border flex items-center gap-1.5 ${reuploadFields.includes('father_name')
                                                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                                : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                                }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={12} fill={reuploadFields.includes('father_name') ? "currentColor" : "none"} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                                                {reuploadFields.includes('father_name') ? 'Flagged' : 'Flag'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {reuploadFields.includes('father_name') && (
                                                        <div className="col-span-2 mt-1 mb-4 animate-in zoom-in-95 duration-200">
                                                            <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-3 flex flex-col gap-2 shadow-xl shadow-rose-900/5">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare size={12} className="text-rose-500" />
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest text-center">Remark (Father)</span>
                                                                </div>
                                                                <textarea
                                                                    value={reuploadRemarks['father_name'] || ''}
                                                                    onChange={(e) => updateFieldRemark('father_name', e.target.value)}
                                                                    placeholder="Reason for re-upload..."
                                                                    className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-xl p-2 placeholder:text-rose-300 resize-none min-h-[50px] shadow-inner"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mother's Name</p>
                                                            <p className="text-sm font-bold text-slate-900">{previewLoan.form_data.mother_name || previewLoan.user?.family_detail?.mother_name || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleReuploadField('mother_name');
                                                            }}
                                                            className={`px-2 py-1 rounded-full transition-all border flex items-center gap-1.5 ${reuploadFields.includes('mother_name')
                                                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                                : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                                }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={12} fill={reuploadFields.includes('mother_name') ? "currentColor" : "none"} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                                                {reuploadFields.includes('mother_name') ? 'Flagged' : 'Flag'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {reuploadFields.includes('mother_name') && (
                                                        <div className="col-span-2 mt-1 mb-4 animate-in zoom-in-95 duration-200">
                                                            <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-3 flex flex-col gap-2 shadow-xl shadow-rose-900/5">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare size={12} className="text-rose-500" />
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest text-center">Remark (Mother)</span>
                                                                </div>
                                                                <textarea
                                                                    value={reuploadRemarks['mother_name'] || ''}
                                                                    onChange={(e) => updateFieldRemark('mother_name', e.target.value)}
                                                                    placeholder="Reason for re-upload..."
                                                                    className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-xl p-2 placeholder:text-rose-300 resize-none min-h-[50px] shadow-inner"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
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
                                                                toggleReuploadField('pan_number');
                                                            }}
                                                            className={`px-2 py-1 rounded-full transition-all border flex items-center gap-1.5 ${reuploadFields.includes('pan_number')
                                                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                                : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                                }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={12} fill={reuploadFields.includes('pan_number') ? "currentColor" : "none"} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                                                {reuploadFields.includes('pan_number') ? 'Flagged' : 'Flag'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {reuploadFields.includes('pan_number') && (
                                                        <div className="col-span-2 mt-1 mb-4 animate-in zoom-in-95 duration-200">
                                                            <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-3 flex flex-col gap-2 shadow-xl shadow-rose-900/5">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare size={12} className="text-rose-500" />
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Correction Feedback (PAN)</span>
                                                                </div>
                                                                <textarea
                                                                    value={reuploadRemarks['pan_number'] || ''}
                                                                    onChange={(e) => updateFieldRemark('pan_number', e.target.value)}
                                                                    placeholder="e.g. 'PAN number is incorrect' or 'Invalid PAN'..."
                                                                    className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-xl p-2 placeholder:text-rose-300 resize-none min-h-[50px] shadow-inner"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aadhar Number</p>
                                                            <p className="text-sm font-black text-slate-900 font-mono">{previewLoan.form_data.aadhar_number || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleReuploadField('aadhar_number');
                                                            }}
                                                            className={`px-2 py-1 rounded-full transition-all border flex items-center gap-1.5 ${reuploadFields.includes('aadhar_number')
                                                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                                : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                                }`}
                                                            title="Mark for Re-upload"
                                                        >
                                                            <Shield size={12} fill={reuploadFields.includes('aadhar_number') ? "currentColor" : "none"} />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">
                                                                {reuploadFields.includes('aadhar_number') ? 'Flagged' : 'Flag'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    {reuploadFields.includes('aadhar_number') && (
                                                        <div className="col-span-2 mt-1 mb-4 animate-in zoom-in-95 duration-200">
                                                            <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-2xl p-3 flex flex-col gap-2 shadow-xl shadow-rose-900/5">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare size={12} className="text-rose-500" />
                                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest text-center">Remark (Aadhaar)</span>
                                                                </div>
                                                                <textarea
                                                                    value={reuploadRemarks['aadhar_number'] || ''}
                                                                    onChange={(e) => updateFieldRemark('aadhar_number', e.target.value)}
                                                                    placeholder="Reason for re-upload..."
                                                                    className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-xl p-2 placeholder:text-rose-300 resize-none min-h-[50px] shadow-inner"
                                                                    rows={2}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
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
                                                            toggleReuploadField('address_details');
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full transition-all border flex items-center gap-2 ${reuploadFields.includes('address_details')
                                                            ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                            : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                            }`}
                                                        title="Mark Address for Re-upload"
                                                    >
                                                        <Shield size={14} fill={reuploadFields.includes('address_details') ? "currentColor" : "none"} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest pl-1 border-l border-white/20">
                                                            {reuploadFields.includes('address_details') ? 'Flagged' : 'Flag Address'}
                                                        </span>
                                                    </button>
                                                </div>
                                                {reuploadFields.includes('address_details') && (
                                                    <div className="mb-6 animate-in zoom-in-95 duration-200">
                                                        <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-[2rem] p-4 flex flex-col gap-3 shadow-xl shadow-rose-900/5">
                                                            <div className="flex items-center gap-2">
                                                                <MessageSquare size={14} className="text-rose-500" />
                                                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Correction Feedback (Address)</span>
                                                            </div>
                                                            <textarea
                                                                value={reuploadRemarks['address_details'] || ''}
                                                                onChange={(e) => updateFieldRemark('address_details', e.target.value)}
                                                                placeholder="e.g. 'Address proof is missing' or 'House number not clear'..."
                                                                className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-2xl p-3 placeholder:text-rose-300 resize-none min-h-[60px] shadow-inner"
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
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
                                                            toggleReuploadField('bank_details');
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full transition-all border flex items-center gap-2 ${reuploadFields.includes('bank_details')
                                                            ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                                            : "bg-white text-rose-300 border-slate-200 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200"
                                                            }`}
                                                        title="Mark Bank Info for Re-upload"
                                                    >
                                                        <Shield size={14} fill={reuploadFields.includes('bank_details') ? "currentColor" : "none"} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest pl-1 border-l border-white/20">
                                                            {reuploadFields.includes('bank_details') ? 'Flagged' : 'Flag Bank'}
                                                        </span>
                                                    </button>
                                                </div>
                                                {reuploadFields.includes('bank_details') && (
                                                    <div className="mb-6 animate-in zoom-in-95 duration-200">
                                                        <div className="bg-rose-50/80 backdrop-blur-sm border-2 border-rose-200 rounded-[2rem] p-4 flex flex-col gap-3 shadow-xl shadow-rose-900/5">
                                                            <div className="flex items-center gap-2">
                                                                <MessageSquare size={14} className="text-rose-500" />
                                                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Correction Feedback (Bank Info)</span>
                                                            </div>
                                                            <textarea
                                                                value={reuploadRemarks['bank_details'] || ''}
                                                                onChange={(e) => updateFieldRemark('bank_details', e.target.value)}
                                                                placeholder="e.g. 'Bank account mismatch' or 'Passbook image blurred'..."
                                                                className="text-xs font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/50 rounded-2xl p-3 placeholder:text-rose-300 resize-none min-h-[60px] shadow-inner"
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
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

                                    {/* KYC Documents & Photos */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                                <Camera size={18} />
                                            </div>
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">KYC Documents & Photos</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                                                const getRawValue = () => {
                                                    const searchKeys = [field.id, ...(field.aliases || [])];
                                                    for (const key of searchKeys) {
                                                        if (previewLoan.form_data?.[key]) return previewLoan.form_data[key];
                                                        if (previewLoan.form_data?.kyc_images?.[key]) return previewLoan.form_data.kyc_images[key];
                                                        if (previewLoan.form_data?.kycImages?.[key]) return previewLoan.form_data.kycImages[key];
                                                    }
                                                    return null;
                                                };

                                                const rawVal = getRawValue();
                                                const normalize = (val: any) => {
                                                    if (!val) return null;
                                                    if (Array.isArray(val)) return val[0];
                                                    if (typeof val === 'string') return { url: val };
                                                    return val;
                                                };

                                                const value = normalize(rawVal);
                                                const hasImage = value && (value.url || value.path);
                                                const imgUrl = hasImage ? (getStorageUrl(value.url || value.path || '') || '') : '';
                                                const isSelected = reuploadFields.includes(field.id);

                                                return (
                                                    <div key={field.id} className="space-y-2">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                                                                {field.label}
                                                            </p>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleReuploadField(field.id);
                                                                }}
                                                                className={`px-1.5 py-1 rounded-full transition-all border flex items-center gap-1 ${isSelected
                                                                    ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                                                                    : "bg-white text-rose-400 border-slate-200 hover:text-rose-500 hover:bg-rose-50"
                                                                    }`}
                                                                title="Mark for Re-upload"
                                                            >
                                                                <Shield size={10} fill={isSelected ? "currentColor" : "none"} />
                                                                <span className="text-[7px] font-black uppercase">{isSelected ? 'Flagged' : 'Flag'}</span>
                                                            </button>
                                                        </div>
                                                        <div className={`relative group aspect-square rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-rose-500 shadow-lg shadow-rose-500/20' : 'border-slate-100'}`}>
                                                            {hasImage ? (
                                                                <>
                                                                    <img src={imgUrl} alt={field.label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                        <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all">
                                                                            <Eye size={20} />
                                                                        </a>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                                                                    <Camera size={24} className="mb-2 opacity-50" />
                                                                    <span className="text-[8px] font-bold uppercase tracking-wider">No Image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="animate-in zoom-in-95 duration-200">
                                                                <div className="bg-rose-50/50 backdrop-blur-md border border-rose-200 rounded-xl p-2 flex flex-col gap-1.5 shadow-lg shadow-rose-900/5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MessageSquare size={10} className="text-rose-501" />
                                                                        <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Image Correction</span>
                                                                    </div>
                                                                    <textarea
                                                                        value={reuploadRemarks[field.id] || ''}
                                                                        onChange={(e) => updateFieldRemark(field.id, e.target.value)}
                                                                        placeholder="Blurry, invalid doc, etc..."
                                                                        className="text-[10px] font-bold text-rose-900 border-none focus:ring-0 w-full bg-white/60 rounded-lg p-1.5 placeholder:text-rose-200 resize-none min-h-[40px] shadow-sm"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Bulk Re-upload Summary */}
                                    {(reuploadFields.length > 0 || (previewLoan.reupload_fields && previewLoan.reupload_fields.length > 0)) && (
                                        <div className="mt-8 pt-8 border-t-2 border-slate-100 animate-in slide-in-from-bottom-5 duration-500">
                                            <div className="bg-white rounded-[2.5rem] border-2 border-rose-100 p-6 sm:p-8 shadow-2xl shadow-rose-900/10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />

                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                                                                <Shield size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-black text-slate-900">KYC Correction Center</h3>
                                                                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                                                                    {reuploadFields.length > 0 ? `${reuploadFields.length} new fields flagged` : `${previewLoan.reupload_fields?.length || 0} existing flags`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        <button
                                                            disabled={actionLoading === `reverify-${previewLoan.id}`}
                                                            onClick={() => handleReverifyKyc(previewLoan.id)}
                                                            className="px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95 group shadow-sm disabled:opacity-50"
                                                        >
                                                            {actionLoading === `reverify-${previewLoan.id}` ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />}
                                                            Re-verify KYC
                                                        </button>
                                                        {!['APPROVED', 'DISBURSED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(previewLoan.status) && (
                                                            <button
                                                                disabled={!!actionLoading}
                                                                onClick={async () => {
                                                                    handleAction(previewLoan.id, 'approve', 'Loan Approved!');
                                                                    setPreviewLoan(null);
                                                                }}
                                                                className="px-10 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 transition-all flex items-center gap-3 active:scale-95 group"
                                                            >
                                                                {actionLoading ? 'Processing...' : 'Approve Loan'}
                                                                <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        )}
                                                        <button
                                                            disabled={reuploadFields.length === 0}
                                                            onClick={async () => {
                                                                if (!confirm(`Confirm requesting re-upload for ${reuploadFields.length} items?`)) return;
                                                                try {
                                                                    await apiFetch(`/admin/loans/${previewLoan.id}/request-reupload`, {
                                                                        method: 'POST',
                                                                        body: JSON.stringify({
                                                                            fields: reuploadFields,
                                                                            field_remarks: reuploadRemarks,
                                                                            remarks: generalRemarks
                                                                        })
                                                                    });
                                                                    toast.success('Re-upload request sent successfully!');
                                                                    const data = await apiFetch(`/admin/loans/${previewLoan.id}/details`);
                                                                    if (data) openLoanPreview(data);
                                                                    loadLoans();
                                                                } catch (err) {
                                                                    alert('Failed to send request');
                                                                }
                                                            }}
                                                            className="px-8 py-4 bg-rose-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-xl shadow-rose-500/30 transition-all flex items-center gap-3 active:scale-95 group disabled:opacity-50"
                                                        >
                                                            Submit Request
                                                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                                                    {reuploadFields.map(field => (
                                                        <div key={field} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-rose-200 transition-colors">
                                                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{field.replace(/_/g, ' ')}</p>
                                                                <p className="text-[10px] font-bold text-slate-700 truncate italic">
                                                                    {reuploadRemarks[field] || 'No specific remark'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => toggleReuploadField(field)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 text-rose-300 hover:text-rose-500 rounded-lg transition-all"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 px-2">
                                                        <MessageSquare size={16} className="text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Feedback for Applicant</span>
                                                    </div>
                                                    <textarea
                                                        value={generalRemarks}
                                                        onChange={(e) => setGeneralRemarks(e.target.value)}
                                                        placeholder="Provide overall instructions (e.g. 'Please ensure all images are clear and IDs are not expired')..."
                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-200 placeholder:text-slate-300 min-h-[120px] transition-all shadow-inner"
                                                    />
                                                </div>
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

            {showAutoPilotModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all ${autoPilotSettings.enabled ? 'bg-amber-500 text-white shadow-amber-500/30 rotate-12' : 'bg-slate-200 text-slate-400'}`}>
                                    <Zap size={32} className={autoPilotSettings.enabled ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Auto Pilot Engine</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-0.5">Workflow Automation & Risk Guard</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAutoPilotModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl text-slate-400 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-10">
                            {/* Toggle Switch */}
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div>
                                    <h4 className="font-black text-slate-900">Enable Auto-Pilot</h4>
                                    <p className="text-xs font-medium text-slate-500">Automatically progress loans through steps</p>
                                </div>
                                <button
                                    onClick={() => setAutoPilotSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                                    className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${autoPilotSettings.enabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${autoPilotSettings.enabled ? 'translate-x-8' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Delay Configuration */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step Transition Delays (Minutes)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight ml-2">Proceed</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="number"
                                                value={autoPilotSettings.delays.proceed}
                                                onChange={(e) => setAutoPilotSettings(prev => ({ ...prev, delays: { ...prev.delays, proceed: parseInt(e.target.value) || 0 } }))}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] font-black text-slate-900 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight ml-2">Send KYC</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="number"
                                                value={autoPilotSettings.delays.send_kyc}
                                                onChange={(e) => setAutoPilotSettings(prev => ({ ...prev, delays: { ...prev.delays, send_kyc: parseInt(e.target.value) || 0 } }))}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] font-black text-slate-900 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight ml-2">Approve</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="number"
                                                value={autoPilotSettings.delays.approve}
                                                onChange={(e) => setAutoPilotSettings(prev => ({ ...prev, delays: { ...prev.delays, approve: parseInt(e.target.value) || 0 } }))}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] font-black text-slate-900 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-blue-100">
                                    <Shield size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-tight mb-1">Safety Guard Active</h5>
                                    <p className="text-[10px] font-medium text-blue-600 leading-relaxed">
                                        Auto-Pilot will automatically flag suspicious applications (shared FCM, identical GPS, or PII clusters).
                                        Financial steps (Confirm Fee & Disburse) always require manual approval.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-6">
                            <button
                                onClick={() => setShowAutoPilotModal(false)}
                                className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={savingSettings}
                                onClick={() => saveAutoPilotSettings(autoPilotSettings)}
                                className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-900/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {savingSettings ? 'Syncing...' : (
                                    <>
                                        <Check size={18} />
                                        Update Configuration
                                    </>
                                )}
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
                isRisk={confirmModal.isRisk}
            />
        </AdminLayout>
    );
}
