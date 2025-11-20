'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MoreHorizontal, Search, Shield, UserX } from 'lucide-react';

interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  status: string;
  createdAt: any;
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
  const firestore = useFirestore();
  const currentUser = useUserProfile();
  const isAdmin = useHasRole('admin');
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersQuery = query(
          collection(firestore, 'users'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      fetchUsers();
    }
  }, [firestore, isAdmin, toast]);

  // Filter users by search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update user role
  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUser) return;
    setUpdating(true);

    try {
      await updateDoc(doc(firestore, 'users', selectedUser.uid), {
        role: newRole,
        permissions: getPermissionsForRole(newRole),
        updatedAt: new Date(),
      });

      setUsers(users.map(u =>
        u.uid === selectedUser.uid ? { ...u, role: newRole } : u
      ));

      toast({
        title: 'Role Updated',
        description: `${selectedUser.name}'s role has been updated to ${getRoleLabel(newRole)}.`,
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';

    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setUsers(users.map(u =>
        u.uid === user.uid ? { ...u, status: newStatus } : u
      ));

      toast({
        title: newStatus === 'active' ? 'User Activated' : 'User Disabled',
        description: `${user.name}'s account has been ${newStatus === 'active' ? 'activated' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setUpdating(true);

    try {
      await deleteDoc(doc(firestore, 'users', selectedUser.uid));
      setUsers(users.filter(u => u.uid !== selectedUser.uid));

      toast({
        title: 'User Deleted',
        description: `${selectedUser.name}'s account has been deleted.`,
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} total users in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.organization || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.uid !== currentUser.uid && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setEditDialogOpen(true);
                              }}
                            >
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 'active' ? 'Disable' : 'Enable'} Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <UserX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              defaultValue={selectedUser?.role}
              onValueChange={handleUpdateRole}
              disabled={updating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'contracts:read', 'contracts:write', 'contracts:delete',
      'claims:read', 'claims:write', 'claims:delete',
      'disputes:read', 'disputes:write', 'disputes:delete',
      'rules:read', 'rules:write', 'rules:delete',
      'users:read', 'users:write', 'users:delete',
      'settings:read', 'settings:write',
      'reports:read', 'reports:export',
      'audit:read',
    ],
    finance: [
      'contracts:read',
      'claims:read', 'claims:write',
      'disputes:read', 'disputes:write',
      'rules:read',
      'reports:read', 'reports:export',
      'audit:read',
    ],
    supply_chain: [
      'contracts:read', 'contracts:write',
      'claims:read',
      'rules:read', 'rules:write',
      'reports:read',
    ],
    pharmacy: [
      'contracts:read',
      'claims:read', 'claims:write',
      'disputes:read',
      'rules:read',
      'reports:read',
    ],
    compliance: [
      'contracts:read',
      'claims:read',
      'disputes:read',
      'rules:read',
      'reports:read', 'reports:export',
      'audit:read',
    ],
    analyst: [
      'contracts:read',
      'claims:read',
      'disputes:read',
      'rules:read',
      'reports:read', 'reports:export',
    ],
  };

  return rolePermissions[role] || [];
}
