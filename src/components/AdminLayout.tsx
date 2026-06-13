'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, User, FileText, Settings, LogOut, Verified, ShieldCheck, TrendingUp, Ticket, QrCode, DollarSign, Banknote, Wallet, Gift, AlertTriangle, Archive, ChevronDown, Percent, Shield, ListFilter, Search, Key, Megaphone, Smartphone, MapPin, CreditCard, MessageSquare, Phone, PhoneCall, Fingerprint, KeyRound, Building, Mail } from 'lucide-react';

import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { Toaster, toast } from 'sonner';
import GlobalSearch from './GlobalSearch';
import AdminUtilsSearch from './AdminUtilsSearch';

export default function AdminLayout({ children, title }: { children: React.ReactNode, title: string }) {
    const { user, status, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const { counts, monitoring, refreshMonitoring } = useAdminNotifications();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [expandedSubGroups, setExpandedSubGroups] = useState<Record<string, boolean>>({});

    // Let's use Ref for silence
    const txRef = useRef<string | null>(null);
    const lastApprovedLoanIdRef = useRef<number | null>(null);
    const lastPendingPaymentIdRef = useRef<number | null>(null);

    // Real-time notifications for approved loans and payment screenshots
    useEffect(() => {
        if (counts) {
            if (counts.latest_approved_loan) {
                const loan = counts.latest_approved_loan;
                if (lastApprovedLoanIdRef.current !== null && lastApprovedLoanIdRef.current !== loan.id) {
                    playNotificationSound(`New Loan Approved for ${loan.user_name} of Rupees ${loan.amount}`);
                    toast.success(
                        <div className="flex flex-col gap-1 pr-2">
                            <span className="font-semibold text-slate-900 text-sm">🎉 Loan Approved!</span>
                            <span className="text-xs text-slate-600">
                                <strong>{loan.user_name}</strong>'s loan of <strong>₹{loan.amount.toLocaleString('en-IN')}</strong> (ID: {loan.display_id}) has been approved.
                            </span>
                        </div>,
                        { duration: 8000 }
                    );
                }
                lastApprovedLoanIdRef.current = loan.id;
            }

            if (counts.latest_pending_payment) {
                const payment = counts.latest_pending_payment;
                if (lastPendingPaymentIdRef.current !== null && lastPendingPaymentIdRef.current !== payment.id) {
                    playNotificationSound(`New payment screenshot uploaded by ${payment.user_name} for Rupees ${payment.amount}`);
                    toast.info(
                        <div className="flex flex-col gap-1 pr-2">
                            <span className="font-semibold text-indigo-900 text-sm">📸 Payment Screenshot Uploaded!</span>
                            <span className="text-xs text-slate-600 mb-1">
                                <strong>{payment.user_name}</strong> uploaded proof of <strong>₹{payment.amount.toLocaleString('en-IN')}</strong> for Loan {payment.loan_display_id}.
                            </span>
                            {payment.proof_image && (
                                <a 
                                    href={`https://api.msmeloan.sbs/storage/${payment.proof_image}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center text-xs text-indigo-600 hover:underline font-semibold"
                                >
                                    View Screenshot ↗
                                </a>
                            )}
                        </div>,
                        { duration: 10000 }
                    );
                }
                lastPendingPaymentIdRef.current = payment.id;
            }
        }
    }, [counts]);

    // Auth check is now handled by Middleware and apiFetch
    useEffect(() => {
        checkNewTransactions();
    }, [router, pathname]);

    const checkNewTransactions = async () => {
        try {
            const res = await apiFetch('/wallet/transactions?limit=1');
            if (res && res.data && res.data.length > 0) {
                const latestTx = res.data[0];
                if (txRef.current && txRef.current !== latestTx.id) {
                    if (latestTx.type === 'CREDIT' && latestTx.amount > 0) {
                        playNotificationSound(`Rupees ${latestTx.amount} credited.`);
                    }
                }
                txRef.current = latestTx.id;
            }
        } catch (e) {
            // silent
        }
    };

    const playNotificationSound = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const allNavItems = [
        { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['ADMIN'] },

        // Loan Management
        { label: 'My Loan User', href: '/loans', icon: <Verified className="w-5 h-5" />, roles: ['ADMIN'], group: 'Loan Management' },
        { label: 'Construction Loans', href: '/construction-loans', icon: <Building className="w-5 h-5" />, roles: ['ADMIN'], group: 'Loan Management' },
        { label: 'Loan Plans', href: '/loan-plans', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN'], group: 'Loan Management' },
        { label: 'Withdrawal Process', href: '/withdrawal-rules', icon: <ShieldCheck className="w-5 h-5" />, roles: ['ADMIN'], group: 'Loan Management' },

        // User & Team
        { label: 'Users & Funds', href: '/users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },
        { label: 'Internal Team & Funds', href: '/internal-users', icon: <ShieldCheck className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },
        { label: 'Merchants', href: '/merchants', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },
        { label: 'Active Users Tracker', href: '/active-users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },
        { label: 'Support Agents', href: '/support/agents', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },
        { label: 'Field KYC Agent', href: '/team/kyc-agents', icon: <Shield className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },
        { label: 'Field KYC Leads', href: '/team/kyc-leads', icon: <ListFilter className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team' },

        // Nested Vendors inside User & Team
        { label: 'Vendor List', href: '/sub-users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team', subGroup: 'Vendors' },
        { label: 'Agents', href: '/agents', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team', subGroup: 'Vendors' },
        { label: 'Agent Setting', href: '/vendor-settings', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team', subGroup: 'Vendors' },
        { label: 'Unlinked History', href: '/agents/history', icon: <Archive className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team', subGroup: 'Vendors' },
        { label: 'Independent Agents', href: '/independent-agents', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'User & Team', subGroup: 'Vendors' },

        // Promotions & Tools
        { label: 'QR Generator', href: '/qr-generator', icon: <QrCode className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Global Zones', href: '/pincodes', icon: <MapPin className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Coupons', href: '/coupon-generator', icon: <Gift className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Loan Coupon Codes', href: '/loan-coupon-codes', icon: <Percent className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Referral Settings', href: '/referral-settings', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Configure Cards', href: '/vault-cards', icon: <CreditCard className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Vault Users', href: '/vault-cards/activated-users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN'], group: 'Promotions & Tools' },

        // Rewards & Incentives
        { label: 'Merchant Tiers', href: '/merchant-cashback-tiers', icon: <Gift className="w-5 h-5" />, roles: ['ADMIN'], group: 'Rewards & Incentives' },
        { label: 'Onboarding Bonuses', href: '/onboarding-rewards', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN'], group: 'Rewards & Incentives' },
        { label: 'Activation Rules', href: '/merchant-activation-settings', icon: <Settings className="w-5 h-5" />, roles: ['ADMIN'], group: 'Rewards & Incentives' },
        { label: 'Rewards History', href: '/cashback-logs', icon: <Gift className="w-5 h-5" />, roles: ['ADMIN'], group: 'Rewards & Incentives' },

        // Financial Operations
        { label: 'Payout Requests', href: '/payouts', icon: <FileText className="w-5 h-5" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Agent Cashouts', href: '/agent-payouts', icon: <Banknote className="w-5 h-5" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Team Transfers', href: '/team-transfers', icon: <Banknote className="w-5 h-5" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Agent & Vendor History', href: '/agent-history', icon: <Archive className="w-5 h-5" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Late Withdrawals', href: '/late-withdrawals', icon: <AlertTriangle className="w-5 h-5 text-rose-400" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Recovery Funds', href: '/held-recovery', icon: <Wallet className="w-5 h-5 text-indigo-400" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Global Transactions', href: '/transactions', icon: <TrendingUp className="w-5 h-5" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Cashback Usage', href: '/cashback-usage', icon: <Percent className="w-5 h-5 text-blue-400" />, roles: ['ADMIN'], group: 'Financial Operations' },
        { label: 'Cashback Thresholds', href: '/cashback-transfer', icon: <Wallet className="w-5 h-5 text-amber-400" />, roles: ['ADMIN'], group: 'Financial Operations' },

        // System & Support
        { label: 'Support Inbox', href: '/support/tickets', icon: <Ticket className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Call Agents', href: '/call-agents', icon: <Phone className="w-5 h-5 text-emerald-400" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Call Logs', href: '/call-logs', icon: <PhoneCall className="w-5 h-5 text-emerald-400" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Expense Limits', href: '/barring-settings', icon: <Archive className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Maintenance Mode', href: '/maintenance-settings', icon: <AlertTriangle className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Monitoring Alerts', href: '/monitoring', icon: <AlertTriangle className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Audit Logs', href: '/logs', icon: <ShieldCheck className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Email Search Logs', href: '/email-logs', icon: <Mail className="w-5 h-5 text-teal-400" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'KYC API Logs', href: '/kyc-logs', icon: <Fingerprint className="w-5 h-5 text-blue-400" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'PIN & OTP Control', href: '/pin-control', icon: <KeyRound className="w-5 h-5 text-amber-500" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Broadcasts', href: '/broadcast-notifications', icon: <Megaphone className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'Direct Messaging', href: '/direct-messaging', icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'User Preview', href: '/user-preview', icon: <Smartphone className="w-5 h-5 text-indigo-400" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Vendor Preview', href: '/vendor-preview', icon: <Search className="w-5 h-5 text-emerald-400" />, roles: ['ADMIN'], group: 'Promotions & Tools' },
        { label: 'Dynamic Buttons', href: '/dynamic-buttons', icon: <Ticket className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
        { label: 'My Profile', href: '/profile', icon: <User className="w-5 h-5" />, roles: ['ADMIN'], group: 'System & Support' },
    ];

    const navItems = allNavItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));

    // Auto-expand the group that contains the active item
    useEffect(() => {
        const currentItem = navItems.find((item: any) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)));
        if (currentItem?.group) {
            setExpandedGroups(prev => ({ ...prev, [currentItem.group!]: true }));
        }
        if (currentItem?.subGroup) {
            setExpandedSubGroups(prev => ({ ...prev, [currentItem.subGroup!]: true }));
        }
    }, [pathname, user]); // Re-run when pathname or user changes

    const [hasModal, setHasModal] = useState(false);
    const [isAckingAlert, setIsAckingAlert] = useState(false);

    // Monitor for open modals to hide the sticky header
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const modal = document.querySelector('.fixed.inset-0.z-50') || document.querySelector('[role="dialog"]');
            setHasModal(!!modal);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleMonitoringAlertAction = async () => {
        if (!monitoring?.latestAlert) {
            router.push('/monitoring');
            return;
        }

        if (isAckingAlert) return;
        setIsAckingAlert(true);

        try {
            await apiFetch(`/admin/monitoring-alerts/${monitoring.latestAlert.id}/acknowledge`, { method: 'POST' });
            refreshMonitoring();
        } catch (e) {
            console.error('Failed to acknowledge alert', e);
        } finally {
            setIsAckingAlert(false);
            router.push('/monitoring');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl shadow-slate-900/20`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/30">
                                <img src="/icon.png" alt="OpenScore" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">{user?.role === 'SUB_USER' ? 'Agent Panel' : 'OpenScore'}</h1>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{user?.role === 'SUB_USER' ? 'Credit Agent' : 'Admin Portal'}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{user?.role === 'SUB_USER' ? 'Agent Menu' : 'Main Menu'}</p>
                        <div className="space-y-1">
                            {(() => {
                                const rendered: React.ReactNode[] = [];
                                const groups: Record<string, typeof navItems> = {};
                                const ungrouped: typeof navItems = [];

                                navItems.forEach(item => {
                                    if (item.group) {
                                        if (!groups[item.group]) groups[item.group] = [];
                                        groups[item.group].push(item);
                                    } else {
                                        ungrouped.push(item);
                                    }
                                });

                                // Render Ungrouped items first (Dashboard)
                                ungrouped.forEach(item => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                                    rendered.push(
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 group ${isActive ? (user?.role === 'SUB_USER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/50') : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                        >
                                            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} relative`}>
                                                {item.icon}
                                                {item.href === '/monitoring' && monitoring?.unread > 0 && (
                                                    <span className="absolute -top-1 -right-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                                        {monitoring.unread}
                                                    </span>
                                                )}
                                                {((item.href === '/loans' && counts.loans > 0) || (item.href === '/sub-users' && counts.kyc > 0)) && (
                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)] border border-slate-900"></span>
                                                )}
                                            </div>
                                            {item.label}
                                        </Link>
                                    );
                                });

                                // Render Groups
                                Object.entries(groups).forEach(([groupName, items]) => {
                                    const isExpanded = !!expandedGroups[groupName];
                                    const hasActiveItem = items.some(item => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)));

                                    rendered.push(
                                        <div key={groupName} className="space-y-1">
                                            <button
                                                onClick={() => toggleGroup(groupName)}
                                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition-all duration-200 ${hasActiveItem ? 'text-blue-400' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] uppercase tracking-[0.2em]">{groupName}</span>
                                                </div>
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isExpanded && (
                                                <div className="space-y-1 pl-4 border-l-2 border-slate-800 ml-4 animate-in slide-in-from-top-2 duration-200">
                                                    {(() => {
                                                        const groupElements: React.ReactNode[] = [];
                                                        const processedSubGroups = new Set();

                                                        items.forEach(item => {
                                                            if (!item.subGroup) {
                                                                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                                                                groupElements.push(
                                                                    <Link
                                                                        key={item.href}
                                                                        href={item.href}
                                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all duration-200 group text-sm ${isActive ? (user?.role === 'SUB_USER' ? 'bg-indigo-600/20 text-indigo-400' : 'bg-blue-600/20 text-blue-400') : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                                                    >
                                                                        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} relative`}>
                                                                            {item.icon}
                                                                            {item.href === '/monitoring' && monitoring?.unread > 0 && (
                                                                                <span className="absolute -top-1 -right-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                                                                    {monitoring.unread}
                                                                                </span>
                                                                            )}
                                                                            {((item.href === '/loans' && counts.loans > 0) || (item.href === '/sub-users' && counts.kyc > 0)) && (
                                                                                <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)] border border-slate-900"></span>
                                                                            )}
                                                                        </div>
                                                                        {item.label}
                                                                    </Link>
                                                                );
                                                            } else if (!processedSubGroups.has(item.subGroup)) {
                                                                const subGroupName = item.subGroup;
                                                                processedSubGroups.add(subGroupName);
                                                                const subItems = items.filter(i => i.subGroup === subGroupName);
                                                                const isSubExpanded = !!expandedSubGroups[subGroupName];
                                                                const hasActiveSubItem = subItems.some(si => pathname === si.href || (si.href !== '/' && pathname?.startsWith(si.href)));

                                                                groupElements.push(
                                                                    <div key={subGroupName} className="space-y-1">
                                                                        <button
                                                                            onClick={() => setExpandedSubGroups(prev => ({ ...prev, [subGroupName]: !prev[subGroupName] }))}
                                                                            className={`flex items-center justify-between w-full px-4 py-2 rounded-xl font-bold transition-all duration-200 text-xs ${hasActiveSubItem ? 'text-blue-300' : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}`}
                                                                        >
                                                                            <span className="uppercase tracking-widest">{subGroupName}</span>
                                                                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isSubExpanded ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {isSubExpanded && (
                                                                            <div className="space-y-1 pl-4 border-l border-slate-700/50 ml-2 animate-in slide-in-from-top-1 duration-200">
                                                                                {subItems.map(si => {
                                                                                    const isActive = pathname === si.href || (si.href !== '/' && pathname?.startsWith(si.href));
                                                                                    return (
                                                                                        <Link
                                                                                            key={si.href}
                                                                                            href={si.href}
                                                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                                                            className={`flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all duration-200 group text-xs ${isActive ? 'bg-blue-600/10 text-blue-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                                                                        >
                                                                                            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} relative`}>
                                                                                                {si.icon}
                                                                                                {si.href === '/sub-users' && counts.kyc > 0 && (
                                                                                                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,1)] border border-slate-900"></span>
                                                                                                )}
                                                                                            </div>
                                                                                            {si.label}
                                                                                        </Link>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        });
                                                        return groupElements;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });

                                return rendered;
                            })()}
                        </div>
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
            <main className={`lg:ml-72 min-h-screen relative animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <header className={`sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${hasModal ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const event = new KeyboardEvent('keydown', {
                                    key: 'i',
                                    ctrlKey: true,
                                    bubbles: true,
                                    cancelable: true
                                });
                                window.dispatchEvent(event);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full border border-slate-200 transition-all group"
                            title="Press Ctrl + I to search"
                        >
                            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Search</span>
                            <span className="px-1.5 py-0.5 bg-white rounded text-[8px] font-black border border-slate-200 hidden lg:inline">CTRL+I</span>
                        </button>
                        <button
                            onClick={() => {
                                const event = new KeyboardEvent('keydown', {
                                    key: 's',
                                    ctrlKey: true,
                                    shiftKey: true,
                                    bubbles: true,
                                    cancelable: true
                                });
                                window.dispatchEvent(event);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full border border-indigo-200 transition-all group"
                            title="Press Ctrl + Shift + S for Utils"
                        >
                            <Key className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Utils</span>
                            <span className="px-1.5 py-0.5 bg-white rounded text-[8px] font-black border border-indigo-200 hidden lg:inline">CTRL+⇧+S</span>
                        </button>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
                            <Verified className="w-4 h-4 text-blue-600 fill-blue-100" />
                            <span className="text-sm font-bold text-slate-700">
                                {user?.role === 'SUB_USER' ? 'Credit Agent' : 'Administrator'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8 w-full">
                    {children}
                </div>
            </main>
            {monitoring?.unread > 0 && monitoring?.latestAlert && (
                <div className="fixed right-6 bottom-10 z-50 max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/30 p-5 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-500">High Value Alert</p>
                            <h3 className="text-lg font-black text-slate-900">
                                ₹{monitoring.latestAlert?.amount.toLocaleString('en-IN')}
                            </h3>
                            <p className="text-xs text-slate-400">
                                Threshold ₹{monitoring.latestAlert?.threshold.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-slate-500">
                                {monitoring.latestAlert?.payer?.name || monitoring.latestAlert?.payer?.mobile_number} → {monitoring.latestAlert?.payee?.role}
                            </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black">
                            {monitoring.unread}
                        </div>
                    </div>
                    <button
                        onClick={handleMonitoringAlertAction}
                        disabled={isAckingAlert}
                        className="mt-4 w-full text-sm font-bold uppercase tracking-[0.2em] bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl transition-colors disabled:opacity-60"
                    >
                        View flagged accounts
                    </button>
                </div>
            )}
            <Toaster />
            <GlobalSearch navItems={navItems} />
            <AdminUtilsSearch />
        </div>
    );
}
