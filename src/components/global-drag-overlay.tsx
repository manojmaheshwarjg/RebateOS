'use client';

import { UploadCloud } from 'lucide-react';
import { useGlobalDragDrop } from './global-drag-drop-context';
import { cn } from '@/lib/utils';

export function GlobalDragOverlay() {
    const { isDragging } = useGlobalDragDrop();

    if (!isDragging) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200 animate-in fade-in-0",
            "border-4 border-dashed border-primary/50 m-4 rounded-xl"
        )}>
            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-primary/10 rounded-full ring-8 ring-primary/5">
                    <UploadCloud className="w-16 h-16 text-primary" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Drop files to upload</h2>
                    <p className="text-xl text-muted-foreground">
                        Create a new contract or package instantly
                    </p>
                </div>
            </div>
        </div>
    );
}
