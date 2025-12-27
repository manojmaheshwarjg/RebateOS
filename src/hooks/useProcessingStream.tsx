'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocalStorage } from '@/components/local-storage-provider';

export interface ProcessingStage {
    stage: 'uploading' | 'analyzing' | 'classifying' | 'extracting_financial' | 'extracting_products' | 'finalizing' | 'completed' | 'error';
    message: string;
    progress: number;
    confidence?: number;
    fieldsExtracted?: number;
    documentType?: string;
}

interface UseProcessingStreamReturn {
    currentStage: ProcessingStage | null;
    isProcessing: boolean;
    error: string | null;
}

export function useProcessingStream(fileId: string | null): UseProcessingStreamReturn {
    const { db } = useLocalStorage();
    const [currentStage, setCurrentStage] = useState<ProcessingStage | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProcessingStatus = useCallback(async () => {
        if (!fileId) return;

        try {
            const fileData = await db.contract_files.get(fileId);

            if (!fileData) {
                setError('File not found');
                setIsProcessing(false);
                return;
            }

            // Map database status to processing stage
            const parsingStatus = fileData.parsing_status;
            let stage: ProcessingStage;

            if (parsingStatus === 'pending' || !parsingStatus) {
                stage = {
                    stage: 'uploading',
                    message: 'Uploading document...',
                    progress: 30,
                };
                setIsProcessing(true);
            } else if (parsingStatus === 'processing') {
                // Determine sub-stage based on document_type
                if (!fileData.document_type) {
                    stage = {
                        stage: 'analyzing',
                        message: 'Analyzing document structure...',
                        progress: 40,
                    };
                } else if (!fileData.extracted_data || Object.keys(fileData.extracted_data).length === 0) {
                    stage = {
                        stage: 'classifying',
                        message: `Classified as ${fileData.document_type || 'contract'}...`,
                        progress: 60,
                        documentType: fileData.document_type,
                    };
                } else {
                    stage = {
                        stage: 'extracting_financial',
                        message: 'Extracting key data fields...',
                        progress: 80,
                        documentType: fileData.document_type,
                    };
                }
                setIsProcessing(true);
            } else if (parsingStatus === 'completed') {
                // Fetch field count from IndexedDB
                const count = await db.extracted_fields
                    .where('source_file_id')
                    .equals(fileId)
                    .count();

                stage = {
                    stage: 'completed',
                    message: `Processing complete! Extracted ${count || 0} fields.`,
                    progress: 100,
                    fieldsExtracted: count || 0,
                    confidence: fileData.extraction_confidence || 0,
                    documentType: fileData.document_type,
                };
                setIsProcessing(false);
            } else if (parsingStatus === 'failed') {
                stage = {
                    stage: 'error',
                    message: fileData.extraction_errors?.message || 'Processing failed',
                    progress: 0,
                };
                setError(fileData.extraction_errors?.message || 'Processing failed');
                setIsProcessing(false);
            } else {
                stage = {
                    stage: 'uploading',
                    message: 'Preparing document...',
                    progress: 10,
                };
                setIsProcessing(true);
            }

            setCurrentStage(stage);
        } catch (err: any) {
            console.error('Error fetching processing status:', err);
            setError(err.message);
            setIsProcessing(false);
        }
    }, [fileId, db]);

    useEffect(() => {
        if (!fileId) {
            setCurrentStage(null);
            setIsProcessing(false);
            setError(null);
            return;
        }

        // Initial fetch
        fetchProcessingStatus();

        // Poll every 500ms while processing
        const interval = setInterval(() => {
            if (isProcessing) {
                fetchProcessingStatus();
            }
        }, 500);

        return () => clearInterval(interval);
    }, [fileId, isProcessing, fetchProcessingStatus]);

    return {
        currentStage,
        isProcessing,
        error,
    };
}
