'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, 
    X, 
    Command, 
    User, 
    Users, 
    LayoutDashboard, 
    ArrowRight,
    Loader2,
    MousePointer2,
    ShieldCheck,
    Briefcase
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResult {
    id: string | number;
    title: string;
    description?: string;
    type: 'nav' | 'user' | 'merchant' | 'sub-user';
    url: string;
    icon?: React.ReactNode;
}

interface GlobalSearchProps {
    navItems: any[];
}

export default function GlobalSearch({ navItems }: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);

    // Filter Navigation Items
    const filteredNavItems = navItems
        .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
        .map(item => ({
            id: item.href,
            title: item.label,
            description: item.group || 'Menu Item',
            type: 'nav' as const,
            url: item.href,
            icon: item.icon
        }));

    const searchUsers = useCallback(async (q: string) => {
        if (q.length < 2) return [];
        setIsLoading(true);
        try {
            // Simultaneous search in users, merchants, and sub-users
            const [usersData, merchantsData, subUsersData] = await Promise.all([
                apiFetch(`/admin/users?type=customer,agent&search=${encodeURIComponent(q)}&per_page=5`),
                apiFetch(`/admin/users?type=merchant&search=${encodeURIComponent(q)}&per_page=5`),
                apiFetch(`/admin/sub-users?search=${encodeURIComponent(q)}&per_page=5`)
            ]);

            const userResults = (usersData.data || []).map((u: any) => ({
                id: `user-${u.id}`,
                title: u.name || u.mobile_number,
                description: `User • ${u.mobile_number}`,
                type: 'user' as const,
                url: `/users/detail?id=${u.id}`,
                icon: <User className="w-4 h-4" />
            }));

            const merchantResults = (merchantsData.data || []).map((m: any) => ({
                id: `merchant-${m.id}`,
                title: m.name || m.mobile_number,
                description: `Merchant • ${m.mobile_number}`,
                type: 'merchant' as const,
                url: `/users/detail?id=${m.id}`,
                icon: <Briefcase className="w-4 h-4 text-amber-500" />
            }));

            const subUserResults = (subUsersData.data || []).map((s: any) => ({
                id: `sub-user-${s.id}`,
                title: s.name || s.mobile_number,
                description: `Vendor • ${s.mobile_number}`,
                type: 'sub-user' as const,
                url: `/sub-users/detail?id=${s.id}`,
                icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />
            }));

            return [...userResults, ...merchantResults, ...subUserResults];
        } catch (e) {
            console.error('Global search error:', e);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                const apiResults = await searchUsers(query.trim());
                setResults([...filteredNavItems.slice(0, 10), ...apiResults]);
            } else {
                setResults(filteredNavItems);
            }
            setSelectedIndex(0);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchUsers, navItems]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSelect = (result: SearchResult) => {
        router.push(result.url);
        setIsOpen(false);
        setQuery('');
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] animate-in fade-in duration-300" />
                <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white/95 rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden outline-none animate-in zoom-in-95 duration-300 relative">
                        <div className="flex items-center px-6 py-6 border-b border-slate-100">
                            <Search className="w-6 h-6 text-slate-400 mr-4" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search screens, users, vendors, merchants..."
                                className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-900 placeholder:text-slate-400"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">ESC to Close</span>
                                {isLoading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                            </div>
                        </div>

                        <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {query.trim() ? (
                                results.length > 0 ? (
                                    <div className="space-y-1">
                                        {results.map((result, index) => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group text-left outline-none",
                                                    selectedIndex === index 
                                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30 scale-[1.01]" 
                                                        : "bg-transparent text-slate-600 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                        selectedIndex === index ? "bg-white/20" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                                                    )}>
                                                        {result.icon}
                                                    </div>
                                                    <div>
                                                        <p className={cn(
                                                            "font-black text-sm",
                                                            selectedIndex === index ? "text-white" : "text-slate-900"
                                                        )}>{result.title}</p>
                                                        <p className={cn(
                                                            "text-[10px] uppercase font-bold tracking-widest",
                                                            selectedIndex === index ? "text-blue-100" : "text-slate-400"
                                                        )}>{result.description}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded",
                                                        selectedIndex === index ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {result.type}
                                                    </span>
                                                    <ArrowRight className={cn(
                                                        "w-4 h-4 transition-transform",
                                                        selectedIndex === index ? "translate-x-1 opacity-100" : "opacity-0 -translate-x-2"
                                                    )} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-bold">No results found for "{query}"</p>
                                        <p className="text-slate-400 text-xs mt-1">Try searching for something else</p>
                                    </div>
                                )
                            ) : (
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Navigation Menus</p>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">{navItems.length} Options</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {results.map((item, index) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelect(item)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all group text-left outline-none",
                                                    selectedIndex === index 
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]" 
                                                        : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2 rounded-xl transition-colors shadow-sm [&_svg]:w-4 [&_svg]:h-4",
                                                    selectedIndex === index ? "bg-white/20 text-white" : "bg-white text-slate-400 group-hover:text-blue-600"
                                                )}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className={cn(
                                                        "font-bold text-xs truncate",
                                                        selectedIndex === index ? "text-white" : "text-slate-700 group-hover:text-blue-700"
                                                    )}>{item.title}</span>
                                                    {item.description && (
                                                        <span className={cn(
                                                            "text-[8px] uppercase tracking-tighter font-bold truncate",
                                                            selectedIndex === index ? "text-blue-100" : "text-slate-400"
                                                        )}>{item.description}</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5"><MousePointer2 size={10} /> Click to Navigate</span>
                                <span className="flex items-center gap-1.5"><Command size={10} /> Arrow Keys to Select</span>
                                <span className="flex items-center gap-1.5"><Command size={10} /> Enter to Jump</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Command size={10} /> + I to Open
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
