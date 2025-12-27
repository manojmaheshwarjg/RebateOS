'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileText,
    Brain,
    Sparkles,
    RefreshCw,
    FileEdit,
    ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingStage {
    name: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    icon?: React.ReactNode;
}

interface ContractProcessingStateProps {
    parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    filesCount: number;
    filesProcessed?: number;
    filesWithErrors?: number;
    totalFieldsExtracted?: number;
    extractionConfidence?: number;
    errorMessage?: string;
    onRetry?: () => void;
    onManualEntry?: () => void;
    onContinueToReview?: () => void;
}

export default function ContractProcessingState({
    parsingStatus,
    filesCount,
    filesProcessed = 0,
    filesWithErrors = 0,
    totalFieldsExtracted = 0,
    extractionConfidence = 0,
    errorMessage,
    onRetry,
    onManualEntry,
    onContinueToReview,
}: ContractProcessingStateProps) {
    const [progress, setProgress] = useState(0);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

    // Simulate progress for processing state
    useEffect(() => {
        if (parsingStatus === 'processing') {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return prev; // Cap at 90% until actually complete
                    return prev + 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        } else if (parsingStatus === 'completed') {
            setProgress(100);
        }
    }, [parsingStatus]);

    // Calculate estimated time
    useEffect(() => {
        if (parsingStatus === 'processing' && filesCount > 0) {
            const avgTimePerFile = 45; // seconds
            const remainingFiles = filesCount - filesProcessed;
            const secondsRemaining = remainingFiles * avgTimePerFile;

            if (secondsRemaining < 60) {
                setEstimatedTimeRemaining(`~${secondsRemaining}s remaining`);
            } else {
                const minutes = Math.ceil(secondsRemaining / 60);
                setEstimatedTimeRemaining(`~${minutes}min remaining`);
            }
        }
    }, [parsingStatus, filesCount, filesProcessed]);

    // Processing stages visualization
    const stages: ProcessingStage[] = [
        {
            name: 'Uploading documents',
            status: parsingStatus === 'pending' ? 'active' : 'completed',
            icon: <FileText className="h-4 w-4" />,
        },
        {
            name: 'Analyzing with AI',
            status:
                parsingStatus === 'processing'
                    ? 'active'
                    : parsingStatus === 'completed'
                    ? 'completed'
                    : parsingStatus === 'failed'
                    ? 'failed'
                    : 'pending',
            icon: <Brain className="h-4 w-4" />,
        },
        {
            name: 'Extracting data fields',
            status:
                parsingStatus === 'processing'
                    ? filesProcessed > 0
                        ? 'active'
                        : 'pending'
                    : parsingStatus === 'completed'
                    ? 'completed'
                    : parsingStatus === 'failed'
                    ? 'failed'
                    : 'pending',
            icon: <Sparkles className="h-4 w-4" />,
        },
        {
            name: 'Ready for review',
            status: parsingStatus === 'completed' ? 'completed' : 'pending',
            icon: <FileEdit className="h-4 w-4" />,
        },
    ];

    // Render based on status
    if (parsingStatus === 'processing') {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <div>
                                <CardTitle>Processing Contract Documents</CardTitle>
                                <CardDescription>
                                    AI is extracting data from {filesCount} document(s)...
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Overall Progress</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            {estimatedTimeRemaining && (
                                <p className="text-xs text-muted-foreground">{estimatedTimeRemaining}</p>
                            )}
                        </div>

                        {/* Processing Stages */}
                        <div className="space-y-3">
                            {stages.map((stage, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                                        stage.status === 'active'
                                            ? 'border-primary bg-primary/5'
                                            : stage.status === 'completed'
                                            ? 'border-green-500/20 bg-green-500/5'
                                            : 'border-muted bg-muted/20'
                                    }`}
                                >
                                    {stage.status === 'active' && (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    )}
                                    {stage.status === 'completed' && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                    {stage.status === 'pending' && (
                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                    <span
                                        className={`text-sm ${
                                            stage.status === 'active'
                                                ? 'font-medium text-primary'
                                                : stage.status === 'completed'
                                                ? 'text-muted-foreground'
                                                : 'text-muted-foreground/60'
                                        }`}
                                    >
                                        {stage.name}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Files Status */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                            <div>
                                <p className="text-sm font-medium">Documents Processed</p>
                                <p className="text-xs text-muted-foreground">
                                    {filesProcessed} of {filesCount} files
                                </p>
                            </div>
                            <Badge variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                {totalFieldsExtracted} fields found
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (parsingStatus === 'completed') {
        const hasLowConfidence = extractionConfidence < 0.7;
        const hasErrors = filesWithErrors > 0;
        const isPartialSuccess = hasLowConfidence || hasErrors;

        return (
            <div className="flex items-center justify-center h-full p-8">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            {isPartialSuccess ? (
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            ) : (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            )}
                            <div>
                                <CardTitle>
                                    {isPartialSuccess ? 'Partial Extraction Complete' : 'Extraction Complete!'}
                                </CardTitle>
                                <CardDescription>
                                    {isPartialSuccess
                                        ? 'Some data was extracted, but there are issues that need attention'
                                        : 'AI successfully extracted all contract data'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Success Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-muted/30 text-center">
                                <p className="text-2xl font-bold text-primary">{totalFieldsExtracted}</p>
                                <p className="text-xs text-muted-foreground">Fields Extracted</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30 text-center">
                                <p className="text-2xl font-bold text-green-500">
                                    {Math.round(extractionConfidence * 100)}%
                                </p>
                                <p className="text-xs text-muted-foreground">Avg Confidence</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30 text-center">
                                <p className="text-2xl font-bold text-blue-500">{filesCount - filesWithErrors}</p>
                                <p className="text-xs text-muted-foreground">Files Processed</p>
                            </div>
                        </div>

                        {/* Warnings if partial success */}
                        {isPartialSuccess && (
                            <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                <AlertDescription>
                                    {hasLowConfidence && (
                                        <p className="text-sm mb-2">
                                            • Low confidence extraction detected - please verify all fields carefully
                                        </p>
                                    )}
                                    {hasErrors && (
                                        <p className="text-sm">
                                            • {filesWithErrors} file(s) had extraction errors - some data may be
                                            missing
                                        </p>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button onClick={onContinueToReview} className="flex-1" size="lg">
                                Continue to Review
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (parsingStatus === 'failed') {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Card className="w-full max-w-2xl border-destructive/50">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <XCircle className="h-6 w-6 text-destructive" />
                            <div>
                                <CardTitle>Extraction Failed</CardTitle>
                                <CardDescription>The AI was unable to process your contract documents</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        {errorMessage && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Common Reasons */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Common reasons for failure:</p>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>PDF is encrypted or password-protected</li>
                                <li>Document is a low-quality scan with unreadable text</li>
                                <li>File format is not supported</li>
                                <li>AI service is temporarily unavailable</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button onClick={onRetry} variant="default" className="w-full" size="lg">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Extraction
                            </Button>
                            <Button onClick={onManualEntry} variant="outline" className="w-full" size="lg">
                                <FileEdit className="mr-2 h-4 w-4" />
                                Enter Data Manually
                            </Button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-muted-foreground text-center">
                            If the issue persists, try uploading a different version of the document or contact support
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Pending state
    return (
        <div className="flex items-center justify-center h-full p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <div>
                            <CardTitle>Processing Queued</CardTitle>
                            <CardDescription>Your contract is waiting to be processed by AI</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        The extraction will begin automatically. This usually takes less than a minute.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
