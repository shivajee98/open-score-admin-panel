'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { apiFetch } from '@/lib/api';
import { Plus, Trash2, Edit2, AlertCircle, Search, User, CheckCircle, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, Layers, Info, LayoutGrid, Banknote, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BarringRule {
    id: number;
    target_type: string;
    target_user_id: number | null;
    user_category: string | null;
    business_nature: string | null;
    business_segment: string | null;
    rule_side: string;
    loan_plan_id: number | null;
    min_balance: number;
    limit_type: string;
    limit_value: number;
    max_receive_per_user: number | null;
    is_active: boolean;
    targetUser?: { id: number, name: string, mobile_number: string };
    loanPlan?: { id: number, name: string, amount: number };
}

interface LoanPlan {
    id: number;
    name: string;
    amount: number;
}

const BUSINESS_STRUCTURE = [
    {
        name: 'Food & Daily Essentials',
        subcategories: ['Grocery / Kirana Store', 'Dairy / Milk Booth', 'Fruit & Vegetable Vendor', 'Bakery', 'Sweet Shop / Mithai Shop', 'Fast Food Stall', 'Tea / Coffee Stall', 'Juice Shop', 'Restaurant', 'Dhaba', 'Hotel / Lodge']
    },
    {
        name: 'Health & Medical',
        subcategories: ['Pharmacy / Medical Store', 'Clinic', 'Pathology Lab', 'Medical Equipment Shop', 'Ayurvedic / Herbal Store']
    },
    {
        name: 'Retail Shops',
        subcategories: ['General Store', 'Departmental Store', 'Clothing / Garment Shop', 'Footwear Shop', 'Mobile Shop', 'Electronics Shop', 'Gift Shop', 'Cosmetic / Beauty Store', 'Stationery Shop', 'Toy Shop']
    },
    {
        name: 'Street Vendors / Small Traders',
        subcategories: ['Street Food Cart', 'Paan Shop', 'Ice Cream Cart', 'Egg / Chicken Vendor', 'Fish / Meat Shop', 'Flower Vendor']
    },
    {
        name: 'Services (Daily Use)',
        subcategories: ['Barber / Salon', 'Beauty Parlour', 'Laundry / Dry Cleaner', 'Tailor', 'Repair Shop (Mobile / Electronics)', 'Bike / Car Garage', 'Photocopy / Printing Shop', 'Cyber Cafe']
    },
    {
        name: 'Home & Utility',
        subcategories: ['Hardware Store', 'Electrical Shop', 'Plumbing Store', 'Paint Shop', 'Furniture Shop', 'Mattress Shop', 'Kitchenware / Utensils Store']
    },
    {
        name: 'Agriculture & Rural',
        subcategories: ['Fertilizer Shop', 'Seeds Store', 'Animal Feed Shop', 'Pesticide Store', 'Dairy Farm']
    },
    {
        name: 'Education & Others',
        subcategories: ['Book Store', 'Coaching Institute', 'Computer Training Center', 'Play School / Daycare']
    }
];

const BUSINESS_CATEGORIES = [
    { value: 'All Other / Generic', nature: null, segment: null },
    ...BUSINESS_STRUCTURE.flatMap(cat => [
        { value: cat.name, nature: cat.name, segment: null },
        ...cat.subcategories.map(sub => ({ value: `${cat.name} > ${sub}`, nature: cat.name, segment: sub }))
    ])
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
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
    
    // New Barring Type State
    const [ruleSide, setRuleSide] = useState('SENDER'); 
    const [selectedLoanPlanId, setSelectedLoanPlanId] = useState<number | null>(null);
    const [minBalance, setMinBalance] = useState<string>('0');
    const [maxReceivePerUser, setMaxReceivePerUser] = useState<string>('');
    const [loanPlans, setLoanPlans] = useState<LoanPlan[]>([]);

    // New Selection States (Loan Plan Style)
    const [targetableUsers, setTargetableUsers] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [userFilters, setUserFilters] = useState({
        search: '',
    });

    // Profile Filtering State (for Receiver Target Selection)
    const [selectedProfile, setSelectedProfile] = useState<string>('MERCHANT');

    // Mapped Senders State (for Receiver Rules)
    const [mappedSenderIds, setMappedSenderIds] = useState<number[]>([]);
    const [senderSearch, setSenderSearch] = useState('');

    // Total Cap State
    const [isTotalCapEnabled, setIsTotalCapEnabled] = useState(false);
    const [totalCapValue, setTotalCapValue] = useState<string>('');

    // Rule Definition State
    const [ruleForms, setRuleForms] = useState<any>({});
    const [expandedCats, setExpandedCats] = useState<string[]>([]);
    
    // NEW: Per-Receiver-Sender Rules State
    // Format: { 'USER_123': { globalLimit: '1000', senderLimits: [{ senderId: 456, amount: '500' }] } }
    const [receiverSenderRules, setReceiverSenderRules] = useState<any>({});
    const [isSenderSelectionOpen, setIsSenderSelectionOpen] = useState(false);
    const [activeReceiverForSender, setActiveReceiverForSender] = useState<string | null>(null);

    const toggleCat = (name: string) => {
        setExpandedCats(prev => 
            prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
        );
    };

    // Tiered Capacity Rules States
    const [capacityModal, setCapacityModal] = useState(false);
    const [tieredTiers, setTieredTiers] = useState([{ minBalance: '0', spendPercentage: '0' }]);
    const [selectedTieredLoanPlanId, setSelectedTieredLoanPlanId] = useState<any>('');
    const [selectedTargetUserIds, setSelectedTargetUserIds] = useState<number[]>([]);
    const [tieredUserCategory, setTieredUserCategory] = useState('CUSTOMER');

    const categories = ['CUSTOMER', 'MERCHANT', 'STUDENT'];

    useEffect(() => {
        fetchRules();
        fetchLoanPlans();
    }, []);

    const fetchLoanPlans = async () => {
        try {
            const data = await apiFetch('/admin/loan-plans/active');
            setLoanPlans(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/admin/barring-rules');
            setRules(data);
            
            // Group rules by target to display in list
            const grouped = data.reduce((acc: any, rule: BarringRule) => {
                // For Tiered Rules, we might want to keep them separate or group them
                // For now, let's just use the existing grouping logic
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

    const toggleTargetUser = (userId: number) => {
        if (selectedTargetUserIds.includes(userId)) {
            setSelectedTargetUserIds(selectedTargetUserIds.filter(id => id !== userId));
        } else {
            setSelectedTargetUserIds([...selectedTargetUserIds, userId]);
        }
    };

    const selectAllFilteredCapacity = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        setSelectedTargetUserIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const deselectAllFilteredCapacity = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        setSelectedTargetUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const addTieredTier = () => {
        setTieredTiers([...tieredTiers, { minBalance: '', spendPercentage: '' }]);
    };

    const removeTieredTier = (index: number) => {
        setTieredTiers(tieredTiers.filter((_, i) => i !== index));
    };

    const updateTieredTier = (index: number, field: string, value: string) => {
        const newTiers = [...tieredTiers];
        (newTiers[index] as any)[field] = value;
        setTieredTiers(newTiers);
    };

    const handleSaveTieredRules = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate tiers
        for (const tier of tieredTiers) {
            if (isNaN(parseFloat(tier.minBalance)) || isNaN(parseFloat(tier.spendPercentage))) {
                toast.error('Please enter valid numeric values for all tiers');
                return;
            }
        }

        setIsSaving(true);
        try {
            const rules = tieredTiers.map(tier => ({
                rule_side: 'SENDER',
                loan_plan_id: selectedTieredLoanPlanId || null,
                min_balance: parseFloat(tier.minBalance),
                limit_type: 'PERCENTAGE_OF_WALLET',
                limit_value: parseFloat(tier.spendPercentage),
                allowed_merchants: null, // Global rules for these tiers
                is_active: true
            }));

            const payload = {
                target_type: selectedTargetUserIds.length > 0 ? 'SPECIFIC_USER' : 'ALL_USERS',
                target_user_id: selectedTargetUserIds.length > 0 ? selectedTargetUserIds[0] : null,
                target_user_ids: selectedTargetUserIds.length > 0 ? selectedTargetUserIds : null,
                user_category: selectedTargetUserIds.length === 0 ? tieredUserCategory : null,
                rules: rules
            };

            const res = await apiFetch('/admin/barring-rules', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.error) throw new Error(res.error);
            toast.success('Tiered Capacity Rules Updated Successfully');
            setCapacityModal(false);
            // Reset fields
            setSelectedTieredLoanPlanId('');
            setTieredTiers([{ minBalance: '0', spendPercentage: '0' }]);
            setSelectedTargetUserIds([]);
            fetchRules();
        } catch (e: any) {
            toast.error(e.message || 'Failed to save capacity rules');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            const res = await apiFetch(`/admin/barring-rules/${id}`, { method: 'DELETE' });
            if (res.error) throw new Error(res.error);
            toast.success('Rule deleted');
            fetchRules();
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete rule');
        }
    };

    useEffect(() => {
        if ((isWizardOpen && targetType === 'SPECIFIC_USER') || capacityModal) {
            fetchTargetableUsers();
        }
    }, [isWizardOpen, targetType, capacityModal]);

    const fetchTargetableUsers = async () => {
        setSearching(true);
        try {
            const res = await apiFetch('/admin/users/targetable');
            setTargetableUsers(res || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    const filteredUsersList = targetableUsers.filter(user => {
        const matchesSearch = !userFilters.search || 
            user.name?.toLowerCase().includes(userFilters.search.toLowerCase()) ||
            user.mobile_number?.includes(userFilters.search) ||
            user.business_name?.toLowerCase().includes(userFilters.search.toLowerCase());
        
        // Force profile filtering for RECEIVER rules as requested
        const matchesProfile = ruleSide === 'SENDER' || selectedProfile === 'ALL' || user.role === selectedProfile;
        
        return matchesSearch && matchesProfile;
    });

    // Separate search for Mapped Senders (Payers)
    const filteredSendersList = targetableUsers.filter(user => {
        const matchesSearch = !senderSearch || 
            user.name?.toLowerCase().includes(senderSearch.toLowerCase()) ||
            user.mobile_number?.includes(senderSearch) ||
            user.business_name?.toLowerCase().includes(senderSearch.toLowerCase());
        
        const matchesProfile = selectedProfile === 'ALL' || user.role === selectedProfile;
        
        return matchesSearch && matchesProfile;
    });

    const toggleUser = (userId: number) => {
        if (assignedUserIds.includes(userId)) {
            setAssignedUserIds(assignedUserIds.filter(id => id !== userId));
        } else {
            setAssignedUserIds([...assignedUserIds, userId]);
        }
    };

    const selectAllFiltered = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        setAssignedUserIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    };

    const deselectAllFiltered = () => {
        const filteredIds = filteredUsersList.map(u => u.id);
        setAssignedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const handleOpenWizardForNew = () => {
        setTargetType('ALL_USERS');
        setUserCategory('CUSTOMER');
        setSelectedUser(null);
        setAssignedUserIds([]);
        setRuleSide('SENDER');
        setSelectedLoanPlanId(null);
        setMinBalance('0');
        setMaxReceivePerUser('');
        setSelectedProfile('MERCHANT');
        setMappedSenderIds([]);
        setIsTotalCapEnabled(false);
        setTotalCapValue('');
        initEmptyRules();
        setWizardStep(1);
        setSaveSuccess(false);
        setIsWizardOpen(true);
    };

    const handleOpenWizardForEdit = (targetData: any) => {
        setTargetType(targetData.target_type);
        if (targetData.target_type === 'ALL_USERS') {
            setUserCategory(targetData.user_category);
            setAssignedUserIds([]);
        } else {
            setSelectedUser(targetData.targetUser);
            setAssignedUserIds([targetData.target_user_id]);
        }
        
        // Populate existing rules
        initEmptyRules();
        const firstRule = targetData.rules[0];
        if (firstRule) {
            const side = firstRule.rule_side || 'SENDER';
            setRuleSide(side);
            setSelectedLoanPlanId(firstRule.loan_plan_id);
            setMinBalance(String(firstRule.min_balance || '0'));
            setMaxReceivePerUser(String(firstRule.max_receive_per_user || ''));
            
            if (side === 'RECEIVER') {
                const initialRSR: any = {};
                const targetKey = targetData.target_type === 'ALL_USERS' 
                    ? `ALL_${targetData.user_category}` 
                    : `USER_${targetData.target_user_id}`;
                
                const globalRule = targetData.rules.find((r: any) => !r.allowed_merchants || r.allowed_merchants.length === 0);
                const senderRules = targetData.rules.filter((r: any) => r.allowed_merchants && r.allowed_merchants.length > 0);
                
                initialRSR[targetKey] = {
                    globalLimit: globalRule ? String(globalRule.max_receive_per_user || '') : '',
                    senderLimits: senderRules.map((r: any) => ({
                        senderId: r.allowed_merchants[0],
                        amount: String(r.max_receive_per_user || '')
                    }))
                };
                setReceiverSenderRules(initialRSR);
            } else {
                // Find if there's a total cap rule
                const totalCapRule = targetData.rules.find((r: any) => r.is_total_cap);
                if (totalCapRule) {
                    setIsTotalCapEnabled(true);
                    setTotalCapValue(String(totalCapRule.limit_value || ''));
                } else {
                    setIsTotalCapEnabled(false);
                    setTotalCapValue('');
                }
            }
        }

        const newForms = { ...ruleForms };
        const expanded: string[] = [];
        targetData.rules.forEach((r: BarringRule) => {
            const key = `${r.business_nature}:${r.business_segment}`;
            newForms[key] = {
                enabled: true,
                limit_type: r.limit_type,
                limit_value: r.limit_value
            };
            if (r.business_nature) expanded.push(r.business_nature);
        });
        setRuleForms(newForms);
        setExpandedCats(Array.from(new Set(expanded)));
        
        setWizardStep(2);
        setSaveSuccess(false);
        setIsWizardOpen(true);
    };

    const initEmptyRules = () => {
        const initial: any = {};
        BUSINESS_CATEGORIES.forEach(cat => {
            const key = `${cat.nature}:${cat.segment}`;
            initial[key] = {
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
        if (targetType === 'SPECIFIC_USER' && assignedUserIds.length === 0) {
            toast.error("Please select at least one user");
            return;
        }
        
        if (ruleSide === 'RECEIVER') {
            const initial: any = { ...receiverSenderRules };
            if (targetType === 'SPECIFIC_USER') {
                assignedUserIds.forEach(id => {
                    const key = `USER_${id}`;
                    if (!initial[key]) {
                        initial[key] = { globalLimit: '', senderLimits: [] };
                    }
                });
            } else {
                const key = `ALL_${userCategory}`;
                if (!initial[key]) {
                    initial[key] = { globalLimit: '', senderLimits: [] };
                }
            }
            setReceiverSenderRules(initial);
        } else if (Object.keys(ruleForms).length === 0) {
            initEmptyRules();
        }
        setWizardStep(2);
    };

    const handleSaveRules = async () => {
        setIsSaving(true);
        try {
            if (ruleSide === 'SENDER') {
                const rulesToSave: any[] = [];
                Object.entries(ruleForms).forEach(([key, rule]: [string, any]) => {
                    if (rule.enabled) {
                        const [nature, segment] = key.split(':');
                        rulesToSave.push({
                            rule_side: 'SENDER',
                            loan_plan_id: selectedLoanPlanId,
                            min_balance: parseFloat(minBalance || '0'),
                            business_nature: nature === 'null' ? null : nature,
                            business_segment: segment === 'null' ? null : segment,
                            limit_type: rule.limit_type,
                            limit_value: parseFloat(rule.limit_value || '0'),
                            is_total_cap: false,
                            is_active: true
                        });
                    }
                });

                if (isTotalCapEnabled && totalCapValue) {
                    rulesToSave.push({
                        rule_side: 'SENDER',
                        loan_plan_id: selectedLoanPlanId,
                        min_balance: parseFloat(minBalance || '0'),
                        limit_type: 'FLAT_AMOUNT',
                        limit_value: parseFloat(totalCapValue),
                        is_total_cap: true,
                        is_active: true
                    });
                }

                if (rulesToSave.length === 0) {
                    toast.error("Please enable at least one rule");
                    setIsSaving(false);
                    return;
                }

                const payload = {
                    target_type: targetType,
                    target_user_id: targetType === 'SPECIFIC_USER' ? assignedUserIds[0] : null,
                    target_user_ids: assignedUserIds,
                    user_category: userCategory,
                    rules: rulesToSave
                };

                await apiFetch('/admin/barring-rules', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            } else {
                // RECEIVER RULES - Granular processing per target
                const targets = Object.keys(receiverSenderRules);
                
                for (const targetKey of targets) {
                    const ruleSet = receiverSenderRules[targetKey];
                    const targetRules: any[] = [];
                    
                    if (ruleSet.globalLimit) {
                        targetRules.push({
                            rule_side: 'RECEIVER',
                            max_receive_per_user: parseFloat(ruleSet.globalLimit),
                            allowed_merchants: null,
                            is_active: true
                        });
                    }
                    
                    ruleSet.senderLimits.forEach((sl: any) => {
                        if (sl.amount) {
                            targetRules.push({
                                rule_side: 'RECEIVER',
                                max_receive_per_user: parseFloat(sl.amount),
                                allowed_merchants: [sl.senderId],
                                is_active: true
                            });
                        }
                    });

                    if (targetRules.length === 0) continue;

                    const individualPayload = {
                        target_type: targetKey.startsWith('USER_') ? 'SPECIFIC_USER' : 'ALL_USERS',
                        target_user_id: targetKey.startsWith('USER_') ? targetKey.replace('USER_', '') : null,
                        user_category: targetKey.startsWith('ALL_') ? targetKey.replace('ALL_', '') : null,
                        rules: targetRules
                    };

                    await apiFetch('/admin/barring-rules', {
                        method: 'POST',
                        body: JSON.stringify(individualPayload)
                    });
                }
            }

            toast.success("Barring rules saved successfully!");
            setSaveSuccess(true);
            setTimeout(() => {
                setIsWizardOpen(false);
                fetchRules();
            }, 1000);
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save rules");
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
                <div className="flex gap-3">
                    <button
                        onClick={() => setCapacityModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                    >
                        <Banknote className="w-4 h-4" /> Manage Capacity Settings
                    </button>
                    <button
                        onClick={handleOpenWizardForNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Rule Groups
                    </button>
                </div>
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
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${group.rules[0]?.rule_side === 'RECEIVER' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-800 text-sm">
                                                {group.target_type === 'ALL_USERS' 
                                                    ? `ALL ${group.user_category}S`
                                                    : group.targetUser?.name || 'Specific User'
                                                }
                                            </h3>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${group.rules[0]?.rule_side === 'RECEIVER' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {group.rules[0]?.rule_side || 'SENDER'}
                                            </span>
                                        </div>
                                        {group.target_type === 'SPECIFIC_USER' && (
                                            <p className="text-xs text-slate-500">{group.targetUser?.mobile_number}</p>
                                        )}
                                        {group.rules[0]?.loanPlan && (
                                            <p className="text-[10px] text-blue-600 font-bold">Plan: {group.rules[0].loanPlan.name}</p>
                                        )}
                                        {group.rules[0]?.min_balance > 0 && (
                                            <p className="text-[10px] text-orange-600 font-bold">Balance below ₹{group.rules[0].min_balance}</p>
                                        )}
                                        {group.rules[0]?.rule_side === 'RECEIVER' && group.rules[0]?.max_receive_per_user && (
                                            <p className="text-[10px] text-emerald-600 font-bold">Capacity: ₹{group.rules[0].max_receive_per_user}/user</p>
                                        )}
                                        {group.rules.some((r: any) => r.is_total_cap) && (
                                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">Total Cap: ₹{group.rules.find((r: any) => r.is_total_cap).limit_value}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-white">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Rules ({group.rules.length})</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {group.rules.map((r: any) => (
                                        <div key={r.id} className={`p-3 rounded-lg border space-y-2 ${r.is_total_cap ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col truncate pr-2">
                                                    <span className={`text-sm font-bold truncate ${r.is_total_cap ? 'text-white' : 'text-slate-700'}`}>
                                                        {r.is_total_cap ? 'DAILY TOTAL VOLUME CAP' : (r.business_segment 
                                                            ? `${r.business_nature} > ${r.business_segment}` 
                                                            : (r.business_nature || 'Generic / Global'))
                                                        }
                                                    </span>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`text-xs font-black ${r.is_total_cap ? 'text-blue-100' : 'text-blue-600'}`}>
                                                        {r.limit_type === 'PERCENTAGE_OF_WALLET' ? `${r.limit_value}%` : `₹${r.limit_value}`}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {(r.loan_plan_id || r.min_balance > 0 || r.allowed_merchants?.length > 0) && (
                                                <div className={`flex flex-wrap gap-2 pt-1 border-t mt-1 ${r.is_total_cap ? 'border-white/20' : 'border-slate-200/50'}`}>
                                                    {r.loanPlan && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.is_total_cap ? 'bg-white/10 text-white border-white/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            Plan: {r.loanPlan.name}
                                                        </span>
                                                    )}
                                                    {r.min_balance > 0 && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.is_total_cap ? 'bg-white/10 text-white border-white/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                            Min Bal: ₹{r.min_balance}
                                                        </span>
                                                    )}
                                                    {r.allowed_merchants?.length > 0 && (
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.is_total_cap ? 'bg-white/10 text-white border-white/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                            {r.allowed_merchants.length} Mapped Senders
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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
                                            <h2 className="text-2xl font-bold text-slate-800">Rule Type & Target</h2>
                                            <p className="text-slate-500 mt-2">Define the nature of the rule and who it applies to.</p>
                                        </div>

                                        {/* NEW: Rule Side Selection */}
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">I want to set a limit for:</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div 
                                                    onClick={() => setRuleSide('SENDER')}
                                                    className={`p-4 border-2 rounded-xl cursor-pointer transition ${ruleSide === 'SENDER' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                                                >
                                                    <div className="font-bold text-slate-800 mb-1">Sender (The Payer)</div>
                                                    <p className="text-[10px] text-slate-500">Limit how much a vendor/user can send</p>
                                                </div>
                                                <div 
                                                    onClick={() => setRuleSide('RECEIVER')}
                                                    className={`p-4 border-2 rounded-xl cursor-pointer transition ${ruleSide === 'RECEIVER' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                                                >
                                                    <div className="font-bold text-slate-800 mb-1">Receiver (The Payee)</div>
                                                    <p className="text-[10px] text-slate-500">Limit how much a merchant/user can get</p>
                                                </div>
                                            </div>
                                        </div>

                                        {ruleSide === 'SENDER' && (
                                            <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">Apply when Balance is below:</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                            <input 
                                                                type="number"
                                                                className="w-full p-2.5 pl-7 bg-white border border-blue-200 rounded-lg outline-none font-bold text-sm text-slate-700 focus:ring-2 focus:ring-blue-500"
                                                                placeholder="e.g. 10000"
                                                                value={minBalance}
                                                                onChange={(e) => setMinBalance(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium italic">*Leave Balance as 0 and Loan as "Any" to apply globally to the selected target.</p>
                                            </div>
                                        )}

                                        {ruleSide === 'RECEIVER' && (
                                            <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                                    <Info className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-emerald-800 text-sm">Receiver Specific Limits</h4>
                                                    <p className="text-[10px] text-emerald-600 font-medium leading-relaxed">
                                                        You will be able to set specific limits for different senders for each selected receiver in the next step.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Target {ruleSide === 'SENDER' ? 'Sender' : 'Receiver'}</label>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
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
                                                <div className="animate-in fade-in slide-in-from-top-2">
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
                                        </div>

                                        {targetType === 'SPECIFIC_USER' && (
                                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                                                {ruleSide === 'RECEIVER' && (
                                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                                        {['MERCHANT', 'CUSTOMER', 'STUDENT'].map(profile => (
                                                            <button
                                                                key={profile}
                                                                type="button"
                                                                onClick={() => setSelectedProfile(profile)}
                                                                className={`flex-1 py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${selectedProfile === profile ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                {profile}S
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                    <input 
                                                        type="text" 
                                                        className="w-full p-3 pl-10 bg-slate-100 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:border-blue-500 focus:bg-white transition-all"
                                                        placeholder="Search user by name or mobile..."
                                                        value={userFilters.search}
                                                        onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">
                                                                {filteredUsersList.length} Found
                                                            </span>
                                                            <span className="text-[10px] font-bold text-blue-600">
                                                                {assignedUserIds.length} Selected
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <button
                                                                type="button"
                                                                onClick={selectAllFiltered}
                                                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition"
                                                            >
                                                                Select All
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={deselectAllFiltered}
                                                                className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition"
                                                            >
                                                                Clear All
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50/50 space-y-1 p-1">
                                                        {searching ? (
                                                            <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Fetching users...</div>
                                                        ) : filteredUsersList.length > 0 ? (
                                                            filteredUsersList.map(user => (
                                                                <div 
                                                                    key={user.id} 
                                                                    onClick={() => toggleUser(user.id)}
                                                                    className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition-all ${assignedUserIds.includes(user.id) ? 'bg-blue-50/80 border-blue-100 shadow-sm' : 'hover:bg-white bg-transparent border-transparent'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${assignedUserIds.includes(user.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                            {user.name?.[0] || 'U'}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                                                            <p className="text-[10px] text-slate-500 font-medium">{user.mobile_number} • {user.role}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${assignedUserIds.includes(user.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                                        {assignedUserIds.includes(user.id) && <CheckCircle size={12} className="text-white" />}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-10 text-center text-slate-400 text-sm italic">
                                                                No users found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 max-w-4xl mx-auto">
                                        <div className="mb-6">
                                            <h2 className="text-2xl font-bold text-slate-800">
                                                {ruleSide === 'SENDER' ? 'Define Category Limits' : 'Define Receiving Limits'}
                                            </h2>
                                            <p className="text-slate-500 mt-1">
                                                {ruleSide === 'SENDER' 
                                                    ? 'Set specific limits for transactions made to different business categories.' 
                                                    : 'Set specific limits for how much this receiver can get from one sender per category.'}
                                                If a category is left disabled, <strong className="text-green-600">no limits will apply</strong> for that category.
                                            </p>
                                        </div>

                                        {ruleSide === 'SENDER' ? (
                                            <div className="space-y-4 max-w-4xl mx-auto mb-10">
                                                {/* Total Volume Cap Rule */}
                                                <div className="bg-blue-600 rounded-2xl shadow-lg p-5 text-white flex items-center justify-between border border-blue-400">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                                            <Banknote className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg leading-tight uppercase tracking-tight">Daily Total Volume Cap</h3>
                                                            <p className="text-xs text-blue-100 font-medium">Overwrites all category limits once reached.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer" 
                                                                checked={isTotalCapEnabled}
                                                                onChange={(e) => setIsTotalCapEnabled(e.target.checked)}
                                                            />
                                                            <div className="w-12 h-6 bg-blue-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30 border border-white/20"></div>
                                                        </label>
                                                        {isTotalCapEnabled && (
                                                            <div className="relative animate-in zoom-in-95 duration-200">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold">₹</span>
                                                                <input 
                                                                    type="number"
                                                                    className="w-32 p-2.5 pl-7 bg-white/10 border border-white/20 rounded-xl outline-none font-black text-sm text-white focus:bg-white/20 transition-all placeholder:text-white/40"
                                                                    placeholder="Limit"
                                                                    value={totalCapValue}
                                                                    onChange={(e) => setTotalCapValue(e.target.value)}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Top Level Item: All Other / Generic */}
                                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                                    <div className="p-4 flex items-center justify-between bg-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                                <LayoutGrid className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">All Other / Generic</div>
                                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                                    Default Transfer Limit
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-6">
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="sr-only peer" 
                                                                    checked={ruleForms['null:null']?.enabled || false}
                                                                    onChange={(e) => {
                                                                        setRuleForms({
                                                                            ...ruleForms,
                                                                            ['null:null']: { ...ruleForms['null:null'], enabled: e.target.checked }
                                                                        });
                                                                    }}
                                                                />
                                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                            </label>

                                                            {ruleForms['null:null']?.enabled && (
                                                                <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                                                                    <select 
                                                                        className="p-2.5 border border-blue-200 bg-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                                                        value={ruleForms['null:null'].limit_type}
                                                                        onChange={(e) => setRuleForms({ ...ruleForms, ['null:null']: { ...ruleForms['null:null'], limit_type: e.target.value } })}
                                                                    >
                                                                        <option value="FLAT_AMOUNT">Flat ₹</option>
                                                                        <option value="PERCENTAGE_OF_WALLET">% Wallet</option>
                                                                    </select>
                                                                    <input 
                                                                        type="number"
                                                                        className="p-2.5 border border-blue-200 bg-white rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-24"
                                                                        placeholder="Amount"
                                                                        value={ruleForms['null:null'].limit_value}
                                                                        onChange={(e) => setRuleForms({ ...ruleForms, ['null:null']: { ...ruleForms['null:null'], limit_value: e.target.value } })}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {BUSINESS_STRUCTURE.map((cat) => {
                                                    const parentKey = `${cat.name}:null`;
                                                    const isParentEnabled = ruleForms[parentKey]?.enabled || false;
                                                    const isExpanded = expandedCats.includes(cat.name);
                                                    const activeSubCount = cat.subcategories.filter(sub => ruleForms[`${cat.name}:${sub}`]?.enabled).length;

                                                    return (
                                                        <div key={cat.name} className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${isExpanded ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-200'}`}>
                                                            {/* Parent Row */}
                                                            <div className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50/50' : 'bg-white'}`} onClick={() => toggleCat(cat.name)}>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                                                        <Layers className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-slate-800 text-lg leading-tight">{cat.name}</div>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{cat.subcategories.length} Segments</div>
                                                                            {activeSubCount > 0 && (
                                                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full uppercase">
                                                                                    {activeSubCount} Limits Active
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                                                </div>
                                                            </div>

                                                            {/* Subcategories (Accordion Content) */}
                                                            {isExpanded && (
                                                                <div className="border-t border-slate-100 divide-y divide-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                                                                    {/* Optional: Limit for entire category */}
                                                                    <div className="p-4 flex items-center justify-between pl-16 bg-blue-50/20">
                                                                        <div>
                                                                            <div className="font-bold text-slate-700 text-sm italic underline decoration-blue-200 underline-offset-4">Catch-all limit for {cat.name}</div>
                                                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Applied if no specific segment match</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    className="sr-only peer" 
                                                                                    checked={isParentEnabled}
                                                                                    onChange={(e) => {
                                                                                        setRuleForms({
                                                                                            ...ruleForms,
                                                                                            [parentKey]: { ...ruleForms[parentKey], enabled: e.target.checked }
                                                                                        });
                                                                                    }}
                                                                                />
                                                                                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                                            </label>
                                                                            {isParentEnabled && (
                                                                                <div className="flex gap-2">
                                                                                    <select className="p-1.5 border border-blue-200 bg-white rounded-lg text-xs outline-none" value={ruleForms[parentKey].limit_type} onChange={(e) => setRuleForms({...ruleForms, [parentKey]: {...ruleForms[parentKey], limit_type: e.target.value}})}>
                                                                                        <option value="FLAT_AMOUNT">₹</option>
                                                                                        <option value="PERCENTAGE_OF_WALLET">%</option>
                                                                                    </select>
                                                                                    <input type="number" className="p-1.5 border border-blue-200 bg-white rounded-lg text-xs outline-none w-20 font-bold" value={ruleForms[parentKey].limit_value} onChange={(e) => setRuleForms({...ruleForms, [parentKey]: {...ruleForms[parentKey], limit_value: e.target.value}})} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {cat.subcategories.map(sub => {
                                                                        const subKey = `${cat.name}:${sub}`;
                                                                        const isSubEnabled = ruleForms[subKey]?.enabled || false;
                                                                        
                                                                        return (
                                                                            <div key={sub} className={`p-4 flex items-center justify-between pl-16 hover:bg-white transition-colors ${isSubEnabled ? 'bg-emerald-50/10' : ''}`}>
                                                                                <div className="font-medium text-slate-700 text-sm">{sub}</div>
                                                                                <div className="flex items-center gap-4">
                                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                                        <input 
                                                                                            type="checkbox" 
                                                                                            className="sr-only peer" 
                                                                                            checked={isSubEnabled}
                                                                                            onChange={(e) => {
                                                                                                setRuleForms({
                                                                                                    ...ruleForms,
                                                                                                    [subKey]: { ...ruleForms[subKey], enabled: e.target.checked }
                                                                                                });
                                                                                            }}
                                                                                        />
                                                                                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                                                    </label>
                                                                                    {isSubEnabled && (
                                                                                        <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                                                                                            <select className="p-1.5 border border-emerald-200 bg-white rounded-lg text-xs outline-none" value={ruleForms[subKey].limit_type} onChange={(e) => setRuleForms({...ruleForms, [subKey]: {...ruleForms[subKey], limit_type: e.target.value}})}>
                                                                                                <option value="FLAT_AMOUNT">₹</option>
                                                                                                <option value="PERCENTAGE_OF_WALLET">%</option>
                                                                                            </select>
                                                                                            <input type="number" className="p-1.5 border border-emerald-200 bg-white rounded-lg text-xs outline-none w-20 font-bold" value={ruleForms[subKey].limit_value} onChange={(e) => setRuleForms({...ruleForms, [subKey]: {...ruleForms[subKey], limit_value: e.target.value}})} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="space-y-6 max-w-4xl mx-auto mb-10">
                                                {/* Receiver Target Cards */}
                                                <div className="grid grid-cols-1 gap-6">
                                                    {(targetType === 'SPECIFIC_USER' ? assignedUserIds : [null]).map((targetId) => {
                                                        const key = targetId ? `USER_${targetId}` : `ALL_${userCategory}`;
                                                        const targetUser = targetableUsers.find(u => u.id === targetId);
                                                        const ruleSet = receiverSenderRules[key] || { globalLimit: '', senderLimits: [] };

                                                        return (
                                                            <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                                                <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-600">
                                                                            <User className="w-6 h-6" />
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
                                                                                {targetId ? (targetUser?.name || 'Loading...') : `ALL ${userCategory}S`}
                                                                            </h3>
                                                                            <div className="flex gap-3 text-[10px] font-bold text-slate-500 mt-0.5">
                                                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{targetId ? targetUser?.mobile_number : 'Global Target'}</span>
                                                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 uppercase">{targetId ? targetUser?.role : userCategory}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Default Receiving Limit (from all)</p>
                                                                            <div className="relative">
                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                                                <input 
                                                                                    type="number"
                                                                                    className="p-2.5 pl-7 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500 w-32"
                                                                                    placeholder="Limit"
                                                                                    value={ruleSet.globalLimit}
                                                                                    onChange={(e) => {
                                                                                        const updated = { ...receiverSenderRules };
                                                                                        updated[key].globalLimit = e.target.value;
                                                                                        setReceiverSenderRules(updated);
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-6 space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sender-Specific Exceptions ({ruleSet.senderLimits.length})</h4>
                                                                        <button 
                                                                            onClick={() => {
                                                                                setActiveReceiverForSender(key);
                                                                                setIsSenderSelectionOpen(true);
                                                                            }}
                                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-sm"
                                                                        >
                                                                            <Plus className="w-3 h-3" /> Add Sender Rule
                                                                        </button>
                                                                    </div>

                                                                    {ruleSet.senderLimits.length === 0 ? (
                                                                        <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                                                            <p className="text-xs text-slate-400 font-medium">No specific sender rules set. Default limit will apply to everyone.</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {ruleSet.senderLimits.map((sr: any, idx: number) => {
                                                                                const senderUser = targetableUsers.find(u => u.id === sr.senderId);
                                                                                return (
                                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-all group">
                                                                                        <div className="flex items-center gap-3 truncate">
                                                                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                                                                                {senderUser?.name?.[0] || 'S'}
                                                                                            </div>
                                                                                            <div className="truncate">
                                                                                                <p className="text-xs font-bold text-slate-800 truncate">{senderUser?.name || 'Unknown Sender'}</p>
                                                                                                <p className="text-[10px] text-slate-500 font-medium">{senderUser?.mobile_number}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className="relative">
                                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                                                                                                <input 
                                                                                                    type="number"
                                                                                                    className="p-1.5 pl-5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-20"
                                                                                                    value={sr.amount}
                                                                                                    onChange={(e) => {
                                                                                                        const updated = { ...receiverSenderRules };
                                                                                                        updated[key].senderLimits[idx].amount = e.target.value;
                                                                                                        setReceiverSenderRules(updated);
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    const updated = { ...receiverSenderRules };
                                                                                                    updated[key].senderLimits.splice(idx, 1);
                                                                                                    setReceiverSenderRules(updated);
                                                                                                }}
                                                                                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                                            >
                                                                                                <X className="w-4 h-4" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
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
            {/* Tiered Capacity Rules Modal */}
            {capacityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                 <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                                     <Banknote size={22} className="text-emerald-600" /> Tiered Capacity Rules
                                 </h3>
                                 <p className="text-sm text-slate-500 mt-1">Restrict spending based on loan plans and wallet balance tiers.</p>
                            </div>
                            <button onClick={() => setCapacityModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"><X size={20}/></button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            <form onSubmit={handleSaveTieredRules} className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configure Rule Parameters</h4>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Target Role</label>
                                        <select 
                                            value={tieredUserCategory} 
                                            onChange={(e) => setTieredUserCategory(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Select Loan Plan</label>
                                        <select 
                                            value={selectedTieredLoanPlanId} 
                                            onChange={(e) => setSelectedTieredLoanPlanId(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                        >
                                            <option value="">Any Plan / Global</option>
                                            {loanPlans.map(plan => (
                                                <option key={plan.id} value={plan.id}>{plan.name} (₹{plan.amount})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>


                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Defined Tiers</h4>
                                        <button 
                                            type="button" 
                                            onClick={addTieredTier}
                                            className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700"
                                        >
                                            <Plus size={14} /> Add Tier
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {tieredTiers.map((tier, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-3 items-end animate-in slide-in-from-left-2 transition-all">
                                                <div className="col-span-5">
                                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Min Wallet Balance Required</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-slate-400 font-bold text-xs">₹</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            value={tier.minBalance}
                                                            onChange={(e) => updateTieredTier(idx, 'minBalance', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                                            placeholder="e.g. 15000"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-5">
                                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Spend Limit (%)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            max="100"
                                                            value={tier.spendPercentage}
                                                            onChange={(e) => updateTieredTier(idx, 'spendPercentage', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                                            placeholder="e.g. 5"
                                                        />
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                            <span className="text-slate-400 font-bold text-xs">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeTieredTier(idx)}
                                                        disabled={tieredTiers.length === 1}
                                                        className="w-full bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-0"
                                                    >
                                                        <Trash2 size={16} className="mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Users (Empty = Apply to Role)</h4>
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={selectAllFilteredCapacity}
                                                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition"
                                            >
                                                Select All Results
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deselectAllFilteredCapacity}
                                                className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition"
                                            >
                                                Clear Results
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search users to target..."
                                            value={userFilters.search}
                                            onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50 p-1 space-y-1 shadow-inner">
                                        {searching ? (
                                            <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading users...</div>
                                        ) : filteredUsersList.length > 0 ? (
                                            filteredUsersList.map(user => (
                                                <div 
                                                    key={user.id}
                                                    onClick={() => toggleTargetUser(user.id)}
                                                    className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition-all ${selectedTargetUserIds.includes(user.id) ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-white border border-transparent'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${selectedTargetUserIds.includes(user.id) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                            {user.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">{user.mobile_number} • {user.role}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedTargetUserIds.includes(user.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                                                        {selectedTargetUserIds.includes(user.id) && <CheckCircle size={12} className="text-white" />}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center text-slate-400 text-sm italic">
                                                No users match your criteria
                                            </div>
                                        )}
                                    </div>

                                    {selectedTargetUserIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md">
                                                {selectedTargetUserIds.length} Total Users Selected
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={() => setSelectedTargetUserIds([])}
                                                className="text-[10px] font-black text-red-500 uppercase hover:underline"
                                            >
                                                Unselect All
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? 'Processing...' : 'SAVE TIERED RULES'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Sender Selection Overlay (for Receiver Mapping) */}
            {isSenderSelectionOpen && activeReceiverForSender && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[70vh] max-h-[600px] overflow-hidden animate-in zoom-in-95">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Select Senders</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Map specific users to this receiver</p>
                            </div>
                            <button 
                                onClick={() => setIsSenderSelectionOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar & Filters */}
                        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:border-blue-500 focus:bg-white transition-all"
                                    placeholder="Search by name, mobile, or business..."
                                    value={senderSearch}
                                    onChange={(e) => setSenderSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {['ALL', 'MERCHANT', 'CUSTOMER', 'STUDENT'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedProfile(role)}
                                            className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${selectedProfile === role ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {role}S
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => {
                                            const updated = { ...receiverSenderRules };
                                            const currentLimits = [...updated[activeReceiverForSender].senderLimits];
                                            filteredSendersList.forEach(u => {
                                                if (!currentLimits.find(sl => sl.senderId === u.id)) {
                                                    currentLimits.push({ senderId: u.id, amount: '' });
                                                }
                                            });
                                            updated[activeReceiverForSender].senderLimits = currentLimits;
                                            setReceiverSenderRules(updated);
                                        }}
                                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const updated = { ...receiverSenderRules };
                                            const filteredIds = filteredSendersList.map(u => u.id);
                                            updated[activeReceiverForSender].senderLimits = updated[activeReceiverForSender].senderLimits.filter(
                                                (sl: any) => !filteredIds.includes(sl.senderId)
                                            );
                                            setReceiverSenderRules(updated);
                                        }}
                                        className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30 space-y-1">
                            {filteredSendersList.length > 0 ? (
                                filteredSendersList.map(user => {
                                    const isSelected = receiverSenderRules[activeReceiverForSender]?.senderLimits.some((sl: any) => sl.senderId === user.id);
                                    
                                    return (
                                        <div 
                                            key={user.id} 
                                            onClick={() => {
                                                const updated = { ...receiverSenderRules };
                                                const currentLimits = updated[activeReceiverForSender].senderLimits;
                                                const exists = currentLimits.find((sl: any) => sl.senderId === user.id);
                                                
                                                if (exists) {
                                                    updated[activeReceiverForSender].senderLimits = currentLimits.filter((sl: any) => sl.senderId !== user.id);
                                                } else {
                                                    updated[activeReceiverForSender].senderLimits = [...currentLimits, { senderId: user.id, amount: '' }];
                                                }
                                                setReceiverSenderRules(updated);
                                            }}
                                            className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition-all border ${isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100/50' : 'hover:bg-white bg-transparent border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                    {user.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{user.mobile_number} • {user.role}</p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                {isSelected && <CheckCircle size={12} className="text-white" />}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-10 text-center text-slate-400 text-sm italic">
                                    No users found matching "{senderSearch}"
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {receiverSenderRules[activeReceiverForSender]?.senderLimits.length || 0} Selected
                            </span>
                            <button 
                                onClick={() => setIsSenderSelectionOpen(false)}
                                className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
