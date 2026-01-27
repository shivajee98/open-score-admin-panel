'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function AdminLogin() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // Start at Mobile step
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

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
            const data = await apiFetch('/auth/verify', {
                method: 'POST',
                body: JSON.stringify({ mobile_number: mobile, otp, role: 'ADMIN' }),
            });

            if (data.user.role !== 'ADMIN') {
                throw new Error('Access Denied: This number is not registered as an Administrator.');
            }

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/');

        } catch (err: any) {
            setError(err.message);
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
                <p className="text-center text-slate-500 mb-8 text-sm font-bold uppercase tracking-widest">System Control Center</p>

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
