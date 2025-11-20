'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import DashboardLayout from '@/components/dashboard-layout';
import { UserProfileProvider, UserProfile } from '@/components/auth-guard';
import { Loader2 } from 'lucide-react';

export default function Layout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const { user, isUserLoading, firestore } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (isUserLoading) return;

      // Not logged in or anonymous user - redirect to login
      if (!user || user.isAnonymous) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));

        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile for users without Firestore doc
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || 'User',
            role: 'analyst',
            organization: '',
            permissions: ['contracts:read', 'claims:read', 'disputes:read', 'rules:read', 'reports:read'],
            status: 'active',
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
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

    loadProfile();
  }, [user, isUserLoading, firestore, router]);

  if (isUserLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <UserProfileProvider profile={userProfile}>
      <DashboardLayout>{children}</DashboardLayout>
    </UserProfileProvider>
  );
}
