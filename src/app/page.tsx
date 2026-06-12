'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/AdminLayout';
import { BadgeCheck, Ban, Clock, TrendingUp, Users, Wallet, QrCode, Gift, Copy, MapPin, ChevronRight, Trophy, X } from 'lucide-react';
import Link from 'next/link';
import FundsCard from '@/components/dashboard/FundsCard';
import SystemResetDialog from '@/components/dashboard/SystemResetDialog';
import CampaignManager from '@/components/dashboard/CampaignManager';
import LoginAccessControl from '@/components/dashboard/LoginAccessControl';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const { user: session, status } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalVerifiedEmails: 0,
        totalMerchants: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        pendingCount: 0,
        activeLoans: 0,
        defaultedLoans: 0,
        pendingLoans: 0,
        recentRepayments: [],
        totalReferralPaid: 0,
        totalQrDeposits: 0,
        totalVendorsPendingDues: 0,
        totalAgentsPendingDues: 0,
        activePincodes: [],
        upcomingPincodes: []
    });
    const [pendingTx, setPendingTx] = useState<any[]>([]);
    const [pendingRepayments, setPendingRepayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [campaignStats, setCampaignStats] = useState<any>(null);
    const [isVerifiedModalOpen, setIsVerifiedModalOpen] = useState(false);
    const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]);
    const [loadingVerified, setLoadingVerified] = useState(false);
    const [verifiedSearch, setVerifiedSearch] = useState('');

    const [isOutstandingModalOpen, setIsOutstandingModalOpen] = useState(false);
    const [outstandingLoans, setOutstandingLoans] = useState<any[]>([]);
    const [loadingOutstanding, setLoadingOutstanding] = useState(false);
    const [outstandingSearch, setOutstandingSearch] = useState('');

    useEffect(() => {
        if (status === 'authenticated' && session?.role === 'SUB_USER') {
            router.push('/sub-user-dashboard');
        } else if (status === 'authenticated' && session?.role === 'ADMIN') {
            loadData();
        }
    }, [session, status, router]);

    // Background Poller for real-time active users fluctuation
    useEffect(() => {
        if (status !== 'authenticated' || session?.role !== 'ADMIN') return;

        const pollActiveUsers = async () => {
            try {
                const data = await apiFetch('/admin/analytics/active-users');
                if (data) {
                    if (typeof data.active_users === 'number') {
                        setStats(prev => ({
                            ...prev,
                            activeUsers: data.active_users
                        }));
                    }
                }
            } catch (e) {
                // Fail silently
            }
        };

        const interval = setInterval(pollActiveUsers, 4000);
        return () => clearInterval(interval);
    }, [session, status]);

    const loadData = async () => {
        try {
            // Parallel fetch for speed
            const [analytics, pending, pendingRepays, allCamps] = await Promise.all([
                apiFetch('/admin/analytics/dashboard'),
                apiFetch('/admin/funds/pending'),
                apiFetch('/admin/repayments/pending'),
                apiFetch('/admin/campaigns')
            ]);

            setStats({
                totalUsers: analytics?.total_users || 0,
                activeUsers: analytics?.active_users || 0,
                totalVerifiedEmails: analytics?.total_verified_emails || 0,
                totalMerchants: analytics?.total_merchants || 0,
                totalDisbursed: analytics?.total_disbursed || 0,
                totalRepaid: analytics?.total_repaid || 0,
                totalOutstanding: analytics?.total_outstanding || 0,
                totalOverdue: analytics?.total_overdue || 0,
                pendingCount: Array.isArray(pending) ? pending.length : 0,
                activeLoans: analytics?.active_loans || 0,
                defaultedLoans: analytics?.defaulted_loans || 0,
                pendingLoans: analytics?.pending_loans || 0,
                recentRepayments: analytics?.recent_repayments || [],
                totalReferralPaid: analytics?.total_referral_paid || 0,
                totalQrDeposits: analytics?.total_qr_deposits || 0,
                totalVendors: analytics?.total_vendors || 0,
                totalVendorsTransactionSum: analytics?.total_vendors_transaction_sum || 0,
                totalVendorsPendingDues: analytics?.total_vendors_pending_dues || 0,
                totalAgents: analytics?.total_agents || 0,
                totalAgentsPendingDues: analytics?.total_agents_pending_dues || 0,
                activePincodes: Array.isArray(analytics?.active_pincodes) ? analytics.active_pincodes : [],
                upcomingPincodes: Array.isArray(analytics?.upcoming_pincodes) ? analytics.upcoming_pincodes : [],
                totalActivePincodes: analytics?.total_active_pincodes || 0
            } as any);
            setPendingTx(Array.isArray(pending) ? pending : []);
            setPendingRepayments(Array.isArray(pendingRepays?.data) ? pendingRepays.data : (Array.isArray(pendingRepays) ? pendingRepays : []));
            
            // Fetch campaign stats (default to active)
            const campStats = await apiFetch('/admin/campaigns/stats');
            setCampaignStats(campStats);
        } catch (error) {
            console.error('Failed to load admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCampaignStats = async (id: number) => {
        try {
            const campStats = await apiFetch(`/admin/campaigns/stats?campaign_id=${id}`);
            setCampaignStats(campStats);
            toast.success(`Loaded stats for: ${campStats.campaign.title}`);
        } catch (error) {
            toast.error('Failed to load campaign stats');
        }
    };

    const openVerifiedEmailsModal = async () => {
        setIsVerifiedModalOpen(true);
        setLoadingVerified(true);
        try {
            const data = await apiFetch('/admin/analytics/verified-emails');
            if (Array.isArray(data)) {
                setVerifiedUsers(data);
            }
        } catch (error) {
            console.error('Failed to load verified emails', error);
            toast.error('Failed to load verified emails list');
        } finally {
            setLoadingVerified(false);
        }
    };

    const openOutstandingLoansModal = async () => {
        setIsOutstandingModalOpen(true);
        setLoadingOutstanding(true);
        try {
            const data = await apiFetch('/admin/analytics/outstanding-loans');
            if (Array.isArray(data)) {
                setOutstandingLoans(data);
            }
        } catch (error) {
            console.error('Failed to load outstanding loans', error);
            toast.error('Failed to load outstanding loans list');
        } finally {
            setLoadingOutstanding(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Approve this transaction?')) return;
        try {
            await apiFetch(`/admin/funds/${id}/approve`, { method: 'POST' });
            alert('Funds Approved!');
            loadData();
        } catch (e) {
            alert('Approval failed');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Reject this transaction?')) return;
        try {
            await apiFetch(`/admin/funds/${id}/reject`, { method: 'POST' });
            alert('Request Rejected');
            loadData();
        } catch (e) {
            alert('Rejection failed');
        }
    };

    const handleRepaymentApprove = async (id: number) => {
        if (!confirm('Final Approve this repayment?')) return;
        try {
            await apiFetch(`/admin/repayments/${id}/approve`, { method: 'POST' });
            alert('Repayment Approved!');
            loadData();
        } catch (e) {
            alert('Approval failed');
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;
    }

    if (session?.role === 'SUB_USER') {
        return null; // Will redirect
    }

    return (
        <AdminLayout title="System Overview">
            <div className="flex justify-end gap-3 mb-6">
                <LoginAccessControl />
                <SystemResetDialog />
            </div>
            <FundsCard />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Users</p>
                        <p className="text-xl font-black text-slate-900">{stats.totalUsers}</p>
                    </div>
                </div>

                <div 
                    onClick={() => router.push('/active-users')}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 relative overflow-hidden group cursor-pointer hover:shadow-md hover:border-emerald-250 transition-all select-none"
                >
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 relative">
                        <Users className="w-5 h-5 animate-pulse" />
                        <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            Active Users (Live)
                        </p>
                        <p className="text-xl font-black text-emerald-600">{stats.activeUsers}</p>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Disbursed (Loans)</p>
                        <p className="text-xl font-black text-slate-900">₹{stats.totalDisbursed.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Recovered</p>
                        <p className="text-xl font-black text-emerald-600">₹{stats.totalRepaid.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div 
                    onClick={openOutstandingLoansModal}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-purple-250 transition-all duration-200 select-none group"
                >
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Outstanding</p>
                        <p className="text-xl font-black text-purple-600">₹{stats.totalOutstanding.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                        <Ban className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Overdue</p>
                        <p className="text-xl font-black text-red-600">₹{stats.totalOverdue.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Referral Paid</p>
                        <p className="text-xl font-black text-amber-600">₹{(stats as any).totalReferralPaid?.toLocaleString('en-IN') || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Vendors Overview</p>
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-black text-slate-900">{(stats as any).totalVendors || 0}</p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Sub-Users</span>
                            </div>
                            <p className="text-[10px] font-black text-rose-600 mt-0.5">₹{(stats as any).totalVendorsPendingDues?.toLocaleString('en-IN') || 0} Pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Field Agents</p>
                        <div className="flex flex-col">
                            <p className="text-xl font-black text-slate-900">{(stats as any).totalAgents || 0}</p>
                            <p className="text-[10px] font-black text-violet-600 mt-0.5">₹{(stats as any).totalAgentsPendingDues?.toLocaleString('en-IN') || 0} Pending</p>
                        </div>
                    </div>
                </div>

                <Link href="/qr-control?view=history" className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-indigo-200 transition-all group">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                        <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">QR Deposits</p>
                        <p className="text-xl font-black text-slate-900">₹{(stats as any).totalQrDeposits?.toLocaleString('en-IN') || 0}</p>
                    </div>
                </Link>
                
                <div 
                    onClick={() => {
                        navigator.clipboard.writeText('https://openscore.msmeloan.sbs/public-qr/');
                        toast.success('Public QR Link copied to clipboard');
                    }} 
                    className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-indigo-200 transition-all group cursor-pointer"
                >
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                        <Copy className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Public QR Link (Click to Copy)</p>
                        <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">https://openscore.msmeloan.sbs/public-qr/</p>
                    </div>
                </div>

                <Link href="/pincodes" className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-blue-200 transition-all group">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Clusters</p>
                        <p className="text-xl font-black text-slate-900">{(stats as any).totalActivePincodes || (stats as any).activePincodes?.length || 0} Zones</p>
                    </div>
                </Link>

                <div 
                    onClick={openVerifiedEmailsModal}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 hover:border-emerald-200 transition-all group cursor-pointer"
                >
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                        <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Verified Emails</p>
                        <p className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{(stats as any).totalVerifiedEmails || 0} Users</p>
                    </div>
                </div>
                
                {campaignStats?.campaign && (
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Contest Participants</p>
                            <p className="text-xl font-black text-slate-900">{campaignStats.total_participants}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Repayments & Health Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-base font-bold text-slate-900">Recent Repayments</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-5">User</th>
                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                    <th className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-5">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.recentRepayments && (stats.recentRepayments as any[]).length > 0 ? (
                                    (stats.recentRepayments as any[]).map((rp: any) => (
                                        <tr key={rp.id}>
                                            <td className="p-3 pl-5">
                                                <p className="font-bold text-slate-900 text-xs">{rp.user_name}</p>
                                                <p className="text-[10px] font-medium text-slate-400">#{rp.id}</p>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-black text-emerald-600 text-sm">
                                                    +₹{parseFloat(rp.amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase ${rp.mode === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>{rp.mode}</span>
                                                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 pl-1">{rp.type}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right pr-5 text-[10px] font-bold text-slate-400">
                                                {new Date(rp.paid_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-bold">No recent repayments found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vertical Right Column */}
                <div className="space-y-6">
                    {/* Loan Health Stats */}
                    <div>
                        <div className="flex items-center justify-between px-1 mb-3">
                            <h3 className="text-base font-bold text-slate-900">Loan Status</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Loans</p>
                                    <p className="text-xl font-black text-slate-900">{stats.activeLoans}</p>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Processing</p>
                                    <p className="text-xl font-black text-slate-900">{stats.pendingLoans}</p>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Ban className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Defaulted</p>
                                    <p className="text-xl font-black text-slate-900">{stats.defaultedLoans}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone Coverage Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Penetration</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">50+ Merchants Mapped</p>
                        </div>
                        <Link href="/pincodes" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                            Full Map <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(stats as any).activePincodes && (stats as any).activePincodes.slice(0, 6).map((area: any) => (
                            <div key={area.pincode} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-black text-slate-900 leading-none">{area.pincode}</p>
                                    <p className="text-[8px] font-bold text-blue-500 uppercase mt-0.5">{area.mapped_count} Mapped</p>
                                </div>
                            </div>
                        ))}
                        {(stats as any).activePincodes?.length === 0 && (
                            <div className="col-span-full py-4 text-center text-[10px] font-bold text-slate-300 uppercase italic">No active clusters yet</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Upcoming Growth</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">1-49 Merchants mapped</p>
                        </div>
                        <Link href="/pincodes?tab=upcoming" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                            Growth View <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(stats as any).upcomingPincodes && (stats as any).upcomingPincodes.slice(0, 6).map((area: any) => (
                            <div key={area.pincode} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="w-6 h-6 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                                    <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-black text-slate-900 leading-none">{area.pincode}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{area.mapped_count} entities</p>
                                </div>
                            </div>
                        ))}
                        {(stats as any).upcomingPincodes?.length === 0 && (
                            <div className="col-span-full py-4 text-center text-[10px] font-bold text-slate-300 uppercase italic">No growth areas detected</div>
                        )}
                    </div>
                </div>
            </div>


            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Pending Fund Approvals</h3>
                        <p className="text-slate-500 font-medium text-xs mt-0.5">Review and approve manual fund additions.</p>
                    </div>
                    {loading && <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />}
                </div>

                {pendingTx.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BadgeCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">No pending approvals</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">User</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingTx.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 pl-6">
                                            <p className="font-bold text-slate-900 text-sm">{tx.user_name}</p>
                                            <p className="text-[10px] font-medium text-slate-500">{tx.user_mobile}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm">
                                                +₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-500 text-xs text-sm">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleReject(tx.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Reject"
                                                >
                                                    <Ban className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(tx.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                                >
                                                    <BadgeCheck className="w-4 h-4" />
                                                    Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Campaign Participation & Leaderboard */}
            {campaignStats?.campaign && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-8 mt-8">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    {campaignStats.campaign.is_active ? 'Active Contest' : 'Past Contest'}: {campaignStats.campaign.title}
                                </h3>
                                {!campaignStats.campaign.is_active && (
                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-md">Deactivated</span>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium text-xs">
                                {campaignStats.campaign.is_active 
                                    ? 'Real-time participation and leaderboard scores.' 
                                    : `Final scores recorded at ${new Date(campaignStats.campaign.deactivated_at || campaignStats.campaign.updated_at).toLocaleString()}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Participants</p>
                                <p className="text-xl font-black text-indigo-600 leading-none">{campaignStats.total_participants}</p>
                            </div>
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                                <Trophy size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-6">Participant</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loans</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarding</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-6">Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {campaignStats.participants.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 pl-6">
                                            <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                            <p className="text-[10px] font-medium text-slate-500">ID: {p.user_id}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${p.user_type === 'VENDOR' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                                                {p.user_type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-black text-slate-600">PLAN {p.plan}</td>
                                        <td className="p-4 font-bold text-slate-900">{p.loans}</td>
                                        <td className="p-4 font-bold text-slate-900">{p.onboarding}</td>
                                        <td className="p-4 text-right pr-6">
                                            <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                                                {p.score} PTS
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {campaignStats.participants.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 font-bold italic">No participants yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <CampaignManager onViewStats={loadCampaignStats} />


            {isVerifiedModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-950">Verified Email Addresses</h3>
                                <p className="text-xs text-slate-500 font-medium">List of all verified customers, merchants, agents, and vendors.</p>
                            </div>
                            <button 
                                onClick={() => setIsVerifiedModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name, email or type..."
                                    value={verifiedSearch}
                                    onChange={(e) => setVerifiedSearch(e.target.value)}
                                    className="w-full bg-white pl-4 pr-10 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-medium text-slate-900 transition-colors"
                                />
                                {verifiedSearch && (
                                    <button 
                                        onClick={() => setVerifiedSearch('')}
                                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto min-h-[300px]">
                            {loadingVerified ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">Loading verified users...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {verifiedUsers
                                        .filter(user => {
                                            const term = verifiedSearch.toLowerCase();
                                            return (
                                                (user.name || '').toLowerCase().includes(term) ||
                                                (user.email || '').toLowerCase().includes(term) ||
                                                (user.type || '').toLowerCase().includes(term) ||
                                                (user.mobile_number || '').toLowerCase().includes(term)
                                            );
                                        })
                                        .map((user, idx) => (
                                            <div key={`${user.type}-${user.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors animate-in fade-in duration-150">
                                                <div className="min-w-0 flex-1 pr-4">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="font-bold text-slate-950 truncate text-sm">{user.name}</p>
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                                                            user.type === 'Customer' ? 'bg-emerald-100 text-emerald-800' :
                                                            user.type === 'Merchant' ? 'bg-amber-100 text-amber-800' :
                                                            user.type === 'Agent' ? 'bg-violet-100 text-violet-800' :
                                                            user.type === 'Vendor' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-slate-100 text-slate-800'
                                                        }`}>
                                                            {user.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                                        <span className="font-medium truncate">{user.email}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="font-mono text-slate-400">{user.mobile_number}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Verified On</p>
                                                    <p className="text-xs font-semibold text-slate-750">{user.verified_at ? new Date(user.verified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                                                </div>
                                            </div>
                                        ))
                                    }

                                    {verifiedUsers.filter(user => {
                                        const term = verifiedSearch.toLowerCase();
                                        return (
                                            (user.name || '').toLowerCase().includes(term) ||
                                            (user.email || '').toLowerCase().includes(term) ||
                                            (user.type || '').toLowerCase().includes(term) ||
                                            (user.mobile_number || '').toLowerCase().includes(term)
                                        );
                                    }).length === 0 && (
                                        <div className="py-20 text-center">
                                            <p className="text-sm font-bold text-slate-400 italic">No verified users found matching search</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500">
                            <span>Total Verified: {verifiedUsers.length}</span>
                            <span>OpenScore Verification Portal</span>
                        </div>
                    </div>
                </div>
            )}

            {isOutstandingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-950">Outstanding Portfolio Audit</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black tracking-wider uppercase animate-pulse">pH-Scale Color Coded</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Realtime list of active borrowers, classified by repayment delay acidity index (pH scale).</p>
                            </div>
                            <button 
                                onClick={() => setIsOutstandingModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by borrower name, phone, type or loan ID..."
                                    value={outstandingSearch}
                                    onChange={(e) => setOutstandingSearch(e.target.value)}
                                    className="w-full bg-white pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-500 font-medium text-slate-900 transition-colors"
                                />
                                {outstandingSearch && (
                                    <button 
                                        onClick={() => setOutstandingSearch('')}
                                        className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-600">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> pH 14 (Safe / Up to Date)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> pH 9 (1-3 Days Overdue)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> pH 5 (4-10 Days Overdue)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> pH 3 (11-30 Days Overdue)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> pH 1 (30+ Days Overdue)</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-[300px] bg-slate-50/30">
                            {loadingOutstanding ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs text-slate-500 font-bold tracking-wider uppercase animate-pulse">Auditing outstanding loans...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {outstandingLoans
                                        .filter(loan => {
                                            const term = outstandingSearch.toLowerCase();
                                            return (
                                                (loan.name || '').toLowerCase().includes(term) ||
                                                (loan.role || '').toLowerCase().includes(term) ||
                                                (loan.mobile_number || '').toLowerCase().includes(term) ||
                                                String(loan.display_id || '').includes(term)
                                            );
                                        })
                                        .map((loan, idx) => {
                                            const overdueDays = loan.max_days_overdue;
                                            
                                            // pH-Style dynamic mapping
                                            let phLabel = 'pH 14 - Safe / Up to Date';
                                            let phClasses = 'bg-emerald-50/40 border-emerald-100 text-emerald-800 hover:border-emerald-200';
                                            let badgeClasses = 'bg-emerald-100 text-emerald-800';
                                            let dotClass = 'bg-emerald-500';

                                            if (overdueDays > 0 && overdueDays <= 3) {
                                                phLabel = `pH 9 - Mild Delay (${overdueDays}d overdue)`;
                                                phClasses = 'bg-yellow-50/40 border-yellow-100 text-yellow-800 hover:border-yellow-200';
                                                badgeClasses = 'bg-yellow-100 text-yellow-800';
                                                dotClass = 'bg-yellow-500';
                                            } else if (overdueDays > 3 && overdueDays <= 10) {
                                                phLabel = `pH 5 - Moderate Acid (${overdueDays}d overdue)`;
                                                phClasses = 'bg-orange-50/40 border-orange-100 text-orange-900 hover:border-orange-200';
                                                badgeClasses = 'bg-orange-100 text-orange-800';
                                                dotClass = 'bg-orange-500';
                                            } else if (overdueDays > 10 && overdueDays <= 30) {
                                                phLabel = `pH 3 - High Acidity (${overdueDays}d overdue)`;
                                                phClasses = 'bg-red-50/40 border-red-100 text-red-900 hover:border-red-200';
                                                badgeClasses = 'bg-red-100 text-red-800';
                                                dotClass = 'bg-red-500';
                                            } else if (overdueDays > 30) {
                                                phLabel = `pH 1 - Corrosive Acid (${overdueDays}d overdue)`;
                                                phClasses = 'bg-rose-50/40 border-rose-200 text-rose-950 hover:border-rose-300';
                                                badgeClasses = 'bg-rose-100 text-rose-900';
                                                dotClass = 'bg-rose-600 animate-pulse';
                                            }

                                            return (
                                                <div 
                                                    key={`outstanding-${loan.loan_id}-${idx}`} 
                                                    className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:shadow-sm ${phClasses}`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="font-bold text-slate-900 text-sm">{loan.name}</p>
                                                                    <span className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-900/10 text-slate-800 uppercase tracking-wide">
                                                                        {loan.role}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tight mt-0.5">{loan.mobile_number}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-900 text-white">
                                                                    ID: #{loan.display_id}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Loan details */}
                                                        <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-950/5 text-xs">
                                                            <div>
                                                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Principal Hold</p>
                                                                <p className="font-black text-slate-855">₹{loan.loan_amount.toLocaleString('en-IN')}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Total Pending Dues</p>
                                                                <p className="font-black text-purple-755">₹{loan.outstanding_amount.toLocaleString('en-IN')}</p>
                                                            </div>
                                                        </div>

                                                        {/* Repayments detail list */}
                                                        <div className="mt-3 space-y-1.5">
                                                            <p className="text-[8px] font-black uppercase tracking-wider text-slate-450 mb-1">Repayment Schedule</p>
                                                            {loan.repayments.map((rep: any, rIdx: number) => {
                                                                const repOverdue = rep.days_overdue;
                                                                return (
                                                                    <div key={`rep-${rep.id}-${rIdx}`} className="flex justify-between items-center text-[10px] py-1 px-2 rounded-lg bg-slate-955/5 font-semibold text-slate-750">
                                                                        <span>EMI Installment</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span>₹{rep.amount.toLocaleString('en-IN')}</span>
                                                                            <span className="text-slate-300">|</span>
                                                                            <span>Due: {new Date(rep.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                                            {repOverdue > 0 ? (
                                                                                <span className="text-red-600 font-bold">({repOverdue}d late)</span>
                                                                            ) : (
                                                                                <span className="text-emerald-600 font-bold">(On Time)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* pH Scale Indicator Bar */}
                                                    <div className="mt-4 pt-3 border-t border-slate-955/5 flex items-center justify-between text-[10px] font-bold">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
                                                            <span className="font-bold">{phLabel}</span>
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${badgeClasses}`}>
                                                            {overdueDays === 0 ? 'ALKALINE' : 'ACIDIC'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }

                                    {outstandingLoans.filter(loan => {
                                        const term = outstandingSearch.toLowerCase();
                                        return (
                                            (loan.name || '').toLowerCase().includes(term) ||
                                            (loan.role || '').toLowerCase().includes(term) ||
                                            (loan.mobile_number || '').toLowerCase().includes(term) ||
                                            String(loan.display_id || '').includes(term)
                                        );
                                    }).length === 0 && (
                                        <div className="col-span-2 py-20 text-center">
                                            <p className="text-sm font-bold text-slate-400 italic">No outstanding accounts found matching search</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500">
                            <span>Active Outstanding Loans: {outstandingLoans.length}</span>
                            <span>OpenScore Audit Dashboard</span>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
