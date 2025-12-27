'use client';

import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface Tier {
    tierName: string;
    minThreshold: number;
    maxThreshold: number | null;
    rebatePercentage: number;
}

interface TierVisualizationProps {
    tiers: Tier[];
    currentLikelyVolume?: number;
    currentTierName?: string;
}

export function TierVisualization({ tiers, currentLikelyVolume = 0, currentTierName }: TierVisualizationProps) {
    const sortedTiers = [...tiers].sort((a, b) => a.minThreshold - b.minThreshold);

    const maxRebate = tiers.length > 0 ? Math.max(...tiers.map(t => t.rebatePercentage)) * 1.2 : 100;

    if (tiers.length === 0) {
        return <div className="text-center p-8 text-slate-400 text-sm italic">No tier data available.</div>;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-slate-900 pl-3">Rebate Structure</h3>
                {currentTierName && (
                    <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1">
                        CURRENT: <span className="font-bold">{currentTierName.toUpperCase()}</span>
                    </div>
                )}
            </div>

            <div className="flex items-end gap-1 h-[200px] w-full border-b border-l border-slate-200 pl-2 pb-2">
                {sortedTiers.map((tier, index) => {
                    const isUnlocked = currentLikelyVolume >= tier.minThreshold || (currentTierName === tier.tierName);
                    const heightPercent = Math.max((tier.rebatePercentage / maxRebate) * 100, 5); // Min 5% height

                    return (
                        <div key={index} className="flex-1 h-full flex flex-col justify-end group">
                            {/* Value Label */}
                            <div className={cn(
                                "text-center text-xs font-bold mb-1",
                                isUnlocked ? "text-slate-900" : "text-slate-400"
                            )}>
                                {tier.rebatePercentage}%
                            </div>

                            {/* Simple Bar using pure CSS height */}
                            <div
                                style={{ height: `${heightPercent}%` }}
                                className={cn(
                                    "w-full transition-all border-t border-x",
                                    isUnlocked
                                        ? "bg-slate-900 border-slate-900"
                                        : "bg-slate-50 border-slate-200"
                                )}
                            >
                                {!isUnlocked && (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Lock className="h-3 w-3 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex gap-1 pl-2 mt-2 border-slate-200">
                {sortedTiers.map((tier, index) => (
                    <div key={index} className="flex-1 text-center">
                        <div className="text-[10px] font-semibold text-slate-600 uppercase truncate px-1">{tier.tierName}</div>
                        <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100 mt-1 pt-1">
                            &gt;${(tier.minThreshold / 1000).toFixed(0)}k
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
