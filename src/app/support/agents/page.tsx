'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, User, Smartphone, Lock, Shield } from 'lucide-react';
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
}

export default function SupportAgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        password: '',
        support_category_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.mobile_number.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits');
            return;
        }

        try {
            if (editingAgent) {
                // For update, password is optional
                const payload: any = { ...formData };
                if (!payload.password) delete payload.password;

                await apiFetch(`/admin/support/agents/${editingAgent.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast.success('Agent updated');
            } else {
                await apiFetch('/admin/support/agents', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                toast.success('Agent created');
            }
            closeModal();
            fetchData();
        } catch (error: any) {
            // Friendly error messages
            const msg = error.message || '';
            if (msg.toLowerCase().includes('mobile number') && msg.toLowerCase().includes('taken')) {
                toast.error('This mobile number is already registered to another agent.');
            } else if (msg) {
                toast.error(msg);
            } else {
                toast.error('Operation failed. Please try again.');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This will delete the agent account.')) return;
        try {
            await apiFetch(`/admin/support/agents/${id}`, { method: 'DELETE' });
            toast.success('Agent deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openModal = (agent?: Agent) => {
        if (agent) {
            setEditingAgent(agent);
            setFormData({
                name: agent.name,
                mobile_number: agent.mobile_number,
                password: '', // Don't fill password on edit
                support_category_id: agent.support_category_id?.toString() || ''
            });
        } else {
            setEditingAgent(null);
            setFormData({
                name: '',
                mobile_number: '',
                password: '',
                support_category_id: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAgent(null);
    };

    return (
        <AdminLayout title="Support Agents">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Agents</h1>
                        <p className="text-slate-500 font-medium">Manage support staff and their assignments</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus size={20} />
                        New Agent
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
                                            <Smartphone size={12} />
                                            {agent.mobile_number}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openModal(agent)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agent.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">
                                {editingAgent ? 'Edit Agent' : 'New Support Agent'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Agent Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Mobile Number</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="tel"
                                            value={formData.mobile_number}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setFormData({ ...formData, mobile_number: val });
                                            }}
                                            className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                                            placeholder="10 digit mobile"
                                            required
                                            pattern="[0-9]{10}"
                                            maxLength={10}
                                            title="Please enter exactly 10 digits"
                                        // onEdit we might want to allow changing numbers if needed, user requirement said "editing ... changing phone"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 pl-1">Must be exactly 10 digits</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        {editingAgent ? 'New Password (Optional)' : 'Password'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            required={!editingAgent}
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Assign Category</label>
                                    <select
                                        value={formData.support_category_id}
                                        onChange={e => setFormData({ ...formData, support_category_id: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                                        required
                                    >
                                        <option value="">Select a category...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {editingAgent ? 'Update Agent' : 'Create Agent'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
