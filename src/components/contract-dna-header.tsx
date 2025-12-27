import React from 'react';
import {
    Calendar,
    CreditCard,
    TrendingUp,
    Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface ContractDNAProps {
    contract: {
        start_date: string;
        end_date: string;
        payment_terms: string;
        contract_type: string;
        renewal_terms?: string | null;
        rebate_tiers?: any;
        products?: any;
        vendor_contact?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
        };
        description?: string;
    };
    healthMetrics: {
        daysRemaining: number;
        compliance: number;
    };
    className?: string;
}

export function ContractDNAHeader({ contract, healthMetrics, className }: ContractDNAProps) {
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Pending';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isExpiringSoon = healthMetrics.daysRemaining < 90;

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
            {/* 1. Effective Date */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 hover:border-indigo-200 transition-colors group">
                <div className="bg-slate-50 p-2 rounded-md group-hover:bg-indigo-50 transition-colors">
                    <Calendar className="h-5 w-5 text-slate-500 group-hover:text-indigo-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Effective Range</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                        {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                    </p>
                    {isExpiringSoon && (
                        <Badge variant="outline" className="mt-1.5 bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-4 inline-flex items-center">
                            Expiring Soon
                        </Badge>
                    )}
                </div>
            </div>

            {/* 2. Payment Terms */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 hover:border-emerald-200 transition-colors group">
                <div className="bg-slate-50 p-2 rounded-md group-hover:bg-emerald-50 transition-colors">
                    <CreditCard className="h-5 w-5 text-slate-500 group-hover:text-emerald-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Payment Terms</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                        {(() => {
                            const val = contract.payment_terms;
                            if (!val) return 'Not Specified';
                            if (typeof val === 'string') return val;
                            if (typeof val === 'object') {
                                // Fallback for legacy bad data
                                const v = val as any;
                                const parts = [];
                                if (v.frequency) parts.push(v.frequency);
                                if (v.dueDate) parts.push(v.dueDate);
                                return parts.join(' - ') || 'Not Specified';
                            }
                            return 'Not Specified';
                        })()}
                    </p>
                </div>
            </div>

            {/* 3. REBATE YIELD (Replaced Renewal) */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 hover:border-blue-200 transition-colors group">
                <div className="bg-slate-50 p-2 rounded-md group-hover:bg-blue-50 transition-colors">
                    <TrendingUp className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Rebate Yield</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                        {(() => {
                            const tiers = contract.rebate_tiers || [];
                            if (tiers.length === 0) return 'None Defined';
                            // Find max percentage
                            const maxPct = Math.max(...tiers.map((t: any) => t.rebatePercentage || 0));
                            return maxPct > 0 ? `Up to ${maxPct}%` : 'Fixed Amount';
                        })()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                        {contract.rebate_tiers?.length || 0} Tiers Defined
                    </p>
                </div>
            </div>

            {/* 4. PRODUCT SCOPE (Replaced Primary Contact) */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3 hover:border-purple-200 transition-colors group">
                <div className="bg-slate-50 p-2 rounded-md group-hover:bg-purple-50 transition-colors">
                    <Package className="h-5 w-5 text-slate-500 group-hover:text-purple-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Product Scope</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                        {contract.products?.length || 0} Items
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                        {contract.products?.length ? 'Extracted & Mapped' : 'No products found'}
                    </p>
                </div>
            </div>
        </div>
    );
}
