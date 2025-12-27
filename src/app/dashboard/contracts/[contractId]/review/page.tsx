'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, CheckCircle, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ExtractedDataEditor from '@/components/extracted-data-editor';
import ReviewActionPanel from '@/components/review-action-panel';
import ContractProcessingState from '@/components/contract-processing-state';
import QuickFileSwitcher from '@/components/quick-file-switcher';
import BulkReviewToolbar from '@/components/bulk-review-toolbar';
import KeyboardShortcutsHelp from '@/components/keyboard-shortcuts-help';
import { useDocumentNavigation } from '@/hooks/use-document-navigation';
import { useReviewShortcuts } from '@/hooks/use-review-shortcuts';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

// Dynamically import PDF.js components to avoid SSR issues
const DocumentViewer = dynamic(() => import('@/components/document-viewer'), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
            </div>
        </div>
    ),
});

const DocumentThumbnailStrip = dynamic(() => import('@/components/document-thumbnail-strip'), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center bg-slate-50 border-r">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading thumbnails...</p>
            </div>
        </div>
    ),
});

export default function ContractReviewPage() {
    const { contractId } = useParams();
    const router = useRouter();
    const { db } = useLocalStorage();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [contract, setContract] = useState<any>(null);
    const [files, setFiles] = useState<any[]>([]);
    const [extractedFields, setExtractedFields] = useState<any[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [forcedPage, setForcedPage] = useState<number | undefined>(undefined);
    const [filesProcessed, setFilesProcessed] = useState(0);
    const [filesWithErrors, setFilesWithErrors] = useState(0);
    const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
    const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
    const [hideApproved, setHideApproved] = useState(false);

    // Keyboard navigation for documents
    useDocumentNavigation({
        files,
        selectedFileId,
        onFileSelect: setSelectedFileId,
        onOpenQuickSwitcher: () => setQuickSwitcherOpen(true),
        enabled: !isLoading && files.length > 0,
    });

    // Get visible fields (filter out approved if hideApproved is true)
    const visibleFields = hideApproved
        ? extractedFields.filter(f => f.review_status !== 'approved')
        : extractedFields;

    const currentField = visibleFields[currentFieldIndex];

    // Keyboard shortcuts for review
    useReviewShortcuts({
        onApprove: async () => {
            if (!currentField) return;
            await handleApproveField(currentField.id);
            setCurrentFieldIndex(prev => Math.min(prev + 1, visibleFields.length - 1));
        },
        onReject: async () => {
            if (!currentField) return;
            await handleRejectField(currentField.id);
            setCurrentFieldIndex(prev => Math.min(prev + 1, visibleFields.length - 1));
        },
        onNext: () => {
            setCurrentFieldIndex(prev => Math.min(prev + 1, visibleFields.length - 1));
        },
        onPrevious: () => {
            setCurrentFieldIndex(prev => Math.max(prev - 1, 0));
        },
        onJumpToSource: () => {
            if (currentField?.source_page) {
                handleJumpToPage(currentField.source_page);
            }
        },
        onSave: () => {
            handleSave();
        },
        enabled: !isLoading && contract?.parsing_status === 'completed',
    });

    const fetchData = useCallback(async () => {
        if (!contractId) return;
        setIsLoading(true);

        try {
            // Fetch contract
            const contractData = await db.contracts.get(contractId as string);

            if (!contractData) {
                console.error('Contract not found');
                return;
            }
            setContract(contractData);

            // Fetch files
            const filesData = await db.contract_files
                .where('contract_id')
                .equals(contractId as string)
                .toArray();

            setFiles(filesData || []);
            if (filesData && filesData.length > 0) {
                setSelectedFileId(filesData[0].id);
            }

            // Calculate processing stats
            const completedFiles = filesData?.filter((f) => f.parsing_status === 'completed').length || 0;
            const failedFiles = filesData?.filter((f) => f.parsing_status === 'failed').length || 0;
            setFilesProcessed(completedFiles);
            setFilesWithErrors(failedFiles);

            // Fetch extracted fields
            const fieldsData = await db.extracted_fields
                .where('contract_id')
                .equals(contractId as string)
                .toArray();

            setExtractedFields(fieldsData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [contractId, db]);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh while processing
    useEffect(() => {
        if (contract?.parsing_status === 'processing' || contract?.parsing_status === 'pending') {
            console.log('[Review] Contract is processing, setting up auto-refresh...');
            const interval = setInterval(() => {
                console.log('[Review] Auto-refreshing data...');
                fetchData();
            }, 3000); // Refresh every 3 seconds

            return () => {
                console.log('[Review] Clearing auto-refresh interval');
                clearInterval(interval);
            };
        }
    }, [contract?.parsing_status, fetchData]);

    const handleSave = async (updatedFields?: any[]) => {
        const fieldsToSave = updatedFields || extractedFields;
        try {
            // Update each field in IndexedDB
            for (const field of fieldsToSave) {
                await db.extracted_fields.update(field.id, {
                    ...field,
                    updated_at: new Date().toISOString()
                });
            }

            toast({
                title: "Changes saved",
                description: "Your review progress has been saved.",
            });
        } catch (error) {
            console.error('Error saving fields:', error);
            toast({
                title: "Error saving changes",
                description: "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCompleteReview = async () => {
        try {
            // 1. Save all fields first
            await handleSave();

            // 2. Update all fields to 'approved' if they are pending
            const pendingFields = await db.extracted_fields
                .where('contract_id')
                .equals(contractId as string)
                .and(field => field.review_status === 'pending')
                .toArray();

            for (const field of pendingFields) {
                await db.extracted_fields.update(field.id, {
                    review_status: 'approved',
                    reviewed_at: new Date().toISOString()
                });
            }

            // 3. Sync approved values to contract columns (Source of Truth)
            const getFieldValue = (name: string) => {
                const field = pendingFields.find(f => f.field_name === name) ||
                    extractedFields.find(f => f.field_name === name);
                return field?.value_date || field?.value_text || field?.value_numeric;
            };

            const getJsonValue = (name: string) => {
                const field = pendingFields.find(f => f.field_name === name) ||
                    extractedFields.find(f => f.field_name === name);
                if (!field?.value_json) return undefined;
                return typeof field.value_json === 'string' ? JSON.parse(field.value_json) : field.value_json;
            };

            // Calculate complex payment terms string for display
            const paymentTermsField = pendingFields.find(f => f.field_name === 'payment_terms') ||
                extractedFields.find(f => f.field_name === 'payment_terms');
            let paymentTermsStr = undefined;
            if (paymentTermsField) {
                if (paymentTermsField.value_text) paymentTermsStr = paymentTermsField.value_text;
                else if (paymentTermsField.value_json) {
                    try {
                        const pt = typeof paymentTermsField.value_json === 'string'
                            ? JSON.parse(paymentTermsField.value_json)
                            : paymentTermsField.value_json;
                        const parts = [];
                        if (pt.frequency) parts.push(pt.frequency);
                        if (pt.dueDate) parts.push(pt.dueDate);
                        // if (pt.paymentMethod) parts.push(`via ${pt.paymentMethod}`);
                        if (parts.length > 0) paymentTermsStr = parts.join(' - ');
                    } catch (e) { }
                }
            }

            // Update contract with final reviewed values
            await db.contracts.update(contractId as string, {
                status: 'active',
                review_status: 'approved',
                parsing_status: 'completed',
                reviewed_at: new Date().toISOString(),

                // Sync core fields
                start_date: getFieldValue('effective_date'),
                end_date: getFieldValue('expiration_date'),
                renewal_terms: getFieldValue('renewal_terms'),
                payment_terms: paymentTermsStr || getFieldValue('payment_terms'), // Prefer formatted string

                // Sync complex objects
                rebate_tiers: getJsonValue('rebateTiers') || [],
                products: getJsonValue('products') || [],
            });

            toast({
                title: "Review Completed",
                description: "Contract has been approved and is now active.",
            });

            // Redirect back to contracts list
            router.push('/dashboard/contracts');
        } catch (error) {
            console.error('Error completing review:', error);
            toast({
                title: "Error completing review",
                description: "Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleJumpToPage = (page: number) => {
        setForcedPage(page);
    };

    const handleRetryProcessing = async () => {
        try {
            // Reset contract parsing status to pending to trigger reprocessing
            await db.contracts.update(contractId as string, {
                parsing_status: 'pending',
            });

            // Reset file statuses
            for (const file of files) {
                await db.contract_files.update(file.id, {
                    parsing_status: 'pending',
                    parsing_started_at: undefined,
                    parsing_completed_at: undefined,
                    extraction_errors: undefined,
                });
            }

            toast({
                title: 'Reprocessing started',
                description: 'The AI will attempt to extract data again.',
            });

            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error retrying processing:', error);
            toast({
                title: 'Error',
                description: 'Failed to retry processing. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleManualEntry = () => {
        // Navigate to manual entry mode or enable editing
        toast({
            title: 'Manual entry mode',
            description: 'You can now enter contract data manually.',
        });
        // Could update contract status to allow manual editing
    };

    const handleContinueToReview = () => {
        // Just a simple state refresh to show the review UI
        // The component will re-render and show the review interface
        fetchData();
    };

    const handleFilesReorder = async (reorderedFiles: any[]) => {
        setFiles(reorderedFiles);
        // TODO: Persist the order to database if needed
        // Could add a display_order field to contract_files table
    };

    const handleFileAction = async (fileId: string, action: string) => {
        try {
            switch (action) {
                case 'delete':
                    await handleDeleteFile(fileId);
                    break;
                case 'retry':
                    await handleRetryFile(fileId);
                    break;
                case 'download':
                    await handleDownloadFile(fileId);
                    break;
                case 'openExternal':
                    await handleOpenFileExternal(fileId);
                    break;
                case 'markPrimary':
                    await handleMarkPrimary(fileId);
                    break;
                case 'linkAmendment':
                    toast({
                        title: 'Feature coming soon',
                        description: 'Amendment linking will be available in the next update.',
                    });
                    break;
                default:
                    console.warn(`Unknown action: ${action}`);
            }
        } catch (error: any) {
            console.error(`Error performing action ${action}:`, error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to perform action',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        // Don't allow deleting the last file
        if (files.length === 1) {
            toast({
                title: 'Cannot delete',
                description: 'Cannot delete the last file. At least one file is required.',
                variant: 'destructive',
            });
            return;
        }

        // Delete from database
        await db.contract_files.delete(fileId);

        // Delete file blob
        await db.file_blobs.delete(fileId);

        // Delete associated extracted fields
        const fieldsToDelete = await db.extracted_fields
            .where('source_file_id')
            .equals(fileId)
            .toArray();

        for (const field of fieldsToDelete) {
            await db.extracted_fields.delete(field.id);
        }

        // Update contract document count
        const remainingFiles = files.filter(f => f.id !== fileId);
        await db.contracts.update(contractId as string, {
            document_count: remainingFiles.length,
        });

        toast({
            title: 'File deleted',
            description: 'The file and all associated data have been removed.',
        });

        // Refresh data
        fetchData();

        // If deleted file was selected, select another file
        if (fileId === selectedFileId) {
            setSelectedFileId(remainingFiles[0]?.id || null);
        }
    };

    const handleRetryFile = async (fileId: string) => {
        // Reset file parsing status
        await db.contract_files.update(fileId, {
            parsing_status: 'pending',
            parsing_started_at: undefined,
            parsing_completed_at: undefined,
            extraction_errors: undefined,
        });

        toast({
            title: 'Processing restarted',
            description: 'The file will be reprocessed.',
        });

        fetchData();
    };

    const handleDownloadFile = async (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file) return;

        const blob = await db.file_blobs.get(fileId);
        if (!blob || !blob.blob) {
            toast({
                title: 'Error',
                description: 'File data not found',
                variant: 'destructive',
            });
            return;
        }

        const url = URL.createObjectURL(blob.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleOpenFileExternal = async (fileId: string) => {
        const blob = await db.file_blobs.get(fileId);
        if (!blob || !blob.blob) {
            toast({
                title: 'Error',
                description: 'File data not found',
                variant: 'destructive',
            });
            return;
        }

        const url = URL.createObjectURL(blob.blob);
        window.open(url, '_blank');
    };

    const handleMarkPrimary = async (fileId: string) => {
        // Mark this file as primary and unmark others
        // This would require adding an is_primary field to the schema
        toast({
            title: 'Feature coming soon',
            description: 'Primary document designation will be available in the next update.',
        });
    };

    const handleApproveField = async (fieldId: string) => {
        try {
            await db.extracted_fields.update(fieldId, {
                review_status: 'approved',
                reviewed_at: new Date().toISOString(),
            });

            // Update local state
            setExtractedFields(prev =>
                prev.map(f => (f.id === fieldId ? { ...f, review_status: 'approved' } : f))
            );
        } catch (error: any) {
            console.error('Error approving field:', error);
            toast({
                title: 'Error',
                description: 'Failed to approve field',
                variant: 'destructive',
            });
        }
    };

    const handleRejectField = async (fieldId: string) => {
        try {
            await db.extracted_fields.update(fieldId, {
                review_status: 'rejected',
                reviewed_at: new Date().toISOString(),
            });

            setExtractedFields(prev =>
                prev.map(f => (f.id === fieldId ? { ...f, review_status: 'rejected' } : f))
            );
        } catch (error: any) {
            console.error('Error rejecting field:', error);
            toast({
                title: 'Error',
                description: 'Failed to reject field',
                variant: 'destructive',
            });
        }
    };

    const handleBulkAction = async (action: string, fields: any[]) => {
        try {
            switch (action) {
                case 'approve-high-confidence':
                case 'approve-all-pending':
                    for (const field of fields) {
                        await db.extracted_fields.update(field.id, {
                            review_status: 'approved',
                            reviewed_at: new Date().toISOString(),
                        });
                    }
                    break;

                case 'reject-low-confidence':
                case 'flag-for-review':
                    for (const field of fields) {
                        await db.extracted_fields.update(field.id, {
                            review_status: 'rejected',
                            reviewed_at: new Date().toISOString(),
                        });
                    }
                    break;

                case 'hide-approved':
                    setHideApproved(true);
                    break;

                case 'show-all':
                    setHideApproved(false);
                    break;
            }

            // Refresh data
            await fetchData();
        } catch (error: any) {
            console.error('Error performing bulk action:', error);
            throw error;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Show processing state if not completed
    if (
        contract?.parsing_status === 'pending' ||
        contract?.parsing_status === 'processing' ||
        contract?.parsing_status === 'failed'
    ) {
        return (
            <div className="h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-background">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold">{contract?.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                {contract?.parsing_status === 'processing' && 'AI is processing...'}
                                {contract?.parsing_status === 'pending' && 'Waiting to process...'}
                                {contract?.parsing_status === 'failed' && 'Processing failed'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Processing State */}
                <ContractProcessingState
                    parsingStatus={contract?.parsing_status || 'pending'}
                    filesCount={files.length}
                    filesProcessed={filesProcessed}
                    filesWithErrors={filesWithErrors}
                    totalFieldsExtracted={extractedFields.length}
                    extractionConfidence={contract?.extraction_confidence || 0}
                    errorMessage={contract?.error_message}
                    onRetry={handleRetryProcessing}
                    onManualEntry={handleManualEntry}
                    onContinueToReview={handleContinueToReview}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100svh-4rem)] bg-white">
            {/* Compact Review Bar (V3 Styled) */}
            <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-20">
                {/* Left: Back + Title */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="h-8 w-8 text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="h-4 w-px bg-slate-200" />

                    <h1 className="text-sm font-bold text-slate-900">{contract?.name}</h1>

                    <Badge variant="outline" className="text-xs font-mono bg-slate-50 text-slate-600 border-slate-200 rounded-sm">
                        {extractedFields.filter(f => f.review_status === 'approved').length}/{extractedFields.length} Reviewed
                    </Badge>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave()}
                        className="h-8 text-slate-700 border-slate-300 bg-white hover:bg-slate-50 rounded-md shadow-sm"
                    >
                        <Save className="h-3.5 w-3.5 mr-2 text-slate-400" />
                        Save
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-slate-700 border-slate-300 bg-white hover:bg-slate-50 rounded-md shadow-sm">
                                <Sparkles className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                                Bulk Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <BulkReviewToolbar
                                fields={extractedFields}
                                onBulkAction={handleBulkAction}
                                inline={true}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        onClick={handleCompleteReview}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 rounded-md shadow-sm border border-indigo-700"
                    >
                        <CheckCircle className="h-3.5 w-3.5 mr-2" />
                        Complete Review
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal">
                    {/* Left Panel: Document Thumbnail Strip */}
                    <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
                        <DocumentThumbnailStrip
                            files={files}
                            selectedFileId={selectedFileId}
                            onFileSelect={setSelectedFileId}
                            onFilesReorder={handleFilesReorder}
                            onFileAction={handleFileAction}
                        />
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Middle Panel: Document Viewer */}
                    <ResizablePanel defaultSize={42} minSize={30}>
                        <DocumentViewer
                            files={files}
                            selectedFileId={selectedFileId}
                            onFileSelect={setSelectedFileId}
                            forcedPage={forcedPage}
                        />
                    </ResizablePanel>

                    <ResizableHandle />

                    {/* Right Panel: Data Editor */}
                    <ResizablePanel defaultSize={43} minSize={30}>
                        <ExtractedDataEditor
                            fields={extractedFields}
                            onUpdate={setExtractedFields}
                            onJumpToPage={handleJumpToPage}
                            files={files}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Quick File Switcher Dialog */}
            <QuickFileSwitcher
                open={quickSwitcherOpen}
                onOpenChange={setQuickSwitcherOpen}
                files={files}
                selectedFileId={selectedFileId}
                onFileSelect={setSelectedFileId}
            />

            {/* Keyboard Shortcuts Help */}
            <KeyboardShortcutsHelp />
        </div>
    );
}
