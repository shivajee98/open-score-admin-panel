'use client';

import { useState, useRef, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Search, ShieldOff, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, Loader2, Lock, Unlock, Smartphone, Wallet, Clock, User } from 'lucide-react';

interface PinUser {
    id: number;
    name: string;
    mobile_number: string;
    status: string;
    role: string;
    has_app_pin: boolean;
    app_pin: string | null;
    has_wallet_pin: boolean;
    live_otp: string | null;
    joined_at: string;
}

interface OtpResult {
    user: {
        id: number;
        name: string;
        mobile_number: string;
        status: string;
        role: string;
        has_app_pin: boolean;
    };
    otp: string | null;
    otp_valid: boolean;
}

function Badge({ active, label }: { active: boolean; label: string }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
            active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-400'
        }`}>
            {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {label}
        </span>
    );
}

export default function PinControlPage() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<PinUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [resettingId, setResettingId] = useState<number | null>(null);
    const [resetSuccess, setResetSuccess] = useState<number | null>(null);
    const [revealedPins, setRevealedPins] = useState<Set<number>>(new Set());

    // OTP Lookup (by mobile number)
    const [otpMobile, setOtpMobile] = useState('');
    const [otpResult, setOtpResult] = useState<OtpResult | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((val: string) => {
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (val.trim().length < 2) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`/admin/users/search-for-pin-control?search=${encodeURIComponent(val.trim())}`);
                setResults(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 400);
    }, []);

    const handleResetPin = async (user: PinUser) => {
        if (!confirm(`Reset app login PIN for ${user.name} (${user.mobile_number})?\n\nThey will be forced to re-verify via OTP and set a new 4-digit PIN.`)) return;
        setResettingId(user.id);
        setResetSuccess(null);
        try {
            await apiFetch(`/admin/users/${user.id}/reset-app-pin`, { method: 'POST' });
            setResetSuccess(user.id);
            // Update local state
            setResults(prev => prev.map(u => u.id === user.id ? { ...u, has_app_pin: false, app_pin: null } : u));
        } catch (e: any) {
            alert(e.message || 'Failed to reset PIN');
        } finally {
            setResettingId(null);
        }
    };

    const handleOtpLookup = async () => {
        if (otpMobile.length !== 10) { setOtpError('Enter a valid 10-digit mobile number'); return; }
        setOtpLoading(true);
        setOtpResult(null);
        setOtpError('');
        try {
            const data = await apiFetch('/admin/otp/lookup', {
                method: 'POST',
                body: JSON.stringify({ mobile_number: otpMobile })
            });
            setOtpResult(data);
        } catch (e: any) {
            setOtpError(e.message || 'User not found or error occurred');
        } finally {
            setOtpLoading(false);
        }
    };

    const toggleReveal = (id: number) => {
        setRevealedPins(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    return (
        <AdminLayout title="PIN Control & OTP Lookup">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header info */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <p className="text-sm font-bold text-amber-800 mb-1">⚠️ Sensitive Access — Admin Only</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        This panel allows viewing live OTPs from cache and resetting user login PINs.
                        All lookups are logged. <strong>Never share OTPs externally.</strong>
                        There are two PINs per user: <strong>App Login PIN</strong> (4-digit, required to open the app) and <strong>Wallet PIN</strong> (required to make payments).
                    </p>
                </div>

                {/* OTP Lookup Panel */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-7 py-5 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900">Live OTP Lookup</h2>
                            <p className="text-xs text-slate-400">Check the current OTP in cache for any mobile number (valid 10 min)</p>
                        </div>
                    </div>
                    <div className="p-7">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={otpMobile}
                                    onChange={e => { setOtpMobile(e.target.value.replace(/\D/g, '')); setOtpError(''); setOtpResult(null); }}
                                    onKeyDown={e => e.key === 'Enter' && handleOtpLookup()}
                                    placeholder="Enter 10-digit mobile number…"
                                    className="w-full pl-5 pr-4 py-3.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-slate-300 tracking-widest font-mono"
                                />
                            </div>
                            <button
                                onClick={handleOtpLookup}
                                disabled={otpLoading || otpMobile.length !== 10}
                                className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Lookup
                            </button>
                        </div>

                        {otpError && (
                            <p className="mt-3 text-sm font-bold text-rose-600">{otpError}</p>
                        )}

                        {otpResult && (
                            <div className="mt-5 p-5 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-black text-slate-900 text-base">{otpResult.user.name}</p>
                                        <p className="text-xs font-mono text-slate-500">{otpResult.user.mobile_number} · {otpResult.user.role}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge active={otpResult.user.has_app_pin} label="App PIN Set" />
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${otpResult.user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                                                {otpResult.user.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {otpResult.otp_valid ? (
                                            <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-0.5">Live OTP</p>
                                                <p className="text-3xl font-black tracking-[0.3em] font-mono">{otpResult.otp}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-200 text-slate-500 px-6 py-3 rounded-xl">
                                                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5">OTP Status</p>
                                                <p className="text-sm font-black">No active OTP</p>
                                                <p className="text-[10px] text-slate-400">OTP expired or not requested</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* User PIN Control */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-7 py-5 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900">User PIN Control</h2>
                            <p className="text-xs text-slate-400">Search users by name or mobile — view PIN status, live OTP, and reset login PIN</p>
                        </div>
                    </div>
                    <div className="p-7">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Search by name or mobile number…"
                                className="w-full pl-11 pr-4 py-3.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder:text-slate-300"
                            />
                            {loading && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                            )}
                        </div>

                        {results.length > 0 && (
                            <div className="mt-5 space-y-3">
                                {results.map(user => (
                                    <div
                                        key={user.id}
                                        className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Left: user info */}
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-black text-slate-600 text-sm flex-shrink-0">
                                                    {(user.name || 'U')[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900">{user.name}</p>
                                                    <p className="text-xs font-mono text-slate-500">{user.mobile_number} · {user.role}</p>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                        <Badge active={user.has_app_pin} label="Login PIN" />
                                                        <Badge active={user.has_wallet_pin} label="Wallet PIN" />
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                                                            {user.status}
                                                        </span>
                                                        {user.live_otp && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                                                <Clock className="w-3 h-3" />
                                                                OTP Active
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: PIN display + actions */}
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                {/* App Login PIN */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
                                                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login PIN</span>
                                                        {user.app_pin ? (
                                                            <span className="font-mono font-black text-sm text-slate-900 ml-1 tracking-widest">
                                                                {revealedPins.has(user.id) ? user.app_pin : '••••'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 ml-1 italic">not set</span>
                                                        )}
                                                        {user.app_pin && (
                                                            <button onClick={() => toggleReveal(user.id)} className="text-slate-400 hover:text-slate-700 ml-1 transition-colors">
                                                                {revealedPins.has(user.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Live OTP */}
                                                    {user.live_otp && (
                                                        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                                                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">OTP</span>
                                                            <span className="font-mono font-black text-sm text-indigo-700 ml-1 tracking-widest">{user.live_otp}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Reset Button */}
                                                <button
                                                    onClick={() => handleResetPin(user)}
                                                    disabled={resettingId === user.id || !user.has_app_pin}
                                                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                                        resetSuccess === user.id
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : user.has_app_pin
                                                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300'
                                                                : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {resettingId === user.id ? (
                                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Resetting…</>
                                                    ) : resetSuccess === user.id ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5" />PIN Cleared</>
                                                    ) : (
                                                        <><ShieldOff className="w-3.5 h-3.5" />Reset Login PIN</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Wallet PIN info note */}
                                        <p className="mt-3 text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2">
                                            <Wallet className="w-3 h-3 inline mr-1 text-slate-300" />
                                            Wallet PIN is for payments only and cannot be reset from here — user must reset via the app's wallet settings.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {search.length >= 2 && !loading && results.length === 0 && (
                            <div className="mt-8 text-center py-10">
                                <User className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">No users found for "{search}"</p>
                            </div>
                        )}

                        {search.length < 2 && (
                            <div className="mt-8 text-center py-10">
                                <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">Type at least 2 characters to search</p>
                                <p className="text-xs text-slate-300 mt-1">Search by name or mobile number</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="font-black text-slate-700 mb-2 flex items-center gap-2"><Smartphone className="w-4 h-4 text-rose-500" /> App Login PIN</p>
                        <p className="leading-relaxed">4-digit PIN required every time a user opens the app. If not set, user logs in via OTP and is prompted to set one. Reset this when a user is locked out.</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="font-black text-slate-700 mb-2 flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-500" /> Wallet Payment PIN</p>
                        <p className="leading-relaxed">Separate PIN used to authorize payments. Stored differently (hashed in wallet table). Admin cannot view or reset this — user must change it from within the app.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
