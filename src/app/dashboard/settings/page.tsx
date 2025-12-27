'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/components/local-storage-provider';
import { useUserProfile } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Check, User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { db } = useLocalStorage();
  const userProfile = useUserProfile();
  const { toast } = useToast();

  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: userProfile?.full_name || '',
    email: userProfile?.email || '',
    organization: userProfile?.organization || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProfileSuccess(true);
      toast({
        title: 'Demo Mode',
        description: 'Profile updates are not persisted in local storage mode.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      setPasswordLoading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: 'Demo Mode',
        description: 'Password changes are not persisted in local storage mode.',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Configuration</h1>
          <p className="text-sm text-slate-500">Manage user profile and security preferences.</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-md">
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Profile</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Security</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-500 px-4 py-2 h-9">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="max-w-4xl">
            <Card className="rounded-md shadow-none border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-md">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Personal Information</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Update your contact details and role.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {profileSuccess && (
                    <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <AlertDescription>Profile updated successfully.</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-xs font-semibold text-slate-500 uppercase">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        required
                        disabled={profileLoading}
                        className="border-slate-300 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                        disabled={profileLoading}
                        className="border-slate-300 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization" className="text-xs font-semibold text-slate-500 uppercase">Organization</Label>
                      <Input
                        id="organization"
                        value={profileData.organization}
                        onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                        disabled={profileLoading}
                        className="border-slate-300 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-xs font-semibold text-slate-500 uppercase">Role</Label>
                      <Input
                        id="role"
                        value={getRoleLabel(userProfile.role)}
                        disabled
                        className="bg-slate-50 border-slate-200 text-slate-500"
                      />
                      <p className="text-[10px] text-slate-400">Role changes require administrator approval.</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={profileLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md h-9 shadow-sm">
                      {profileLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="max-w-2xl">
            <Card className="rounded-md shadow-none border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-md">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Password & Security</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Manage your login credentials.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-500 uppercase">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                        disabled={passwordLoading}
                        className="border-slate-300 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-500 uppercase">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        disabled={passwordLoading}
                        className="border-slate-300 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-500 uppercase">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                        disabled={passwordLoading}
                        className="border-slate-300 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={passwordLoading} className="bg-slate-900 hover:bg-slate-800 text-white rounded-md h-9 shadow-sm">
                      {passwordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="max-w-4xl">
            <Card className="rounded-md shadow-none border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-md">
                    <Bell className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Notification Preferences</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Configure how you receive alerts.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12 text-slate-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Granular notification settings are being updated.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    finance: 'Finance Manager',
    supply_chain: 'Supply Chain Manager',
    pharmacy: 'Pharmacy Director',
    compliance: 'Compliance Officer',
    analyst: 'Data Analyst',
  };
  return roleLabels[role] || role;
}
