'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, IndianRupee, AlertTriangle, ArrowUpRight, TrendingDown, History, Sparkles } from 'lucide-react';
import FundHistoryModal from './FundHistoryModal';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface FundStats {
    total_funds: number;
    available_funds: number;
    reserved_funds: number;
    disbursed_funds: number;
    sub_user_capitals_pool: number;
    outstanding_amount: number;
    overdue_amount: number;
    profit_collection: number;
    fee_collection: number;
    total_profit: number;
    cashback_transfer: number;
}

export default function FundsCard() {
    const router = useRouter();
    const [stats, setStats] = useState<FundStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [addAmount, setAddAmount] = useState('');
    const [editTotal, setEditTotal] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await apiFetch('/admin/funds/stats');
            setStats(data);
            setEditTotal(data.total_funds.toString());
        } catch (error) {
            console.error("Failed to fetch fund stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleAddFunds = async () => {
        try {
            await apiFetch('/admin/funds/add', {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(addAmount) })
            });

            toast.success("Capital added successfully");
            fetchStats();
            setIsAddOpen(false);
            setAddAmount('');
        } catch (error) {
            toast.error("Error adding funds");
        }
    };

    const handleUpdateFunds = async () => {
        try {
            const data = await apiFetch('/admin/funds/update', {
                method: 'POST',
                body: JSON.stringify({ total_funds: parseFloat(editTotal) })
            });

            toast.success("Capital pool updated successfully");
            if (data.message === 'No changes made') {
                toast.info(data.message);
            }
            fetchStats();
            setIsEditOpen(false);
        } catch (error) {
            toast.error("Error updating funds");
        }
    };

    if (loading) return <div className="h-40 animate-pulse bg-slate-100 rounded-xl" />;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-100">Total Capital (Principal)</CardTitle>
                        <Wallet className="h-4 w-4 text-indigo-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.total_funds.toLocaleString()}</div>
                        <p className="text-xs text-indigo-200 mt-1">Lendable Capital</p>
                        <div className="mt-4 flex gap-2">
                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="secondary" className="w-full text-xs h-7 bg-white/20 hover:bg-white/30 text-white border-0">
                                        <ArrowUpRight className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Capital to Pool</DialogTitle>
                                        <DialogDescription>Increase the total lendable principal capital. This does not affect interest/profit buckets.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                value={addAmount}
                                                onChange={(e) => setAddAmount(e.target.value)}
                                                placeholder="e.g. 50000"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddFunds}>Confirm Add</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="secondary" className="w-full text-xs h-7 bg-white/10 hover:bg-white/20 text-white border-0">
                                        Edit Total
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-red-600 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5" />
                                            Adjust Capital Pool
                                        </DialogTitle>
                                        <DialogDescription className="text-red-900 bg-red-50 p-3 rounded-md mt-2 border border-red-100">
                                            <strong>Warning:</strong> Reducing the total capital pool will <u>proportionally reduce</u> the reserved amounts for all pending loans. Profit amounts are not affected.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>New Total Capital Value (₹)</Label>
                                            <Input
                                                type="number"
                                                value={editTotal}
                                                onChange={(e) => setEditTotal(e.target.value)}
                                            />
                                            <p className="text-xs text-slate-500">Current Capital: ₹{stats?.total_funds.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="destructive" onClick={handleUpdateFunds}>Update & Reconcile</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setIsHistoryOpen(true)}
                                className="w-full text-xs h-7 bg-white/10 hover:bg-white/20 text-white border-0"
                            >
                                <History className="w-3 h-3 mr-1" /> History
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <FundHistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                />

                <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-100">Total Profit Collection</CardTitle>
                        <TrendingDown className="h-4 w-4 text-emerald-100 rotate-180" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.total_profit.toLocaleString()}</div>
                        <p className="text-xs text-emerald-200 mt-1">Total (Interest + Fees)</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Available to Lend</CardTitle>
                        <IndianRupee className="h-4 w-4 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.available_funds.toLocaleString()}</div>
                        <p className="text-xs text-blue-200 mt-1">Remaining principal reserve</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-cyan-100">Sub-User Limit Pool</CardTitle>
                        <IndianRupee className="h-4 w-4 text-cyan-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.sub_user_capitals_pool?.toLocaleString()}</div>
                        <p className="text-xs text-cyan-200 mt-1">Total limits assigned</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Total Disbursed</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.disbursed_funds.toLocaleString()}</div>
                        <p className="text-xs text-slate-300 mt-1">Principal out in market</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 lg:grid-rows-1">
                <Card className="border-green-100 bg-green-50/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Interest Earned</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">₹{stats?.profit_collection?.toLocaleString()}</div>
                        <p className="text-xs text-green-600 mt-1">Interest collected from loans</p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-100 bg-emerald-50/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700">Loan Fee Income</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">₹{stats?.fee_collection?.toLocaleString()}</div>
                        <p className="text-xs text-emerald-600 mt-1">Processing fees + Platform charges</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-100 bg-blue-50/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Outstanding Principal</CardTitle>
                        <TrendingDown className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">₹{stats?.outstanding_amount?.toLocaleString()}</div>
                        <p className="text-xs text-blue-600 mt-1">Pending principal recovery</p>
                    </CardContent>
                </Card>

                <Card className="border-red-100 bg-red-50/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Overdue Amount</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">₹{stats?.overdue_amount?.toLocaleString()}</div>
                        <p className="text-xs text-red-600 mt-1">Total past due EMI</p>
                    </CardContent>
                </Card>

                <Card className="border-purple-100 bg-purple-50/30 cursor-pointer hover:bg-purple-100/50 transition-colors" onClick={() => router.push('/cashback-logs')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">Cashback Paid</CardTitle>
                        <TrendingDown className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">₹{stats?.cashback_transfer?.toLocaleString()}</div>
                        <p className="text-xs text-purple-600 mt-1">Rewards & Bonuses</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
