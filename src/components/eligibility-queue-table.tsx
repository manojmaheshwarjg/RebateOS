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
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface Claim {
    id: string;
    contract_id: string;
    claim_date: string;
    amount: number;
    status: 'pending-review' | 'approved' | 'rejected';
    details: string;
    contracts: {
        name: string;
    } | null;
}


export default function EligibilityQueueTable() {
    const { db, userId } = useLocalStorage();
    const { toast } = useToast();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClaims = async () => {
        setIsLoading(true);
        try {
            // Fetch pending claims
            const claimsData = await db.claims
                .where('vendor_id')
                .equals(userId)
                .and(claim => claim.status === 'pending-review')
                .reverse()
                .sortBy('claim_date');

            // Get unique contract IDs
            const contractIds = [...new Set(claimsData.map(c => c.contract_id))];

            // Fetch contracts in bulk
            const contracts = await db.contracts.bulkGet(contractIds);

            // Create a map for quick lookup
            const contractMap = new Map(
                contracts.filter(Boolean).map(c => [c!.id, c!])
            );

            // Enrich claims with contract names
            const enrichedClaims = claimsData.map(claim => ({
                ...claim,
                contracts: contractMap.get(claim.contract_id) ? { name: contractMap.get(claim.contract_id)!.name } : null,
            })) as Claim[];

            setClaims(enrichedClaims);
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, [db, userId]);


    const handleStatusUpdate = async (claimId: string, status: 'approved' | 'rejected') => {
        try {
            await db.claims.update(claimId, { status });

            toast({
                title: "Success",
                description: `Claim status updated to ${status}.`
            });

            // Refresh the list
            fetchClaims();
        } catch (error) {
            console.error('Error updating claim status:', error);
            toast({
                title: "Error",
                description: "Failed to update claim status.",
                variant: "destructive"
            });
        }
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

    if (claims.length === 0) {
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
                {claims.map((claim) => (
                    <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.contracts?.name || 'Unknown Contract'}</TableCell>
                        <TableCell>${claim.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(claim.claim_date).toLocaleDateString()}</TableCell>
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
