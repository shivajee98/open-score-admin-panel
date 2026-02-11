'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, User, Smartphone, Lock, Shield, Settings, Check, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface Agent {
    id: number;
    name: string;
    mobile_number: string;
    support_category_id: number;
    support_category?: {
        id: number;
        name: string;
    };
    status: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    permissions: string[];
    agents_count?: number;
}

const AVAILABLE_PERMISSIONS = [
    { id: 'view_profile', label: 'View Profile' },
    { id: 'view_transaction', label: 'View Transactions' },
    { id: 'add_cashback', label: 'Add Cashback (Credit)' },
    { id: 'approve_emi', label: 'Approve EMI Updates' },
    { id: 'approve_loan', label: 'Process Loan Approvals' },
    { id: 'update_kyc', label: 'Update KYC' },
];

export default function SupportAgentsPage() {
    const [view, setView] = useState<'agents' | 'categories'>('agents');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Editing
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Agent Form
    const [agentFormData, setAgentFormData] = useState({
        name: '',
        mobile_number: '',
        password: '',
        support_category_id: ''
    });

    // Category Form
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        slug: '',
        permissions: [] as string[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [agentsRes, catsRes] = await Promise.all([
                apiFetch('/admin/support/agents'),
                apiFetch('/admin/support/categories')
            ]);
            setAgents(agentsRes);
            setCategories(catsRes);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    // Agent Handlers
    const handleAgentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (agentFormData.mobile_number.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits');
            return;
        }

        try {
            if (editingAgent) {
                const payload: any = { ...agentFormData };
                if (!payload.password) delete payload.password;
                await apiFetch(`/admin/support/agents/${editingAgent.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast.success('Agent updated');
            } else {
                await apiFetch('/admin/support/agents', {
                    method: 'POST',
                    body: JSON.stringify(agentFormData)
                });
                toast.success('Agent created');
            }
            closeAgentModal();
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        }
    };

    const handleAgentDelete = async (id: number) => {
        if (!confirm('Are you sure? This will delete the agent account.')) return;
        try {
            await apiFetch(`/admin/support/agents/${id}`, { method: 'DELETE' });
            toast.success('Agent deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openAgentModal = (agent?: Agent) => {
        if (agent) {
            setEditingAgent(agent);
            setAgentFormData({
                name: agent.name,
                mobile_number: agent.mobile_number,
                password: '',
                support_category_id: agent.support_category_id?.toString() || ''
            });
        } else {
            setEditingAgent(null);
            setAgentFormData({ name: '', mobile_number: '', password: '', support_category_id: '' });
        }
        setIsAgentModalOpen(true);
    };

    const closeAgentModal = () => {
        setIsAgentModalOpen(false);
        setEditingAgent(null);
    };

    // Category Handlers
    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await apiFetch(`/admin/support/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(categoryFormData)
                });
                toast.success('Category updated');
            } else {
                await apiFetch('/admin/support/categories', {
                    method: 'POST',
                    body: JSON.stringify(categoryFormData)
                });
                toast.success('Category created');
            }
            closeCategoryModal();
            fetchData();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleCategoryDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await apiFetch(`/admin/support/categories/${id}`, { method: 'DELETE' });
            toast.success('Category deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openCategoryModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryFormData({
                name: category.name,
                slug: category.slug,
                permissions: category.permissions || []
            });
        } else {
            setEditingCategory(null);
            setCategoryFormData({ name: '', slug: '', permissions: [] });
        }
        setIsCategoryModalOpen(true);
    };

    const closeCategoryModal = () => {
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
    };

    const togglePermission = (permId: string) => {
        setCategoryFormData(prev => {
            const perms = new Set(prev.permissions);
            if (perms.has(permId)) perms.delete(permId);
            else perms.add(permId);
            return { ...prev, permissions: Array.from(perms) };
        });
    };

    return (
        <AdminLayout title="Support Management">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Management</h1>
                        <p className="text-slate-500 font-medium">Manage agents and issue categories</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setView('agents')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'agents' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <User size={14} /> Agents
                        </button>
                        <button
                            onClick={() => setView('categories')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'categories' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Settings size={14} /> Categories
                        </button>
                    </div>
                </div>

                {view === 'agents' ? (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => openAgentModal()}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
                            >
                                <Plus size={20} /> New Agent
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map((agent) => (
                                <div key={agent.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">{agent.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                                                    <Smartphone size={12} /> {agent.mobile_number}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openAgentModal(agent)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => handleAgentDelete(agent.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 relative">
                                        <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Role</span>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                <Shield size={16} className="text-emerald-500" />
                                                {agent.support_category?.name || <span className="text-amber-500">Unassigned</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => openCategoryModal()}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
                            >
                                <Plus size={20} /> New Category
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{cat.name}</h3>
                                            <p className="text-xs text-slate-400 font-mono mt-1">{cat.slug}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openCategoryModal(cat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => handleCategoryDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <Users size={16} className="text-slate-400" />
                                            <span>{cat.agents_count || 0} Agents</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Permissions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(cat.permissions || []).map((perm: string) => (
                                                    <span key={perm} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md border border-slate-200">
                                                        {AVAILABLE_PERMISSIONS.find(ap => ap.id === perm)?.label || perm.replace('_', ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent Modal */}
                {isAgentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeAgentModal}></div>
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingAgent ? 'Edit Agent' : 'New Support Agent'}</h2>
                            <form onSubmit={handleAgentSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Agent Name</label>
                                    <input type="text" value={agentFormData.name} onChange={e => setAgentFormData({ ...agentFormData, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type="tel" value={agentFormData.mobile_number} onChange={e => setAgentFormData({ ...agentFormData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono" placeholder="10 digit mobile" required pattern="[0-9]{10}" maxLength={10} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{editingAgent ? 'New Password (Optional)' : 'Password'}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input type="password" value={agentFormData.password} onChange={e => setAgentFormData({ ...agentFormData, password: e.target.value })} className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" required={!editingAgent} minLength={6} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Assign Category</label>
                                    <select value={agentFormData.support_category_id} onChange={e => setAgentFormData({ ...agentFormData, support_category_id: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white" required>
                                        <option value="">Select a category...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg shadow-lg active:scale-[0.98] transition-all">
                                    {editingAgent ? 'Update Agent' : 'Create Agent'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Category Modal */}
                {isCategoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeCategoryModal}></div>
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">{editingCategory ? 'Edit Category' : 'New Support Category'}</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category Name</label>
                                    <input type="text" value={categoryFormData.name} onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="e.g. Cashback Issues" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Short Slug</label>
                                    <input type="text" value={categoryFormData.slug} onChange={e => setCategoryFormData({ ...categoryFormData, slug: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono text-sm" placeholder="e.g. cashback_issue" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Permissions</label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                                                <input type="checkbox" checked={categoryFormData.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-bold text-slate-700">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg shadow-lg active:scale-[0.98] transition-all">
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
