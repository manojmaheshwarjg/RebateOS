import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Circle, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { db } from '@/lib/local-storage/db';

export function ObligationTracker({ contractId, className }: { contractId: string, className?: string }) {
    const obligations = useLiveQuery(
        () => db.obligations.where('contract_id').equals(contractId).toArray(),
        [contractId]
    );

    const toggleObligation = async (id: string, currentStatus: string) => {
        await db.obligations.update(id, {
            status: currentStatus === 'completed' ? 'pending' : 'completed',
            completed_at: currentStatus !== 'completed' ? new Date().toISOString() : undefined
        });
    };

    // If query hasn't run yet, or no contractId
    if (!obligations) return null;

    return (
        <div className={cn("bg-white border border-slate-200 rounded-lg p-5 h-full flex flex-col", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Obligations ({obligations.filter(o => o.status !== 'completed').length})
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 -mr-2 pr-2 custom-scrollbar">
                {obligations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <FileText className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-xs">No obligations found</p>
                    </div>
                ) : (
                    obligations.map(ob => (
                        <div key={ob.id} className={cn(
                            "group flex items-start gap-3 p-3 rounded-md border transition-all",
                            ob.status === 'completed' ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"
                        )}>
                            <Checkbox
                                id={`ob-${ob.id}`}
                                checked={ob.status === 'completed'}
                                onCheckedChange={() => toggleObligation(ob.id, ob.status)}
                                className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <label
                                    htmlFor={`ob-${ob.id}`}
                                    className={cn(
                                        "text-sm font-medium block truncate cursor-pointer select-none",
                                        ob.status === 'completed' ? "text-slate-500 line-through" : "text-slate-900"
                                    )}
                                >
                                    {ob.title}
                                </label>

                                <div className="flex items-center gap-2 mt-1.5">
                                    {ob.type && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-slate-200 text-slate-500 capitalize">
                                            {ob.type}
                                        </Badge>
                                    )}
                                    <span className={cn(
                                        "text-xs flex items-center gap-1",
                                        ob.status === 'overdue' ? "text-red-600 font-medium" : "text-slate-400"
                                    )}>
                                        <Clock className="h-3 w-3" />
                                        {ob.due_date ? `Due: ${new Date(ob.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'No due date'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
                <Button variant="ghost" className="w-full text-xs text-slate-500 h-8 hover:text-indigo-600">View All Obligations</Button>
            </div>
        </div>
    );
}
