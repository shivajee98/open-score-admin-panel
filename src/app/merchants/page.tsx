'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Search, Plus, Trash2, Ban, CheckCircle, MoreVertical, ReceiptIndianRupee, CheckSquare, Square, Save, Eye, Clock, X, Check, ChevronLeft, ChevronRight, Download, AlertTriangle, ArrowRightLeft, MapPin, Filter, Calendar, ShieldAlert, ShieldCheck, BadgeCheck, Unlink, AlertCircle } from 'lucide-react';
import MaintenanceChargeModal from '@/components/MaintenanceChargeModal';
import Link from 'next/link';
import VaultConfigModal from '@/components/VaultConfigModal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import MerchantKycModal from '@/components/MerchantKycModal';

// Sub-component for individual user rows to handle local input state
const UserRow = ({ user, selectedIds, toggleSelect, toggleStatus, handleDelete, setSelectedUser, setIsCreditsModalOpen, reloadUsers, currentUser, onReviewKyc, onVaultConfig }: any) => {
    const [cashbackPercent, setCashbackPercent] = useState(user.cashback_percentage ?? '');
    const [cashbackFlat, setCashbackFlat] = useState(user.cashback_flat_amount ?? '');
    const [receivePercent, setReceivePercent] = useState(user.receive_cashback_percentage ?? '');
    const [receiveFlat, setReceiveFlat] = useState(user.receive_cashback_flat_amount ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [transferEnabled, setTransferEnabled] = useState(user.transfer_enabled ?? false);
    const [isTogglingTransfer, setIsTogglingTransfer] = useState(false);
    const [isTransferringCashback, setIsTransferringCashback] = useState(false);
    const [fetchedPin, setFetchedPin] = useState<string | null>(null);
    const [isFetchingPin, setIsFetchingPin] = useState(false);

    // Sync state if user prop changes (e.g. after reload)
    useEffect(() => {
        setCashbackPercent(user.cashback_percentage ?? '');
        setCashbackFlat(user.cashback_flat_amount ?? '');
        setReceivePercent(user.receive_cashback_percentage ?? '');
        setReceiveFlat(user.receive_cashback_flat_amount ?? '');
    }, [user.cashback_percentage, user.cashback_flat_amount, user.receive_cashback_percentage, user.receive_cashback_flat_amount]);

    useEffect(() => {
        setTransferEnabled(user.transfer_enabled ?? false);
    }, [user.transfer_enabled]);

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
                alert("Values cannot be negative");
                return;
            }

            await apiFetch('/admin/users/bulk-cashback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: [user.id],
                    cashback_percentage: pPercent,
                    cashback_flat_amount: pFlat,
                    receive_cashback_percentage: rPercent,
                    receive_cashback_flat_amount: rFlat
                })
            });
            alert('Cashback updated!');
            reloadUsers();
        } catch (e) {
            alert('Error updating cashback');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFetchAppPin = async () => {
        setIsFetchingPin(true);
        try {
            const data = await apiFetch(`/admin/users/${user.id}/app-pin`);
            setFetchedPin(data.pin);
        } catch (e: any) {
            alert(e.message || 'Failed to fetch PIN');
        } finally {
            setIsFetchingPin(false);
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    const handleFullApprove = async () => {
        if (!confirm('Are you sure you want to mark this merchant as FULLY VERIFIED? This will lock their profile from further edits.')) return;
        setIsSaving(true);
        try {
            await apiFetch(`/admin/users/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kyc_status: 'FULL_VERIFIED' })
            });
            alert('Merchant fully approved!');
            reloadUsers();
        } catch (e: any) {
            alert('Error approving merchant');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleTransfer = async () => {
        setIsTogglingTransfer(true);
        const newVal = !transferEnabled;
        setTransferEnabled(newVal); // Optimistic
        try {
            await apiFetch(`/admin/users/${user.id}/toggle-transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newVal })
            });
        } catch (e) {
            setTransferEnabled(!newVal); // Revert on error
            alert('Error toggling transfer');
        } finally {
            setIsTogglingTransfer(false);
        }
    };

    const handleTransferCashback = async () => {
        const amount = user.cashback_balance || 0;
        if (!confirm(`Are you sure you want to transfer ₹${amount.toLocaleString('en-IN')} from cashback to regular wallet for ${user.name}?`)) return;
        
        setIsTransferringCashback(true);
        try {
            await apiFetch(`/admin/users/${user.id}/cashback-to-wallet`, {
                method: 'POST'
            });
            alert('Cashback transferred to regular wallet successfully!');
            reloadUsers();
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Error transferring cashback');
        } finally {
            setIsTransferringCashback(false);
        }
    };

    const handleUnlinkQR = async () => {
        if (!confirm(`WARNING: This will reset the QR mapping for ${user.name}. The QR code will be freed, and any agent bonuses/milestones for this mapping will be removed. Are you sure?`)) return;
        
        setIsSaving(true);
        try {
            await apiFetch('/admin/qr/unlink', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    merchant_id: user.id,
                    qr_code: user.mapped_qr_code
                })
            });
            alert('Merchant QR unlinked and agent data reset successfully!');
            reloadUsers();
        } catch (e: any) {
            alert(e.message || 'Error unlinking QR');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <tr className={cn("hover:bg-slate-50/80 transition-colors group", selectedIds.includes(user.id) && "bg-blue-50/30")}>
            <td className="p-6 text-center">
                {isAdmin && (
                    <button onClick={() => toggleSelect(user.id)}>
                        {selectedIds.includes(user.id) ?
                            <CheckSquare className="text-blue-600" /> : <Square className="text-slate-300 group-hover:text-slate-400" />
                        }
                    </button>
                )}
            </td>
            <td className="p-6 pl-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center font-bold text-slate-600">
                        {(user.name || 'M')[0]}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                            {user.name || user.mobile_number}
                            {!user.is_onboarded && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase tracking-tighter">
                                    Pending Onboarding
                                </span>
                            )}
                        </p>
                        <p className="text-xs font-medium text-slate-500">{user.mobile_number}</p>
                    </div>
                </div>
            </td>
            <td className="p-6">
                {user.kyc_leads?.[0]?.rejection_reason && (
                    <div className="max-w-[200px]">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                            <AlertCircle size={10} /> Rejected:
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 italic line-clamp-2">
                            "{user.kyc_leads[0].rejection_reason}"
                        </p>
                    </div>
                )}
            </td>
            <td className="p-6">
                <span className={cn(
                    "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    "bg-blue-100 text-blue-700"
                )}>
                    {user.role}
                </span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-slate-700">₹{parseFloat(user.wallet_balance || '0').toLocaleString('en-IN')}</span>
            </td>
            <td className="p-6">
                <span className="font-mono font-bold text-yellow-600">₹{parseFloat(user.cashback_balance || '0').toLocaleString('en-IN')}</span>
            </td>

            <td className="p-6">
                {isAdmin ? (
                    <div className="flex flex-col gap-1">
                        <input
                            type="number" min="0" max="100" step="0.01" placeholder="Pay %"
                            className={cn(
                                "w-20 bg-slate-100 border-none rounded-lg p-2 font-mono text-xs font-bold text-purple-600 focus:ring-2 focus:ring-purple-200",
                                parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed"
                            )}
                            value={cashbackPercent}
                            onChange={(e) => handleSenderPercentChange(e.target.value)}
                            disabled={parseFloat(cashbackFlat) > 0}
                        />
                        <input
                            type="number" min="0" max="100" step="0.01" placeholder="Rec %"
                            className={cn(
                                "w-20 bg-blue-50 border-none rounded-lg p-2 font-mono text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-200",
                                parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed"
                            )}
                            value={receivePercent}
                            onChange={(e) => handleReceiverPercentChange(e.target.value)}
                            disabled={parseFloat(receiveFlat) > 0}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col text-[10px] font-mono">
                        <span className="text-purple-600">P: {user.cashback_percentage || 0}%</span>
                        <span className="text-blue-600">R: {user.receive_cashback_percentage || 0}%</span>
                    </div>
                )}
            </td>
            <td className="p-6 text-right">
                {isAdmin ? (
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                            <input
                                type="number" min="0" step="0.01" placeholder="Pay ₹"
                                className={cn(
                                    "w-24 bg-slate-100 border-none rounded-lg p-2 font-mono text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-200",
                                    parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                value={cashbackFlat}
                                onChange={(e) => handleSenderFlatChange(e.target.value)}
                                disabled={parseFloat(cashbackPercent) > 0}
                            />
                            <input
                                type="number" min="0" step="0.01" placeholder="Rec ₹"
                                className={cn(
                                    "w-24 bg-blue-50 border-none rounded-lg p-2 font-mono text-xs font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-200",
                                    parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                value={receiveFlat}
                                onChange={(e) => handleReceiverFlatChange(e.target.value)}
                                disabled={parseFloat(receivePercent) > 0}
                            />
                        </div>
                        <button
                            onClick={handleSaveCashback}
                            disabled={isSaving}
                            className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors ml-2"
                            title="Update Cashback Rules"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col text-[10px] font-mono">
                        <span className="text-emerald-600">P: ₹{user.cashback_flat_amount || 0}</span>
                        <span className="text-indigo-600">R: ₹{user.receive_cashback_flat_amount || 0}</span>
                    </div>
                )}
            </td>

            <td className="p-6">
                <div className="flex flex-col">
                    <p className="text-xs font-bold text-slate-700">{new Date(user.date_of_join).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-mono italic">{new Date(user.date_of_join).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </td>
            <td className="p-6">
                <p className="text-xs font-bold text-slate-700">{user.pincode || 'N/A'}</p>
            </td>
            <td className="p-6 text-center">
                {isAdmin ? (
                    <div className="flex items-center justify-center gap-2">
                        {fetchedPin ? (
                            <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2 animate-in zoom-in duration-300">
                                <span className={cn(
                                    "font-mono text-sm font-black tracking-widest",
                                    fetchedPin === 'ENCODED' ? "text-slate-400 italic" : 
                                    fetchedPin.length === 6 ? "text-amber-600" : "text-blue-700"
                                )}>
                                    {fetchedPin}
                                </span>
                                <button onClick={() => setFetchedPin(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleFetchAppPin}
                                disabled={isFetchingPin}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all border border-slate-100 hover:border-blue-100 shadow-sm disabled:opacity-50 group/eye"
                                title="View App Auth PIN"
                            >
                                {isFetchingPin ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Eye className="w-4 h-4 group-hover/eye:scale-110 transition-transform" />
                                )}
                            </button>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-200">-</span>
                )}
            </td>
            <td className="p-6">
                {user.referred_by ? (
                    <div className="flex flex-col">
                        <p className="text-xs font-black text-blue-600">{user.referred_by.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{user.referred_by.mobile}</p>
                    </div>
                ) : (
                    <span className="text-xs text-slate-300 font-medium italic">Direct Join</span>
                )}
            </td>
            <td className="p-6">
                {user.referred_by?.code ? (
                    <span className="text-xs font-mono font-black text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {user.referred_by.code}
                    </span>
                ) : (
                    <span className="text-slate-200">-</span>
                )}
            </td>
             <td className="p-6">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Aadhar</p>
                    <p className="text-xs font-bold text-slate-700 font-mono tracking-tighter">{user.aadhar_number || 'N/A'}</p>
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">PAN Card</p>
                    <p className="text-xs font-bold text-slate-700 font-mono tracking-tighter uppercase">{user.pan_number || 'N/A'}</p>

                    <div className="mt-2 flex flex-col gap-1">
                        {user.kyc_status === 'FULL_VERIFIED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-tight border border-emerald-100 shadow-sm animate-in zoom-in duration-300">
                                <ShieldCheck className="w-3 h-3" /> FULL APPROVED
                            </span>
                        ) : user.kyc_status === 'FIELD_VERIFIED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-lg uppercase tracking-tight border border-amber-100 shadow-sm animate-in zoom-in duration-300">
                                <Clock className="w-3 h-3" /> FIELD VERIFIED
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-tight border border-slate-100 italic">
                                <AlertTriangle className="w-3 h-3" /> PENDING KYC
                            </span>
                        )}
                        {(user.aadhar_image || user.aadhar_back_image || user.pan_image) && (
                            <div className="flex gap-1 mt-1">
                                {user.aadhar_image && <a href={user.aadhar_image} target="_blank" className="w-6 h-4 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-400 hover:text-blue-500 transition-colors" title="Aadhar Front">F</a>}
                                {user.aadhar_back_image && <a href={user.aadhar_back_image} target="_blank" className="w-6 h-4 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-400 hover:text-blue-500 transition-colors" title="Aadhar Back">B</a>}
                                {user.pan_image && <a href={user.pan_image} target="_blank" className="w-6 h-4 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-400 hover:text-blue-500 transition-colors" title="PAN">P</a>}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="p-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {user.is_qr_mapped ? (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white font-black shadow-lg shadow-emerald-200 animate-in zoom-in duration-300">
                                    Y
                                </span>
                                <button
                                    onClick={handleUnlinkQR}
                                    disabled={isSaving}
                                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors border border-rose-100"
                                    title="Unlink & Reset QR Mapping (Debug Tool)"
                                >
                                    <Unlink size={12} />
                                </button>
                            </div>
                        ) : (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500 text-white font-black shadow-lg shadow-rose-200 animate-in zoom-in duration-300">
                                N
                            </span>
                        )}
                        {user.location_url && (
                            <a 
                                href={user.location_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-md transition-colors"
                                title="View Map Location"
                            >
                                <MapPin size={12} />
                            </a>
                        )}
                    </div>
                    {user.qr_onboarded_by && (
                        <div className="flex flex-col text-[9px] leading-tight">
                            <span className="text-slate-400 font-medium uppercase tracking-tighter">Mapped By</span>
                            <span className="text-blue-600 font-bold truncate max-w-[100px]">{user.qr_onboarded_by.name}</span>
                            <span className="text-slate-500 font-mono">{user.qr_onboarded_by.code}</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="p-6">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="text-sm font-bold text-slate-600">{user.status}</span>
                    </div>
                    <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight w-fit",
                        user.kyc_status === 'FULL_VERIFIED' ? "bg-emerald-100 text-emerald-700" :
                        user.kyc_status === 'FIELD_VERIFIED' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                    )}>
                        {user.kyc_status === 'FULL_VERIFIED' ? <BadgeCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {user.kyc_status || 'PENDING'}
                    </div>
                </div>
            </td>
            <td className="p-6 pr-8 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/users/detail?id=${user.id}`}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Profile Details"
                    >
                        <Eye className="w-5 h-5" />
                    </Link>

                    {isAdmin && (
                        <>
                            {user.role === 'MERCHANT' && (
                                <button
                                    onClick={() => onReviewKyc(user)}
                                    disabled={isSaving}
                                    className="p-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all shadow-md shadow-emerald-200 active:scale-95 disabled:opacity-50"
                                    title="Review & Approve Merchant"
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => toggleStatus(user)}
                                className={`p-2 rounded-lg transition-colors ${user.status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                title={user.status === 'SUSPENDED' ? 'Activate User' : 'Suspend User'}
                            >
                                {user.status === 'SUSPENDED' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => { setSelectedUser(user); setIsCreditsModalOpen(true); }}
                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Add Funds"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {isAdmin && user.role !== 'SYSTEM' && user.role !== 'ADMIN' && (
                        <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={handleTransferCashback}
                            disabled={isTransferringCashback || (user.cashback_balance < (currentUser?.cashback_threshold_amount || 0))}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                user.cashback_balance >= (currentUser?.cashback_threshold_amount || 0)
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100 ring-1 ring-amber-200"
                                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
                            )}
                            title={user.cashback_balance >= (currentUser?.cashback_threshold_amount || 0) 
                                ? `Transfer Cashback to Wallet (₹${user.cashback_balance})` 
                                : `Cashback too low (Min ₹${currentUser?.cashback_threshold_amount || 0})`}
                        >
                            <ReceiptIndianRupee className="w-5 h-5" />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={handleToggleTransfer}
                            disabled={isTogglingTransfer}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                transferEnabled
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-emerald-200"
                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                            title={transferEnabled ? 'Transfer Enabled — Click to Disable' : 'Transfer Disabled — Click to Enable'}
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => onVaultConfig(user)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Configure Vault"
                        >
                            <ShieldAlert className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default function MerchantsPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        min_balance: '',
        max_balance: '',
        min_signup: '',
        max_signup: '',
        pincode: '',
        is_qr_mapped: '',
        agent_search: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [pagination, setPagination] = useState({
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: 12
    });
    const [jumpPage, setJumpPage] = useState('');

    // Add Funds Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [creditType, setCreditType] = useState('WALLET_TOPUP');
    const [description, setDescription] = useState('');
    const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
    const [isKycModalOpen, setIsKycModalOpen] = useState(false);
    const [selectedUserForKyc, setSelectedUserForKyc] = useState<any>(null);
    const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
    const [selectedUserForVault, setSelectedUserForVault] = useState<any>(null);

    const handleKycReview = (user: any) => {
        setSelectedUserForKyc(user);
        setIsKycModalOpen(true);
    };

    // Bulk Cashback States
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCashbackModalOpen, setIsCashbackModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [cashbackPercent, setCashbackPercent] = useState('');
    const [cashbackFlat, setCashbackFlat] = useState('');
    const [receivePercent, setReceivePercent] = useState('');
    const [receiveFlat, setReceiveFlat] = useState('');
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: 'merchant',
                page: currentPage.toString(),
                per_page: itemsPerPage.toString(),
                search: search,
                ...filters
            });
            const data = await apiFetch(`/admin/users?${params.toString()}`);
            if (data.data) {
                setUsers(data.data);
                setPagination({
                    total: data.total,
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page
                });
            } else {
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [currentPage, itemsPerPage, search, filters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showDownloadOptions && !target.closest('.download-dropdown')) {
                setShowDownloadOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDownloadOptions]);

    const handleAddFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch(`/admin/users/${selectedUser.id}/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    type: creditType,
                    description: description
                })
            });

            const msg = currentUser?.role === 'ADMIN'
                ? 'Success! Funds added successfully.'
                : 'Request Submitted! Pending Admin Approval.';

            alert(msg);
            setIsCreditsModalOpen(false);
            setAmount('');
            setDescription('');
            setCreditType('WALLET_TOPUP');

            loadUsers();
        } catch (e) {
            alert('Error adding funds');
        }
    };

    const handleBulkCashback = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/admin/users/bulk-cashback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: selectedIds,
                    cashback_percentage: parseFloat(cashbackPercent) || 0,
                    cashback_flat_amount: parseFloat(cashbackFlat) || 0,
                    receive_cashback_percentage: parseFloat(receivePercent) || 0,
                    receive_cashback_flat_amount: parseFloat(receiveFlat) || 0
                })
            });

            alert('Success! Cashback settings updated.');
            setIsCashbackModalOpen(false);
            setCashbackPercent('');
            setCashbackFlat('');
            setReceivePercent('');
            setReceiveFlat('');
            setSelectedIds([]);
            loadUsers();
        } catch (e: any) {
            console.error(e);
            alert('Error updating cashback settings');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this merchant?')) return;
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
    };

    const toggleStatus = async (user: any) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'suspend'} this merchant?`)) return;

        try {
            await apiFetch(`/admin/users/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            loadUsers();
        } catch (e) {
            alert('Error updating status');
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    const displayedUsers = users;

    const toggleSelectAll = () => {
        if (selectedIds.length === displayedUsers.length && displayedUsers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(displayedUsers.map((u: any) => u.id));
        }
    };

    return (
        <AdminLayout title="Merchant Management">
            {/* Header Actions */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-1 gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search merchants..."
                                className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="flex items-center gap-3 px-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border",
                                    showFilters ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative download-dropdown">
                            <button
                                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg",
                                    showDownloadOptions 
                                        ? "bg-slate-800 text-white shadow-slate-300 scale-[0.98]" 
                                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                                )}
                            >
                                <Download className="w-5 h-5" />
                                Bulk Data Download
                            </button>
                            {showDownloadOptions && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={async () => {
                                            setShowDownloadOptions(false);
                                            try {
                                                const params = new URLSearchParams({
                                                    type: 'merchant',
                                                    search: search,
                                                    ...filters
                                                });
                                                const blob = await apiFetch(`/admin/users/export?${params.toString()}`, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `merchants_all_${new Date().toISOString().split('T')[0]}.csv`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                window.URL.revokeObjectURL(url);
                                            } catch (e) {
                                                console.error('Export failed', e);
                                                alert('Export failed.');
                                            }
                                        }}
                                        className="w-full text-left px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between group/item"
                                    >
                                        <span>Download All Matching</span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover/item:text-slate-400 transform group-hover/item:translate-x-0.5 transition-all" />
                                    </button>
                                    {selectedIds.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                setShowDownloadOptions(false);
                                                try {
                                                    const blob = await apiFetch(`/admin/users/export?type=merchant&user_ids=${selectedIds.join(',')}`, { responseType: 'blob' });
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `merchants_selected_${selectedIds.length}_${new Date().toISOString().split('T')[0]}.csv`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                } catch (e) {
                                                    console.error('Export failed', e);
                                                    alert('Export failed.');
                                                }
                                            }}
                                            className="w-full text-left px-4 py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50 flex items-center justify-between group/item"
                                        >
                                            <span>Download Selected ({selectedIds.length})</span>
                                            <ChevronRight className="w-4 h-4 text-blue-300 group-hover/item:text-blue-400 transform group-hover/item:translate-x-0.5 transition-all" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center bg-slate-50 border-none rounded-2xl px-4 py-2">
                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={60}>60</option>
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                                <option value={5000}>5000</option>
                                <option value={10000}>10000</option>
                            </select>
                        </div>

                        {isAdmin && selectedIds.length > 0 && (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-10">
                                {selectedIds.length} Selected
                                <button
                                    onClick={() => setIsMaintenanceModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    <ShieldAlert size={20} />
                                    Maintenance Charge
                                </button>
                                <button
                                    onClick={() => setIsCashbackModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                                >
                                    <ReceiptIndianRupee size={20} />
                                    Set Cashback
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.from_date}
                                        onChange={(e) => {setFilters({ ...filters, from_date: e.target.value }); setCurrentPage(1);}}
                                    />
                                    <span className="text-slate-300">-</span>
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.to_date}
                                        onChange={(e) => {setFilters({ ...filters, to_date: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wallet Balance Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.min_balance}
                                        onChange={(e) => {setFilters({ ...filters, min_balance: e.target.value }); setCurrentPage(1);}}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_balance}
                                        onChange={(e) => {setFilters({ ...filters, max_balance: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signup/Turnover Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.min_signup}
                                        onChange={(e) => {setFilters({ ...filters, min_signup: e.target.value }); setCurrentPage(1);}}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.max_signup}
                                        onChange={(e) => {setFilters({ ...filters, max_signup: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Postal PIN</label>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit PIN"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.pincode}
                                    onChange={(e) => {setFilters({ ...filters, pincode: e.target.value }); setCurrentPage(1);}}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">QR Onboarded</label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.is_qr_mapped}
                                    onChange={(e) => {setFilters({ ...filters, is_qr_mapped: e.target.value }); setCurrentPage(1);}}
                                >
                                    <option value="">All Status</option>
                                    <option value="yes">Yes (Mapped)</option>
                                    <option value="no">No (Unmapped)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agent Search (Mapped By)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Agent Name or Code"
                                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.agent_search}
                                        onChange={(e) => {setFilters({ ...filters, agent_search: e.target.value }); setCurrentPage(1);}}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort By</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.sort_by}
                                        onChange={(e) => {setFilters({ ...filters, sort_by: e.target.value }); setCurrentPage(1);}}
                                    >
                                        <option value="created_at">Join Date</option>
                                        <option value="name">Name</option>
                                        <option value="daily_turnover">Turnover</option>
                                        <option value="pincode">Postal PIN</option>
                                    </select>
                                    <select
                                        className="w-24 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filters.sort_order}
                                        onChange={(e) => {setFilters({ ...filters, sort_order: e.target.value }); setCurrentPage(1);}}
                                    >
                                        <option value="desc">Newest</option>
                                        <option value="asc">Oldest</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 w-16 text-center">
                                    {isAdmin && (
                                        <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100">
                                            {selectedIds.length > 0 && selectedIds.length === displayedUsers.length ?
                                                <CheckSquare className="text-blue-600" /> : <Square className="text-slate-400" />
                                            }
                                        </button>
                                    )}
                                </th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Merchant Details</th>
                                <th className="p-6 text-xs font-bold text-rose-500 uppercase tracking-widest">Decline Reason</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                                <th className="p-6 text-xs font-bold text-yellow-500 uppercase tracking-widest">Cashback Wallet</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Cashback % (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Flat Bonus (P | R)</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Postal PIN</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">App Unlock PIN</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Referred By</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Ref CODE</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">KYC Details</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status QR</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedUsers.map((user: any) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    selectedIds={selectedIds}
                                    toggleSelect={toggleSelect}
                                    toggleStatus={toggleStatus}
                                    handleDelete={handleDelete}
                                    setSelectedUser={setSelectedUser}
                                    setIsCreditsModalOpen={setIsCreditsModalOpen}
                                    reloadUsers={loadUsers}
                                    currentUser={currentUser}
                                    onReviewKyc={handleKycReview}
                                    onVaultConfig={(u: any) => { setSelectedUserForVault(u); setIsVaultModalOpen(true); }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.last_page > 1 && (
                    <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                            </p>
                            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Jump to:</span>
                                <input
                                    type="text"
                                    value={jumpPage}
                                    onChange={(e) => setJumpPage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const page = parseInt(jumpPage);
                                            if (page >= 1 && page <= pagination.last_page) {
                                                setCurrentPage(page);
                                                setJumpPage('');
                                            }
                                        }
                                    }}
                                    className="w-12 bg-transparent border-none text-xs font-black text-slate-900 outline-none text-center"
                                    placeholder="..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={pagination.current_page === 1}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Funds Modal */}
            {isCreditsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{isAdmin ? 'Add Funds' : 'Request Funds'}</h3>
                        <p className="text-slate-500 font-medium mb-6">
                            {isAdmin ? 'Add funds directly to' : 'Submit a request to add funds for'} <span className="text-slate-900 font-bold">{selectedUser?.name}</span>.
                        </p>

                        <form onSubmit={handleAddFunds}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Transaction Type</label>
                                    <select
                                        value={creditType}
                                        onChange={(e) => setCreditType(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                                    >
                                        <option value="WALLET_TOPUP">Wallet Top-up</option>
                                        <option value="SERVICE_FEE">Service Fee Payment</option>
                                        <option value="OTHER">Other Adjustment</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Note</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Reason for crediting funds..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreditsModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                                >
                                    {isAdmin ? 'Add Funds Now' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Cashback Modal */}
            {isCashbackModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Bulk Merchant Cashback</h3>
                                <p className="text-slate-500 font-medium">Updating {selectedIds.length} selected merchants</p>
                            </div>
                            <button onClick={() => setIsCashbackModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleBulkCashback} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay (Outbound)</p>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" max="100" placeholder="Percent %"
                                                className={cn("w-full bg-slate-50 border-none rounded-2xl p-4 font-mono font-bold text-purple-600", parseFloat(cashbackFlat) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={cashbackPercent}
                                                onChange={(e) => setCashbackPercent(e.target.value)}
                                                disabled={parseFloat(cashbackFlat) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-purple-300">%</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" placeholder="Flat Amount ₹"
                                                className={cn("w-full bg-slate-50 border-none rounded-2xl p-4 font-mono font-bold text-emerald-600", parseFloat(cashbackPercent) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={cashbackFlat}
                                                onChange={(e) => setCashbackFlat(e.target.value)}
                                                disabled={parseFloat(cashbackPercent) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-emerald-300">₹</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receive (Inbound)</p>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" max="100" placeholder="Percent %"
                                                className={cn("w-full bg-indigo-50/50 border-none rounded-2xl p-4 font-mono font-bold text-blue-600", parseFloat(receiveFlat) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={receivePercent}
                                                onChange={(e) => setReceivePercent(e.target.value)}
                                                disabled={parseFloat(receiveFlat) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-blue-300">%</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01" min="0" placeholder="Flat Amount ₹"
                                                className={cn("w-full bg-indigo-50/50 border-none rounded-2xl p-4 font-mono font-bold text-indigo-600", parseFloat(receivePercent) > 0 && "opacity-50 cursor-not-allowed")}
                                                value={receiveFlat}
                                                onChange={(e) => setReceiveFlat(e.target.value)}
                                                disabled={parseFloat(receivePercent) > 0}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-indigo-300">₹</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                    Note: Setting a percentage will clear any existing flat amount for these merchants, and vice-versa. Percentage takes priority if both are accidentally sent.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all active:scale-95"
                            >
                                Apply Changes to {selectedIds.length} Merchants
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Maintenance Charge Modal (Admin Only) */}
            {isAdmin && (
                <MaintenanceChargeModal
                    isOpen={isMaintenanceModalOpen}
                    onClose={() => setIsMaintenanceModalOpen(false)}
                    selectedUserIds={selectedIds}
                    onSuccess={() => {
                        loadUsers();
                        setSelectedIds([]);
                    }}
                />
            )}

            {/* Footer */}
            <footer className="mt-12 py-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-400 text-sm font-medium">© 2026 Admin Panel • MSME Loan Systems</p>
                <div className="flex gap-8">
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">Privacy Policy</a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">Terms of Service</a>
                    <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">Help Center</a>
                </div>
            </footer>
            <MerchantKycModal 
                isOpen={isKycModalOpen}
                onClose={() => setIsKycModalOpen(false)}
                merchant={selectedUserForKyc}
                isAdmin={currentUser?.role === 'ADMIN'}
                onSuccess={loadUsers}
            />
            <VaultConfigModal
                isOpen={isVaultModalOpen}
                onClose={() => setIsVaultModalOpen(false)}
                user={selectedUserForVault}
                onSuccess={loadUsers}
            />
        </AdminLayout>
    );
}
