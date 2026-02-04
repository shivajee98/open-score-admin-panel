'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { signIn } from 'next-auth/react';

export default function AdminLogin() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Input, 2: OTP (for Admin)
    const [loginMode, setLoginMode] = useState<'ADMIN' | 'SUB_USER'>('ADMIN');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSendOtp = async () => {
        setLoading(true);
        setError('');
        try {
            await apiFetch('/auth/otp', {
                method: 'POST',
                body: JSON.stringify({ mobile_number: mobile }),
            });
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubUserLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await signIn('credentials', {
                mobile: mobile,
                otp: otp,
                role: 'SUB_USER',
                redirect: false
            });

            if (res?.error) {
                setError('Invalid Agent Credentials');
            } else {
                window.location.href = '/';
            }
        } catch (err: any) {
            setError('Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await signIn('credentials', {
                mobile: mobile,
                otp: otp,
                role: 'ADMIN',
                redirect: false
            });

            if (res?.error) {
                const data = await apiFetch('/auth/verify', {
                    method: 'POST',
                    body: JSON.stringify({ mobile_number: mobile, otp, role: 'ADMIN' }),
                });

                if (data.user.role !== 'ADMIN') {
                    throw new Error('Access Denied: This number is not registered as an Administrator.');
                }

                const retry = await signIn('credentials', {
                    mobile: mobile,
                    otp: otp,
                    role: 'ADMIN',
                    redirect: false
                });

                if (retry?.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token); // Store token for apiFetch
                    window.location.href = '/';
                } else {
                    throw new Error('Login failed. Please try again.');
                }

            } else {
                const data = await apiFetch('/auth/verify', {
                    method: 'POST',
                    body: JSON.stringify({ mobile_number: mobile, otp, role: 'ADMIN' }),
                });

                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                window.location.href = '/';
            }

        } catch (err: any) {
            setError(err.message || 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#020617] p-6 text-white font-sans">
            <div className="w-full max-w-md rounded-[2.5rem] bg-slate-900/50 p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="flex justify-center mb-6">
                    <div className="flex p-1 bg-black/40 rounded-2xl border border-slate-800">
                        <button
                            onClick={() => { setLoginMode('ADMIN'); setStep(1); }}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginMode === 'ADMIN' ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Master Admin
                        </button>
                        <button
                            onClick={() => setLoginMode('SUB_USER')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${loginMode === 'SUB_USER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Agent Login
                        </button>
                    </div>
                </div>

                <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-center bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    {loginMode === 'ADMIN' ? 'Admin Portal' : 'Agent Access'}
                </h1>
                <p className="text-center text-slate-500 mb-8 text-sm font-bold uppercase tracking-widest">
                    {loginMode === 'ADMIN' ? 'System Control Center' : 'Network Management'}
                </p>

                {error && <p className="text-red-400 text-xs text-center mb-6 bg-red-400/10 py-3 rounded-xl border border-red-400/20 px-4">{error}</p>}

                {loginMode === 'ADMIN' ? (
                    step === 1 ? (
                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 ml-1 group-focus-within:text-sky-400">Mobile Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">+91</span>
                                    <input
                                        type="text"
                                        value={mobile}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setMobile(value);
                                        }}
                                        className="w-full rounded-2xl bg-black/20 border border-slate-800 pl-14 pr-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-bold tracking-[0.2em] text-lg"
                                        placeholder="00000 00000"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={loading || mobile.length < 10}
                                className="w-full rounded-2xl bg-sky-600 py-4 font-black shadow-lg shadow-sky-900/40 hover:bg-sky-500 transition-all active:scale-[0.98] disabled:opacity-30 uppercase tracking-widest text-sm"
                            >
                                {loading ? 'Sending Request...' : 'Get Access Code'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="group text-center">
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-6">Verification Code</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                    className="w-full rounded-2xl bg-black/20 border border-slate-800 p-5 text-white text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                    placeholder="000000"
                                />
                            </div>
                            <button
                                onClick={handleVerify}
                                disabled={loading || otp.length < 6}
                                className="w-full rounded-2xl bg-emerald-600 py-4 font-black shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-30 uppercase tracking-widest text-sm"
                            >
                                {loading ? 'Verifying...' : 'Unlock System'}
                            </button>
                            <button
                                onClick={() => { setStep(1); setOtp(''); }}
                                className="w-full text-xs text-slate-500 hover:text-white transition-colors py-2 uppercase font-black"
                            >
                                ← Return to Number Input
                            </button>
                        </div>
                    )
                ) : (
                    <form onSubmit={handleSubUserLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 ml-1 group-focus-within:text-indigo-400">Agent Mobile Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">+91</span>
                                    <input
                                        type="tel"
                                        required
                                        value={mobile}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setMobile(value);
                                        }}
                                        className="w-full rounded-2xl bg-black/20 border border-slate-800 pl-14 pr-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-[0.2em] text-lg"
                                        placeholder="00000 00000"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-xs font-semibold uppercase text-slate-500 mb-2 ml-1 group-focus-within:text-indigo-400">One-Time Password (OTP)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(value);
                                    }}
                                    className="w-full rounded-2xl bg-black/20 border border-slate-800 px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-center tracking-[0.3em] text-xl"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || mobile.length < 10 || otp.length < 6}
                            className="w-full rounded-2xl bg-indigo-600 py-4 font-black shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-30 uppercase tracking-widest text-sm"
                        >
                            {loading ? 'Authenticating...' : 'Enter Dashboard'}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
