'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, User, Smartphone, Lock, Shield, Settings, Check, MapPin, Users, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import AdminLayout from '@/components/AdminLayout';

interface KycAgent {
    id: number;
    name: string;
    mobile_number: string;
    city_access: string[] | null;
    pincode_access: string[] | null;
    access_type: 'LOAN' | 'MERCHANT' | 'BOTH';
    status: 'ACTIVE' | 'SUSPENDED';
    score: number;
    completed_leads_count?: number;
    pending_leads_count?: number;
}

export default function KycAgentsPage() {
    const [agents, setAgents] = useState<KycAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<KycAgent | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        pin: '',
        city_access: '',
        pincode_access: '',
        access_type: 'BOTH' as 'LOAN' | 'MERCHANT' | 'BOTH'
    });

    const [availablePincodes, setAvailablePincodes] = useState<{pincode: string, assigned_to: string | null}[]>([]);
    const [pincodeSearch, setPincodeSearch] = useState('');
    const [expandedPincodeAgents, setExpandedPincodeAgents] = useState<number[]>([]);

    const togglePincodes = (agentId: number) => {
        setExpandedPincodeAgents(prev => 
            prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
        );
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    useEffect(() => {
        if (isModalOpen && availablePincodes.length === 0) {
            apiFetch('/admin/kyc-agents-pincodes').then(setAvailablePincodes).catch(() => {});
        }
    }, [isModalOpen]);

    const fetchAgents = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/admin/kyc-agents');
            setAgents(data);
        } catch (error) {
            toast.error('Failed to load KYC agents');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePincode = (pincode: string) => {
        const current = formData.pincode_access ? formData.pincode_access.split(',').map(p => p.trim()).filter(Boolean) : [];
        if (current.includes(pincode)) {
            setFormData({ ...formData, pincode_access: current.filter(p => p !== pincode).join(', ') });
        } else {
            setFormData({ ...formData, pincode_access: [...current, pincode].join(', ') });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.mobile_number.length !== 10) {
            toast.error('Mobile number must be exactly 10 digits');
            return;
        }

        const payload = {
            ...formData,
            city_access: formData.city_access.split(',').map(p => p.trim()).filter(p => p.length > 0),
            pincode_access: formData.pincode_access.split(',').map(p => p.trim()).filter(p => p.length > 0)
        };

        try {
            if (editingAgent) {
                const updatePayload = { ...payload };
                if (!updatePayload.pin) delete (updatePayload as any).pin;
                await apiFetch(`/admin/kyc-agents/${editingAgent.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(updatePayload)
                });
                toast.success('Agent updated');
            } else {
                await apiFetch('/admin/kyc-agents', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast.success('Agent created');
            }
            closeModal();
            fetchAgents();
            // Re-fetch pincodes next time modal is opened to refresh assigned labels
            setAvailablePincodes([]);
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this agent?')) return;
        try {
            await apiFetch(`/admin/kyc-agents/${id}`, { method: 'DELETE' });
            toast.success('Agent deleted');
            fetchAgents();
            setAvailablePincodes([]);
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const openModal = (agent?: KycAgent) => {
        setPincodeSearch('');
        if (agent) {
            setEditingAgent(agent);
            setFormData({
                name: agent.name,
                mobile_number: agent.mobile_number,
                pin: '',
                city_access: (agent.city_access || []).join(', '),
                pincode_access: (agent.pincode_access || []).join(', '),
                access_type: agent.access_type
            });
        } else {
            setEditingAgent(null);
            setFormData({
                name: '',
                mobile_number: '',
                pin: '',
                city_access: '',
                pincode_access: '',
                access_type: 'BOTH'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAgent(null);
    };

    const filteredPincodes = availablePincodes.filter(p => p.pincode.includes(pincodeSearch));

    const handleSelectAllFiltered = () => {
        const current = formData.pincode_access ? formData.pincode_access.split(',').map(p => p.trim()).filter(Boolean) : [];
        const filteredPincodeStrings = filteredPincodes.map(pc => pc.pincode);
        const newSet = new Set([...current, ...filteredPincodeStrings]);
        setFormData({ ...formData, pincode_access: Array.from(newSet).join(', ') });
    };

    const handleDeselectAllFiltered = () => {
        const current = formData.pincode_access ? formData.pincode_access.split(',').map(p => p.trim()).filter(Boolean) : [];
        const filteredPincodeStrings = filteredPincodes.map(pc => pc.pincode);
        const remaining = current.filter(p => !filteredPincodeStrings.includes(p));
        setFormData({ ...formData, pincode_access: remaining.join(', ') });
    };

    return (
        <AdminLayout title="Field KYC Agents">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Field KYC Agents</h1>
                        <p className="text-slate-500 font-medium">Manage on-field verification agents</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={20} /> New KYC Agent
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent) => (
                            <div key={agent.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 group-hover:bg-blue-100 rounded-full blur-2xl -mr-10 -mt-10 transition-colors"></div>
                                <div className="flex justify-between items-start mb-6 relative">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{agent.name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                                                <Smartphone size={12} /> {agent.mobile_number}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openModal(agent)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(agent.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="space-y-4 relative">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Access Type</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${agent.access_type === 'BOTH' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                                                {agent.access_type}
                                            </span>
                                        </div>
                                        <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Score</span>
                                            <span className="text-sm font-black text-blue-600">{agent.score} pts</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <span className="text-[10px] font-black text-emerald-600/50 uppercase tracking-wider block mb-1">Completed</span>
                                            <span className="text-sm font-black text-emerald-600">{agent.completed_leads_count || 0} Leads</span>
                                        </div>
                                        <div className="px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                                            <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-wider block mb-1">In Progress</span>
                                            <span className="text-sm font-black text-blue-600">{agent.pending_leads_count || 0} Active</span>
                                        </div>
                                    </div>

                                    <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Assigned Area</span>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {(() => {
                                                const pincodes = agent.pincode_access || [];
                                                const isExpanded = expandedPincodeAgents.includes(agent.id);
                                                const displayPincodes = isExpanded ? pincodes : pincodes.slice(0, 15);
                                                const hiddenCount = pincodes.length - 15;
                                                return (
                                                    <>
                                                        {displayPincodes.map(pc => (
                                                            <span key={pc} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-lg font-mono font-bold text-blue-600 shadow-sm">
                                                                {pc}
                                                            </span>
                                                        ))}
                                                        {!isExpanded && hiddenCount > 0 && (
                                                            <button onClick={() => togglePincodes(agent.id)} className="text-xs font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-300 transition-colors">
                                                                +{hiddenCount} more
                                                            </button>
                                                        )}
                                                        {isExpanded && hiddenCount > 0 && (
                                                            <button onClick={() => togglePincodes(agent.id)} className="text-xs font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded-lg hover:bg-slate-300 transition-colors">
                                                                Show less
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            <MapPin size={10} className="text-slate-300 shrink-0" />
                                            {(agent.city_access || []).length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {(agent.city_access || []).map(city => (
                                                        <span key={city} className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                                                            {city}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                "General Access"
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className={`flex items-center gap-1.5 text-xs font-bold ${agent.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ACTIVE' ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></div>
                                            {agent.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={closeModal}></div>
                        <div className="bg-white rounded-[2rem] w-full max-w-xl p-8 shadow-2xl relative z-10 animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 max-h-[95vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingAgent ? 'Edit Agent' : 'Register New KYC Agent'}</h2>
                                    <p className="text-sm font-medium text-slate-400">Set up field verification parameters</p>
                                </div>
                                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="e.g. Rahul Kumar" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-4 top-4 text-slate-300" size={18} />
                                            <input type="tel" value={formData.mobile_number} onChange={e => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 font-mono focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="10 digits" required maxLength={10} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{editingAgent ? 'New PIN (Optional)' : 'User PIN'}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
                                            <input type="password" value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="6 digit PIN" required={!editingAgent} minLength={4} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Access Type</label>
                                        <select value={formData.access_type} onChange={e => setFormData({ ...formData, access_type: e.target.value as any })} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none appearance-none">
                                            <option value="BOTH">Full KYC (Both)</option>
                                            <option value="LOAN">Loan KYC Only</option>
                                            <option value="MERCHANT">Merchant Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">City Access (Optional)</label>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Comma separated values</span>
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                                        <input type="text" value={formData.city_access} onChange={e => setFormData({ ...formData, city_access: e.target.value })} className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="e.g. Indore, Bhopal" />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pincode Access</label>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Select multiple</span>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <input 
                                            type="text" 
                                            placeholder="Search pincodes..." 
                                            className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none mb-3"
                                            value={pincodeSearch}
                                            onChange={e => setPincodeSearch(e.target.value)}
                                        />

                                        <div className="flex items-center gap-2 mb-3">
                                            <button 
                                                type="button" 
                                                onClick={handleSelectAllFiltered}
                                                className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors border border-blue-100"
                                            >
                                                Select All {pincodeSearch ? 'Filtered' : ''}
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={handleDeselectAllFiltered}
                                                className="flex-1 text-xs font-bold text-slate-500 bg-white hover:bg-slate-100 py-2 rounded-lg transition-colors border border-slate-200"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                        
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {filteredPincodes.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                                                    <span className="text-xs text-slate-400 font-bold">No pincodes found matching "{pincodeSearch}"</span>
                                                    {pincodeSearch.length >= 4 && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                togglePincode(pincodeSearch);
                                                                setPincodeSearch('');
                                                            }}
                                                            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            + Add "{pincodeSearch}" manually
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                filteredPincodes.map(pc => {
                                                    const current = formData.pincode_access ? formData.pincode_access.split(',').map(p => p.trim()).filter(Boolean) : [];
                                                    const isSelected = current.includes(pc.pincode);
                                                    const isAssigned = pc.assigned_to && (!editingAgent || pc.assigned_to !== editingAgent.name);
                                                    
                                                    return (
                                                        <div 
                                                            key={pc.pincode} 
                                                            onClick={() => togglePincode(pc.pincode)}
                                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-slate-50'}`}>
                                                                    {isSelected && <Check size={14} />}
                                                                </div>
                                                                <span className="font-mono font-bold">{pc.pincode}</span>
                                                            </div>
                                                            {isAssigned && (
                                                                <span className="text-[10px] font-black px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
                                                                    {pc.assigned_to}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all transform motion-safe:hover:-translate-y-1">
                                    {editingAgent ? 'Save Changes' : 'Initialize Agent'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

const X = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
