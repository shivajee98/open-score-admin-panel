'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Mail, User, KeyRound, ArrowRight, ShieldCheck, Lock, RefreshCw } from 'lucide-react';

export default function AdminLogin() {
    const [step, setStep] = useState(1); // 1: Username, 2: PIN, 3: Reset OTP, 4: New PIN
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const router = useRouter();

    const handleNextToPin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            setStep(2);
            setError('');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch('/auth/admin/login', {
                method: 'POST',
                body: JSON.stringify({ username, pin }),
            });

            if (res.access_token && res.user) {
                const user = {
                    ...res.user,
                    role: 'ADMIN',
                    accessToken: res.access_token
                };
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', res.access_token);
                setTimeout(() => router.push('/'), 100);
            } else {
                setError('Authentication failed');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your PIN.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch('/auth/admin/forgot-pin', {
                method: 'POST',
                body: JSON.stringify({ username }),
            });
            setMaskedEmail(res.masked_email || '');
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Failed to send recovery OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiFetch('/auth/admin/reset-pin', {
                method: 'POST',
                body: JSON.stringify({ username, otp, new_pin: newPin }),
            });
            setSuccess('PIN reset successfully! Please login with your new PIN.');
            setStep(2);
            setPin('');
            setOtp('');
            setNewPin('');
        } catch (err: any) {
            setError(err.message || 'PIN reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#020617] p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-500/8 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-[420px] rounded-[2rem] bg-slate-900/60 backdrop-blur-xl p-8 border border-white/5 shadow-2xl relative z-10 transition-all">

                <div className="mb-10 text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/20 mb-6">
                        <ShieldCheck className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Admin Portal
                    </h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                        {step === 1 && 'Secure access to Open Score infrastructure'}
                        {step === 2 && 'Enter your 6-digit access PIN'}
                        {step === 3 && `Enter recovery OTP sent to ${maskedEmail}`}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center">
                        {success}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleNextToPin} className="space-y-5 flex flex-col">
                        <div className="group space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-slate-400 ml-1 group-focus-within:text-sky-400 transition-colors">Admin Username</label>
                            <div className="relative flex items-center">
                                <User className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:bg-black/60 transition-all sm:text-sm"
                                    placeholder="Enter admin username"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!username}
                            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 py-4 font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                        >
                            Next to PIN <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                ) : step === 2 ? (
                    <form onSubmit={handleLogin} className="space-y-5 flex flex-col">
                        <div className="group space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-slate-400 ml-1 group-focus-within:text-sky-400 transition-colors">6-Digit Access PIN</label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:bg-black/60 transition-all sm:text-sm tracking-[0.5em] font-bold text-center"
                                    placeholder="••••••"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || pin.length !== 6}
                            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 py-4 font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>

                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleForgotPin}
                                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors text-center"
                            >
                                Forgot your Access PIN?
                            </button>
                            <button
                                type="button"
                                onClick={() => { setStep(1); setPin(''); setError(''); setSuccess(''); }}
                                className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors text-center"
                            >
                                ← Switch account
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetPin} className="space-y-5 flex flex-col">
                        <div className="space-y-4">
                            <div className="group space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-400 ml-1 group-focus-within:text-amber-400 transition-colors">Recovery OTP</label>
                                <div className="relative flex items-center">
                                    <KeyRound className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-black/60 transition-all sm:text-sm tracking-[0.3em] font-bold text-center"
                                        placeholder="000000"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="group space-y-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-400 ml-1 group-focus-within:text-emerald-400 transition-colors">New 6-Digit PIN</label>
                                <div className="relative flex items-center">
                                    <Lock className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        maxLength={6}
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all sm:text-sm tracking-[0.5em] font-bold text-center"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center px-4">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="text-center">Verification sent to <strong className="text-slate-300 font-bold">{maskedEmail}</strong></span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6 || newPin.length !== 6}
                            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 py-4 font-bold text-white shadow-lg shadow-amber-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Reset & Return to Login'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep(2); setOtp(''); setError(''); }}
                            className="text-xs text-slate-500 hover:text-slate-300 mt-2 font-medium transition-colors text-center"
                        >
                            Cancel recovery
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
