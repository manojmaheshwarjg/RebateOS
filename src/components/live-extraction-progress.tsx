'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Loader2,
    Clock,
    FileText,
    DollarSign,
    Package,
    Building2,
    GitMerge,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export interface ExtractionPhase {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress?: number;
    fieldsExtracted?: number;
    startTime?: number;
    endTime?: number;
}

interface LiveExtractionProgressProps {
    phases: ExtractionPhase[];
    currentPhase?: string;
    overallProgress: number;
    totalFieldsExtracted: number;
    estimatedTimeRemaining?: number;
    fileName?: string;
}

export default function LiveExtractionProgress({
    phases,
    currentPhase,
    overallProgress,
    totalFieldsExtracted,
    estimatedTimeRemaining,
    fileName,
}: LiveExtractionProgressProps) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const startTime = phases.find(p => p.startTime)?.startTime || Date.now();

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTime);
        }, 100);

        return () => clearInterval(interval);
    }, [startTime]);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const totalPhases = phases.length;

    return (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Processing: {fileName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        AI is extracting contract data...
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                        {Math.round(overallProgress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatTime(elapsedTime)} elapsed
                    </div>
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
                <Progress value={overallProgress} className="h-3" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{completedPhases} of {totalPhases} phases complete</span>
                    {estimatedTimeRemaining && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{formatTime(estimatedTimeRemaining)} remaining
                        </span>
                    )}
                </div>
            </div>

            {/* Phases List */}
            <div className="space-y-3">
                {phases.map((phase, index) => {
                    const Icon = phase.icon;
                    const isActive = phase.id === currentPhase;
                    const isCompleted = phase.status === 'completed';
                    const isProcessing = phase.status === 'processing';
                    const hasError = phase.status === 'error';
                    const duration = phase.endTime && phase.startTime
                        ? phase.endTime - phase.startTime
                        : 0;

                    return (
                        <motion.div
                            key={phase.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                                isActive && 'border-blue-500 bg-blue-50',
                                isCompleted && 'border-green-200 bg-green-50',
                                hasError && 'border-red-200 bg-red-50',
                                !isActive && !isCompleted && !hasError && 'border-slate-200 bg-white opacity-60'
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                                isCompleted && 'bg-green-500',
                                isProcessing && 'bg-blue-500',
                                hasError && 'bg-red-500',
                                phase.status === 'pending' && 'bg-slate-300'
                            )}>
                                {isCompleted && <CheckCircle2 className="h-5 w-5 text-white" />}
                                {isProcessing && <Loader2 className="h-5 w-5 text-white animate-spin" />}
                                {hasError && <AlertTriangle className="h-5 w-5 text-white" />}
                                {phase.status === 'pending' && <Icon className="h-5 w-5 text-white" />}
                            </div>

                            {/* Phase Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        {phase.name}
                                    </h4>
                                    {isActive && (
                                        <Badge variant="default" className="text-xs">
                                            In Progress
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {phase.description}
                                </p>

                                {/* Phase-specific progress */}
                                {isProcessing && phase.progress !== undefined && (
                                    <div className="mt-2">
                                        <Progress value={phase.progress} className="h-1.5" />
                                    </div>
                                )}
                            </div>

                            {/* Results */}
                            <div className="flex-shrink-0 text-right">
                                {isCompleted && phase.fieldsExtracted !== undefined && (
                                    <div className="text-sm font-semibold text-green-700">
                                        +{phase.fieldsExtracted} fields
                                    </div>
                                )}
                                {isCompleted && duration > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        {(duration / 1000).toFixed(1)}s
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Live Field Counter */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-white rounded-lg border-2 border-green-200"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-slate-700">
                                Fields Extracted
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Updating in real-time
                            </div>
                        </div>
                    </div>
                    <motion.div
                        key={totalFieldsExtracted}
                        initial={{ scale: 1.2, color: '#16a34a' }}
                        animate={{ scale: 1, color: '#0f172a' }}
                        transition={{ duration: 0.3 }}
                        className="text-4xl font-bold"
                    >
                        {totalFieldsExtracted}
                    </motion.div>
                </div>
            </motion.div>
        </Card>
    );
}

/**
 * Default phases configuration
 */
export const DEFAULT_EXTRACTION_PHASES: ExtractionPhase[] = [
    {
        id: 'tables',
        name: 'Table Extraction',
        description: 'Detecting tables and extracting structured data',
        icon: FileText,
        status: 'pending',
    },
    {
        id: 'general',
        name: 'General Fields',
        description: 'Contract number, dates, parties, legal terms',
        icon: FileText,
        status: 'pending',
    },
    {
        id: 'financial',
        name: 'Financial Terms',
        description: 'Rebate tiers, payment terms, incentives',
        icon: DollarSign,
        status: 'pending',
    },
    {
        id: 'products',
        name: 'Product Extraction',
        description: 'Product names, NDCs, strengths, packages',
        icon: Package,
        status: 'pending',
    },
    {
        id: 'facilities',
        name: 'Facilities & Bundles',
        description: '340B facilities, cross-category bundles',
        icon: Building2,
        status: 'pending',
    },
    {
        id: 'validation',
        name: 'Validation & Categorization',
        description: 'Quality checks, conflict detection, field organization',
        icon: GitMerge,
        status: 'pending',
    },
];
