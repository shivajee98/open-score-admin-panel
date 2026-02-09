'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

export default function DashboardLayout({
    children,
    title,
    navItems
}: {
    children: React.ReactNode;
    title: string;
    navItems: NavItem[];
}) {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Hydrate latest data from server if token exists
        if (token) {
            apiFetch('/auth/me')
                .then(data => {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                })
                .catch(err => {
                    console.error("Hydration failed", err);
                    if (!storedUser) router.push('/login/');
                });
        } else {
            router.push('/login/');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login/');
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="w-64 border-r border-slate-800/50 bg-[#0f172a]/30 backdrop-blur-xl hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">CreditLoop</h1>
                </div>
                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-all text-slate-400 hover:text-white group"
                        >
                            <span className="group-hover:text-sky-400 transition-colors">{item.icon}</span>
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all text-slate-400 hover:text-red-400 group mt-4 text-left"
                    >
                        <span>🚪</span>
                        <span className="font-bold text-sm tracking-tight">Logout</span>
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800/50">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/20 border border-slate-700/30">
                        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-black text-xs">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black truncate">{user?.name || 'System User'}</p>
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase truncate">{user?.role || 'Guest'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative pb-[4.5rem] md:pb-0">
                <header className="px-6 py-6 md:py-8 flex justify-between items-center border-b border-slate-800/50 md:border-none bg-[#020617]/50 backdrop-blur-md md:bg-transparent sticky top-0 z-40">
                    <h2 className="text-xl md:text-3xl font-black tracking-tighter">{title}</h2>
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-black text-xs">
                            {user?.name?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
                    {user ? children : <div className="p-8 text-center text-slate-500 uppercase tracking-widest font-black text-xs animate-pulse">Authenticating Session...</div>}
                </div>

                {/* Mobile Bottom Navigation (Visible only on Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/90 backdrop-blur-2xl border-t border-slate-800/50 md:hidden z-50 px-2 pb-6 pt-3 flex justify-around items-center">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 px-3 min-w-[50px]"
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label.split(' ')[0]}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-1 px-3 min-w-[50px]"
                    >
                        <span className="text-xl">🚪</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-500/70">Exit</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
