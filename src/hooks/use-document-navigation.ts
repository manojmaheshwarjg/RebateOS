import { useEffect, useCallback } from 'react';

export interface UseDocumentNavigationOptions {
    files: any[];
    selectedFileId: string | null;
    onFileSelect: (fileId: string) => void;
    onOpenQuickSwitcher?: () => void;
    enabled?: boolean;
}

/**
 * Hook for keyboard navigation between documents
 *
 * Shortcuts:
 * - Arrow Left/Right: Navigate to previous/next document
 * - 1-9: Quick jump to document by number (1-indexed)
 * - Cmd+K / Ctrl+K: Open quick file switcher
 */
export function useDocumentNavigation({
    files,
    selectedFileId,
    onFileSelect,
    onOpenQuickSwitcher,
    enabled = true,
}: UseDocumentNavigationOptions) {
    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled || files.length === 0) return;

            // Ignore if typing in input/textarea
            const target = event.target as HTMLElement;
            const isInInput =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable;

            // Cmd+K / Ctrl+K: Open quick switcher (works everywhere)
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                if (onOpenQuickSwitcher) {
                    onOpenQuickSwitcher();
                }
                return;
            }

            // Don't process other shortcuts if in input
            if (isInInput) return;

            const currentIndex = files.findIndex(f => f.id === selectedFileId);

            // Arrow Left: Previous document
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (currentIndex > 0) {
                    onFileSelect(files[currentIndex - 1].id);
                } else if (files.length > 0) {
                    // Wrap to last file
                    onFileSelect(files[files.length - 1].id);
                }
                return;
            }

            // Arrow Right: Next document
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (currentIndex < files.length - 1) {
                    onFileSelect(files[currentIndex + 1].id);
                } else if (files.length > 0) {
                    // Wrap to first file
                    onFileSelect(files[0].id);
                }
                return;
            }

            // Number keys 1-9: Quick jump to document
            const num = parseInt(event.key);
            if (!isNaN(num) && num >= 1 && num <= 9) {
                const fileIndex = num - 1;
                if (fileIndex < files.length) {
                    event.preventDefault();
                    onFileSelect(files[fileIndex].id);
                }
                return;
            }
        },
        [files, selectedFileId, onFileSelect, onOpenQuickSwitcher, enabled]
    );

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress, enabled]);

    // Return shortcut descriptions for help dialog
    return {
        shortcuts: [
            { key: '←/→', description: 'Navigate between documents' },
            { key: '1-9', description: 'Quick jump to document' },
            { key: 'Cmd+K', description: 'Quick file switcher' },
        ],
    };
}
