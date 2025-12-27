'use client';
import { useEffect, useState } from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Contract } from '@/lib/local-storage/db';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

import { Trash2, RefreshCw, AlertCircle, CheckCircle2, Inbox, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContractsTableProps {
    initialContracts?: Contract[];
}

export default function ContractsTable({ initialContracts }: ContractsTableProps = {}) {
    const { db, userId } = useLocalStorage();
    const router = useRouter();
    const { toast } = useToast();
    const [contracts, setContracts] = useState<Contract[]>(initialContracts || []);
    const [isLoading, setIsLoading] = useState(!initialContracts);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchContracts = async () => {
        try {
            const data = await db.contracts
                .where('vendor_id')
                .equals(userId)
                .reverse()
                .sortBy('created_at');

            setContracts(data);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (!initialContracts) {
            setIsLoading(true);
            fetchContracts();
        }
    }, [userId, initialContracts]);

    // Polling for processing contracts
    useEffect(() => {
        const hasProcessing = contracts.some(c =>
            c.parsing_status === 'processing' || c.parsing_status === 'pending'
        );

        if (hasProcessing) {
            const interval = setInterval(() => {
                fetchContracts();
            }, 5000); // Poll every 5 seconds

            return () => clearInterval(interval);
        }
    }, [contracts]);

    const handleRowClick = (contractId: string) => {
        router.push(`/dashboard/contracts/${contractId}`);
    };

    const handleDelete = async (e: React.MouseEvent, contractId: string) => {
        e.stopPropagation(); // Prevent row click
        if (!confirm('Are you sure you want to delete this contract?')) return;

        setIsDeleting(contractId);
        try {
            await db.contracts.delete(contractId);
            // Also delete related data
            await db.contract_files.where('contract_id').equals(contractId).delete();
            await db.extracted_fields.where('contract_id').equals(contractId).delete();

            setContracts(prev => prev.filter(c => c.id !== contractId));
            toast({
                title: 'Contract deleted',
                description: 'The contract has been successfully removed.',
            });
        } catch (error: any) {
            console.error('Error deleting contract:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete contract.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const getStatusBadge = (contract: Contract) => {
        if (contract.parsing_status === 'processing') {
            return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
        }
        if (contract.parsing_status === 'failed') {
            return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
        }
        if (contract.status === 'active') {
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
        }
        if (contract.status === 'draft') {
            return <Badge variant="secondary">Draft</Badge>;
        }
        return <Badge variant="outline">{contract.status}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-muted/10">
                    <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">No contracts found</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Upload a new contract to get started.
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contract Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.map((contract) => (
                                <TableRow key={contract.id} onClick={() => handleRowClick(contract.id)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{contract.name}</span>
                                            <span className="text-xs text-muted-foreground">Added {new Date(contract.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(contract)}
                                    </TableCell>
                                    <TableCell>{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>{contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => handleDelete(e, contract.id)}
                                            disabled={isDeleting === contract.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
