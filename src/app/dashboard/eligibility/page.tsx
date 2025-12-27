'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EligibilityQueueTable from '@/components/eligibility-queue-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Play,
    PlusCircle,
    Settings2,
    Upload,
    XCircle,
    Zap,
    Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import NewClaimForm from '@/components/new-claim-form';
import BulkClaimImportForm from '@/components/bulk-claim-import-form';
import { useToast } from '@/hooks/use-toast';

export default function EligibilityPage() {
    const { toast } = useToast();
    const [isNewClaimDialogOpen, setIsNewClaimDialogOpen] = useState(false);
    const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
    const [isRunningRules, setIsRunningRules] = useState(false);
    const [autoEligibility, setAutoEligibility] = useState(true);
    const [duplicateCheck340B, setDuplicateCheck340B] = useState(true);
    const [ruleProgress, setRuleProgress] = useState(0);
    const [showRulesConfig, setShowRulesConfig] = useState(false);

    // Mock stats
    const stats = {
        pending: 24,
        approved: 156,
        rejected: 12,
        flagged: 5,
    };

    const handleRunRules = async () => {
        setIsRunningRules(true);
        setRuleProgress(0);
        // Simulate rule execution progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            setRuleProgress(i);
        }
        setIsRunningRules(false);
        toast({
            title: 'Rule Execution Complete',
            description: '24 claims processed: 18 approved, 3 rejected, 3 require review.',
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Eligibility Engine</h1>
                        <p className="text-sm text-slate-500">Automated claim validation and 340B qualification.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex gap-2 mr-4 border-r border-slate-200 pr-4">
                            <Dialog open={showRulesConfig} onOpenChange={setShowRulesConfig}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 text-slate-600 hover:text-slate-900">
                                        <Settings2 className="mr-2 h-4 w-4" /> Config
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Eligibility Settings</DialogTitle>
                                        <DialogDescription>Configure automated check rules.</DialogDescription>
                                    </DialogHeader>
                                    {/* Config content */}
                                    <div className="space-y-4 py-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Auto-Run Rules</Label>
                                            <Switch checked={autoEligibility} onCheckedChange={setAutoEligibility} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label>340B Duplicate Check</Label>
                                            <Switch checked={duplicateCheck340B} onCheckedChange={setDuplicateCheck340B} />
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={() => setShowRulesConfig(false)}>Save</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Button
                            onClick={handleRunRules}
                            disabled={isRunningRules}
                            className="bg-indigo-600 text-white hover:bg-indigo-700 h-9 shadow-sm border border-indigo-700"
                        >
                            {isRunningRules ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Zap className="mr-2 h-4 w-4" /> Run Rules</>}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-6">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="rounded-md border-slate-200 shadow-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Loader2 className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium text-slate-500">Pending Review</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-md border-slate-200 shadow-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-medium text-slate-500">Approved</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-md border-slate-200 shadow-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-rose-500" />
                                <span className="text-sm font-medium text-slate-500">Rejected</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.rejected}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-md text-amber-900 border-amber-200 bg-amber-50 shadow-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-800">340B Flagged</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-900">{stats.flagged}</p>
                        </CardContent>
                    </Card>
                </div>

                {isRunningRules && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-6">
                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${ruleProgress}%` }}></div>
                    </div>
                )}

                {/* Main Content */}
                <div className="rounded-md border border-slate-200 bg-white shadow-none">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Eligibility Queue</h3>
                        <div className="flex gap-2">
                            <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 border-slate-300">
                                        <Upload className="mr-2 h-3.5 w-3.5" /> Import CSV
                                    </Button>
                                </DialogTrigger>
                                <DialogContent><DialogHeader><DialogTitle>Bulk Import</DialogTitle></DialogHeader><BulkClaimImportForm onImportComplete={() => setIsBulkImportDialogOpen(false)} /></DialogContent>
                            </Dialog>

                            <Dialog open={isNewClaimDialogOpen} onOpenChange={setIsNewClaimDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="h-8 bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-700 shadow-sm">
                                        <PlusCircle className="mr-2 h-3.5 w-3.5" /> Manual Claim
                                    </Button>
                                </DialogTrigger>
                                <DialogContent><DialogHeader><DialogTitle>New Claim</DialogTitle></DialogHeader><NewClaimForm onClaimAdded={() => setIsNewClaimDialogOpen(false)} /></DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    <div className="p-0">
                        {/* Reusing existing table component but it fits well structurally */}
                        <EligibilityQueueTable />
                    </div>
                </div>
            </main>
        </div>
    );
}
