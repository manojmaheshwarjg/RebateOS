'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/components/local-storage-provider';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { uploadFile as uploadFileBlob } from '@/lib/local-storage/storage';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Sparkles, FileCheck, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { triggerContractProcessing } from '@/app/actions/process-contract';
import { ProgressRing, PulsingDot, ConfettiExplosion, TypewriterText, ProcessingStageIndicator } from '@/components/ui/animations';
import { useProcessingStream } from '@/hooks/useProcessingStream';
import { motion, AnimatePresence } from 'framer-motion';
import ExtractionProgressOverlay from './extraction-progress-overlay';

interface UploadedFile {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    fileId?: string;
    documentType?: string;
    fieldsExtracted?: number;
}

export default function MultiDocumentUpload({
    contractId,
    onUploadComplete,
    initialFiles
}: {
    contractId?: string;
    onUploadComplete?: () => void;
    initialFiles?: File[];
}) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [processingFiles, setProcessingFiles] = useState<any[]>([]);
    const { toast } = useToast();
    const { db, userId, storage } = useLocalStorage();

    // Handle initial files from props
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            const newFiles: UploadedFile[] = initialFiles.map(file => ({
                id: uuidv4(),
                file,
                status: 'pending',
                progress: 0,
            }));
            setFiles(prev => {
                const uniqueNewFiles = newFiles.filter(nf =>
                    !prev.some(pf => pf.file.name === nf.file.name && pf.file.size === nf.file.size)
                );
                return [...prev, ...uniqueNewFiles];
            });
        }
    }, [initialFiles]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log('\n📄 [Upload] Files dropped:', acceptedFiles.length);
        acceptedFiles.forEach((file, idx) => {
            console.log(`  ${idx + 1}. ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        });

        const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
            id: uuidv4(),
            file,
            status: 'pending',
            progress: 0,
        }));

        setFiles(prev => {
            const uniqueNewFiles = newFiles.filter(nf =>
                !prev.some(pf => pf.file.name === nf.file.name && pf.file.size === nf.file.size)
            );

            if (uniqueNewFiles.length < newFiles.length) {
                console.log(`⚠️  [Upload] Skipped ${newFiles.length - uniqueNewFiles.length} duplicate files`);
                toast({
                    title: 'Duplicate files skipped',
                    description: 'Some files were already added.',
                });
            }

            console.log(`✓ [Upload] Added ${uniqueNewFiles.length} new files to queue\n`);
            return [...prev, ...uniqueNewFiles];
        });
    }, [toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'image/*': ['.png', '.jpg', '.jpeg'],
        },
        multiple: true,
    });

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const uploadFile = async (uploadedFile: UploadedFile): Promise<void> => {
        if (!contractId) throw new Error('Contract ID is required for file upload');

        console.log(`\n🚀 [Upload] Starting upload: ${uploadedFile.file.name}`);
        console.log(`   Contract ID: ${contractId}`);
        console.log(`   File size: ${(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB\n`);

        setFiles(prev => prev.map(f =>
            f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 10 } : f
        ));

        try {
            // Upload file to IndexedDB blob storage
            console.log(`[Upload] Uploading to IndexedDB storage...`);
            const uploadResult = await uploadFileBlob(uploadedFile.file);
            console.log(`✓ [Upload] File stored in IndexedDB (ID: ${uploadResult.id})`);


            setFiles(prev => prev.map(f =>
                f.id === uploadedFile.id ? { ...f, progress: 40 } : f
            ));

            // Create contract file record in IndexedDB using the same ID as the blob
            console.log(`[Upload] Creating contract file record...`);
            await db.contract_files.add({
                id: uploadResult.id, // Use the same ID as the blob!
                contract_id: contractId,
                file_name: uploadedFile.file.name,
                file_path: uploadResult.path,
                file_size: uploadResult.size,
                file_url: uploadResult.url,
                uploaded_by: userId,
                parsing_status: 'pending',
                created_at: getCurrentTimestamp(),
            });
            console.log(`✓ [Upload] File record created in database\n`);

            setFiles(prev => prev.map(f =>
                f.id === uploadedFile.id ? { ...f, progress: 60, fileId: uploadResult.id } : f
            ));

            // Convert file to base64 data URI for AI processing
            console.log(`[Upload] Converting PDF to base64 for AI processing...`);
            const arrayBuffer = await uploadedFile.file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            const mimeType = uploadedFile.file.type || 'application/pdf';
            const dataUri = `data:${mimeType};base64,${base64}`;
            console.log(`✓ [Upload] PDF converted (${(base64.length / 1024).toFixed(0)} KB base64)\n`);


            setFiles(prev => prev.map(f =>
                f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 75 } : f
            ));

            console.log(`\n🤖 [AI Processing] Triggering AI extraction for: ${uploadedFile.file.name}`);
            console.log(`   This will run all extraction phases:`);
            console.log(`   1. Table extraction from PDF`);
            console.log(`   2. General fields (parties, dates)`);
            console.log(`   3. Financial fields and rebate tiers`);
            console.log(`   4. Product extraction (DIRECT method)`);
            console.log(`   5. Facilities and bundles`);
            console.log(`   6. Field categorization and validation\n`);

            // Add to processing overlay
            setProcessingFiles(prev => [
                ...prev,
                {
                    id: uploadResult.id,
                    fileName: uploadedFile.file.name,
                    currentPhase: 0,
                    totalPhases: 6,
                    fieldsExtracted: 0,
                    status: 'processing',
                },
            ]);

            // Simulate phase progress (since we don't have real-time events from server)
            const phaseTimings = [2000, 3000, 4000, 2500, 2000, 1500]; // Approximate timings per phase
            let currentPhase = 0;
            const phaseInterval = setInterval(() => {
                currentPhase++;
                if (currentPhase <= 6) {
                    setProcessingFiles(prev =>
                        prev.map(pf =>
                            pf.id === uploadResult.id
                                ? { ...pf, currentPhase }
                                : pf
                        )
                    );
                } else {
                    clearInterval(phaseInterval);
                }
            }, phaseTimings[currentPhase] || 2000);

            triggerContractProcessing(uploadResult.id, contractId, uploadedFile.file.name, dataUri)
                .then(async (result) => {
                    if (result.success) {
                        console.log(`\n✅ [AI Processing] Extraction completed successfully!\n`);

                        // Save extracted fields to IndexedDB
                        const aiResult = (result as any).result;
                        if (aiResult && aiResult.extractedFields && aiResult.extractedFields.length > 0) {
                            console.log(`💾 [Database] Saving ${aiResult.extractedFields.length} extracted fields to IndexedDB...`);
                            const fieldsToSave = aiResult.extractedFields.map((field: any) => ({
                                id: `${uploadResult.id}-${field.field_name}-${Date.now()}`,
                                contract_id: contractId,
                                source_file_id: uploadResult.id,
                                ...field,
                                extraction_method: 'ai' as const,
                                ai_model: 'groq/llama-3.3-70b-versatile',
                                is_active: true,
                                review_status: 'pending' as const,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            }));

                            await db.extracted_fields.bulkAdd(fieldsToSave);
                            console.log(`✓ [Database] Saved ${fieldsToSave.length} fields to IndexedDB`);
                            console.log(`   Document type: ${aiResult.documentType || 'Unknown'}`);
                            console.log(`   Confidence: ${((aiResult.overallConfidence || 0) * 100).toFixed(1)}%\n`);

                            // Update processing overlay with fields extracted
                            setProcessingFiles(prev =>
                                prev.map(pf =>
                                    pf.id === uploadResult.id
                                        ? { ...pf, fieldsExtracted: fieldsToSave.length, currentPhase: 6, status: 'completed' }
                                        : pf
                                )
                            );
                        }

                        // Update file status
                        await db.contract_files.update(uploadResult.id, {
                            parsing_status: 'completed',
                            parsing_completed_at: new Date().toISOString(),
                            document_type: aiResult?.documentType as any,
                        });

                        // Update contract status and save structured data
                        // Map structured data to contract columns
                        const structured = (aiResult as any).structuredData;

                        // Helper to format payment terms from object to string
                        const formatPaymentTerms = (pt: any) => {
                            if (!pt) return undefined;
                            if (typeof pt === 'string') return pt;
                            const parts = [];
                            if (pt.frequency) parts.push(pt.frequency);
                            if (pt.dueDate) parts.push(pt.dueDate);
                            if (pt.paymentMethod) parts.push(`via ${pt.paymentMethod}`);
                            return parts.length > 0 ? parts.join(' - ') : undefined;
                        };

                        await db.contracts.update(contractId, {
                            parsing_status: 'completed',
                            extraction_confidence: aiResult?.overallConfidence || 0.7,

                            // Map structured data to contract columns
                            start_date: structured?.general?.effectiveDate,
                            end_date: structured?.general?.expirationDate,
                            payment_terms: formatPaymentTerms(structured?.financial?.paymentTerms),
                            renewal_terms: structured?.general?.renewalTerms,

                            // Save complex objects
                            rebate_tiers: structured?.financial?.rebateTiers || [],
                            products: structured?.products?.products || [],
                            vendor_contact: structured?.general?.vendorName ? { name: structured.general.vendorName } : undefined,
                        });

                        // Save Obligations
                        if (structured?.financial?.obligations && Array.isArray(structured.financial.obligations)) {
                            for (const ob of structured.financial.obligations) {
                                await db.obligations.add({
                                    id: crypto.randomUUID(),
                                    contract_id: contractId,
                                    title: ob.title,
                                    description: ob.description,
                                    due_date: ob.dueDate,
                                    type: ob.type || 'other',
                                    priority: ob.priority || 'medium',
                                    recurrence: ob.recurrence,
                                    status: 'pending',
                                    created_at: new Date().toISOString()
                                });
                            }
                        }

                        setFiles(prev => prev.map(f =>
                            f.id === uploadedFile.id ? {
                                ...f,
                                status: 'completed',
                                progress: 100,
                                fieldsExtracted: aiResult?.extractedFields?.length || 0,
                                documentType: aiResult?.documentType
                            } : f
                        ));
                        setShowConfetti(true);

                        console.log(`\n🎉 [Complete] ${uploadedFile.file.name} processed successfully!`);
                        console.log(`   Fields extracted: ${aiResult?.extractedFields?.length || 0}`);
                        console.log(`   Document type: ${aiResult?.documentType || 'Unknown'}`);
                        console.log(`   Status: ✓ READY FOR REVIEW\n`);
                        console.log(`${'='.repeat(60)}\n`);

                        toast({
                            title: '🎉 Processing complete!',
                            description: `Extracted ${aiResult?.extractedFields?.length || 0} fields from ${uploadedFile.file.name}`,
                        });
                    } else {
                        throw new Error(result.error);
                    }
                })
                .catch(err => {
                    console.error(`\n❌ [AI Processing] Error processing ${uploadedFile.file.name}:`, err.message);
                    console.error(`   Stack:`, err.stack);
                    console.log(`${'='.repeat(60)}\n`);

                    setFiles(prev => prev.map(f =>
                        f.id === uploadedFile.id ? { ...f, status: 'error', error: err.message } : f
                    ));
                    toast({
                        title: 'Processing error',
                        description: err.message,
                        variant: 'destructive',
                    });
                });

        } catch (error: any) {
            console.error(`\n❌ [Upload] Upload failed for ${uploadedFile.file.name}:`, error.message);
            console.log(`${'='.repeat(60)}\n`);

            setFiles(prev => prev.map(f =>
                f.id === uploadedFile.id ? { ...f, status: 'error', error: error.message } : f
            ));
            throw error;
        }
    };

    const handleUploadAll = async () => {
        if (files.length === 0) {
            toast({
                title: 'No files selected',
                description: 'Please add at least one file to upload.',
                variant: 'destructive',
            });
            return;
        }

        if (!contractId) {
            toast({
                title: 'Contract ID missing',
                description: 'Cannot upload files without a contract. Please create a contract first.',
                variant: 'destructive',
            });
            return;
        }

        const pendingFiles = files.filter(f => f.status === 'pending');
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 [Batch Upload] Starting batch upload of ${pendingFiles.length} files`);
        console.log(`   Contract ID: ${contractId}`);
        console.log(`${'='.repeat(60)}\n`);

        try {
            await Promise.all(pendingFiles.map(file => uploadFile(file)));

            console.log(`\n✅ [Batch Upload] All files processed successfully!\n`);


            if (onUploadComplete) {
                setTimeout(() => onUploadComplete(), 1500);
            }
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const completedCount = files.filter(f => f.status === 'completed').length;
    const processingCount = files.filter(f => f.status === 'processing' || f.status === 'uploading').length;

    return (
        <div className="space-y-6">
            {/* Confetti celebration */}
            <AnimatePresence>
                {showConfetti && (
                    <ConfettiExplosion onComplete={() => setShowConfetti(false)} />
                )}
            </AnimatePresence>

            {/* Enhanced Dropzone */}
            <div
                {...getRootProps()}
                className={`
                    relative overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragActive
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5'
                    }
                `}
            >
                <input {...getInputProps()} />

                <motion.div
                    animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                </motion.div>

                <h3 className="text-lg font-semibold mb-2">
                    {isDragActive ? 'Drop files here!' : 'Upload Contract Documents'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop files here, or click to browse
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-normal">PDF</Badge>
                    <Badge variant="outline" className="font-normal">DOCX</Badge>
                    <Badge variant="outline" className="font-normal">XLSX</Badge>
                    <Badge variant="outline" className="font-normal">Images</Badge>
                </div>

                {/* Animated background gradient */}
                {isDragActive && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </div>

            {/* File List with enhanced cards */}
            <AnimatePresence mode="popLayout">
                {files.length > 0 && (
                    <motion.div
                        key="file-list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="border-2">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">
                                            Uploaded Documents ({files.length})
                                        </h3>
                                    </div>
                                    {processingCount > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <PulsingDot size="sm" />
                                            <span>{processingCount} processing</span>
                                        </div>
                                    )}
                                    {completedCount > 0 && processingCount === 0 && (
                                        <Badge variant="default" className="gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {completedCount} complete
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {files.map((uploadedFile, index) => (
                                            <FileCard
                                                key={uploadedFile.id}
                                                file={uploadedFile}
                                                index={index}
                                                onRemove={() => removeFile(uploadedFile.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Upload Button */}
                                {files.some(f => f.status === 'pending') && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-6 flex gap-3"
                                    >
                                        <Button
                                            onClick={handleUploadAll}
                                            className="flex-1 h-12 text-base gap-2"
                                            size="lg"
                                        >
                                            <Sparkles className="h-5 w-5" />
                                            Process {files.filter(f => f.status === 'pending').length} Document(s) with AI
                                        </Button>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Extraction Progress Overlay */}
            <ExtractionProgressOverlay
                files={processingFiles}
                onClose={() => {
                    setProcessingFiles([]);
                    onUploadComplete?.();
                }}
                canClose={processingFiles.every(f => f.status === 'completed')}
            />
        </div>
    );
}

// Enhanced File Card Component
function FileCard({
    file,
    index,
    onRemove
}: {
    file: UploadedFile;
    index: number;
    onRemove: () => void;
}) {
    const processingStream = useProcessingStream(file.fileId || null);

    const getStatusIcon = () => {
        if (file.status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (file.status === 'error') return <AlertCircle className="h-5 w-5 text-destructive" />;
        if (file.status === 'processing') return <Brain className="h-5 w-5 text-primary animate-pulse" />;
        if (file.status === 'uploading') return <FileCheck className="h-5 w-5 text-blue-500" />;
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    };

    const stages = processingStream.currentStage ? [
        {
            name: 'Analyzing document...',
            status: ['analyzing', 'classifying', 'extracting_financial', 'extracting_products', 'finalizing', 'completed'].includes(processingStream.currentStage.stage) ? 'completed' as const :
                processingStream.currentStage.stage === 'uploading' ? 'active' as const : 'pending' as const,
        },
        {
            name: processingStream.currentStage.documentType
                ? `Classified as ${processingStream.currentStage.documentType}`
                : 'Classifying document type...',
            status: ['classifying', 'extracting_financial', 'extracting_products', 'finalizing', 'completed'].includes(processingStream.currentStage.stage) ? 'completed' as const :
                processingStream.currentStage.stage === 'analyzing' ? 'active' as const : 'pending' as const,
        },
        {
            name: 'Extracting key data fields...',
            status: ['extracting_financial', 'extracting_products', 'finalizing', 'completed'].includes(processingStream.currentStage.stage) ? 'completed' as const :
                processingStream.currentStage.stage === 'classifying' ? 'active' as const : 'pending' as const,
        },
        {
            name: processingStream.currentStage.fieldsExtracted
                ? `Found ${processingStream.currentStage.fieldsExtracted} fields!`
                : 'Finalizing results...',
            status: processingStream.currentStage.stage === 'completed' ? 'completed' as const :
                ['extracting_financial', 'extracting_products', 'finalizing'].includes(processingStream.currentStage.stage) ? 'active' as const : 'pending' as const,
        },
    ] : [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="relative overflow-hidden rounded-xl border-2 bg-card p-5 hover:shadow-md transition-shadow"
        >
            <div className="flex items-start gap-4">
                {/* Status Icon or Progress Ring */}
                <div className="flex-shrink-0">
                    {file.status === 'processing' && processingStream.currentStage ? (
                        <ProgressRing
                            progress={processingStream.currentStage.progress}
                            size={60}
                            strokeWidth={4}
                            showPercentage={false}
                        />
                    ) : file.status === 'uploading' ? (
                        <ProgressRing
                            progress={file.progress}
                            size={60}
                            strokeWidth={4}
                            showPercentage={false}
                        />
                    ) : (
                        <div className="w-[60px] h-[60px] rounded-full border-2 flex items-center justify-center">
                            {getStatusIcon()}
                        </div>
                    )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <p className="font-medium truncate">{file.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        {file.status === 'pending' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRemove}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Processing Stages */}
                    {file.status === 'processing' && stages.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-accent/30">
                            <ProcessingStageIndicator stages={stages} />
                        </div>
                    )}

                    {/* Upload Progress */}
                    {file.status === 'uploading' && (
                        <div className="mt-3">
                            <TypewriterText text="Uploading to cloud storage..." />
                        </div>
                    )}

                    {/* Completed State */}
                    {file.status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 flex items-center gap-2"
                        >
                            <Badge variant="default" className="gap-1">
                                <Sparkles className="h-3 w-3" />
                                {file.fieldsExtracted || 0} fields extracted
                            </Badge>
                            {file.documentType && (
                                <Badge variant="outline">
                                    {file.documentType}
                                </Badge>
                            )}
                        </motion.div>
                    )}

                    {/* Error State */}
                    {file.status === 'error' && file.error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 text-sm text-destructive"
                        >
                            {file.error}
                        </motion.p>
                    )}
                </div>
            </div>

            {/* Animated background for processing */}
            {file.status === 'processing' && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
                    animate={{
                        x: ['-100%', '100%'],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            )}
        </motion.div>
    );
}
