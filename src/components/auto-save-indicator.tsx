import { SaveStatus } from '@/hooks/use-auto-save';
import { Loader2, Check, AlertCircle, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AutoSaveIndicatorProps {
    status: SaveStatus;
    lastSaved: Date | null;
    error?: string | null;
}

export function AutoSaveIndicator({ status, lastSaved, error }: AutoSaveIndicatorProps) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {status === 'saving' && (
                <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-muted-foreground">Saving...</span>
                </>
            )}

            {status === 'saved' && (
                <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Saved</span>
                </>
            )}

            {status === 'error' && (
                <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{error || 'Failed to save'}</span>
                </>
            )}

            {status === 'idle' && lastSaved && (
                <>
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">
                        Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                    </span>
                </>
            )}
        </div>
    );
}
