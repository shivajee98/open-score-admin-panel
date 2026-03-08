'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Plus, Trash2, Edit2, AlertCircle, Search, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface BarringRule {
    id: number;
    target_type: string;
    target_user_id: number | null;
    user_category: string | null;
    business_nature: string | null;
    limit_type: string;
    limit_value: number;
    is_active: boolean;
    targetUser?: { id: number, name: string, mobile_number: string };
}

const BUSINESS_CATEGORIES = [
    { value: 'All Other / Generic', key: null },
    { value: 'Retail', key: 'Retail' },
    { value: 'Wholesale', key: 'Wholesale' },
    { value: 'Services', key: 'Services' },
    { value: 'Food & Beverage', key: 'Food & Beverage' },
    { value: 'Healthcare', key: 'Healthcare' },
    { value: 'Education', key: 'Education' },
    { value: 'Entertainment', key: 'Entertainment' },
    { value: 'IT & Software', key: 'IT & Software' },
];

export default function BarringSettings() {
    const [rules, setRules] = useState<BarringRule[]>([]);
    const [groupedTargets, setGroupedTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Wizard State
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Target Selection State
    const [targetType, setTargetType] = useState('ALL_USERS');
    const [userCategory, setUserCategory] = useState('CUSTOMER');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Rule Definition State
    const [ruleForms, setRuleForms] = useState<any>({});

    const categories = ['CUSTOMER', 'MERCHANT', 'STUDENT'];

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/barring-rules');
            setRules(data);
            
            // Group rules by target to display in list
            const grouped = data.reduce((acc: any, rule: BarringRule) => {
                const key = rule.target_type === 'ALL_USERS' 
                    ? `ALL_${rule.user_category}` 
                    : `USER_${rule.target_user_id}`;
                
                if (!acc[key]) {
                    acc[key] = {
                        target_type: rule.target_type,
                        user_category: rule.user_category,
                        target_user_id: rule.target_user_id,
                        targetUser: rule.targetUser,
                        rules: []
                    };
                }
                acc[key].rules.push(rule);
                return acc;
            }, {});
            
            setGroupedTargets(Object.values(grouped));
        } catch (error) {
            toast.error("Failed to load rules");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                searchUsers();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery]);

    const searchUsers = async () => {
        try {
            const results = await apiFetch(`/admin/users/search-for-barring?search=${searchQuery}`);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed");
        }
    };

    const handleOpenWizardForNew = () => {
        setTargetType('ALL_USERS');
        setUserCategory('CUSTOMER');
        setSelectedUser(null);
        initEmptyRules();
        setWizardStep(1);
        setSaveSuccess(false);
        setIsWizardOpen(true);
    };

    const handleOpenWizardForEdit = (targetData: any) => {
        setTargetType(targetData.target_type);
        if (targetData.target_type === 'ALL_USERS') {
            setUserCategory(targetData.user_category);
        } else {
            setSelectedUser(targetData.targetUser);
        }
        
        // Populate existing rules
        initEmptyRules();
        const newForms = { ...ruleForms };
        targetData.rules.forEach((r: BarringRule) => {
            const key = r.business_nature || 'null';
            newForms[key] = {
                enabled: true,
                limit_type: r.limit_type,
                limit_value: r.limit_value
            };
        });
        setRuleForms(newForms);
        
        setWizardStep(2);
        setSaveSuccess(false);
        setIsWizardOpen(true);
    };

    const initEmptyRules = () => {
        const initial: any = {};
        BUSINESS_CATEGORIES.forEach(cat => {
            initial[cat.key || 'null'] = {
                enabled: false,
                limit_type: 'FLAT_AMOUNT',
                limit_value: ''
            };
        });
        setRuleForms(initial);
    };

    const handleDeleteTarget = async (targetData: any) => {
        if (!confirm('Are you sure you want to delete all rules for this target?')) return;
        
        try {
            // Delete each rule associated with this target
            for (const rule of targetData.rules) {
                await apiFetch(`/admin/barring-rules/${rule.id}`, { method: 'DELETE' });
            }
            toast.success('Rules deleted successfully');
            fetchRules();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete rules');
        }
    };

    const handleNextStep = () => {
        if (targetType === 'SPECIFIC_USER' && !selectedUser) {
            toast.error("Please select a user");
            return;
        }
        if (Object.keys(ruleForms).length === 0) {
            initEmptyRules();
        }
        setWizardStep(2);
    };

    const handleSaveRules = async () => {
        const rulesToSave = Object.keys(ruleForms)
            .filter(key => ruleForms[key].enabled)
            .map(key => ({
                business_nature: key === 'null' ? null : key,
                limit_type: ruleForms[key].limit_type,
                limit_value: parseFloat(ruleForms[key].limit_value),
                is_active: true
            }));

        if (rulesToSave.length === 0) {
            toast.error("Please enable and configure at least one rule");
            return;
        }

        for (const r of rulesToSave) {
            if (isNaN(r.limit_value) || r.limit_value <= 0) {
                toast.error("Please enter valid limits for enabled categories");
                return;
            }
        }

        setIsSaving(true);
        const payload = {
            target_type: targetType,
            target_user_id: targetType === 'SPECIFIC_USER' ? selectedUser.id : null,
            user_category: targetType === 'ALL_USERS' ? userCategory : null,
            rules: rulesToSave
        };

        try {
            await apiFetch('/admin/barring-rules', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            setSaveSuccess(true);
            setTimeout(() => {
                setIsWizardOpen(false);
                fetchRules();
            }, 1500); // Wait to show animation
            
        } catch (error: any) {
            toast.error(error.message || 'Failed to save rules');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout title="Expense Limits (Barring Rules)">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Manage Limits</h2>
                    <p className="text-sm text-slate-500">Set daily limits grouped by Recipient's Business Category</p>
                </div>
                <button
                    onClick={handleOpenWizardForNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" /> Add Rule Groups
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : groupedTargets.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-slate-200 shadow-sm">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Limit Groups Found</h3>
                    <p className="text-slate-500 mt-2">Create targeted rules to control user expenses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedTargets.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                            <div className="flex bg-slate-50 border-b border-slate-100 p-4 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">
                                            {group.target_type === 'ALL_USERS' 
                                                ? `ALL ${group.user_category}S`
                                                : group.targetUser?.name || 'Specific User'
                                            }
                                        </h3>
                                        {group.target_type === 'SPECIFIC_USER' && (
                                            <p className="text-xs text-slate-500">{group.targetUser?.mobile_number}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-white">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Rules ({group.rules.length})</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {group.rules.map((r: any) => (
                                        <div key={r.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                            <span className="text-sm font-medium text-slate-700 truncate">{r.business_nature || 'Global Limit'}</span>
                                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                {r.limit_type === 'FLAT_AMOUNT' ? `₹${r.limit_value}` : `${r.limit_value}%`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                                <button onClick={() => handleOpenWizardForEdit(group)} className="px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1 font-semibold transition">
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button onClick={() => handleDeleteTarget(group)} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1 font-semibold transition">
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* WIZARD OVERLAY */}
            {isWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    
                    {saveSuccess ? (
                        <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center animate-in zoom-in shadow-2xl">
                            <CheckCircle className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
                            <h2 className="text-2xl font-bold text-slate-800">Rules Saved!</h2>
                            <p className="text-slate-500 mt-2">The limits have been successfully applied.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] max-h-[800px] overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Configure Expense Limits
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className={`w-2 h-2 rounded-full ${wizardStep === 1 ? 'bg-blue-600' : 'bg-blue-200'}`} />
                                        <div className={`w-2 h-2 rounded-full ${wizardStep === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                    </div>
                                </div>
                                <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    &times;
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                                {wizardStep === 1 && (
                                    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-4">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-slate-800">Who should these rules apply to?</h2>
                                            <p className="text-slate-500 mt-2">Select the target users for these barring limits.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                onClick={() => setTargetType('ALL_USERS')}
                                                className={`p-4 border-2 rounded-xl cursor-pointer transition ${targetType === 'ALL_USERS' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                            >
                                                <div className="font-bold text-slate-800 mb-1">Group of Users</div>
                                                <p className="text-xs text-slate-500">Apply to all users of a specific role</p>
                                            </div>
                                            <div 
                                                onClick={() => setTargetType('SPECIFIC_USER')}
                                                className={`p-4 border-2 rounded-xl cursor-pointer transition ${targetType === 'SPECIFIC_USER' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                            >
                                                <div className="font-bold text-slate-800 mb-1">Specific User</div>
                                                <p className="text-xs text-slate-500">Apply to an individual account</p>
                                            </div>
                                        </div>

                                        {targetType === 'ALL_USERS' && (
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                                <label className="block text-sm font-bold text-slate-700 mb-3">Select User Category</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                    value={userCategory}
                                                    onChange={(e) => setUserCategory(e.target.value)}
                                                >
                                                    {categories.map(c => (
                                                        <option key={c} value={c}>All {c}S</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {targetType === 'SPECIFIC_USER' && (
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                                                        placeholder="Search by name or mobile..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>

                                                {selectedUser ? (
                                                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div>
                                                            <div className="font-bold text-blue-900">{selectedUser.name}</div>
                                                            <div className="text-xs text-blue-700">{selectedUser.mobile_number} • {selectedUser.role}</div>
                                                        </div>
                                                        <button onClick={() => setSelectedUser(null)} className="text-blue-600 text-sm font-bold ml-4">Change</button>
                                                    </div>
                                                ) : (
                                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                                        {searchResults.map((user) => (
                                                            <div 
                                                                key={user.id} 
                                                                onClick={() => setSelectedUser(user)}
                                                                className="p-3 border border-slate-100 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer rounded-lg transition"
                                                            >
                                                                <div className="font-bold text-slate-800">{user.name}</div>
                                                                <div className="text-xs text-slate-500 flex justify-between">
                                                                    <span>{user.mobile_number}</span>
                                                                    <span>Balance: ₹{user.wallet_balance}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 max-w-4xl mx-auto">
                                        <div className="mb-6">
                                            <h2 className="text-2xl font-bold text-slate-800">Define Category Limits</h2>
                                            <p className="text-slate-500 mt-1">
                                                Set specific limits for transactions made to different business categories. 
                                                If a category is left disabled, <strong className="text-green-600">no limits will apply</strong> for that category.
                                            </p>
                                        </div>

                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                                                    <tr>
                                                        <th className="p-4 font-bold w-1/3">Recipient Category</th>
                                                        <th className="p-4 font-bold w-1/4">Limit Enabled</th>
                                                        <th className="p-4 font-bold">Limit Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {BUSINESS_CATEGORIES.map((cat) => {
                                                        const formKey = cat.key || 'null';
                                                        const isEnabled = ruleForms[formKey]?.enabled || false;
                                                        
                                                        return (
                                                            <tr key={formKey} className={isEnabled ? 'bg-blue-50/30' : 'bg-white'}>
                                                                <td className="p-4">
                                                                    <div className="font-bold text-slate-800">{cat.value}</div>
                                                                    {cat.key === null && <div className="text-xs text-slate-500">Applies to general transfers/withdrawals</div>}
                                                                </td>
                                                                <td className="p-4">
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="sr-only peer" 
                                                                            checked={isEnabled}
                                                                            onChange={(e) => {
                                                                                setRuleForms({
                                                                                    ...ruleForms,
                                                                                    [formKey]: { ...ruleForms[formKey], enabled: e.target.checked }
                                                                                });
                                                                            }}
                                                                        />
                                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                                    </label>
                                                                </td>
                                                                <td className="p-4">
                                                                    {isEnabled ? (
                                                                        <div className="flex gap-2">
                                                                            <select 
                                                                                className="p-2 border border-blue-200 bg-white rounded-lg text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500"
                                                                                value={ruleForms[formKey].limit_type}
                                                                                onChange={(e) => {
                                                                                    setRuleForms({
                                                                                        ...ruleForms,
                                                                                        [formKey]: { ...ruleForms[formKey], limit_type: e.target.value }
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <option value="FLAT_AMOUNT">Flat ₹</option>
                                                                                <option value="PERCENTAGE_OF_WALLET">% of Wallet</option>
                                                                            </select>
                                                                            <input 
                                                                                type="number"
                                                                                className="p-2 border border-blue-200 bg-white rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 w-32"
                                                                                placeholder="Amount"
                                                                                value={ruleForms[formKey].limit_value}
                                                                                onChange={(e) => {
                                                                                    setRuleForms({
                                                                                        ...ruleForms,
                                                                                        [formKey]: { ...ruleForms[formKey], limit_value: e.target.value }
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-slate-400 text-sm italic">Unlimited</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0 z-10">
                                {wizardStep === 1 ? (
                                    <button onClick={() => setIsWizardOpen(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">
                                        Cancel
                                    </button>
                                ) : (
                                    <button onClick={() => setWizardStep(1)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition">
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                )}
                                
                                {wizardStep === 1 ? (
                                    <button onClick={handleNextStep} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-500/30 transition">
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleSaveRules} 
                                        disabled={isSaving}
                                        className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-green-700 shadow-lg border border-green-500 transition disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save All Rules'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}
