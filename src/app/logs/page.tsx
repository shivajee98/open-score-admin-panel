'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Shield } from 'lucide-react';

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLogs = async () => {
        try {
            const data = await apiFetch('/logs');
            setLogs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    return (
        <AdminLayout title="Audit Logs">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">System Logs</h3>
                        <p className="text-slate-500 font-medium text-sm">Track all admin actions and security events.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest pl-8">Action</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Admin ID</th>
                                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-6 pl-8">
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs border border-blue-100">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-6 font-medium text-slate-700">
                                        {log.description}
                                    </td>
                                    <td className="p-6 font-mono text-xs text-slate-400">
                                        #{log.admin_id}
                                    </td>
                                    <td className="p-6 pr-8 text-right font-medium text-slate-500 text-sm">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 font-bold">No logs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
