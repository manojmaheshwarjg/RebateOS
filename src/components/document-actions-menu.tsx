'use client';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MoreVertical,
    Download,
    Trash2,
    RefreshCw,
    FileEdit,
    Star,
    StarOff,
    Link2,
    ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DocumentAction {
    type: 'delete' | 'retry' | 'download' | 'markPrimary' | 'linkAmendment' | 'openExternal';
    label: string;
    icon: React.ReactNode;
    variant?: 'default' | 'destructive';
    requiresConfirmation?: boolean;
    confirmationTitle?: string;
    confirmationDescription?: string;
}

interface DocumentActionsMenuProps {
    file: any;
    onAction: (fileId: string, action: string) => void | Promise<void>;
    isPrimary?: boolean;
    disabled?: boolean;
}

export default function DocumentActionsMenu({
    file,
    onAction,
    isPrimary = false,
    disabled = false,
}: DocumentActionsMenuProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    const actions: DocumentAction[] = [
        {
            type: 'download',
            label: 'Download',
            icon: <Download className="h-4 w-4" />,
        },
        {
            type: 'openExternal',
            label: 'Open in New Tab',
            icon: <ExternalLink className="h-4 w-4" />,
        },
        {
            type: 'markPrimary',
            label: isPrimary ? 'Remove as Primary' : 'Mark as Primary',
            icon: isPrimary ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />,
        },
        {
            type: 'retry',
            label: 'Retry Processing',
            icon: <RefreshCw className="h-4 w-4" />,
        },
        {
            type: 'linkAmendment',
            label: 'Link as Amendment',
            icon: <Link2 className="h-4 w-4" />,
        },
        {
            type: 'delete',
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive',
            requiresConfirmation: true,
            confirmationTitle: 'Delete document?',
            confirmationDescription:
                'This will permanently delete this file and all extracted fields. This action cannot be undone.',
        },
    ];

    const handleAction = async (action: DocumentAction) => {
        if (action.requiresConfirmation) {
            setPendingAction(action.type);
            setShowDeleteDialog(true);
        } else {
            await onAction(file.id, action.type);
        }
    };

    const handleConfirmDelete = async () => {
        if (pendingAction) {
            await onAction(file.id, pendingAction);
            setShowDeleteDialog(false);
            setPendingAction(null);
        }
    };

    const getActionAvailability = (action: DocumentAction): { available: boolean; reason?: string } => {
        switch (action.type) {
            case 'retry':
                if (file.parsing_status === 'processing') {
                    return { available: false, reason: 'Already processing' };
                }
                if (file.parsing_status === 'completed') {
                    return { available: true };
                }
                return { available: true };

            case 'delete':
                // Can't delete if it's the only file
                return { available: true };

            case 'markPrimary':
                return { available: true };

            default:
                return { available: true };
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={disabled}
                    >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center justify-between">
                        <span className="truncate max-w-[150px]">{file.file_name}</span>
                        {isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                                Primary
                            </Badge>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {actions.map((action) => {
                        const { available, reason } = getActionAvailability(action);

                        return (
                            <DropdownMenuItem
                                key={action.type}
                                onClick={() => handleAction(action)}
                                disabled={!available}
                                className={cn(
                                    action.variant === 'destructive' &&
                                        'text-red-600 focus:text-red-600 focus:bg-red-50'
                                )}
                            >
                                <span className="mr-2">{action.icon}</span>
                                <span className="flex-1">{action.label}</span>
                                {!available && reason && (
                                    <span className="text-xs text-muted-foreground ml-2">({reason})</span>
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete document?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{file.file_name}</strong> and all extracted
                            fields from this contract. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Document
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
