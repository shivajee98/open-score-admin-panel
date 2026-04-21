'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { MapPin, Search, Loader2, Activity, Zap, LayoutGrid, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminPincodesPage() {
    const router = useRouter();
    const [stats, setStats] = useState<{ active: any[], upcoming: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'global'>('active');
    
    // Global Pincodes state
    const [globalPincodes, setGlobalPincodes] = useState<any[]>([]);
    const [globalPage, setGlobalPage] = useState(1);
    const [globalSearch, setGlobalSearch] = useState('');
    const [hasMoreGlobal, setHasMoreGlobal] = useState(false);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [totalGlobal, setTotalGlobal] = useState<number>(0);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/analytics/pincodes');
            setStats(res);
        } catch (e: any) {
            toast.error(e.message || 'Failed to fetch area analytics');
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalPincodes = async (page: number = 1, search: string = '') => {
        setLoadingGlobal(true);
        try {
            const res = await apiFetch(`/analytics/global-pincodes?page=${page}&search=${search}`);
            if (page === 1) {
                setGlobalPincodes(res.pincodes || []);
            } else {
                setGlobalPincodes(prev => [...prev, ...(res.pincodes || [])]);
            }
            setGlobalPage(res.current_page);
            setHasMoreGlobal(res.has_more);
            setTotalGlobal(res.total || 0);
        } catch (e: any) {
            toast.error(e.message || 'Failed to fetch global pincodes');
        } finally {
            setLoadingGlobal(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (activeTab === 'global') {
                fetchGlobalPincodes(1, globalSearch);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [globalSearch, activeTab]);

    useEffect(() => {
        fetchStats();
    }, []);

    const filteredAreas = activeTab === 'global' 
        ? globalPincodes 
        : (stats?.[activeTab as 'active' | 'upcoming'] || []).filter(area => 
            area.pincode.toString().includes(searchTerm)
        );

    return (
        <AdminLayout title="Global Pincode Analytics">
            <div className="max-w-[1200px] mx-auto space-y-6">
                
                {/* Visual Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Zone <span className="text-blue-600">Intelligence</span></h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Platform Geographic Penetration</p>
                    </div>

                    <div className="bg-white p-1 rounded-2xl flex border border-slate-100 shadow-sm self-start md:self-center">
                        {(['active', 'upcoming', 'global'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Zap size={20} className="fill-current" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Active Clusters</p>
                            <h3 className="text-2xl font-black text-slate-900 leading-none">{loading ? '...' : (stats?.active.length || 0)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Growth Zones</p>
                            <h3 className="text-2xl font-black text-slate-900 leading-none">{loading ? '...' : (stats?.upcoming.length || 0)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                            <LayoutGrid size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Global Reach</p>
                            <h3 className="text-2xl font-black text-slate-900 leading-none">
                                {activeTab === 'global' ? totalGlobal : (stats ? stats.active.length + stats.upcoming.length : '...')}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search operational pincodes..."
                        value={activeTab === 'global' ? globalSearch : searchTerm}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (activeTab === 'global') {
                                setGlobalSearch(val);
                            } else {
                                setSearchTerm(val);
                            }
                        }}
                        className={cn(
                            "w-full pl-14 pr-32 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-black text-slate-900 shadow-sm focus:ring-8 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-400"
                        )}
                    />
                    {activeTab === 'global' && totalGlobal > 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{totalGlobal} Zones</span>
                        </div>
                    )}
                </div>

                {/* Area List/Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {loading && activeTab !== 'global' ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Area Data...</p>
                        </div>
                    ) : (loadingGlobal && activeTab === 'global' && globalPincodes.length === 0) ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Mapping Global Zones...</p>
                        </div>
                    ) : filteredAreas.length === 0 ? (
                        <div className="col-span-full py-16 bg-white rounded-3xl border border-slate-100 border-dashed flex flex-col items-center justify-center text-center">
                            <MapPin className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No operational data found for this segment</p>
                        </div>
                    ) : (
                        <>
                            {filteredAreas.map((area) => (
                                <div
                                    key={area.pincode}
                                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                            <MapPin size={21} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-900 leading-none tracking-tight">{area.pincode}</h4>
                                            {activeTab !== 'global' && (
                                                <p className="text-[10px] font-black text-blue-600 uppercase mt-1.5 flex items-center gap-1.5">
                                                    <LayoutGrid size={10} />
                                                    {area.merchant_count || area.mapped_count || 0} Entities
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}

                            {activeTab === 'global' && hasMoreGlobal && (
                                <button
                                    onClick={() => fetchGlobalPincodes(globalPage + 1, globalSearch)}
                                    disabled={loadingGlobal}
                                    className="col-span-full py-5 bg-white border border-slate-100 rounded-3xl text-[11px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all disabled:opacity-50 mt-4 active:scale-[0.99] shadow-sm flex items-center justify-center gap-3"
                                >
                                    {loadingGlobal ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Scanning Network...</span>
                                        </>
                                    ) : (
                                        <span>Show more zones in map</span>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
