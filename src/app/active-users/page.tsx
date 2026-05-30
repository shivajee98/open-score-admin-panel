'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Users, Calendar, Search, Activity, Clock, LogIn, RefreshCw, Smartphone, ShieldCheck, ArrowRight, UserCheck, Download } from 'lucide-react';

export default function ActiveUsersPage() {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | 'LIVE'>('LIVE');
    const [activities, setActivities] = useState<any[]>([]);
    const [liveUsers, setLiveUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [exporting, setExporting] = useState(false);

    // Fetch dates of activity
    const loadDates = async () => {
        try {
            const response = await apiFetch('/admin/analytics/daily-active-dates');
            if (response && Array.isArray(response.dates)) {
                setDates(response.dates);
            }
        } catch (e) {
            console.error('Failed to load active dates:', e);
        }
    };

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

    // Export active users list to Excel
    const handleExportExcel = async () => {
        if (displayList.length === 0) {
            alert('No data to export');
            return;
        }
        setExporting(true);
        try {
            const XLSX = await import('xlsx');
            const rows = displayList.map((item: any, idx) => {
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
                    'User ID': item.id || `row_${idx + 1}`,
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

    // Filtered data based on search input
    const displayList = (selectedDate === 'LIVE' ? liveUsers : activities).filter(item => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            (item.name || '').toLowerCase().includes(s) ||
            (item.mobile_number || '').includes(s) ||
            (item.role || '').toLowerCase().includes(s) ||
            (item.type || '').toLowerCase().includes(s)
        );
    });

    return (
        <AdminLayout title="Active Users Tracker">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Dates Sidebar */}
                <aside className="w-full lg:w-80 shrink-0 bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 flex flex-col gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Select Date View
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">Track active sessions date-wise</p>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Live Option */}
                        <button
                            onClick={() => setSelectedDate('LIVE')}
                            className={`flex items-center justify-between p-4 rounded-2xl font-black text-sm transition-all duration-300 ${
                                selectedDate === 'LIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-md shadow-emerald-500/5'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live Online Users
                            </span>
                            {selectedDate === 'LIVE' && <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />}
                        </button>

                        <div className="border-t border-slate-100 my-2" />

                        {/* Date List */}
                        {dates.length === 0 && selectedDate !== 'LIVE' && (
                            <p className="text-xs text-slate-400 text-center py-6 font-bold">No historical data available</p>
                        )}
                        {dates.map((dateStr) => {
                            const isSelected = selectedDate === dateStr;
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
                                        isSelected
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200/50 shadow-md shadow-blue-500/5'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <Calendar className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                        {new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    {isSelected && <ArrowRight className="w-4 h-4 text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
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

                        {/* Search and Refresh */}
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
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8">User Details</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Type</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Role</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        {selectedDate === 'LIVE' ? 'Last Heartbeat' : 'Login Frequency'}
                                    </th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pr-8 text-right">
                                        {selectedDate === 'LIVE' ? 'Status' : 'Duration Active'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayList.map((item: any, idx) => {
                                    const name = item.name || 'Anonymous User';
                                    const mobile = item.mobile_number || 'N/A';
                                    const type = item.type || 'USER';
                                    const role = item.role || 'CUSTOMER';
                                    
                                    return (
                                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="p-6 pl-8">
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
                                            <td className="p-6 pr-8 text-right">
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
                                        </tr>
                                    );
                                })}

                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retrieving activities...</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {displayList.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="p-24 text-center">
                                            <p className="text-slate-300 font-black text-lg">No active users recorded</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
