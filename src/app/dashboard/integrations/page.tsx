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
      case 'erp': return <Database className="h-5 w-5" />;
      case 'ehr': return <Server className="h-5 w-5" />;
      case 'wholesaler': return <HardDrive className="h-5 w-5" />;
      case 'sftp': return <FileSpreadsheet className="h-5 w-5" />;
      case 'api': return <Globe className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddConnection = async () => {
    setConnecting(true);

    // Simulate connection test
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
    setNewConnection({
      name: '',
      type: 'erp',
      host: '',
      port: '',
      username: '',
      password: '',
    });
    setConnecting(false);

    toast({
      title: 'Connection Added',
      description: `${connection.name} has been connected successfully.`,
    });
  };

  const handleSync = (connectionId: string) => {
    toast({
      title: 'Sync Started',
      description: 'Data synchronization has been initiated.',
    });
  };

  const handleDelete = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
    toast({
      title: 'Connection Removed',
      description: 'The data connection has been removed.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Integrations</h1>
        <p className="text-muted-foreground">
          Connect external systems and configure data mappings
        </p>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Data Connections</TabsTrigger>
          <TabsTrigger value="mappings">Entity Mappings</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="imports">File Imports</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">External Connections</h2>
              <p className="text-sm text-muted-foreground">
                Manage connections to ERP, EHR, and wholesaler systems
              </p>
            </div>
            <Dialog open={newConnectionOpen} onOpenChange={setNewConnectionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Data Connection</DialogTitle>
                  <DialogDescription>
                    Configure a new external data source
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="connName">Connection Name</Label>
                    <Input
                      id="connName"
                      value={newConnection.name}
                      onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                      placeholder="My ERP System"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="connType">Connection Type</Label>
                    <Select
                      value={newConnection.type}
                      onValueChange={(value: any) => setNewConnection({ ...newConnection, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erp">ERP System</SelectItem>
                        <SelectItem value="ehr">EHR System</SelectItem>
                        <SelectItem value="wholesaler">Wholesaler</SelectItem>
                        <SelectItem value="sftp">SFTP Server</SelectItem>
                        <SelectItem value="api">REST API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="host">Host/Endpoint</Label>
                      <Input
                        id="host"
                        value={newConnection.host}
                        onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                        placeholder="hostname.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        value={newConnection.port}
                        onChange={(e) => setNewConnection({ ...newConnection, port: e.target.value })}
                        placeholder="443"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newConnection.username}
                      onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newConnection.password}
                      onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewConnectionOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddConnection} disabled={connecting || !newConnection.name}>
                    {connecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Test & Save'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getConnectionIcon(connection.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{connection.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last synced: {new Date(connection.lastSync).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(connection.status)}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(connection.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NDC/SKU Crosswalk</CardTitle>
              <CardDescription>
                Map external product codes to standard NDC and SKU identifiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Field</TableHead>
                    <TableHead>Target Field</TableHead>
                    <TableHead>Transform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ndcMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-mono">{mapping.sourceField}</TableCell>
                      <TableCell className="font-mono">{mapping.targetField}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mapping.transformType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={mapping.active ? 'bg-green-100 text-green-800' : ''}>
                          {mapping.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facility Mappings</CardTitle>
              <CardDescription>
                Map facility codes between systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configure facility mappings...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payer Mappings</CardTitle>
              <CardDescription>
                Map payer identifiers and classifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configure payer mappings...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Dashboard</CardTitle>
              <CardDescription>
                Monitor data completeness and accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Completeness</p>
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold text-green-600">99.2%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Anomalies</p>
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                </div>
              </div>
              <div className="pt-4">
                <h4 className="font-medium mb-2">Recent Issues</h4>
                <p className="text-sm text-muted-foreground">No critical issues detected</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Imports</CardTitle>
              <CardDescription>
                Upload data files for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports CSV, XLSX, and XML formats
                </p>
                <Button variant="outline" className="mt-4">
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
