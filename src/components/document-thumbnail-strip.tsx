'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle, Clock, GripVertical, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/local-storage/db';
import { motion, Reorder } from 'framer-motion';
import DocumentActionsMenu from './document-actions-menu';

interface DocumentThumbnailStripProps {
    files: any[];
    selectedFileId: string | null;
    onFileSelect: (fileId: string) => void;
    onFilesReorder?: (files: any[]) => void;
    onFileAction?: (fileId: string, action: 'delete' | 'retry' | 'download') => void;
}

interface ThumbnailData {
    fileId: string;
    dataUrl: string | null;
    loading: boolean;
    error: boolean;
}

export default function DocumentThumbnailStrip({
    files,
    selectedFileId,
    onFileSelect,
    onFilesReorder,
    onFileAction,
}: DocumentThumbnailStripProps) {
    const [thumbnails, setThumbnails] = useState<Map<string, ThumbnailData>>(new Map());
    const [orderedFiles, setOrderedFiles] = useState(files);
    const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

    // Update ordered files when files prop changes
    useEffect(() => {
        setOrderedFiles(files);
    }, [files]);

    // Generate thumbnails for all files
    // TEMPORARILY DISABLED: PDF.js has compatibility issues with Next.js 15 webpack
    // TODO: Re-enable when pdfjs-dist is compatible or find alternative solution
    useEffect(() => {
        // For now, just show placeholder icons for all files
        files.forEach(file => {
            setThumbnails(prev => new Map(prev).set(file.id, {
                fileId: file.id,
                dataUrl: null,
                loading: false,
                error: true, // Will show the placeholder icon
            }));
        });
    }, [files]);

    const handleReorder = (newOrder: any[]) => {
        setOrderedFiles(newOrder);
        if (onFilesReorder) {
            onFilesReorder(newOrder);
        }
    };

    const getStatusIcon = (file: any) => {
        switch (file.parsing_status) {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'failed':
                return 'bg-red-500';
            case 'processing':
                return 'bg-blue-500';
            case 'pending':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-400';
        }
    };

    return (
        <div className="h-full flex flex-col bg-white border-r border-slate-200">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">Documents</span>
                    <span className="text-xs text-slate-400">({files.length})</span>
                </div>
            </div>

            {/* Document List */}
            <ScrollArea className="flex-1">
                <div className="p-1.5">
                    {orderedFiles.map((file, index) => {
                        const isSelected = file.id === selectedFileId;

                        return (
                            <div
                                key={file.id}
                                onClick={() => onFileSelect(file.id)}
                                className={cn(
                                    'group relative flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer',
                                    isSelected
                                        ? 'bg-blue-50 text-blue-900'
                                        : 'hover:bg-slate-50'
                                )}
                            >
                                {/* Number */}
                                <span className={cn(
                                    "flex-shrink-0 text-[10px] font-medium w-4 text-center",
                                    isSelected ? "text-blue-600" : "text-slate-400"
                                )}>
                                    {index + 1}
                                </span>

                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {getStatusIcon(file)}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5">
                                        <p className={cn(
                                            "text-xs font-medium truncate",
                                            isSelected ? "text-blue-900" : "text-slate-900"
                                        )} title={file.file_name}>
                                            {file.file_name}
                                        </p>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {file.page_count && (
                                            <span className="text-[10px] text-slate-500">{file.page_count}p</span>
                                        )}
                                        {file.extraction_confidence && (
                                            <span className="text-[10px] text-slate-500">
                                                {Math.round(file.extraction_confidence * 100)}%
                                            </span>
                                        )}
                                        {file.document_type && (
                                            <span className="text-[10px] text-slate-500">{file.document_type}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DocumentActionsMenu
                                        file={file}
                                        onAction={onFileAction || (() => {})}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
