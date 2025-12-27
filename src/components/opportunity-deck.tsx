import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, ArrowRight, Sparkles, Layers, Sliders, Settings } from 'lucide-react';
import { OptimizationOpportunity } from '@/lib/groq-ai';

interface OpportunityDeckProps {
    opportunities: OptimizationOpportunity[];
    isLoading?: boolean;
    onViewActionPlan: (opportunity: OptimizationOpportunity) => void;
    className?: string;
}

export function OpportunityDeck({ opportunities, isLoading, onViewActionPlan, className }: OpportunityDeckProps) {
    if (isLoading) {
        return (
            <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-2 h-full", className)}>
                {[1, 2].map(i => (
                    <Card key={i} className="border-slate-200 bg-white flex flex-col justify-center items-center h-full min-h-[220px]">
                        <div className="animate-pulse flex flex-col items-center gap-4">
                            <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded"></div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    if (!opportunities || opportunities.length === 0) {
        return (
            <Card className={cn("border-dashed border-slate-200 bg-slate-50 flex flex-col justify-center items-center h-full min-h-[220px] text-center p-6", className)}>
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm border border-slate-100">
                    <Sparkles className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No active insights</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    No immediate optimization opportunities found.
                </p>
            </Card>
        );
    }

    return (
        <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-2 h-full", className)}>
            {opportunities.slice(0, 2).map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} onAction={() => onViewActionPlan(opp)} />
            ))}
        </div>
    );
}

function OpportunityCard({ opportunity, onAction }: { opportunity: OptimizationOpportunity; onAction: () => void }) {
    const isHighPriority = opportunity.priority === 'high';

    // Choose icon based on type logic for "watermark"
    const getIcon = () => {
        if (opportunity.type === 'tier') return Layers;
        if (opportunity.type === 'substitution') return Sliders;
        if (opportunity.description.toLowerCase().includes('setup') || opportunity.title.toLowerCase().includes('setup')) return Settings;
        return TrendingUp;
    };

    const Icon = getIcon();

    return (
        <Card className={cn(
            "flex flex-col h-full relative overflow-hidden transition-all duration-300 group hover:shadow-lg",
            isHighPriority
                ? "bg-white border-indigo-100 shadow-sm"
                : "bg-white border-slate-200"
        )}>
            {/* Subtle Watermark Icon for Impact */}
            <div className="absolute -right-6 -top-6 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <Icon className="h-32 w-32 rotate-12" />
            </div>

            <div className="p-6 flex-1 flex flex-col relative z-10">
                {/* Header: Badge only */}
                <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-0",
                        isHighPriority
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                    )}>
                        {opportunity.type} Opportunity
                    </Badge>
                </div>

                {/* Big Number Typography */}
                <div className="mt-2 mb-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-medium text-slate-400">$</span>
                        <span className={cn(
                            "text-4xl font-extrabold tracking-tighter",
                            isHighPriority ? "text-indigo-950" : "text-slate-900"
                        )}>
                            {isNaN(Number(opportunity.estimatedSavings)) ? 'TBD' : Number(opportunity.estimatedSavings).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide pl-1">Potential Annual Savings</p>
                </div>

                {/* Title & Description */}
                <div className="mb-6">
                    <h3 className="font-bold text-slate-900 leading-snug mb-1">
                        {opportunity.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {opportunity.description}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto">
                    <Button
                        onClick={onAction}
                        className={cn(
                            "w-full justify-between h-9 text-xs font-semibold transition-all",
                            isHighPriority
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-indigo-200/50"
                                : "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200"
                        )}
                        variant={isHighPriority ? "default" : "outline"}
                    >
                        Review Strategy
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
