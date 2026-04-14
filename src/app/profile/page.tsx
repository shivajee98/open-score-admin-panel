'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'sonner';
import { User, Mail, KeyRound, ShieldCheck, CheckCircle, Lock, Bug, Trash2, Play, Square, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminProfile() {
    const { user } = useAuth();
    const router = useRouter();

    // Username
    const [username, setUsername] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Email Change  
    const [emailStep, setEmailStep] = useState(0); // 0: idle, 1: enter new email, 2: enter OTPs
    const [newEmail, setNewEmail] = useState('');
    const [oldEmailOtp, setOldEmailOtp] = useState('');
    const [newEmailOtp, setNewEmailOtp] = useState('');
    const [maskedOldEmail, setMaskedOldEmail] = useState('');
    const [maskedNewEmail, setMaskedNewEmail] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    // PIN Change
    const [oldPin, setOldPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [pinLoading, setPinLoading] = useState(false);

    // Debug Mode
    const [debugLoading, setDebugLoading] = useState(false);
    const [debugUsers, setDebugUsers] = useState<any[]>([]);
    const [debugMsg, setDebugMsg] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
        }
    }, [user]);

    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        setUsernameLoading(true);
        try {
            const res = await apiFetch('/admin/profile/update-username', {
                method: 'POST',
                body: JSON.stringify({ username }),
            });
            toast.success(res.message || 'Username updated!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update username');
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleRequestEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailLoading(true);
        try {
            const res = await apiFetch('/admin/profile/request-email-change', {
                method: 'POST',
                body: JSON.stringify({ new_email: newEmail }),
            });
            setMaskedOldEmail(res.masked_old_email || '');
            setMaskedNewEmail(res.masked_new_email || '');
            setEmailStep(2);
            toast.success('OTPs sent to both email addresses!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to initiate email change');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleConfirmEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailLoading(true);
        try {
            const res = await apiFetch('/admin/profile/confirm-email-change', {
                method: 'POST',
                body: JSON.stringify({
                    old_email_otp: oldEmailOtp,
                    new_email_otp: newEmailOtp,
                }),
            });
            toast.success(res.message || 'Email updated successfully!');
            setEmailStep(0);
            setNewEmail('');
            setOldEmailOtp('');
            setNewEmailOtp('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to verify OTPs');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleUpdatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinLoading(true);
        try {
            const res = await apiFetch('/admin/profile/update-pin', {
                method: 'POST',
                body: JSON.stringify({
                    old_pin: oldPin,
                    new_pin: confirmNewPin,
                }),
            });
            toast.success(res.message || 'PIN updated successfully!');
            setOldPin('');
            setConfirmNewPin('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update PIN');
        } finally {
            setPinLoading(false);
        }
    };

    const handleDebugAction = async (action: 'enable' | 'disable' | 'delete') => {
        setDebugLoading(true);
        setDebugMsg('');
        try {
            const res = await apiFetch(`/debug/${action}`);
            toast.success(res.message);
            if (action === 'disable' && res.data?.users) {
                setDebugUsers(res.data.users);
            }
            if (action === 'delete') {
                setDebugUsers([]);
            }
            setDebugMsg(res.message);
        } catch (error: any) {
            toast.error(error.message || `Failed to ${action} debug mode`);
        } finally {
            setDebugLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;

    if (user.role !== 'ADMIN') {
        router.push('/');
        return null;
    }

    return (
        <AdminLayout title="My Profile">
            <Toaster position="top-right" richColors />

            <div className="p-8 max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="border-b border-slate-200 pb-6 flex items-center gap-4">
                    <div className="bg-sky-100 text-sky-600 p-4 rounded-2xl">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Profile</h1>
                        <p className="text-slate-500 font-medium">Manage your access credentials securely</p>
                    </div>
                </div>

                {/* Username Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <User className="w-5 h-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-800">Username</h2>
                    </div>
                    <form onSubmit={handleUpdateUsername} className="p-6 flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Login Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium text-slate-700"
                                    placeholder="admin123"
                                    minLength={3}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={usernameLoading || !username || username === user.username}
                            className="px-6 py-4 bg-slate-900 text-white font-bold rounded-xl shadow hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
                        >
                            {usernameLoading ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                </div>

                {/* Security PIN Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-800">Security PIN</h2>
                    </div>
                    <form onSubmit={handleUpdatePin} className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Current 6-Digit PIN</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        maxLength={6}
                                        value={oldPin}
                                        onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-bold tracking-[0.5em] text-slate-700"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">New 6-Digit PIN</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        maxLength={6}
                                        value={confirmNewPin}
                                        onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold tracking-[0.5em] text-slate-700"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={pinLoading || oldPin.length !== 6 || confirmNewPin.length !== 6 || oldPin === confirmNewPin}
                                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {pinLoading ? 'Updating...' : 'Update PIN'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Email Change Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <h2 className="text-lg font-bold text-slate-800">Recovery Email</h2>
                        <span className="ml-auto text-sm text-slate-400 font-medium">{user.email || 'Not set'}</span>
                    </div>

                    <div className="p-6">
                        {emailStep === 0 && (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">
                                    Your login OTPs are sent to this email for recovery. To change it, you must verify both your current and new email addresses.
                                </p>
                                <button
                                    onClick={() => setEmailStep(1)}
                                    className="px-6 py-3 bg-sky-50 text-sky-600 font-bold rounded-xl hover:bg-sky-100 transition-colors text-sm"
                                >
                                    Change Email Address
                                </button>
                            </div>
                        )}

                        {emailStep === 1 && (
                            <form onSubmit={handleRequestEmailChange} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">New Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium text-slate-700"
                                            placeholder="newemail@example.com"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={emailLoading || !newEmail}
                                        className="px-6 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-400 transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {emailLoading ? 'Sending OTPs...' : 'Send Verification OTPs'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEmailStep(0); setNewEmail(''); }}
                                        className="px-6 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {emailStep === 2 && (
                            <form onSubmit={handleConfirmEmailChange} className="space-y-5">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700">
                                    <CheckCircle className="w-4 h-4 inline mr-2" />
                                    OTPs sent to <strong>{maskedOldEmail}</strong> (current) and <strong>{maskedNewEmail}</strong> (new)
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">OTP from Current Email</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={oldEmailOtp}
                                                onChange={(e) => setOldEmailOtp(e.target.value.replace(/\D/g, ''))}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-bold tracking-[0.2em] text-center text-slate-700"
                                                placeholder="000000"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">OTP from New Email</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                value={newEmailOtp}
                                                onChange={(e) => setNewEmailOtp(e.target.value.replace(/\D/g, ''))}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold tracking-[0.2em] text-center text-slate-700"
                                                placeholder="000000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={emailLoading || oldEmailOtp.length !== 6 || newEmailOtp.length !== 6}
                                        className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {emailLoading ? 'Verifying...' : 'Confirm Email Change'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEmailStep(0); setOldEmailOtp(''); setNewEmailOtp(''); }}
                                        className="px-6 py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Debug Mode Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                        <Bug className="w-5 h-5 text-rose-500" />
                        <h2 className="text-lg font-bold text-slate-800">Developer Debug Mode</h2>
                        <span className="ml-auto bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-rose-200">RESTRICTED</span>
                    </div>

                    <div className="p-6 space-y-6">
                        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                            Debug mode allows OTP-less authentication for testing purposes. 
                            <strong> WARNING:</strong> While active, any 10-digit mobile number can sign up without verifying via SMS.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => handleDebugAction('enable')}
                                disabled={debugLoading}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-all group disabled:opacity-50"
                            >
                                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Enable Mode
                            </button>

                            <button
                                onClick={() => handleDebugAction('disable')}
                                disabled={debugLoading}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all group disabled:opacity-50"
                            >
                                <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Disable & List
                            </button>

                            <button
                                onClick={() => {
                                    if(confirm('Are you sure? This will permanently delete all debug accounts.')) {
                                        handleDebugAction('delete');
                                    }
                                }}
                                disabled={debugLoading}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all group disabled:opacity-50"
                            >
                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Purge Users
                            </button>
                        </div>

                        {debugMsg && (
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono text-slate-600">
                                {debugMsg}
                            </div>
                        )}

                        {debugUsers.length > 0 && (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <Users className="w-4 h-4" />
                                    <h3>Debug Users Found ({debugUsers.length})</h3>
                                </div>
                                <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Phone</th>
                                                <th className="px-4 py-3">Role</th>
                                                <th className="px-4 py-3">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {debugUsers.map((u) => (
                                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-700">{u.name}</td>
                                                    <td className="px-4 py-3 text-slate-500">{u.mobile_number}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{u.role}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400 text-[10px]">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
