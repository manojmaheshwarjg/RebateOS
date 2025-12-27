'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Package,
  Send,
  Settings2,
  Upload,
  XCircle,
} from 'lucide-react';

interface Claim {
  id: string;
  claimId: string;
  vendor: string;
  product: string;
  amount: number;
  quantity: number;
  status: 'ready' | 'pending' | 'submitted';
  selected: boolean;
}

interface SubmissionHistory {
  id: string;
  fileName: string;
  vendor: string;
  claimsCount: number;
  totalAmount: number;
  submittedAt: string;
  status: 'submitted' | 'acknowledged' | 'rejected' | 'partial';
}

export default function FileBuilderPage() {
  const { toast } = useToast();
  const [building, setBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [fileFormat, setFileFormat] = useState('csv');

  const [claims, setClaims] = useState<Claim[]>([
    { id: '1', claimId: 'CLM-2024-0001', vendor: 'Pfizer', product: 'Lipitor 20mg', amount: 1250.00, quantity: 100, status: 'ready', selected: false },
    { id: '2', claimId: 'CLM-2024-0002', vendor: 'Pfizer', product: 'Zoloft 50mg', amount: 890.00, quantity: 75, status: 'ready', selected: false },
    { id: '3', claimId: 'CLM-2024-0003', vendor: 'McKesson', product: 'Metformin 500mg', amount: 450.00, quantity: 200, status: 'ready', selected: false },
    { id: '4', claimId: 'CLM-2024-0004', vendor: 'McKesson', product: 'Lisinopril 10mg', amount: 680.00, quantity: 150, status: 'pending', selected: false },
    { id: '5', claimId: 'CLM-2024-0005', vendor: 'Cardinal', product: 'Omeprazole 20mg', amount: 520.00, quantity: 80, status: 'ready', selected: false },
  ]);

  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([
    {
      id: '1',
      fileName: 'pfizer_rebates_Q1_2024.csv',
      vendor: 'Pfizer',
      claimsCount: 45,
      totalAmount: 125000.00,
      submittedAt: '2024-01-15T10:30:00',
      status: 'acknowledged',
    },
    {
      id: '2',
      fileName: 'mckesson_rebates_Q1_2024.csv',
      vendor: 'McKesson',
      claimsCount: 32,
      totalAmount: 89500.00,
      submittedAt: '2024-01-14T14:20:00',
      status: 'partial',
    },
    {
      id: '3',
      fileName: 'cardinal_rebates_Q1_2024.csv',
      vendor: 'Cardinal',
      claimsCount: 28,
      totalAmount: 67800.00,
      submittedAt: '2024-01-12T09:15:00',
      status: 'submitted',
    },
  ]);

  const toggleClaimSelection = (claimId: string) => {
    setClaims(claims.map(c =>
      c.id === claimId ? { ...c, selected: !c.selected } : c
    ));
  };

  const selectAll = () => {
    const filteredClaims = selectedVendor
      ? claims.filter(c => c.vendor === selectedVendor && c.status === 'ready')
      : claims.filter(c => c.status === 'ready');

    const allSelected = filteredClaims.every(c => c.selected);

    setClaims(claims.map(c => {
      if (c.status !== 'ready') return c;
      if (selectedVendor && c.vendor !== selectedVendor) return c;
      return { ...c, selected: !allSelected };
    }));
  };

  const selectedClaims = claims.filter(c => c.selected);
  const totalSelectedAmount = selectedClaims.reduce((sum, c) => sum + c.amount, 0);

  const handleBuildFile = async () => {
    if (selectedClaims.length === 0) return;
    setBuilding(true);
    setBuildProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setBuildProgress(i);
    }
    setBuilding(false);
    toast({
      title: 'File Built Successfully',
      description: `Created submission file with ${selectedClaims.length} claims.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'acknowledged': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Acknowledged</Badge>;
      case 'submitted': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Submitted</Badge>;
      case 'partial': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partial</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">File Builder</h1>
            <p className="text-sm text-slate-500">Compile and export vendor claim submissions.</p>
          </div>
          <Button onClick={handleBuildFile} disabled={building || selectedClaims.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9">
            {building ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Build & Send
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Selected Claims</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{selectedClaims.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">${totalSelectedAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Settings2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Format</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 uppercase">{fileFormat}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="builder" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100 p-1 border border-slate-200">
              <TabsTrigger value="builder" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Build File</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Templates</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="space-y-6">
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}><SelectTrigger className="border-slate-300"><SelectValue placeholder="All Vendors" /></SelectTrigger><SelectContent><SelectItem value="">All</SelectItem><SelectItem value="Pfizer">Pfizer</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={fileFormat} onValueChange={setFileFormat}><SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="csv">CSV</SelectItem><SelectItem value="xlsx">Excel</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select defaultValue="q1-2024"><SelectTrigger className="border-slate-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="q1-2024">Q1 2024</SelectItem></SelectContent></Select>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-none">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-semibold text-sm text-slate-900">Available Claims</h3>
                <Button variant="outline" size="sm" onClick={selectAll} className="h-8 bg-white border-slate-300">
                  {selectedClaims.length === claims.filter(c => c.status === 'ready').length ? 'Deselect All' : 'Select All Ready'}
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Claim ID</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Vendor</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Product</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Qty</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Amount</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.filter(c => !selectedVendor || c.vendor === selectedVendor).map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <TableCell><Checkbox checked={claim.selected} onCheckedChange={() => toggleClaimSelection(claim.id)} disabled={claim.status !== 'ready'} /></TableCell>
                      <TableCell className="font-mono text-sm">{claim.claimId}</TableCell>
                      <TableCell className="text-sm">{claim.vendor}</TableCell>
                      <TableCell className="text-sm">{claim.product}</TableCell>
                      <TableCell className="text-right text-sm">{claim.quantity}</TableCell>
                      <TableCell className="text-right text-sm">${claim.amount.toFixed(2)}</TableCell>
                      <TableCell><Badge variant={claim.status === 'ready' ? 'default' : 'secondary'} className={claim.status === 'ready' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}>{claim.status}</Badge></TableCell>
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
