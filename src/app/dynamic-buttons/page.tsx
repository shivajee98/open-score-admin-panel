'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DynamicButton {
    id: number;
    name: string;
    visibility: string[];
    text_color: string;
    slug: string;
    is_active: boolean;
    created_at: string;
}

export default function DynamicButtonsPage() {
    const [buttons, setButtons] = useState<DynamicButton[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchButtons();
    }, []);

    const fetchButtons = async () => {
        try {
            const res = await apiFetch('/admin/dynamic-buttons');
            setButtons(res);
        } catch (error) {
            toast.error('Failed to fetch buttons');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this button?')) return;

        try {
            await apiFetch(`/admin/dynamic-buttons/${id}`, { method: 'DELETE' });
            toast.success('Button deleted successfully');
            fetchButtons();
        } catch (error) {
            toast.error('Failed to delete button');
        }
    };

    const toggleStatus = async (button: DynamicButton) => {
        try {
            await apiFetch(`/admin/dynamic-buttons/${button.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: !button.is_active })
            });
            toast.success(`Button ${button.is_active ? 'disabled' : 'enabled'} successfully`);
            fetchButtons();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <AdminLayout title="Dynamic Buttons">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-500 text-sm">Manage dynamic buttons for the customer profile page.</p>
                    </div>
                    <Link
                        href="/dynamic-buttons/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Create Button
                    </Link>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Visibility</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Color</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 animate-pulse font-bold uppercase text-xs">Loading Buttons...</td>
                                    </tr>
                                ) : buttons.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No dynamic buttons found.</td>
                                    </tr>
                                ) : (
                                    buttons.map((btn) => (
                                        <tr key={btn.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{btn.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">/{btn.slug}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {btn.visibility.map(role => (
                                                        <span key={role} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-wider">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: btn.text_color }} />
                                                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">Icon: {btn.text_color}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: (btn as any).bg_color || '#ffffff' }} />
                                                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">Page: {(btn as any).bg_color || '#ffffff'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleStatus(btn)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${btn.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                                                >
                                                    {btn.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    {btn.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                {new Date(btn.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/dynamic-buttons/edit?id=${btn.id}`}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(btn.id)}
                                                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
