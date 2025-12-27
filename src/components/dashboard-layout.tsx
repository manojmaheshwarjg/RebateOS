'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Book,
  Calendar,
  ClipboardList,
  FolderKanban,
  GanttChartSquare,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import Header from '@/components/header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserProfile } from '@/components/auth-guard';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useLocalStorage } from '@/components/local-storage-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { GlobalDragDropProvider } from './global-drag-drop-context';
import { GlobalDragOverlay } from './global-drag-overlay';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { db } = useLocalStorage();
  const userProfile = useUserProfile();

  const handleLogout = async () => {
    try {
      // In local storage mode, just redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      finance: 'Finance Manager',
      supply_chain: 'Supply Chain',
      pharmacy: 'Pharmacy Director',
      compliance: 'Compliance Officer',
      analyst: 'Data Analyst',
      vendor: 'Vendor',
    };
    return roleLabels[role] || role;
  };

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/contracts',
      label: 'Contract Inbox',
      icon: Inbox,
    },
    {
      href: '/dashboard/rules',
      label: 'Rule Builder',
      icon: GanttChartSquare,
    },
    {
      href: '/dashboard/eligibility',
      label: 'Eligibility Queue',
      icon: ClipboardList,
    },
    {
      href: '/dashboard/calendar',
      label: 'Submission Calendar',
      icon: Calendar,
    },
    {
      href: '/dashboard/ledger',
      label: 'Accruals Ledger',
      icon: Book,
    },
    {
      href: '/dashboard/disputes',
      label: 'Dispute Management',
      icon: ShieldAlert,
    },
    {
      href: '/dashboard/audits',
      label: 'Audit Binder',
      icon: FolderKanban,
    },
  ];

  return (
    <GlobalDragDropProvider>
      <GlobalDragOverlay />
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">RebateOS</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={{ children: item.label }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>



          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              {userProfile.role === 'admin' && (
                <SidebarMenuItem>
                  <Link href="/dashboard/users">
                    <SidebarMenuButton
                      isActive={pathname === '/dashboard/users'}
                      tooltip={{ children: 'User Management' }}
                    >
                      <Users />
                      <span>User Management</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <Link href="/dashboard/settings">
                  <SidebarMenuButton
                    isActive={pathname === '/dashboard/settings'}
                    tooltip={{ children: 'Settings' }}
                  >
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(userProfile.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium text-sidebar-foreground">
                          {userProfile.full_name}
                        </span>
                        <span className="text-xs text-sidebar-foreground/70">
                          {getRoleLabel(userProfile.role)}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{userProfile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </GlobalDragDropProvider>
  );
}
