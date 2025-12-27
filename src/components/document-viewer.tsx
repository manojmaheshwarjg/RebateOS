'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    FileText,
    Loader2,
    Download,
    ExternalLink
} from 'lucide-react';
import { db } from '@/lib/local-storage/db';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
    files: any[];
    selectedFileId: string | null;
    onFileSelect: (fileId: string) => void;
    forcedPage?: number;
}

export default function DocumentViewer({ files, selectedFileId, onFileSelect, forcedPage }: DocumentViewerProps) {
    const [scale, setScale] = useState(100);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedFile = files.find(f => f.id === selectedFileId);

    // Load PDF from IndexedDB when file selection changes
    useEffect(() => {
        async function loadPdf() {
            if (!selectedFile) {
                setPdfUrl(null);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Get blob from IndexedDB
                const blob = await db.file_blobs.get(selectedFile.id);

                if (!blob || !blob.blob) {
                    setError('File data not found in database');
                    setPdfUrl(null);
                    return;
                }

                // Create object URL from blob
                const url = URL.createObjectURL(blob.blob);
                setPdfUrl(url);
            } catch (err: any) {
                console.error('Error loading PDF:', err);
                setError(err.message || 'Failed to load PDF');
                setPdfUrl(null);
            } finally {
                setLoading(false);
            }
        }

        loadPdf();

        // Cleanup object URL on unmount or file change
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [selectedFile?.id]);

    const handleDownload = () => {
        if (pdfUrl && selectedFile) {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = selectedFile.file_name || 'document.pdf';
            a.click();
        }
    };

    const handleOpenInNewTab = () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {files.length > 1 ? (
                            <Select value={selectedFileId || undefined} onValueChange={onFileSelect}>
                                <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="Select a document" />
                                </SelectTrigger>
                                <SelectContent>
                                    {files.map((file) => (
                                        <SelectItem key={file.id} value={file.id}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span className="truncate">{file.file_name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : selectedFile ? (
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold text-sm text-slate-900 truncate">{selectedFile.file_name}</span>
                            </div>
                        ) : (
                            <span className="text-sm text-slate-500">No document selected</span>
                        )}
                        {selectedFile?.document_type && (
                            <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-0 font-semibold">
                                {selectedFile.document_type}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-white"
                            onClick={() => setScale(Math.max(50, scale - 25))}
                            disabled={!pdfUrl || scale <= 50}
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-xs font-semibold min-w-[45px] text-center text-slate-700">
                            {scale}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-white"
                            onClick={() => setScale(Math.min(200, scale + 25))}
                            disabled={!pdfUrl || scale >= 200}
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Action buttons */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-200 hover:bg-slate-50"
                        onClick={handleDownload}
                        disabled={!pdfUrl}
                        title="Download"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-slate-200 hover:bg-slate-50"
                        onClick={handleOpenInNewTab}
                        disabled={!pdfUrl}
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Document Display Area */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100">
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-sm font-medium text-slate-700">Loading document...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-8">
                            <div className="bg-red-50 rounded-full p-4 inline-block mb-4">
                                <FileText className="h-12 w-12 text-red-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2 text-slate-900">Failed to load document</h3>
                            <p className="text-sm text-slate-600">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && !selectedFile && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
                            <div className="bg-slate-100 rounded-full p-4 inline-block mb-4">
                                <FileText className="h-16 w-16 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                No Document Selected
                            </h3>
                            <p className="text-sm text-slate-600">
                                Select a document from the list to view it
                            </p>
                        </div>
                    </div>
                )}

                {!loading && !error && pdfUrl && (
                    <div className="flex justify-center h-full">
                        <div
                            className="bg-white shadow-xl rounded-lg overflow-hidden border border-slate-200"
                            style={{
                                width: `${scale}%`,
                                minHeight: '100%'
                            }}
                        >
                            <iframe
                                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                                className="w-full h-full"
                                style={{ minHeight: '90vh', border: 'none' }}
                                title="PDF Viewer"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
