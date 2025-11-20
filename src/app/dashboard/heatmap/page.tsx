
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

// Mock data representing rebate tiers and product performance
const heatmapData = {
  contracts: [
    { id: 'contract1', name: 'Primary Distribution Agreement' },
    { id: 'contract2', name: 'Q3 Promotional Rebates' },
  ],
  products: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E', 'Product F', 'Product G', 'Product H'],
  tiers: ['Tier 1 (5%)', 'Tier 2 (7%)', 'Tier 3 (10%)', 'Tier 4 (12%)'],
  performance: {
    contract1: [
      { product: 'Product A', tier: 2, status: 'achieved', volume: 5500, nextTierVolume: 10000, leakage: 50 },
      { product: 'Product B', tier: 1, status: 'near-tier', volume: 950, nextTierVolume: 2000, leakage: 0 },
      { product: 'Product C', tier: 0, status: 'under-performing', volume: 150, nextTierVolume: 1000, leakage: 0 },
      { product: 'Product D', tier: 3, status: 'achieved', volume: 12000, nextTierVolume: 20000, leakage: 250 },
      { product: 'Product E', tier: 1, status: 'achieved', volume: 1100, nextTierVolume: 5000, leakage: 0 },
      { product: 'Product F', tier: 2, status: 'near-tier', volume: 4800, nextTierVolume: 5000, leakage: 120 },
      { product: 'Product G', tier: 0, status: 'leakage', volume: 800, nextTierVolume: 2000, leakage: 300 },
      { product: 'Product H', tier: 1, status: 'achieved', volume: 2100, nextTierVolume: 4000, leakage: 0 },
    ],
    contract2: [
      { product: 'Product A', tier: 1, status: 'near-tier', volume: 1800, nextTierVolume: 2000, leakage: 0 },
      { product: 'Product B', tier: 0, status: 'under-performing', volume: 200, nextTierVolume: 1000, leakage: 0 },
      { product: 'Product C', tier: 2, status: 'achieved', volume: 6000, nextTierVolume: 10000, leakage: 75 },
      { product: 'Product D', tier: 1, status: 'leakage', volume: 1500, nextTierVolume: 2000, leakage: 400 },
      { product: 'Product E', tier: 0, status: 'under-performing', volume: 500, nextTierVolume: 1500, leakage: 0 },
      { product: 'Product F', tier: 1, status: 'achieved', volume: 2200, nextTierVolume: 5000, leakage: 0 },
      { product: 'Product G', tier: 2, status: 'near-tier', volume: 9850, nextTierVolume: 10000, leakage: 0 },
      { product: 'Product H', tier: 0, status: 'under-performing', volume: 100, nextTierVolume: 1000, leakage: 0 },
    ],
  }
};

const statusConfig = {
  'achieved': { color: 'bg-green-600/80', label: 'Achieved' },
  'near-tier': { color: 'bg-yellow-500/80', label: 'Near Tier' },
  'leakage': { color: 'bg-red-600/80', label: 'Leakage' },
  'under-performing': { color: 'bg-slate-400/80', label: 'Under Performing' },
};


export default function HeatmapPage() {
    const [selectedContract, setSelectedContract] = useState('contract1');
    const [performanceData, setPerformanceData] = useState(heatmapData.performance.contract1);

    useEffect(() => {
        setPerformanceData(heatmapData.performance[selectedContract as keyof typeof heatmapData.performance]);
    }, [selectedContract]);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Opportunity Heatmap</CardTitle>
                    <CardDescription>Identify leakage and near-tier opportunities visually.</CardDescription>
                </div>
                <div className="w-[300px]">
                    <Select value={selectedContract} onValueChange={setSelectedContract}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a contract" />
                        </SelectTrigger>
                        <SelectContent>
                            {heatmapData.contracts.map(contract => (
                                <SelectItem key={contract.id} value={contract.id}>{contract.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${heatmapData.tiers.length}, 1fr)`}}>
                            <div className="font-semibold text-sm">Product</div>
                            {heatmapData.tiers.map(tier => <div key={tier} className="font-semibold text-sm text-center">{tier}</div>)}

                            {performanceData.map(item => (
                                <React.Fragment key={item.product}>
                                    <div className="font-medium text-sm flex items-center">{item.product}</div>
                                    {heatmapData.tiers.map((tier, tierIndex) => {
                                        const config = statusConfig[item.status as keyof typeof statusConfig];
                                        const isCurrentTier = item.tier === tierIndex;

                                        return (
                                            <Tooltip key={tier}>
                                                <TooltipTrigger asChild>
                                                    <div className={`h-12 border border-background rounded flex items-center justify-center ${isCurrentTier ? config.color : 'bg-secondary/50'}`}>
                                                        {item.leakage > 0 && isCurrentTier && <Badge variant="destructive" className="text-xs">!</Badge>}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-semibold">{item.product} - {statusConfig[item.status as keyof typeof statusConfig].label}</p>
                                                    <p>Current Volume: {item.volume.toLocaleString()}</p>
                                                    <p>Next Tier at: {item.nextTierVolume.toLocaleString()}</p>
                                                    {item.leakage > 0 && <p className="text-destructive">Leakage: ${item.leakage.toLocaleString()}</p>}
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="flex justify-end items-center gap-4 text-sm mt-4">
                            <span className="font-semibold">Legend:</span>
                             {Object.entries(statusConfig).map(([key, { color, label }]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-sm ${color}`}></div>
                                    <span>{label}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="text-xs">!</Badge>
                                <span>Leakage Alert</span>
                            </div>
                        </div>
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}

    

    