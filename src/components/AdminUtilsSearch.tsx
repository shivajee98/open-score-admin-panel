'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Search, 
    X, 
    User, 
    ShieldCheck, 
    Briefcase,
    Loader2,
    Key,
    Copy,
    Check,
    Smartphone
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UserResult {
    id: number;
    name: string;
    mobile_number: string;
    role: string;
    type: 'user' | 'merchant' | 'vendor';
}

export default function AdminUtilsSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [decryptedPin, setDecryptedPin] = useState<string | null>(null);
    const [isFetchingPin, setIsFetchingPin] = useState(false);
    const [copied, setCopied] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const searchUsers = useCallback(async (q: string) => {
        if (q.length < 2) return [];
        setIsLoading(true);
        try {
            const [usersData, subUsersData] = await Promise.all([
                apiFetch(`/admin/users?search=${encodeURIComponent(q)}&per_page=10`),
                apiFetch(`/admin/sub-users?search=${encodeURIComponent(q)}&per_page=10`)
            ]);

            const userResults = (usersData.data || []).map((u: any) => ({
                id: u.id,
                name: u.name || 'Unknown',
                mobile_number: u.mobile_number,
                role: u.role,
                type: u.role === 'MERCHANT' ? 'merchant' : 'user'
            }));

            const subUserResults = (subUsersData.data || []).map((s: any) => ({
                id: s.id,
                name: s.name || 'Unknown',
                mobile_number: s.mobile_number,
                role: 'VENDOR',
                type: 'vendor'
            }));

            return [...userResults, ...subUserResults];
        } catch (e) {
            console.error('Admin utils search error:', e);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                const apiResults = await searchUsers(query.trim());
                setResults(apiResults as any);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchUsers]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleFetchPin = async (user: UserResult) => {
        setIsFetchingPin(true);
        setDecryptedPin(null);
        try {
            // For vendors, we might need a different endpoint or handle them as users if they are in the users table
            // Based on AdminController, getUserAppPin uses the users table.
            const data = await apiFetch(`/admin/users/${user.id}/app-pin`);
            if (data.pin) {
                setDecryptedPin(data.pin);
                toast.success('PIN decrypted successfully');
            } else {
                toast.error('No PIN found or could not be decrypted');
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to fetch PIN');
        } finally {
            setIsFetchingPin(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const reset = () => {
        setQuery('');
        setResults([]);
        setSelectedUser(null);
        setDecryptedPin(null);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) reset();
        }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] animate-in fade-in duration-300" />
                <Dialog.Content className="fixed inset-0 z-[111] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                    <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden outline-none animate-in zoom-in-95 slide-in-from-top-10 duration-300 pointer-events-auto">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Key size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Admin PIN Decryptor</h2>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Search users and reveal access pins</p>
                                </div>
                            </div>
                            <div className="relative mt-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search by name or mobile number..."
                                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900 transition-all shadow-sm"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setSelectedUser(null);
                                        setDecryptedPin(null);
                                    }}
                                    autoFocus
                                />
                                {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />}
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
                            {selectedUser ? (
                                <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                                {selectedUser.type === 'vendor' ? <ShieldCheck /> : selectedUser.type === 'merchant' ? <Briefcase /> : <User />}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900">{selectedUser.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-bold text-slate-500">{selectedUser.mobile_number}</span>
                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md tracking-tighter">
                                                        {selectedUser.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedUser(null)}
                                            className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-4">
                                        {decryptedPin ? (
                                            <div className="w-full space-y-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Decrypted Auth Pin</p>
                                                    <div className="flex items-center justify-center gap-3">
                                                        {decryptedPin.split('').map((char, i) => (
                                                            <div key={i} className="w-12 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-200 animate-in zoom-in-50 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                                                {char}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard(decryptedPin)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all group"
                                                >
                                                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="group-hover:scale-110 transition-transform" />}
                                                    {copied ? 'Copied!' : 'Copy PIN'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleFetchPin(selectedUser)}
                                                disabled={isFetchingPin}
                                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                {isFetchingPin ? (
                                                    <Loader2 className="animate-spin" size={20} />
                                                ) : (
                                                    <>
                                                        <Key size={20} />
                                                        Show Access PIN
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {results.length > 0 ? (
                                        results.map((user) => (
                                            <button
                                                key={`${user.type}-${user.id}`}
                                                onClick={() => setSelectedUser(user)}
                                                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        {user.type === 'vendor' ? <ShieldCheck size={18} /> : user.type === 'merchant' ? <Briefcase size={18} /> : <User size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{user.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone size={10} className="text-slate-300" />
                                                            <p className="text-[10px] font-bold text-slate-400 tracking-wider">{user.mobile_number}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-400 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all tracking-tighter">
                                                    {user.role}
                                                </span>
                                            </button>
                                        ))
                                    ) : query.trim() ? (
                                        <div className="py-12 text-center">
                                            <p className="text-slate-400 font-bold">No results found for "{query}"</p>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400">
                                            <div className="flex justify-center mb-4">
                                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                                                    <Search size={20} className="opacity-20" />
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Type to search across roles</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm"><span className="text-indigo-600">CTRL</span> + <span className="text-indigo-600">SHIFT</span> + <span className="text-indigo-600">S</span> to Search</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                                Super Admin Tool • Restricted Access
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

