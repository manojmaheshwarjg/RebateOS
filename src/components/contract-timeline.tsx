'use client';

import { cn } from '@/lib/utils';
import { differenceInDays, format, isValid } from 'date-fns';

interface ContractTimelineProps {
    startDate: string; // ISO string
    endDate: string;   // ISO string
}

export function ContractTimeline({ startDate, endDate }: ContractTimelineProps) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    // Validate dates
    if (!isValid(start) || !isValid(end)) {
        return null;
    }

    const totalDays = differenceInDays(end, start);
    const daysElapsed = differenceInDays(today, start);
    const daysRemaining = differenceInDays(end, today);

    // Calculate percentage (clamped 0-100)
    const progressPercent = totalDays > 0
        ? Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
        : 100;

    const isExpiringSoon = daysRemaining <= 90;
    const isExpired = daysRemaining < 0;

    return (
        <div className="w-full pt-6 pb-2">
            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                {/* Simple flat progress bar */}
                <div
                    className={cn(
                        "h-full rounded-full",
                        isExpired ? "bg-slate-400" : isExpiringSoon ? "bg-amber-600" : "bg-slate-900"
                    )}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="flex justify-between items-start mt-3 text-xs text-slate-900">
                <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-500">Effective Date</span>
                    <span className="font-mono">{format(start, 'dd MMM yyyy')}</span>
                </div>

                {/* Center Status Marker */}
                <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        isExpired ? "bg-slate-100 text-slate-600" : isExpiringSoon ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                        {isExpired ? (
                            <>Expired</>
                        ) : (
                            <>{daysRemaining} Days Remaining</>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-500">Expiration</span>
                    <span className="font-mono">{format(end, 'dd MMM yyyy')}</span>
                </div>
            </div>
        </div>
    );
}
