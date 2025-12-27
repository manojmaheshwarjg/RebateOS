import { useEffect, useCallback } from 'react';

export interface ReviewShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    description: string;
    action: () => void;
}

interface UseReviewShortcutsOptions {
    onApprove?: () => void;
    onReject?: () => void;
    onFlag?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onJumpToSource?: () => void;
    onEdit?: () => void;
    onSave?: () => void;
    enabled?: boolean;
}

/**
 * Hook for keyboard shortcuts during contract review
 *
 * Shortcuts:
 * - A: Approve current field
 * - R: Reject/Flag current field
 * - Tab / →: Next field
 * - Shift+Tab / ←: Previous field
 * - E: Edit current field
 * - J: Jump to source page
 * - Ctrl+S: Save progress
 */
export function useReviewShortcuts(options: UseReviewShortcutsOptions) {
    const {
        onApprove,
        onReject,
        onFlag,
        onNext,
        onPrevious,
        onJumpToSource,
        onEdit,
        onSave,
        enabled = true,
    } = options;

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Ignore if typing in input/textarea
            const target = event.target as HTMLElement;
            const isInInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Allow Ctrl+S even in inputs
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                onSave?.();
                return;
            }

            // Skip other shortcuts if in input
            if (isInInput) return;

            switch (event.key.toLowerCase()) {
                case 'a':
                    event.preventDefault();
                    onApprove?.();
                    break;

                case 'r':
                    event.preventDefault();
                    onReject?.();
                    break;

                case 'f':
                    event.preventDefault();
                    onFlag?.();
                    break;

                case 'e':
                    event.preventDefault();
                    onEdit?.();
                    break;

                case 'j':
                    event.preventDefault();
                    onJumpToSource?.();
                    break;

                case 'tab':
                    if (!event.shiftKey) {
                        event.preventDefault();
                        onNext?.();
                    } else {
                        event.preventDefault();
                        onPrevious?.();
                    }
                    break;

                case 'arrowright':
                    event.preventDefault();
                    onNext?.();
                    break;

                case 'arrowleft':
                    event.preventDefault();
                    onPrevious?.();
                    break;
            }
        },
        [enabled, onApprove, onReject, onFlag, onNext, onPrevious, onJumpToSource, onEdit, onSave]
    );

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress, enabled]);

    return {
        shortcuts: [
            { key: 'A', description: 'Approve field' },
            { key: 'R', description: 'Reject field' },
            { key: 'F', description: 'Flag for review' },
            { key: 'E', description: 'Edit field' },
            { key: 'J', description: 'Jump to source' },
            { key: 'Tab', description: 'Next field' },
            { key: 'Shift+Tab', description: 'Previous field' },
            { key: '←/→', description: 'Navigate fields' },
            { key: 'Ctrl+S', description: 'Save progress' },
        ],
    };
}
