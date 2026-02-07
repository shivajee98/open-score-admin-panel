'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, IndianRupee, AlertTriangle, ArrowUpRight, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface FundStats {
    total_funds: number;
    available_funds: number;
    reserved_funds: number;
    disbursed_funds: number;
}

export default function FundsCard() {
    const [stats, setStats] = useState<FundStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [addAmount, setAddAmount] = useState('');
    const [editTotal, setEditTotal] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/funds/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setEditTotal(data.total_funds.toString());
            }
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/funds/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: parseFloat(addAmount) })
            });

            if (res.ok) {
                toast.success("Funds added successfully");
                fetchStats();
                setIsAddOpen(false);
                setAddAmount('');
            } else {
                toast.error("Failed to add funds");
            }
        } catch (error) {
            toast.error("Error adding funds");
        }
    };

    const handleUpdateFunds = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/funds/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ total_funds: parseFloat(editTotal) })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Funds updated successfully");
                if (data.message === 'No changes made') {
                    toast.info(data.message);
                }
                fetchStats();
                setIsEditOpen(false);
            } else {
                toast.error(data.error || "Failed to update funds");
            }
        } catch (error) {
            toast.error("Error updating funds");
        }
    };

    if (loading) return <div className="h-40 animate-pulse bg-slate-100 rounded-xl" />;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-100">Total Capital Pool</CardTitle>
                    <Wallet className="h-4 w-4 text-indigo-100" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{stats?.total_funds.toLocaleString()}</div>
                    <p className="text-xs text-indigo-200 mt-1">Source of Truth</p>
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
                                    <DialogDescription>Increase the total available liquidity. This does not affect existing allocations.</DialogDescription>
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
                                        Adjust Total Funds
                                    </DialogTitle>
                                    <DialogDescription className="text-red-900 bg-red-50 p-3 rounded-md mt-2 border border-red-100">
                                        <strong>Warning:</strong> Reducing the total fund pool will <u>proportionally reduce</u> the reserved amounts for all pending loans. Disbursed loans will not be affected.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>New Total Fund Value (₹)</Label>
                                        <Input
                                            type="number"
                                            value={editTotal}
                                            onChange={(e) => setEditTotal(e.target.value)}
                                        />
                                        <p className="text-xs text-slate-500">Current: ₹{stats?.total_funds.toLocaleString()}</p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="destructive" onClick={handleUpdateFunds}>Update & Reconcile</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Available to Lend</CardTitle>
                    <IndianRupee className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">₹{stats?.available_funds.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 mt-1">Ready for immediate allocation</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Reserved (Pending)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">₹{stats?.reserved_funds.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 mt-1">Allocated to approved loans</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Total Disbursed</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">₹{stats?.disbursed_funds.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 mt-1">Successfully lent out</p>
                </CardContent>
            </Card>
        </div>
    );
}
