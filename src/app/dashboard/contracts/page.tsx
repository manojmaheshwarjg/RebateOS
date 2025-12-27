'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ContractsTable from '@/components/contracts-table';
import AddContractDialog from '@/components/add-contract-dialog';
import { useLocalStorage } from '@/components/local-storage-provider';
import { cn } from '@/lib/utils';

export default function ContractsPage() {
    const { db, userId } = useLocalStorage();
    const [stats, setStats] = useState({
        total: 0,
        processing: 0,
        ready: 0,
        failed: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!userId) return;
            const [contracts, files] = await Promise.all([
                db.contracts.where('vendor_id').equals(userId).toArray(),
                db.contract_files.toArray(),
            ]);

            const processingCount = contracts.filter(c =>
                c.parsing_status === 'processing' || c.parsing_status === 'pending'
            ).length + files.filter(f =>
                f.parsing_status === 'processing' || f.parsing_status === 'pending'
            ).length;

            const readyCount = contracts.filter(c => c.status === 'active').length;
            const failedCount = files.filter(f => f.parsing_status === 'failed').length;

            setStats({
                total: contracts.length,
                processing: processingCount,
                ready: readyCount,
                failed: failedCount,
            });
        };

        fetchStats();
    }, [db, userId]);

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            {/* STICKY HEADER */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Contracts</h1>
                        <p className="text-sm text-slate-500">Manage your rebate agreements and compliance.</p>
                    </div>
                    <AddContractDialog>
                        <Button size="sm" className="h-9 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contract
                        </Button>
                    </AddContractDialog>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* METRICS GRID */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="rounded-md shadow-none border border-slate-200 bg-white">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                                Total Contracts
                                <FileText className="h-4 w-4 text-slate-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-md shadow-none border border-slate-200 bg-white">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                                Processing
                                <Clock className="h-4 w-4 text-slate-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold text-slate-900">{stats.processing}</div>
                            {stats.processing > 0 && <span className="text-xs text-amber-600 font-medium mt-1 block">Action Required</span>}
                        </CardContent>
                    </Card>

                    <Card className="rounded-md shadow-none border border-slate-200 bg-white">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                                Active / Ready
                                <CheckCircle className="h-4 w-4 text-slate-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold text-emerald-700">{stats.ready}</div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-md shadow-none border border-slate-200 bg-white">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                                Needs Attention
                                <AlertCircle className="h-4 w-4 text-slate-400" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold text-slate-900">{stats.failed}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* FILTERS & TABLE */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, vendor, or ID..."
                                className="pl-9 h-9 text-sm border-slate-300 rounded-md focus-visible:ring-slate-400 bg-white"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="h-9 border-slate-300 text-slate-700 bg-white rounded-md hover:bg-slate-50">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>

                    <Card className="rounded-md shadow-none border border-slate-200 bg-white overflow-hidden">
                        <ContractsTable />
                    </Card>
                </div>
            </main>
        </div>
    );
}
