'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TierPerformanceData, PurchaseHistoryEntry } from '@/lib/mock-data-generator';

interface PurchaseOptimizerProps {
  tierPerformance: TierPerformanceData[];
  products?: any[];
  purchaseHistory?: PurchaseHistoryEntry[];
  contractEndDate?: string;
}

export default function PurchaseOptimizer({
  tierPerformance,
  products = [],
  purchaseHistory = [],
  contractEndDate,
}: PurchaseOptimizerProps) {
  const [targetTier, setTargetTier] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('90');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Find next achievable tier
  const nextTier = tierPerformance.find(t => t.progress < 100 && t.progress > 0) || tierPerformance[1];
  const currentTier = tierPerformance.find(t => t.progress >= 100) || tierPerformance[0];

  // Calculate purchase recommendations
  const calculateRecommendations = (tier: TierPerformanceData) => {
    const gapAmount = Math.max(0, tier.threshold - tier.currentVolume);
    const daysUntilExpiration = contractEndDate
      ? Math.floor((new Date(contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : parseInt(timeframe);

    const monthsRemaining = Math.ceil(daysUntilExpiration / 30);
    const monthlyTarget = gapAmount / monthsRemaining;

    // Calculate ROI
    const additionalRebate = (tier.rebateRate - (currentTier?.rebateRate || 0)) / 100;
    const savingsOnGap = gapAmount * additionalRebate;
    const totalPotentialSavings = tier.threshold * (tier.rebateRate / 100);
    const roi = (savingsOnGap / gapAmount) * 100;

    return {
      gapAmount,
      monthlyTarget,
      monthsRemaining,
      daysUntilExpiration,
      savingsOnGap,
      totalPotentialSavings,
      roi,
    };
  };

  const selectedTierData = targetTier
    ? tierPerformance.find(t => t.tierName === targetTier)
    : nextTier;

  const recommendations = selectedTierData ? calculateRecommendations(selectedTierData) : null;

  // Product-level recommendations (simplified)
  const getTopProducts = () => {
    if (products.length === 0) return [];

    // Get purchase frequency from history
    const productPurchases = new Map<string, number>();
    purchaseHistory.forEach(p => {
      productPurchases.set(p.productName, (productPurchases.get(p.productName) || 0) + p.amount);
    });

    // Sort by purchase frequency and take top 5
    return products
      .map(p => ({
        ...p,
        recentPurchases: productPurchases.get(p.productName) || 0,
      }))
      .sort((a, b) => b.recentPurchases - a.recentPurchases)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculator Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Purchase Optimizer
          </CardTitle>
          <CardDescription>
            Calculate optimal purchase volumes to maximize rebate capture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Tier Selection */}
          <div className="space-y-2">
            <Label htmlFor="target-tier">Target Tier</Label>
            <Select value={targetTier} onValueChange={setTargetTier}>
              <SelectTrigger id="target-tier">
                <SelectValue placeholder={nextTier?.tierName || "Select a tier"} />
              </SelectTrigger>
              <SelectContent>
                {tierPerformance.map((tier) => (
                  <SelectItem key={tier.tierName} value={tier.tierName} disabled={tier.progress >= 100}>
                    {tier.tierName} - {tier.rebateRate}% {tier.progress >= 100 ? "(Achieved)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe (days)</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger id="timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days (1 month)</SelectItem>
                <SelectItem value="60">60 days (2 months)</SelectItem>
                <SelectItem value="90">90 days (3 months)</SelectItem>
                <SelectItem value="180">180 days (6 months)</SelectItem>
                <SelectItem value="365">365 days (1 year)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {recommendations && (
            <div className="space-y-3 pt-4 border-t">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Amount Needed</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(recommendations.gapAmount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Per Month</span>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(recommendations.monthlyTarget)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Months Left</span>
                    <p className="font-semibold text-slate-900">
                      {recommendations.monthsRemaining}
                    </p>
                  </div>
                </div>
              </div>

              {/* ROI Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Expected Savings</span>
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(recommendations.savingsOnGap)}
                  </p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-1 mb-1">
                    <Calculator className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">ROI</span>
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {recommendations.roi.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Warning if tight timeline */}
              {recommendations.monthsRemaining <= 2 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-orange-900">Tight Timeline</p>
                    <p className="text-orange-700">
                      You have less than 3 months to reach this tier. Consider accelerating planned purchases.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Recommended Products
          </CardTitle>
          <CardDescription>
            Top products to focus on based on your purchase history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <h4 className="font-semibold text-sm">{product.productName}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      {product.ndc && <span>NDC: {product.ndc}</span>}
                      {product.category && (
                        <>
                          <span>•</span>
                          <span>{product.category}</span>
                        </>
                      )}
                      {product.recentPurchases > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-green-700 font-medium">
                            {formatCurrency(product.recentPurchases)} volume
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {recommendations && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-semibold text-blue-900">Smart Tip</p>
                      <p className="text-blue-700">
                        Focus on these top products to efficiently reach {selectedTierData?.tierName || 'your target tier'}.
                        Distribute your {formatCurrency(recommendations.monthlyTarget)}/month target across these items.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No product data available</p>
              <p className="text-xs mt-1">Add products to see purchase recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      {recommendations && recommendations.monthsRemaining > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Suggested Purchase Timeline
            </CardTitle>
            <CardDescription>
              Month-by-month plan to reach {selectedTierData?.tierName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {Array.from({ length: Math.min(6, recommendations.monthsRemaining) }, (_, i) => {
                const monthDate = new Date();
                monthDate.setMonth(monthDate.getMonth() + i + 1);
                const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                return (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200"
                  >
                    <div className="text-xs font-medium text-slate-600 mb-1">{monthName}</div>
                    <div className="text-lg font-bold text-slate-900 mb-2">
                      {formatCurrency(recommendations.monthlyTarget)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-700">
                      <TrendingUp className="h-3 w-3" />
                      <span>On track</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {recommendations.monthsRemaining > 6 && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                Showing first 6 months of {recommendations.monthsRemaining} month plan
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
