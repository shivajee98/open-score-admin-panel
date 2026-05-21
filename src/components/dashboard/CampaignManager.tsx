'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { 
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Power, Edit3, Users, Search, Check, X, Layout, Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Upload, Info, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CampaignManager({ onViewStats }: { onViewStats?: (id: number) => void }) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        image_url: '',
        link: '',
        roles: [] as string[],
        user_ids: [] as any[]
    });
    
    const [userSearch, setUserSearch] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);
    const [selectedUsersInfo, setSelectedUsersInfo] = useState<Record<number, any>>({});
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/campaigns');
            setCampaigns(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load campaigns', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await apiFetch(`/admin/campaigns/${id}/toggle`, { method: 'POST' });
            toast.success('Campaign status updated');
            loadCampaigns();
        } catch (e) {
            toast.error('Toggle failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            await apiFetch(`/admin/campaigns/${id}`, { method: 'DELETE' });
            toast.success('Campaign deleted');
            loadCampaigns();
        } catch (e) {
            toast.error('Delete failed');
        }
    };

    const openCreateModal = () => {
        setEditingCampaign(null);
        setFormData({
            title: '',
            body: '',
            image_url: '',
            link: '',
            roles: [],
            user_ids: []
        });
        setIsModalOpen(true);
    };

    const openEditModal = async (campaign: any) => {
        setEditingCampaign(campaign);
        setFormData({
            title: campaign.title,
            body: campaign.body,
            image_url: campaign.image_url || '',
            link: campaign.link || '',
            roles: campaign.roles || [],
            user_ids: campaign.user_ids || []
        });

        // Fetch names for existing user_ids
        if (campaign.user_ids && campaign.user_ids.length > 0) {
            try {
                const ids = campaign.user_ids.join(',');
                const rawIds = campaign.user_ids.map((id: any) => 
                    typeof id === 'string' && id.includes(':') ? id.split(':')[1] : id
                ).join(',');
                
                const [usersRes, subUsersRes] = await Promise.all([
                    apiFetch(`/admin/users?user_ids=${rawIds}`),
                    apiFetch(`/admin/sub-users?user_ids=${rawIds}`)
                ]);
                
                const allInfo: any = {};
                (usersRes.data || []).forEach((u: any) => {
                    allInfo[`u:${u.id}`] = { ...u, id: `u:${u.id}`, _source: 'USER' };
                });
                (subUsersRes.data || []).forEach((u: any) => {
                    allInfo[`s:${u.id}`] = { ...u, id: `s:${u.id}`, _source: 'SUB_USER', role: u.role || 'VENDOR' };
                });
                
                setSelectedUsersInfo(prev => ({ ...prev, ...allInfo }));
            } catch (e) {
                console.error("Failed to fetch selected users info", e);
            }
        }

        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.body) {
            toast.error('Title and Body are required');
            return;
        }

        try {
            const url = editingCampaign ? `/admin/campaigns/${editingCampaign.id}` : '/admin/campaigns';
            const method = editingCampaign ? 'PUT' : 'POST';
            
            await apiFetch(url, {
                method,
                body: JSON.stringify(formData)
            });

            toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
            setIsModalOpen(false);
            loadCampaigns();
        } catch (e) {
            toast.error('Save failed');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await apiFetch('/admin/campaigns/upload-image', {
                method: 'POST',
                body: formData
            });
            setFormData(prev => ({ ...prev, image_url: res.url }));
            toast.success('Image uploaded successfully');
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const searchUsers = async (val: string) => {
        setUserSearch(val);
        if (val.length < 3) {
            setFoundUsers([]);
            return;
        }

        setSearchingUsers(true);
        try {
            const [usersRes, subUsersRes] = await Promise.all([
                apiFetch(`/admin/users?search=${val}&per_page=15`),
                apiFetch(`/admin/sub-users?search=${val}&per_page=15`)
            ]);
            
            const standardUsers = (usersRes.data || []).map((u: any) => ({ ...u, id: `u:${u.id}`, _source: 'USER' }));
            const subUsers = (subUsersRes.data || []).map((u: any) => ({ ...u, id: `s:${u.id}`, _source: 'SUB_USER', role: u.role || 'VENDOR' }));
            
            setFoundUsers([...standardUsers, ...subUsers]);
        } catch (e) {
            console.error(e);
        } finally {
            setSearchingUsers(false);
        }
    };

    const toggleUserSelection = (user: any) => {
        const userId = user.id;
        setFormData(prev => {
            const isSelected = prev.user_ids.includes(userId);
            if (isSelected) {
                return {
                    ...prev,
                    user_ids: prev.user_ids.filter(id => id !== userId)
                };
            } else {
                setSelectedUsersInfo(prevInfo => ({
                    ...prevInfo,
                    [userId]: user
                }));
                return {
                    ...prev,
                    user_ids: [...prev.user_ids, userId]
                };
            }
        });
    };

    const removeUserSelection = (userId: any) => {
        setFormData(prev => ({
            ...prev,
            user_ids: prev.user_ids.filter(id => id !== userId)
        }));
    };

    const toggleRoleSelection = (role: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
        }));
    };

    const activeCampaign = campaigns.find(c => c.is_active);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-6">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Campaign Manager</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Control global & targeted popups</p>
                    </div>
                </div>
                <Button 
                    onClick={openCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-indigo-100"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Campaign
                </Button>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="py-12 text-center text-slate-400 font-bold animate-pulse">Loading Campaigns...</div>
                ) : campaigns.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                            <Megaphone className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No Campaigns Created Yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaigns.map((c) => (
                            <div key={c.id} className={cn(
                                "p-5 rounded-[2rem] border-2 transition-all relative group overflow-hidden",
                                c.is_active ? "border-indigo-600 bg-indigo-50/30" : "border-slate-100 bg-white hover:border-slate-200"
                            )}>
                                {c.is_active && (
                                    <div className="absolute top-0 right-0 p-3">
                                        <div className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mb-4">
                                    <h4 className="font-black text-slate-900 text-lg leading-tight mb-1 truncate">{c.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 font-medium">{c.body}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {c.roles?.map((r: string) => (
                                        <span key={r} className="px-2 py-0.5 bg-white border border-slate-100 text-[8px] font-black uppercase text-slate-500 rounded-md">
                                            {r}
                                        </span>
                                    ))}
                                    {c.user_ids?.length > 0 && (
                                        <span className="px-2 py-0.5 bg-white border border-slate-100 text-[8px] font-black uppercase text-slate-500 rounded-md">
                                            {c.user_ids.length} SPECIFIC USERS
                                        </span>
                                    )}
                                </div>

                                {c.registrations && c.registrations.length > 0 && (
                                    <div className="mb-6 p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-indigo-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Total Participants</span>
                                        </div>
                                        <span className="text-lg font-black text-indigo-600">{c.registrations.length}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleToggle(c.id)}
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                c.is_active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            )}
                                            title={c.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <Power className="w-5 h-5" />
                                        </button>
                                        <button 
                                             onClick={() => openEditModal(c)}
                                             className="w-10 h-10 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl flex items-center justify-center transition-all shadow-sm"
                                             title="Edit Campaign"
                                         >
                                             <Edit3 className="w-4 h-4" />
                                         </button>
                                         {onViewStats && (
                                             <button 
                                                 onClick={() => {
                                                     onViewStats(c.id);
                                                     window.scrollTo({ top: 500, behavior: 'smooth' });
                                                 }}
                                                 className="px-4 h-10 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                                             >
                                                 <Trophy size={14} />
                                                 Leaderboard
                                             </button>
                                         )}
                                     </div>
                                    <button 
                                        onClick={() => handleDelete(c.id)}
                                        className="w-10 h-10 text-rose-300 hover:text-rose-600 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Campaign Config Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                    <div className="bg-indigo-600 p-8 text-white">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Megaphone className="w-6 h-6 text-white" />
                            </div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-indigo-100 font-medium leading-relaxed">
                            Configure how and where the campaign popup appears.
                        </DialogDescription>
                    </div>

                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Content</Label>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <Input 
                                        placeholder="Campaign Title (e.g. Special Bonus!)"
                                        className="h-14 rounded-2xl border-slate-100 bg-slate-50 px-6 font-black text-slate-900 focus:ring-indigo-100"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Textarea 
                                        placeholder="Campaign Body Message..."
                                        className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50 p-6 font-medium text-slate-700 focus:ring-indigo-100 resize-none"
                                        value={formData.body}
                                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visuals & Link */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Campaign Banner/Poster
                                </Label>
                                <div className="flex flex-col gap-3">
                                    {formData.image_url && (
                                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setFormData({...formData, image_url: ''})}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Input 
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="campaign-image-upload"
                                            disabled={uploading}
                                        />
                                        <label 
                                            htmlFor="campaign-image-upload"
                                            className={cn(
                                                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-[1.5rem] cursor-pointer transition-all",
                                                uploading ? "opacity-50 pointer-events-none" : "hover:bg-slate-50 border-slate-200"
                                            )}
                                        >
                                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {uploading ? 'Uploading...' : formData.image_url ? 'Change Image' : 'Upload Poster'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <LinkIcon className="w-3 h-3" /> Action Target Link
                                    <div className="group relative ml-auto">
                                        <Info className="w-3.5 h-3.5 text-slate-300" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[9px] font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                                            The destination the user is sent to when they click the action button in the popup.
                                        </div>
                                    </div>
                                </Label>
                                <Input 
                                    placeholder="e.g. /customer/offers or https://google.com"
                                    className="h-12 rounded-xl border-slate-100 bg-slate-50 px-4 font-bold text-slate-700 focus:ring-indigo-100"
                                    value={formData.link}
                                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                                />
                                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/30">
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase leading-relaxed">
                                        Use internal paths like <code className="text-indigo-600">/customer/loans</code> or full URLs starting with <code className="text-indigo-600">https://</code>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Targeting */}
                        <div className="space-y-6 pt-4 border-t border-slate-50">
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Target Roles</Label>
                                <div className="flex flex-wrap gap-3">
                                    {['MERCHANT', 'AGENT', 'VENDOR', 'CUSTOMER'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => toggleRoleSelection(role)}
                                            className={cn(
                                                "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                                                formData.roles.includes(role) 
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                            )}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Specific Users ({formData.user_ids.length} selected)</Label>
                                
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search by name or mobile..."
                                        className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                        value={userSearch}
                                        onChange={(e) => searchUsers(e.target.value)}
                                    />
                                </div>

                                {foundUsers.length > 0 && (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
                                        {foundUsers.map(u => (
                                            <div 
                                                key={`${u._source}-${u.id}`}
                                                onClick={() => toggleUserSelection(u)}
                                                className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-indigo-50/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-500 text-[10px]">
                                                        {u.name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-black text-slate-900">{u.name}</p>
                                                            <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded uppercase tracking-tighter">
                                                                {u.role}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400">{u.mobile_number}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                                    formData.user_ids.includes(u.id) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-300"
                                                )}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {formData.user_ids.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.user_ids.map(id => {
                                            const info = selectedUsersInfo[id];
                                            return (
                                                <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                                    {info?.name || `User #${id}`}
                                                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeUserSelection(id)} />
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 flex items-center justify-between sm:justify-between border-t border-slate-100">
                        <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-700" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest h-14 px-10 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                        >
                            {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
