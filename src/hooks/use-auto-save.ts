import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
    data: T;
    onSave: (data: T) => Promise<void>;
    delay?: number;
    enabled?: boolean;
}

export function useAutoSave<T>({ data, onSave, delay = 2000, enabled = true }: UseAutoSaveOptions<T>) {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousDataRef = useRef<T>(data);
    const isSavingRef = useRef(false);

    const save = useCallback(async (dataToSave: T) => {
        if (isSavingRef.current) return;

        try {
            isSavingRef.current = true;
            setStatus('saving');
            setError(null);

            await onSave(dataToSave);

            setStatus('saved');
            setLastSaved(new Date());
            previousDataRef.current = dataToSave;

            // Reset to idle after 2 seconds
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Failed to save');
            console.error('Auto-save error:', err);
        } finally {
            isSavingRef.current = false;
        }
    }, [onSave]);

    useEffect(() => {
        if (!enabled) return;

        // Check if data has changed
        const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
        if (!hasChanged) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        saveTimeoutRef.current = setTimeout(() => {
            save(data);
        }, delay);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [data, delay, enabled, save]);

    const saveNow = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        await save(data);
    }, [data, save]);

    return {
        status,
        error,
        lastSaved,
        saveNow,
        isSaving: status === 'saving',
    };
}
