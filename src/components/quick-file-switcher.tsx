'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFileSwitcherProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: any[];
    selectedFileId: string | null;
    onFileSelect: (fileId: string) => void;
}

export default function QuickFileSwitcher({
    open,
    onOpenChange,
    files,
    selectedFileId,
    onFileSelect,
}: QuickFileSwitcherProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter files based on search query
    const filteredFiles = files.filter((file) => {
        const query = searchQuery.toLowerCase();
        return (
            file.file_name.toLowerCase().includes(query) ||
            file.document_type?.toLowerCase().includes(query) ||
            file.parsing_status?.toLowerCase().includes(query)
        );
    });

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setHighlightedIndex(0);
            // Focus input after a brief delay to ensure dialog is rendered
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [open]);

    // Update highlighted index when filtered files change
    useEffect(() => {
        if (highlightedIndex >= filteredFiles.length) {
            setHighlightedIndex(Math.max(0, filteredFiles.length - 1));
        }
    }, [filteredFiles.length, highlightedIndex]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (scrollRef.current && filteredFiles.length > 0) {
            const highlightedElement = scrollRef.current.querySelector(
                `[data-index="${highlightedIndex}"]`
            );
            if (highlightedElement) {
                highlightedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
                });
            }
        }
    }, [highlightedIndex, filteredFiles]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredFiles.length - 1 ? prev + 1 : 0
                );
                break;

            case 'ArrowUp':
                event.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredFiles.length - 1
                );
                break;

            case 'Enter':
                event.preventDefault();
                if (filteredFiles[highlightedIndex]) {
                    handleSelect(filteredFiles[highlightedIndex].id);
                }
                break;

            case 'Escape':
                event.preventDefault();
                onOpenChange(false);
                break;
        }
    };

    const handleSelect = (fileId: string) => {
        onFileSelect(fileId);
        onOpenChange(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'processing':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <FileText className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            failed: 'destructive',
            processing: 'outline',
            pending: 'secondary',
        };

        return (
            <Badge variant={variants[status] || 'secondary'} className="text-xs">
                {status}
            </Badge>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 gap-0">
                <DialogHeader className="px-4 pt-4 pb-2">
                    <DialogTitle className="text-lg">Quick File Switcher</DialogTitle>
                    <DialogDescription>
                        Search and navigate between contract documents
                    </DialogDescription>
                </DialogHeader>

                {/* Search Input */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            placeholder="Search files by name, type, or status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* File List */}
                <ScrollArea className="max-h-[400px] border-t" ref={scrollRef}>
                    {filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? 'No files match your search' : 'No files available'}
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredFiles.map((file, index) => {
                                const isSelected = file.id === selectedFileId;
                                const isHighlighted = index === highlightedIndex;

                                return (
                                    <div
                                        key={file.id}
                                        data-index={index}
                                        onClick={() => handleSelect(file.id)}
                                        className={cn(
                                            'group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                                            'hover:bg-accent',
                                            isHighlighted && 'bg-accent',
                                            isSelected && 'bg-blue-50 hover:bg-blue-100'
                                        )}
                                    >
                                        {/* Number Badge */}
                                        <div
                                            className={cn(
                                                'flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-medium',
                                                isSelected
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
                                            )}
                                        >
                                            {files.findIndex(f => f.id === file.id) + 1}
                                        </div>

                                        {/* Status Icon */}
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(file.parsing_status)}
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium truncate">
                                                    {file.file_name}
                                                </p>
                                                {isSelected && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {file.document_type && (
                                                    <span className="capitalize">
                                                        {file.document_type.replace('_', ' ')}
                                                    </span>
                                                )}
                                                {file.page_count && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            {file.page_count}{' '}
                                                            {file.page_count === 1 ? 'page' : 'pages'}
                                                        </span>
                                                    </>
                                                )}
                                                {file.extraction_confidence && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-mono">
                                                            {Math.round(file.extraction_confidence * 100)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex-shrink-0">
                                            {getStatusBadge(file.parsing_status)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="px-4 py-2 border-t bg-muted/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span>
                                <kbd className="px-1.5 py-0.5 rounded bg-background border text-xs font-mono">
                                    ↑↓
                                </kbd>{' '}
                                Navigate
                            </span>
                            <span>
                                <kbd className="px-1.5 py-0.5 rounded bg-background border text-xs font-mono">
                                    Enter
                                </kbd>{' '}
                                Select
                            </span>
                            <span>
                                <kbd className="px-1.5 py-0.5 rounded bg-background border text-xs font-mono">
                                    Esc
                                </kbd>{' '}
                                Close
                            </span>
                        </div>
                        <span>
                            {filteredFiles.length} of {files.length} files
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
