'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/components/local-storage-provider';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useToast } from '@/hooks/use-toast';
import MultiDocumentUpload from '@/components/multi-document-upload';
import { useGlobalDragDrop } from '@/components/global-drag-drop-context';

interface AddContractDialogProps {
    children: React.ReactNode;
}

export default function AddContractDialog({ children }: AddContractDialogProps) {
    const router = useRouter();
    const { db, userId } = useLocalStorage();
    const { toast } = useToast();
    const { draggedFiles, clearDraggedFiles } = useGlobalDragDrop();

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'create' | 'upload'>('create');
    const [contractId, setContractId] = useState<string | null>(null);
    const [contractName, setContractName] = useState('');
    const [vendorName, setVendorName] = useState('');

    // Auto-advance if files were dragged
    useState(() => {
        if (draggedFiles.length > 0 && isOpen) {
            if (!contractName) {
                setContractName(`Contract Package - ${new Date().toLocaleDateString()}`);
            }
        }
    });

    const handleCreateContract = async () => {
        if (!contractName.trim()) {
            toast({
                title: 'Contract name required',
                description: 'Please enter a contract name.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const newContractId = generateId();
            const now = getCurrentTimestamp();

            await db.contracts.add({
                id: newContractId,
                vendor_id: userId,
                name: contractName,
                status: 'draft',
                parsing_status: 'pending',
                description: vendorName ? `Contract with ${vendorName}` : undefined,
                created_at: now,
                updated_at: now,
            });

            setContractId(newContractId);
            setStep('upload');
        } catch (error: any) {
            toast({
                title: 'Failed to create contract',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleUploadComplete = () => {
        toast({
            title: '🎉 Documents uploaded!',
            description: 'AI is now processing your contract documents.',
        });
        setIsOpen(false);
        resetDialog();
        clearDraggedFiles();
        router.refresh(); // Refresh to show new contract
    };

    const resetDialog = () => {
        setStep('create');
        setContractId(null);
        setContractName('');
        setVendorName('');
        clearDraggedFiles();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) resetDialog();
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        {step === 'create' ? 'Create New Contract' : 'Upload Contract Documents'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'create'
                            ? 'Enter contract details to get started.'
                            : 'Upload multiple documents. AI will automatically extract and organize key data.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'create' ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="contractName">Contract Name *</Label>
                            <Input
                                id="contractName"
                                placeholder="e.g., Johnson & Johnson Pharmaceutical Agreement 2024"
                                value={contractName}
                                onChange={(e) => setContractName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vendorName">Vendor Name (Optional)</Label>
                            <Input
                                id="vendorName"
                                placeholder="e.g., Johnson & Johnson"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreateContract} className="w-full" size="lg">
                            {draggedFiles.length > 0
                                ? `Continue to Upload ${draggedFiles.length} File(s) →`
                                : 'Continue to Upload Documents →'}
                        </Button>
                    </div>
                ) : (
                    <MultiDocumentUpload
                        contractId={contractId!}
                        onUploadComplete={handleUploadComplete}
                        initialFiles={draggedFiles}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
