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
import { useRouter } from 'next/navigation';

interface Contract {
    id: string;
    name: string;
    vendorId: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'inactive' | 'pending';
}

export default function ContractsTable() {
    const { firestore, user } = useFirebase();
    const router = useRouter();

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: contracts, isLoading } = useCollection<Contract>(contractsQuery);

    const handleRowClick = (contractId: string) => {
        router.push(`/dashboard/contracts/${contractId}`);
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
    
    if (!contracts || contracts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No Contracts Yet</h3>
                <p className="text-muted-foreground mt-2">
                    Your contract inbox is empty. Upload a contract to get started.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Contract Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {contracts.map((contract) => (
                    <TableRow key={contract.id} onClick={() => handleRowClick(contract.id)} className="cursor-pointer">
                        <TableCell className="font-medium">{contract.name}</TableCell>
                        <TableCell>
                            <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                                {contract.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
