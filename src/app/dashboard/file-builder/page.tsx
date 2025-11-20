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
    if (selectedClaims.length === 0) {
      toast({
        title: 'No Claims Selected',
        description: 'Please select at least one claim to build the file.',
        variant: 'destructive',
      });
      return;
    }

    setBuilding(true);
    setBuildProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setBuildProgress(i);
    }

    setBuilding(false);
    toast({
      title: 'File Built Successfully',
      description: `Created ${selectedVendor || 'rebates'}_submission.${fileFormat} with ${selectedClaims.length} claims.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Acknowledged
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Partial Accept
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">File Builder</h1>
        <p className="text-muted-foreground">
          Build and submit rebate claim files to vendors
        </p>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Build File</TabsTrigger>
          <TabsTrigger value="history">Submission History</TabsTrigger>
          <TabsTrigger value="templates">Vendor Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Selected Claims</span>
                </div>
                <p className="text-2xl font-bold">{selectedClaims.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                </div>
                <p className="text-2xl font-bold">${totalSelectedAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Format</span>
                </div>
                <p className="text-2xl font-bold uppercase">{fileFormat}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>File Configuration</CardTitle>
              <CardDescription>Configure the output file settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Vendors</SelectItem>
                      <SelectItem value="Pfizer">Pfizer</SelectItem>
                      <SelectItem value="McKesson">McKesson</SelectItem>
                      <SelectItem value="Cardinal">Cardinal Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>File Format</Label>
                  <Select value={fileFormat} onValueChange={setFileFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="edi">EDI 867</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Submission Period</Label>
                  <Select defaultValue="q1-2024">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q1-2024">Q1 2024</SelectItem>
                      <SelectItem value="q4-2023">Q4 2023</SelectItem>
                      <SelectItem value="q3-2023">Q3 2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Claim Selection</CardTitle>
                  <CardDescription>Select claims to include in the submission file</CardDescription>
                </div>
                <Button variant="outline" onClick={selectAll}>
                  {selectedClaims.length === claims.filter(c => c.status === 'ready').length
                    ? 'Deselect All'
                    : 'Select All Ready'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims
                    .filter(c => !selectedVendor || c.vendor === selectedVendor)
                    .map((claim) => (
                      <TableRow key={claim.id} className={claim.status !== 'ready' ? 'opacity-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={claim.selected}
                            onCheckedChange={() => toggleClaimSelection(claim.id)}
                            disabled={claim.status !== 'ready'}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{claim.claimId}</TableCell>
                        <TableCell>{claim.vendor}</TableCell>
                        <TableCell>{claim.product}</TableCell>
                        <TableCell className="text-right">{claim.quantity}</TableCell>
                        <TableCell className="text-right">${claim.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={claim.status === 'ready' ? 'default' : 'secondary'}>
                            {claim.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {building && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Building file...</span>
                    <span>{buildProgress}%</span>
                  </div>
                  <Progress value={buildProgress} />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button onClick={handleBuildFile} disabled={building || selectedClaims.length === 0}>
                  {building ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Build & Download
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
              <CardDescription>Track submitted files and vendor acknowledgements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionHistory.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm">{submission.fileName}</TableCell>
                      <TableCell>{submission.vendor}</TableCell>
                      <TableCell className="text-right">{submission.claimsCount}</TableCell>
                      <TableCell className="text-right">${submission.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor File Templates</CardTitle>
              <CardDescription>Configure vendor-specific file formats and schemas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Pfizer</h4>
                  <p className="text-sm text-muted-foreground mb-2">CSV format with custom headers</p>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">McKesson</h4>
                  <p className="text-sm text-muted-foreground mb-2">EDI 867 format</p>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Cardinal Health</h4>
                  <p className="text-sm text-muted-foreground mb-2">Excel with pivot tables</p>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">AmerisourceBergen</h4>
                  <p className="text-sm text-muted-foreground mb-2">XML schema v2.1</p>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
