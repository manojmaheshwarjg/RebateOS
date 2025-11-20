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
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Clear
          </Badge>
        );
      case 'flagged':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Flagged
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">340B Program Management</h1>
        <p className="text-muted-foreground">
          Configure covered entities and prevent duplicate discounts
        </p>
      </div>

      <Tabs defaultValue="shield" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shield">Duplicate Discount Shield</TabsTrigger>
          <TabsTrigger value="entities">Covered Entities</TabsTrigger>
          <TabsTrigger value="carveout">State Carve-Out</TabsTrigger>
          <TabsTrigger value="pilot">Pilot Submission</TabsTrigger>
        </TabsList>

        <TabsContent value="shield" className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Duplicate Discount Prevention Active</AlertTitle>
            <AlertDescription>
              Real-time checks are running to prevent 340B/Medicaid duplicate discounts
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Shield Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Duplicate Discount Shield</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically check claims for duplicates
                    </p>
                  </div>
                  <Switch
                    checked={shieldEnabled}
                    onCheckedChange={setShieldEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Real-Time Checks</p>
                    <p className="text-sm text-muted-foreground">
                      Check at point of dispense
                    </p>
                  </div>
                  <Switch
                    checked={realTimeChecks}
                    onCheckedChange={setRealTimeChecks}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shield Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">1,247</p>
                    <p className="text-xs text-muted-foreground">Cleared Today</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-xs text-muted-foreground">Flagged Today</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">12</p>
                    <p className="text-xs text-muted-foreground">Pending Review</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">99.8%</p>
                    <p className="text-xs text-muted-foreground">Compliance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Duplicate Discount Checks</CardTitle>
              <CardDescription>
                Real-time monitoring of 340B and Medicaid claim conflicts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NDC</TableHead>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell className="font-mono">{check.ndc}</TableCell>
                      <TableCell>{check.claimId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {check.checkType === 'medicaid' ? 'Medicaid' : '340B'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getResultBadge(check.result)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(check.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {check.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Covered Entities</CardTitle>
              <CardDescription>
                Manage 340B covered entity registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Name</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contract Pharmacies</TableHead>
                    <TableHead>Carve-Out States</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell className="font-mono">{entity.entityId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entity.entityType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={entity.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                          {entity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{entity.contractPharmacies}</TableCell>
                      <TableCell>
                        {entity.carveOutStates.join(', ') || 'None'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" className="mt-4">
                <Building2 className="mr-2 h-4 w-4" />
                Add Covered Entity
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carveout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>State Carve-Out Configuration</CardTitle>
              <CardDescription>
                Configure Medicaid carve-out rules by state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="default">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Carve-Out States</AlertTitle>
                <AlertDescription>
                  In carve-out states, Medicaid claims are excluded from 340B pricing.
                  Configure your state rules carefully to ensure compliance.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Select State</Label>
                  <Select>
                    <SelectTrigger>
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
                    <SelectTrigger>
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

              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pilot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>340B Rebate Pilot Submission</CardTitle>
              <CardDescription>
                Generate HRSA-compliant data packages for pilot submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileCheck className="h-4 w-4" />
                <AlertTitle>Pilot Program</AlertTitle>
                <AlertDescription>
                  Prepare and submit claims data for the 340B Rebate Pilot Program
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Reporting Period</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q1-2024">Q1 2024</SelectItem>
                      <SelectItem value="q4-2023">Q4 2023</SelectItem>
                      <SelectItem value="q3-2023">Q3 2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Covered Entity</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map(entity => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitPilot} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Generate Submission Package
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
