'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { Wallet, Users, Link as LinkIcon, Copy, TrendingUp, QrCode, User, Shield, HelpCircle, FileText, Mail, LogOut, Lightbulb } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Stats {
    total_referrals: number;
    active_referrals: number;
    total_cashback_given: number;
}

export default function SubUserDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user) {
            console.log('[SubUserDashboard] Loaded session user', session.user);
            setUser(session.user);
            if ((session.user as any).id) {
                fetchStats((session.user as any).id);
            }
        }
    }, [session, status, router]);

    const fetchStats = async (id: number) => {
        try {
            // No need to pass token manually, apiFetch handles it from session
            const data = await apiFetch(`/admin/sub-users/${id}/stats`);
            setStats(data);
        } catch (e) {
            console.error('Failed to load stats', e);
        } finally {
            setLoading(false);
        }
    };

    const copyReferralLink = () => {
        if (!user?.referral_code) return;
        const link = `${window.location.origin.replace('admin.', '')}/signup?ref=${user.referral_code}`;
        // Note: Replacing admin prefix if exists, assuming customer site is on main domain
        const finalLink = link.replace('admin-panel.', 'kyc.'); // Adjusted for this project's structure maybe
        const shareLink = `https://openscore.msmeloan.sbs/?ref=${user.referral_code}`;

        navigator.clipboard.writeText(shareLink);
        toast.success('Referral link copied!');
    };

    if (loading && !user) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">Loading Agent Dashboard...</div>
    }

    return (
        <AdminLayout title="Agent Dashboard">
            <div className="space-y-8">
                {/* Welcome Card */}
                <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Hello, {user?.name}!</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">Credit Loop Authorized Agent</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                                <Wallet className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Credit</p>
                                <p className="text-3xl font-black text-white">₹{parseFloat(user?.credit_balance || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 items-center flex gap-4">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Referrals</p>
                            <p className="text-3xl font-black text-slate-900">{stats?.total_referrals || 0}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 items-center flex gap-4">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Users</p>
                            <p className="text-3xl font-black text-emerald-600">{stats?.active_referrals || 0}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 items-center flex gap-4">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Signup Bonus Spent</p>
                            <p className="text-3xl font-black text-slate-900">₹{parseFloat(stats?.total_cashback_given?.toString() || '0').toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Referral Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <LinkIcon size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Referral Link</h3>
                        </div>
                        <p className="text-slate-500 text-sm mb-6 font-medium">Use this link to onboard new users. The signup bonus will be deducted from your credit wallet.</p>
                        <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 items-center gap-3">
                            <div className="flex-1 px-4 font-mono text-sm text-slate-600 truncate font-bold">
                                https://openscore-kyc.vercel.app/?ref={user?.referral_code}
                            </div>
                            <button
                                onClick={copyReferralLink}
                                className="bg-slate-900 text-white p-4 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg flex items-center gap-2 font-bold"
                            >
                                <Copy size={18} />
                                Copy Link
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-900">
                            <QrCode size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Personal QR Code</h3>
                        <p className="text-slate-500 text-sm font-medium mb-6">Coming Soon: Generate a unique QR for instant onboarding.</p>
                        <button disabled className="px-8 py-3 bg-slate-100 text-slate-400 rounded-xl font-bold cursor-not-allowed">
                            View QR Code
                        </button>
                    </div>
                </div>

                {/* Settings Grid Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mt-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-slate-900">Settings</h3>
                        <button
                            onClick={() => {
                                signOut({ callbackUrl: '/login' });
                            }}
                            className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-rose-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Profile */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                                <User className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-700">Profile</span>
                        </div>

                        {/* Tutorial */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-amber-50 hover:border-amber-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                                <Lightbulb className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-700">Tutorial</span>
                        </div>

                        {/* Help */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-rose-50 hover:border-rose-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-700">Help</span>
                        </div>

                        {/* T&C */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-sky-50 hover:border-sky-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-sky-500 shadow-sm group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-700">T&C</span>
                        </div>

                        {/* Privacy */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-emerald-50 hover:border-emerald-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                                <Shield className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-700">Privacy</span>
                        </div>

                        {/* Contact Us */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-all group">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black text-slate-700">Contact Us</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
