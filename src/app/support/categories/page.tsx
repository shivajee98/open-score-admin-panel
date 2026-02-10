'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Users, Shield, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

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
    { id: 'approve_loan', label: 'Process Loan Approvals' }, // "Approval (loan process)"
    { id: 'update_kyc', label: 'Update KYC' }, // "kyc update button"
];

export default function SupportCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        permissions: [] as string[]
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await apiFetch('/admin/support/categories');
            setCategories(res);
        } catch (error) {
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await apiFetch(`/admin/support/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                toast.success('Category updated');
            } else {
                await apiFetch('/admin/support/categories', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                toast.success('Category created');
            }
            closeModal();
            fetchCategories();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await apiFetch(`/admin/support/categories/${id}`, { method: 'DELETE' });
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                permissions: category.permissions || []
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', permissions: [] });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const togglePermission = (permId: string) => {
        setFormData(prev => {
            const perms = new Set(prev.permissions);
            if (perms.has(permId)) {
                perms.delete(permId);
            } else {
                perms.add(permId);
            }
            return { ...prev, permissions: Array.from(perms) };
        });
    };

    return (
        <AdminLayout title="Support Categories">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Categories</h1>
                        <p className="text-slate-500 font-medium">Manage support issues and permissions</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
                    >
                        <Plus size={20} />
                        New Category
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
                                    <button
                                        onClick={() => openModal(cat)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                            <h2 className="text-2xl font-black text-slate-900 mb-6">
                                {editingCategory ? 'Edit Category' : 'New Support Category'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="e.g. Cashback Issues"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Short Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono text-sm"
                                        placeholder="e.g. cashback_issue"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Permissions</label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-700">{perm.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-lg transition-all shadow-lg active:scale-[0.98]"
                                >
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
