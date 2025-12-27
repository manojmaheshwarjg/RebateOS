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
    'achieved': { color: 'bg-emerald-500', label: 'Achieved' },
    'near-tier': { color: 'bg-amber-400', label: 'Near Tier' },
    'leakage': { color: 'bg-rose-500', label: 'Leakage' },
    'under-performing': { color: 'bg-slate-300', label: 'Under Performing' },
};


export default function HeatmapPage() {
    const [selectedContract, setSelectedContract] = useState('contract1');
    const [performanceData, setPerformanceData] = useState(heatmapData.performance.contract1);

    useEffect(() => {
        setPerformanceData(heatmapData.performance[selectedContract as keyof typeof heatmapData.performance]);
    }, [selectedContract]);

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-16 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Opportunity Heatmap</h1>
                        <p className="text-sm text-slate-500">Visualize performance and tier attainment.</p>
                    </div>
                    <div className="w-[300px]">
                        <Select value={selectedContract} onValueChange={setSelectedContract}>
                            <SelectTrigger className="bg-slate-50 border-slate-300 h-9">
                                <SelectValue placeholder="Select a contract" />
                            </SelectTrigger>
                            <SelectContent>
                                {heatmapData.contracts.map(contract => (
                                    <SelectItem key={contract.id} value={contract.id}>{contract.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <TooltipProvider>
                        <div className="grid grid-cols-1 gap-6">
                            {/* Matrix Header */}
                            <div className="grid gap-4 items-center border-b border-slate-100 pb-4" style={{ gridTemplateColumns: `150px repeat(${heatmapData.tiers.length}, 1fr)` }}>
                                <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Product</div>
                                {heatmapData.tiers.map(tier => <div key={tier} className="font-semibold text-sm text-center text-slate-500 uppercase tracking-wider">{tier}</div>)}
                            </div>

                            {/* Matrix Rows */}
                            <div className="grid gap-2">
                                {performanceData.map(item => (
                                    <div key={item.product} className="grid gap-4 items-center" style={{ gridTemplateColumns: `150px repeat(${heatmapData.tiers.length}, 1fr)` }}>
                                        <div className="font-medium text-sm text-slate-900 flex items-center">{item.product}</div>
                                        {heatmapData.tiers.map((tier, tierIndex) => {
                                            const config = statusConfig[item.status as keyof typeof statusConfig];
                                            const isCurrentTier = item.tier === tierIndex;

                                            return (
                                                <Tooltip key={tier}>
                                                    <TooltipTrigger asChild>
                                                        <div className={`h-12 border rounded-sm flex items-center justify-center transition-all duration-200 ${isCurrentTier ? config.color + ' border-transparent shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                                            {item.leakage > 0 && isCurrentTier && <Badge variant="destructive" className="text-[10px] bg-white text-rose-600 border-rose-200 px-1 py-0 h-4 shadow-sm">!</Badge>}
                                                            {isCurrentTier && <span className="sr-only">Current Tier</span>}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 text-white border-slate-800">
                                                        <p className="font-semibold text-sm">{item.product}</p>
                                                        <p className="text-xs text-slate-300">{statusConfig[item.status as keyof typeof statusConfig].label}</p>
                                                        <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                                                            <span className="text-slate-400">Volume:</span> <span>{item.volume.toLocaleString()}</span>
                                                            <span className="text-slate-400">Next Tier:</span> <span>{item.nextTierVolume.toLocaleString()}</span>
                                                            {item.leakage > 0 && (
                                                                <>
                                                                    <span className="text-rose-300">Leakage:</span>
                                                                    <span className="text-rose-300 font-medium">${item.leakage.toLocaleString()}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end items-center gap-6 text-sm">
                            <span className="font-medium text-slate-500">Legend:</span>
                            {Object.entries(statusConfig).map(([key, { color, label }]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                    <span className="text-slate-600">{label}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                                <Badge variant="destructive" className="text-[10px] bg-white text-rose-600 border-rose-200 px-1.5 py-0 h-4 border shadow-sm">!</Badge>
                                <span className="text-slate-600">Leakage Alert</span>
                            </div>
                        </div>
                    </TooltipProvider>
                </div>
            </main>
        </div>
    );
}