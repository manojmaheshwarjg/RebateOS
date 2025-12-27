'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sliders } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RuleBuilderForm from '@/components/rule-builder-form';
import RulesTable from '@/components/rules-table';

export default function RulesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            {/* STICKY HEADER */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Rules Engine</h1>
                        <p className="text-sm text-slate-500">Configure global rebate logic and eligibility criteria.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-9 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-indigo-700">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Rule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                                <DialogTitle>Create New Rebate Rule</DialogTitle>
                            </DialogHeader>
                            <RuleBuilderForm onRuleAdded={() => setIsDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Introduction / Context */}
                <div className="mb-6 flex items-start p-4 bg-white border border-slate-200 rounded-md shadow-sm">
                    <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-md mr-4">
                        <Sliders className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Rule Configuration</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                            define logic for tier advancement, volume aggregation, and product eligibility.
                            Rules are applied automatically during the contract analysis phase.
                        </p>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-none">
                    <RulesTable />
                </div>
            </main>
        </div>
    );
}
