'use client';

import { useState, useEffect } from 'react';
import { Shield, MapPin, Clock, CheckCircle2, Send, ListFilter, UserCheck, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'sonner';

export default function KycLeadsPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState<'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED'>('PENDING');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        fetchLeads();
        fetchAgents();
    }, [status]);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch(`/admin/kyc-leads?status=${status}`);
            setLeads(data || []);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch leads');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const data = await apiFetch('/admin/kyc-agents');
            setAgents(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssign = async (agentId: number) => {
        try {
            await apiFetch(`/admin/kyc-leads/${selectedLead.id}/assign`, {
                method: 'POST',
                body: JSON.stringify({ agent_id: agentId })
            });
            toast.success('Agent assigned successfully');
            setShowAssignModal(false);
            fetchLeads();
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign lead');
        }
    };

    return (
        <AdminLayout title="KYC Verification Leads">
            <div className="space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">KYC Leads</h1>
                        <p className="text-slate-500 font-medium">Manage and assign field verification leads</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="pl-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            className="bg-slate-50 border-none px-4 py-2 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending (Pool)</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DECLINED">Declined</option>
                        </select>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold animate-pulse">Fetching verification leads...</p>
                    </div>
                ) : leads.length > 0 ? (
                    <div className="grid gap-6">
                        {leads.map((lead) => (
                            <div key={lead.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors"></div>
                                
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative">
                                    <div className="flex gap-5">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all shadow-inner">
                                            <Shield size={32} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight">{lead.customer_name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    lead.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                    lead.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                                    lead.status === 'DECLINED' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {lead.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {lead.customer_city}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-500" /> {new Date(lead.created_at).toLocaleDateString()}</span>
                                                <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">#LD-{lead.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full lg:w-auto">
                                        {lead.agent ? (
                                            <div className="flex items-center gap-3 bg-slate-50 pl-2 pr-5 py-2 rounded-2xl border border-slate-100 w-full lg:w-auto">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 uppercase font-black text-xs text-blue-600 shadow-sm">
                                                    {lead.agent.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Field Agent</p>
                                                    <p className="text-sm font-black text-slate-700">{lead.agent.name}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }}
                                                className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                                            >
                                                <UserCheck size={16} /> Assign Agent
                                            </button>
                                        )}
                                    </div>
                                </div>

                <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between border-t border-slate-50 pt-6 gap-6">
                    <div className="flex flex-wrap gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Required</p>
                                            <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                {lead.type} Verification
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Contact</p>
                                            <p className="text-sm font-bold text-slate-600">+91 {lead.customer_mobile}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Pincode</p>
                                            <p className="text-sm font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg">{lead.customer_pincode}</p>
                                        </div>
                                    </div>
                                    
                                    {lead.status === 'COMPLETED' && (
                                        <button 
                                            onClick={() => setSelectedReport(lead)}
                                            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                        >
                                            View Report <CheckCircle2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 py-32 flex flex-col items-center justify-center text-center px-8">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6">
                            <ListFilter size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">No leads found</h3>
                        <p className="text-slate-400 font-medium max-w-sm">No verification leads match your current filter. New leads will appear here as customers apply for Loans or Merchants.</p>
                    </div>
                )}

                {/* Assignment Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Assign Agent</h2>
                            <p className="text-slate-500 font-medium mb-8">Choose an agent to verify <span className="text-blue-600 font-black">{selectedLead?.customer_name}</span></p>
                            
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {agents
                                    .filter(a => a.status === 'ACTIVE' && (a.city_access === selectedLead.customer_city || true))
                                    .map(agent => (
                                        <button 
                                            key={agent.id}
                                            onClick={() => handleAssign(agent.id)}
                                            className="w-full text-left p-5 rounded-[2rem] border border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shadow-inner">
                                                    {agent.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 tracking-tight">{agent.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{agent.city_access} • Score: {agent.score}</p>
                                                </div>
                                            </div>
                                            <Send size={18} className="text-slate-200 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))
                                }
                                {agents.filter(a => a.status === 'ACTIVE').length === 0 && (
                                    <div className="p-8 text-center bg-slate-50 rounded-3xl">
                                        <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-slate-500 font-bold">No active agents available</p>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setShowAssignModal(false)}
                                className="w-full mt-8 py-5 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Verification Report Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Verification Report</h2>
                                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Lead #LD-{selectedReport.id} • {selectedReport.customer_name}</p>
                                </div>
                                <button onClick={() => setSelectedReport(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-colors">
                                    <AlertCircle size={24} className="rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Captured Photos */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Captured Photos <div className="h-px bg-slate-100 flex-1"></div>
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedReport.verification_data?.photos?.map((photo: string, idx: number) => (
                                            <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-2xl overflow-hidden border border-slate-100 group relative">
                                                <img src={photo} alt={`Verification ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Send size={20} className="text-white -rotate-45" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Agent Remarks */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Agent Remarks <div className="h-px bg-slate-100 flex-1"></div>
                                    </h4>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                            "{selectedReport.verification_data?.notes || 'No remarks provided by agent.'}"
                                        </p>
                                    </div>
                                </div>

                                {/* Geotagging Data */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Latitude</span>
                                        <p className="text-sm font-mono font-black text-blue-700">{selectedReport.verification_data?.gps?.lat || 'N/A'}</p>
                                    </div>
                                    <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Longitude</span>
                                        <p className="text-sm font-mono font-black text-indigo-700">{selectedReport.verification_data?.gps?.long || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-t border-slate-50 pt-6">
                                    <span>Verified On</span>
                                    <span>{new Date(selectedReport.verified_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
