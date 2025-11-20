'use client';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useState, useEffect } from 'react';

interface Claim {
    id: string;
    contractId: string;
    vendorId: string;
    claimDate: string;
    claimAmount: number;
    status: 'pending-review' | 'approved' | 'rejected';
    details: string;
}

interface Contract {
    id: string;
    name: string;
}

interface EnrichedClaim extends Claim {
    contractName: string;
}


export default function EligibilityQueueTable() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [enrichedClaims, setEnrichedClaims] = useState<EnrichedClaim[]>([]);
    const [claimsLoading, setClaimsLoading] = useState(true);

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: contracts, isLoading: contractsLoading } = useCollection<Contract>(contractsQuery);

    const claimsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'claims'), where('vendorId', '==', user.uid), where('status', '==', 'pending-review'));
    }, [firestore, user]);

    const { data: claims, isLoading: areClaimsLoading } = useCollection<Claim>(claimsQuery);

     useEffect(() => {
        setClaimsLoading(contractsLoading || areClaimsLoading);
        if (claims && contracts) {
            const contractMap = new Map(contracts.map(c => [c.id, c.name]));
            const newEnrichedClaims = claims.map(claim => ({
                ...claim,
                contractName: contractMap.get(claim.contractId) || 'Unknown Contract',
            }));
            setEnrichedClaims(newEnrichedClaims);
        } else if (!contractsLoading && !areClaimsLoading) {
            setEnrichedClaims([]);
        }
    }, [claims, contracts, contractsLoading, areClaimsLoading]);


    const handleStatusUpdate = (claimId: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;
        const claimRef = doc(firestore, 'claims', claimId);
        updateDocumentNonBlocking(claimRef, { status });
        toast({
            title: "Success",
            description: `Claim status updated to ${status}.`
        })
    };


    if (claimsLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (enrichedClaims.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">Queue is Clear</h3>
                <p className="text-muted-foreground mt-2">
                    There are no claims pending review in the eligibility queue.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {enrichedClaims.map((claim) => (
                    <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.contractName}</TableCell>
                        <TableCell>${claim.claimAmount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(claim.claimDate).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{claim.details}</TableCell>
                        <TableCell>
                            <Badge variant={claim.status === 'pending-review' ? 'secondary' : 'default'}>
                                {claim.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(claim.id, 'approved')}>
                                        Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(claim.id, 'rejected')}>
                                        Reject
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
