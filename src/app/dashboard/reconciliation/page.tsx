'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
  Upload,
  XCircle,
  Filter
} from 'lucide-react';

interface RemittanceRecord {
  id: string;
  vendorName: string;
  remittanceDate: string;
  expectedAmount: number;
  receivedAmount: number;
  variance: number;
  variancePercent: number;
  status: 'matched' | 'short_pay' | 'over_pay' | 'pending';
  claimsCount: number;
}

interface VarianceItem {
  id: string;
  claimId: string;
  product: string;
  expectedAmount: number;
  paidAmount: number;
  variance: number;
  reason: string;
}

export default function ReconciliationPage() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [remittances, setRemittances] = useState<RemittanceRecord[]>([
    {
      id: '1',
      vendorName: 'Pfizer Inc.',
      remittanceDate: '2024-01-15',
      expectedAmount: 125000.00,
      receivedAmount: 125000.00,
      variance: 0,
      variancePercent: 0,
      status: 'matched',
      claimsCount: 45,
    },
    {
      id: '2',
      vendorName: 'McKesson',
      remittanceDate: '2024-01-14',
      expectedAmount: 89500.00,
      receivedAmount: 85250.00,
      variance: -4250.00,
      variancePercent: -4.75,
      status: 'short_pay',
      claimsCount: 32,
    },
    {
      id: '3',
      vendorName: 'AmerisourceBergen',
      remittanceDate: '2024-01-12',
      expectedAmount: 67800.00,
      receivedAmount: 68500.00,
      variance: 700.00,
      variancePercent: 1.03,
      status: 'over_pay',
      claimsCount: 28,
    },
    {
      id: '4',
      vendorName: 'Cardinal Health',
      remittanceDate: '2024-01-10',
      expectedAmount: 95200.00,
      receivedAmount: 0,
      variance: -95200.00,
      variancePercent: -100,
      status: 'pending',
      claimsCount: 41,
    },
  ]);

  const [variances, setVariances] = useState<VarianceItem[]>([
    {
      id: '1',
      claimId: 'CLM-2024-0125',
      product: 'Lipitor 20mg',
      expectedAmount: 1250.00,
      paidAmount: 1100.00,
      variance: -150.00,
      reason: 'Tier not met',
    },
    {
      id: '2',
      claimId: 'CLM-2024-0126',
      product: 'Zoloft 50mg',
      expectedAmount: 890.00,
      paidAmount: 750.00,
      variance: -140.00,
      reason: 'Rate discrepancy',
    },
    {
      id: '3',
      claimId: 'CLM-2024-0127',
      product: 'Metformin 500mg',
      expectedAmount: 450.00,
      paidAmount: 320.00,
      variance: -130.00,
      reason: 'Eligibility denied',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="mr-1 h-3 w-3" />Matched</Badge>;
      case 'short_pay':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200"><ArrowDownRight className="mr-1 h-3 w-3" />Short Pay</Badge>;
      case 'over_pay':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><ArrowUpRight className="mr-1 h-3 w-3" />Over Pay</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUploadRemittance = async () => {
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setUploading(false);
    toast({
      title: 'Remittance Uploaded',
      description: 'File has been processed and matched to claims.',
    });
  };

  const handleAutoReconcile = async () => {
    setReconciling(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setReconciling(false);
    toast({
      title: 'Reconciliation Complete',
      description: '156 claims matched, 12 variances identified.',
    });
  };

  const totalExpected = remittances.reduce((sum, r) => sum + r.expectedAmount, 0);
  const totalReceived = remittances.reduce((sum, r) => sum + r.receivedAmount, 0);
  const totalVariance = remittances.reduce((sum, r) => sum + r.variance, 0);
  const matchRate = (remittances.filter(r => r.status === 'matched').length / remittances.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Financial Reconciliation</h1>
            <p className="text-sm text-slate-500">Match payments to claims and analyze financial variances.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 border-slate-300" onClick={handleUploadRemittance} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Remittance
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-sm" onClick={handleAutoReconcile} disabled={reconciling}>
              {reconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Auto-Reconcile
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {/* Standardized Metric Cards */}
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Expected</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">${totalExpected.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Received</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">${totalReceived.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                {totalVariance < 0 ? <ArrowDownRight className="h-4 w-4 text-rose-500" /> : <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                <span className="text-sm font-medium text-slate-500">Variance</span>
              </div>
              <p className={`text-2xl font-bold ${totalVariance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ${Math.abs(totalVariance).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Match Rate</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{matchRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="remittances" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100 p-1 border border-slate-200">
              <TabsTrigger value="remittances" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Remittances</TabsTrigger>
              <TabsTrigger value="variances" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Variance Analysis</TabsTrigger>
              <TabsTrigger value="forecast" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Cash Forecast</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="remittances" className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-none">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex-1 max-w-sm relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search remittances..." className="pl-9 h-9 border-slate-300 bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="h-9 border-slate-300 bg-white">
                  <Filter className="mr-2 h-4 w-4" /> Filter Status
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Vendor</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Expected</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Received</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Variance</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Claims</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remittances.map((remittance) => (
                    <TableRow key={remittance.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <TableCell className="font-medium text-slate-900">{remittance.vendorName}</TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(remittance.remittanceDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right text-sm">${remittance.expectedAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">${remittance.receivedAmount.toLocaleString()}</TableCell>
                      <TableCell className={`text-right text-sm font-medium ${remittance.variance < 0 ? 'text-rose-600' : remittance.variance > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {remittance.variance !== 0 && (remittance.variance > 0 ? '+' : '')}
                        ${remittance.variance.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(remittance.status)}</TableCell>
                      <TableCell className="text-right text-sm">{remittance.claimsCount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="variances" className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-none">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Claim ID</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Product</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Expected</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Paid</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Variance</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Reason</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variances.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <TableCell className="font-mono text-sm text-slate-600">{item.claimId}</TableCell>
                      <TableCell className="text-slate-900 font-medium">{item.product}</TableCell>
                      <TableCell className="text-right text-sm">${item.expectedAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">${item.paidAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-rose-600 font-medium text-sm">
                        ${item.variance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{item.reason}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50">Dispute</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
