'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  permissions: string[];
  status: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  allowedRoles?: string[];
}

export function AuthGuard({ children, requiredPermissions = [], allowedRoles = [] }: AuthGuardProps) {
  const router = useRouter();
  const { user, isUserLoading, firestore } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // Still loading auth state
      if (isUserLoading) return;

      // Not logged in or anonymous user
      if (!user || user.isAnonymous) {
        router.push('/login');
        return;
      }

      // Fetch user profile from Firestore
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));

        if (!userDoc.exists()) {
          // User exists in Auth but not in Firestore - might be legacy user
          // Create a basic profile
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || 'User',
            role: 'analyst', // Default role
            organization: '',
            permissions: ['contracts:read', 'claims:read', 'disputes:read', 'rules:read', 'reports:read'],
            status: 'active',
          });
        } else {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Allow access with minimal permissions if profile fetch fails
        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'User',
          role: 'analyst',
          organization: '',
          permissions: [],
          status: 'active',
        });
      } finally {
        setProfileLoading(false);
      }
    }

    checkAuth();
  }, [user, isUserLoading, firestore, router]);

  // Check permissions after profile is loaded
  useEffect(() => {
    if (!userProfile || profileLoading) return;

    // Check if user account is active
    if (userProfile.status !== 'active') {
      router.push('/login?error=account_disabled');
      return;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
      setHasAccess(false);
      return;
    }

    // Check permission-based access
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(
        permission => userProfile.permissions.includes(permission)
      );
      if (!hasAllPermissions) {
        setHasAccess(false);
        return;
      }
    }

    setHasAccess(true);
  }, [userProfile, profileLoading, allowedRoles, requiredPermissions, router]);

  // Show loading state
  if (isUserLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied if user doesn't have required permissions
  if (!hasAccess && userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Context for sharing user profile across the app
import { createContext, useContext } from 'react';

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

// Hook to check if current user has a specific permission
export function useHasPermission(permission: string): boolean {
  const profile = useUserProfile();
  return profile.permissions.includes(permission);
}

// Hook to check if current user has a specific role
export function useHasRole(roles: string | string[]): boolean {
  const profile = useUserProfile();
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(profile.role);
}
