'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface GlobalDragDropContextType {
    isDragging: boolean;
    draggedFiles: File[];
    clearDraggedFiles: () => void;
}

const GlobalDragDropContext = createContext<GlobalDragDropContextType | undefined>(undefined);

export function GlobalDragDropProvider({ children }: { children: React.ReactNode }) {
    const [isDragging, setIsDragging] = useState(false);
    const [draggedFiles, setDraggedFiles] = useState<File[]>([]);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer?.types.includes('Files')) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only cancel if we're leaving the window (target is null) or moving to a non-child element
        if (e.relatedTarget === null) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
        setIsDragging(true);
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            setDraggedFiles(files);
        }
    }, []);

    const clearDraggedFiles = useCallback(() => {
        setDraggedFiles([]);
    }, []);

    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    return (
        <GlobalDragDropContext.Provider value={{ isDragging, draggedFiles, clearDraggedFiles }}>
            {children}
        </GlobalDragDropContext.Provider>
    );
}

export function useGlobalDragDrop() {
    const context = useContext(GlobalDragDropContext);
    if (context === undefined) {
        throw new Error('useGlobalDragDrop must be used within a GlobalDragDropProvider');
    }
    return context;
}
