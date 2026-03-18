'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UserPlus, Plus, Shield, Users as UsersIcon, Wallet, ArrowRight, TrendingUp, TreePine, Search, Filter, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';

interface SubUser {
    id: number;
    name: string;
    mobile_number: string;
    email: string | null;
    referral_code: string;
    credit_balance: number;
    credit_limit: number;
    earnings_balance: number;
    default_signup_amount: number;
    admin_loan_commission: number;
    bonus_milestone_count?: number;
    bonus_milestone_amount?: number;
    loan_bonus_milestone_count?: number;
    loan_bonus_milestone_amount?: number;
    can_create_vendors?: boolean;
    show_letter?: boolean;
    is_active: boolean;
    kyc_verification?: {
        status?: 'approved' | 'pending' | 'rejected';
    };
    visible_pin?: string;
    pincode?: string;
}

const normalizeKycStatus = (status?: string): 'approved' | 'pending' | 'rejected' | undefined => {
    if (!status) return undefined;
    const normalized = status.trim().toLowerCase();
    if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
        return normalized as 'approved' | 'pending' | 'rejected';
    }
    return undefined;
};

export default function SubUsersPage() {
    const { counts } = useAdminNotifications();
    const router = useRouter();
    const [subUsers, setSubUsers] = useState<SubUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSubUser, setSelectedSubUser] = useState<SubUser | null>(null);

    // Filters and Pagination
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        min_balance: '',
        max_balance: '',
        min_signup: '',
        max_signup: '',
        pincode: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 15
    });

    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        password: '',
        credit_limit: '',
        default_signup_amount: '',
        admin_loan_commission: '',
        bonus_milestone_count: '',
        bonus_milestone_amount: '',
        loan_bonus_milestone_count: '',
        loan_bonus_milestone_amount: '',
        can_create_vendors: false,
        show_letter: false,
        pincode: ''
    } as any);

    const [jumpPage, setJumpPage] = useState('');

    const [creditAmount, setCreditAmount] = useState('');
    const [globalReferralSettings, setGlobalReferralSettings] = useState<any>(null);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const toggleSelectAll = () => {
        if (selectedIds.length === subUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(subUsers.map(u => u.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchSubUsers();
    }, [pagination.current_page, pagination.per_page, filters, search]);

    useEffect(() => {
        fetchGlobalSettings();
    }, []);

    const fetchGlobalSettings = async () => {
        try {
            const data = await apiFetch('/admin/referral-settings');
            setGlobalReferralSettings(data);
        } catch (e) {
            console.error('Failed to load referral settings');
        }
    };

    const handleSaveGlobal = async () => {
        setSavingGlobal(true);
        try {
            await apiFetch('/admin/referral-settings', {
                method: 'PUT',
                body: JSON.stringify(globalReferralSettings)
            });
            toast.success('Agent global settings updated');
        } catch (e: any) {
            toast.error('Failed to update settings');
        } finally {
            setSavingGlobal(false);
        }
    };

    const fetchSubUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.current_page.toString(),
                per_page: pagination.per_page.toString(),
                search: search,
                ...filters
            });
            const data = await apiFetch(`/admin/sub-users?${params.toString()}`);
            setSubUsers(data.data || []);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                total: data.total,
                per_page: data.per_page
            });
        } catch (e) {
            toast.error('Failed to load Vendors');
        } finally {
            setLoading(false);
        }
    };

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // ... existing state ...

    const handleEditSubUser = (subUser: SubUser) => {
        setFormData({
            name: subUser.name,
            mobile_number: subUser.mobile_number,
            credit_limit: (subUser.credit_limit ?? 0).toString(),
            default_signup_amount: (subUser.default_signup_amount ?? 0).toString(),
            admin_loan_commission: (subUser.admin_loan_commission ?? 0).toString(),
            bonus_milestone_count: (subUser.bonus_milestone_count ?? 0).toString(),
            bonus_milestone_amount: (subUser.bonus_milestone_amount ?? 0).toString(),
            loan_bonus_milestone_count: (subUser.loan_bonus_milestone_count ?? 0).toString(),
            loan_bonus_milestone_amount: (subUser.loan_bonus_milestone_amount ?? 0).toString(),
            can_create_vendors: subUser.can_create_vendors ?? false,
            show_letter: subUser.show_letter ?? false,
            password: subUser.visible_pin || '', // Using password field for PIN in form
            pincode: subUser.pincode || ''
        });
        setEditingId(subUser.id);
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditMode ? `/admin/sub-users/${editingId}` : '/admin/sub-users';
            const method = isEditMode ? 'PUT' : 'POST';

            // For edit, remove password if empty
            const payload: any = { ...formData };
            if (isEditMode && !payload.password) {
                delete payload.password;
            }

            await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            toast.success(isEditMode ? 'Agent updated successfully' : 'Agent created successfully');
            setShowModal(false);
            setFormData({ name: '', mobile_number: '', password: '', credit_limit: '', default_signup_amount: '', admin_loan_commission: '', bonus_milestone_count: '', bonus_milestone_amount: '', loan_bonus_milestone_count: '', loan_bonus_milestone_amount: '', can_create_vendors: false, show_letter: false, pincode: '' } as any);
            setIsEditMode(false);
            setEditingId(null);
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Operation failed');
        }
    };

    const handleAddCredit = async (subUserId: number) => {
        if (!creditAmount || parseFloat(creditAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        try {
            await apiFetch(`/admin/sub-users/${subUserId}/credit`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(creditAmount) })
            });
            toast.success('Credit added successfully');
            setCreditAmount('');
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to add credit');
        }
    };

    const handleKycAction = async (subUserId: number, action: 'approve' | 'reject' | 're_kyc') => {
        try {
            if (action === 'approve' || action === 'reject') {
                await apiFetch(`/admin/sub-users/${subUserId}/kyc-review`, {
                    method: 'POST',
                    body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' })
                });
                toast.success(`Agent KYC marked as ${action.toUpperCase()}`);
            } else if (action === 're_kyc') {
                if (window.confirm('Are you sure you want to lock this agent out and ask for Re-KYC?')) {
                    await apiFetch(`/admin/sub-users/${subUserId}/re-kyc`, {
                        method: 'POST'
                    });
                    toast.success('Agent locked for Re-KYC.');
                } else {
                    return;
                }
            }
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update KYC status');
        }
    };

    return (
        <AdminLayout title="Vendor Management">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 gap-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 px-1">Vendor Network</h2>
                    <p className="text-slate-500 text-sm font-medium px-1">Manage vendors and their credit limits.</p>
                </div>
                <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, code..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination(prev => ({ ...prev, current_page: 1 }));
                            }}
                        />
                    </div>
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

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/sub-users/tree')}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                        <TreePine className="w-5 h-5" />
                        Vendor Tree
                    </button>
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                        >
                            <Download className="w-5 h-5" />
                            Bulk Download
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden hidden group-hover:block z-50">
                            <button
                                onClick={async () => {
                                    try {
                                        const params = new URLSearchParams({ search, ...filters });
                                        const blob = await apiFetch(`/admin/sub-users/export?${params.toString()}`, { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `vendors_all_${new Date().toISOString().split('T')[0]}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                        window.URL.revokeObjectURL(url);
                                    } catch (e) {
                                        console.error('Export failed', e);
                                        alert('Export failed.');
                                    }
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Download All Matching
                            </button>
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const blob = await apiFetch(`/admin/sub-users/export?user_ids=${selectedIds.join(',')}`, { responseType: 'blob' });
                                            const url = window.URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.setAttribute('download', `vendors_selected_${selectedIds.length}_${new Date().toISOString().split('T')[0]}.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                            window.URL.revokeObjectURL(url);
                                        } catch (e) {
                                            console.error('Export failed', e);
                                            alert('Export failed.');
                                        }
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50"
                                >
                                    Download Selected ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-50 border-none rounded-xl px-4 py-2">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                        <select
                            value={pagination.per_page}
                            onChange={(e) => {
                                setPagination(prev => ({ ...prev, per_page: Number(e.target.value), current_page: 1 }));
                            }}
                            className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                        >
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={60}>60</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value={5000}>5000</option>
                            <option value={10000}>10000</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setIsEditMode(false);
                            setFormData({ name: '', mobile_number: '', password: '', credit_limit: '', default_signup_amount: '', admin_loan_commission: '', bonus_milestone_count: '', bonus_milestone_amount: '', loan_bonus_milestone_count: '', loan_bonus_milestone_amount: '', can_create_vendors: globalReferralSettings?.default_can_create_vendors ?? false, show_letter: false, pincode: '' } as any);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus className="w-5 h-5" />
                        Create Agent
                    </button>
                </div>

                {/* Global Toggle for Vendor Creation */}
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 h-full">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Global Permission</span>
                        <span className="text-xs font-bold text-slate-700">Sub-Vendor Creation</span>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            const newVal = !globalReferralSettings.default_can_create_vendors;
                            setGlobalReferralSettings({ ...globalReferralSettings, default_can_create_vendors: newVal });
                            try {
                                await apiFetch('/admin/referral-settings', {
                                    method: 'PUT',
                                    body: JSON.stringify({ ...globalReferralSettings, default_can_create_vendors: newVal })
                                });
                                toast.success(newVal ? 'Vendor creation ENABLED for all agents' : 'Vendor creation DISABLED for all agents');
                                fetchSubUsers(); // Refresh to show bulk update
                            } catch (e) {
                                toast.error('Sync failed');
                                setGlobalReferralSettings({ ...globalReferralSettings, default_can_create_vendors: !newVal });
                            }
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${globalReferralSettings?.default_can_create_vendors ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${globalReferralSettings?.default_can_create_vendors ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.from_date}
                                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="date"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.to_date}
                                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
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
                                    onChange={(e) => setFilters({ ...filters, min_balance: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.max_balance}
                                    onChange={(e) => setFilters({ ...filters, max_balance: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signup Amount Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.min_signup}
                                    onChange={(e) => setFilters({ ...filters, min_signup: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.max_signup}
                                    onChange={(e) => setFilters({ ...filters, max_signup: e.target.value })}
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
                                onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort By</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.sort_by}
                                    onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                                >
                                    <option value="created_at">Joining Date</option>
                                    <option value="name">Name</option>
                                    <option value="credit_balance">Wallet Balance</option>
                                    <option value="default_signup_amount">Signup Amount</option>
                                    <option value="pincode">Postal PIN</option>
                                </select>
                                <select
                                    className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.sort_order}
                                    onChange={(e) => setFilters({ ...filters, sort_order: e.target.value })}
                                >
                                    <option value="desc">Desc</option>
                                    <option value="asc">Asc</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => {
                                setFilters({
                                    from_date: '',
                                    to_date: '',
                                    min_balance: '',
                                    max_balance: '',
                                    min_signup: '',
                                    max_signup: '',
                                    pincode: '',
                                    sort_by: 'created_at',
                                    sort_order: 'desc'
                                });
                                setSearch('');
                            }}
                            className="text-xs font-black text-rose-600 uppercase tracking-widest hover:text-rose-700 transition-colors"
                        >
                            Reset All Filters
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 pl-8">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedIds.length === subUsers.length && subUsers.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Vendor Details</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">KYC Status</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Referral Code</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Postal PIN</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Credit Wallet / Limit</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Commission</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Dues</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm italic">
                                            No agents created in the system yet.
                                        </td>
                                    </tr>
                                ) : (
                                    subUsers.map((subUser) => {
                                        const normalizedKycStatus = normalizeKycStatus(subUser.kyc_verification?.status);
                                        const showPendingDot = normalizedKycStatus === 'pending';
                                        return (
                                            <tr key={subUser.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="p-6 pl-8">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedIds.includes(subUser.id)}
                                                        onChange={() => toggleSelect(subUser.id)}
                                                    />
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border-2 border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                                {subUser.name[0]}
                                                            </div>
                                                            {showPendingDot && (
                                                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)] border-2 border-white"></span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-base">{subUser.name}</h3>
                                                            <div className="flex flex-col gap-1 mt-1">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                    <UsersIcon className="w-3 h-3 text-blue-500" />
                                                                    Agent #{subUser.id} • {subUser.mobile_number}
                                                                </div>
                                                                {subUser.pincode && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-md">
                                                                        <Calendar className="w-3 h-3" />
                                                                        Postal PIN: {subUser.pincode}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    {normalizedKycStatus === 'approved' ? (
                                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Approved</span>
                                                    ) : normalizedKycStatus === 'pending' ? (
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleKycAction(subUser.id, 'approve')} className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 font-bold">Approve</button>
                                                                <button onClick={() => handleKycAction(subUser.id, 'reject')} className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded hover:bg-rose-600 font-bold">Reject</button>
                                                            </div>
                                                        </div>
                                                    ) : normalizedKycStatus === 'rejected' ? (
                                                        <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Rejected / Wait</span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Not Submitted</span>
                                                    )}
                                                </td>
                                                <td className="p-6">
                                                    <span className="font-mono text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-black border border-slate-200">
                                                        {subUser.referral_code}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    {subUser.pincode ? (
                                                        <span className="font-mono text-xs bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-black border border-blue-100">
                                                            {subUser.pincode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900">₹{(subUser.credit_balance ?? 0).toLocaleString()}</span>
                                                        <span className="text-slate-300">/</span>
                                                        <span className="text-xs font-bold text-slate-400">₹{(subUser.credit_limit ?? 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <input
                                                            type="number"
                                                            placeholder="Add..."
                                                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={selectedSubUser?.id === subUser.id ? creditAmount : ''}
                                                            onChange={(e) => {
                                                                setSelectedSubUser(subUser);
                                                                setCreditAmount(e.target.value);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleAddCredit(subUser.id)}
                                                            className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                                                            title="Add Credit"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-black text-emerald-600 text-sm">₹{(subUser.admin_loan_commission ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">(Disburse)</span></span>
                                                        <span className="font-bold text-slate-500 text-xs">₹{(subUser.default_signup_amount ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400 ml-1 uppercase">(Signup)</span></span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-rose-600 text-base tabular-nums truncate max-w-[120px]" title={`₹${(subUser.earnings_balance ?? 0).toLocaleString()}`}>
                                                            ₹{(subUser.earnings_balance ?? 0).toLocaleString()}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending Payout</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 pr-8 text-right">
                                                    <div className="flex justify-end gap-2 flex-wrap">
                                                        {normalizedKycStatus === 'approved' && (
                                                            <button
                                                                onClick={() => handleKycAction(subUser.id, 're_kyc')}
                                                                className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs hover:bg-amber-100 transition-colors border border-amber-200"
                                                            >
                                                                Ask for Re-KYC
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditSubUser(subUser)}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm(`Are you sure you want to delete ${subUser.name}?`)) {
                                                                    try {
                                                                        await apiFetch(`/admin/sub-users/${subUser.id}`, { method: 'DELETE' });
                                                                        toast.success('Agent deleted successfully');
                                                                        fetchSubUsers();
                                                                    } catch (e: any) {
                                                                        toast.error(e.message || 'Deletion failed');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/sub-users/detail?id=${subUser.id}`)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors group/btn"
                                                        >
                                                            View <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.last_page > 1 && (
                        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total vendors)
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jump to</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={pagination.last_page}
                                        value={jumpPage}
                                        onChange={(e) => setJumpPage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const page = parseInt(jumpPage);
                                                if (page >= 1 && page <= pagination.last_page) {
                                                    setPagination(prev => ({ ...prev, current_page: page }));
                                                    setJumpPage('');
                                                }
                                            }
                                        }}
                                        placeholder="..."
                                        className="w-12 text-center bg-slate-50 border-none text-xs font-bold text-slate-900 focus:ring-0 rounded-lg p-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                                        disabled={pagination.current_page === 1}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(pagination.last_page, prev.current_page + 1) }))}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEditMode ? 'Edit Agent' : 'Create Agent'}</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{isEditMode ? 'Update Profile Details' : 'New Sub-User Profile'}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.name}
                                    placeholder="e.g. John Agent"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.mobile_number}
                                    placeholder="10-digit mobile number"
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData({ ...formData, mobile_number: value });
                                    }}
                                    readOnly={isEditMode} // Cannot change mobile as it matches ID often
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Postal PIN (6 digits)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.pincode}
                                    placeholder="e.g. 110001"
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setFormData({ ...formData, pincode: value });
                                    }}
                                />
                            </div>

                            {isEditMode && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agent PIN (4-6 digits)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-blue-700 transition-all placeholder:text-blue-300"
                                        value={formData.password}
                                        placeholder="Enter new PIN"
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setFormData({ ...formData, password: value });
                                        }}
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Changes take effect immediately upon saving.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.credit_limit}
                                        placeholder="50000"
                                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Onboarding QR</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.default_signup_amount}
                                        placeholder="250"
                                        onChange={(e) => setFormData({ ...formData, default_signup_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Disbursement Commission (Admin to Agent)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.admin_loan_commission}
                                    placeholder="2000"
                                    onChange={(e) => setFormData({ ...formData, admin_loan_commission: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bonus Milestone Count</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.bonus_milestone_count}
                                        placeholder="10"
                                        onChange={(e) => setFormData({ ...formData, bonus_milestone_count: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bonus Milestone Amount</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.bonus_milestone_amount}
                                        placeholder="200"
                                        onChange={(e) => setFormData({ ...formData, bonus_milestone_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Milestone Count</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.loan_bonus_milestone_count}
                                        placeholder="10"
                                        onChange={(e) => setFormData({ ...formData, loan_bonus_milestone_count: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Milestone Amount</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.loan_bonus_milestone_amount}
                                        placeholder="200"
                                        onChange={(e) => setFormData({ ...formData, loan_bonus_milestone_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            {/* Vendor Creation Permission Toggle */}
                            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div>
                                    <p className="text-sm font-black text-indigo-900">Can Create Sub-Vendors</p>
                                    <p className="text-[10px] text-indigo-500 font-bold">Allow this agent to create child vendors in hierarchy</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, can_create_vendors: !formData.can_create_vendors })}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${formData.can_create_vendors ? 'bg-indigo-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${formData.can_create_vendors ? 'translate-x-7' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            {/* Show Letter Toggle */}
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div>
                                    <p className="text-sm font-black text-amber-900">Show Auth Letter</p>
                                    <p className="text-[10px] text-amber-500 font-bold">Allow vendor to view their authorization letter</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, show_letter: !formData.show_letter })}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${formData.show_letter ? 'bg-amber-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${formData.show_letter ? 'translate-x-7' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                                >
                                    {isEditMode ? 'Update Agent' : 'Confirm Create'}
                                </button>
                            </div>
                        </form>
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
        </AdminLayout>
    );
}
