'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
    Megaphone, 
    Send, 
    Calendar, 
    Clock, 
    Users, 
    Link as LinkIcon, 
    Plus, 
    Trash2, 
    Power,
    Timer,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronRight,
    Search
} from 'lucide-react';

const ROLES = [
    { id: 'MERCHANT', label: 'Merchants', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'AGENT', label: 'Agents', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { id: 'CUSTOMER', label: 'Customers', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'STUDENT', label: 'Students', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'VENDOR', label: 'Vendors', color: 'bg-rose-50 text-rose-600 border-rose-100' },
];

const FREQUENCIES = [
    { value: 1, label: 'Every minute' },
    { value: 5, label: 'Every 5 mins' },
    { value: 10, label: 'Every 10 mins' },
    { value: 30, label: 'Every 30 mins' },
    { value: 60, label: 'Hourly' },
];

export default function BroadcastPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        link: '',
        roles: [] as string[],
        user_ids: [] as number[],
        start_time: '',
        end_time: '',
        frequency_minutes: 5,
        is_active: true
    });

    // User Search State
    const [userSearchText, setUserSearchText] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/broadcasts');
            setSchedules(data || []);
        } catch (error) {
            toast.error('Failed to load broadcasts');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = (roleId: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter(r => r !== roleId)
                : [...prev.roles, roleId]
        }));
    };

    const handleUserSearch = async (val: string) => {
        setUserSearchText(val);
        if (val.length < 3) {
            setUserSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Using search for merchants/agents/customers
            const data = await apiFetch(`/admin/users?search=${val}&type=all&per_page=10`);
            setUserSearchResults(data.data || []);
        } catch (error) {
            console.error('User search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddUser = (user: any) => {
        if (formData.user_ids.includes(user.id)) {
            toast.error('User already selected');
            return;
        }

        setSelectedUsers(prev => [...prev, user]);
        setFormData(prev => ({
            ...prev,
            user_ids: [...prev.user_ids, user.id]
        }));
        setUserSearchText('');
        setUserSearchResults([]);
    };

    const handleRemoveUser = (userId: number) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== userId));
        setFormData(prev => ({
            ...prev,
            user_ids: prev.user_ids.filter(id => id !== userId)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.roles.length === 0 && formData.user_ids.length === 0) {
            toast.error('Please select at least one role or specific user');
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch('/admin/broadcasts', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success('Broadcast scheduled successfully');
            setIsCreateModalOpen(false);
            resetForm();
            loadSchedules();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create broadcast');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendNow = async () => {
        if (!formData.title || !formData.body || (formData.roles.length === 0 && formData.user_ids.length === 0)) {
            toast.error('Title, Body, and (Roles or Users) are required for immediate broadcast');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiFetch('/admin/broadcasts/send-now', {
                method: 'POST',
                body: JSON.stringify({
                    title: formData.title,
                    body: formData.body,
                    link: formData.link,
                    roles: formData.roles,
                    user_ids: formData.user_ids
                })
            });
            toast.success(res.message || 'Broadcast sent immediately');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send broadcast');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            body: '',
            link: '',
            roles: [],
            user_ids: [],
            start_time: '',
            end_time: '',
            frequency_minutes: 5,
            is_active: true
        });
        setSelectedUsers([]);
        setUserSearchText('');
        setUserSearchResults([]);
    };

    const deleteSchedule = async (id: number) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await apiFetch(`/admin/broadcasts/${id}`, { method: 'DELETE' });
            toast.success('Broadcast deleted');
            loadSchedules();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const toggleStatus = async (schedule: any) => {
        try {
            await apiFetch(`/admin/broadcasts/${schedule.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: !schedule.is_active })
            });
            toast.success(`Broadcast ${!schedule.is_active ? 'enabled' : 'disabled'}`);
            loadSchedules();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <AdminLayout title="Broadcast Center">
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">Communication Hub</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Internal Announcements
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        </h1>
                        <p className="text-slate-500 font-medium">Broadcast custom notifications to targeted user roles via FCM and Email.</p>
                    </div>
                    
                    <button 
                        onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 hover:-translate-y-1"
                    >
                        <Plus className="w-5 h-5" />
                        New Broadcast
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Create Form - Sticky on desktop */}
                    <div className={`lg:col-span-5 space-y-6 ${isCreateModalOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 md:p-10 relative">
                            {/* Decorative Background Container */}
                            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-8 relative">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">Announcement Title</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="e.g. Training Session Starting Soon"
                                            className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 transition-all outline-none"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">Message Content</label>
                                        <textarea 
                                            required
                                            rows={4}
                                            placeholder="Tell your users what's happening..."
                                            className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 transition-all outline-none resize-none"
                                            value={formData.body}
                                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">Meeting/Action Link (Optional)</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="url"
                                                placeholder="https://meet.google.com/..."
                                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 transition-all outline-none"
                                                value={formData.link}
                                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block ml-1">Target Audiences (Roles)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {ROLES.map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => handleToggleRole(role.id)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                                                        formData.roles.includes(role.id)
                                                            ? `${role.color.split(' ')[2]} border-current`
                                                            : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {role.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 block ml-1">Or Targeted Individuals</label>
                                        <div className="relative">
                                            <div className="relative group">
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    placeholder="Search by name or mobile..."
                                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 transition-all outline-none"
                                                    value={userSearchText}
                                                    onChange={e => handleUserSearch(e.target.value)}
                                                />
                                                {isSearching && (
                                                    <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-600" />
                                                )}
                                            </div>

                                             {/* Search Results Dropdown */}
                                             {userSearchResults.length > 0 && (
                                                <div className="absolute z-[100] left-0 right-0 mt-3 bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-3 max-h-72 overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                                                    <div className="px-3 pb-2 mb-2 border-b border-slate-50">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matched Personnel</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {userSearchResults.map(user => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => handleAddUser(user)}
                                                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-slate-900 rounded-2xl transition-all group border border-transparent hover:border-slate-100"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                        {user.name.charAt(0)}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[10px] font-bold text-slate-400">+{user.mobile_number}</span>
                                                                            <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold uppercase">{user.role}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-500 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
                                                                    <Plus className="w-4 h-4" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Users List */}
                                        {selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {selectedUsers.map(user => (
                                                    <div 
                                                        key={user.id}
                                                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-100 shadow-sm"
                                                    >
                                                        <span>{user.name}</span>
                                                        <button 
                                                            onClick={() => handleRemoveUser(user.id)}
                                                            className="p-0.5 hover:bg-indigo-100 rounded-md transition-colors"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">Start Time</label>
                                            <input 
                                                type="datetime-local"
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 transition-all outline-none"
                                                value={formData.start_time}
                                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">End Time</label>
                                            <input 
                                                type="datetime-local"
                                                required
                                                className="w-full px-5 py-4 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl font-bold text-slate-900 transition-all outline-none"
                                                value={formData.end_time}
                                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block ml-1">Broadcast Frequency</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {FREQUENCIES.slice(0, 3).map(freq => (
                                                <button
                                                    key={freq.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, frequency_minutes: freq.value })}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        formData.frequency_minutes === freq.value 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {freq.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                                        Schedule Automation
                                    </button>
                                    
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-slate-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            <span className="bg-white px-4">Or Send Immediate</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSendNow}
                                        disabled={submitting}
                                        className="w-full py-5 bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-900 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                        Blast Right Now
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right: History & Stats */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Highlights Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Megaphone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Broadcasts</p>
                                    <p className="text-3xl font-black text-slate-900">{schedules.filter(s => s.is_active).length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Timer className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Run Count</p>
                                    <p className="text-3xl font-black text-slate-900">{schedules.reduce((acc, s) => acc + (s.run_count || 0), 0)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    Broadcast Records
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{schedules.length}</span>
                                </h2>
                                <div className="flex items-center gap-2 text-slate-400 h-10 px-4 bg-white border border-slate-100 rounded-xl">
                                    <Search className="w-4 h-4" />
                                    <input type="text" placeholder="Search broadcasts..." className="bg-transparent border-none outline-none text-xs font-bold" />
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                                    <Loader2 className="w-10 h-10 animate-spin" />
                                    <p className="font-bold">Syncing transmission logs...</p>
                                </div>
                            ) : schedules.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white rounded-[2.5rem] border border-slate-100 border-dashed text-center px-10">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                        <Megaphone className="w-8 h-8 opacity-20" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">Silence in the airwaves</p>
                                        <p className="text-sm font-medium">Create your first broadcast to engage your users.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {schedules.map((schedule) => {
                                        const now = new Date();
                                        const isActive = schedule.is_active && new Date(schedule.start_time) <= now && new Date(schedule.end_time) >= now;
                                        
                                        return (
                                            <div 
                                                key={schedule.id}
                                                className="bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all p-6 group relative overflow-hidden"
                                            >
                                                {/* Left Accent Bar */}
                                                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${schedule.is_active ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                                
                                                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between relative z-10">
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{schedule.title}</h3>
                                                            {isActive && (
                                                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            )}
                                                        </div>
                                                        
                                                        <p className="text-slate-500 font-medium text-sm line-clamp-2">{schedule.body}</p>
                                                        
                                                        <div className="flex flex-wrap gap-3 items-center">
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 border border-slate-100 uppercase tracking-widest">
                                                                <Clock className="w-3 h-3" />
                                                                {schedule.frequency_minutes}m interval
                                                            </div>
                                                            <div className="flex -space-x-1">
                                                                {schedule.roles.map((r: string) => {
                                                                    const roleInfo = ROLES.find(role => role.id === r);
                                                                    return (
                                                                        <div 
                                                                            key={r} 
                                                                            title={roleInfo?.label}
                                                                            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black ${roleInfo?.color || 'bg-slate-100 text-slate-500'}`}
                                                                        >
                                                                            {r[0]}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {schedule.link && (
                                                                <a 
                                                                    href={schedule.link} 
                                                                    target="_blank" 
                                                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest"
                                                                >
                                                                    <LinkIcon className="w-3 h-3" />
                                                                    Link Attached
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-4 md:items-end justify-between md:border-l border-slate-100 md:pl-8">
                                                        <div className="flex flex-col md:items-end gap-1">
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {new Date(schedule.start_time).toLocaleDateString()} - {new Date(schedule.end_time).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                                                Runs at {new Date(schedule.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => toggleStatus(schedule)}
                                                                className={`p-3 rounded-2xl transition-all ${
                                                                    schedule.is_active 
                                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                                }`}
                                                                title={schedule.is_active ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {schedule.is_active ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteSchedule(schedule.id)}
                                                                className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                            <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl md:hidden">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
