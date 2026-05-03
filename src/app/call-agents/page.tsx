'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

export default function CallAgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', phone_number: '', app_pin: '', enabled_pin_code: '', is_active: true });

    const loadAgents = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/call-agents');
            setAgents(res.data);
        } catch (e) {
            console.error('Error fetching call agents', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiFetch(`/admin/call-agents/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                await apiFetch('/admin/call-agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            setIsModalOpen(false);
            loadAgents();
        } catch (e: any) {
            alert(e.message || 'Error saving agent');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this agent?')) return;
        await apiFetch(`/admin/call-agents/${id}`, { method: 'DELETE' });
        loadAgents();
    };

    const toggleStatus = async (agent: any) => {
        await apiFetch(`/admin/call-agents/${agent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !agent.is_active })
        });
        loadAgents();
    };

    return (
        <AdminLayout title="Call Support Agents">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Support Agents</h2>
                <button 
                    onClick={() => { setFormData({ id: null, name: '', phone_number: '', app_pin: '', enabled_pin_code: '', is_active: true }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Agent
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Pincode</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">Loading...</td></tr>
                        ) : agents.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">No agents found.</td></tr>
                        ) : agents.map((agent: any) => (
                            <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{agent.name}</td>
                                <td className="p-4 text-slate-600">{agent.phone_number}</td>
                                <td className="p-4 font-mono font-bold text-blue-600">{agent.enabled_pin_code}</td>
                                <td className="p-4">
                                    <button onClick={() => toggleStatus(agent)} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${agent.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {agent.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {agent.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="p-4 flex justify-end gap-2">
                                    <button 
                                        onClick={() => { setFormData({ ...agent, app_pin: '' }); setIsModalOpen(true); }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(agent.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-black text-slate-900">{formData.id ? 'Edit Agent' : 'Add New Agent'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone Number</label>
                                <input type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">App PIN {formData.id && '(Leave blank to keep current)'}</label>
                                <input type="text" value={formData.app_pin} onChange={e => setFormData({...formData, app_pin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-black" required={!formData.id} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Enabled Pincode</label>
                                <input type="text" value={formData.enabled_pin_code} onChange={e => setFormData({...formData, enabled_pin_code: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-blue-600 focus:outline-none focus:ring-2 focus:ring-black" required />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
