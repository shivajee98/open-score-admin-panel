'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { toast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { UserPlus, Plus, Shield, Users as UsersIcon, Wallet, ArrowRight, TrendingUp, TreePine, Search, Filter, ChevronLeft, ChevronRight, Download, Calendar, ChevronDown, Database, CheckSquare, Phone, Video, X, Eye, Edit, Trash2, Link as LinkIcon, Save, Clock, Send, Mail, Bell } from 'lucide-react';
import Link from 'next/link';
import EmailHistoryModal from '@/components/EmailHistoryModal';
import AppNotificationHistoryModal from '@/components/AppNotificationHistoryModal';

interface SubUser {
    id: number;
    name: string;
    mobile_number: string;
    email: string | null;
    referral_code: string;
    credit_balance: number;
    credit_limit: number;
    earnings_balance: number;
    default_signup_amount: number;
    admin_loan_commission: number;
    bonus_milestone_count?: number;
    bonus_milestone_amount?: number;
    vendors_count?: number;
    agents_count?: number;
    available_earnings: number;
    upcoming_earnings: number;
    can_create_vendors?: boolean;
    show_letter?: boolean;
    is_active: boolean;
    kyc_verification?: {
        status?: 'approved' | 'pending' | 'rejected';
    };
    visible_pin?: string;
    pincode?: string;
    support_number?: string;
    show_support?: boolean;
}

const normalizeKycStatus = (status?: string): 'approved' | 'pending' | 'rejected' | undefined => {
    if (!status) return undefined;
    const normalized = status.trim().toLowerCase();
    if (normalized === 'approved' || normalized === 'pending' || normalized === 'rejected') {
        return normalized as 'approved' | 'pending' | 'rejected';
    }
    return undefined;
};

const SubUserRow = ({ 
    subUser, 
    selectedIds, 
    toggleSelect, 
    handleEditSubUser, 
    setSelectedSubUser, 
    fetchSubUsers, 
    handleKycAction, 
    creditAmount, 
    setCreditAmount, 
    handleAddCredit,
    onSendEmail,
    onSendNotification
}: any) => {
    const [supportNumber, setSupportNumber] = useState(subUser.support_number ?? '');
    const [isSavingSupport, setIsSavingSupport] = useState(false);
    const [meetingLink, setMeetingLink] = useState(subUser.meeting_link ?? '');
    const [isSavingMeeting, setIsSavingMeeting] = useState(false);
    const [isEditingMeeting, setIsEditingMeeting] = useState(false);

    useEffect(() => {
        setSupportNumber(subUser.support_number ?? '');
        setMeetingLink(subUser.meeting_link ?? '');
    }, [subUser.support_number, subUser.meeting_link]);

    const handleSaveSupportNumber = async () => {
        const isValidLength = supportNumber.length === 10 || (supportNumber.length === 11 && supportNumber.startsWith('0'));
        if (supportNumber && !isValidLength) {
            toast.error('Support number must be 10 digits or 11 digits starting with 0');
            return;
        }
        setIsSavingSupport(true);
        try {
            await apiFetch(`/admin/sub-users/${subUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ support_number: supportNumber || null })
            });
            toast.success('Support number updated!');
            fetchSubUsers();
        } catch (e) {
            toast.error('Error updating support number');
        } finally {
            setIsSavingSupport(false);
        }
    };

    const handleSaveMeetingLink = async (valueOverride?: string | null) => {
        setIsSavingMeeting(true);
        const targetLink = valueOverride === undefined ? meetingLink : valueOverride;
        try {
            await apiFetch(`/admin/sub-users/${subUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meeting_link: targetLink || null })
            });
            toast.success('Meeting link updated!');
            setIsEditingMeeting(false);
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Error updating meeting link');
        } finally {
            setIsSavingMeeting(false);
        }
    };

    const handleCopyMeetingLink = () => {
        if (!subUser.meeting_link) return;
        navigator.clipboard.writeText(subUser.meeting_link);
        toast.success('Meeting link copied to clipboard!');
    };

    const normalizedKycStatus = subUser.kyc_verification?.status?.trim().toLowerCase();
    const showPendingDot = normalizedKycStatus === 'pending';

    return (
        <tr className={cn(
            "hover:bg-slate-50/80 transition-colors group",
            selectedIds.includes(subUser.id) && "bg-blue-50/30"
        )}>
            <td className="p-6 pl-8">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.includes(subUser.id)}
                    onChange={() => toggleSelect(subUser.id)}
                />
            </td>
            <td className="p-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border-2 border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            {subUser.name[0]}
                        </div>
                        {showPendingDot && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)] border-2 border-white"></span>
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-base">{subUser.name}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <UsersIcon className="w-3 h-3 text-blue-500" />
                                Agent #{subUser.id} • {subUser.mobile_number}
                            </div>
                            {subUser.pincode && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-md">
                                    <Calendar className="w-3 h-3" />
                                    Postal PIN: {subUser.pincode}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="p-6">
                {subUser.email ? (
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => onSendEmail([subUser.id])}
                            className="p-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-md transition-colors"
                            title="Send Email"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <span className="text-slate-300">-</span>
                )}
            </td>
            <td className="p-6">
                <div className="flex items-center justify-center">
                    <button
                        onClick={() => onSendNotification([subUser.id])}
                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Send App Notification"
                    >
                        <Bell className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
            <td className="p-6">
                {normalizedKycStatus === 'approved' ? (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Approved</span>
                ) : normalizedKycStatus === 'pending' ? (
                    <div className="flex flex-col gap-2 items-start">
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>
                        <div className="flex gap-1">
                            <button onClick={() => handleKycAction(subUser.id, 'approve')} className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 font-bold">Approve</button>
                            <button onClick={() => handleKycAction(subUser.id, 'reject')} className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded hover:bg-rose-600 font-bold">Reject</button>
                        </div>
                    </div>
                ) : normalizedKycStatus === 'rejected' ? (
                    <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Rejected / Wait</span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Not Submitted</span>
                )}
            </td>
            <td className="p-6">
                <span className="font-mono text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-black border border-slate-200">
                    {subUser.referral_code}
                </span>
            </td>
            <td className="p-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Vendors:</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{subUser.vendors_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Agents:</span>
                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{subUser.agents_count || 0}</span>
                    </div>
                </div>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">₹{(subUser.credit_balance ?? 0).toLocaleString()}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs font-bold text-slate-400">₹{(subUser.credit_limit ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                        type="number"
                        placeholder="Add..."
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        value={creditAmount}
                        onChange={(e) => {
                            setSelectedSubUser(subUser);
                            setCreditAmount(e.target.value);
                        }}
                    />
                    <button
                        onClick={() => handleAddCredit(subUser.id)}
                        className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-md"
                        title="Add Credit"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </td>
            <td className="p-6">
                <div className="flex flex-col gap-1">
                    <span className="font-black text-emerald-600 text-sm">₹{(subUser.admin_loan_commission ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">(Disburse)</span></span>
                    <span className="font-bold text-slate-500 text-xs">₹{(subUser.default_signup_amount ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400 ml-1 uppercase">(Signup)</span></span>
                </div>
            </td>
            <td className="p-6">
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2 border-2 border-slate-50 rounded-xl p-1.5 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                <Phone size={14} />
                            </div>
                            <input
                                type="text"
                                maxLength={11}
                                placeholder="Support No"
                                className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-900 placeholder:text-slate-300 p-0"
                                value={supportNumber}
                                onChange={(e) => setSupportNumber(e.target.value)}
                            />
                            <button
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                                    isSavingSupport ? "bg-slate-100 text-slate-400 cursor-wait" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                                )}
                                onClick={handleSaveSupportNumber}
                                disabled={isSavingSupport}
                                title="Update Support Number"
                            >
                                <ArrowRight size={14} className={cn(isSavingSupport && "animate-pulse")} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                            <button 
                                onClick={async () => {
                                    setIsSavingSupport(true);
                                    try {
                                        await apiFetch(`/admin/sub-users/${subUser.id}`, {
                                            method: 'PUT',
                                            body: JSON.stringify({ show_support: !subUser.show_support })
                                        });
                                        toast.success(`Support ${!subUser.show_support ? 'Enabled' : 'Disabled'}`);
                                        fetchSubUsers();
                                    } catch (e) {
                                        toast.error('Failed to toggle support');
                                    } finally {
                                        setIsSavingSupport(false);
                                    }
                                }}
                                className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all",
                                    subUser.show_support ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-200"
                                )}
                            >
                                {subUser.show_support ? 'Visible' : 'Hidden'}
                            </button>
                        </div>
                    </div>
            </td>
            <td className="p-6">
                {subUser.meeting_link && !isEditingMeeting ? (
                    <div className="flex items-center gap-2 group/meeting">
                        <div 
                            onClick={handleCopyMeetingLink}
                            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all font-black text-[10px] uppercase tracking-wider shadow-sm"
                        >
                            <Video className="w-3.5 h-3.5" />
                            Meeting Link
                            <div className="h-3 w-[1px] bg-indigo-200 mx-1" />
                            <LinkIcon className="w-3 h-3 opacity-50" />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/meeting:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setIsEditingMeeting(true)}
                                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Edit Link"
                            >
                                <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => {
                                    if(confirm('Clear meeting link?')) {
                                        setMeetingLink('');
                                        handleSaveMeetingLink(null);
                                    }
                                }}
                                className="p-1.5 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                                title="Clear Link"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2 border-2 border-slate-50 rounded-xl p-1.5 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                {isSavingMeeting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Video size={14} />}
                            </div>
                            <input
                                type="url"
                                placeholder="Paste Link..."
                                className="w-full bg-transparent border-none outline-none text-xs font-black text-slate-900 placeholder:text-slate-300 p-0"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveMeetingLink()}
                            />
                            <div className="flex items-center gap-1">
                                <button
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                                        isSavingMeeting ? "bg-slate-100 text-slate-400 cursor-wait" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                    )}
                                    onClick={() => handleSaveMeetingLink()}
                                    disabled={isSavingMeeting}
                                    title="Save Meeting Link"
                                >
                                    <Save size={14} />
                                </button>
                                {isEditingMeeting && (
                                    <button
                                        onClick={() => {
                                            setIsEditingMeeting(false);
                                            setMeetingLink(subUser.meeting_link || '');
                                        }}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all shrink-0"
                                        title="Cancel"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </td>
            <td className="p-6 text-center">
                <div className="flex flex-col">
                    <span className="font-mono font-black text-emerald-600 text-sm">₹{parseFloat((subUser as any).available_earnings || '0').toLocaleString('en-IN')}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Ready to Transfer</span>
                </div>
            </td>
            <td className="p-6 text-center">
                <div className="flex flex-col">
                    <span className="font-mono font-black text-amber-600 text-sm">₹{parseFloat((subUser as any).upcoming_earnings || '0').toLocaleString('en-IN')}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Upcoming Earning</span>
                </div>
            </td>
            <td className="p-6 pr-8 text-right">
                <div className="flex justify-end gap-2 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/sub-users/detail?id=${subUser.id}`}
                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                        title="View Full Details"
                    >
                        <Eye size={18} />
                    </Link>

                    {subUser.kyc_verification?.status?.trim().toLowerCase() === 'approved' && (
                        <button
                            onClick={() => handleKycAction(subUser.id, 're_kyc')}
                            className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all border border-amber-100 shadow-sm"
                            title="Request Re-KYC"
                        >
                            <UserPlus size={18} />
                        </button>
                    )}
                    <button
                        onClick={() => handleEditSubUser(subUser)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                        title="Edit Details"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this sub-user? This action cannot be undone.')) {
                                try {
                                    await apiFetch(`/admin/sub-users/${subUser.id}`, { method: 'DELETE' });
                                    toast.success('Sub-user deleted');
                                    fetchSubUsers();
                                } catch (e) {
                                    toast.error('Failed to delete sub-user');
                                }
                            }
                        }}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
                        title="Delete Sub-User"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default function SubUsersPage() {
    const { counts } = useAdminNotifications();
    const router = useRouter();
    const [subUsers, setSubUsers] = useState<SubUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedSubUser, setSelectedSubUser] = useState<SubUser | null>(null);

    // Filters and Pagination
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        min_balance: '',
        max_balance: '',
        min_available: '',
        max_available: '',
        min_upcoming: '',
        max_upcoming: '',
        min_signup: '',
        max_signup: '',
        pincode: '',
        kyc_status: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 15
    });

    const [showFilters, setShowFilters] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        password: '',
        credit_limit: '',
        default_signup_amount: '',
        admin_loan_commission: '',
        admin_vault_card_commission: '',
        bonus_milestone_count: '',
        bonus_milestone_amount: '',
        can_create_vendors: false,
        show_letter: false,
        pincode: '',
        support_number: '',
        show_support: false,
        is_active: true,
        bulk_meeting_link: '',
    } as any);

    const [jumpPage, setJumpPage] = useState('');

    const [creditAmount, setCreditAmount] = useState('');

    // Email Modal States
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isEmailHistoryOpen, setIsEmailHistoryOpen] = useState(false);
    const [emailTargetIds, setEmailTargetIds] = useState<number[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // App Notification Modal States
    const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = useState(false);
    const [notificationTargetIds, setNotificationTargetIds] = useState<number[]>([]);

    const handleOpenBulkEmailModal = () => {
        setEmailTargetIds(selectedIds);
        setEmailSubject('');
        setEmailMessage('');
        setIsEmailModalOpen(true);
    };

    const handleOpenSingleEmailModal = (ids: number[]) => {
        setEmailTargetIds(ids);
        setEmailSubject('');
        setEmailMessage('');
        setIsEmailModalOpen(true);
    };

    const handleSendEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSendingEmail(true);
        try {
            for (const id of emailTargetIds) {
                await apiFetch('/admin/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient_ids: [id],
                        recipient_type: 'user',
                        subject: emailSubject,
                        message: emailMessage,
                    })
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            toast.success('Emails scheduled successfully!');
            setIsEmailModalOpen(false);
            setSelectedIds([]);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send emails.');
        } finally {
            setIsSendingEmail(false);
        }
    };
    const [globalReferralSettings, setGlobalReferralSettings] = useState<any>(null);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkSupportNumber, setBulkSupportNumber] = useState('');
    const [bulkMeetingLink, setBulkMeetingLink] = useState('');
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
                setShowDownloadOptions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [downloadDropdownRef]);

    const handleExport = async (type: 'all' | 'selected') => {
        try {
            const query = new URLSearchParams();

            if (type === 'all') {
                if (search) query.append('search', search);
                // Include other active filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) query.append(key, value.toString());
                });
            } else {
                if (selectedIds.length === 0) {
                    alert("Please select vendors first");
                    return;
                }
                query.append('user_ids', selectedIds.join(','));
            }

            const blob = await apiFetch(`/admin/sub-users/export?${query.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = type === 'all' ? `vendors_all_${new Date().toISOString().split('T')[0]}.csv` : `vendors_selected_${selectedIds.length}_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed.');
        } finally {
            setShowDownloadOptions(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === subUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(subUsers.map(u => u.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchSubUsers();
    }, [pagination.current_page, pagination.per_page, filters, search]);

    useEffect(() => {
        fetchGlobalSettings();
    }, []);

    const fetchGlobalSettings = async () => {
        try {
            const data = await apiFetch('/admin/referral-settings');
            setGlobalReferralSettings(data);
        } catch (e) {
            console.error('Failed to load referral settings');
        }
    };

    const handleSaveGlobal = async () => {
        setSavingGlobal(true);
        try {
            await apiFetch('/admin/referral-settings', {
                method: 'PUT',
                body: JSON.stringify(globalReferralSettings)
            });
            toast.success('Agent global settings updated');
        } catch (e: any) {
            toast.error('Failed to update settings');
        } finally {
            setSavingGlobal(false);
        }
    };

    const fetchSubUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.current_page.toString(),
                per_page: pagination.per_page.toString(),
                search: search,
                ...filters
            });
            const data = await apiFetch(`/admin/sub-users?${params.toString()}`);
            setSubUsers(data.data || []);
            setPagination({
                current_page: data.current_page,
                last_page: data.last_page,
                total: data.total,
                per_page: data.per_page
            });
        } catch (e) {
            toast.error('Failed to load Vendors');
        } finally {
            setLoading(false);
        }
    };

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // ... existing state ...

    const handleEditSubUser = (subUser: SubUser) => {
        setFormData({
            name: subUser.name,
            mobile_number: subUser.mobile_number,
            credit_limit: (subUser.credit_limit ?? 0).toString(),
            default_signup_amount: (subUser.default_signup_amount ?? 0).toString(),
            admin_loan_commission: (subUser.admin_loan_commission ?? 0).toString(),
            admin_vault_card_commission: ((subUser as any).admin_vault_card_commission ?? 0).toString(),
            bonus_milestone_count: (subUser.bonus_milestone_count ?? 0).toString(),
            bonus_milestone_amount: (subUser.bonus_milestone_amount ?? 0).toString(),
            can_create_vendors: subUser.can_create_vendors ?? false,
            show_letter: subUser.show_letter ?? false,
            password: subUser.visible_pin || '', // Using password field for PIN in form
            pincode: subUser.pincode || '',
            support_number: subUser.support_number || '',
            show_support: subUser.show_support || false,
            is_active: subUser.is_active ?? true,
        });
        setEditingId(subUser.id);
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditMode ? `/admin/sub-users/${editingId}` : '/admin/sub-users';
            const method = isEditMode ? 'PUT' : 'POST';

            // For edit, remove password if empty
            const payload: any = { ...formData };
            if (isEditMode && !payload.password) {
                delete payload.password;
            }

            await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            toast.success(isEditMode ? 'Agent updated successfully' : 'Agent created successfully');
            setShowModal(false);
            setFormData({ name: '', mobile_number: '', password: '', credit_limit: '', default_signup_amount: '', admin_loan_commission: '', bonus_milestone_count: '', bonus_milestone_amount: '', can_create_vendors: false, show_letter: false, pincode: '' } as any);
            setIsEditMode(false);
            setEditingId(null);
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Operation failed');
        }
    };

    const handleAddCredit = async (subUserId: number) => {
        if (!creditAmount || parseFloat(creditAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        try {
            await apiFetch(`/admin/sub-users/${subUserId}/credit`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(creditAmount) })
            });
            toast.success('Credit added successfully');
            setCreditAmount('');
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to add credit');
        }
    };

    const handleKycAction = async (subUserId: number, action: 'approve' | 'reject' | 're_kyc') => {
        try {
            if (action === 'approve' || action === 'reject') {
                await apiFetch(`/admin/sub-users/${subUserId}/kyc-review`, {
                    method: 'POST',
                    body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' })
                });
                toast.success(`Agent KYC marked as ${action.toUpperCase()}`);
            } else if (action === 're_kyc') {
                if (window.confirm('Are you sure you want to lock this agent out and ask for Re-KYC?')) {
                    await apiFetch(`/admin/sub-users/${subUserId}/re-kyc`, {
                        method: 'POST'
                    });
                    toast.success('Agent locked for Re-KYC.');
                } else {
                    return;
                }
            }
            fetchSubUsers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update KYC status');
        }
    };

    return (
        <AdminLayout title="Vendor Management">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 gap-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 px-1">Vendor Network</h2>
                    <p className="text-slate-500 text-sm font-medium px-1">Manage vendors and their credit limits.</p>
                </div>
                <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, code..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination(prev => ({ ...prev, current_page: 1 }));
                            }}
                        />
                    </div>
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

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/sub-users/tree')}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                        <TreePine className="w-5 h-5" />
                        Vendor Tree
                    </button>
                    <button
                        onClick={() => setIsEmailHistoryOpen(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                        title="View Email Logs & Stats"
                    >
                        <Mail className="w-4 h-4 text-teal-600" />
                        <span className="hidden sm:inline">Mailing Records</span>
                    </button>
                    <button
                        onClick={() => {
                            setNotificationTargetIds([]);
                            setIsNotificationHistoryOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                        title="View Notification History"
                    >
                        <Bell className="w-4 h-4 text-indigo-600" />
                        <span className="hidden sm:inline">App Alerts</span>
                    </button>
                    <div className="relative" ref={downloadDropdownRef}>
                        <button
                            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 border border-slate-700"
                        >
                            <Download className="w-5 h-5 text-emerald-400" />
                            <span>Bulk Data Download</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDownloadOptions ? 'rotate-180' : ''}`} />
                        </button>

                        {showDownloadOptions && (
                            <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 flex flex-col gap-1.5">
                                    <button
                                        onClick={() => handleExport('all')}
                                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-emerald-400 rounded-xl transition-all text-sm group text-left w-full"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                                            <Database className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Download All</p>
                                            <p className="text-[10px] text-slate-500 leading-tight">Export all matching vendors based on current filters</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedIds.length === 0) {
                                                alert("Please select vendors first");
                                                return;
                                            }
                                            handleExport('selected');
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group text-left w-full",
                                            selectedIds.length > 0
                                                ? "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                                                : "text-slate-600 cursor-not-allowed"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                            selectedIds.length > 0 ? "bg-blue-500/10 group-hover:bg-blue-500/20" : "bg-slate-800/50"
                                        )}>
                                            <CheckSquare className={cn("w-5 h-5", selectedIds.length > 0 ? "text-blue-500" : "text-slate-600")} />
                                        </div>
                                        <div>
                                            <p className="font-bold">Download Selected</p>
                                            <p className="text-[10px] text-slate-500 leading-tight">
                                                {selectedIds.length > 0 ? `${selectedIds.length} vendors selected for export` : 'Select vendors in the list to export'}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center bg-slate-50 border-none rounded-xl px-4 py-2">
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-400 mr-2 whitespace-nowrap">Rows:</span>
                        <select
                            value={pagination.per_page}
                            onChange={(e) => {
                                setPagination(prev => ({ ...prev, per_page: Number(e.target.value), current_page: 1 }));
                            }}
                            className="bg-transparent border-none text-xs font-black text-slate-900 outline-none cursor-pointer"
                        >
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={60}>60</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                            <option value={5000}>5000</option>
                            <option value={10000}>10000</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setIsEditMode(false);
                            setFormData({ name: '', mobile_number: '', password: '', credit_limit: '', default_signup_amount: '', admin_loan_commission: '', bonus_milestone_count: '', bonus_milestone_amount: '', can_create_vendors: globalReferralSettings?.default_can_create_vendors ?? false, show_letter: false, pincode: '' } as any);
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus className="w-5 h-5" />
                        Create Agent
                    </button>
                </div>

                {/* Global Toggle for Vendor Creation */}
                <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 h-full">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Global Permission</span>
                        <span className="text-xs font-bold text-slate-700">Sub-Vendor Creation</span>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            const newVal = !globalReferralSettings.default_can_create_vendors;
                            setGlobalReferralSettings({ ...globalReferralSettings, default_can_create_vendors: newVal });
                            try {
                                await apiFetch('/admin/referral-settings', {
                                    method: 'PUT',
                                    body: JSON.stringify({ ...globalReferralSettings, default_can_create_vendors: newVal })
                                });
                                toast.success(newVal ? 'Vendor creation ENABLED for all agents' : 'Vendor creation DISABLED for all agents');
                                fetchSubUsers(); // Refresh to show bulk update
                            } catch (e) {
                                toast.error('Sync failed');
                                setGlobalReferralSettings({ ...globalReferralSettings, default_can_create_vendors: !newVal });
                            }
                        }}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${globalReferralSettings?.default_can_create_vendors ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${globalReferralSettings?.default_can_create_vendors ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl mb-8 flex flex-col items-center gap-6 animate-in slide-in-from-top-4 duration-300 border-4 border-slate-800">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <UsersIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-tight">{selectedIds.length} Agents Selected</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Update Support & Meeting Information</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {/* Bulk Support Section */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Phone size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Support Update</span>
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => setFormData((f: any) => ({ ...f, bulk_show_support: !f.bulk_show_support }))}>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Show?</span>
                                    <button className={`relative w-8 h-4 rounded-full transition-colors ${formData.bulk_show_support ? 'bg-blue-500' : 'bg-white/10'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${formData.bulk_show_support ? 'translate-x-4 bg-white' : 'translate-x-0 bg-slate-500'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={11}
                                    placeholder="10 or 11 Digit Support Number"
                                    className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-black text-white placeholder:text-white/20 outline-none focus:bg-white/20 transition-all"
                                    value={formData.bulk_support_number || ''}
                                    onChange={(e) => setFormData((f: any) => ({ ...f, bulk_support_number: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                                />
                                <button
                                    onClick={async () => {
                                        const isValid = formData.bulk_support_number && (formData.bulk_support_number.length === 10 || (formData.bulk_support_number.length === 11 && formData.bulk_support_number.startsWith('0')));
                                        if (!isValid) {
                                            toast.error('Invalid support number');
                                            return;
                                        }
                                        setActionLoading(true);
                                        try {
                                            await apiFetch('/admin/sub-users/bulk-support', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    target_ids: selectedIds,
                                                    target_type: 'sub-user',
                                                    support_number: formData.bulk_support_number,
                                                    show_support: formData.bulk_show_support
                                                })
                                            });
                                            toast.success('Support updated');
                                            fetchSubUsers();
                                            setSelectedIds([]);
                                        } catch (e: any) {
                                            toast.error(e.message || 'Update failed');
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    className="px-6 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? '...' : 'Apply'}
                                </button>
                                <button
                                    onClick={async () => {
                                        if(!confirm('Clear support for all selected?')) return;
                                        setActionLoading(true);
                                        try {
                                            await apiFetch('/admin/sub-users/bulk-support', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    target_ids: selectedIds,
                                                    target_type: 'sub-user',
                                                    support_number: null,
                                                    show_support: false
                                                })
                                            });
                                            toast.success('Support cleared & hidden');
                                            fetchSubUsers();
                                            setSelectedIds([]);
                                        } catch (e: any) {
                                            toast.error(e.message || 'Clear failed');
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    className="px-4 bg-rose-500/20 text-rose-400 rounded-xl font-black text-[10px] hover:bg-rose-500/30 transition-all disabled:opacity-50 uppercase tracking-tighter"
                                >
                                    {actionLoading ? '...' : 'Clear'}
                                </button>
                            </div>
                        </div>

                        {/* Bulk Meeting Section */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Video size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">Meeting Link Update</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://meet.google.com/..."
                                    className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-black text-white placeholder:text-white/20 outline-none focus:bg-white/20 transition-all"
                                    value={formData.bulk_meeting_link || ''}
                                    onChange={(e) => setFormData((f: any) => ({ ...f, bulk_meeting_link: e.target.value }))}
                                />
                                <button
                                    onClick={async () => {
                                        if (!formData.bulk_meeting_link) {
                                            toast.error('Meeting link is required');
                                            return;
                                        }
                                        setActionLoading(true);
                                        try {
                                            await apiFetch('/admin/sub-users/bulk-meeting', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    target_ids: selectedIds,
                                                    target_type: 'sub-user',
                                                    meeting_link: formData.bulk_meeting_link
                                                })
                                            });
                                            toast.success('Meeting links updated');
                                            fetchSubUsers();
                                            setSelectedIds([]);
                                        } catch (e: any) {
                                            toast.error(e.message || 'Update failed');
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    className="px-6 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? '...' : 'Apply'}
                                </button>
                                <button
                                    onClick={async () => {
                                        if(!confirm('Clear meeting links for all selected?')) return;
                                        setActionLoading(true);
                                        try {
                                            await apiFetch('/admin/sub-users/bulk-meeting', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    target_ids: selectedIds,
                                                    target_type: 'sub-user',
                                                    meeting_link: null
                                                })
                                            });
                                            toast.success('Meeting links cleared');
                                            fetchSubUsers();
                                            setSelectedIds([]);
                                        } catch (e: any) {
                                            toast.error(e.message || 'Clear failed');
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    disabled={actionLoading}
                                    className="px-4 bg-rose-500/20 text-rose-400 rounded-xl font-black text-[10px] hover:bg-rose-500/30 transition-all disabled:opacity-50 uppercase tracking-tighter"
                                >
                                    {actionLoading ? '...' : 'Clear'}
                                </button>
                            </div>
                        </div>

                        {/* Bulk Email Section */}
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-teal-400">
                                <Send size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">Bulk Email Delivery</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button
                                    onClick={handleOpenBulkEmailModal}
                                    className="py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    Compose Email
                                </button>
                                <button
                                    onClick={() => {
                                        setNotificationTargetIds(selectedIds);
                                        setIsNotificationHistoryOpen(true);
                                    }}
                                    className="py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Bell className="w-4 h-4" />
                                    Compose Alert
                                </button>
                                <button
                                    onClick={() => setIsEmailHistoryOpen(true)}
                                    className="py-3 bg-white/10 text-white border border-white/15 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Mail className="w-4 h-4 text-teal-400" />
                                    Email Logs
                                </button>
                                <button
                                    onClick={() => {
                                        setNotificationTargetIds([]);
                                        setIsNotificationHistoryOpen(true);
                                    }}
                                    className="py-3 bg-white/10 text-white border border-white/15 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Bell className="w-4 h-4 text-indigo-400" />
                                    Alert Logs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.from_date}
                                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="date"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.to_date}
                                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
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
                                    onChange={(e) => setFilters({ ...filters, min_balance: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.max_balance}
                                    onChange={(e) => setFilters({ ...filters, max_balance: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signup Amount Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.min_signup}
                                    onChange={(e) => setFilters({ ...filters, min_signup: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.max_signup}
                                    onChange={(e) => setFilters({ ...filters, max_signup: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Available Earnings Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="flex-1 px-4 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={filters.min_available}
                                    onChange={(e) => setFilters({ ...filters, min_available: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="flex-1 px-4 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    value={filters.max_available}
                                    onChange={(e) => setFilters({ ...filters, max_available: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Upcoming Earnings Range</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="flex-1 px-4 py-2 bg-amber-50/50 border border-amber-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                    value={filters.min_upcoming}
                                    onChange={(e) => setFilters({ ...filters, min_upcoming: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="flex-1 px-4 py-2 bg-amber-50/50 border border-amber-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                                    value={filters.max_upcoming}
                                    onChange={(e) => setFilters({ ...filters, max_upcoming: e.target.value })}
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
                                onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KYC Status</label>
                            <select
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.kyc_status}
                                onChange={(e) => setFilters({ ...filters, kyc_status: e.target.value })}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending Approval</option>
                                <option value="approved">KYC Approved</option>
                                <option value="not_submitted">Not Submitted</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sort By</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.sort_by}
                                    onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                                >
                                    <option value="created_at">Joining Date</option>
                                    <option value="name">Name</option>
                                    <option value="credit_balance">Wallet Balance</option>
                                    <option value="available_earnings">Available Earnings</option>
                                    <option value="upcoming_earnings">Upcoming Earnings</option>
                                    <option value="default_signup_amount">Signup Amount</option>
                                    <option value="pincode">Postal PIN</option>
                                </select>
                                <select
                                    className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filters.sort_order}
                                    onChange={(e) => setFilters({ ...filters, sort_order: e.target.value })}
                                >
                                    <option value="desc">Desc</option>
                                    <option value="asc">Asc</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => {
                                setFilters({
                                    from_date: '',
                                    to_date: '',
                                    min_balance: '',
                                    max_balance: '',
                                    min_available: '',
                                    max_available: '',
                                    min_upcoming: '',
                                    max_upcoming: '',
                                    min_signup: '',
                                    max_signup: '',
                                    pincode: '',
                                    kyc_status: '',
                                    sort_by: 'created_at',
                                    sort_order: 'desc'
                                });
                                setSearch('');
                            }}
                            className="text-xs font-black text-rose-600 uppercase tracking-widest hover:text-rose-700 transition-colors"
                        >
                            Reset All Filters
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 pl-8">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedIds.length === subUsers.length && subUsers.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Vendor Details</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">App Notification</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">KYC Status</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Referral Code</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Child Accounts</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Credit Wallet / Limit</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Commission</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Support</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Meeting</th>
                                    <th className="p-6 text-xs font-bold text-emerald-500 uppercase tracking-widest text-center">Available</th>
                                    <th className="p-6 text-xs font-bold text-amber-500 uppercase tracking-widest text-center">Upcoming</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm italic">
                                            No agents created in the system yet.
                                        </td>
                                    </tr>
                                ) : (
                                    subUsers.map((subUser) => (
                                        <SubUserRow
                                            key={subUser.id}
                                            subUser={subUser}
                                            selectedIds={selectedIds}
                                            toggleSelect={toggleSelect}
                                            handleEditSubUser={handleEditSubUser}
                                            setSelectedSubUser={setSelectedSubUser}
                                            fetchSubUsers={fetchSubUsers}
                                            handleKycAction={handleKycAction}
                                            creditAmount={selectedSubUser?.id === subUser.id ? creditAmount : ''}
                                            setCreditAmount={setCreditAmount}
                                            handleAddCredit={handleAddCredit}
                                            onSendEmail={handleOpenSingleEmailModal}
                                            onSendNotification={(ids: number[]) => {
                                                setNotificationTargetIds(ids);
                                                setIsNotificationHistoryOpen(true);
                                            }}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.last_page > 1 && (
                        <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total vendors)
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jump to</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={pagination.last_page}
                                        value={jumpPage}
                                        onChange={(e) => setJumpPage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const page = parseInt(jumpPage);
                                                if (page >= 1 && page <= pagination.last_page) {
                                                    setPagination(prev => ({ ...prev, current_page: page }));
                                                    setJumpPage('');
                                                }
                                            }
                                        }}
                                        placeholder="..."
                                        className="w-12 text-center bg-slate-50 border-none text-xs font-bold text-slate-900 focus:ring-0 rounded-lg p-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
                                        disabled={pagination.current_page === 1}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: Math.min(pagination.last_page, prev.current_page + 1) }))}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-900 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEditMode ? 'Edit Agent' : 'Create Agent'}</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{isEditMode ? 'Update Profile Details' : 'New Sub-User Profile'}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.name}
                                    placeholder="e.g. John Agent"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.mobile_number}
                                    placeholder="10-digit mobile number"
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData({ ...formData, mobile_number: value });
                                    }}
                                    readOnly={isEditMode} // Cannot change mobile as it matches ID often
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Postal PIN (6 digits)</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                    value={formData.pincode}
                                    placeholder="e.g. 110001"
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setFormData({ ...formData, pincode: value });
                                    }}
                                />
                            </div>

                            {isEditMode && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agent PIN (4-6 digits)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-blue-700 transition-all placeholder:text-blue-300"
                                        value={formData.password}
                                        placeholder="Enter new PIN"
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setFormData({ ...formData, password: value });
                                        }}
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Changes take effect immediately upon saving.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.credit_limit}
                                        placeholder="50000"
                                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Onboarding QR</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.default_signup_amount}
                                        placeholder="250"
                                        onChange={(e) => setFormData({ ...formData, default_signup_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Disbursement Commission (Admin to Agent)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.admin_loan_commission}
                                        placeholder="2000"
                                        onChange={(e) => setFormData({ ...formData, admin_loan_commission: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vault Card Commission (Admin to Agent)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.admin_vault_card_commission}
                                        placeholder="100"
                                        onChange={(e) => setFormData({ ...formData, admin_vault_card_commission: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bonus Milestone Count</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.bonus_milestone_count}
                                        placeholder="10"
                                        onChange={(e) => setFormData({ ...formData, bonus_milestone_count: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bonus Milestone Amount</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-900 transition-all"
                                        value={formData.bonus_milestone_amount}
                                        placeholder="200"
                                        onChange={(e) => setFormData({ ...formData, bonus_milestone_amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            {/* Vendor Creation Permission Toggle */}
                            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div>
                                    <p className="text-sm font-black text-indigo-900">Can Create Sub-Vendors</p>
                                    <p className="text-[10px] text-indigo-500 font-bold">Allow this agent to create child vendors in hierarchy</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, can_create_vendors: !formData.can_create_vendors })}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${formData.can_create_vendors ? 'bg-indigo-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${formData.can_create_vendors ? 'translate-x-7' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            {/* Show Letter Toggle */}
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <div>
                                    <p className="text-sm font-black text-amber-900">Show Auth Letter</p>
                                    <p className="text-[10px] text-amber-500 font-bold">Allow vendor to view their authorization letter</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, show_letter: !formData.show_letter })}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${formData.show_letter ? 'bg-amber-600' : 'bg-slate-300'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${formData.show_letter ? 'translate-x-7' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            {/* Account Active Toggle */}
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div>
                                    <p className="text-sm font-black text-emerald-900">Account Active</p>
                                    <p className="text-[10px] text-emerald-500 font-bold">Set this account to ACTIVE or SUSPENDED</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${formData.is_active ? 'bg-emerald-600' : 'bg-rose-500'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${formData.is_active ? 'translate-x-7' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            <div className="space-y-4 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-blue-900 leading-tight">Share Support Number</p>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Help Visibility</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, show_support: !formData.show_support })}
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${formData.show_support ? 'bg-blue-600' : 'bg-slate-300'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${formData.show_support ? 'translate-x-7' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                {formData.show_support && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Support Contact Number</label>
                                        <input
                                            type="text"
                                            maxLength={11}
                                            className="w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-slate-900 transition-all placeholder:text-blue-200"
                                            value={formData.support_number}
                                            placeholder="10 or 11 digit support number"
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                setFormData({ ...formData, support_number: value });
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                                >
                                    {isEditMode ? 'Update Agent' : 'Confirm Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Email History Modal */}
            <EmailHistoryModal
                isOpen={isEmailHistoryOpen}
                onClose={() => setIsEmailHistoryOpen(false)}
            />

            {/* App Notification History Modal */}
            <AppNotificationHistoryModal
                isOpen={isNotificationHistoryOpen}
                onClose={() => setIsNotificationHistoryOpen(false)}
                recipientType="sub_user"
                selectedIds={notificationTargetIds}
                onSuccess={() => {
                    setSelectedIds([]);
                    fetchSubUsers();
                }}
            />

            {/* Send Email Modal */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-black text-slate-900">Send Email</h3>
                            <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-slate-500 font-medium mb-6">
                            Sending email to <span className="text-slate-900 font-bold">{emailTargetIds.length} selected recipients</span>.
                        </p>

                        <form onSubmit={handleSendEmailSubmit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-base font-bold text-slate-900 focus:ring-2 focus:ring-teal-100 outline-none"
                                        placeholder="Enter email subject"
                                        value={emailSubject}
                                        onChange={e => setEmailSubject(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Message Content</label>
                                    <textarea
                                        required
                                        rows={6}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-900 focus:ring-2 focus:ring-teal-100 outline-none font-medium"
                                        placeholder="Type your message here..."
                                        value={emailMessage}
                                        onChange={e => setEmailMessage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSendingEmail}
                                    className="py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
                                >
                                    {isSendingEmail ? (
                                        <>
                                            <Clock className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
        </AdminLayout>
    );
}
