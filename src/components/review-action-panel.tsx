'use client';

import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ReviewActionPanelProps {
    onApprove: () => void;
    onReject: () => void;
}

export default function ReviewActionPanel({ onApprove, onReject }: ReviewActionPanelProps) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReject} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onApprove} className="text-green-500 hover:text-green-600 hover:bg-green-50">
                <Check className="h-4 w-4" />
            </Button>
        </div>
    );
}
