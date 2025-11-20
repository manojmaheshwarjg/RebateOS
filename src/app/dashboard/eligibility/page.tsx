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
    Zap
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
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-muted-foreground">Pending</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">Approved</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.approved}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-muted-foreground">Rejected</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.rejected}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-muted-foreground">Flagged (340B)</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.flagged}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleRunRules}
                        disabled={isRunningRules}
                        className="bg-primary"
                    >
                        {isRunningRules ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Running Rules...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Run Eligibility Rules
                            </>
                        )}
                    </Button>
                    <Dialog open={showRulesConfig} onOpenChange={setShowRulesConfig}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Eligibility Engine Settings</DialogTitle>
                                <DialogDescription>
                                    Configure automated eligibility checking
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Auto-Run Eligibility Rules</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically check new claims
                                        </p>
                                    </div>
                                    <Switch
                                        checked={autoEligibility}
                                        onCheckedChange={setAutoEligibility}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>340B Duplicate Discount Check</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Flag potential 340B/Medicaid conflicts
                                        </p>
                                    </div>
                                    <Switch
                                        checked={duplicateCheck340B}
                                        onCheckedChange={setDuplicateCheck340B}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setShowRulesConfig(false)}>
                                    Save Settings
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Bulk Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Import Claims</DialogTitle>
                            </DialogHeader>
                            <BulkClaimImportForm onImportComplete={() => setIsBulkImportDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isNewClaimDialogOpen} onOpenChange={setIsNewClaimDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Claim
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Claim</DialogTitle>
                            </DialogHeader>
                            <NewClaimForm onClaimAdded={() => setIsNewClaimDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Rule Progress Bar */}
            {isRunningRules && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Processing claims...</span>
                                <span>{ruleProgress}%</span>
                            </div>
                            <Progress value={ruleProgress} />
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Eligibility Queue</CardTitle>
                            <CardDescription>Manage the eligibility queue and review claims that are pending review.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {autoEligibility && (
                                <Badge variant="outline" className="bg-green-50">
                                    <CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />
                                    Auto-Check Enabled
                                </Badge>
                            )}
                            {duplicateCheck340B && (
                                <Badge variant="outline" className="bg-blue-50">
                                    340B Shield Active
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <EligibilityQueueTable />
                </CardContent>
            </Card>
        </div>
    );
}
