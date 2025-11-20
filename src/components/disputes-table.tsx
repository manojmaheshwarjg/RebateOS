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
import { collection, query, where, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useState, useEffect, useMemo } from 'react';

interface Dispute {
    id: string;
    claimId: string;
    vendorId: string;
    disputeDate: string;
    reason: string;
    status: 'open' | 'resolved' | 'closed';
}

interface Claim {
    id: string;
    details: string;
}

interface EnrichedDispute extends Dispute {
    claimDetails: string;
}

export default function DisputesTable() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [enrichedDisputes, setEnrichedDisputes] = useState<EnrichedDispute[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const disputesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'disputes'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: disputes, isLoading: disputesLoading } = useCollection<Dispute>(disputesQuery);

    const claimIds = useMemo(() => {
        if (!disputes) return [];
        // Firestore 'in' query is limited to 30 items.
        return [...new Set(disputes.map(d => d.claimId))].slice(0, 30);
    }, [disputes]);
    
    const claimsQuery = useMemoFirebase(() => {
        if (!firestore || claimIds.length === 0) return null;
        return query(collection(firestore, 'claims'), where('id', 'in', claimIds));
    }, [firestore, claimIds]);

    const { data: claims, isLoading: claimsLoading } = useCollection<Claim>(claimsQuery);

    useEffect(() => {
        setIsLoading(disputesLoading || claimsLoading);
        if (disputes && claims) {
            const claimMap = new Map(claims.map(c => [c.id, c.details]));
            const newEnrichedDisputes = disputes.map(dispute => ({
                ...dispute,
                claimDetails: claimMap.get(dispute.claimId) || 'Unknown Claim',
            }));
            setEnrichedDisputes(newEnrichedDisputes);
        } else if (!disputesLoading && !claimsLoading) {
            setEnrichedDisputes([]);
        }
    }, [disputes, claims, disputesLoading, claimsLoading]);
    

    const handleStatusUpdate = (disputeId: string, status: 'resolved' | 'closed') => {
        if (!firestore) return;
        const disputeRef = doc(firestore, 'disputes', disputeId);
        updateDocumentNonBlocking(disputeRef, { status });
        toast({
            title: "Success",
            description: `Dispute status updated to ${status}.`
        });
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
    
    if (!enrichedDisputes || enrichedDisputes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No Active Disputes</h3>
                <p className="text-muted-foreground mt-2">
                    All clear! There are no disputes that require your attention.
                </p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Claim Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {enrichedDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                        <TableCell className="font-medium max-w-xs truncate">{dispute.claimDetails}</TableCell>
                        <TableCell>{new Date(dispute.disputeDate).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{dispute.reason}</TableCell>
                        <TableCell>
                            <Badge variant={dispute.status === 'open' ? 'destructive' : 'secondary'}>
                                {dispute.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={dispute.status !== 'open'}>
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(dispute.id, 'resolved')}>
                                        Mark as Resolved
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(dispute.id, 'closed')}>
                                        Mark as Closed
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
