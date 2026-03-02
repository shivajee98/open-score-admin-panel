'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Mail, Lock, User, KeyRound } from 'lucide-react';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Forgot Password State
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Username, 2: OTP & New Password
    const [resetUsername, setResetUsername] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch('/auth/admin/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            if (res.access_token && res.user) {
                const user = {
                    ...res.user,
                    role: 'ADMIN',
                    accessToken: res.access_token
                };
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', res.access_token);

                setTimeout(() => {
                    router.push('/');
                }, 100);
            } else {
                setError('Invalid Admin Credentials');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setForgotMessage('');
        try {
            const res = await apiFetch('/auth/admin/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ username: resetUsername }),
            });
            setForgotMessage(res.message || 'OTP sent to your email.');
            setForgotStep(2);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await apiFetch('/auth/admin/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    username: resetUsername,
                    otp: resetOtp,
                    new_password: newPassword
                }),
            });
            setIsForgotModalOpen(false);
            setForgotStep(1);
            setResetUsername('');
            setResetOtp('');
            setNewPassword('');
            alert('Password reset successfully. You can now login.');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#020617] p-6 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full point-events-none"></div>

            <div className="w-full max-w-[420px] rounded-[2rem] bg-slate-900/60 backdrop-blur-xl p-8 border border-white/5 shadow-2xl relative z-10 transition-all">

                <div className="mb-10 text-center space-y-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/20 mb-6">
                        <User className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Admin Portal
                    </h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                        Secure System Access
                    </p>
                </div>

                {error && !isForgotModalOpen && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5 flex flex-col">
                    <div className="group space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-slate-400 ml-1 group-focus-within:text-sky-400 transition-colors">Username</label>
                        <div className="relative flex items-center">
                            <User className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:bg-black/60 transition-all sm:text-sm"
                                placeholder="Enter admin username"
                            />
                        </div>
                    </div>

                    <div className="group space-y-1.5">
                        <div className="flex items-center justify-between ml-1 leading-none">
                            <label className="text-xs font-semibold uppercase text-slate-400 group-focus-within:text-sky-400 transition-colors">Password</label>
                            <button
                                type="button"
                                onClick={() => { setIsForgotModalOpen(true); setError(''); setForgotMessage(''); }}
                                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-4 w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:bg-black/60 transition-all sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 py-4 font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                    </button>
                </form>
            </div>

            {/* Forgot Password Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                        <button
                            onClick={() => { setIsForgotModalOpen(false); setForgotStep(1); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            {forgotStep === 1 ? 'Enter your username or email to receive a recovery code.' : 'Enter the OTP sent to your email and your new password.'}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                                {error}
                            </div>
                        )}
                        {forgotMessage && !error && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center">
                                {forgotMessage}
                            </div>
                        )}

                        {forgotStep === 1 ? (
                            <form onSubmit={handleSendResetOtp} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">Username / Email</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            value={resetUsername}
                                            onChange={(e) => setResetUsername(e.target.value)}
                                            className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500"
                                            placeholder="admin123"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !resetUsername}
                                    className="w-full bg-white text-black font-bold rounded-xl py-3 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Recovery OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">6-Digit OTP</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={resetOtp}
                                            onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                                            className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500 tracking-[0.2em] font-medium"
                                            placeholder="000000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase mb-1.5 block">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-sky-500"
                                            placeholder="New secure password"
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !resetOtp || !newPassword}
                                    className="w-full bg-emerald-500 text-white font-bold rounded-xl py-3 text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Set New Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
