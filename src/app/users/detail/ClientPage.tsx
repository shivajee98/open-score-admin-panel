'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    User, Wallet, History, CreditCard, ArrowLeft,
    Calendar, Shield, ShieldAlert, CheckCircle2,
    Clock, BadgeCheck, Phone, Mail, Building2,
    ArrowUpRight, ArrowDownLeft, Download, Users
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Client Component only
export default function UserDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id || searchParams.get('id');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('LOANS');
    const [cashbackPercent, setCashbackPercent] = useState<any>('');
    const [cashbackFlat, setCashbackFlat] = useState<any>('');
    const [receivePercent, setReceivePercent] = useState<any>('');
    const [receiveFlat, setReceiveFlat] = useState<any>('');
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        try {
            const res = await apiFetch(`/admin/users/${id}/full-details`);
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (data?.user) {
            setCashbackPercent(data.user.cashback_percentage ?? '');
            setCashbackFlat(data.user.cashback_flat_amount ?? '');
            setReceivePercent(data.user.receive_cashback_percentage ?? '');
            setReceiveFlat(data.user.receive_cashback_flat_amount ?? '');
        }
    }, [data?.user]);

    const handleSenderPercentChange = (val: string) => {
        setCashbackPercent(val);
        if (parseFloat(val) > 0) setCashbackFlat('');
    };

    const handleSenderFlatChange = (val: string) => {
        setCashbackFlat(val);
        if (parseFloat(val) > 0) setCashbackPercent('');
    };

    const handleReceiverPercentChange = (val: string) => {
        setReceivePercent(val);
        if (parseFloat(val) > 0) setReceiveFlat('');
    };

    const handleReceiverFlatChange = (val: string) => {
        setReceiveFlat(val);
        if (parseFloat(val) > 0) setReceivePercent('');
    };

    const handleSaveCashback = async () => {
        setIsSaving(true);
        try {
            const pPercent = parseFloat(cashbackPercent) || 0;
            const pFlat = parseFloat(cashbackFlat) || 0;
            const rPercent = parseFloat(receivePercent) || 0;
            const rFlat = parseFloat(receiveFlat) || 0;

            if (pPercent < 0 || pFlat < 0 || rPercent < 0 || rFlat < 0) {
                throw new Error("Cashback values cannot be negative");
            }

            await apiFetch(`/admin/users/${id}/cashback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cashback_percentage: pPercent,
                    cashback_flat_amount: pFlat,
                    receive_cashback_percentage: rPercent,
                    receive_cashback_flat_amount: rFlat
                })
            });
            toast.success("Cashback settings updated successfully");
            loadData();
        } catch (e: any) {
            toast.error(e.message || "Failed to update cashback");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="User Profile">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
            </AdminLayout>
        );
    }

    if (!data) {
        return (
            <AdminLayout title="User Profile">
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-900">User not found</h3>
                    <p className="text-slate-500 mt-2">The user you are looking for does not exist or has been deleted.</p>
                    <Link href="/users" className="mt-6 inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Back to Users
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const { user, loans, transactions } = data;

    return (
        <AdminLayout title="User Logistics">
            {/* Header / Basic Info */}
            <div className="mb-8">
                <Link href="/users" className="inline-flex items-center gap-2 text-slate-500 font-bold text-sm mb-6 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to User Management
                </Link>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32 -z-10" />

                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-200">
                            {user.name?.[0] || 'U'}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.name || 'Unknown User'}</h1>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    user.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                )}>
                                    {user.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500 font-bold text-sm">
                                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {user.mobile_number}</span>
                                {user.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>}
                                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                {user.referred_by && (
                                    <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                        <Users className="w-3.5 h-3.5 text-blue-400" />
                                        User Ref: {user.referred_by.name} ({user.referred_by.code})
                                    </span>
                                )}
                                {user.agent_referral && (
                                    <span className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                                        Agent: {user.agent_referral.name} ({user.agent_referral.referral_code})
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Role: {user.role}</span>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-3xl min-w-[240px] shadow-2xl shadow-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Wallet Balance</p>
                            <p className="text-3xl font-black italic">₹{parseFloat(user.wallet_balance).toLocaleString('en-IN')}</p>
                            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                <BadgeCheck className="w-4 h-4" />
                                Verified Account
                            </div>
                        </div>
                    </div>

                    {user.business_name && (
                        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business</p>
                                    <p className="font-bold text-slate-900">{user.business_name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aadhaar</p>
                                <p className="font-mono font-bold text-slate-700">{user.aadhaar_number || 'Not Provided'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN</p>
                                <p className="font-mono font-bold text-slate-700">{user.pan_number || 'Not Provided'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Engagement</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-sm font-bold text-slate-500">Total Loans</span>
                                <span className="font-black text-slate-900">{loans.total_count}</span>
                            </div>
                            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                <span className="text-sm font-bold text-emerald-600">Ongoing</span>
                                <span className="font-black text-emerald-700">{loans.ongoing.length}</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <span className="text-sm font-bold text-blue-600">Past Loans</span>
                                <span className="font-black text-blue-700">{loans.past.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center justify-between">
                            Cashback Config
                            <button
                                onClick={handleSaveCashback}
                                disabled={isSaving}
                                className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all font-black uppercase tracking-widest active:scale-95"
                            >
                                {isSaving ? '...' : 'Save'}
                            </button>
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3 px-1">Sender Rules (Payer)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Percent %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={cashbackPercent}
                                            onChange={e => handleSenderPercentChange(e.target.value)}
                                            disabled={parseFloat(cashbackFlat) > 0}
                                            className={cn(
                                                "w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-black text-slate-900 focus:ring-1 focus:ring-purple-200",
                                                parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="%"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Flat ₹</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={cashbackFlat}
                                            onChange={e => handleSenderFlatChange(e.target.value)}
                                            disabled={parseFloat(cashbackPercent) > 0}
                                            className={cn(
                                                "w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-black text-slate-900 focus:ring-1 focus:ring-purple-200",
                                                parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="₹"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 px-1">Receiver Rules (Payee)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Percent %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={receivePercent}
                                            onChange={e => handleReceiverPercentChange(e.target.value)}
                                            disabled={parseFloat(receiveFlat) > 0}
                                            className={cn(
                                                "w-full bg-blue-50/50 border-none rounded-xl p-3 text-sm font-black text-slate-900 focus:ring-1 focus:ring-blue-200",
                                                parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="%"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Flat ₹</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={receiveFlat}
                                            onChange={e => handleReceiverFlatChange(e.target.value)}
                                            disabled={parseFloat(receivePercent) > 0}
                                            className={cn(
                                                "w-full bg-blue-50/50 border-none rounded-xl p-3 text-sm font-black text-slate-900 focus:ring-1 focus:ring-blue-200",
                                                parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed"
                                            )}
                                            placeholder="₹"
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-[9px] font-medium text-slate-400 px-1 leading-relaxed">
                                Dual rewards are instant. User gets credited from the capital pool based on these rules during payment transactions.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Internal Notes</h3>
                        <p className="text-xs font-medium text-slate-400 px-1 leading-relaxed">
                            No internal performance notes for this user. System health is optimal based on repayment behavior.
                        </p>
                    </div>
                </div>

                {/* Main Tabbed Content */}
                <div className="lg:col-span-3">
                    <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => setActiveTab('LOANS')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all",
                                activeTab === 'LOANS' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <CreditCard className="w-4 h-4" /> Credit Portfolio
                        </button>
                        <button
                            onClick={() => setActiveTab('TXS')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all",
                                activeTab === 'TXS' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <History className="w-4 h-4" /> Transaction Flow
                        </button>
                        <button
                            onClick={() => setActiveTab('REFERRALS')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all",
                                activeTab === 'REFERRALS' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <Users className="w-4 h-4" /> Referral History
                        </button>
                    </div>

                    {activeTab === 'LOANS' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {/* Ongoing Loans */}
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-4 px-2">Active Deployments ({loans.ongoing.length})</h3>
                                {loans.ongoing.length === 0 ? (
                                    <div className="bg-slate-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                        <p className="font-bold text-slate-400">No active loans found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {loans.ongoing.map((loan: any) => (
                                            <LoanCard key={loan.id} loan={loan} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Past Loans */}
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-4 px-2">Historical Records ({loans.past.length})</h3>
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan ID</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayments</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {loans.past.map((loan: any) => (
                                                <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-900">#{loan.id}</td>
                                                    <td className="p-4 font-black">₹{parseFloat(loan.amount).toLocaleString('en-IN')}</td>
                                                    <td className="p-4">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight",
                                                            loan.status === 'CLOSED' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                        )}>{loan.status}</span>
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-slate-500">
                                                        {loan.completed_repayments_count} Done
                                                    </td>
                                                    <td className="p-4 text-right text-xs font-bold text-slate-400">
                                                        {new Date(loan.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {loans.past.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">No past loan records</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'REFERRALS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 px-2">
                                Network Expansion Details ({data?.referral_history?.length || 0})
                            </h3>

                            {data?.referral_history?.length > 0 ? (
                                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">User Details</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Onboarding</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Loan Activity</th>
                                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Joined At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.referral_history.map((ref: any) => (
                                                <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                                                                {ref.name?.[0] || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900">{ref.name || 'Incognito User'}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{ref.mobile}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight",
                                                            ref.is_onboarded ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                        )}>
                                                            {ref.is_onboarded ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", ref.has_taken_loan ? "bg-emerald-500" : "bg-slate-300")} />
                                                            <span className="text-[10px] font-black text-slate-600 uppercase">
                                                                {ref.has_taken_loan ? 'Active User' : 'Passive User'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right pr-8">
                                                        <p className="text-xs font-bold text-slate-600">{new Date(ref.joined_at).toLocaleDateString()}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold">No friends joined via referral code yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-lg font-black text-slate-900">Transaction Flow</h3>
                            <button
                                onClick={() => toast.info("Preparing detailed statement for " + user.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                                <Download className="w-3 h-3" /> Download Statement
                            </button>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Interaction</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                                        tx.type === 'CREDIT' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {tx.type === 'CREDIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{tx.source_type.replace(/_/g, ' ')}</p>
                                                        <p className="text-[10px] font-medium text-slate-500">{tx.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={cn(
                                                    "font-black text-base",
                                                    tx.type === 'CREDIT' ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                {tx.paid_to ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">
                                                            {tx.paid_to.name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800">{tx.paid_to.business_name || tx.paid_to.name}</p>
                                                            <p className="text-[10px] font-medium text-slate-400">{tx.paid_to.mobile}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System</span>
                                                )}
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="text-xs font-bold text-slate-900">{new Date(tx.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-slate-400 font-bold">No transactions found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function LoanCard({ loan }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 right-0 p-4">
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                    loan.status === 'DISBURSED' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                )}>
                    {loan.status}
                </span>
            </div>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan ID: #{loan.id}</p>
            <p className="text-3xl font-black text-slate-900 mb-6 italic">₹{parseFloat(loan.amount).toLocaleString('en-IN')}</p>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repaid</p>
                    <p className="font-bold text-emerald-600">₹{parseFloat(loan.paid_amount || '0').toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequency</p>
                    <p className="font-bold text-slate-700">{loan.repayment_frequency}</p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-500">{loan.completed_repayments_count} Payments Done</span>
                </div>
                <Link href={`/loans`} className="text-xs font-black text-blue-600 hover:underline">
                    Manage Loan
                </Link>
            </div>
        </div>
    );
}
