import React from 'react';
import { Loader2, Sparkles, FileText, Search, BrainCircuit } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function InsightsLoadingState() {
    return (
        <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                <div className="bg-white p-4 rounded-full shadow-lg border border-indigo-100 relative z-10">
                    <BrainCircuit className="h-8 w-8 text-indigo-600 animate-pulse" />
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">Analyzing Contract Data</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
                Our AI is extracting key terms, identifying financial opportunities, and calculating rebate projections for you.
            </p>

            <div className="flex items-center gap-8 text-xs font-medium text-slate-400">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>Reading Terms</span>
                </div>
                <div className="h-px w-12 bg-slate-200" />
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Search className="h-4 w-4 text-indigo-600 animate-bounce" />
                    </div>
                    <span className="text-indigo-600">Identifying Gaps</span>
                </div>
                <div className="h-px w-12 bg-slate-200" />
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>Optimizing</span>
                </div>
            </div>
        </div>
    );
}
