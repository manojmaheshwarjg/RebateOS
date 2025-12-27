'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface ShortcutGroup {
    title: string;
    shortcuts: Array<{
        keys: string[];
        description: string;
    }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
    {
        title: 'Document Navigation',
        shortcuts: [
            { keys: ['←', '→'], description: 'Navigate between documents' },
            { keys: ['1-9'], description: 'Jump to document by number' },
            { keys: ['Cmd', 'K'], description: 'Quick file switcher' },
        ],
    },
    {
        title: 'Field Review',
        shortcuts: [
            { keys: ['A'], description: 'Approve current field' },
            { keys: ['R'], description: 'Reject current field' },
            { keys: ['F'], description: 'Flag for review' },
            { keys: ['E'], description: 'Edit field value' },
            { keys: ['J'], description: 'Jump to source page' },
        ],
    },
    {
        title: 'Field Navigation',
        shortcuts: [
            { keys: ['Tab'], description: 'Next field' },
            { keys: ['Shift', 'Tab'], description: 'Previous field' },
            { keys: ['↑', '↓'], description: 'Scroll fields' },
        ],
    },
    {
        title: 'General',
        shortcuts: [
            { keys: ['Ctrl', 'S'], description: 'Save progress' },
            { keys: ['?'], description: 'Toggle this help' },
            { keys: ['Esc'], description: 'Close dialogs' },
        ],
    },
];

export default function KeyboardShortcutsHelp() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Toggle help with '?'
            if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
                const target = event.target as HTMLElement;
                const isInInput =
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;

                if (!isInInput) {
                    event.preventDefault();
                    setOpen(prev => !prev);
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

    return (
        <>
            {/* Help Button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center group"
                title="Keyboard Shortcuts (Press ?)"
            >
                <Keyboard className="h-5 w-5" />
                <span className="sr-only">Keyboard shortcuts</span>
            </button>

            {/* Help Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Keyboard className="h-5 w-5" />
                            Keyboard Shortcuts
                        </DialogTitle>
                        <DialogDescription>
                            Speed up your workflow with these keyboard shortcuts
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-6">
                        {SHORTCUT_GROUPS.map((group, groupIndex) => (
                            <div key={groupIndex}>
                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                    {group.title}
                                </h3>
                                <div className="space-y-2">
                                    {group.shortcuts.map((shortcut, shortcutIndex) => (
                                        <div
                                            key={shortcutIndex}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                                        >
                                            <span className="text-sm text-slate-600">
                                                {shortcut.description}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, keyIndex) => (
                                                    <React.Fragment key={keyIndex}>
                                                        {keyIndex > 0 && (
                                                            <span className="text-xs text-slate-400 mx-1">
                                                                +
                                                            </span>
                                                        )}
                                                        <Badge
                                                            variant="secondary"
                                                            className="font-mono text-xs px-2 py-1"
                                                        >
                                                            {key}
                                                        </Badge>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                            <strong>💡 Tip:</strong> Press <Badge variant="secondary" className="font-mono mx-1">?</Badge> anytime to toggle this help dialog.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
