'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/AdminLayout';
import { toast, Toaster } from 'sonner';
import { User, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminProfile() {
    const { user } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await apiFetch('/admin/profile/update', {
                method: 'POST',
                body: JSON.stringify({
                    username: username !== user?.username ? username : undefined,
                    email: email !== user?.email ? email : undefined,
                    new_password: newPassword ? newPassword : undefined,
                })
            });

            if (res.user) {
                toast.success(res.message || 'Profile updated successfully!');
                setNewPassword(''); // clear password field
                // mutate() removed as it is not exported by useAuth
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

    if (user.role !== 'ADMIN') {
        router.push('/');
        return null;
    }

    return (
        <AdminLayout title="My Profile">
            <Toaster position="top-right" richColors />

            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-8 border-b border-slate-200 pb-6 flex items-center gap-4">
                    <div className="bg-sky-100 text-sky-600 p-4 rounded-2xl">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Administrator</h1>
                        <p className="text-slate-500 font-medium">Manage your security and access credentials</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Master Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium text-slate-700"
                                        placeholder="admin123"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 ml-1">Used for system login.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Recovery Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium text-slate-700"
                                        placeholder="admin@openscore.com"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 ml-1">Where password reset OTPs will be sent.</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-slate-400" /> Reset Password
                            </h3>
                            <div className="max-w-md space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">New Password (Optional)</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={6}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-4 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium text-slate-700"
                                        placeholder="Leave blank to keep unchanged"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={loading || (!username || !email)}
                                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:shadow-slate-900/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {loading ? 'Saving Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
