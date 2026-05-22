'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { ShieldCheck, Search, Filter, ChevronLeft, ChevronRight, Fingerprint, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function KycLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const [testingInProd, setTestingInProd] = useState<boolean>(false);
    const [testingLoading, setTestingLoading] = useState<boolean>(true);
    const [testingSaving, setTestingSaving] = useState<boolean>(false);

    const [bypassKycForTest, setBypassKycForTest] = useState<boolean>(false);
    const [bypassLoading, setBypassLoading] = useState<boolean>(true);
    const [bypassSaving, setBypassSaving] = useState<boolean>(false);

    const fetchSettings = async () => {
        setTestingLoading(true);
        setBypassLoading(true);
        try {
            const data = await apiFetch('/admin/system-settings');
            const testingSetting = data.find((s: any) => s.key === 'testing_in_prod');
            if (testingSetting) {
                setTestingInProd(testingSetting.value === '1');
            }
            const bypassSetting = data.find((s: any) => s.key === 'bypass_kyc_for_test_accounts');
            if (bypassSetting) {
                setBypassKycForTest(bypassSetting.value === '1');
            }
        } catch (error) {
            console.error('Failed to load system settings', error);
        } finally {
            setTestingLoading(false);
            setBypassLoading(false);
        }
    };

    const handleToggleTesting = async (checked: boolean) => {
        setTestingSaving(true);
        const toastId = toast.loading(checked ? 'Enabling Test Mode...' : 'Disabling Test Mode...');
        try {
            await apiFetch('/admin/system-settings', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        testing_in_prod: checked ? '1' : '0'
                    }
                })
            });
            setTestingInProd(checked);
            toast.success(
                checked 
                    ? 'Testing in Prod enabled! 99999-prefix numbers will bypass OTP.' 
                    : 'Testing in Prod disabled. Standard OTP flow active.',
                { id: toastId }
            );
        } catch (error) {
            toast.error('Failed to update testing in prod setting', { id: toastId });
        } finally {
            setTestingSaving(false);
        }
    };

    const handleToggleBypass = async (checked: boolean) => {
        setBypassSaving(true);
        const toastId = toast.loading(checked ? 'Enabling KYC Bypass...' : 'Disabling KYC Bypass...');
        try {
            await apiFetch('/admin/system-settings', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        bypass_kyc_for_test_accounts: checked ? '1' : '0'
                    }
                })
            });
            setBypassKycForTest(checked);
            toast.success(
                checked 
                    ? 'KYC Bypass enabled for 99999 alternate numbers!' 
                    : 'KYC Bypass disabled. Real KYC active.',
                { id: toastId }
            );
        } catch (error) {
            toast.error('Failed to update KYC bypass setting', { id: toastId });
        } finally {
            setBypassSaving(false);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                search: search,
                type: typeFilter,
                status: statusFilter,
                page: page.toString(),
                per_page: '20'
            });
            const response = await apiFetch(`/admin/kyc-logs?${query}`);
            if (response && response.data) {
                setLogs(Array.isArray(response.data) ? response.data : []);
                setTotalPages(response.last_page || 1);
                setTotalLogs(response.total || 0);
            } else {
                setLogs([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(loadLogs, 300);
        return () => clearTimeout(timeout);
    }, [search, typeFilter, statusFilter, page]);

    return (
        <AdminLayout title="KYC Verification Logs">
            {/* Control Banner Card */}
            <div className="mb-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all">
                <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            testingInProd || bypassKycForTest
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                                : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${(testingInProd || bypassKycForTest) ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                            {(testingInProd || bypassKycForTest) ? 'Bypass Active' : 'Secure Mode'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Developer Settings</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Production Bypass Control</h2>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                        Toggle developer bypass features in production. When active, any OTP request or verification for mobile numbers starting with <code className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-amber-600 font-bold">99999</code> will automatically bypass carrier SMS dispatch and accept <code className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-emerald-600 font-bold">123456</code>. You can also enable <strong className="text-slate-800">KYC Auto-Verify</strong> to allow bypassed alternate number accounts to verify Aadhaar and PAN using mock sandbox responses.
                    </p>
                </div>
                
                <div className="flex flex-col gap-4 min-w-[280px] w-full lg:w-auto">
                    {/* Toggle 1: Testing in Prod */}
                    <div className="flex items-center gap-4 bg-white/60 border border-slate-100/50 backdrop-blur p-5 rounded-[2rem] shadow-sm">
                        <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Testing in Prod</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                {testingLoading ? 'Loading setting...' : (testingInProd ? 'OTP bypass is live' : 'Bypass is disabled')}
                            </p>
                        </div>
                        
                        {testingLoading ? (
                            <div className="w-10 h-6 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            </div>
                        ) : (
                            <button
                                disabled={testingSaving}
                                onClick={() => handleToggleTesting(!testingInProd)}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-2 ${
                                    testingInProd ? 'bg-amber-500' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                                        testingInProd ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        )}
                    </div>

                    {/* Toggle 2: KYC Bypass for Test Accounts */}
                    <div className="flex items-center gap-4 bg-white/60 border border-slate-100/50 backdrop-blur p-5 rounded-[2rem] shadow-sm">
                        <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-wide">KYC Auto-Verify</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                {bypassLoading ? 'Loading setting...' : (bypassKycForTest ? 'Mock Aadhaar & PAN active' : 'Real KYC active')}
                            </p>
                        </div>
                        
                        {bypassLoading ? (
                            <div className="w-10 h-6 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                            </div>
                        ) : (
                            <button
                                disabled={bypassSaving}
                                onClick={() => handleToggleBypass(!bypassKycForTest)}
                                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-2 ${
                                    bypassKycForTest ? 'bg-amber-500' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                                        bypassKycForTest ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner border border-blue-100">
                            <Fingerprint className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Identity API Audit</h3>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                {totalLogs} Verification Hits
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search User, PAN or Aadhaar..."
                                className="pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-100 transition-all"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            <select
                                className="pl-11 pr-8 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            >
                                <option value="ALL">All Types</option>
                                <option value="AADHAAR_OTP">Aadhaar OTP</option>
                                <option value="AADHAAR_VERIFY">Aadhaar Verify</option>
                                <option value="PAN_VERIFY">PAN Verify</option>
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                className="px-6 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600 appearance-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="ALL">All Status</option>
                                <option value="SUCCESS">Success (200)</option>
                                <option value="FAILURE">Failure</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-8">User</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Type</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attempt</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identifier / Ref</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Message</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-8">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {log.user?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{log.user?.name || 'Unknown'}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{log.user?.mobile_number || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`font-mono font-black text-[9px] px-2 py-1 rounded-lg border uppercase tracking-tighter ${
                                            log.type === 'PAN_VERIFY' ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                                            log.type === 'AADHAAR_VERIFY' ? 'text-blue-600 bg-blue-50 border-blue-100' : 
                                            'text-slate-600 bg-slate-50 border-slate-100'
                                        }`}>
                                            {log.type?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                                {log.attempt_count || 1}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Try</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-mono font-bold text-slate-600">
                                            {log.identifier_used || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            {log.http_status === 200 ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-500" />
                                            )}
                                            <span className={`text-xs font-black ${log.http_status === 200 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {log.http_status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-xs font-bold text-slate-500 max-w-xs truncate" title={log.status_message}>
                                            {log.status_message || 'No message'}
                                        </p>
                                    </td>
                                    <td className="p-6 pr-8 text-right">
                                        <p className="text-xs font-black text-slate-700">
                                            {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Auditing KYC Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="p-24 text-center">
                                        <p className="text-slate-300 font-black text-lg">No verification hits found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
