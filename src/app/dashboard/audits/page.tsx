'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface AuditData {
    contracts: any[];
    claims: any[];
    accruals: any[];
    disputes: any[];
    rules: any[];
}

export default function AuditsPage() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [auditData, setAuditData] = useState<AuditData | null>(null);

    const handleGenerateBinder = async () => {
        if (!firestore || !user) {
            toast({ title: 'Error', description: 'You must be logged in to generate an audit binder.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setAuditData(null);

        try {
            const contractIds: string[] = [];
            
            // Fetch contracts and collect their IDs
            const contractsQuery = query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
            const contractsSnapshot = await getDocs(contractsQuery);
            const contracts = contractsSnapshot.docs.map(doc => {
                const data = doc.data();
                contractIds.push(doc.id);
                return { id: doc.id, ...data };
            });

            // Fetch other collections
            const claimsQuery = query(collection(firestore, 'claims'), where('vendorId', '==', user.uid));
            const accrualsQuery = query(collection(firestore, 'accruals'), where('vendorId', '==', user.uid));
            const disputesQuery = query(collection(firestore, 'disputes'), where('vendorId', '==', user.uid));
            
            // Rules are queried by contractId, handle the 'in' query limitation (max 30)
            const rules = [];
            if (contractIds.length > 0) {
                 for (let i = 0; i < contractIds.length; i += 30) {
                    const chunk = contractIds.slice(i, i + 30);
                    const rulesQuery = query(collection(firestore, 'rebate_rules'), where('contractId', 'in', chunk));
                    const rulesSnapshot = await getDocs(rulesQuery);
                    rules.push(...rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }
            }
            
            const [claimsSnapshot, accrualsSnapshot, disputesSnapshot] = await Promise.all([
                getDocs(claimsQuery),
                getDocs(accrualsQuery),
                getDocs(disputesQuery)
            ]);

            const claims = claimsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const accruals = accrualsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const disputes = disputesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setAuditData({ contracts, claims, accruals, disputes, rules });
            toast({ title: 'Success', description: 'Audit binder data generated successfully.' });
        } catch (error) {
            console.error("Error generating audit binder:", error);
            toast({ title: 'Error', description: 'Failed to generate audit binder.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Audit Binder</CardTitle>
                    <CardDescription>Generate audit binders for compliance and audit purposes.</CardDescription>
                </div>
                <Button onClick={handleGenerateBinder} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generating...' : 'Generate Binder'}
                </Button>
            </CardHeader>
            <CardContent>
                {!auditData && (
                    <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-semibold">Ready to Generate</h3>
                        <p className="text-muted-foreground mt-2">
                            Click "Generate Binder" to compile your audit documentation.
                        </p>
                    </div>
                )}
                {auditData && (
                    <Accordion type="multiple" defaultValue={['contracts', 'claims']} className="w-full">
                        <AccordionItem value="contracts">
                            <AccordionTrigger>Contracts ({auditData.contracts.length})</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {auditData.contracts.map((c: any) => (
                                            <TableRow key={c.id}>
                                                <TableCell>{c.name}</TableCell>
                                                <TableCell><Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                                                <TableCell>{new Date(c.startDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(c.endDate).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="claims">
                            <AccordionTrigger>Claims ({auditData.claims.length})</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {auditData.claims.map((c: any) => (
                                            <TableRow key={c.id}><TableCell>{new Date(c.claimDate).toLocaleDateString()}</TableCell><TableCell>${c.claimAmount.toFixed(2)}</TableCell><TableCell><Badge variant={c.status === 'approved' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell><TableCell>{c.details}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="rules">
                            <AccordionTrigger>Rebate Rules ({auditData.rules.length})</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {auditData.rules.map((r: any) => (
                                            <TableRow key={r.id}><TableCell><Badge variant="secondary">{r.ruleType}</Badge></TableCell><TableCell>{r.ruleDescription}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="accruals">
                            <AccordionTrigger>Accruals ({auditData.accruals.length})</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {auditData.accruals.map((a: any) => (
                                            <TableRow key={a.id}><TableCell>{new Date(a.accrualDate).toLocaleDateString()}</TableCell><TableCell>${a.amount.toFixed(2)}</TableCell><TableCell><Badge variant={a.status === 'accrued' ? 'secondary' : 'default'}>{a.status}</Badge></TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="disputes">
                            <AccordionTrigger>Disputes ({auditData.disputes.length})</AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {auditData.disputes.map((d: any) => (
                                            <TableRow key={d.id}><TableCell>{new Date(d.disputeDate).toLocaleDateString()}</TableCell><TableCell>{d.reason}</TableCell><TableCell><Badge variant={d.status === 'open' ? 'destructive' : 'secondary'}>{d.status}</Badge></TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
