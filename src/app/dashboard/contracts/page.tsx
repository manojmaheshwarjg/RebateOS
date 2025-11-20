'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AIParserForm from '@/components/ai-parser-form';
import ContractsTable from '@/components/contracts-table';

export default function ContractsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="space-y-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <div className="flex justify-end">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Contract
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Add New Contract</DialogTitle>
                    </DialogHeader>
                    <AIParserForm onContractAdded={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>
            <Card>
                <CardHeader>
                    <CardTitle>Contract Inbox</CardTitle>
                    <CardDescription>Centralized intake for all rebate agreements.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ContractsTable />
                </CardContent>
            </Card>
        </div>
    );
}
