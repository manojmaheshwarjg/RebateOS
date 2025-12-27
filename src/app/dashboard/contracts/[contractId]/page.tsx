'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRightLeft,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  Share2,
  Wand2,
  CheckCircle2,
  Activity,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import {
  calculateContractHealth,
  generateContractInsights,
  generateTierOptimizations,
  generateSubstitutionSuggestions,
  type ContractHealthMetrics,
  type OptimizationOpportunity,
  type TierOptimizationResult,
  type SubstitutionSuggestion,
} from '@/lib/groq-ai';
import { TierVisualization } from '@/components/tier-visualization';
import { ContractTimeline } from '@/components/contract-timeline';
import { cn } from '@/lib/utils';
import { ContractDNAHeader } from '@/components/contract-dna-header';
import { OpportunityDeck } from '@/components/opportunity-deck';
import { ObligationTracker } from '@/components/obligation-tracker';
import { QuickActionToolbar } from '@/components/quick-action-toolbar';
import { InsightsLoadingState } from '@/components/insights-loading-state';

// --- Interfaces --
interface RebateTier {
  tierName: string;
  minThreshold: number;
  maxThreshold: number | null;
  rebatePercentage: number;
  rebateType: 'percentage' | 'fixed' | 'per_unit';
  applicableProducts: string[];
}

interface Product {
  productName: string;
  ndc: string | null;
  sku: string | null;
  category: string;
  unitPrice: number | null;
  unitOfMeasure: string | null;
}

interface VendorContact {
  name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
}

interface Contract {
  id: string;
  name: string;
  vendor_id: string;
  vendor_contact: VendorContact;
  contract_type: 'GPO' | 'IDN' | 'Direct' | 'Wholesale' | 'Other';
  contract_number: string | null;
  start_date: string;
  end_date: string;
  renewal_terms: string | null;
  rebate_tiers: RebateTier[];
  products: Product[];
  payment_terms: string;
  special_conditions: string[];
  status: string;
  description: string;
  contract_file_url: string;
  created_at: string;
  updated_at: string;
}

export default function ContractDetailPage() {
  const { contractId } = useParams();
  const router = useRouter();
  const { db } = useLocalStorage();
  const { toast } = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<ContractHealthMetrics | null>(null);
  const [opportunities, setOpportunities] = useState<OptimizationOpportunity[]>([]);

  // Loading states
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // Handle Smart Extract (Re-processing)
  const handleSmartExtract = async () => {
    if (!contractId || !db) return;

    try {
      setIsLoading(true);
      setGeneratingInsights(true);
      toast({
        title: 'Starting Smart Extraction',
        description: 'Analyzing contract for obligations and terms...',
      });

      // 1. Find the primary file
      const files = await db.contract_files.where('contract_id').equals(contractId as string).toArray();
      const primaryFile = files[0]; // Simplification for now

      if (!primaryFile) {
        throw new Error('No contract file found to process');
      }

      // 2. Get the file blob
      const fileBlobEntry = await db.file_blobs.get(primaryFile.id);
      if (!fileBlobEntry || !fileBlobEntry.blob) {
        throw new Error('File content not found in local storage');
      }

      // 3. Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(fileBlobEntry.blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        // 4. Trigger processing
        const { triggerContractProcessing } = await import('@/app/actions/process-contract');
        const result = await triggerContractProcessing(
          primaryFile.id,
          contractId as string,
          primaryFile.file_name,
          base64data
        );

        if (result.success) {
          // Save Obligations to DB
          const obligations = result.result?.structuredData?.financial?.obligations;
          if (obligations && Array.isArray(obligations)) {
            let count = 0;
            for (const ob of obligations) {
              await db.obligations.add({
                id: crypto.randomUUID(),
                contract_id: contractId as string,
                title: ob.title,
                description: ob.description,
                due_date: ob.dueDate,
                type: ob.type || 'other',
                priority: ob.priority || 'medium',
                recurrence: ob.recurrence,
                status: 'pending',
                created_at: new Date().toISOString()
              });
              count++;
            }
            toast({
              title: 'Extraction Complete',
              description: `Found ${result.fieldsExtracted} fields and added ${count} obligations.`,
            });
          } else {
            toast({
              title: 'Extraction Complete',
              description: `Found ${result.fieldsExtracted} fields but no new obligations.`,
            });
          }

          // Refresh data
          window.location.reload();
        } else {
          throw new Error(result.error);
        }
      };

    } catch (error: any) {
      console.error('Smart Extract failed:', error);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: error.message
      });
      setIsLoading(false);
      setGeneratingInsights(false);
    }
  };

  // 1. Data Fetching
  useEffect(() => {
    async function init() {
      if (!contractId) return;
      setIsLoading(true);
      try {
        const data = await db.contracts.get(contractId as string);
        if (!data) { setIsLoading(false); return; }

        // Extract fields (simplified for brevity)
        const fields = await db.extracted_fields.where('contract_id').equals(contractId as string).toArray();

        const tiers: RebateTier[] = [];
        const products: Product[] = [];
        let payment = data.payment_terms || '';
        let start = data.start_date;
        let end = data.end_date;
        let renewal = data.renewal_terms || null;

        if (fields) {
          fields.forEach(f => {
            if (f.field_name.startsWith('rebate_tier_') && f.value_json) {
              const t = f.value_json;
              tiers.push({
                tierName: t.tierName,
                minThreshold: t.minThreshold || 0,
                maxThreshold: t.maxThreshold,
                rebatePercentage: t.rebatePercentage || 0,
                rebateType: t.calculationMethod?.includes('percent') ? 'percentage' : 'fixed',
                applicableProducts: t.applicableProducts || []
              });
            }
            if (f.field_name === 'product_list' && Array.isArray(f.value_json)) {
              f.value_json.forEach((p: any) => products.push({
                productName: p.productName,
                ndc: p.ndc,
                sku: p.sku,
                category: p.category || 'Uncategorized',
                unitPrice: null,
                unitOfMeasure: p.packageSize
              }));
            }
            if (f.field_name === 'payment_terms' && f.value_json) payment = `${f.value_json.frequency || ''} ${f.value_json.paymentMethod || ''}`;
            if (f.field_name === 'effective_date' && f.value_date) start = f.value_date;
            if (f.field_name === 'expiration_date' && f.value_date) end = f.value_date;
            if (f.field_name === 'renewal_terms') renewal = f.value_text || null; // If we start extracting it as a separate field
          });
        }

        const fullContract = {
          ...data,
          rebate_tiers: tiers.length ? tiers : (data.rebate_tiers || []),
          products: products.length ? products : (data.products || []),
          payment_terms: payment,
          start_date: start,
          end_date: end,
          renewal_terms: renewal
        } as Contract;

        setContract(fullContract);

        const cl = await db.claims.where('contract_id').equals(contractId as string).toArray();
        const pu: any[] = [];
        setHealthMetrics(await calculateContractHealth(fullContract, cl, pu));
        setIsLoading(false);

      } catch (e) { setIsLoading(false); }
    }
    init();
  }, [contractId, db]);

  // 2. AI Gen (Lazy)
  useEffect(() => {
    if (contract && healthMetrics && !generatingInsights) {
      setGeneratingInsights(true);
      const runAI = async () => {
        try {
          const cl = await db.claims.where('contract_id').equals(contractId as string).toArray();
          const pu: any[] = []; // Purchases not yet in DB schema
          const insights = await generateContractInsights(contract, healthMetrics, pu, cl);
          setOpportunities(insights);
        } catch (e) { } finally { setGeneratingInsights(false); }
      };
      runAI();
    }
  }, [contract, healthMetrics]);

  if (isLoading) return <div className="p-8 container mx-auto"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
  if (!contract || !healthMetrics) return <div className="p-8">Contract Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">

      {/* 1. COMPACT HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-3">
          {/* Breadcrumb & Meta */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="hover:text-slate-900 cursor-pointer" onClick={() => router.push('/dashboard/contracts')}>Contracts</span>
              <ChevronRight className="h-3 w-3" />
              <span>{contract.contract_number || 'Details'}</span>
            </div>
          </div>

          {/* Main Title Row */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none mb-1.5 flex items-center gap-3">
                  {contract.name}
                  <Badge variant="outline" className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                    contract.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"
                  )}>
                    {contract.status}
                  </Badge>
                </h1>
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">Analyzer Summary:</span> This agreement provides for tiered rebates up to 12% on surgical supplies.
                </p>
              </div>
            </div>

            <QuickActionToolbar
              onReviewClick={() => router.push(`/dashboard/contracts/${contractId}/review`)}
              onAnalyzeClick={handleSmartExtract}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">

        {/* 2. COMMAND CENTER GRID (3 Columns) */}
        {/* 2. COMMAND CENTER GRID */}
        <div className="space-y-6">
          {/* Top: DNA (Full Width) */}
          <section>
            <ContractDNAHeader contract={contract} healthMetrics={healthMetrics} />
          </section>



          <section className="min-h-[420px]">
            {generatingInsights ? (
              <InsightsLoadingState />
            ) : (
              <div className="grid grid-cols-12 gap-6 h-full">
                {/* Left: Opportunities (8 cols) */}
                <div className="col-span-12 lg:col-span-8 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-bold text-slate-900">Action Center</h3>
                  </div>
                  <OpportunityDeck
                    opportunities={opportunities}
                    isLoading={false} // Loading handled by parent now
                    onViewActionPlan={(opp) => console.log('View plan', opp)}
                    className="flex-1"
                  />
                </div>

                {/* Right: Obligations (4 cols) */}
                <div className="col-span-12 lg:col-span-4 h-full">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="text-sm font-bold text-slate-900">Obligations</h3>
                  </div>
                  <ObligationTracker contractId={contractId as string} />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* 3. DETAILED TABS (Existing content below) */}
        <div className="grid grid-cols-1">
          <Tabs defaultValue="terms" className="w-full">
            <div className="border-b border-slate-200 mb-4 bg-white px-2 rounded-t-lg">
              <TabsList className="bg-transparent h-12 p-0 gap-8">
                <TabsTrigger value="terms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 px-0 h-full text-sm font-medium text-slate-500">Terms & Analysis</TabsTrigger>
                <TabsTrigger value="products" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 px-0 h-full text-sm font-medium text-slate-500">Product Scope</TabsTrigger>
                <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 px-0 h-full text-sm font-medium text-slate-500">Performance</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="terms" className="space-y-6">
              <Card className="rounded-lg border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <TierVisualization
                    tiers={contract.rebate_tiers}
                    currentLikelyVolume={healthMetrics.totalVolume}
                    currentTierName={healthMetrics.currentTierName}
                  />
                </CardContent>
              </Card>
              {/* ... (Existing table) ... */}
              <Card className="rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                      <TableHead className="font-semibold text-slate-900 h-10">Tier Name</TableHead>
                      <TableHead className="font-semibold text-slate-900 h-10 text-right">Min. Threshold</TableHead>
                      <TableHead className="font-semibold text-slate-900 h-10 text-right">Rebate %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.rebate_tiers.map((t, i) => (
                      <TableRow key={i} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-700">{t.tierName}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600">${t.minThreshold.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-indigo-700 bg-indigo-50/50">{t.rebatePercentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              {/* ... (Existing product table) ... */}
              <Card className="rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                        <TableHead className="font-bold text-slate-900 h-10">Product Name</TableHead>
                        <TableHead className="font-bold text-slate-900 h-10">NDC / SKU</TableHead>
                        <TableHead className="font-bold text-slate-900 h-10">Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contract.products.map((p, i) => (
                        <TableRow key={i} className="border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="font-medium text-slate-700">{p.productName}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{p.ndc || p.sku}</TableCell>
                          <TableCell className="text-slate-500 text-xs uppercase">{p.category}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </main>
    </div>
  );
}
