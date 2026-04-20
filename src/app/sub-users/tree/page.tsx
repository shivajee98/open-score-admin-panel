'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import {
    TreePine, ChevronDown, ChevronRight, UsersRound, User, ArrowLeft,
    Settings, Save, Search, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VendorTreePage() {
    const router = useRouter();
    const [treeData, setTreeData] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ max_vendor_depth: 3, min_child_commission: 0 });
    const [savingSettings, setSavingSettings] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        fetchTree();
        fetchSettings();
    }, []);

    const fetchTree = async () => {
        try {
            const data = await apiFetch('/admin/sub-users/vendor-tree');
            setTreeData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const data = await apiFetch('/admin/sub-users/hierarchy-settings');
            setSettings(data);
        } catch (e) {
            console.error(e);
        }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            await apiFetch('/admin/sub-users/hierarchy-settings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });
            toast.success('Hierarchy settings updated!');
        } catch (e: any) {
            toast.error(e.message || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    // Recursive filter function
    const getFilteredTree = (nodes: any[], query: string): any[] => {
        if (!query.trim()) return nodes;
        const lowQuery = query.toLowerCase();

        return nodes.map(node => {
            const nameMatch = node.name?.toLowerCase().includes(lowQuery);
            const mobileMatch = node.mobile_number?.toLowerCase().includes(lowQuery);
            const codeMatch = node.referral_code?.toLowerCase().includes(lowQuery);
            const nodeMatches = nameMatch || mobileMatch || codeMatch;

            const filteredChildren = getFilteredTree(node.children_vendors || [], query);
            const filteredUsers = (node.linked_users || []).filter((u: any) => 
                u.name?.toLowerCase().includes(lowQuery) || 
                u.mobile_number?.toLowerCase().includes(lowQuery)
            );

            if (nodeMatches || filteredChildren.length > 0 || filteredUsers.length > 0) {
                return {
                    ...node,
                    children_vendors: filteredChildren,
                    linked_users: filteredUsers,
                    isSearchMatch: nodeMatches,
                    forceExpand: filteredChildren.length > 0 || filteredUsers.length > 0
                };
            }
            return null;
        }).filter(Boolean);
    };

    const filteredData = getFilteredTree(treeData, search);

    // Count total nodes recursively
    const countNodes = (nodes: any[]): { vendors: number, users: number } => {
        let vendors = 0, users = 0;
        for (const node of nodes) {
            vendors++;
            users += (node.linked_users?.length || 0);
            if (node.children_vendors?.length) {
                const sub = countNodes(node.children_vendors);
                vendors += sub.vendors;
                users += sub.users;
            }
        }
        return { vendors, users };
    };

    const stats = countNodes(treeData);

    return (
        <AdminLayout title="Vendor Hierarchy Tree">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => router.push('/sub-users')}
                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <TreePine className="text-indigo-600" size={24} />
                                Vendor Hierarchy Tree
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">
                                {stats.vendors} total vendors · {stats.users} linked workers
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search tree..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button 
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap"
                        >
                            <Settings size={16} /> <span className="hidden sm:inline">Settings</span>
                        </button>
                    </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-in slide-in-from-top-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Global Hierarchy Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Vendor Depth</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:outline-none text-sm font-bold"
                                    value={settings.max_vendor_depth}
                                    onChange={e => setSettings({ ...settings, max_vendor_depth: parseInt(e.target.value) || 3 })}
                                    min={1}
                                    max={10}
                                />
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Maximum levels of vendor nesting (1-10)</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Child Commission (₹)</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:outline-none text-sm font-bold"
                                    value={settings.min_child_commission}
                                    onChange={(e) => setSettings({ ...settings, min_child_commission: parseFloat(e.target.value) || 0 })}
                                    min="0"
                                />
                                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">Minimum commission amount for any vendor (floor)</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={saveSettings}
                                disabled={savingSettings}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-100"
                            >
                                <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tree */}
                {loading ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-20 flex flex-col items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading hierarchy...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                            {search ? <Search size={32} /> : <TreePine size={32} />}
                        </div>
                        <p className="text-slate-900 font-black text-xl italic tracking-tight">
                            {search ? `No matches for "${search}"` : 'Your tree is empty'}
                        </p>
                        <p className="text-slate-400 text-sm mt-2 font-medium max-w-xs mx-auto">
                            {search 
                                ? "We couldn't find any vendors or workers matching your search query in this branch."
                                : "No vendors have been added to the hierarchy yet. Head over to Sub-Users to get started."
                            }
                        </p>
                        {search && (
                            <button 
                                onClick={() => setSearch('')}
                                className="mt-8 text-indigo-600 font-black text-sm uppercase tracking-widest hover:text-indigo-700 transition-colors"
                            >
                                Clear Results
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden min-h-[500px]">
                        <div className="space-y-1">
                            {filteredData.map((node: any) => (
                                <AdminTreeNode key={node.id} node={node} depth={0} isSearching={!!search} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function AdminTreeNode({ node, depth, isSearching }: { node: any, depth: number, isSearching?: boolean }) {
    const [expanded, setExpanded] = useState(depth < 2);

    // Auto-expand if search match is in branch
    useEffect(() => {
        if (isSearching && node.forceExpand) {
            setExpanded(true);
        }
    }, [isSearching, node.forceExpand]);

    const hasChildren = (node.children_vendors?.length > 0) || (node.linked_users?.length > 0);
    const isVendor = node.type === 'vendor';

    const colors = [
        'from-blue-500 to-indigo-600',
        'from-indigo-500 to-purple-600',
        'from-purple-500 to-pink-600',
        'from-pink-500 to-rose-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-red-500',
    ];
    const gradientClass = colors[depth % colors.length];

    return (
        <div>
            <div
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                    node.isSearchMatch ? 'bg-indigo-50 ring-1 ring-indigo-100 shadow-sm' : hasChildren ? 'hover:bg-slate-50' : ''
                }`}
                onClick={() => hasChildren && setExpanded(!expanded)}
                style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
                {hasChildren ? (
                    expanded ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />
                ) : (
                    <div className="w-4 shrink-0" />
                )}

                <div className={`w-9 h-9 bg-gradient-to-br ${isVendor ? gradientClass : 'from-slate-400 to-slate-500'} rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm`}>
                    {isVendor ? <UsersRound size={14} /> : <User size={14} />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                        {node.name}
                        <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-black ${
                            isVendor
                                ? node.depth === 0 ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {isVendor ? (node.depth === 0 ? 'Root' : `L${node.depth}`) : node.role || 'Worker'}
                        </span>
                        {isVendor && !node.is_active && (
                            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 uppercase font-black">Inactive</span>
                        )}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                        {node.mobile_number}
                        {isVendor && node.referral_code && <span className="ml-2 font-mono">{node.referral_code}</span>}
                    </p>
                </div>

                {isVendor && (
                    <div className="flex items-center gap-5 text-[11px] font-bold text-slate-400 shrink-0">
                        <div className="text-right">
                            <span className="text-slate-500">₹{parseFloat(node.credit_balance || 0).toLocaleString()}</span>
                            <p className="text-[9px] text-slate-400 uppercase">Balance</p>
                        </div>
                        <div className="text-right">
                            <span className="text-emerald-600">₹{node.admin_loan_commission}</span>
                            <p className="text-[9px] text-slate-400 uppercase">Loan</p>
                        </div>
                        <div className="text-right">
                            <span className="text-blue-600">₹{node.default_signup_amount}</span>
                            <p className="text-[9px] text-slate-400 uppercase">QR</p>
                        </div>
                        <div className="text-right">
                            <span className="text-indigo-600">{node.total_children}</span>
                            <p className="text-[9px] text-slate-400 uppercase">Vendors</p>
                        </div>
                        <div className="text-right">
                            <span className="text-purple-600">{node.total_linked_users}</span>
                            <p className="text-[9px] text-slate-400 uppercase">Workers</p>
                        </div>
                    </div>
                )}
            </div>

            {expanded && hasChildren && (
                <div className="border-l-2 border-slate-100" style={{ marginLeft: `${depth * 24 + 28}px` }}>
                    {node.children_vendors?.map((child: any) => (
                        <AdminTreeNode key={`v-${child.id}`} node={child} depth={depth + 1} isSearching={isSearching} />
                    ))}
                    {node.linked_users?.map((user: any) => (
                        <AdminTreeNode key={`u-${user.id}`} node={user} depth={depth + 1} isSearching={isSearching} />
                    ))}
                </div>
            )}
        </div>
    );
}
