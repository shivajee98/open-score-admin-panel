'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { signIn } from 'next-auth/react';

export default function AdminLogin() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // Start at Mobile step
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Checking if we already have a token to skip login
        const token = localStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            router.push('/');
        }
    }, [router]);

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

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            // Updated to use NextAuth
            const res = await signIn('credentials', {
                mobile: mobile,
                otp: otp,
                role: 'ADMIN', // Explicitly passing role for credential provider
                redirect: false
            });

            if (res?.error) {
                // If fails, we might try manual verify to see specific error message 
                // or just show generic error. 
                // Let's stick to the pattern:
                const data = await apiFetch('/auth/verify', {
                    method: 'POST',
                    body: JSON.stringify({ mobile_number: mobile, otp, role: 'ADMIN' }),
                });

                if (data.user.role !== 'ADMIN') {
                    throw new Error('Access Denied: This number is not registered as an Administrator.');
                }

                // If manual check passed but signin failed, retry signin? 
                // Or just assume something went wrong with auth.
                // Let's retry signin if we are here implies credentials are correct but maybe network hiccup
                const retry = await signIn('credentials', {
                    mobile: mobile,
                    otp: otp,
                    role: 'ADMIN',
                    redirect: false
                });

                if (retry?.ok) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/';
                } else {
                    throw new Error('Login failed. Please try again.');
                }

            } else {
                // Success
                // We might need to fetch user details to store in localStorage if dependent components use it
                // Ideally they should use useSession(). But for backward compat:
                const data = await apiFetch('/auth/verify', {
                    method: 'POST',
                    body: JSON.stringify({ mobile_number: mobile, otp, role: 'ADMIN' }),
                }); // Redundant fetch but ensures we have user object in local storage if needed immediately

                localStorage.setItem('user', JSON.stringify(data.user));
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
                <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-center bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    Admin Portal
                </h1>
                <p className="text-center text-slate-500 mb-2 text-sm font-bold uppercase tracking-widest">System Control Center</p>

                <div className="mb-8 p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">Demo Credentials</p>
                    <p className="text-sm font-bold text-slate-300">Number: <span className="text-white">9478563245</span></p>
                    <p className="text-sm font-bold text-slate-300">OTP: <span className="text-white">849645</span></p>
                </div>

                {error && <p className="text-red-400 text-xs text-center mb-4 bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</p>}

                {step === 1 ? (
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 ml-1 group-focus-within:text-sky-400">Admin Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm">+91</span>
                                <input
                                    type="text"
                                    value={mobile}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setMobile(value);
                                    }}
                                    className="w-full rounded-xl bg-black/20 border border-slate-800 pl-14 pr-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-bold tracking-widest"
                                    placeholder="00000 00000"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSendOtp}
                            disabled={loading || mobile.length < 10}
                            className="w-full rounded-xl bg-sky-600 py-4 font-black shadow-lg shadow-sky-900/40 hover:bg-sky-500 transition-all active:scale-[0.98] disabled:opacity-30"
                        >
                            {loading ? 'Sending Request...' : 'Authorize Access'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="group text-center">
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-4">Verification Code</label>
                            <input
                                type="text"
                                autoFocus
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(value);
                                }}
                                className="w-full rounded-xl bg-black/20 border border-slate-800 p-4 text-white text-center text-2xl font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={loading || otp.length < 6}
                            className="w-full rounded-xl bg-emerald-600 py-4 font-black shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-30"
                        >
                            {loading ? 'Verifying...' : 'Unlock System'}
                        </button>
                        <button
                            onClick={() => { setStep(1); setOtp(''); }}
                            className="w-full text-xs text-slate-500 hover:text-white transition-colors py-2 uppercase font-black"
                        >
                            ← Edit Number
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
