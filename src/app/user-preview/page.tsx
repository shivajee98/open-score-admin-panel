'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Search, User, Smartphone, Monitor, ChevronRight, Loader2, ArrowLeft, RefreshCw, LogOut, ShieldCheck, History, CreditCard, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
    id: number;
    name: string;
    mobile_number: string;
    role: string;
    status: string;
    profile_image?: string;
    business_name?: string;
}

export default function UserPreviewPage() {
    const [search, setSearch] = useState('');
    const [userType, setUserType] = useState('ALL');
    const [searchResults, setSearchResults] = useState<UserData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [impersonateToken, setImpersonateToken] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const fetchResults = async () => {
            if (search.length < 3) {
                setSearchResults([]);
                setShowDropdown(false);
                return;
            }

            setIsSearching(true);
            try {
                const typeParam = userType === 'ALL' ? 'customer,agent,merchant,student' : userType.toLowerCase();
                const data = await apiFetch(`/admin/users?search=${search}&type=${typeParam}`);
                setSearchResults(data.data || []);
                setShowDropdown(true);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchResults, 400);
        return () => clearTimeout(timer);
    }, [search, userType]);

    const handleSelectUser = (user: UserData) => {
        setSelectedUser(user);
        setSearch(user.mobile_number);
        setShowDropdown(false);
        toast.info(`Selected ${user.name}`);
    };

    const handleImpersonate = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            const data = await apiFetch(`/admin/users/${selectedUser.id}/impersonate`);
            if (data.access_token) {
                setImpersonateToken(data.access_token);
                setViewMode(true);
                toast.success(`Accessing profile: ${selectedUser.name}`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://app.msmeloan.sbs';
    const previewUrl = impersonateToken ? `${frontendUrl}?token=${impersonateToken}&admin_preview=true` : '';

    if (viewMode && previewUrl) {
        return (
            <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col md:flex-row font-sans selection:bg-indigo-500/30">
                {/* Asymmetric Control Bar */}
                <div className="bg-[#0f172a] w-full md:w-[340px] border-b md:border-b-0 md:border-r border-slate-800/60 p-6 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setViewMode(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-800/40 hover:bg-slate-700/60 rounded-2xl transition-all text-slate-400 hover:text-white group"
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <h1 className="font-black text-xl text-white tracking-tight">Lens View</h1>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Secure Link Active" />
                        </div>

                        {/* Profile Summary Card */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-[#020617]/80 backdrop-blur-xl rounded-3xl p-5 border border-slate-800/50 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                                        <User className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="font-black text-white text-base leading-tight">{selectedUser?.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedUser?.role}</p>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <p className="text-[10px] font-bold text-slate-500">{selectedUser?.status}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 grid grid-cols-2 gap-3 border-t border-slate-800/50">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-600 uppercase">Identity</p>
                                        <p className="text-xs font-bold text-slate-300">ID #{selectedUser?.id}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-slate-600 uppercase">Platform</p>
                                        <p className="text-xs font-bold text-slate-300 truncate">{process.env.NEXT_PUBLIC_SITE_NAME || 'OpenScore'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="space-y-4">
                            <div className="px-1 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Quick Actions</p>
                                <div className="h-px flex-1 bg-slate-800/50 ml-4" />
                            </div>

                            <div className="grid gap-2">
                                <button
                                    onClick={() => {
                                        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                                        if (iframe) iframe.src = iframe.src;
                                    }}
                                    className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/60 rounded-2xl text-slate-300 hover:text-white transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="w-4 h-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
                                        <b className="text-sm font-bold">Synchronize</b>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </button>

                                <button
                                    onClick={() => setViewMode(false)}
                                    className="w-full flex items-center justify-between p-4 bg-rose-500/5 hover:bg-rose-500/10 rounded-2xl text-rose-400/80 hover:text-rose-400 transition-all border border-rose-500/10 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        <b className="text-sm font-bold">Terminate Session</b>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block pt-6">
                        <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/30">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500/60" />
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status</p>
                                    <p className="text-[11px] font-bold text-slate-400 mt-1">Encrypted Admin Overlay</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main View Container */}
                <div className="flex-1 bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Abstract background elements */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[160px]" />

                    <div className="relative z-10 scale-[0.85] lg:scale-100 transition-transform duration-500">
                        {/* Realistic Mockup Frame */}
                        <div className="w-[375px] h-[812px] bg-black rounded-[60px] border-[12px] border-[#1e293b] shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#1e293b] rounded-b-3xl z-20 flex items-center justify-center">
                                <div className="w-12 h-1 bg-black/40 rounded-full" />
                            </div>

                            <iframe
                                id="preview-iframe"
                                src={previewUrl}
                                className="w-full h-full border-none bg-white"
                                title="Admin Mobile Preview"
                            />

                            {/* Home Indicator */}
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full z-20" />
                        </div>

                        {/* Data HUD */}
                        <div className="absolute -left-32 top-10 flex flex-col gap-4">
                            <div className="p-4 bg-[#0f172a]/80 backdrop-blur border border-slate-800 rounded-3xl shadow-2xl">
                                <Activity className="w-5 h-5 text-indigo-400 mb-2" />
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Stream</p>
                                    <p className="text-[10px] font-bold text-slate-300">Live 60fps</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout title="System Insight">
            <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-1 bg-indigo-500 rounded-full" />
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-indigo-500">Preview Engine</p>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Select <br className="hidden md:block" /> Target User</h1>
                    </div>

                    <div className="flex-1 max-w-xl space-y-4">
                        <div className="bg-slate-100/50 p-1.5 rounded-2xl flex">
                            {['ALL', 'CUSTOMER', 'MERCHANT', 'AGENT'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setUserType(type)}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${userType === type
                                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Integrated Search Bar with Autocomplete */}
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition-opacity duration-300"></div>
                                <div className="relative flex items-center">
                                    <Search className="absolute left-5 text-slate-400 transition-colors group-focus-within:text-indigo-500" size={20} />
                                    <input
                                        type="tel"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-16 font-bold text-slate-900 text-lg shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 placeholder:text-slate-300"
                                        placeholder="Search name or mobile..."
                                    />
                                    {isSearching && (
                                        <div className="absolute right-5">
                                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dropdown Results - Redesigned with Spacing */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="max-h-[360px] overflow-y-auto px-1 custom-scrollbar">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleSelectUser(user)}
                                                className="w-full flex items-center gap-4 p-4 rounded-[24px] hover:bg-slate-50 transition-all text-left mb-2 group last:mb-0"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all shrink-0">
                                                    <User size={22} strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <b className="block font-black text-slate-900 text-base leading-tight truncate">{user.name}</b>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <b className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user.role}</b>
                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <p className="text-xs font-bold text-slate-400 truncate">{user.mobile_number}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={20} />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-slate-50 p-4 border-t border-slate-100 mt-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Results for "{search}"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Layout - Asymmetric */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Stats/Context (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="p-8 bg-[#0f172a] rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShieldCheck size={120} />
                            </div>
                            <div className="relative">
                                <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Security Protocol</p>
                                <h2 className="text-2xl font-black leading-snug">Impersonation <br /> Framework</h2>
                                <p className="text-slate-400 text-sm mt-4 font-medium leading-relaxed">
                                    Access user interfaces exactly as they see them. This tool creates a temporary authenticated bridge for diagnostic purposes.
                                </p>
                            </div>
                            <div className="pt-4 grid grid-cols-2 gap-4 border-t border-slate-800">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Audit Status</p>
                                    <p className="text-[11px] font-bold text-emerald-400">LOGGED</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Access Level</p>
                                    <p className="text-[11px] font-bold text-indigo-400">ELEVATED</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                <Smartphone className="text-indigo-500 mb-4" size={24} />
                                <b className="block text-2xl font-black text-slate-900">9:16</b>
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Mobile Ratio</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                <Activity className="text-purple-500 mb-4" size={24} />
                                <b className="block text-2xl font-black text-slate-900">Live</b>
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Interactions</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Details/Selection (8 cols) */}
                    <div className="lg:col-span-8">
                        {selectedUser ? (
                            <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 animate-in slide-in-from-right-8 duration-500">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                                    <div className="relative shrink-0">
                                        <div className="w-32 h-32 rounded-[40px] bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-slate-200">
                                            {selectedUser.profile_image ? (
                                                <img src={selectedUser.profile_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={64} strokeWidth={1} />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                                            <ShieldCheck size={18} />
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center md:text-left space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                <b className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">{selectedUser.role}</b>
                                                <b className={`px-3 py-1 ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} text-[10px] font-black rounded-full uppercase tracking-widest`}>{selectedUser.status}</b>
                                            </div>
                                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{selectedUser.name}</h3>
                                            <p className="text-slate-400 font-bold text-lg">{selectedUser.mobile_number}</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                                            <button
                                                onClick={handleImpersonate}
                                                disabled={loading}
                                                className="w-full sm:w-auto px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
                                            >
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                                                Open Interface
                                                <ChevronRight className="w-5 h-5 opacity-50" />
                                            </button>

                                            <button
                                                onClick={() => setSelectedUser(null)}
                                                className="px-6 py-5 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors"
                                            >
                                                Clear Target
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-50">
                                    <div className="p-4 bg-slate-50/50 rounded-2xl">
                                        <Activity className="w-4 h-4 text-slate-400 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Last Online</p>
                                        <p className="text-sm font-bold text-slate-900">Recent session detected</p>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-2xl">
                                        <History className="w-4 h-4 text-slate-400 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Account Age</p>
                                        <p className="text-sm font-bold text-slate-900">Verified identity</p>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-2xl">
                                        <CreditCard className="w-4 h-4 text-slate-400 mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Wallet Linked</p>
                                        <p className="text-sm font-bold text-slate-900">Authenticated node</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-slate-200 shadow-sm space-y-6">
                                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                                    <Monitor size={48} strokeWidth={1} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">No Target Specified</h3>
                                    <p className="text-slate-400 font-medium max-w-sm mx-auto">
                                        Use the persistent search bar above to look up identity records via Name or Mobile Number.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center justify-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
