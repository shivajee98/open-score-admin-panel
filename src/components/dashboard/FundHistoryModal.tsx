'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from '@/lib/api';
import { Clock, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FundHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FundHistoryModal({ isOpen, onClose }: FundHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const fetchHistory = async (pageNumber: number = 1) => {
        setLoading(true);
        try {
            const data = await apiFetch(`/admin/funds/history?page=${pageNumber}`);
            if (pageNumber === 1) {
                setHistory(data.data);
            } else {
                setHistory(prev => [...prev, ...data.data]);
            }
            setHasMore(data.next_page_url !== null);
            setPage(pageNumber);
        } catch (error) {
            console.error("Failed to fetch fund history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory(1);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-500" />
                        Capital Pool History
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading && history.length === 0 ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 animate-pulse bg-slate-50 rounded-2xl" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No history records found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            item.type === 'ADD' ? 'bg-emerald-100 text-emerald-600' :
                                                item.type === 'RESET' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                        )}>
                                            {item.type === 'ADD' ? <ArrowUpRight size={20} /> :
                                                item.type === 'RESET' ? <RefreshCcw size={20} /> : <ArrowDownRight size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-900">₹{parseFloat(item.amount).toLocaleString()}</p>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                                                    item.type === 'ADD' ? 'bg-emerald-50 text-emerald-600' :
                                                        item.type === 'RESET' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                )}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                By {item.admin?.name || 'System'} • {new Date(item.created_at).toLocaleString()}
                                            </p>
                                            {item.description && (
                                                <p className="text-xs text-slate-500 font-medium mt-1">"{item.description}"</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Balance</p>
                                        <p className="font-bold text-slate-700">₹{parseFloat(item.new_balance).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}

                            {hasMore && (
                                <button
                                    onClick={() => fetchHistory(page + 1)}
                                    disabled={loading}
                                    className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                >
                                    {loading ? 'Loading...' : 'Load More History'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
