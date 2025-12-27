'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle,
    XCircle,
    Sparkles,
    Filter,
    Eye,
    EyeOff,
    Zap
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BulkReviewToolbarProps {
    fields: any[];
    onBulkAction: (action: BulkAction, fields: any[]) => Promise<void>;
    selectedFields?: string[];
    onSelectionChange?: (fieldIds: string[]) => void;
    inline?: boolean; // New prop for inline mode
}

export type BulkAction =
    | 'approve-high-confidence'
    | 'approve-all-pending'
    | 'reject-low-confidence'
    | 'flag-for-review'
    | 'hide-approved'
    | 'show-all';

export default function BulkReviewToolbar({
    fields,
    onBulkAction,
    selectedFields = [],
    onSelectionChange,
    inline = false,
}: BulkReviewToolbarProps) {
    const { toast } = useToast();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        action: BulkAction;
        fields: any[];
        description: string;
    } | null>(null);

    // Calculate stats
    const highConfidenceFields = fields.filter(f => (f.confidence_score || 0) >= 0.95 && f.review_status === 'pending');
    const mediumConfidenceFields = fields.filter(f => (f.confidence_score || 0) >= 0.7 && (f.confidence_score || 0) < 0.95 && f.review_status === 'pending');
    const lowConfidenceFields = fields.filter(f => (f.confidence_score || 0) < 0.7 && f.review_status === 'pending');
    const approvedFields = fields.filter(f => f.review_status === 'approved');
    const pendingFields = fields.filter(f => f.review_status === 'pending');
    const flaggedFields = fields.filter(f => f.has_conflict || f.review_status === 'rejected');

    const handleBulkAction = async (action: BulkAction) => {
        let targetFields: any[] = [];
        let description = '';

        switch (action) {
            case 'approve-high-confidence':
                targetFields = highConfidenceFields;
                description = `Auto-approve ${targetFields.length} high-confidence fields (≥95%)? These appear highly accurate and can be safely approved.`;
                break;

            case 'approve-all-pending':
                targetFields = pendingFields;
                description = `Approve all ${targetFields.length} pending fields? This will mark the entire contract as reviewed.`;
                break;

            case 'reject-low-confidence':
                targetFields = lowConfidenceFields;
                description = `Flag ${targetFields.length} low-confidence fields (<70%) for manual review? These may need corrections.`;
                break;

            case 'flag-for-review':
                targetFields = mediumConfidenceFields;
                description = `Flag ${targetFields.length} medium-confidence fields (70-95%) for closer inspection?`;
                break;

            case 'hide-approved':
            case 'show-all':
                // These don't need confirmation
                await onBulkAction(action, []);
                return;
        }

        if (targetFields.length === 0) {
            toast({
                title: 'No fields to process',
                description: 'There are no fields matching this criteria.',
                variant: 'default',
            });
            return;
        }

        setPendingAction({ action, fields: targetFields, description });
        setShowConfirmDialog(true);
    };

    const confirmAction = async () => {
        if (!pendingAction) return;

        try {
            await onBulkAction(pendingAction.action, pendingAction.fields);

            toast({
                title: 'Bulk action completed',
                description: `Successfully processed ${pendingAction.fields.length} fields.`,
            });

            setShowConfirmDialog(false);
            setPendingAction(null);
        } catch (error: any) {
            toast({
                title: 'Error processing bulk action',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const getReviewProgress = () => {
        const total = fields.length;
        const reviewed = approvedFields.length + flaggedFields.length;
        return Math.round((reviewed / total) * 100);
    };

    // Inline mode - just the action buttons
    if (inline) {
        return (
            <>
                {highConfidenceFields.length > 0 && (
                    <Button
                        onClick={() => handleBulkAction('approve-high-confidence')}
                        size="sm"
                        className="gap-1 bg-green-600 hover:bg-green-700 h-7 px-2.5"
                    >
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">Auto {highConfidenceFields.length}</span>
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 border-slate-200 hover:bg-slate-50 h-7 px-2.5">
                            <Sparkles className="h-3 w-3" />
                            <span className="text-xs">Bulk</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Smart Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('approve-high-confidence')}
                                    disabled={highConfidenceFields.length === 0}
                                    className="gap-2"
                                >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div className="flex-1">
                                        <div className="font-medium">Auto-Approve High-Confidence</div>
                                        <div className="text-xs text-muted-foreground">
                                            {highConfidenceFields.length} fields ≥95%
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('flag-for-review')}
                                    disabled={mediumConfidenceFields.length === 0}
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4 text-orange-600" />
                                    <div className="flex-1">
                                        <div className="font-medium">Flag Medium-Confidence</div>
                                        <div className="text-xs text-muted-foreground">
                                            {mediumConfidenceFields.length} fields 70-95%
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('reject-low-confidence')}
                                    disabled={lowConfidenceFields.length === 0}
                                    className="gap-2"
                                >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <div className="flex-1">
                                        <div className="font-medium">Flag Low-Confidence</div>
                                        <div className="text-xs text-muted-foreground">
                                            {lowConfidenceFields.length} fields {'<'}70%
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('approve-all-pending')}
                                    disabled={pendingFields.length === 0}
                                    className="gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    <div className="flex-1">
                                        <div className="font-medium">Approve All Pending</div>
                                        <div className="text-xs text-muted-foreground">
                                            {pendingFields.length} fields
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel>View Options</DropdownMenuLabel>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('hide-approved')}
                                    className="gap-2"
                                >
                                    <EyeOff className="h-4 w-4" />
                                    Hide Approved Fields
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('show-all')}
                                    className="gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Show All Fields
                                </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Confirmation Dialog */}
                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                            <AlertDialogDescription>
                                {pendingAction?.description}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmAction}>
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    // Full toolbar mode
    return (
        <>
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Left: Stats */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-black text-blue-600">
                                {getReviewProgress()}%
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                    Progress
                                </div>
                                <div className="text-xs text-slate-500">
                                    {approvedFields.length}/{fields.length} reviewed
                                </div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1.5 bg-green-50 border-green-200 text-green-700 font-semibold">
                                <CheckCircle className="h-3 w-3" />
                                {approvedFields.length}
                            </Badge>
                            <Badge variant="outline" className="gap-1.5 bg-blue-50 border-blue-200 text-blue-700 font-semibold">
                                <Eye className="h-3 w-3" />
                                {pendingFields.length}
                            </Badge>
                            {flaggedFields.length > 0 && (
                                <Badge variant="outline" className="gap-1.5 bg-orange-50 border-orange-200 text-orange-700 font-semibold">
                                    <XCircle className="h-3 w-3" />
                                    {flaggedFields.length}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {highConfidenceFields.length > 0 && (
                            <Button
                                onClick={() => handleBulkAction('approve-high-confidence')}
                                className="gap-2 bg-green-600 hover:bg-green-700 shadow-sm font-semibold"
                            >
                                <Zap className="h-4 w-4" />
                                Auto-Approve {highConfidenceFields.length}
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50 font-semibold">
                                    <Sparkles className="h-4 w-4" />
                                    Bulk Actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel>Smart Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('approve-high-confidence')}
                                    disabled={highConfidenceFields.length === 0}
                                    className="gap-2"
                                >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div className="flex-1">
                                        <div className="font-medium">Auto-Approve High-Confidence</div>
                                        <div className="text-xs text-muted-foreground">
                                            {highConfidenceFields.length} fields ≥95%
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('flag-for-review')}
                                    disabled={mediumConfidenceFields.length === 0}
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4 text-orange-600" />
                                    <div className="flex-1">
                                        <div className="font-medium">Flag Medium-Confidence</div>
                                        <div className="text-xs text-muted-foreground">
                                            {mediumConfidenceFields.length} fields 70-95%
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('reject-low-confidence')}
                                    disabled={lowConfidenceFields.length === 0}
                                    className="gap-2"
                                >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <div className="flex-1">
                                        <div className="font-medium">Flag Low-Confidence</div>
                                        <div className="text-xs text-muted-foreground">
                                            {lowConfidenceFields.length} fields {'<'}70%
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('approve-all-pending')}
                                    disabled={pendingFields.length === 0}
                                    className="gap-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    <div className="flex-1">
                                        <div className="font-medium">Approve All Pending</div>
                                        <div className="text-xs text-muted-foreground">
                                            {pendingFields.length} fields
                                        </div>
                                    </div>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuLabel>View Options</DropdownMenuLabel>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('hide-approved')}
                                    className="gap-2"
                                >
                                    <EyeOff className="h-4 w-4" />
                                    Hide Approved Fields
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={() => handleBulkAction('show-all')}
                                    className="gap-2"
                                >
                                    <Eye className="h-4 w-4" />
                                    Show All Fields
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-slate-200">
                    <div
                        className={cn(
                            "h-full transition-all duration-500",
                            getReviewProgress() === 100 ? "bg-green-500" : "bg-blue-500"
                        )}
                        style={{ width: `${getReviewProgress()}%` }}
                    />
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAction?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
