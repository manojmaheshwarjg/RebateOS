'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Database,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Settings2,
  Trash2,
  Upload,
  Link2
} from 'lucide-react';

interface DataConnection {
  id: string;
  name: string;
  type: 'erp' | 'ehr' | 'wholesaler' | 'sftp' | 'api';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  config: Record<string, string>;
}

interface EntityMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformType: string;
  active: boolean;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<DataConnection[]>([
    {
      id: '1',
      name: 'SAP ERP',
      type: 'erp',
      status: 'connected',
      lastSync: '2024-01-15T10:30:00',
      config: { host: 'sap.company.com', port: '443' },
    },
    {
      id: '2',
      name: 'Epic EHR',
      type: 'ehr',
      status: 'connected',
      lastSync: '2024-01-15T09:15:00',
      config: { endpoint: 'https://epic.hospital.org/api' },
    },
    {
      id: '3',
      name: 'McKesson',
      type: 'wholesaler',
      status: 'disconnected',
      lastSync: '2024-01-14T23:00:00',
      config: { accountId: 'MCK-12345' },
    },
  ]);

  const [newConnectionOpen, setNewConnectionOpen] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    type: 'erp' as const,
    host: '',
    port: '',
    username: '',
    password: '',
  });
  const [connecting, setConnecting] = useState(false);

  const [ndcMappings, setNdcMappings] = useState<EntityMapping[]>([
    { id: '1', sourceField: 'PRODUCT_CODE', targetField: 'ndc', transformType: 'direct', active: true },
    { id: '2', sourceField: 'ITEM_NUMBER', targetField: 'sku', transformType: 'prefix', active: true },
    { id: '3', sourceField: 'UNIT_OF_MEASURE', targetField: 'uom', transformType: 'lookup', active: true },
  ]);

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'erp': return <Database className="h-5 w-5 text-indigo-600" />;
      case 'ehr': return <Server className="h-5 w-5 text-indigo-600" />;
      case 'wholesaler': return <HardDrive className="h-5 w-5 text-indigo-600" />;
      case 'sftp': return <FileSpreadsheet className="h-5 w-5 text-indigo-600" />;
      case 'api': return <Globe className="h-5 w-5 text-indigo-600" />;
      default: return <Database className="h-5 w-5 text-indigo-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Connected</Badge>;
      case 'disconnected': return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Disconnected</Badge>;
      case 'error': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddConnection = async () => {
    setConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const connection: DataConnection = {
      id: Date.now().toString(),
      name: newConnection.name,
      type: newConnection.type,
      status: 'connected',
      lastSync: new Date().toISOString(),
      config: {
        host: newConnection.host,
        port: newConnection.port,
      },
    };
    setConnections([...connections, connection]);
    setNewConnectionOpen(false);
    setNewConnection({ name: '', type: 'erp', host: '', port: '', username: '', password: '', });
    setConnecting(false);
    toast({ title: 'Connection Added', description: `${connection.name} has been connected successfully.` });
  };

  const handleSync = (connectionId: string) => {
    toast({ title: 'Sync Started', description: 'Data synchronization has been initiated.' });
  };

  const handleDelete = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
    toast({ title: 'Connection Removed', description: 'The data connection has been removed.' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Integrations</h1>
            <p className="text-sm text-slate-500">Manage data connectors and pipelines.</p>
          </div>
          <Dialog open={newConnectionOpen} onOpenChange={setNewConnectionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9">
                <Plus className="mr-2 h-4 w-4" /> Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Data Connection</DialogTitle>
                <DialogDescription>Configure a new external data source</DialogDescription>
              </DialogHeader>
              {/* Simplified Form for visual cleanup */}
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label >Name</Label>
                  <Input placeholder="System Name" value={newConnection.name} onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Host</Label><Input /></div>
                  <div className="space-y-2"><Label>Port</Label><Input /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewConnectionOpen(false)}>Cancel</Button>
                <Button onClick={handleAddConnection} disabled={connecting}>{connecting ? 'Connecting...' : 'Save'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="connections" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-100 p-1 border border-slate-200">
              <TabsTrigger value="connections" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Connections</TabsTrigger>
              <TabsTrigger value="mappings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Mappings</TabsTrigger>
              <TabsTrigger value="quality" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Data Quality</TabsTrigger>
              <TabsTrigger value="imports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Imports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="connections" className="space-y-4">
            <div className="grid gap-4">
              {connections.map((connection) => (
                <div key={connection.id} className="group bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                        {getConnectionIcon(connection.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{connection.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                          <Link2 className="h-3 w-3" />
                          <span>Last synced: {new Date(connection.lastSync).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(connection.status)}
                      <div className="h-4 w-px bg-slate-200"></div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleSync(connection.id)}><RefreshCw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"><Settings2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(connection.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mappings">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-sm">NDC/SKU Crosswalk</h3>
                <Button variant="outline" size="sm" className="h-8 bg-white"><Plus className="mr-2 h-3 w-3" /> Add Mapping</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Source Field</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Target Field</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Transform</TableHead>
                    <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ndcMappings.map((mapping) => (
                    <TableRow key={mapping.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                      <TableCell className="font-mono text-sm">{mapping.sourceField}</TableCell>
                      <TableCell className="font-mono text-sm">{mapping.targetField}</TableCell>
                      <TableCell><Badge variant="outline" className="text-slate-600 bg-slate-50">{mapping.transformType}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={mapping.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}>{mapping.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon"><Settings2 className="h-4 w-4 text-slate-400" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="quality">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-md border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500 mb-1">Completeness</p>
                  <p className="text-2xl font-bold text-emerald-600">98.5%</p>
                </CardContent>
              </Card>
              <Card className="rounded-md border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500 mb-1">Accuracy</p>
                  <p className="text-2xl font-bold text-emerald-600">99.2%</p>
                </CardContent>
              </Card>
              <Card className="rounded-md border-slate-200 shadow-none">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500 mb-1">Anomalies</p>
                  <p className="text-2xl font-bold text-amber-500">12</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="imports">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Upload Data File</h3>
              <p className="text-slate-500 mt-1">Drag and drop CSV, XLSX, or XML files here.</p>
              <Button variant="outline" className="mt-6">Select File</Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
