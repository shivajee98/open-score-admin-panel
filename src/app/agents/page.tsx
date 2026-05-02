'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Filter, Eye, Trash2, CheckCircle, Ban, ChevronLeft, ChevronRight, Download, CheckSquare, X, Users, TrendingUp, Store, FileText, CreditCard, ArrowRight, ChevronDown, Database } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/Toast';

const TeamEarningsCell = ({ agent, apiFetch, onUpdate }: any) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    
    // Form state for percentages
    const [pPercent, setPPercent] = useState(agent.cashback_percentage || 0);
    const [rPercent, setRPercent] = useState(agent.receive_cashback_percentage || 0);

    const loadStats = async () => {
        if (stats || loading) return;
        setLoading(true);
        try {
            const data = await apiFetch(`/admin/users/${agent.id}/agent-stats`);
            setStats(data);
        } catch (e) {
            console.error('Stats load fail', e);
        } finally {
            setLoading(false);
        }
    };

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left + rect.width / 2
            });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSaving(true);
        try {
            await apiFetch(`/admin/users/${agent.id}/cashback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cashback_percentage: parseFloat(pPercent) || 0,
                    receive_cashback_percentage: parseFloat(rPercent) || 0,
                    cashback_flat_amount: 0,
                    receive_cashback_flat_amount: 0
                })
            });
            toast.success("Agent rates updated!");
            if (onUpdate) onUpdate();
        } catch (e) {
            toast.error("Failed to update rates");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            ref={triggerRef}
            className="relative group inline-block"
            onMouseEnter={() => { 
                loadStats(); 
                updateCoords();
                setIsOpen(true); 
            }}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className="flex flex-col cursor-help">
                <span className="text-sm font-black text-violet-600 font-mono">
                    ₹{(stats?.earnings?.total || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-violet-400" /> Stats
                </span>
            </div>

            {/* The "Ball" Dialog Box rendered via Portal */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed z-[99999] pointer-events-none animate-in zoom-in-50 fade-in duration-300"
                    style={{ 
                        top: coords.top, 
                        left: coords.left,
                        transform: 'translate(-50%, -100%) translateY(-16px)'
                    }}
                >
                    <div className="w-72 h-72 bg-slate-900 border-4 border-violet-500/30 rounded-full shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] shadow-2xl flex flex-col items-center justify-center p-8 text-white relative overflow-hidden pointer-events-auto">
                        {/* Ball Shine Effect */}
                        <div className="absolute top-4 left-10 w-16 h-8 bg-white/5 rounded-full blur-xl -rotate-45" />
                        
                        {loading ? (
                            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
                        ) : (
                            <div className="w-full flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-violet-400">Total Earnings</p>
                                    <h4 className="text-2xl font-black font-mono">₹{(stats?.earnings?.total || 0).toLocaleString()}</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full mb-4 px-4 border-y border-white/5 py-3">
                                    <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase">QR</p>
                                        <p className="text-xs font-bold text-emerald-400">₹{stats?.earnings?.breakdown?.find((b:any)=>b.type?.includes('QR'))?.amount?.toLocaleString() || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase">Loans</p>
                                        <p className="text-xs font-bold text-blue-400">₹{stats?.earnings?.breakdown?.find((b:any)=>b.type?.includes('LOAN'))?.amount?.toLocaleString() || 0}</p>
                                    </div>
                                </div>

                                {/* Mini Form */}
                                <form onSubmit={handleUpdate} className="w-full space-y-2 pointer-events-auto">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <p className="text-[7px] font-black text-violet-300/50 uppercase mb-1">Pay %</p>
                                            <input 
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-center text-xs font-black outline-none focus:border-violet-500"
                                                value={pPercent}
                                                onChange={(e) => setPPercent(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[7px] font-black text-blue-300/50 uppercase mb-1">Recv %</p>
                                            <input 
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-center text-xs font-black outline-none focus:border-blue-500"
                                                value={rPercent}
                                                onChange={(e) => setRPercent(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-violet-600 hover:bg-violet-500 text-[8px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Update Rates'}
                                    </button>
                                </form>
                            </div>
                        )}
                        
                        {/* Tail */}
                        <div className="absolute top-[98%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-900" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};


// Sub-component for individual user rows to handle local input state
const UserRow = ({ user, selectedIds, toggleSelect, toggleStatus, handleUnlink, setSelectedUser, setIsCreditsModalOpen, reloadUsers, currentUser, onViewStats }: any) => {
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
                        <div className={cn(
                            "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
                            selectedIds.includes(user.id) ? "bg-blue-600 border-blue-600" : "border-slate-300 group-hover:border-slate-400"
                        )}>
                            {selectedIds.includes(user.id) && <CheckSquare className="w-5 h-5 text-white" />}
                        </div>
                    </button>
                )}
            </td>
            <td className="p-6 pl-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                            {(user.name || 'A')[0]}
                        </div>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{user.name || 'Unknown Agent'}</p>
                        <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                        {(user.kyc_verification?.aadhar_number || user.kyc_verification?.pan_number) && (
                            <div className="flex gap-2 mt-1">
                                {user.kyc_verification?.aadhar_number && (
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">A: {user.kyc_verification.aadhar_number}</span>
                                )}
                                {user.kyc_verification?.pan_number && (
                                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">P: {user.kyc_verification.pan_number}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-6">
                {user.my_referral_code ? (
                    <span className="inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 font-mono">
                        {user.my_referral_code}
                    </span>
                ) : (
                    <span className="text-xs text-slate-300 italic">None</span>
                )}
            </td>
            <td className="p-6">
                {user.parent_vendor ? (
                    <div className="flex flex-col">
                        <p className="text-xs font-black text-teal-700">{user.parent_vendor.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{user.parent_vendor.mobile}</p>
                        <p className="text-[10px] text-teal-500 font-mono font-bold">{user.parent_vendor.referral_code}</p>
                    </div>
                ) : (
                    <span className="text-xs text-slate-300 font-medium italic">No Parent</span>
                )}
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-yellow-600">₹{parseFloat(user.cashback_balance || '0').toLocaleString('en-IN')}</span>
            </td>
            <td className="p-6">
                <div className="flex flex-col text-[10px] font-mono">
                    <span className="text-purple-600">P: {user.cashback_percentage || 0}%</span>
                    <span className="text-blue-600">R: {user.receive_cashback_percentage || 0}%</span>
                </div>
            </td>
            <td className="p-6">
                <TeamEarningsCell agent={user} apiFetch={apiFetch} onUpdate={reloadUsers} />
            </td>
            <td className="p-6">
                <div className="flex flex-col">
                    <span className="font-mono font-black text-emerald-600 text-sm">₹{parseFloat(user.available_earnings || '0').toLocaleString('en-IN')}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                </div>
            </td>
            <td className="p-6">
                <div className="flex flex-col">
                    <span className="font-mono font-black text-amber-600 text-sm">₹{parseFloat(user.upcoming_earnings || '0').toLocaleString('en-IN')}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unverified</span>
                </div>
            </td>
            <td className="p-6">
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-slate-700">{new Date(user.date_of_join).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-mono italic">{new Date(user.date_of_join).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-sm font-bold text-slate-600">{user.status}</span>
                </div>
            </td>
            <td className="p-6 pr-8 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onViewStats(user)}
                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="View Referral Stats"
                    >
                        <TrendingUp className="w-5 h-5" />
                    </button>

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
                            title={user.status === 'SUSPENDED' ? 'Activate Agent' : 'Suspend Agent'}
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
                            onClick={() => handleUnlink(user.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Unlink & Archive Agent"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

// Loan status badge
const LoanStatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'DISBURSED': 'bg-emerald-100 text-emerald-700',
        'CLOSED': 'bg-slate-100 text-slate-600',
        'APPROVED': 'bg-blue-100 text-blue-700',
        'APPLIED': 'bg-amber-100 text-amber-700',
        'VETTING': 'bg-orange-100 text-orange-700',
        'CANCELLED': 'bg-rose-100 text-rose-600',
        'REJECTED': 'bg-red-100 text-red-700',
        'PREVIEW': 'bg-violet-100 text-violet-700',
    };
    return (
        <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", colors[status] || 'bg-slate-100 text-slate-500')}>
            {status}
        </span>
    );
};

export default function AgentsPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        min_balance: '',
        max_balance: '',
        min_available: '',
        max_available: '',
        min_upcoming: '',
        max_upcoming: '',
        min_signup: '',
        max_signup: '',
        pincode: '',
        sort_by: 'created_at',
        sort_order: 'desc'
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

    // Bulk Select
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Agent Stats Panel
    const [statsAgent, setStatsAgent] = useState<any>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsTab, setStatsTab] = useState<'merchants' | 'loans'>('merchants');
    const [loanPage, setLoanPage] = useState(1);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);

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
            query.append('type', 'agent');

            if (type === 'all') {
                if (search) query.append('search', search);
                // Include other active filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) query.append(key, value.toString());
                });
            } else {
                if (selectedIds.length === 0) {
                    alert("Please select agents first");
                    return;
                }
                query.append('user_ids', selectedIds.join(','));
            }

            const blob = await apiFetch(`/admin/users/export?${query.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = type === 'all' ? `agents_all_${new Date().toISOString().split('T')[0]}.csv` : `agents_selected_${selectedIds.length}_${new Date().toISOString().split('T')[0]}.csv`;
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

    const loadAgents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: 'agent',
                page: currentPage.toString(),
                per_page: itemsPerPage.toString(),
                search: search,
                ...filters
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

    useEffect(() => {
        loadAgents();
    }, [currentPage, itemsPerPage, search, filters]);

    const loadAgentStats = async (agentId: number, page: number = 1) => {
        setStatsLoading(true);
        try {
            const data = await apiFetch(`/admin/users/${agentId}/agent-stats?page=${page}&per_page=10`);
            setStatsData(data);
        } catch (e) {
            console.error('Failed to load agent stats', e);
        } finally {
            setStatsLoading(false);
        }
    };

    const onViewStats = (user: any) => {
        setStatsAgent(user);
        setStatsTab('merchants');
        setLoanPage(1);
        loadAgentStats(user.id, 1);
    };

    const handleLoanPageChange = (page: number) => {
        setLoanPage(page);
        if (statsAgent) loadAgentStats(statsAgent.id, page);
    };

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

            alert('Success! Funds added successfully.');
            setIsCreditsModalOpen(false);
            setAmount('');
            setDescription('');
            setCreditType('WALLET_TOPUP');
            loadAgents();
        } catch (e) {
            alert('Error adding funds');
        }
    };

    const handleUnlink = async (id: number) => {
        if (!confirm('Are you sure you want to unlink this agent? They will be reverted to a CUSTOMER role and their work history will be archived.')) return;
        try {
            await apiFetch(`/admin/users/${id}/unlink`, { method: 'POST' });
            loadAgents();
            toast.success("Agent unlinked and reverted to customer.");
        } catch (e: any) {
            toast.error(e.message || "Failed to unlink agent");
        }
    };

    const toggleStatus = async (user: any) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this agent?`)) return;

        try {
            await apiFetch(`/admin/users/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadAgents();
        } catch (e) {
            alert('Error updating status');
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

    const displayedUsers = users;

    const toggleSelectAll = () => {
        if (selectedIds.length === displayedUsers.length && displayedUsers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(displayedUsers.map((u: any) => u.id));
        }
    };

    return (
        <AdminLayout title="Agent Management">
            {/* Header Actions */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-6">
                    <div className="flex flex-1 gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:max-w-xs">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search Agents..."
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex items-center gap-3 px-4">
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
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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
                                                <p className="text-[10px] text-slate-500 leading-tight">Export all matching agents based on current filters</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedIds.length === 0) {
                                                    alert("Please select agents first");
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
                                                    {selectedIds.length > 0 ? `${selectedIds.length} agents selected for export` : 'Select agents in the list to export'}
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center bg-slate-50 border-none rounded-xl px-4 py-2">
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
                            </select>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.from_date}
                                        onChange={(e) => { setFilters({ ...filters, from_date: e.target.value }); setCurrentPage(1); }}
                                    />
                                    <span className="text-slate-300">-</span>
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.to_date}
                                        onChange={(e) => { setFilters({ ...filters, to_date: e.target.value }); setCurrentPage(1); }}
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
                                        onChange={(e) => { setFilters({ ...filters, min_balance: e.target.value }); setCurrentPage(1); }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_balance}
                                        onChange={(e) => { setFilters({ ...filters, max_balance: e.target.value }); setCurrentPage(1); }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Earnings Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.min_available}
                                        onChange={(e) => { setFilters({ ...filters, min_available: e.target.value }); setCurrentPage(1); }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_available}
                                        onChange={(e) => { setFilters({ ...filters, max_available: e.target.value }); setCurrentPage(1); }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upcoming Earnings Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.min_upcoming}
                                        onChange={(e) => { setFilters({ ...filters, min_upcoming: e.target.value }); setCurrentPage(1); }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_upcoming}
                                        onChange={(e) => { setFilters({ ...filters, max_upcoming: e.target.value }); setCurrentPage(1); }}
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
                                    onChange={(e) => { setFilters({ ...filters, pincode: e.target.value }); setCurrentPage(1); }}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort By</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.sort_by}
                                        onChange={(e) => { setFilters({ ...filters, sort_by: e.target.value }); setCurrentPage(1); }}
                                    >
                                        <option value="created_at">Join Date</option>
                                        <option value="name">Name</option>
                                        <option value="daily_turnover">Turnover</option>
                                        <option value="pincode">Postal PIN</option>
                                        <option value="available_earnings">Available Earnings</option>
                                        <option value="upcoming_earnings">Upcoming Earnings</option>
                                    </select>
                                    <select
                                        className="w-24 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.sort_order}
                                        onChange={(e) => { setFilters({ ...filters, sort_order: e.target.value }); setCurrentPage(1); }}
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
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center w-20">
                                    {isAdmin && (
                                        <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100">
                                            {selectedIds.length > 0 && selectedIds.length === displayedUsers.length ?
                                                <div className="w-5 h-5 rounded border-2 bg-blue-600 border-blue-600 flex items-center justify-center mx-auto">
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                </div> :
                                                <div className="w-5 h-5 rounded border-2 border-slate-300 mx-auto" />
                                            }
                                        </button>
                                    )}
                                </th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
                                    <div className="flex items-center gap-3">
                                        <span>Agent Details</span>
                                        {selectedIds.length > 0 && (
                                            <div className="px-2.5 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black animate-in fade-in zoom-in duration-300 shadow-lg shadow-indigo-200 ring-2 ring-indigo-50">
                                                {selectedIds.length} SELECTED
                                            </div>
                                        )}
                                    </div>
                                </th>
                                <th className="p-6 text-xs font-bold text-indigo-500 uppercase tracking-widest">Refer Code</th>
                                <th className="p-6 text-xs font-bold text-teal-500 uppercase tracking-widest">Parent Vendor</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Wallet</th>
                                <th className="p-6 text-xs font-bold text-yellow-500 uppercase tracking-widest">Cashback</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback %</th>
                                <th className="p-6 text-xs font-bold text-violet-500 uppercase tracking-widest">Team Earnings</th>
                                <th className="p-6 text-xs font-bold text-emerald-500 uppercase tracking-widest">Available</th>
                                <th className="p-6 text-xs font-bold text-amber-500 uppercase tracking-widest">Upcoming</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="p-20 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                                        </div>
                                    </td>
                                </tr>
                            ) : displayedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm italic">
                                        No agents found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                displayedUsers.map((user: any) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        selectedIds={selectedIds}
                                        toggleSelect={toggleSelect}
                                        toggleStatus={toggleStatus}
                                        handleUnlink={handleUnlink}
                                        setSelectedUser={setSelectedUser}
                                        setIsCreditsModalOpen={setIsCreditsModalOpen}
                                        reloadUsers={loadAgents}
                                        currentUser={currentUser}
                                        onViewStats={onViewStats}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

            {/* Agent Referral Stats Panel */}
            {statsAgent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
                        {/* Header */}
                        <div className="p-8 pb-0 flex-shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center font-black text-xl text-indigo-600">
                                        {(statsAgent.name || 'A')[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{statsAgent.name}</h2>
                                        <p className="text-sm text-slate-500 font-medium">{statsAgent.mobile_number}</p>
                                        {statsAgent.my_referral_code && (
                                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 font-mono mt-1">
                                                {statsAgent.my_referral_code}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => { setStatsAgent(null); setStatsData(null); }} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            {/* Parent Vendor Info */}
                            {statsData?.agent?.parent_vendor && (
                                <div className="bg-teal-50 px-5 py-3 rounded-2xl mb-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-teal-200 rounded-lg flex items-center justify-center text-teal-700 font-bold text-sm">
                                        {statsData.agent.parent_vendor.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-teal-800">Parent Vendor: {statsData.agent.parent_vendor.name}</p>
                                        <p className="text-[10px] text-teal-600 font-mono">{statsData.agent.parent_vendor.mobile} · {statsData.agent.parent_vendor.referral_code}</p>
                                    </div>
                                </div>
                            )}

                            {/* Earnings Summary */}
                            {statsData && !statsLoading && (
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-emerald-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Earnings</p>
                                        <p className="text-lg font-black text-emerald-700 font-mono">₹{(statsData.earnings?.total || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">QR Merchants</p>
                                        <p className="text-lg font-black text-blue-700">{statsData.qr_mapped_count || 0}</p>
                                    </div>
                                    <div className="bg-violet-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Loan Referrals</p>
                                        <p className="text-lg font-black text-violet-700">{statsData.loan_referrals?.total || 0}</p>
                                    </div>
                                </div>
                            )}

                            {/* Earnings Breakdown */}
                            {statsData?.earnings?.breakdown?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {statsData.earnings.breakdown.map((item: any) => (
                                        <div key={item.type} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <span className="text-[10px] font-bold text-slate-500">{item.label}</span>
                                            <span className="text-[10px] font-black text-slate-700 font-mono">₹{item.amount.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tab Switcher */}
                            <div className="flex border-b border-slate-100">
                                <button
                                    onClick={() => setStatsTab('merchants')}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2",
                                        statsTab === 'merchants' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <Store className="w-4 h-4" />
                                    QR Merchants ({statsData?.qr_mapped_count || 0})
                                </button>
                                <button
                                    onClick={() => setStatsTab('loans')}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2",
                                        statsTab === 'loans' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <FileText className="w-4 h-4" />
                                    Loan Referrals ({statsData?.loan_referrals?.total || 0})
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 pt-4">
                            {statsLoading ? (
                                <div className="flex justify-center py-16">
                                    <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                                </div>
                            ) : statsTab === 'merchants' ? (
                                /* QR Mapped Merchants Tab */
                                <div className="space-y-2">
                                    {(statsData?.qr_mapped_merchants || []).length === 0 ? (
                                        <p className="text-center text-slate-400 text-sm font-bold py-12 italic">No merchants have used this agent&apos;s referral code for QR mapping yet.</p>
                                    ) : (
                                        (statsData?.qr_mapped_merchants || []).map((merchant: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600">
                                                    {(merchant.name || 'M')[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{merchant.name || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{merchant.mobile}</p>
                                                    {merchant.business_name && <p className="text-[10px] text-slate-400 truncate">{merchant.business_name}</p>}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-black text-emerald-600 font-mono">+₹{merchant.bonus_amount?.toLocaleString('en-IN')}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(merchant.mapped_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                                </div>
                                                <Link href={`/users/detail?id=${merchant.id}`} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0">
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                /* Loan Referrals Tab */
                                <div className="space-y-2">
                                    {(statsData?.loan_referrals?.data || []).length === 0 ? (
                                        <p className="text-center text-slate-400 text-sm font-bold py-12 italic">No users have used this agent&apos;s referral code for loans yet.</p>
                                    ) : (
                                        <>
                                            {(statsData?.loan_referrals?.data || []).map((loan: any) => (
                                                <div key={loan.loan_id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center font-bold text-violet-600">
                                                        {(loan.user?.name || 'U')[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{loan.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{loan.user?.mobile}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-black text-slate-700 font-mono">₹{loan.amount?.toLocaleString('en-IN')}</p>
                                                        <p className="text-[10px] text-slate-400">{loan.plan_name}</p>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <LoanStatusBadge status={loan.status} />
                                                    </div>
                                                    <div className="flex-shrink-0 text-right">
                                                        <p className="text-[10px] text-slate-400">{new Date(loan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                                    </div>
                                                    {loan.user && (
                                                        <Link href={`/users/detail?id=${loan.user.id}`} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Loan Referrals Pagination */}
                                            {statsData?.loan_referrals?.last_page > 1 && (
                                                <div className="flex items-center justify-between pt-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Page {statsData.loan_referrals.current_page} / {statsData.loan_referrals.last_page} ({statsData.loan_referrals.total} total)
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleLoanPageChange(loanPage - 1)}
                                                            disabled={loanPage <= 1}
                                                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleLoanPageChange(loanPage + 1)}
                                                            disabled={loanPage >= statsData.loan_referrals.last_page}
                                                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Funds Modal */}
            {isCreditsModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Funds</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Credits For: {selectedUser.name}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddFunds} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-slate-900 transition-all"
                                    value={amount}
                                    placeholder="0.00"
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Memo</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-slate-900 transition-all size-24 resize-none"
                                    value={description}
                                    placeholder="e.g. Performance Bonus"
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreditsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-3 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                >
                                    Add Funds Now
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
