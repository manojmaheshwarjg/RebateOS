'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  FileCheck,
  Loader2,
  Pill,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  XCircle,
  Search,
  Filter
} from 'lucide-react';

interface CoveredEntity {
  id: string;
  name: string;
  entityId: string;
  entityType: string;
  status: 'active' | 'pending' | 'inactive';
  carveOutStates: string[];
  contractPharmacies: number;
}

interface DuplicateDiscountCheck {
  id: string;
  ndc: string;
  claimId: string;
  checkType: 'medicaid' | '340b';
  result: 'clear' | 'flagged' | 'pending';
  timestamp: string;
  details: string;
}

export default function Page340B() {
  const { toast } = useToast();
  const [entities, setEntities] = useState<CoveredEntity[]>([
    {
      id: '1',
      name: 'City Hospital',
      entityId: 'CE-001234',
      entityType: 'DSH',
      status: 'active',
      carveOutStates: ['CA', 'NY', 'TX'],
      contractPharmacies: 12,
    },
    {
      id: '2',
      name: 'Community Health Center',
      entityId: 'CE-005678',
      entityType: 'FQHC',
      status: 'active',
      carveOutStates: ['CA'],
      contractPharmacies: 3,
    },
  ]);

  const [duplicateChecks, setDuplicateChecks] = useState<DuplicateDiscountCheck[]>([
    {
      id: '1',
      ndc: '00000-0000-00',
      claimId: 'CLM-2024-001',
      checkType: 'medicaid',
      result: 'clear',
      timestamp: '2024-01-15T10:30:00',
      details: 'No Medicaid claim found for this NDC/patient',
    },
    {
      id: '2',
      ndc: '00000-0000-01',
      claimId: 'CLM-2024-002',
      checkType: '340b',
      result: 'flagged',
      timestamp: '2024-01-15T10:35:00',
      details: 'Potential duplicate: 340B purchase within 30 days',
    },
    {
      id: '3',
      ndc: '00000-0000-02',
      claimId: 'CLM-2024-003',
      checkType: 'medicaid',
      result: 'pending',
      timestamp: '2024-01-15T10:40:00',
      details: 'Awaiting state Medicaid response',
    },
  ]);

  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [realTimeChecks, setRealTimeChecks] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'clear':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Clear
          </Badge>
        );
      case 'flagged':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="mr-1 h-3 w-3" />
            Flagged
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const handleSubmitPilot = async () => {
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitting(false);
    toast({
      title: 'Pilot Submission Created',
      description: 'HRSA-compliant data package has been generated.',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">340B Program Management</h1>
            <p className="text-sm text-slate-500">Configure covered entities and prevent duplicate discounts.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-9 border-slate-300">
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="shield" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100 p-1 border border-slate-200">
              <TabsTrigger value="shield" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Duplicate Discount Shield</TabsTrigger>
              <TabsTrigger value="entities" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Covered Entities</TabsTrigger>
              <TabsTrigger value="carveout" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">State Carve-Out</TabsTrigger>
              <TabsTrigger value="pilot" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Pilot Submission</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shield" className="space-y-6">
            <Alert className="bg-indigo-50 border-indigo-100 text-indigo-900">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <AlertTitle>Duplicate Discount Prevention Active</AlertTitle>
              <AlertDescription>
                Real-time checks are running to prevent 340B/Medicaid duplicate discounts.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-md border-slate-200 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    Shield Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Enable Duplicate Discount Shield</p>
                      <p className="text-sm text-slate-500">
                        Automatically check claims for duplicates against Medicaid database.
                      </p>
                    </div>
                    <Switch
                      checked={shieldEnabled}
                      onCheckedChange={setShieldEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Real-Time Checks</p>
                      <p className="text-sm text-slate-500">
                        Intercept claims at point of dispense via switch API.
                      </p>
                    </div>
                    <Switch
                      checked={realTimeChecks}
                      onCheckedChange={setRealTimeChecks}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md border-slate-200 shadow-none">
                <CardHeader>
                  <CardTitle>Shield Statistics (Today)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-md border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-700">1,247</p>
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Cleared</p>
                    </div>
                    <div className="text-center p-4 bg-rose-50 rounded-md border border-rose-100">
                      <p className="text-2xl font-bold text-rose-700">3</p>
                      <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide">Flagged</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-md border border-amber-100">
                      <p className="text-2xl font-bold text-amber-700">12</p>
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-md border border-indigo-100">
                      <p className="text-2xl font-bold text-indigo-700">99.8%</p>
                      <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">Compliance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-none">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex-1 max-w-sm relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search NDC or Claim ID..." className="pl-9 h-9 border-slate-300 bg-white" />
                </div>
                <Button variant="outline" size="sm" className="h-9 border-slate-300 bg-white">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">NDC</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Claim ID</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Check Type</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Result</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Timestamp</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateChecks.map((check) => (
                    <TableRow key={check.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <TableCell className="font-mono text-sm">{check.ndc}</TableCell>
                      <TableCell className="text-sm">{check.claimId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          {check.checkType === 'medicaid' ? 'Medicaid' : '340B'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getResultBadge(check.result)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(check.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                        {check.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="entities" className="space-y-6">
            {/* Similar cleanup for entities table, using full width Card */}
            <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-none">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Registered Covered Entities</h3>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-indigo-700"><Building2 className="mr-2 h-4 w-4" /> Add Entity</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Entity Name</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Entity ID</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Type</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Pharmacies</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Carve-Out States</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map((entity) => (
                    <TableRow key={entity.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <TableCell className="font-medium text-slate-900">{entity.name}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">{entity.entityId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600">{entity.entityType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={entity.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'}>
                          {entity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entity.contractPharmacies}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {entity.carveOutStates.join(', ') || 'None'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="carveout" className="space-y-6">
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>State Carve-Out Configuration</CardTitle>
                <CardDescription>
                  Configure Medicaid carve-out rules by state to ensure compliance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex gap-3 text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">Compliance Warning</p>
                    <p>In carve-out states, Medicaid claims are excluded from 340B pricing. Incorrect configuration may result in duplicate discounts.</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select State</Label>
                    <Select>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Choose state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Carve-Out Type</Label>
                    <Select>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Carve-Out</SelectItem>
                        <SelectItem value="partial">Partial Carve-Out</SelectItem>
                        <SelectItem value="carve-in">Carve-In</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Save Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pilot" className="space-y-6">
            {/* Simplified Pilot content */}
            <Card className="rounded-md border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle>340B Rebate Pilot Submission</CardTitle>
                <CardDescription>Generate HRSA-compliant data packages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Reporting Period</Label>
                    <Select><SelectTrigger className="border-slate-300"><SelectValue placeholder="Select period" /></SelectTrigger><SelectContent><SelectItem value="q1">Q1 2024</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Entity</Label>
                    <Select><SelectTrigger className="border-slate-300"><SelectValue placeholder="Select entity" /></SelectTrigger><SelectContent><SelectItem value="1">City Hospital</SelectItem></SelectContent></Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={handleSubmitPilot} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Generate Submission
                  </Button>
                  <Button variant="outline" className="border-slate-300"><Download className="mr-2 h-4 w-4" /> Download Template</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
