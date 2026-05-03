'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
    Plus, 
    Trash2, 
    Power, 
    MessageSquare, 
    Users, 
    User as UserIcon, 
    Shield, 
    Globe, 
    Search,
    X,
    Loader2,
    Clock,
    AlertCircle
} from 'lucide-react';

interface Rule {
    id: number;
    name: string | null;
    target_type: 'ALL_USERS' | 'SPECIFIC_ROLES' | 'SPECIFIC_USERS';
    roles: string[] | null;
    user_ids: string[] | null;
    message: string;
    is_active: boolean;
    created_at: string;
}

interface TargetedUser {
    id: number;
    name: string;
    mobile_number: string;
    role: string;
}

interface FormData {
    name: string;
    target_type: 'ALL_USERS' | 'SPECIFIC_ROLES' | 'SPECIFIC_USERS';
    roles: string[];
    user_ids: string[];
    message: string;
    is_active: boolean;
}

export default function LateWithdrawalsPage() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        target_type: 'ALL_USERS',
        roles: [],
        user_ids: [],
        message: '',
        is_active: true
    });

    // User search state
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState<TargetedUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<TargetedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/late-withdrawal-rules');
            setRules(data || []);
        } catch (error) {
            toast.error('Failed to fetch rules');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUsers = async (val: string) => {
        setUserSearch(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await apiFetch(`/admin/users/search-for-rules?search=${val}`);
            setSearchResults(data || []);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleUser = (user: TargetedUser) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = {
            ...formData,
            user_ids: selectedUsers.map(u => String(u.id))
        };

        try {
            if (editingRule) {
                await apiFetch(`/admin/late-withdrawal-rules/${editingRule.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast.success('Rule updated successfully');
            } else {
                await apiFetch('/admin/late-withdrawal-rules', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast.success('Rule created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchRules();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save rule');
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setEditingRule(null);
        setFormData({
            name: '',
            target_type: 'ALL_USERS',
            roles: [],
            user_ids: [],
            message: '',
            is_active: true
        });
        setSelectedUsers([]);
        setUserSearch('');
        setSearchResults([]);
    };

    const handleEdit = (rule: Rule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name || '',
            target_type: rule.target_type,
            roles: rule.roles || [],
            user_ids: rule.user_ids || [],
            message: rule.message,
            is_active: rule.is_active
        });
        
        // If it has user_ids, we should ideally fetch their basic info
        // For simplicity now, we just show IDs or you could add an endpoint to fetch user names
        if (rule.user_ids && rule.user_ids.length > 0) {
            // Placeholder: we'll just show IDs as selected
            setSelectedUsers(rule.user_ids.map(id => ({ id: Number(id), name: `User ID: ${id}`, mobile_number: '', role: '' })));
        }
        
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await apiFetch(`/admin/late-withdrawal-rules/${id}`, { method: 'DELETE' });
            toast.success('Rule deleted');
            fetchRules();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const toggleStatus = async (id: number) => {
        try {
            await apiFetch(`/admin/late-withdrawal-rules/${id}/toggle`, { method: 'POST' });
            setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
            toast.success('Status updated');
        } catch (error) {
            toast.error('Toggle failed');
        }
    };

    return (
        <AdminLayout title="Late Withdrawal Rules">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Clock className="w-8 h-8 text-rose-500" />
                            Late Withdrawal Rules
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Set custom messages for payout buttons based on user selection.</p>
                    </div>
                    <button 
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Create New Rule
                    </button>
                </div>

                {/* Rules List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100">
                            <Loader2 className="w-12 h-12 text-slate-300 animate-spin" />
                            <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching rules...</p>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 text-center px-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No Rules Found</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">Create your first late withdrawal rule to start showing custom messages to your users.</p>
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div 
                                key={rule.id}
                                className={`group bg-white p-6 rounded-3xl border-2 transition-all duration-300 ${rule.is_active ? 'border-slate-100 hover:border-slate-200 shadow-sm' : 'border-slate-50 opacity-75'}`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                rule.target_type === 'ALL_USERS' ? 'bg-indigo-50 text-indigo-600' :
                                                rule.target_type === 'SPECIFIC_ROLES' ? 'bg-amber-50 text-amber-600' :
                                                'bg-rose-50 text-rose-600'
                                            }`}>
                                                {rule.target_type.replace('_', ' ')}
                                            </div>
                                            {rule.is_active ? (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inactive</span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{rule.name || 'Untitled Rule'}</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {rule.target_type === 'ALL_USERS' && (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                                                        <Globe className="w-3.5 h-3.5" />
                                                        All Platform Users
                                                    </span>
                                                )}
                                                {rule.target_type === 'SPECIFIC_ROLES' && rule.roles?.map(role => (
                                                    <span key={role} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        {role}
                                                    </span>
                                                ))}
                                                {rule.target_type === 'SPECIFIC_USERS' && (
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {rule.user_ids?.length || 0} Targeted Users
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                                            <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                            <p className="text-slate-600 font-medium italic text-sm">"{rule.message}"</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 md:self-start">
                                        <button 
                                            onClick={() => handleEdit(rule)}
                                            className="p-3 bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white rounded-2xl transition-all"
                                            title="Edit Rule"
                                        >
                                            <Search className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => toggleStatus(rule.id)}
                                            className={`p-3 rounded-2xl transition-all ${rule.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                                            title={rule.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            <Power className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all"
                                            title="Delete Rule"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSaving && setIsModalOpen(false)} />
                        
                        <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 md:p-12">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                            {editingRule ? 'Edit Withdrawal Rule' : 'Create Withdrawal Rule'}
                                        </h2>
                                        <p className="text-slate-500 font-medium text-sm">Define who sees what message.</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Rule Name */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Internal Name (Optional)</label>
                                        <input 
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Weekend Late Notice"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all"
                                        />
                                    </div>

                                    {/* Target Type Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Target Audience</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'ALL_USERS', label: 'All Users', icon: <Globe className="w-4 h-4" /> },
                                                { id: 'SPECIFIC_ROLES', label: 'Roles', icon: <Shield className="w-4 h-4" /> },
                                                { id: 'SPECIFIC_USERS', label: 'Users', icon: <Users className="w-4 h-4" /> }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, target_type: opt.id as any })}
                                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold transition-all ${
                                                        formData.target_type === opt.id 
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg' 
                                                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                                >
                                                    {opt.icon}
                                                    <span className="text-xs">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Role Selection */}
                                    {formData.target_type === 'SPECIFIC_ROLES' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Select Roles</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['CUSTOMER', 'MERCHANT', 'AGENT', 'SUB_USER'].map(role => {
                                                    const isSelected = formData.roles.includes(role);
                                                    return (
                                                        <button
                                                            key={role}
                                                            type="button"
                                                            onClick={() => {
                                                                const newRoles = isSelected 
                                                                    ? formData.roles.filter(r => r !== role)
                                                                    : [...formData.roles, role];
                                                                setFormData({ ...formData, roles: newRoles });
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                                                isSelected 
                                                                ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' 
                                                                : 'bg-slate-50 text-slate-400 border-2 border-slate-100 hover:border-slate-200'
                                                            }`}
                                                        >
                                                            {role}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* User Search & Selection */}
                                    {formData.target_type === 'SPECIFIC_USERS' && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Search Users</label>
                                                <div className="relative">
                                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        value={userSearch}
                                                        onChange={e => handleSearchUsers(e.target.value)}
                                                        placeholder="Name or Mobile Number..."
                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all"
                                                    />
                                                    {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />}
                                                </div>
                                            </div>

                                            {/* Search Results */}
                                            {searchResults.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto bg-white border-2 border-slate-100 rounded-2xl divide-y divide-slate-50">
                                                    {searchResults.map(user => (
                                                        <div 
                                                            key={user.id}
                                                            onClick={() => toggleUser(user)}
                                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-xs uppercase">
                                                                    {user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">{user.mobile_number} • {user.role}</p>
                                                                </div>
                                                            </div>
                                                            {selectedUsers.find(u => u.id === user.id) ? (
                                                                <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white">
                                                                    <Plus className="w-4 h-4 rotate-45" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                                    <Plus className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Selected Users Chips */}
                                            {selectedUsers.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedUsers.map(user => (
                                                        <span key={user.id} className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-100">
                                                            {user.name}
                                                            <X className="w-3.5 h-3.5 cursor-pointer hover:scale-125 transition-transform" onClick={() => toggleUser(user)} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Button Message</label>
                                        <textarea 
                                            required
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="e.g. Please wait, payout under processing"
                                            rows={3}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all resize-none"
                                        />
                                    </div>

                                    {/* Submit */}
                                    <div className="pt-4">
                                        <button 
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-slate-900/20 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                    Saving Changes...
                                                </>
                                            ) : (
                                                editingRule ? 'Update Rule' : 'Create Rule'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
