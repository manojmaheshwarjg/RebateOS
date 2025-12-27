'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TierPerformanceData } from '@/lib/mock-data-generator';

interface RebateTierVisualProps {
  tierPerformance: TierPerformanceData[];
  contractName: string;
}

export default function RebateTierVisual({ tierPerformance, contractName }: RebateTierVisualProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  // Find current tier and next tier
  const currentTier = tierPerformance.find(t => t.progress >= 100) || tierPerformance[0];
  const currentTierIndex = tierPerformance.indexOf(currentTier);
  const nextTier = tierPerformance[currentTierIndex + 1];

  // Prepare data for chart
  const chartData = tierPerformance.map((tier, index) => ({
    name: tier.tierName,
    volume: tier.currentVolume,
    threshold: tier.threshold,
    rebateRate: tier.rebateRate,
    progress: tier.progress,
    isCurrentTier: tier === currentTier,
    isAchieved: tier.progress >= 100,
    gapAmount: Math.max(0, tier.threshold - tier.currentVolume),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600">Current Volume:</span>
              <span className="font-medium">{formatCurrency(data.volume)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600">Threshold:</span>
              <span className="font-medium">{formatCurrency(data.threshold)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-600">Rebate Rate:</span>
              <span className="font-medium text-green-700">{data.rebateRate}%</span>
            </div>
            {!data.isAchieved && (
              <div className="flex items-center justify-between gap-4 pt-2 border-t">
                <span className="text-slate-600">Gap to Reach:</span>
                <span className="font-medium text-orange-700">{formatCurrency(data.gapAmount)}</span>
              </div>
            )}
            {data.isAchieved && (
              <div className="flex items-center gap-1 pt-2 border-t text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                <span className="font-medium">Achieved</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Rebate Tier Performance
            </CardTitle>
            <CardDescription>
              Track your progress across all rebate tiers for {contractName}
            </CardDescription>
          </div>
          {nextTier && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              Next: {nextTier.tierName} ({nextTier.rebateRate}%)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier Progress Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="text-slate-600"
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                className="text-slate-600"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Legend />

              {/* Current Volume Bars */}
              <Bar dataKey="volume" name="Current Volume" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isAchieved
                        ? '#10b981' // green for achieved
                        : entry.isCurrentTier
                        ? '#3b82f6' // blue for current tier
                        : '#94a3b8' // gray for not reached
                    }
                  />
                ))}
              </Bar>

              {/* Threshold Reference Lines */}
              {chartData.map((tier, index) => (
                <ReferenceLine
                  key={`threshold-${index}`}
                  y={tier.threshold}
                  stroke={tier.isCurrentTier ? '#f59e0b' : '#cbd5e1'}
                  strokeDasharray="5 5"
                  label={{
                    value: `${tier.name} Goal`,
                    position: 'right',
                    fontSize: 10,
                    fill: '#64748b',
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Details List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Tier Breakdown</h4>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Achieved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-400" />
                <span>Not Reached</span>
              </div>
            </div>
          </div>

          {tierPerformance.map((tier, index) => {
            const isCurrentTier = tier === currentTier;
            const isAchieved = tier.progress >= 100;
            const gapAmount = Math.max(0, tier.threshold - tier.currentVolume);

            return (
              <Card
                key={index}
                className={cn(
                  "border-l-4 transition-all",
                  isAchieved && "border-l-green-500 bg-green-50/30",
                  isCurrentTier && !isAchieved && "border-l-blue-500 bg-blue-50/30",
                  !isCurrentTier && !isAchieved && "border-l-slate-300"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        isAchieved && "bg-green-100",
                        isCurrentTier && !isAchieved && "bg-blue-100",
                        !isCurrentTier && !isAchieved && "bg-slate-100"
                      )}>
                        {isAchieved ? (
                          <Trophy className="h-4 w-4 text-green-600" />
                        ) : (
                          <Target className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm">{tier.tierName}</h5>
                        <p className="text-xs text-slate-600">
                          {formatCurrency(tier.threshold)} threshold • {tier.rebateRate}% rebate
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isAchieved ? "default" : "outline"}
                      className={cn(
                        isAchieved && "bg-green-600",
                        isCurrentTier && !isAchieved && "bg-blue-100 text-blue-700 border-blue-300"
                      )}
                    >
                      {isAchieved ? "Achieved" : `${Math.round(tier.progress)}%`}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Progress to this tier</span>
                      <span className="font-medium">
                        {formatCurrency(tier.currentVolume)} / {formatCurrency(tier.threshold)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, tier.progress)}
                      className="h-2"
                      indicatorClassName={cn(
                        isAchieved && "bg-green-600",
                        isCurrentTier && !isAchieved && "bg-blue-600",
                        !isCurrentTier && !isAchieved && "bg-slate-400"
                      )}
                    />

                    {!isAchieved && gapAmount > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-slate-600">Amount needed:</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-700">
                            {formatCurrency(gapAmount)}
                          </span>
                        </div>
                      </div>
                    )}

                    {isAchieved && (
                      <div className="flex items-center gap-1 pt-2 border-t text-green-700 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="font-medium">
                          Earning {tier.rebateRate}% rebate on qualifying purchases
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Next Tier CTA */}
        {nextTier && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Next Tier Opportunity</h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    You're <strong>{formatCurrency(nextTier.threshold - nextTier.currentVolume)}</strong> away
                    from unlocking <strong>{nextTier.tierName}</strong> with <strong>{nextTier.rebateRate}% rebate</strong>.
                    This could save you an additional <strong>{formatCurrency(nextTier.potentialSavings)}</strong> annually.
                  </p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    See Purchase Plan
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
