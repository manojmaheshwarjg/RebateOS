'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RuleBuilderForm from '@/components/rule-builder-form';
import RulesTable from '@/components/rules-table';

export default function RulesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="space-y-4">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <div className="flex justify-end">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Rule
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Create New Rebate Rule</DialogTitle>
                    </DialogHeader>
                    <RuleBuilderForm onRuleAdded={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>
            <Card>
                <CardHeader>
                    <CardTitle>Contract Rule Builder</CardTitle>
                    <CardDescription>Configure tier rules, bundle rules, and eligibility criteria for contracts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RulesTable />
                </CardContent>
            </Card>
        </div>
    );
}
