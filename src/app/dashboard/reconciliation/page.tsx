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
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Matched
          </Badge>
        );
      case 'short_pay':
        return (
          <Badge variant="destructive">
            <ArrowDownRight className="mr-1 h-3 w-3" />
            Short Pay
          </Badge>
        );
      case 'over_pay':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Over Pay
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Pending
          </Badge>
        );
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Remittance Reconciliation</h1>
        <p className="text-muted-foreground">
          Match payments to claims and analyze variances
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Expected</span>
            </div>
            <p className="text-2xl font-bold">${totalExpected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Received</span>
            </div>
            <p className="text-2xl font-bold">${totalReceived.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {totalVariance < 0 ? (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm text-muted-foreground">Variance</span>
            </div>
            <p className={`text-2xl font-bold ${totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(totalVariance).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Match Rate</span>
            </div>
            <p className="text-2xl font-bold">{matchRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="remittances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="remittances">Remittances</TabsTrigger>
          <TabsTrigger value="variances">Variance Analysis</TabsTrigger>
          <TabsTrigger value="forecast">Cash Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="remittances" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search remittances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="short_pay">Short Pay</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleUploadRemittance} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Remittance
              </Button>
              <Button onClick={handleAutoReconcile} disabled={reconciling}>
                {reconciling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Auto-Reconcile
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remittances.map((remittance) => (
                    <TableRow key={remittance.id}>
                      <TableCell className="font-medium">{remittance.vendorName}</TableCell>
                      <TableCell>{new Date(remittance.remittanceDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        ${remittance.expectedAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${remittance.receivedAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right ${remittance.variance < 0 ? 'text-red-600' : remittance.variance > 0 ? 'text-green-600' : ''}`}>
                        {remittance.variance !== 0 && (remittance.variance > 0 ? '+' : '')}
                        ${remittance.variance.toLocaleString()}
                        {remittance.variancePercent !== 0 && (
                          <span className="text-xs ml-1">
                            ({remittance.variancePercent > 0 ? '+' : ''}{remittance.variancePercent.toFixed(1)}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(remittance.status)}</TableCell>
                      <TableCell className="text-right">{remittance.claimsCount}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variance Analysis</CardTitle>
              <CardDescription>
                Identify and resolve payment discrepancies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variances.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.claimId}</TableCell>
                      <TableCell>{item.product}</TableCell>
                      <TableCell className="text-right">${item.expectedAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.paidAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600">
                        ${item.variance.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.reason}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Dispute
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Forecast</CardTitle>
              <CardDescription>
                Predicted rebate payments based on historical patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Next 30 Days</p>
                  <p className="text-2xl font-bold">$425,000</p>
                  <p className="text-xs text-green-600">+12% vs last month</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Next 60 Days</p>
                  <p className="text-2xl font-bold">$890,000</p>
                  <p className="text-xs text-green-600">+8% vs last period</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Next 90 Days</p>
                  <p className="text-2xl font-bold">$1,350,000</p>
                  <p className="text-xs text-muted-foreground">Based on current accruals</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence Level</span>
                  <span>87%</span>
                </div>
                <Progress value={87} />
              </div>

              <p className="text-sm text-muted-foreground">
                Forecast based on historical time-to-payment patterns and current approval rates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
