'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Sparkles,
  Target,
  Calendar,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContractHealthMetrics, OptimizationOpportunity } from '@/lib/mock-data-generator';

interface ContractAIInsightsProps {
  healthMetrics: ContractHealthMetrics;
  opportunities: OptimizationOpportunity[];
  onOpportunityClick?: (opportunity: OptimizationOpportunity) => void;
}

export default function ContractAIInsights({
  healthMetrics,
  opportunities,
  onOpportunityClick,
}: ContractAIInsightsProps) {
  const topOpportunities = opportunities.slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tier_upgrade':
        return Target;
      case 'product_substitution':
        return Package;
      case 'volume_timing':
        return Calendar;
      default:
        return Sparkles;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Hero Section - Rebate Capture Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Score Card */}
        <Card className="lg:col-span-1 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-4xl font-black text-blue-600">
                  {healthMetrics.rebateCaptureRate}%
                </div>
                <p className="text-xs text-slate-600 mt-1">Rebate Capture Rate</p>
              </div>
              <div className="relative w-20 h-20">
                {/* Circular Progress Ring */}
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-slate-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - healthMetrics.rebateCaptureRate / 100)}`}
                    className={cn(
                      "transition-all duration-500",
                      healthMetrics.rebateCaptureRate >= 80 ? "text-green-500" :
                      healthMetrics.rebateCaptureRate >= 60 ? "text-blue-500" :
                      "text-orange-500"
                    )}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {healthMetrics.rebateCaptureRate >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : healthMetrics.rebateCaptureRate >= 60 ? (
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Current Savings</span>
                <span className="font-semibold text-green-700">
                  {formatCurrency(healthMetrics.currentYearSavings)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Potential Additional</span>
                <span className="font-semibold text-blue-700">
                  +{formatCurrency(healthMetrics.potentialAdditionalSavings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Contract Health Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-600">Tier Utilization</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {healthMetrics.tierUtilization}%
                  </span>
                </div>
                <Progress value={healthMetrics.tierUtilization} className="h-1" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-slate-600">Compliance</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {healthMetrics.complianceScore}%
                  </span>
                </div>
                <Progress value={healthMetrics.complianceScore} className="h-1" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-xs text-slate-600">Products Used</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {healthMetrics.productUtilization}%
                  </span>
                </div>
                <Progress value={healthMetrics.productUtilization} className="h-1" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span className="text-xs text-slate-600">Days Remaining</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {healthMetrics.daysUntilExpiration}
                  </span>
                </div>
                <Badge variant={healthMetrics.daysUntilExpiration < 90 ? "destructive" : "secondary"} className="text-xs">
                  {healthMetrics.daysUntilExpiration < 90 ? "Action Needed" : "On Track"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top AI Recommendations */}
      {topOpportunities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI-Powered Recommendations
            </h3>
            <Badge variant="secondary" className="text-xs">
              {opportunities.length} opportunities
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topOpportunities.map((opp) => {
              const Icon = getTypeIcon(opp.type);
              return (
                <Card
                  key={opp.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4",
                    opp.priority === 'critical' && "border-l-red-500",
                    opp.priority === 'high' && "border-l-orange-500",
                    opp.priority === 'medium' && "border-l-blue-500",
                    opp.priority === 'low' && "border-l-slate-400"
                  )}
                  onClick={() => onOpportunityClick?.(opp)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        opp.priority === 'critical' && "bg-red-100",
                        opp.priority === 'high' && "bg-orange-100",
                        opp.priority === 'medium' && "bg-blue-100",
                        opp.priority === 'low' && "bg-slate-100"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          opp.priority === 'critical' && "text-red-600",
                          opp.priority === 'high' && "text-orange-600",
                          opp.priority === 'medium' && "text-blue-600",
                          opp.priority === 'low' && "text-slate-600"
                        )} />
                      </div>
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(opp.priority))}>
                        {opp.priority}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 mb-1.5 line-clamp-2">
                      {opp.title}
                    </h4>
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                      {opp.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                          {formatCurrency(opp.estimatedSavings)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <CheckCircle2 className="h-3 w-3" />
                        {Math.round(opp.confidence * 100)}% confidence
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpportunityClick?.(opp);
                      }}
                    >
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
