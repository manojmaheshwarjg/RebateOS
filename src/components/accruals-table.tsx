'use client';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';

interface Accrual {
    id: string;
    contractId: string;
    accrualDate: string;
    amount: number;
    status: 'accrued' | 'paid';
    notes: string;
}

interface Contract {
    id: string;
    name: string;
}

interface EnrichedAccrual extends Accrual {
    contractName: string;
}

export default function AccrualsTable() {
    const { firestore, user } = useFirebase();
    const [enrichedAccruals, setEnrichedAccruals] = useState<EnrichedAccrual[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const accrualsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'accruals'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: accruals, isLoading: accrualsLoading } = useCollection<Accrual>(accrualsQuery);

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // This is inefficient if there are many contracts, but fine for this demo.
        // A better approach would be to fetch only the contracts needed for the visible accruals.
        return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: contracts, isLoading: contractsLoading } = useCollection<Contract>(contractsQuery);

    useEffect(() => {
        setIsLoading(accrualsLoading || contractsLoading);
        if (accruals && contracts) {
            const contractMap = new Map(contracts.map(c => [c.id, c.name]));
            const newEnrichedAccruals = accruals.map(accrual => ({
                ...accrual,
                contractName: contractMap.get(accrual.contractId) || 'Unknown Contract',
            }));
            setEnrichedAccruals(newEnrichedAccruals);
        } else if (!accrualsLoading && !contractsLoading) {
            setEnrichedAccruals([]);
        }
    }, [accruals, contracts, accrualsLoading, contractsLoading]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (enrichedAccruals.length === 0) {
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
                {enrichedAccruals.map((accrual) => (
                    <TableRow key={accrual.id}>
                        <TableCell className="font-medium">{accrual.contractName}</TableCell>
                        <TableCell>{new Date(accrual.accrualDate).toLocaleDateString()}</TableCell>
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
