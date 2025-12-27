'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/components/local-storage-provider';
import { useUserProfile, useHasRole } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoreHorizontal, Search, Shield, UserX, UserPlus, Sliders } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization: string;
  status: string;
  created_at: string;
}

const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'finance', label: 'Finance Manager' },
  { value: 'supply_chain', label: 'Supply Chain Manager' },
  { value: 'pharmacy', label: 'Pharmacy Director' },
  { value: 'compliance', label: 'Compliance Officer' },
  { value: 'analyst', label: 'Data Analyst' },
];

export default function UserManagementPage() {
  // ... (logic remains mostly the same, focusing on layout)
  const { db } = useLocalStorage();
  const currentUser = useUserProfile();
  const isAdmin = useHasRole('admin');
  const { toast } = useToast();

  // Mock data for V3 demo if empty
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch users (Mocked for now as we don't have Supabase connected in this env)
  useEffect(() => {
    const mockUsers: User[] = [
      { id: '1', email: 'admin@rebateos.com', full_name: 'System Admin', role: 'admin', organization: 'RebateOS HQ', status: 'active', created_at: '2024-01-01' },
      { id: '2', email: 'jane.f@hospital.org', full_name: 'Jane Finance', role: 'finance', organization: 'City Hospital', status: 'active', created_at: '2024-01-15' },
      { id: '3', email: 'mike.s@hospital.org', full_name: 'Mike Supply', role: 'supply_chain', organization: 'City Hospital', status: 'active', created_at: '2024-02-01' },
    ];
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateRole = async (newRole: string) => {
    // Mock update
    setUsers(users.map(u => u.id === selectedUser?.id ? { ...u, role: newRole } : u));
    setEditDialogOpen(false);
    toast({ title: 'Role Updated', description: 'User permissions have been modified.' });
  };

  const handleDeleteUser = async () => {
    setUsers(users.filter(u => u.id !== selectedUser?.id));
    setDeleteDialogOpen(false);
    toast({ title: 'User Deleted', description: 'User access has been revoked.' });
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Admin</Badge>;
      case 'finance': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Finance</Badge>;
      default: return <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">{getRoleLabel(role)}</Badge>;
    }
  }


  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center p-8 bg-white border border-slate-200 rounded-md shadow-sm">
          <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-500">
            Administrative privileges required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">User Management</h1>
            <p className="text-sm text-slate-500">Configure access controls and team roles.</p>
          </div>
          <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 h-9 rounded-md shadow-sm border border-indigo-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-4">

        {/* FILTERS */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm border-slate-300 bg-white rounded-md focus-visible:ring-indigo-500"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-md">
            <Sliders className="h-4 w-4 mr-2" />
            Filter Role
          </Button>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-none">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                  <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Email</TableHead>
                  <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Organization</TableHead>
                  <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="h-10 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="h-10 w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                    <TableCell className="font-medium text-sm text-slate-900">{user.full_name}</TableCell>
                    <TableCell className="text-sm text-slate-500">{user.email}</TableCell>
                    <TableCell className="text-sm text-slate-500">{user.organization || '-'}</TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline" className={`rounded-full px-2 py-0 h-5 text-[10px] uppercase tracking-wide border-0 ${user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setEditDialogOpen(true); }}>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}>
                            Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <UserX className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500 text-sm">No users found matching your search.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>Update permissions for <strong>{selectedUser?.full_name}</strong></DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select onValueChange={handleUpdateRole} defaultValue={selectedUser?.role}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke Access</DialogTitle>
              <DialogDescription>Are you sure you want to remove <strong>{selectedUser?.full_name}</strong>?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteUser}>Revoke Access</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    finance: 'Finance Manager',
    supply_chain: 'Supply Chain',
    pharmacy: 'Pharmacy Director',
    compliance: 'Compliance Officer',
    analyst: 'Data Analyst',
  };
  return roleLabels[role] || role;
}
