'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Search, User, Smartphone, Monitor, ChevronRight, Loader2, ArrowLeft, RefreshCw, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
    id: number;
    name: string;
    mobile_number: string;
    role: string;
    status: string;
    profile_image?: string;
}

export default function UserPreviewPage() {
    const [mobileNumber, setMobileNumber] = useState('');
    const [userType, setUserType] = useState('CUSTOMER');
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<UserData | null>(null);
    const [impersonateToken, setImpersonateToken] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState(false);

    const handleSearch = async () => {
        if (!mobileNumber || mobileNumber.length < 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            // Using existing getUsers endpoint or we can create a specific search
            const results = await apiFetch(`/admin/users?search=${mobileNumber}&role=${userType}`);
            const user = results.data.data?.[0]; // Get first result

            if (user) {
                setFoundUser(user);
                toast.success('User found');
            } else {
                setFoundUser(null);
                toast.error('No user found with this mobile number and type');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to search user');
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async () => {
        if (!foundUser) return;

        setLoading(true);
        try {
            const data = await apiFetch(`/admin/users/${foundUser.id}/impersonate`);
            if (data.access_token) {
                setImpersonateToken(data.access_token);
                setViewMode(true);
                toast.success(`Impersonating ${foundUser.name}`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to initiate impersonation');
        } finally {
            setLoading(false);
        }
    };

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://app.msmeloan.sbs';
    const previewUrl = impersonateToken ? `${frontendUrl}?token=${impersonateToken}&admin_preview=true` : '';

    if (viewMode && previewUrl) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col md:flex-row">
                {/* Control Panel */}
                <div className="bg-slate-900 w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setViewMode(false)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="font-bold text-lg text-white">Preview Mode</h2>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{foundUser?.name}</p>
                                    <p className="text-xs text-slate-400">{foundUser?.role}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 uppercase tracking-wider font-bold">Mobile</span>
                                    <span className="text-slate-300">{foundUser?.mobile_number}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 uppercase tracking-wider font-bold">Status</span>
                                    <span className="text-emerald-400 font-bold">{foundUser?.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Preview Controls</p>
                            <button 
                                onClick={() => {
                                    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                                    if (iframe) iframe.src = iframe.src;
                                }}
                                className="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-sm font-bold transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload Interface
                            </button>
                            <button 
                                onClick={() => setViewMode(false)}
                                className="w-full flex items-center gap-3 p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-rose-400 text-sm font-bold transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                Exit Preview
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:block p-4 border-t border-slate-800 -mx-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tighter text-center justify-center">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            Secure Admin Session
                        </div>
                    </div>
                </div>

                {/* Mobile View Container */}
                <div className="flex-1 bg-slate-950 flex items-center justify-center p-4">
                    <div className="relative">
                        {/* Device Frame */}
                        <div className="w-[320px] h-[640px] md:w-[375px] md:h-[812px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
                            <iframe 
                                id="preview-iframe"
                                src={previewUrl}
                                className="w-full h-full border-none"
                                title="User Mobile Preview"
                            />
                        </div>
                        
                        {/* Status indicators */}
                        <div className="absolute -right-24 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 shadow-lg">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Live</span>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1 shadow-lg">
                                <span className="text-[10px] font-black text-slate-600 uppercase">Res</span>
                                <span className="text-[10px] font-bold text-slate-300 uppercase">9:16</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AdminLayout title="User Mobile Preview">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        <div className="flex-1 space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-2">User Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['CUSTOMER', 'MERCHANT', 'AGENT', 'STUDENT'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setUserType(type)}
                                        className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                                            userType === type 
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-[2] space-y-4">
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Mobile Number</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 font-bold text-slate-900 text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                    placeholder="Enter user mobile number"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-[60px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            Search
                        </button>
                    </div>
                </div>

                {foundUser && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-slate-300">
                                {foundUser.profile_image ? (
                                    <img src={foundUser.profile_image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12" />
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-1">
                                <h3 className="text-2xl font-black text-slate-900">{foundUser.name}</h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2">
                                    <span className={`w-2 h-2 rounded-full ${foundUser.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    {foundUser.role} • {foundUser.status}
                                </p>
                                <p className="text-slate-400 text-sm">{foundUser.mobile_number}</p>
                            </div>
                            <button
                                onClick={handleImpersonate}
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <Smartphone className="w-5 h-5" />
                                Open Mobile Preview
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {!foundUser && !loading && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                            <Monitor className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-slate-400">Search for a user to begin preview</p>
                            <p className="text-xs text-slate-300">You can impersonate merchants, agents, and customers</p>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
