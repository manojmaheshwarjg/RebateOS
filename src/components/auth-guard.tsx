'use client';

import { createContext, useContext } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  created_at: string;
  updated_at: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles = [] }: AuthGuardProps) {
  // Authentication disabled - create a mock user profile
  const mockUserProfile: UserProfile = {
    id: 'mock-user-id',
    email: 'user@example.com',
    full_name: 'Demo User',
    role: 'admin', // Admin role allows access to all features
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <UserProfileProvider profile={mockUserProfile}>
      {children}
    </UserProfileProvider>
  );
}

const UserProfileContext = createContext<UserProfile | null>(null);

export function UserProfileProvider({
  children,
  profile
}: {
  children: React.ReactNode;
  profile: UserProfile;
}) {
  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

export function useHasRole(roles: string | string[]): boolean {
  const profile = useUserProfile();
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(profile.role);
}

