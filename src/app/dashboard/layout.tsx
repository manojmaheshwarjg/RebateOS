'use client';

import DashboardLayout from '@/components/dashboard-layout';
import { UserProfileProvider, UserProfile } from '@/components/auth-guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  // Create a default mock user profile (authentication disabled)
  const mockUserProfile: UserProfile = {
    id: 'mock-user-id',
    email: 'user@example.com',
    full_name: 'Demo User',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <UserProfileProvider profile={mockUserProfile}>
      <DashboardLayout>{children}</DashboardLayout>
    </UserProfileProvider>
  );
}
