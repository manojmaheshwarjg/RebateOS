'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NewDisputeForm from '@/components/new-dispute-form';
import DisputesTable from '@/components/disputes-table';

export default function DisputesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="space-y-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                     <div className="flex justify-end">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Dispute
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Dispute</DialogTitle>
                    </DialogHeader>
                    <NewDisputeForm onDisputeAdded={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Dispute Management</CardTitle>
                    <CardDescription>Manage disputes and track dispute resolution.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DisputesTable />
                </CardContent>
            </Card>
        </div>
    );
}
