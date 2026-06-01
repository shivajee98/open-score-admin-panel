'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/Toast';
import EmailHistoryModal from '@/components/EmailHistoryModal';
import AppNotificationHistoryModal from '@/components/AppNotificationHistoryModal';
import { 
    Users, Calendar, Search, Activity, Clock, LogIn, RefreshCw, 
    Smartphone, ShieldCheck, ArrowRight, UserCheck, Download, 
    ChevronLeft, ChevronRight, Mail, Bell, Send, X 
} from 'lucide-react';

export default function ActiveUsersPage() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';

    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | 'LIVE'>('LIVE');
    const [activities, setActivities] = useState<any[]>([]);
    const [liveUsers, setLiveUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [exporting, setExporting] = useState(false);
    
    // Calendar viewed month state
    const [viewedDate, setViewedDate] = useState(new Date());

    // Selection States
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    // Email Modal States
    const [isEmailHistoryOpen, setIsEmailHistoryOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTargetIds, setEmailTargetIds] = useState<number[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    // App Notification Modal States
    const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = useState(false);
    const [notificationTargetIds, setNotificationTargetIds] = useState<number[]>([]);

    // Fetch dates of activity
    const loadDates = async () => {
        try {
            const response = await apiFetch('/admin/analytics/daily-active-dates');
            if (response && Array.isArray(response.dates)) {
                setDates(response.dates);
                if (response.dates.length > 0) {
                    // Set calendar view to the most recent active date's month
                    const mostRecent = response.dates[0];
                    setViewedDate(new Date(mostRecent));
                }
            }
        } catch (e) {
            console.error('Failed to load active dates:', e);
        }
    };

    const handlePrevMonth = () => {
        setViewedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleDateSelect = (dateStr: string) => {
        setSelectedDate(dateStr);
    };

    const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) {
            setSelectedDate(val);
            setViewedDate(new Date(val));
        }
    };

    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const calendarCells = [];
    for (let i = 0; i < startDay; i++) {
        calendarCells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push(d);
    }

    // Fetch daily activities or live users
    const loadData = async () => {
        setLoading(true);
        try {
            if (selectedDate === 'LIVE') {
                const response = await apiFetch('/admin/analytics/active-users');
                if (response && Array.isArray(response.users)) {
                    setLiveUsers(response.users);
                } else {
                    setLiveUsers([]);
                }
            } else {
                const response = await apiFetch(`/admin/analytics/daily-active-users?date=${selectedDate}`);
                if (response && Array.isArray(response.activities)) {
                    setActivities(response.activities);
                } else {
                    setActivities([]);
                }
            }
        } catch (e) {
            console.error('Failed to load activities:', e);
        } finally {
            setLoading(false);
        }
    };

    // Load dates initially
    useEffect(() => {
        loadDates();
    }, []);

    // Load users on date selection change
    useEffect(() => {
        setSelectedUserIds([]);
        loadData();
    }, [selectedDate]);

    // Live poller when in "LIVE" tab
    useEffect(() => {
        if (selectedDate !== 'LIVE') return;
        
        const interval = setInterval(async () => {
            try {
                const response = await apiFetch('/admin/analytics/active-users');
                if (response && Array.isArray(response.users)) {
                    setLiveUsers(response.users);
                }
            } catch (e) {
                // Fail silently
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedDate]);

    // Keyboard ESC key listener to close modals
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsEmailModalOpen(false);
                setIsEmailHistoryOpen(false);
                setIsNotificationHistoryOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Format active duration beautifully
    const formatDuration = (seconds: number) => {
        if (!seconds || seconds <= 0) return '< 1 min';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}h ${m}m ${s}s`;
        }
        if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    };

    // Filtered data based on search input
    const displayList = useMemo(() => {
        return (selectedDate === 'LIVE' ? liveUsers : activities).filter(item => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                (item.name || '').toLowerCase().includes(s) ||
                (item.mobile_number || '').includes(s) ||
                (item.role || '').toLowerCase().includes(s) ||
                (item.type || '').toLowerCase().includes(s)
            );
        });
    }, [selectedDate, liveUsers, activities, search]);

    // Helper to extract the actual User ID from list item
    const getUserId = (item: any) => {
        return selectedDate === 'LIVE' ? item.id : item.user_id;
    };

    const toggleSelection = (e: any, userId: number) => {
        e.stopPropagation();
        if (!userId) return;
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const toggleAllOnPage = () => {
        const pageUserIds = displayList
            .map(item => getUserId(item))
            .filter((id): id is number => !!id);
        
        const allSelected = pageUserIds.length > 0 && pageUserIds.every(id => selectedUserIds.includes(id));
        if (allSelected) {
            setSelectedUserIds(prev => prev.filter(id => !pageUserIds.includes(id)));
        } else {
            setSelectedUserIds(prev => Array.from(new Set([...prev, ...pageUserIds])));
        }
    };

    const pageUserIds = useMemo(() => {
        return displayList
            .map(item => getUserId(item))
            .filter((id): id is number => !!id);
    }, [displayList, selectedDate]);

    const isAllSelected = useMemo(() => {
        return pageUserIds.length > 0 && pageUserIds.every(id => selectedUserIds.includes(id));
    }, [pageUserIds, selectedUserIds]);

    const handleOpenBulkEmailModal = () => {
        if (selectedUserIds.length === 0) {
            toast.error('No users selected.');
            return;
        }

        setEmailTargetIds(selectedUserIds);
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
            setSelectedUserIds([]);
        } catch (error: any) {
            toast.error(error.message || 'Failed to send emails.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    // Export active users list to Excel
    const handleExportExcel = async () => {
        if (displayList.length === 0) {
            alert('No data to export');
            return;
        }
        setExporting(true);
        try {
            const XLSX = await import('xlsx');
            
            // If there are selected IDs, filter the list to ONLY those.
            let exportList = displayList;
            if (selectedUserIds.length > 0) {
                exportList = displayList.filter((item: any) => selectedUserIds.includes(getUserId(item)));
            }

            const rows = exportList.map((item: any, idx) => {
                const name = item.name || 'Anonymous User';
                const mobile = item.mobile_number || 'N/A';
                const type = item.type || 'USER';
                const role = item.role || 'CUSTOMER';
                
                const duration = selectedDate === 'LIVE' 
                    ? 'Online' 
                    : formatDuration(item.active_seconds);

                const heartbeatTime = item.last_seen 
                    ? new Date(item.last_seen * 1000).toLocaleTimeString('en-IN') 
                    : 'N/A';

                return {
                    'User ID': getUserId(item) || `row_${idx + 1}`,
                    'Full Name': name,
                    'Mobile Number': mobile,
                    'Platform Type': type.replace(/_/g, ' '),
                    'Account Role': role,
                    'Login Frequency (Sessions)': selectedDate === 'LIVE' ? 'N/A' : (item.login_count || 1),
                    'Last Heartbeat Time': selectedDate === 'LIVE' ? heartbeatTime : 'N/A',
                    'Active Duration': duration,
                    'Date': selectedDate === 'LIVE' ? 'Real-Time' : selectedDate
                };
            });

            const ws = XLSX.utils.json_to_sheet(rows);

            // Auto-size columns
            const colWidths = Object.keys(rows[0]).map(key => ({
                wch: Math.max(key.length + 2, ...rows.map((r: any) => String(r[key] || '').length).slice(0, 20))
            }));
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, selectedDate === 'LIVE' ? 'Live Online' : `Active Users ${selectedDate}`);

            const fileName = `openscore_active_users_${selectedDate === 'LIVE' ? 'live' : selectedDate}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to export Excel file');
        } finally {
            setExporting(false);
        }
    };

    return (
        <AdminLayout title="Active Users Tracker">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Dates Sidebar */}
                <aside className="w-full lg:w-80 shrink-0 bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Activity Tracker
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">Real-time and historic session viewer</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Live Option */}
                        <button
                            onClick={() => setSelectedDate('LIVE')}
                            className={`flex items-center justify-between p-4 rounded-2xl font-black text-sm transition-all duration-300 border ${
                                selectedDate === 'LIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-md shadow-emerald-500/5 scale-[1.02]'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-transparent hover:scale-[1.01]'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Live Online Users
                            </span>
                            {selectedDate === 'LIVE' ? (
                                <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                            ) : (
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-[1px] bg-slate-100" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">History Calendar</span>
                            <div className="flex-1 h-[1px] bg-slate-100" />
                        </div>

                        {/* Custom Premium Calendar Grid */}
                        <div className="bg-slate-50/55 rounded-2xl p-4 border border-slate-100/50">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-slate-800 transition-all active:scale-95"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-black text-slate-800 tracking-tight">
                                    {monthNames[month]} {year}
                                </span>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 hover:text-slate-800 transition-all active:scale-95"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, index) => (
                                    <span key={index} className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        {d}
                                    </span>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarCells.map((day, idx) => {
                                    if (day === null) {
                                        return <div key={`empty-${idx}`} className="aspect-square" />;
                                    }

                                    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const hasActivity = dates.includes(cellDateStr);
                                    const isSelected = selectedDate === cellDateStr;

                                    return (
                                        <button
                                            key={`day-${day}`}
                                            onClick={() => handleDateSelect(cellDateStr)}
                                            className={`aspect-square relative flex flex-col items-center justify-center rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black'
                                                    : hasActivity
                                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100/50'
                                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                            }`}
                                            title={hasActivity ? 'Activity Recorded' : 'No recorded activity'}
                                        >
                                            <span>{day}</span>
                                            {hasActivity && !isSelected && (
                                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Jump Date Picker */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                                Quick Jump & Search
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    onChange={handleManualDateChange}
                                    value={selectedDate !== 'LIVE' ? selectedDate : ''}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Activity Legend */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <span className="w-2.5 h-2.5 rounded bg-blue-50 border border-blue-100/50 block" />
                                <span>Highlighted dates have activity data</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <span className="w-2.5 h-2.5 rounded bg-blue-600 block" />
                                <span>Currently selected date view</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${
                                selectedDate === 'LIVE' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                                {selectedDate === 'LIVE' ? <Activity className="w-7 h-7 animate-pulse" /> : <Users className="w-7 h-7" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                    {selectedDate === 'LIVE' ? 'Real-Time Active Registry' : `Logged In Users: ${new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${selectedDate === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                                    {displayList.length} User{displayList.length !== 1 && 's'} Found
                                </p>
                            </div>
                        </div>

                        {/* Search, Action Buttons and History */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search Name, Phone or Role..."
                                    className="pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-100 transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={loadData}
                                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl transition-all border border-slate-100 cursor-pointer"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => setIsEmailHistoryOpen(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-200/50 group/email cursor-pointer"
                                >
                                    <Mail size={16} className="text-teal-500 group-hover/email:scale-110 transition-transform" />
                                    <span className="hidden sm:inline">Email History</span>
                                </button>
                            )}

                            <button
                                onClick={() => setIsNotificationHistoryOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-200/50 group/bell cursor-pointer"
                            >
                                <Bell size={16} className="text-indigo-500 group-hover/bell:scale-110 transition-transform" />
                                <span className="hidden sm:inline">Push History</span>
                            </button>

                            <button
                                onClick={handleExportExcel}
                                disabled={exporting || displayList.length === 0}
                                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/10 transition-all disabled:cursor-not-allowed cursor-pointer"
                                title="Download Excel Sheet"
                            >
                                <Download className="w-4 h-4" />
                                <span>{exporting ? 'Exporting...' : 'Download Excel'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="p-6 pl-8 w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleAllOnPage}
                                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">User Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Type</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Role</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        {selectedDate === 'LIVE' ? 'Last Heartbeat' : 'Login Frequency'}
                                    </th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                                        {selectedDate === 'LIVE' ? 'Status' : 'Duration Active'}
                                    </th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-8 text-right w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayList.map((item: any, idx) => {
                                    const name = item.name || 'Anonymous User';
                                    const mobile = item.mobile_number || 'N/A';
                                    const type = item.type || 'USER';
                                    const role = item.role || 'CUSTOMER';
                                    const userId = getUserId(item);
                                    
                                    return (
                                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="p-6 pl-8" onClick={(e) => e.stopPropagation()}>
                                                {userId && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.includes(userId)}
                                                        onChange={(e) => toggleSelection(e, userId)}
                                                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-6 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                                                        type === 'SUB_USER' 
                                                            ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-900 group-hover:text-white' 
                                                            : 'bg-blue-50 text-blue-600 group-hover:bg-blue-900 group-hover:text-white'
                                                    }`}>
                                                        {name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{mobile}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`font-mono font-black text-[9px] px-2.5 py-1 rounded-lg border uppercase tracking-tighter ${
                                                    type === 'SUB_USER'
                                                        ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                                        : 'text-blue-600 bg-blue-50 border-blue-100'
                                                }`}>
                                                    {type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                    {role === 'ADMIN' ? (
                                                        <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                                                    ) : type === 'SUB_USER' ? (
                                                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                    ) : (
                                                        <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                                                    )}
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                {selectedDate === 'LIVE' ? (
                                                    <p className="text-xs font-bold text-slate-500">
                                                        {item.last_seen ? new Date(item.last_seen * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                                                    </p>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <LogIn className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-xs font-black">{item.login_count || 1} session{item.login_count !== 1 && 's'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6 text-right">
                                                {selectedDate === 'LIVE' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
                                                        Online
                                                    </span>
                                                ) : (
                                                    <div className="inline-flex items-center justify-end gap-1.5 font-bold text-xs text-slate-700">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{formatDuration(item.active_seconds)}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    {userId && (
                                                        <>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleOpenSingleEmailModal([userId])}
                                                                    className="p-2 bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all border border-slate-100 hover:border-teal-200 cursor-pointer"
                                                                    title="Send Email"
                                                                >
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setNotificationTargetIds([userId]);
                                                                    setIsNotificationHistoryOpen(true);
                                                                }}
                                                                className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 hover:border-indigo-200 cursor-pointer"
                                                                title="Send Push Notification"
                                                            >
                                                                <Bell className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retrieving activities...</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {displayList.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className="p-24 text-center">
                                            <p className="text-slate-300 font-black text-lg">No active users recorded</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUserIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-slate-900 text-white rounded-[2rem] px-8 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 flex items-center gap-8 backdrop-blur-xl">
                        <div className="flex items-center gap-4 border-r border-white/10 pr-8">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                                {selectedUserIds.length}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Users</p>
                                <p className="text-sm font-black uppercase tracking-tight">Selected</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => {
                                    setNotificationTargetIds(selectedUserIds);
                                    setIsNotificationHistoryOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                            >
                                <Bell className="w-4 h-4 text-indigo-400" /> Notify
                            </button>
                            {isAdmin && (
                                <button 
                                    onClick={handleOpenBulkEmailModal}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-xl transition-all text-xs font-black uppercase tracking-widest text-teal-400 hover:text-teal-300 cursor-pointer"
                                >
                                    <Send className="w-4 h-4" /> Send Email
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedUserIds([])}
                                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                            >
                                <X className="w-4 h-4" /> Deselect
                            </button>
                        </div>
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
                onClose={() => {
                    setIsNotificationHistoryOpen(false);
                    setNotificationTargetIds([]);
                }}
                recipientType="user"
                selectedIds={notificationTargetIds}
            />

            {/* Send Email Modal */}
            {isAdmin && isEmailModalOpen && (
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
        </AdminLayout>
    );
}
