'use client';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';

interface Accrual {
    id: string;
    contract_id: string;
    accrual_date: string;
    amount: number;
    status: 'accrued' | 'paid';
    notes: string;
    contracts: {
        name: string;
    } | null;
}

export default function AccrualsTable() {
    const { db, userId } = useLocalStorage();
    const [accruals, setAccruals] = useState<Accrual[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAccruals() {
            setIsLoading(true);
            try {
                // Fetch accruals
                const accrualsData = await db.accruals
                    .where('vendor_id')
                    .equals(userId)
                    .reverse()
                    .sortBy('accrual_date');

                // Get unique contract IDs
                const contractIds = [...new Set(accrualsData.map(a => a.contract_id))];

                // Fetch contracts in bulk
                const contracts = await db.contracts.bulkGet(contractIds);

                // Create a map for quick lookup
                const contractMap = new Map(
                    contracts.filter(Boolean).map(c => [c!.id, c!])
                );

                // Enrich accruals with contract names
                const enrichedAccruals = accrualsData.map(accrual => ({
                    ...accrual,
                    contracts: contractMap.get(accrual.contract_id) ? { name: contractMap.get(accrual.contract_id)!.name } : null,
                })) as Accrual[];

                setAccruals(enrichedAccruals);
            } catch (error) {
                console.error('Error fetching accruals:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAccruals();
    }, [db, userId]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    if (accruals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No Ledger Entries</h3>
                <p className="text-muted-foreground mt-2">
                    Your accruals ledger is currently empty. Generate accruals from approved claims to see entries here.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Accrual Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {accruals.map((accrual) => (
                    <TableRow key={accrual.id}>
                        <TableCell className="font-medium">{accrual.contracts?.name || 'Unknown Contract'}</TableCell>
                        <TableCell>{new Date(accrual.accrual_date).toLocaleDateString()}</TableCell>
                        <TableCell>${accrual.amount.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant={accrual.status === 'accrued' ? 'secondary' : 'default'}>
                                {accrual.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{accrual.notes}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
