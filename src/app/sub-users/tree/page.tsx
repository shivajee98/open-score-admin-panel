'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import {
    TreePine, ChevronDown, ChevronRight, UsersRound, User, ArrowLeft,
    Settings, Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VendorTreePage() {
    const router = useRouter();
    const [treeData, setTreeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ max_vendor_depth: 3, min_child_commission: 10 });
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

    // Count total nodes recursively
    const countNodes = (nodes: any[]): { vendors: number, users: number } => {
        let vendors = 0, users = 0;
        for (const node of nodes) {
            vendors++;
            users += node.total_linked_users || 0;
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/sub-users')}
                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <TreePine className="text-indigo-600" size={24} />
                                Vendor Hierarchy Tree
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">
                                {stats.vendors} total vendors · {stats.users} linked workers
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <Settings size={16} /> Hierarchy Settings
                    </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Hierarchy Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Vendor Depth</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm font-medium"
                                    value={settings.max_vendor_depth}
                                    onChange={e => setSettings({ ...settings, max_vendor_depth: parseInt(e.target.value) || 3 })}
                                    min={1}
                                    max={10}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Maximum levels of vendor nesting (1-10)</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min Child Commission (₹)</label>
                                <input
                                    type="number"
                                    className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm font-medium"
                                    value={settings.min_child_commission}
                                    onChange={e => setSettings({ ...settings, min_child_commission: parseFloat(e.target.value) || 10 })}
                                    min={1}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Minimum commission amount for any vendor (floor)</p>
                            </div>
                        </div>
                        <button
                            onClick={saveSettings}
                            disabled={savingSettings}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                )}

                {/* Tree */}
                {loading ? (
                    <div className="text-center py-20 text-slate-400">Loading vendor tree...</div>
                ) : treeData.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <TreePine className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium text-lg">No vendors found</p>
                        <p className="text-slate-400 text-sm mt-1">Create vendors from the Sub-Users page</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="space-y-1">
                            {treeData.map((node: any) => (
                                <AdminTreeNode key={node.id} node={node} depth={0} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function AdminTreeNode({ node, depth }: { node: any, depth: number }) {
    const [expanded, setExpanded] = useState(depth < 2);
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
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${hasChildren ? 'hover:bg-slate-50' : ''}`}
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
                        <AdminTreeNode key={`v-${child.id}`} node={child} depth={depth + 1} />
                    ))}
                    {node.linked_users?.map((user: any) => (
                        <AdminTreeNode key={`u-${user.id}`} node={user} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
