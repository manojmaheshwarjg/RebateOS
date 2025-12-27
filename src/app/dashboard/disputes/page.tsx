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
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Dispute Resolution</h1>
                        <p className="text-sm text-slate-500">Manage and track vendor rebate disputes.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 h-9 shadow-sm border border-indigo-700">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Initiate Dispute
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Dispute</DialogTitle>
                            </DialogHeader>
                            <NewDisputeForm onDisputeAdded={() => setIsDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="rounded-md border border-slate-200 bg-white shadow-none overflow-hidden">
                    {/* We can incorporate the DisputesTable here. 
                         Assuming DisputesTable is just the table part, we wrap it cleanly. 
                      */}
                    <DisputesTable />
                </div>
            </main>
        </div>
    );
}
