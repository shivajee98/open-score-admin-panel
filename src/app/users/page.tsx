'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Trash2, Ban, CheckCircle, MoreVertical, ReceiptIndianRupee, CheckSquare, Square, Save, Eye, Clock, X, Check, ChevronLeft, ChevronRight, Download, ShieldCheck, Filter, Calendar, Users as UsersIcon, ShieldAlert, ChevronDown, Database, BadgeCheck, MessageSquare, Send, FileText, Wallet, IndianRupee, Phone, PhoneOff } from 'lucide-react';
import MaintenanceChargeModal from '@/components/MaintenanceChargeModal';
import Link from 'next/link';
import VaultConfigModal from '@/components/VaultConfigModal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Sub-component for individual user rows to handle local input state
const UserRow = ({ user, selectedIds, toggleSelect, toggleStatus, handleDelete, setSelectedUser, setIsCreditsModalOpen, reloadUsers, currentUser, onVaultConfig }: any) => {
    const [cashbackPercent, setCashbackPercent] = useState(user.cashback_percentage ?? '');
    const [cashbackFlat, setCashbackFlat] = useState(user.cashback_flat_amount ?? '');
    const [receivePercent, setReceivePercent] = useState(user.receive_cashback_percentage ?? '');
    const [receiveFlat, setReceiveFlat] = useState(user.receive_cashback_flat_amount ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [fetchedPin, setFetchedPin] = useState<string | null>(null);
    const [isFetchingPin, setIsFetchingPin] = useState(false);

    // Sync state if user prop changes (e.g. after reload)
    useEffect(() => {
        setCashbackPercent(user.cashback_percentage ?? '');
        setCashbackFlat(user.cashback_flat_amount ?? '');
        setReceivePercent(user.receive_cashback_percentage ?? '');
        setReceiveFlat(user.receive_cashback_flat_amount ?? '');
    }, [user.cashback_percentage, user.cashback_flat_amount, user.receive_cashback_percentage, user.receive_cashback_flat_amount]);

    const handleSenderPercentChange = (val: string) => {
        setCashbackPercent(val);
        if (parseFloat(val) > 0) setCashbackFlat('');
    };

    const handleSenderFlatChange = (val: string) => {
        setCashbackFlat(val);
        if (parseFloat(val) > 0) setCashbackPercent('');
    };

    const handleReceiverPercentChange = (val: string) => {
        setReceivePercent(val);
        if (parseFloat(val) > 0) setReceiveFlat('');
    };

    const handleReceiverFlatChange = (val: string) => {
        setReceiveFlat(val);
        if (parseFloat(val) > 0) setReceivePercent('');
    };

    const handleSaveCashback = async () => {
        setIsSaving(true);
        try {
            const pPercent = parseFloat(cashbackPercent) || 0;
            const pFlat = parseFloat(cashbackFlat) || 0;
            const rPercent = parseFloat(receivePercent) || 0;
            const rFlat = parseFloat(receiveFlat) || 0;

            if (pPercent < 0 || pFlat < 0 || rPercent < 0 || rFlat < 0) {
                alert("Values cannot be negative");
                return;
            }

            await apiFetch('/admin/users/bulk-cashback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: [user.id],
                    cashback_percentage: pPercent,
                    cashback_flat_amount: pFlat,
                    receive_cashback_percentage: rPercent,
                    receive_cashback_flat_amount: rFlat
                })
            });
            alert('Cashback updated!');
            reloadUsers();
        } catch (e) {
            alert('Error updating cashback');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFetchAppPin = async () => {
        setIsFetchingPin(true);
        try {
            const data = await apiFetch(`/admin/users/${user.id}/app-pin`);
            setFetchedPin(data.pin);
        } catch (e: any) {
            alert(e.message || 'Failed to fetch PIN');
        } finally {
            setIsFetchingPin(false);
        }
    };

    const handleToggleCall = async () => {
        if (!confirm(`Are you sure you want to ${user.can_make_calls ? 'disable' : 'enable'} calls for this user?`)) return;
        try {
            await apiFetch(`/admin/users/${user.id}/toggle-call-feature`, { method: 'POST' });
            reloadUsers();
        } catch (e) {
            alert('Failed to toggle call feature');
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    return (
        <tr className={cn(
            "hover:bg-slate-50/80 transition-colors group",
            selectedIds.includes(user.id) && "bg-blue-50/30",
            user.is_payment_pending && "bg-amber-50/60 border-l-4 border-l-amber-500 shadow-sm"
        )}>
            <td className="p-6 text-center">
                {isAdmin && (
                    <button onClick={() => toggleSelect(user.id)}>
                        {selectedIds.includes(user.id) ?
                            <CheckSquare className="text-blue-600" /> : <Square className="text-slate-300 group-hover:text-slate-400" />
                        }
                    </button>
                )}
            </td>
            <td className="p-6 pl-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">
                            {(user.name || 'U')[0]}
                        </div>
                        {user.is_payment_pending && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white items-center justify-center text-[8px] text-white font-bold">!</span>
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                            {user.name || user.mobile_number}
                            {!user.is_onboarded && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase tracking-tighter">
                                    Pending Onboarding
                                </span>
                            )}
                            {user.is_payment_pending && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-tighter animate-pulse">
                                    Action Required
                                </span>
                            )}
                        </p>
                        <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                    </div>
                </div>
            </td>
            <td className="p-6">
                <span className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'MERCHANT' ? 'bg-blue-100 text-blue-700' : user.role === 'STUDENT' ? 'bg-indigo-100 text-indigo-700' : user.role === 'AGENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                )}>
                    {user.role}
                </span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-yellow-600">₹{parseFloat(user.cashback_balance || '0').toLocaleString('en-IN')}</span>
            </td>

            {/* Inline Cashback Inputs - Only for Admin */}
            <td className="p-6">
                {isAdmin ? (
                    <div className="flex flex-col gap-1">
                        <input
                            type="number" min="0" max="100" step="0.01" placeholder="Pay %"
                            className={cn(
                                "w-20 bg-slate-100 border-none rounded-lg p-2 font-mono text-xs font-bold text-purple-600 focus:ring-2 focus:ring-purple-200",
                                parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed"
                            )}
                            value={cashbackPercent}
                            onChange={(e) => handleSenderPercentChange(e.target.value)}
                            disabled={parseFloat(cashbackFlat) > 0}
                        />
                        <input
                            type="number" min="0" max="100" step="0.01" placeholder="Rec %"
                            className={cn(
                                "w-20 bg-blue-50 border-none rounded-lg p-2 font-mono text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-200",
                                parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed"
                            )}
                            value={receivePercent}
                            onChange={(e) => handleReceiverPercentChange(e.target.value)}
                            disabled={parseFloat(receiveFlat) > 0}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col text-[10px] font-mono">
                        <span className="text-purple-600">P: {user.cashback_percentage || 0}%</span>
                        <span className="text-blue-600">R: {user.receive_cashback_percentage || 0}%</span>
                    </div>
                )}
            </td>
            <td className="p-6 text-right">
                {isAdmin ? (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                            <input
                                type="number" min="0" step="0.01" placeholder="Pay ₹"
                                className={cn(
                                    "w-24 bg-slate-100 border-none rounded-lg p-2 font-mono text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-200",
                                    parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                value={cashbackFlat}
                                onChange={(e) => handleSenderFlatChange(e.target.value)}
                                disabled={parseFloat(cashbackPercent) > 0}
                            />
                            <input
                                type="number" min="0" step="0.01" placeholder="Rec ₹"
                                className={cn(
                                    "w-24 bg-blue-50 border-none rounded-lg p-2 font-mono text-xs font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-200",
                                    parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                value={receiveFlat}
                                onChange={(e) => handleReceiverFlatChange(e.target.value)}
                                disabled={parseFloat(receivePercent) > 0}
                            />
                        </div>
                        <button
                            onClick={handleSaveCashback}
                            disabled={isSaving}
                            className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors ml-2"
                            title="Update Cashback Rules"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col text-[10px] font-mono">
                        <span className="text-emerald-600">P: ₹{user.cashback_flat_amount || 0}</span>
                        <span className="text-indigo-600">R: ₹{user.receive_cashback_flat_amount || 0}</span>
                    </div>
                )}
            </td>

            <td className="p-6">
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-slate-700">{new Date(user.date_of_join).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-mono italic">{new Date(user.date_of_join).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </td>
            <td className="p-6">
                <p className="text-xs font-bold text-slate-700">{user.pincode || 'N/A'}</p>
            </td>
            <td className="p-6 text-center">
                {isAdmin ? (
                    <div className="flex items-center justify-center gap-2">
                        {fetchedPin ? (
                            <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2 animate-in zoom-in duration-300">
                                <span className={cn(
                                    "font-mono text-sm font-black tracking-widest",
                                    fetchedPin === 'ENCODED' ? "text-slate-400 italic" : 
                                    fetchedPin.length === 6 ? "text-amber-600" : "text-blue-700"
                                )}>
                                    {fetchedPin}
                                </span>
                                <button onClick={() => setFetchedPin(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleFetchAppPin}
                                disabled={isFetchingPin}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100 hover:border-blue-100 shadow-sm disabled:opacity-50 group/eye"
                                title="View App Auth PIN"
                            >
                                {isFetchingPin ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Eye className="w-4 h-4 group-hover/eye:scale-110 transition-transform" />
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-200">-</span>
                )}
            </td>
            <td className="p-6">
                {user.referred_by ? (
                    <div className="flex flex-col">
                        <p className="text-xs font-black text-blue-600">{user.referred_by.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{user.referred_by.mobile}</p>
                    </div>
                ) : (
                    <span className="text-xs text-slate-300 font-medium italic">Direct Join</span>
                )}
            </td>
            <td className="p-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-sm font-bold text-slate-600">{user.status}</span>
                    </div>
                    {user.kyc_status && (
                        <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight w-fit",
                            user.kyc_status === 'FULL_VERIFIED' ? "bg-emerald-100 text-emerald-700" :
                            user.kyc_status === 'FIELD_VERIFIED' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        )}>
                            {user.kyc_status === 'FULL_VERIFIED' ? <BadgeCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {user.kyc_status}
                        </div>
                    )}
                </div>
            </td>
            <td className="p-6 pr-8 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/users/detail?id=${user.id}`}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Full Details"
                    >
                        <Eye className="w-5 h-5" />
                    </Link>

                    {isAdmin && (
                        <button
                            onClick={() => toggleStatus(user)}
                            className={`p-2 rounded-lg transition-colors ${user.status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            title={user.status === 'SUSPENDED' ? 'Activate User' : 'Suspend User'}
                        >
                            {user.status === 'SUSPENDED' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </button>
                    )}

                    <button
                        onClick={() => { setSelectedUser(user); setIsCreditsModalOpen(true); }}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Add Funds"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {isAdmin && user.role !== 'SYSTEM' && user.role !== 'ADMIN' && (
                        <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => onVaultConfig(user)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Configure Vault"
                        >
                            <ShieldAlert className="w-5 h-5" />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={handleToggleCall}
                            className={`p-2 rounded-lg transition-colors ${user.can_make_calls ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            title={user.can_make_calls ? 'Disable Calls' : 'Enable Calls'}
                        >
                            {user.can_make_calls ? <Phone className="w-5 h-5" /> : <PhoneOff className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [pendingTransactions, setPendingTransactions] = useState([]);
    const [pendingRepayments, setPendingRepayments] = useState([]);
    const [pendingServiceFees, setPendingServiceFees] = useState([]);
    const [pendingPartnerRepayments, setPendingPartnerRepayments] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        min_balance: '',
        max_balance: '',
        min_signup: '',
        max_signup: '',
        pincode: '',
        sort_by: 'created_at',
        sort_order: 'desc',
        user_type: 'customer,agent'
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [pagination, setPagination] = useState({
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: 12
    });
    const [jumpPage, setJumpPage] = useState('');

    // Add Funds Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [creditType, setCreditType] = useState('WALLET_TOPUP');
    const [description, setDescription] = useState('');
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
    const [selectedUserForVault, setSelectedUserForVault] = useState<any>(null);

    // Bulk Cashback States
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCashbackModalOpen, setIsCashbackModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [cashbackPercent, setCashbackPercent] = useState('');
    const [cashbackFlat, setCashbackFlat] = useState('');
    const [receivePercent, setReceivePercent] = useState('');
    const [receiveFlat, setReceiveFlat] = useState('');
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);

    // Support Ticket Approval States
    const [viewingTicket, setViewingTicket] = useState<any>(null);
    const [ticketMessages, setTicketMessages] = useState<any[]>([]);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isLoadingTicket, setIsLoadingTicket] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
                setShowDownloadOptions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [downloadDropdownRef]);

    const handleExport = async (type: 'all' | 'selected') => {
        try {
            const query = new URLSearchParams();
            query.append('type', filters.user_type);

            if (type === 'all') {
                if (search) query.append('search', search);
                // Include other active filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && key !== 'user_type') query.append(key, value.toString());
                });
            } else {
                if (selectedIds.length === 0) {
                    alert("Please select users first");
                    return;
                }
                query.append('user_ids', selectedIds.join(','));
            }

            const blob = await apiFetch(`/admin/users/export?${query.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = type === 'all' ? `users_all_${new Date().toISOString().split('T')[0]}.csv` : `users_selected_${selectedIds.length}_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed.');
        } finally {
            setShowDownloadOptions(false);
        }
    };

    const handleModalSenderPercentChange = (val: string) => {
        setCashbackPercent(val);
        if (parseFloat(val) > 0) setCashbackFlat('');
    };

    const handleModalSenderFlatChange = (val: string) => {
        setCashbackFlat(val);
        if (parseFloat(val) > 0) setCashbackPercent('');
    };

    const handleModalReceiverPercentChange = (val: string) => {
        setReceivePercent(val);
        if (parseFloat(val) > 0) setReceiveFlat('');
    };

    const handleModalReceiverFlatChange = (val: string) => {
        setReceiveFlat(val);
        if (parseFloat(val) > 0) setReceivePercent('');
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { user_type, ...otherFilters } = filters;
            const params = new URLSearchParams({
                type: user_type,
                page: currentPage.toString(),
                per_page: itemsPerPage.toString(),
                search: search,
                ...otherFilters
            });
            const data = await apiFetch(`/admin/users?${params.toString()}`);
            if (data.data) {
                setUsers(data.data);
                setPagination({
                    total: data.total,
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page
                });
            } else {
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingTransactions = async () => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            const data = await apiFetch('/admin/funds/pending');
            setPendingTransactions(data);
        } catch (e) {
            console.error(e);
        }
    };

    const loadPendingRepayments = async () => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            const data = await apiFetch('/admin/repayments/pending');
            setPendingRepayments(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadPendingServiceFees = async () => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            const data: any = await apiFetch('/admin/support/payment-tickets?status=AGENT_APPROVED');
            setPendingServiceFees(data.data || []);
        } catch (e) {
            console.error("Failed to load service fee requests", e);
        }
    };

    const loadPendingPartnerRepayments = async () => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            const data = await apiFetch('/admin/loans/pending-partner-approvals');
            setPendingPartnerRepayments(data || []);
        } catch (e) {
            console.error("Failed to load partner repayments", e);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [currentPage, itemsPerPage, search, filters]);

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            loadPendingTransactions();
            loadPendingRepayments();
            loadPendingServiceFees();
            loadPendingPartnerRepayments();
        }
    }, [currentUser]);

    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch(`/admin/users/${selectedUser.id}/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    type: creditType,
                    description: description
                })
            });
            alert('Success!');
            setIsCreditsModalOpen(false);
            setAmount('');
            setDescription('');
            loadUsers();
            loadPendingTransactions();
        } catch (e) {
            console.error(e);
            alert('Error adding funds');
        }
    };

    const handleBulkCashback = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/admin/users/bulk-cashback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: selectedIds,
                    cashback_percentage: parseFloat(cashbackPercent) || 0,
                    cashback_flat_amount: parseFloat(cashbackFlat) || 0,
                    receive_cashback_percentage: parseFloat(receivePercent) || 0,
                    receive_cashback_flat_amount: parseFloat(receiveFlat) || 0
                })
            });

            alert('Success! Cashback settings updated.');
            setIsCashbackModalOpen(false);
            setCashbackPercent('');
            setCashbackFlat('');
            setReceivePercent('');
            setReceiveFlat('');
            setSelectedIds([]);
            loadUsers();
        } catch (e: any) {
            console.error(e);
            alert('Error updating cashback settings');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
    };

    const toggleStatus = async (user: any) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this user?`)) return;

        try {
            await apiFetch(`/admin/users/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadUsers();
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTicketDetail = async (ticketId: number) => {
        setIsLoadingTicket(true);
        try {
            const data = await apiFetch(`/admin/support/tickets/${ticketId}`);
            setViewingTicket(data);
            setTicketMessages(data.messages || []);
            setIsTicketModalOpen(true);
        } catch (e) {
            console.error("Failed to load ticket details", e);
            alert("Could not load ticket conversation");
        } finally {
            setIsLoadingTicket(false);
        }
    };

    const handleApproveTicket = async (ticketId: number) => {
        if (!confirm('Are you sure you want to approve this payment receipt?')) return;
        setActionLoading(true);
        try {
            await apiFetch(`/admin/support/tickets/${ticketId}/approve-payment`, { method: 'POST' });
            alert('Payment approved successfully!');
            setIsTicketModalOpen(false);
            setViewingTicket(null);
            loadPendingServiceFees();
            loadUsers();
        } catch (e: any) {
            alert(e.message || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingTicket || !rejectionReason.trim()) return;
        
        setActionLoading(true);
        try {
            await apiFetch(`/admin/support/tickets/${viewingTicket.id}/reject-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason })
            });
            alert('Payment rejected');
            setIsTicketModalOpen(false);
            setViewingTicket(null);
            setRejectionReason('');
            setShowRejectionInput(false);
            loadPendingServiceFees();
        } catch (e: any) {
            alert(e.message || 'Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    // Fixed: Use users directly from state as it's already paginated from server
    const displayedUsers = users;

    const toggleSelectAll = () => {
        if (selectedIds.length === displayedUsers.length && displayedUsers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(displayedUsers.map((u: any) => u.id));
        }
    };

    return (
        <AdminLayout title="User Management">

            {/* Pending Approvals Section (Admin Only) */}
            {isAdmin && (pendingTransactions.length > 0 || pendingRepayments.length > 0 || pendingServiceFees.length > 0 || pendingPartnerRepayments.length > 0) && (
                <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <Clock className="text-amber-500" />
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pending Actions</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Repayments Approval (EMIs & Platform Fees) */}
                        {pendingRepayments.map((rep: any) => (
                            <div key={`rep-${rep.id}`} className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-lg shadow-blue-500/5 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IndianRupee size={48} className="text-blue-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EMI/Repayment Approval</p>
                                            <p className="text-2xl font-black text-slate-900">₹{parseFloat(rep.amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 mb-1">{rep.loan?.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mb-4">{rep.loan?.display_id ? `Loan #${rep.loan.display_id}` : `ID: ${rep.loan_id}`}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Approve EMI repayment?")) return;
                                                await apiFetch(`/admin/repayments/${rep.id}/approve`, { method: 'POST' });
                                                loadPendingRepayments();
                                                loadUsers();
                                            }}
                                            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                        >
                                            Confirm
                                        </button>
                                        {rep.proof_image && (
                                            <button
                                                onClick={() => window.open(`https://api.msmeloan.sbs/storage/${rep.proof_image}`, '_blank')}
                                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                                            >
                                                Proof
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {pendingTransactions.map((tx: any) => (
                            <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-lg shadow-amber-500/5 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Clock size={48} className="text-amber-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fund Request</p>
                                            <p className="text-2xl font-black text-slate-900">₹{parseFloat(tx.amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 mb-1">{tx.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mb-4">{tx.user?.mobile_number}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Approve fund request?")) return;
                                                await apiFetch(`/admin/funds/${tx.id}/approve`, { method: 'POST' });
                                                loadPendingTransactions();
                                                loadUsers();
                                            }}
                                            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Reject fund request?")) return;
                                                await apiFetch(`/admin/funds/${tx.id}/reject`, { method: 'POST' });
                                                loadPendingTransactions();
                                            }}
                                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pendingServiceFees.map((ticket: any) => (
                            <div key={ticket.id} className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-lg shadow-blue-500/5 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ShieldCheck size={48} className="text-blue-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Fee ({ticket.sub_action || 'N/A'})</p>
                                            {ticket.payment_amount && (
                                                <p className="text-2xl font-black text-slate-900">₹{parseFloat(ticket.payment_amount).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 mb-1">{ticket.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mb-4">{ticket.user?.mobile_number}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fetchTicketDetail(ticket.id)}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <Eye size={12} /> View Proof
                                        </button>
                                        <button
                                            onClick={() => handleApproveTicket(ticket.id)}
                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <Check size={12} /> Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pendingPartnerRepayments.map((tx: any) => (
                            <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-lg shadow-indigo-500/5 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <UsersIcon size={48} className="text-indigo-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Repayment Approval</p>
                                            <p className="text-2xl font-black text-slate-900">₹{parseFloat(tx.amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 mb-1">{tx.borrower_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mb-4">Loan #{tx.loan_id + 4000}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!confirm("Approve this repayment?")) return;
                                                await apiFetch(`/admin/loans/partner-approval/${tx.id}/approve`, { method: 'POST' });
                                                loadPendingPartnerRepayments();
                                            }}
                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Actions */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    <div className="flex flex-1 items-center gap-3 px-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border",
                                showFilters ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative" ref={downloadDropdownRef}>
                            <button
                                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 border border-slate-700"
                            >
                                <Download className="w-5 h-5 text-emerald-400" />
                                <span>Bulk Data Download</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDownloadOptions ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showDownloadOptions && (
                                <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-2 flex flex-col gap-1.5">
                                        <button
                                            onClick={() => handleExport('all')}
                                            className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 rounded-xl transition-all text-sm group text-left w-full"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                                                <Database className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold">Download All</p>
                                                <p className="text-[10px] text-slate-500 leading-tight">Export all matching users based on current filters</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedIds.length === 0) {
                                                    alert("Please select users first");
                                                    return;
                                                }
                                                handleExport('selected');
                                            }}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group text-left w-full",
                                                selectedIds.length > 0 
                                                ? "text-slate-300 hover:bg-slate-800 hover:text-blue-400" 
                                                : "text-slate-600 cursor-not-allowed"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                selectedIds.length > 0 ? "bg-blue-500/10 group-hover:bg-blue-500/20" : "bg-slate-800/50"
                                            )}>
                                                <CheckSquare className={cn("w-5 h-5", selectedIds.length > 0 ? "text-blue-500" : "text-slate-600")} />
                                            </div>
                                            <div>
                                                <p className="font-bold">Download Selected</p>
                                                <p className="text-[10px] text-slate-500 leading-tight">
                                                    {selectedIds.length > 0 ? `${selectedIds.length} users selected for export` : 'Select users in the list to export'}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center bg-slate-50 border-none rounded-2xl px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={60}>60</option>
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                                <option value={5000}>5000</option>
                                <option value={10000}>10000</option>
                            </select>
                        </div>

                        {isAdmin && selectedIds.length > 0 && (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-10">
                                {selectedIds.length} Selected
                                <button
                                    onClick={() => setIsMaintenanceModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    <ShieldAlert size={20} />
                                    Maintenance Charge
                                </button>
                                <button
                                    onClick={() => setIsCashbackModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                >
                                    <ReceiptIndianRupee size={20} />
                                    Set Cashback
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.from_date}
                                        onChange={(e) => {setFilters({ ...filters, from_date: e.target.value }); setCurrentPage(1);}}
                                    />
                                    <span className="text-slate-300">-</span>
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.to_date}
                                        onChange={(e) => {setFilters({ ...filters, to_date: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wallet Balance Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.min_balance}
                                        onChange={(e) => {setFilters({ ...filters, min_balance: e.target.value }); setCurrentPage(1);}}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_balance}
                                        onChange={(e) => {setFilters({ ...filters, max_balance: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signup/Turnover Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.min_signup}
                                        onChange={(e) => {setFilters({ ...filters, min_signup: e.target.value }); setCurrentPage(1);}}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_signup}
                                        onChange={(e) => {setFilters({ ...filters, max_signup: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Postal PIN</label>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit PIN"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.pincode}
                                    onChange={(e) => {setFilters({ ...filters, pincode: e.target.value }); setCurrentPage(1);}}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort By</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.sort_by}
                                        onChange={(e) => {setFilters({ ...filters, sort_by: e.target.value }); setCurrentPage(1);}}
                                    >
                                        <option value="created_at">Join Date</option>
                                        <option value="name">Name</option>
                                        <option value="daily_turnover">Turnover</option>
                                        <option value="pincode">Postal PIN</option>
                                    </select>
                                    <select
                                        className="w-24 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.sort_order}
                                        onChange={(e) => {setFilters({ ...filters, sort_order: e.target.value }); setCurrentPage(1);}}
                                    >
                                        <option value="desc">Newest</option>
                                        <option value="asc">Oldest</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 w-16 text-center">
                                    {isAdmin && (
                                        <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100">
                                            {selectedIds.length > 0 && selectedIds.length === displayedUsers.length ?
                                                <CheckSquare className="text-blue-600" /> : <Square className="text-slate-400" />
                                            }
                                        </button>
                                    )}
                                </th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">User Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                <th className="p-6 text-xs font-bold text-yellow-500 uppercase tracking-widest">Cashback Wallet</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback % (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Flat Bonus (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Postal PIN</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">App Unlock PIN</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Referred By</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedUsers.map((user: any) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    selectedIds={selectedIds}
                                    toggleSelect={toggleSelect}
                                    toggleStatus={toggleStatus}
                                    handleDelete={handleDelete}
                                    setSelectedUser={setSelectedUser}
                                    setIsCreditsModalOpen={setIsCreditsModalOpen}
                                    reloadUsers={loadUsers}
                                    currentUser={currentUser}
                                    onVaultConfig={(u: any) => { setSelectedUserForVault(u); setIsVaultModalOpen(true); }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.last_page > 1 && (
                    <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                            </p>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Jump to:</span>
                                <input
                                    type="text"
                                    value={jumpPage}
                                    onChange={(e) => setJumpPage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const page = parseInt(jumpPage);
                                            if (page >= 1 && page <= pagination.last_page) {
                                                setCurrentPage(page);
                                                setJumpPage('');
                                            }
                                        }
                                    }}
                                    className="w-12 bg-transparent border-none text-xs font-black text-slate-900 outline-none text-center"
                                    placeholder="..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={pagination.current_page === 1}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Funds Modal */}
            {isCreditsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{isAdmin ? 'Add Funds' : 'Request Funds'}</h3>
                        <p className="text-slate-500 font-medium mb-6">
                            {isAdmin ? 'Add funds directly to' : 'Submit a request to add funds for'} <span className="text-slate-900 font-bold">{selectedUser?.name}</span>.
                        </p>

                        <form onSubmit={handleAddFunds}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transaction Type</label>
                                    <select
                                        value={creditType}
                                        onChange={(e) => setCreditType(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                                    >
                                        <option value="WALLET_TOPUP">Wallet Top-up</option>
                                        <option value="SERVICE_FEE">Service Fee Payment</option>
                                        <option value="OTHER">Other Adjustment</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Note</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                                        placeholder="Reason for this credit..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreditsModalOpen(false)}
                                    className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    {isAdmin ? 'Add Funds' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Cashback Modal (Admin Only) */}
            {isAdmin && isCashbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Cashback Settings</h3>
                        <p className="text-slate-500 font-medium mb-6">Configure guaranteed cashback for <span className="text-slate-900 font-bold">{selectedIds.length} users</span>.</p>

                        <form onSubmit={handleBulkCashback}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Pay/Sender Rules</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number" min="0" step="0.01"
                                            className={cn(
                                                "w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-purple-100",
                                                parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Flat ₹"
                                            value={cashbackFlat}
                                            onChange={e => handleModalSenderFlatChange(e.target.value)}
                                            disabled={parseFloat(cashbackPercent) > 0}
                                        />
                                        <input
                                            type="number" min="0" max="100" step="0.01"
                                            className={cn(
                                                "w-full bg-slate-50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-purple-100",
                                                parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Percent %"
                                            value={cashbackPercent}
                                            onChange={e => handleModalSenderPercentChange(e.target.value)}
                                            disabled={parseFloat(cashbackFlat) > 0}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Receive/Payee Rules</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="number" min="0" step="0.01"
                                            className={cn(
                                                "w-full bg-blue-50/50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100",
                                                parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Flat ₹"
                                            value={receiveFlat}
                                            onChange={e => handleModalReceiverFlatChange(e.target.value)}
                                            disabled={parseFloat(receivePercent) > 0}
                                        />
                                        <input
                                            type="number" min="0" max="100" step="0.01"
                                            className={cn(
                                                "w-full bg-blue-50/50 border-none rounded-2xl p-4 text-xl font-black text-slate-900 focus:ring-2 focus:ring-blue-100",
                                                parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="Percent %"
                                            value={receivePercent}
                                            onChange={e => handleModalReceiverPercentChange(e.target.value)}
                                            disabled={parseFloat(receiveFlat) > 0}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-4 font-bold px-1">
                                        Logic: (Amount * Rate%) + Flat Amount. P = Payer, R = Receiver.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCashbackModalOpen(false)}
                                    className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                >
                                    Save Rules
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Maintenance Charge Modal (Admin Only) */}
            {isAdmin && (
                <MaintenanceChargeModal
                    isOpen={isMaintenanceModalOpen}
                    onClose={() => setIsMaintenanceModalOpen(false)}
                    selectedUserIds={selectedIds}
                    onSuccess={() => {
                        loadUsers();
                        setSelectedIds([]);
                    }}
                />
            )}

            {/* Ticket Approval Modal (Chat + Screenshot) */}
            {isTicketModalOpen && viewingTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={() => !actionLoading && setIsTicketModalOpen(false)}></div>
                    
                    <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* Left Side: Proof / Screenshot */}
                        <div className="w-full md:w-1/2 bg-slate-100 flex flex-col border-r border-slate-200">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                                        <ShieldAlert className="text-blue-600" size={18} />
                                        PAYMENT PROOF
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewingTicket.unique_ticket_id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-blue-600">₹{parseFloat(viewingTicket.payment_amount || '0').toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{viewingTicket.sub_action || 'GENERAL'}</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-slate-50 relative group">
                                {ticketMessages.some(m => m.attachment_url) ? (
                                    <div className="space-y-4 w-full">
                                        {ticketMessages.filter(m => m.attachment_url).map((m, idx) => (
                                            <div key={idx} className="relative group/img">
                                                <img 
                                                    src={m.attachment_url.startsWith('http') ? m.attachment_url : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${m.attachment_url}`} 
                                                    alt="Payment Proof" 
                                                    className="max-w-full rounded-2xl shadow-xl border-4 border-white transform transition-transform group-hover/img:scale-[1.02]"
                                                />
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                                                    <p className="text-[9px] font-black text-slate-900 uppercase">Uploaded on {new Date(m.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FileText className="text-slate-300" size={32} />
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">No Screenshot found</h4>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">This payment might have been verified by agent through direct transaction ID or verbal confirmation.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Chat & Actions */}
                        <div className="w-full md:w-1/2 flex flex-col bg-white">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                                        {viewingTicket.user?.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 leading-tight">{viewingTicket.user?.name}</h4>
                                        <p className="text-xs font-bold text-slate-400 font-mono italic">{viewingTicket.user?.mobile_number}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsTicketModalOpen(false)}
                                    className="p-2.5 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                                <div className="text-center py-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 bg-slate-100 px-4 py-1 rounded-full border border-slate-200">Conversation History</span>
                                </div>
                                {ticketMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] group`}>
                                            <div className={`flex items-center gap-2 mb-1.5 ${msg.is_admin_reply ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    {msg.is_admin_reply ? 'Support Agent' : 'Customer'}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-300">•</span>
                                                <span className="text-[9px] font-bold text-slate-300 font-mono">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={`p-4 rounded-3xl text-[13px] font-bold shadow-sm leading-relaxed ${
                                                msg.is_admin_reply 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                                            }`}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 border-t border-slate-100 bg-white">
                                {showRejectionInput ? (
                                    <form onSubmit={handleRejectTicket} className="space-y-4 animate-in slide-in-from-bottom-4">
                                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <ShieldAlert size={14} /> Rejection Reason
                                            </p>
                                            <textarea
                                                autoFocus
                                                required
                                                className="w-full bg-white border border-rose-100 rounded-xl p-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-200 outline-none h-24 placeholder:font-medium"
                                                placeholder="Please specify why this payment is being rejected..."
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectionInput(false);
                                                    setRejectionReason('');
                                                }}
                                                className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-xl"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={actionLoading}
                                                className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setShowRejectionInput(true)}
                                            className="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <X size={16} strokeWidth={3} /> Reject Payment
                                        </button>
                                        <button
                                            onClick={() => handleApproveTicket(viewingTicket.id)}
                                            disabled={actionLoading}
                                            className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <BadgeCheck size={16} strokeWidth={2.5} /> {actionLoading ? 'Processing...' : 'Confirm Receipt'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-12 py-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-400 text-sm font-medium">© 2026 Admin Panel • MSME Loan Systems</p>
                <div className="flex gap-8">
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">Privacy Policy</a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">Terms of Service</a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">Help Center</a>
                </div>
            </footer>
            <VaultConfigModal
                isOpen={isVaultModalOpen}
                onClose={() => setIsVaultModalOpen(false)}
                user={selectedUserForVault}
                onSuccess={loadUsers}
            />
        </AdminLayout>
    );
}
