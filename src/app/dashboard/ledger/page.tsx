'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PlusCircle } from 'lucide-react';
import AccrualsTable from '@/components/accruals-table';
import { useFirebase } from '@/firebase';
import { collection, where, query, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

export default function LedgerPage() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAccruals = async () => {
        if (!firestore || !user) {
            toast({
                title: 'Error',
                description: 'User not authenticated.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        try {
            // Fetch all 'approved' claims for the current vendor
            const claimsRef = collection(firestore, 'claims');
            const q = query(claimsRef, where('vendorId', '==', user.uid), where('status', '==', 'approved'));
            const querySnapshot = await getDocs(q);

            const accrualsCollection = collection(firestore, 'accruals');
            
            // In a real app, you'd check if an accrual for a claim already exists.
            // For this demo, we'll just create new ones.
            const accrualPromises = querySnapshot.docs.map(claimDoc => {
                const claim = claimDoc.data();
                const newAccrual = {
                    id: uuidv4(),
                    claimId: claimDoc.id,
                    contractId: claim.contractId,
                    vendorId: user.uid,
                    accrualDate: new Date().toISOString(),
                    amount: claim.claimAmount,
                    status: 'accrued',
                    notes: `Accrual for claim ${claimDoc.id}`,
                };
                return addDocumentNonBlocking(accrualsCollection, newAccrual);
            });
            
            await Promise.all(accrualPromises);

            toast({
                title: 'Success',
                description: `Generated ${querySnapshot.docs.length} new accrual(s).`,
            });
        } catch (error) {
            console.error("Error generating accruals:", error);
            toast({
                title: 'Error',
                description: 'Could not generate accruals.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };


    return (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Accruals Ledger</CardTitle>
                    <CardDescription>Generate and manage accrual entries for approved claims.</CardDescription>
                </div>
                <Button onClick={handleGenerateAccruals} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Accruals'}
                </Button>
            </CardHeader>
            <CardContent>
                <AccrualsTable />
            </CardContent>
        </Card>
    );
}
