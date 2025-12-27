'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AccrualsTable from '@/components/accruals-table';
import { useLocalStorage } from '@/components/local-storage-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';

export default function LedgerPage() {
    const { db, userId } = useLocalStorage();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAccruals = async () => {
        setIsGenerating(true);
        try {
            // Mock generation logic for UI demo
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast({
                title: 'Success',
                description: `Generated accruals for Approved claims.`,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Accruals Ledger</h1>
                        <p className="text-sm text-slate-500">Track and manage rebate accruals.</p>
                    </div>
                    <Button onClick={handleGenerateAccruals} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Generate Accruals
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="rounded-md border border-slate-200 bg-white shadow-none overflow-hidden">
                    <AccrualsTable />
                </div>
            </main>
        </div>
    );
}
