'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import {
    User, Wallet, History, CreditCard, ArrowLeft,
    Calendar, Shield, ShieldAlert, CheckCircle2,
    Clock, BadgeCheck, Phone, Mail, Building2, MapPin,
    ArrowUpRight, ArrowDownLeft, Download, Users, X,
    Search, Filter, ChevronLeft, ChevronRight, FileSpreadsheet, ExternalLink
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});

    // Transaction States
    const [txSearch, setTxSearch] = useState('');
    const [txRoleFilter, setTxRoleFilter] = useState('ALL');
    const [txMinAmt, setTxMinAmt] = useState('');
    const [txMaxAmt, setTxMaxAmt] = useState('');
    const [txPage, setTxPage] = useState(1);
    const TXS_PER_PAGE = 10;

    // Filter Logic
    const filteredTransactions = (data?.transactions || []).filter((tx: any) => {
        const matchesSearch = txSearch === '' ||
            tx.description?.toLowerCase().includes(txSearch.toLowerCase()) ||
            tx.source_type?.toLowerCase().includes(txSearch.toLowerCase()) ||
            tx.paid_to?.name?.toLowerCase().includes(txSearch.toLowerCase()) ||
            tx.paid_to?.mobile?.includes(txSearch);

        const matchesRole = txRoleFilter === 'ALL' ||
            (txRoleFilter === 'SYSTEM' ? !tx.paid_to : tx.paid_to?.role === txRoleFilter);

        const matchesAmt = (txMinAmt === '' || parseFloat(tx.amount) >= parseFloat(txMinAmt)) &&
            (txMaxAmt === '' || parseFloat(tx.amount) <= parseFloat(txMaxAmt));

        return matchesSearch && matchesRole && matchesAmt;
    });

    const totalPages = Math.ceil(filteredTransactions.length / TXS_PER_PAGE);
    const paginatedTransactions = filteredTransactions.slice((txPage - 1) * TXS_PER_PAGE, txPage * TXS_PER_PAGE);

    const handleExportCSV = () => {
        if (!data?.user || !data?.transactions) return;

        const headers = ["ID", "Date", "Type", "Source", "Amount", "Description", "Interaction Name", "Interaction Mobile", "Interaction Role"];
        const rows = filteredTransactions.map((tx: any) => [
            tx.id,
            `"${new Date(tx.created_at).toLocaleString()}"`,
            tx.type,
            tx.source_type,
            tx.amount,
            `"${tx.description || ''}"`,
            `"${tx.paid_to?.name || 'System'}"`,
            `"${tx.paid_to?.mobile || '-'}"`,
            tx.paid_to?.role || '-'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `tx_${data.user.mobile_number}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Transaction report exported successfully");
    };

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

    useEffect(() => {
        if (editFormData.is_permanent_same) {
            setEditFormData((prev: any) => ({
                ...prev,
                permanent_street_address: prev.business_address,
                permanent_city: prev.city,
                permanent_state: prev.state,
                permanent_pincode: prev.pincode
            }));
        }
    }, [
        editFormData.is_permanent_same,
        editFormData.business_address,
        editFormData.city,
        editFormData.state,
        editFormData.pincode
    ]);



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

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Filter out empty fields to avoid overriding with null/empty in DB
            const filteredData = Object.fromEntries(
                Object.entries(editFormData).filter(([_, val]) => val !== null && val !== undefined && val !== '')
            );

            await apiFetch(`/admin/users/${id}/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filteredData)
            });
            toast.success("User profile updated successfully");
            setIsEditModalOpen(false);
            loadData();
        } catch (e: any) {
            toast.error(e.message || "Failed to update user");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = () => {
        let decodedPin = user.visible_pin || '';
        try { if (user.visible_pin) decodedPin = atob(user.visible_pin); } catch (e) { }

        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            mobile_number: user.mobile_number || '',
            business_name: user.business_name || '',
            daily_turnover: user.daily_turnover || '',
            aadhar_number: user.aadhar_number || '',
            pan_number: user.pan_number || '',
            bank_name: user.bank_name || '',
            ifsc_code: user.ifsc_code || '',
            account_number: user.account_number || '',
            account_holder_name: user.account_holder_name || '',
            status: user.status || 'ACTIVE',
            role: user.role || 'CUSTOMER',
            kyc_status: user.kyc_status || 'PENDING',
            app_pin: decodedPin,
            business_address: user.business_address || '',
            city: user.city || '',
            state: user.state || '',
            pincode: user.pincode || '',
            business_nature: user.business_nature || '',
            business_segment: user.business_segment || '',
            business_type: user.business_type || '',
            customer_segment: user.customer_segment || '',
            permanent_street_address: user.permanent_street_address || '',
            permanent_city: user.permanent_city || '',
            permanent_state: user.permanent_state || '',
            permanent_pincode: user.permanent_pincode || '',
            is_permanent_same: user.is_permanent_same ?? true,
            date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : ''
        });
        setIsEditModalOpen(true);
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
        <>
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
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                        user.role === 'MERCHANT' ? "bg-indigo-100 text-indigo-700" :
                                            user.role === 'STUDENT' ? "bg-purple-100 text-purple-700" :
                                                user.role === 'AGENT' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500 font-bold text-sm">
                                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {user.mobile_number}</span>
                                    {user.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>}
                                    {user.date_of_birth && <span className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100"><Calendar className="w-3.5 h-3.5" /> DOB: {new Date(user.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (user.visible_pin) {
                                                    try {
                                                        const decodedPin = atob(user.visible_pin);
                                                        toast.success(`App PIN: ${decodedPin}`);
                                                    } catch (e) {
                                                        toast.success(`App PIN: ${user.visible_pin}`);
                                                    }
                                                } else {
                                                    toast.info("PIN is Securely Hashed (Reset in Edit to View)");
                                                }
                                            }}
                                            className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-lg hover:bg-slate-200 transition-all font-black uppercase tracking-widest active:scale-95 flex items-center gap-1.5"
                                        >
                                            <ShieldAlert className="w-3 h-3" /> Show App PIN
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white p-6 rounded-3xl min-w-[240px] shadow-2xl shadow-slate-200 relative group">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Wallet Balance</p>
                                <p className="text-3xl font-black italic">₹{parseFloat(user.wallet_balance).toLocaleString('en-IN')}</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className={cn(
                                        "flex items-center gap-2 text-xs font-bold",
                                        user.kyc_status === 'FULL_VERIFIED' ? "text-emerald-400" :
                                            user.kyc_status === 'FIELD_VERIFIED' ? "text-amber-400" : "text-slate-400 opacity-50"
                                    )}>
                                        {user.kyc_status === 'FULL_VERIFIED' ? <BadgeCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        {user.kyc_status === 'FULL_VERIFIED' ? 'Verified Merchant' :
                                            user.kyc_status === 'FIELD_VERIFIED' ? 'Field Verified' : 'Pending KYC'}
                                    </div>
                                    <button
                                        onClick={openEditModal}
                                        className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {user.business_name && (
                            <div className="mt-8 pt-8 border-t border-slate-100 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aadhar</p>
                                        <p className="font-mono font-bold text-slate-700">{user.aadhar_number || 'Not Provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN Card</p>
                                        <p className="font-mono font-bold text-slate-700">{user.pan_number || 'Not Provided'}</p>
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-blue-500" /> Current Business Address
                                        </h4>
                                        <p className="text-sm font-bold text-slate-900">{user.business_address || 'Not Provided'}</p>
                                        <p className="text-xs text-slate-500 mt-1">{user.city ? `${user.city}, ` : ''}{user.state ? `${user.state} ` : ''}{user.pincode ? `- ${user.pincode}` : ''}</p>
                                        {(user.location_url || user.map_location_url) && (
                                            <a
                                                href={user.location_url || user.map_location_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors uppercase tracking-wider"
                                            >
                                                <ExternalLink size={10} /> View on Google Maps
                                            </a>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Shield className="w-3 h-3 text-purple-500" /> Permanent Address
                                        </h4>
                                        {user.is_permanent_same ? (
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" /> Same as Current Address
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 italic">Identity verification synced with current business location.</p>
                                            </div>
                                        ) : user.permanent_street_address ? (
                                            <>
                                                <p className="text-sm font-bold text-slate-900">{user.permanent_street_address}</p>
                                                <p className="text-xs text-slate-500 mt-1">{user.permanent_city ? `${user.permanent_city}, ` : ''}{user.permanent_state ? `${user.permanent_state} ` : ''}{user.permanent_pincode ? `- ${user.permanent_pincode}` : ''}</p>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold text-slate-400 italic">Not Provided</p>
                                        )}
                                    </div>
                                </div>

                                {/* KYC & Documents Display */}
                                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield className="w-3 h-3" /> KYC Documents & Shop Proofs
                                    </h4>
                                    <div className="flex flex-wrap gap-4">
                                        {user.aadhar_image && (
                                            <a href={user.aadhar_image} target="_blank" className="group relative">
                                                <div className="w-32 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                    <img src={user.aadhar_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Aadhar Front" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm p-1 text-center">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Aadhar Front</span>
                                                    </div>
                                                </div>
                                            </a>
                                        )}
                                        {user.aadhar_back_image && (
                                            <a href={user.aadhar_back_image} target="_blank" className="group relative">
                                                <div className="w-32 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                    <img src={user.aadhar_back_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Aadhar Back" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm p-1 text-center">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Aadhar Back</span>
                                                    </div>
                                                </div>
                                            </a>
                                        )}
                                        {user.pan_image && (
                                            <a href={user.pan_image} target="_blank" className="group relative">
                                                <div className="w-32 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                    <img src={user.pan_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="PAN Card" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm p-1 text-center">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">PAN Card</span>
                                                    </div>
                                                </div>
                                            </a>
                                        )}
                                        {user.shop_images && Array.isArray(user.shop_images) && user.shop_images.map((img: string, idx: number) => (
                                            <a key={idx} href={img} target="_blank" className="group relative">
                                                <div className="w-32 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                    <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={`Shop ${idx + 1}`} />
                                                    <div className="absolute inset-x-0 bottom-0 bg-emerald-900/60 backdrop-blur-sm p-1 text-center">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Shop Photo {idx + 1}</span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                        {!user.aadhar_image && !user.pan_image && (!user.shop_images || user.shop_images.length === 0) && (
                                            <div className="w-full py-8 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 border-dashed">
                                                <ShieldAlert className="w-6 h-6 text-slate-200 mb-2" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Documents Uploaded</p>
                                            </div>
                                        )}
                                    </div>
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

                        {/* Cashback Settings - Hidden for internal users except Agents */}
                        {!(user.role !== 'SUPPORT_AGENT' && ['ADMIN', 'SUPPORT', 'SYSTEM', 'SUPPORT_AGENT'].includes(user.role)) || user.role === 'SUPPORT_AGENT' ? (
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
                        ) : null}

                        {user.maintenance_rule && (
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                                    <ShieldAlert size={14} />
                                    Maintenance Charge
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm font-black text-slate-900">{user.maintenance_rule.name}</p>
                                            <span className="text-sm font-black text-red-600">
                                                {user.maintenance_rule.type === 'FLAT' ? `₹${user.maintenance_rule.amount}` : `${user.maintenance_rule.amount}%`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                                user.maintenance_rule.frequency === 'DAILY' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {user.maintenance_rule.frequency}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                            {user.maintenance_rule.description}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-medium text-slate-400 px-1 leading-relaxed">
                                        Note: Users can only have one active maintenance rule. Recurring rules are processed nightly at 12:00 AM.
                                    </p>
                                </div>
                            </div>
                        )}

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
                            {(!(user.role !== 'SUPPORT_AGENT' && ['ADMIN', 'SUPPORT', 'SYSTEM', 'SUPPORT_AGENT'].includes(user.role)) || user.role === 'SUPPORT_AGENT') && (
                                <button
                                    onClick={() => setActiveTab('REFERRALS')}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all",
                                        activeTab === 'REFERRALS' ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <Users className="w-4 h-4" /> Referral History
                                </button>
                            )}
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 italic">Financial Activity Trace</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Total Records Trace: {filteredTransactions.length}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" /> Export Report
                                    </button>
                                </div>
                            </div>

                            {/* Logic Filter Panel */}
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6">
                                <div className="flex-1 min-w-[280px] relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        value={txSearch}
                                        onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                                        placeholder="Search by name, ID or description..."
                                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-1 focus:ring-slate-100 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type:</label>
                                        <select
                                            value={txRoleFilter}
                                            onChange={e => { setTxRoleFilter(e.target.value); setTxPage(1); }}
                                            className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-1 focus:ring-slate-100"
                                        >
                                            <option value="ALL">ALL ENTITIES</option>
                                            <option value="MERCHANT">MERCHANTS</option>
                                            <option value="CUSTOMER">CUSTOMERS</option>
                                            <option value="STUDENT">STUDENTS</option>
                                            <option value="SYSTEM">CORE SYSTEM</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Amount:</label>
                                        <input
                                            type="number"
                                            value={txMinAmt}
                                            onChange={e => { setTxMinAmt(e.target.value); setTxPage(1); }}
                                            className="w-24 bg-slate-50 border-none rounded-2xl px-4 py-3 text-[10px] font-black text-slate-900 focus:ring-1 focus:ring-slate-100"
                                            placeholder="₹"
                                        />
                                    </div>
                                    {(txSearch || txRoleFilter !== 'ALL' || txMinAmt) && (
                                        <button
                                            onClick={() => { setTxSearch(''); setTxRoleFilter('ALL'); setTxMinAmt(''); setTxPage(1); }}
                                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-3 rounded-2xl transition-all"
                                        >
                                            Clear Trace
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Trace</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume (₹)</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Interaction</th>
                                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedTransactions.map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform",
                                                            tx.type === 'CREDIT' ? "bg-emerald-50 text-emerald-600 shadow-emerald-50" : "bg-rose-50 text-rose-600 shadow-rose-50"
                                                        )}>
                                                            {tx.type === 'CREDIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 text-sm italic">
                                                                {(tx.source_type === 'MAINTENANCE_CHARGE' && tx.description?.match(/^\[(.*?)\]/))
                                                                    ? tx.description.match(/^\[(.*?)\]/)[1]
                                                                    : tx.source_type.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter opacity-70">{tx.description?.replace(/^\[.*?\]\s*/, '')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={cn(
                                                        "font-black text-base flex flex-col",
                                                        tx.type === 'CREDIT' ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {tx.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                                        <span className="text-[8px] font-black uppercase opacity-40">TX #{tx.id}</span>
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    {(tx.paid_to && tx.paid_to.role === 'MERCHANT') ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm border border-slate-50">
                                                                {tx.paid_to.name?.[0] || 'M'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <p className="text-sm font-black text-slate-900 italic">
                                                                        {tx.paid_to.business_name || tx.paid_to.name}
                                                                    </p>
                                                                    <span className="text-[7px] px-1 bg-indigo-50 text-indigo-400 font-black rounded uppercase border border-indigo-100">
                                                                        MERCHANT
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                    <Phone className="w-2.5 h-2.5" /> {tx.paid_to.mobile}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 opacity-50 px-1">
                                                            <Shield size={14} className="text-slate-300" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Core Transaction</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-xs font-black text-slate-900">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic opacity-60">{new Date(tx.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                                        <History size={48} className="text-slate-200" />
                                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No trace entities found for this query</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Trace Pagination */}
                                <div className="flex items-center justify-between p-8 bg-slate-50/50 border-t border-slate-100">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Sequence</p>
                                        <p className="text-[10px] font-bold text-slate-900">Index {txPage} of {totalPages || 1}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={txPage <= 1}
                                            onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                            className="w-12 h-12 bg-white text-slate-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            disabled={txPage >= totalPages}
                                            onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                                            className="w-12 h-12 bg-white text-slate-500 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>

            {
                isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
                            <header className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Edit User Profile</h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manual Master Override</p>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto p-8">
                                <form id="editUserForm" onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.name}
                                            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.email}
                                            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.mobile_number}
                                            onChange={e => setEditFormData({ ...editFormData, mobile_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.date_of_birth || ''}
                                            onChange={e => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 py-2 border-b border-slate-50">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Business & KYC Information</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.business_name}
                                            onChange={e => setEditFormData({ ...editFormData, business_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Turnover</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.daily_turnover}
                                            onChange={e => setEditFormData({ ...editFormData, daily_turnover: e.target.value })}
                                        >
                                            <option value="">Select Turnover</option>
                                            <option value="Under 5,000">Under ₹5,000</option>
                                            <option value="5,000 - 10,000">₹5,000 - ₹10,000</option>
                                            <option value="10,000 - 25,000">₹10,000 - ₹25,000</option>
                                            <option value="Above 25,000">Above ₹25,000</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Nature</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.business_nature || ''}
                                            onChange={e => setEditFormData({ ...editFormData, business_nature: e.target.value })}
                                            placeholder="e.g. Retail, Service"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Segment</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.business_segment || ''}
                                            onChange={e => setEditFormData({ ...editFormData, business_segment: e.target.value })}
                                            placeholder="e.g. MSME, Individual"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Type</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.business_type || ''}
                                            onChange={e => setEditFormData({ ...editFormData, business_type: e.target.value })}
                                            placeholder="e.g. Proprietorship"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Segment</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.customer_segment || ''}
                                            onChange={e => setEditFormData({ ...editFormData, customer_segment: e.target.value })}
                                            placeholder="e.g. Tier-1, Premium"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhaar Number</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.aadhar_number}
                                            onChange={e => setEditFormData({ ...editFormData, aadhar_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Number</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.pan_number}
                                            onChange={e => setEditFormData({ ...editFormData, pan_number: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 py-2 border-b border-slate-50">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Current Address</p>
                                    </div>
                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Street Address</label>
                                        <textarea
                                            rows={2}
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900 resize-none"
                                            value={editFormData.business_address || ''}
                                            onChange={e => setEditFormData({ ...editFormData, business_address: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current City</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.city || ''}
                                            onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current State</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.state || ''}
                                            onChange={e => setEditFormData({ ...editFormData, state: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current PIN Code</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.pincode || ''}
                                            onChange={e => setEditFormData({ ...editFormData, pincode: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 py-4 flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 rounded-xl">
                                        <div>
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none mb-1">Permanent Address (Mandatory)</p>
                                            <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Official address as per KYC documents</p>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">Same as Current</span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={editFormData.is_permanent_same}
                                                    onChange={(e) => setEditFormData({ ...editFormData, is_permanent_same: e.target.checked })}
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-colors ${editFormData.is_permanent_same ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${editFormData.is_permanent_same ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="space-y-1 col-span-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent Street Address</label>
                                        <textarea
                                            rows={2}
                                            className={`w-full border-none rounded-xl p-4 text-sm font-bold resize-none transition-all ${editFormData.is_permanent_same ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900'}`}
                                            value={editFormData.permanent_street_address || ''}
                                            onChange={e => setEditFormData({ ...editFormData, permanent_street_address: e.target.value })}
                                            readOnly={editFormData.is_permanent_same}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent City</label>
                                        <input
                                            className={`w-full border-none rounded-xl p-4 text-sm font-bold resize-none transition-all ${editFormData.is_permanent_same ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900'}`}
                                            value={editFormData.permanent_city || ''}
                                            onChange={e => setEditFormData({ ...editFormData, permanent_city: e.target.value })}
                                            readOnly={editFormData.is_permanent_same}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent State</label>
                                        <input
                                            className={`w-full border-none rounded-xl p-4 text-sm font-bold resize-none transition-all ${editFormData.is_permanent_same ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900'}`}
                                            value={editFormData.permanent_state || ''}
                                            onChange={e => setEditFormData({ ...editFormData, permanent_state: e.target.value })}
                                            readOnly={editFormData.is_permanent_same}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent PIN Code</label>
                                        <input
                                            className={`w-full border-none rounded-xl p-4 text-sm font-bold resize-none transition-all ${editFormData.is_permanent_same ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900'}`}
                                            value={editFormData.permanent_pincode || ''}
                                            onChange={e => setEditFormData({ ...editFormData, permanent_pincode: e.target.value })}
                                            readOnly={editFormData.is_permanent_same}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 py-2 border-b border-slate-50">
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Bank Details</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.bank_name}
                                            onChange={e => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IFSC Code</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900 uppercase"
                                            value={editFormData.ifsc_code}
                                            onChange={e => setEditFormData({ ...editFormData, ifsc_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.account_number}
                                            onChange={e => setEditFormData({ ...editFormData, account_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                                        <input
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.account_holder_name}
                                            onChange={e => setEditFormData({ ...editFormData, account_holder_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 py-2 border-b border-slate-50">
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">System Access</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Status</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.status}
                                            onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="PENDING">PENDING</option>
                                            <option value="SUSPENDED">SUSPENDED</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">User Role</label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            value={editFormData.role}
                                            onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                        >
                                            <option value="CUSTOMER">CUSTOMER</option>
                                            <option value="MERCHANT">MERCHANT</option>
                                            <option value="AGENT">AGENT</option>
                                            <option value="SUPPORT">SUPPORT</option>
                                            <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App PIN (4 or 6 Digits)</label>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900"
                                            placeholder="Enter 4 or 6-digit PIN"
                                            value={editFormData.app_pin}
                                            onChange={e => setEditFormData({ ...editFormData, app_pin: e.target.value.replace(/[^0-9]/g, '') })}
                                        />
                                    </div>
                                </form>
                            </div>

                            <footer className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-4 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="editUserForm"
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "Updating..." : "Save Changes"}
                                </button>
                            </footer>
                        </div>
                    </div>
                )}
        </>
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
