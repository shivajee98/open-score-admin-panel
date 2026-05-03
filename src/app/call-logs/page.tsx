'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Phone, Play, Clock, User, Mic } from 'lucide-react';

export default function CallLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/call-logs');
            setLogs(res.logs.data);
        } catch (e) {
            console.error('Error fetching call logs', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const formatDuration = (start: string, end: string) => {
        if (!start || !end) return '-';
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        const diff = Math.floor((e - s) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <AdminLayout title="Call Logs & Recordings">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Recent Calls</h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="p-4">Time</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Agent</th>
                            <th className="p-4">Duration</th>
                            <th className="p-4 text-right">Recording</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">No call logs found.</td></tr>
                        ) : logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-full ${log.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{new Date(log.created_at).toLocaleDateString()}</p>
                                            <p className="text-xs text-slate-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <div>
                                            <p className="font-bold text-sm">{log.customer?.name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-500 font-mono">{log.customer?.mobile_number}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Mic className="w-4 h-4 text-slate-400" />
                                        <p className="font-bold text-sm">{log.agent?.name || 'Unknown'}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-mono text-sm">{formatDuration(log.started_at, log.ended_at)}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    {log.recording_url ? (
                                        <audio controls src={`https://api.msmeloan.sbs${log.recording_url}`} className="h-8 w-48 ml-auto" />
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No recording</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
