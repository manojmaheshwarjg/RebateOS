'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Send,
  Shield,
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  type: 'cms' | 'gpo' | 'internal';
  frequency: string;
  lastGenerated: string;
  status: 'current' | 'due' | 'overdue';
}

interface AccessLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
}

export default function ReportingPage() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('q1-2024');

  const [reports, setReports] = useState<ReportTemplate[]>([
    {
      id: '1',
      name: 'CMS Cost Report S-10',
      type: 'cms',
      frequency: 'Annual',
      lastGenerated: '2023-12-15',
      status: 'current',
    },
    {
      id: '2',
      name: 'GPO Compliance Attestation',
      type: 'gpo',
      frequency: 'Quarterly',
      lastGenerated: '2024-01-05',
      status: 'current',
    },
    {
      id: '3',
      name: '340B Utilization Report',
      type: 'cms',
      frequency: 'Quarterly',
      lastGenerated: '2023-10-15',
      status: 'due',
    },
    {
      id: '4',
      name: 'Manufacturer Rebate Summary',
      type: 'internal',
      frequency: 'Monthly',
      lastGenerated: '2024-01-10',
      status: 'current',
    },
    {
      id: '5',
      name: 'Duplicate Discount Log',
      type: 'cms',
      frequency: 'Monthly',
      lastGenerated: '2023-11-30',
      status: 'overdue',
    },
  ]);

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([
    {
      id: '1',
      user: 'john.smith@hospital.org',
      action: 'VIEW',
      resource: 'Contract #12345',
      timestamp: '2024-01-15T14:30:00',
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      user: 'jane.doe@hospital.org',
      action: 'EXPORT',
      resource: 'Rebate Report Q4',
      timestamp: '2024-01-15T14:25:00',
      ipAddress: '192.168.1.105',
    },
    {
      id: '3',
      user: 'admin@hospital.org',
      action: 'MODIFY',
      resource: 'User Permissions',
      timestamp: '2024-01-15T14:20:00',
      ipAddress: '192.168.1.1',
    },
    {
      id: '4',
      user: 'john.smith@hospital.org',
      action: 'APPROVE',
      resource: 'Claim #CLM-2024-001',
      timestamp: '2024-01-15T14:15:00',
      ipAddress: '192.168.1.100',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Current
          </Badge>
        );
      case 'due':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Due
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
    toast({
      title: 'Report Generated',
      description: 'The report has been generated and is ready for download.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & Reporting</h1>
        <p className="text-muted-foreground">
          Generate CMS/GPO reports and maintain audit trails
        </p>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Report Generator</TabsTrigger>
          <TabsTrigger value="attestations">Attestations</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Center</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1-2024">Q1 2024</SelectItem>
                  <SelectItem value="q4-2023">Q4 2023</SelectItem>
                  <SelectItem value="2023">FY 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      report.type === 'cms' ? 'bg-blue-100' :
                      report.type === 'gpo' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {report.type === 'cms' ? (
                        <FileBarChart className="h-5 w-5 text-blue-600" />
                      ) : report.type === 'gpo' ? (
                        <FileText className="h-5 w-5 text-purple-600" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.frequency} • Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(report.status)}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={generating}
                      >
                        {generating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <FileBarChart className="mr-2 h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attestations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Attestations</CardTitle>
              <CardDescription>
                Complete required attestations for regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">GPO Compliance Attestation - Q1 2024</h4>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Quarterly attestation confirming compliance with GPO contract terms
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked disabled />
                    <span className="text-sm">All rebate claims are accurate and complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked disabled />
                    <span className="text-sm">No duplicate discounts claimed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked disabled />
                    <span className="text-sm">All documentation is maintained per requirements</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Signed by: John Smith • January 15, 2024
                </p>
              </div>

              <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">340B Program Attestation - 2024</h4>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Annual attestation for 340B program compliance
                </p>
                <Button size="sm">Complete Attestation</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>
                Complete audit trail of system access and modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Center</CardTitle>
              <CardDescription>
                Manage encryption, BAA, and PHI protection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Encryption Status</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    All data encrypted at rest and in transit
                  </p>
                  <Badge className="bg-green-100 text-green-800">AES-256 Active</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">BAA Management</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Business Associate Agreements on file
                  </p>
                  <Badge variant="outline">3 Active BAAs</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">Data Retention</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Automatic retention policies applied
                  </p>
                  <Badge variant="outline">7 Years</Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">HIPAA Compliance</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    PHI protection measures active
                  </p>
                  <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
