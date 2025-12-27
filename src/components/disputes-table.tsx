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

interface Dispute {
    id: string;
    claim_id: string;
    dispute_date: string;
    reason: string;
    status: 'open' | 'resolved' | 'closed';
    claims: {
        details: string;
    } | null;
}

export default function DisputesTable() {
    const { db, userId } = useLocalStorage();
    const { toast } = useToast();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDisputes = async () => {
        setIsLoading(true);
        try {
            // Fetch disputes
            const disputesData = await db.disputes
                .where('vendor_id')
                .equals(userId)
                .reverse()
                .sortBy('dispute_date');

            // Get unique claim IDs
            const claimIds = [...new Set(disputesData.map(d => d.claim_id))];

            // Fetch claims in bulk
            const claims = await db.claims.bulkGet(claimIds);

            // Create a map for quick lookup
            const claimMap = new Map(
                claims.filter(Boolean).map(c => [c!.id, c!])
            );

            // Enrich disputes with claim details
            const enrichedDisputes = disputesData.map(dispute => ({
                ...dispute,
                claims: claimMap.get(dispute.claim_id) ? { details: claimMap.get(dispute.claim_id)!.details } : null,
            })) as Dispute[];

            setDisputes(enrichedDisputes);
        } catch (error) {
            console.error('Error fetching disputes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, [db, userId]);


    const handleStatusUpdate = async (disputeId: string, status: 'resolved' | 'closed') => {
        try {
            await db.disputes.update(disputeId, { status });

            toast({
                title: "Success",
                description: `Dispute status updated to ${status}.`
            });

            // Refresh the list
            fetchDisputes();
        } catch (error) {
            console.error('Error updating dispute status:', error);
            toast({
                title: "Error",
                description: "Failed to update dispute status.",
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

    if (!disputes || disputes.length === 0) {
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
                {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                        <TableCell className="font-medium max-w-xs truncate">{dispute.claims?.details || 'Unknown Claim'}</TableCell>
                        <TableCell>{new Date(dispute.dispute_date).toLocaleDateString()}</TableCell>
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
