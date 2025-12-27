'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  Activity
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
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 rounded-sm">Current</Badge>;
      case 'due':
        return <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 rounded-sm">Due</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="rounded-sm">Overdue</Badge>;
      default:
        return <Badge variant="outline" className="rounded-sm">{status}</Badge>;
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
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Compliance & Reporting</h1>
            <p className="text-sm text-slate-500">Generate regulatory reports and view audit logs.</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-md">
            <TabsTrigger value="reports" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Report Generator</TabsTrigger>
            <TabsTrigger value="attestations" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Attestations</TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Audit Logs</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-md">
              <span className="text-sm font-medium text-slate-700 ml-2">Reporting Period:</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40 h-8 text-xs border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1-2024">Q1 2024</SelectItem>
                  <SelectItem value="q4-2023">Q4 2023</SelectItem>
                  <SelectItem value="2023">FY 2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-md hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={
                      `p-2 rounded-md border ${report.type === 'cms' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                        report.type === 'gpo' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                      {report.type === 'cms' ? <FileBarChart className="h-5 w-5" /> : report.type === 'gpo' ? <FileText className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{report.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.frequency} • Last: <span className="font-mono">{new Date(report.lastGenerated).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    {getStatusBadge(report.status)}
                    <div className="h-4 w-px bg-slate-200" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={generating}
                      className="h-8 text-xs bg-white hover:bg-slate-50"
                    >
                      {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Download className="h-3 w-3 mr-2" />}
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="attestations" className="space-y-4">
            <div className="grid gap-4">
              <div className="p-6 bg-white border border-slate-200 rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-900">GPO Compliance Attestation</h4>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-700">All rebate claims are accurate and complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-700">No duplicate discounts claimed</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-bold text-slate-700 h-10 text-xs uppercase tracking-wider">User</TableHead>
                    <TableHead className="font-bold text-slate-700 h-10 text-xs uppercase tracking-wider">Action</TableHead>
                    <TableHead className="font-bold text-slate-700 h-10 text-xs uppercase tracking-wider">Resource</TableHead>
                    <TableHead className="font-bold text-slate-700 h-10 text-xs uppercase tracking-wider">Timestamp</TableHead>
                    <TableHead className="font-bold text-slate-700 h-10 text-xs uppercase tracking-wider">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell className="py-2 text-xs font-medium text-slate-900">{log.user}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none font-mono">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-slate-600">{log.resource}</TableCell>
                      <TableCell className="py-2 text-xs text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 font-mono text-[10px] text-slate-400">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-md border-dashed">
              <div className="text-center">
                <Shield className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="mt-2 text-sm text-slate-500">Security settings are managed by your organization administrator.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
