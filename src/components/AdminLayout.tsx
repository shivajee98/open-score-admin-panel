'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Verified, ShieldCheck } from 'lucide-react';

export default function AdminLayout({ children, title }: { children: React.ReactNode, title: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Basic client-side auth check
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            // router.push('/login'); 
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const navItems = [
        { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Loan Approvals', href: '/loans', icon: <Verified className="w-5 h-5" /> },
        { label: 'Merchants', href: '/merchants', icon: <Users className="w-5 h-5" /> },
        { label: 'Users & Funds', href: '/users', icon: <Users className="w-5 h-5" /> },
        { label: 'Payout Requests', href: '/payouts', icon: <FileText className="w-5 h-5" /> },
        { label: 'Audit Logs', href: '/logs', icon: <ShieldCheck className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl shadow-slate-900/20`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">OpenScore</h1>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Portal</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </div>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-xl font-bold text-slate-400 hover:bg-rose-900/20 hover:text-rose-400 transition-all duration-200 group"
                        >
                            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="lg:ml-72 min-h-screen">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
                            <Verified className="w-4 h-4 text-blue-600 fill-blue-100" />
                            <span className="text-sm font-bold text-slate-700">Administrator</span>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
