'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle2,
    Loader2,
    FileText,
    Sparkles,
    ChevronRight,
    Search,
    BrainCircuit,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProcessingFile {
    id: string;
    fileName: string;
    currentPhase: number;
    totalPhases: number;
    fieldsExtracted: number;
    status: 'processing' | 'completed' | 'error';
}

interface ExtractionProgressOverlayProps {
    files: ProcessingFile[];
    onClose?: () => void;
    canClose?: boolean;
}

const PHASES = [
    'Initializing',
    'Scanning Document',
    'Extracting Terms',
    'Analyzing Financials',
    'Identifying Products',
    'Validating Data',
    'Finalizing'
];

export default function ExtractionProgressOverlay({
    files,
    onClose,
    canClose = false,
}: ExtractionProgressOverlayProps) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const allCompleted = files.length > 0 && files.every(f => f.status === 'completed');
    const totalFieldsExtracted = files.reduce((sum, f) => sum + f.fieldsExtracted, 0);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <AnimatePresence>
            {files.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500",
                                    allCompleted ? "bg-emerald-100 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                                )}>
                                    {allCompleted ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                        {allCompleted ? 'Processing Complete' : 'AI Analysis in Progress'}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {allCompleted
                                            ? `Successfully processed ${files.length} document${files.length !== 1 ? 's' : ''}`
                                            : `Analyzing ${files.length} document${files.length !== 1 ? 's' : ''}...`
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Key Stats (Compact) */}
                            <div className="hidden sm:flex items-center gap-6 text-sm">
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{totalFieldsExtracted}</div>
                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Fields</div>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div className="text-right">
                                    <div className="font-bold text-slate-900 font-mono">{formatTime(elapsedTime)}</div>
                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Duration</div>
                                </div>
                            </div>
                        </div>

                        {/* File List */}
                        <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50/50">
                            {files.map((file) => (
                                <FileProgressRow key={file.id} file={file} />
                            ))}
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                            {(canClose || allCompleted) && (
                                <Button
                                    onClick={onClose}
                                    className={cn(
                                        "min-w-[120px] transition-all",
                                        allCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg" : ""
                                    )}
                                    variant={allCompleted ? "default" : "outline"}
                                >
                                    {allCompleted ? (
                                        <>Review Results <ArrowRight className="ml-2 h-4 w-4" /></>
                                    ) : (
                                        "Close"
                                    )}
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function FileProgressRow({ file }: { file: ProcessingFile }) {
    const isComplete = file.status === 'completed';
    const isError = file.status === 'error';
    const progress = (file.currentPhase / Math.max(file.totalPhases, 1)) * 100;

    // Determine status text
    const statusText = isError ? 'Error' : isComplete ? 'Complete' : PHASES[file.currentPhase] || 'Processing...';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 relative overflow-hidden group"
        >
            {/* Background Progress Bar (Optional visual style) */}
            {!isComplete && !isError && (
                <div
                    className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            )}

            <div className="flex items-center justify-between gap-4">
                {/* File Icon & Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                        isComplete ? "bg-emerald-50 text-emerald-600" :
                            isError ? "bg-red-50 text-red-600" :
                                "bg-slate-100 text-slate-500"
                    )}>
                        <FileText className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate pr-4">{file.fileName}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            {isComplete ? (
                                <span className="flex items-center text-emerald-600 font-medium">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {file.fieldsExtracted} fields extracted
                                </span>
                            ) : (
                                <span className={cn(isError ? "text-red-500" : "text-indigo-600")}>
                                    {statusText}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    {!isComplete && !isError && (
                        <div className="w-32 hidden sm:block">
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    <div className="w-8 flex justify-end">
                        {isComplete ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                        ) : isError ? (
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                <X className="h-3.5 w-3.5 text-red-600" />
                            </div>
                        ) : (
                            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
