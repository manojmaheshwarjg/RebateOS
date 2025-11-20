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
import { collection, query, getDocs, where, doc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { MoreHorizontal, Pen, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RuleBuilderForm from './rule-builder-form';


interface RebateRule {
    id: string;
    contractId: string;
    ruleType: string;
    ruleDescription: string;
    eligibilityCriteria: string;
}

interface Contract {
    id: string;
    name: string;
}

interface EnrichedRebateRule extends RebateRule {
    contractName: string;
}

export default function RulesTable() {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [enrichedRules, setEnrichedRules] = useState<EnrichedRebateRule[]>([]);
    const [rulesLoading, setRulesLoading] = useState(true);
    const [editingRule, setEditingRule] = useState<RebateRule | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: contracts, isLoading: contractsLoading } = useCollection<Contract>(contractsQuery);

    const rulesQuery = useMemoFirebase(() => {
        if (!firestore || !contracts || contracts.length === 0) return null;
        const contractIds = contracts.map(c => c.id);
        if (contractIds.length === 0) return null;
        // Firestore 'in' queries are limited to 30 items. 
        // For a production app with more contracts, this would need pagination or a different data model.
        return query(collection(firestore, 'rebate_rules'), where('contractId', 'in', contractIds.slice(0, 30)));
    }, [firestore, contracts]);

    const { data: rules, isLoading: areRulesLoading } = useCollection<RebateRule>(rulesQuery);

    useEffect(() => {
        setRulesLoading(contractsLoading || areRulesLoading);
        if (rules && contracts) {
            const contractMap = new Map(contracts.map(c => [c.id, c.name]));
            const newEnrichedRules = rules.map(rule => ({
                ...rule,
                contractName: contractMap.get(rule.contractId) || 'Unknown Contract',
            }));
            setEnrichedRules(newEnrichedRules);
        } else if (!contractsLoading && !areRulesLoading) {
            setEnrichedRules([]);
        }
    }, [rules, contracts, contractsLoading, areRulesLoading]);

    const handleEdit = (rule: RebateRule) => {
        setEditingRule(rule);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (ruleId: string) => {
        if (!firestore) return;
        if (!confirm('Are you sure you want to delete this rule?')) return;

        try {
            await deleteDoc(doc(firestore, 'rebate_rules', ruleId));
            toast({
                title: 'Success',
                description: 'Rule deleted successfully.',
            });
        } catch (error) {
            console.error("Error deleting rule:", error);
            toast({
                title: 'Error',
                description: 'Failed to delete rule.',
                variant: 'destructive',
            });
        }
    };


    if (rulesLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (enrichedRules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No Rules Defined</h3>
                <p className="text-muted-foreground mt-2">
                    Create your first contract rule to begin automating rebates.
                </p>
            </div>
        );
    }

    return (
        <>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Edit Rebate Rule</DialogTitle>
                    </DialogHeader>
                    <RuleBuilderForm 
                        onRuleAdded={() => setIsEditDialogOpen(false)} 
                        existingRule={editingRule}
                    />
                </DialogContent>
            </Dialog>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Rule Type</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {enrichedRules.map((rule) => (
                        <TableRow key={rule.id}>
                            <TableCell>
                                <Badge variant="secondary">{rule.ruleType}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{rule.contractName}</TableCell>
                            <TableCell>{rule.ruleDescription}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(rule)}>
                                            <Pen className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(rule.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}
