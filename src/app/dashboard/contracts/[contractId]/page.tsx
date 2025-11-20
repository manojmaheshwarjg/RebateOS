'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  Lightbulb,
  Loader2,
  Mail,
  Package,
  Phone,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User,
  Wand2,
} from 'lucide-react';
import { suggestTierOptimizations, type SuggestTierOptimizationsOutput } from '@/ai/flows/suggest-tier-optimizations';
import { suggestSubstitutions, type SuggestSubstitutionsOutput } from '@/ai/flows/suggest-substitutions';

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
  vendorId: string;
  vendorName: string;
  vendorContact: VendorContact;
  contractType: 'GPO' | 'IDN' | 'Direct' | 'Wholesale' | 'Other';
  contractNumber: string | null;
  startDate: string;
  endDate: string;
  renewalTerms: string | null;
  rebateTiers: RebateTier[];
  products: Product[];
  paymentTerms: string;
  submissionDeadline: string | null;
  requiredDocumentation: string[];
  eligibilityCriteria: string[];
  exclusions: string[];
  specialConditions: string[];
  confidence: {
    overall: number;
    vendorInfo: number;
    dates: number;
    tiers: number;
    products: number;
  };
  rawRebateRates: string;
  rawProductList: string;
  status: string;
  description: string;
  contractFileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractDetailPage() {
  const { contractId } = useParams();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [generatingRules, setGeneratingRules] = useState(false);
  const [analyzingTiers, setAnalyzingTiers] = useState(false);
  const [findingSubstitutions, setFindingSubstitutions] = useState(false);
  const [tierOptimizations, setTierOptimizations] = useState<SuggestTierOptimizationsOutput | null>(null);
  const [substitutionSuggestions, setSubstitutionSuggestions] = useState<SuggestSubstitutionsOutput | null>(null);

  const contractRef = useMemoFirebase(() => {
    if (!firestore || !contractId) return null;
    return doc(firestore, 'contracts', contractId as string);
  }, [firestore, contractId]);

  const { data: contract, isLoading } = useDoc<Contract>(contractRef);

  const handleGenerateRules = async () => {
    if (!contract || !firestore) return;

    setGeneratingRules(true);

    try {
      const rulesCollection = collection(firestore, 'rebate_rules');
      const generatedRules = [];

      // Generate a rule for each rebate tier
      for (const tier of contract.rebateTiers) {
        const rule = {
          name: `${contract.vendorName} - ${tier.tierName}`,
          contractId: contract.id,
          type: 'tier',
          description: `Auto-generated from ${contract.contractType} contract with ${contract.vendorName}`,
          criteria: {
            minThreshold: tier.minThreshold,
            maxThreshold: tier.maxThreshold,
            rebatePercentage: tier.rebatePercentage,
            rebateType: tier.rebateType,
            applicableProducts: tier.applicableProducts,
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          source: 'ai-generated',
        };

        const docRef = await addDoc(rulesCollection, rule);
        generatedRules.push(docRef.id);
      }

      toast({
        title: 'Rules Generated',
        description: `Created ${generatedRules.length} rebate rules from contract tiers.`,
      });

      router.push('/dashboard/rules');
    } catch (error) {
      console.error('Error generating rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingRules(false);
    }
  };

  const handleAnalyzeTiers = async () => {
    if (!contract) return;

    setAnalyzingTiers(true);

    try {
      // Prepare contract data for tier optimization
      const contractTerms = JSON.stringify({
        vendorName: contract.vendorName,
        contractType: contract.contractType,
        startDate: contract.startDate,
        endDate: contract.endDate,
        paymentTerms: contract.paymentTerms,
      });

      const currentTiers = JSON.stringify(contract.rebateTiers);

      // Generate mock historical data based on tiers
      const historicalData: Record<string, number> = {};
      contract.rebateTiers.forEach((tier, index) => {
        const baseVolume = tier.minThreshold * 1.5;
        historicalData[`quarter_${index + 1}`] = baseVolume;
      });

      // Generate mock market trends
      const marketTrends = JSON.stringify({
        industryGrowth: '8%',
        competitorRebates: 'Average 5-12%',
        seasonalTrends: 'Q4 typically highest volume',
        priceInflation: '3.5%',
      });

      const result = await suggestTierOptimizations({
        historicalSalesData: JSON.stringify(historicalData),
        marketTrends,
        contractTerms,
        currentTiers,
      });

      setTierOptimizations(result);

      toast({
        title: 'Tier Analysis Complete',
        description: 'AI has generated optimization recommendations for your rebate tiers.',
      });
    } catch (error) {
      console.error('Error analyzing tiers:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not complete tier optimization analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingTiers(false);
    }
  };

  const handleFindSubstitutions = async () => {
    if (!contract || !contract.products || contract.products.length === 0) return;

    setFindingSubstitutions(true);

    try {
      // Generate product usage data from contract products
      const productUsage: Record<string, number> = {};
      contract.products.forEach(product => {
        productUsage[product.productName] = Math.floor(Math.random() * 1000) + 100;
      });

      // Generate contract terms with rebate info for each product
      const contractTermsWithRebates = contract.products.map((product, index) => ({
        product: product.productName,
        ndc: product.ndc,
        category: product.category,
        rebate: contract.rebateTiers[0]?.rebatePercentage || 5,
      }));

      // Generate clinical equivalents mapping
      const clinicalEquivalents: Record<string, string[]> = {};
      contract.products.forEach(product => {
        // Create mock equivalents for demonstration
        if (product.category) {
          clinicalEquivalents[product.productName] = [
            `Generic ${product.productName}`,
            `${product.category} Alternative`,
          ];
        }
      });

      const result = await suggestSubstitutions({
        productUsageData: JSON.stringify(productUsage),
        contractTerms: JSON.stringify(contractTermsWithRebates),
        clinicalEquivalents: JSON.stringify(clinicalEquivalents),
      });

      setSubstitutionSuggestions(result);

      toast({
        title: 'Substitution Analysis Complete',
        description: `Found ${result.suggestions.length} potential substitution opportunities.`,
      });
    } catch (error) {
      console.error('Error finding substitutions:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not complete substitution analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFindingSubstitutions(false);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">High ({score}%)</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Medium ({score}%)</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low ({score}%)</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div>
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return <p>Contract not found.</p>;
  }

  const isPdf = contract.contractFileUrl && contract.contractFileUrl.includes('.pdf');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{contract.vendorName}</h1>
          <p className="text-muted-foreground">{contract.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{contract.contractType}</Badge>
            <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
              {contract.status}
            </Badge>
            {contract.contractNumber && (
              <Badge variant="outline">#{contract.contractNumber}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAnalyzeTiers}
            disabled={analyzingTiers || !contract.rebateTiers?.length}
          >
            {analyzingTiers ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Optimize Tiers
          </Button>
          <Button
            variant="outline"
            onClick={handleFindSubstitutions}
            disabled={findingSubstitutions || !contract.products?.length}
          >
            {findingSubstitutions ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="mr-2 h-4 w-4" />
            )}
            Find Substitutions
          </Button>
          <Button variant="outline" onClick={handleGenerateRules} disabled={generatingRules}>
            {generatingRules ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Rules
          </Button>
        </div>
      </div>

      {/* Confidence Indicator */}
      {contract.confidence && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Extraction Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={contract.confidence.overall} />
              </div>
              {getConfidenceBadge(contract.confidence.overall)}
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
              <div>
                <span className="text-muted-foreground">Vendor</span>
                <p className="font-medium">{contract.confidence.vendorInfo}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dates</span>
                <p className="font-medium">{contract.confidence.dates}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tiers</span>
                <p className="font-medium">{contract.confidence.tiers}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Products</span>
                <p className="font-medium">{contract.confidence.products}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations Section */}
      {(tierOptimizations || substitutionSuggestions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Optimization Recommendations */}
          {tierOptimizations && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Lightbulb className="h-5 w-5" />
                  Tier Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions to improve your rebate tier structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    {tierOptimizations.explanation}
                  </p>
                </div>
                {tierOptimizations.optimizedTiers && (
                  <div>
                    <p className="text-sm font-medium mb-2">Suggested Optimized Tiers</p>
                    <pre className="text-xs bg-white p-3 rounded-md overflow-auto max-h-48 border">
                      {tierOptimizations.optimizedTiers}
                    </pre>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTierOptimizations(null)}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Substitution Suggestions */}
          {substitutionSuggestions && substitutionSuggestions.suggestions.length > 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <ArrowRightLeft className="h-5 w-5" />
                  Substitution Opportunities
                </CardTitle>
                <CardDescription>
                  Product switches that could improve rebate performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {substitutionSuggestions.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-white rounded-md border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{suggestion.originalProduct}</Badge>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      <Badge className="bg-green-100 text-green-800">
                        {suggestion.suggestedSubstitute}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {suggestion.reasoning}
                    </p>
                    <p className="text-xs font-medium text-green-700">
                      Estimated Savings: {suggestion.estimatedSavings}
                    </p>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubstitutionSuggestions(null)}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Contract Details */}
        <div className="space-y-6">
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{new Date(contract.endDate).toLocaleDateString()}</p>
                </div>
              </div>
              {contract.renewalTerms && (
                <div>
                  <p className="text-sm text-muted-foreground">Renewal Terms</p>
                  <p className="font-medium">{contract.renewalTerms}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">{contract.paymentTerms}</p>
              </div>
              {contract.submissionDeadline && (
                <div>
                  <p className="text-sm text-muted-foreground">Submission Deadline</p>
                  <p className="font-medium">{contract.submissionDeadline}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vendor Contact */}
          {contract.vendorContact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vendor Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contract.vendorContact.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{contract.vendorContact.name}</span>
                    {contract.vendorContact.department && (
                      <span className="text-muted-foreground">({contract.vendorContact.department})</span>
                    )}
                  </div>
                )}
                {contract.vendorContact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${contract.vendorContact.email}`} className="text-primary hover:underline">
                      {contract.vendorContact.email}
                    </a>
                  </div>
                )}
                {contract.vendorContact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{contract.vendorContact.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rebate Tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rebate Tiers ({contract.rebateTiers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.rebateTiers && contract.rebateTiers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Rebate</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.rebateTiers.map((tier, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{tier.tierName}</TableCell>
                        <TableCell>
                          ${tier.minThreshold.toLocaleString()}
                          {tier.maxThreshold ? ` - $${tier.maxThreshold.toLocaleString()}` : '+'}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {tier.rebatePercentage}%
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tier.rebateType}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">No tiers extracted</p>
              )}
            </CardContent>
          </Card>

          {/* Eligibility & Exclusions */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility & Exclusions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.eligibilityCriteria && contract.eligibilityCriteria.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Eligibility Criteria</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {contract.eligibilityCriteria.map((criteria, i) => (
                      <li key={i} className="text-muted-foreground">{criteria}</li>
                    ))}
                  </ul>
                </div>
              )}
              {contract.exclusions && contract.exclusions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Exclusions</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {contract.exclusions.map((exclusion, i) => (
                      <li key={i} className="text-muted-foreground text-red-600">{exclusion}</li>
                    ))}
                  </ul>
                </div>
              )}
              {contract.requiredDocumentation && contract.requiredDocumentation.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Required Documentation</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {contract.requiredDocumentation.map((doc, i) => (
                      <li key={i} className="text-muted-foreground">{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Products & Document */}
        <div className="space-y-6">
          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products ({contract.products?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.products && contract.products.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>NDC</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contract.products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {product.ndc || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No products extracted</p>
              )}
            </CardContent>
          </Card>

          {/* Contract Document */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Contract Document</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              {isPdf ? (
                <iframe
                  src={contract.contractFileUrl}
                  width="100%"
                  height="400"
                  className="border rounded-md"
                />
              ) : (
                <a
                  href={contract.contractFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Document
                </a>
              )}
            </CardContent>
          </Card>

          {/* Raw Extracted Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raw Extracted Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="rates">
                <TabsList className="w-full">
                  <TabsTrigger value="rates" className="flex-1">Rebate Rates</TabsTrigger>
                  <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
                </TabsList>
                <TabsContent value="rates" className="mt-2">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32 whitespace-pre-wrap">
                    {contract.rawRebateRates || 'No data'}
                  </pre>
                </TabsContent>
                <TabsContent value="products" className="mt-2">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32 whitespace-pre-wrap">
                    {contract.rawProductList || 'No data'}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
