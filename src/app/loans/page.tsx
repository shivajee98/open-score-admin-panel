'use client';

import { useState, useEffect } from 'react';
import { apiFetch, getStorageUrl } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { BadgeCheck, Clock, ChevronRight, Calculator, IndianRupee, Search, Filter, Trash2, XCircle, ChevronLeft, Eye, FileText, Download, MapPin, Briefcase, Landmark, Camera, User, Mail, Phone, Shield, ExternalLink, X, History as HistoryIcon, Database } from 'lucide-react';
import LoanDetailModal from '@/components/loans/LoanDetailModal';
import { useSearchParams } from 'next/navigation';
import MultiStepDeleteModal from '@/components/ui/MultiStepDeleteModal';
import { cn } from '@/lib/utils';

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
    const [activeTab, setActiveTab] = useState<'requests' | 'history' | 'archived'>('requests');
    const [previewLoan, setPreviewLoan] = useState<any>(null);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [selectedLoanIds, setSelectedLoanIds] = useState<number[]>([]);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [reuploadFields, setReuploadFields] = useState<string[]>([]);

    // Archiving Modal State
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);
    const [archivingLoan, setArchivingLoan] = useState<any>(null);
    const [archiveBatchOpen, setArchiveBatchOpen] = useState(false);

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
            let endpoint = '/admin/loans';
            if (activeTab === 'history') endpoint = '/admin/loans/history';
            if (activeTab === 'archived') endpoint = '/admin/loans/archived';
            
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
        if (method === 'DELETE' || endpoint === '/delete') {
            // Protected ID logic (Sunil Kumar Malviya ID 154)
            if (id === 154) {
               alert("CRITICAL ERROR: Access Denied. Entry ID 154 (Sunil Kumar Malviya) is globally protected and cannot be archived or deleted.");
               return;
            }
            setArchivingLoan(loans.find(l => l.id === id));
            setArchiveModalOpen(true);
            return;
        }

        if (!confirm('Are you sure you want to perform this action?')) return;

        setActionLoading(`${id}-${endpoint}`);
        try {
            const path = endpoint ? (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : '';
            const response = await apiFetch(`/admin/loans/${id}${path}`, { method });

            if (response && (response.data?.kyc_link || response.kyc_link)) {
                prompt("KYC Link generated (Copy below):", response.data?.kyc_link || response.kyc_link);
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

    const handleBulkDelete = () => {
        if (selectedLoanIds.length === 0) return;
        // Check if any protected ID is in selection
        if (selectedLoanIds.includes(154)) {
            alert("PROTECTION ALERT: Selection contains ID 154 (Sunil Kumar Malviya), which is globally protected. Please unselect it to proceed with bulk archive.");
            return;
        }
        setArchiveBatchOpen(true);
    };

    const executeArchive = async (id: number) => {
        setActionLoading(`${id}-delete`);
        try {
            await apiFetch(`/admin/loans/${id}`, { method: 'DELETE' });
            setArchiveModalOpen(false);
            setArchivingLoan(null);
            loadLoans();
        } catch (e) {
            alert('Archiving failed');
        } finally {
            setActionLoading(null);
        }
    };

    const executeBulkArchive = async () => {
        setActionLoading('bulk-archive');
        try {
            await apiFetch('/admin/loans/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids: selectedLoanIds })
            });
            setArchiveBatchOpen(false);
            setSelectedLoanIds([]);
            loadLoans();
        } catch (e) {
            alert('Bulk archive failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const XLSX = await import('xlsx');
            const endpoint = activeTab === 'requests' ? '/admin/loans' : '/admin/loans/history';
            const query = new URLSearchParams({
                search: search,
                status: statusFilter,
                page: '1',
                per_page: '999'
            });
            const response = await apiFetch(`${endpoint}?${query}`);
            let allLoans = response?.data || response || [];

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
                return {
                    'Loan ID': loan.id,
                    'Display ID': loan.display_id || loan.id,
                    'Status': loan.status,
                    'Applicant Name': user.name || '',
                    'Mobile': user.mobile_number || '',
                    'Amount': loan.amount,
                    'Tenure': loan.tenure,
                    'Payout Frequency': loan.payout_frequency,
                    'Application Date': loan.created_at ? new Date(loan.created_at).toLocaleDateString() : '',
                };
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, activeTab === 'requests' ? 'Pending Loans' : 'Loan History');
            const fileName = `openscore_loans_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to export Excel file');
        } finally {
            setExporting(false);
        }
    };

    return (
        <AdminLayout title="Loan Control & Archiving">
            <title>Loan Approvals | OpenScore</title>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    {[
                        { id: 'requests', label: 'Live Pipeline', icon: Clock, count: counts.loans },
                        { id: 'history', label: 'History', icon: HistoryIcon, count: 0 },
                        { id: 'archived', label: 'Archived Storage', icon: Trash2, count: 0 },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setStatusFilter('ALL'); setPage(1); }}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
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
                                    <option value="PENDING">Pending</option>
                                    <option value="APPLIED">Applied</option>
                                    <option value="KYC_SUBMITTED">KYC Submitted</option>
                                    <option value="APPROVED">Approved</option>
                                </>
                            ) : (
                                <>
                                    <option value="DISBURSED">Disbursed</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="REJECTED">Rejected</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>

                    <button
                        onClick={handleExportExcel}
                        disabled={exporting || loans.length === 0}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 shadow-lg transition-all disabled:opacity-50"
                    >
                        <Download size={16} />
                        {exporting ? '...' : 'Excel'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">
                            {activeTab === 'requests' ? 'Active Pipeline' : activeTab === 'history' ? 'Loan Records' : 'Archive Repository'}
                        </h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            {activeTab === 'archived' ? 'Non-destructive historical storage for deleted data.' : 'Manage live applications and vetted records.'}
                        </p>
                    </div>
                    {activeTab !== 'archived' && selectedLoanIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
                        >
                            Archive Selected ({selectedLoanIds.length})
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="p-24 text-center">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Data...</p>
                    </div>
                ) : loans.length === 0 ? (
                    <div className="p-24 text-center">
                        <Database className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-slate-900 mb-1 uppercase">Vault Empty</h4>
                        <p className="text-slate-400 font-medium text-sm">No records found matching current criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left order-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    {activeTab !== 'archived' && (
                                        <th className="p-6 pl-8 w-10">
                                            <input type="checkbox" checked={selectedLoanIds.length === loans.length} onChange={toggleAllOnPage} className="w-4 h-4 text-blue-600 rounded" />
                                        </th>
                                    )}
                                    <th className={`p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest ${activeTab === 'archived' ? 'pl-8' : 'pl-2'}`}>Applicant / ID</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount / Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'archived' ? 'Archived At' : 'Timeline'}</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan: any) => (
                                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer" onClick={() => setSelectedLoan(loan.id)}>
                                        {activeTab !== 'archived' && (
                                            <td className="p-6 pl-8" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedLoanIds.includes(loan.id)} onChange={(e) => toggleSelection(e, loan.id)} className="w-4 h-4 text-blue-600 rounded" />
                                            </td>
                                        )}
                                        <td className={`p-6 ${activeTab === 'archived' ? 'pl-8' : 'pl-2'}`}>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900">{loan.user?.name || 'Unknown'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">#{loan.display_id || loan.id} • {loan.user?.mobile_number}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 text-lg">₹{parseFloat(loan.amount).toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-blue-500 uppercase">{loan.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-600">{new Date(loan.archived_at || loan.created_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-medium text-slate-400">{new Date(loan.archived_at || loan.created_at).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-6 pr-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                {activeTab === 'archived' ? (
                                                    <span className="text-[9px] font-black text-slate-300 italic uppercase tracking-widest">Read Only Vault</span>
                                                ) : (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedLoan(loan.id); }} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="View Details"><Eye size={18} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleAction(loan.id, '', 'Archived!', 'DELETE'); }} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Archive"><Trash2 size={18} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</p>
                    <div className="flex items-center gap-3">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={20} /></button>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            {selectedLoan && (
                <LoanDetailModal loanId={selectedLoan} onClose={() => setSelectedLoan(null)} onUpdate={() => loadLoans()} />
            )}

            <MultiStepDeleteModal
                isOpen={archiveModalOpen}
                onClose={() => { setArchiveModalOpen(false); setArchivingLoan(null); }}
                onConfirm={() => archivingLoan && executeArchive(archivingLoan.id)}
                title="Archive Loan Entry"
                itemDescription={archivingLoan ? `Loan ID: ${archivingLoan.display_id || archivingLoan.id} - ${archivingLoan.user?.name}` : undefined}
            />
            <MultiStepDeleteModal
                isOpen={archiveBatchOpen}
                onClose={() => setArchiveBatchOpen(false)}
                onConfirm={executeBulkArchive}
                title="Bulk Archive Loans"
                itemDescription={`${selectedLoanIds.length} selected loans will be moved to the archive storage.`}
            />
        </AdminLayout>
    );
}
