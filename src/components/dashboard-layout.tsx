'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Book,
  Calendar,
  ClipboardList,
  Database,
  DollarSign,
  FileBarChart,
  FileOutput,
  FileScan,
  FolderKanban,
  GanttChartSquare,
  Goal,
  Inbox,
  LayoutDashboard,
  LogOut,
  Map,
  Pill,
  Settings,
  ShieldAlert,
  Shuffle,
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
import { useAuth } from '@/firebase/provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const userProfile = useUserProfile();

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
      href: '/dashboard/file-builder',
      label: 'File Builder',
      icon: FileOutput,
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
      href: '/dashboard/heatmap',
      label: 'Opportunity Heatmap',
      icon: Map,
    },
    {
      href: '/dashboard/substitutions',
      label: 'Substitution Advisor',
      icon: Shuffle,
    },
    {
      href: '/dashboard/audits',
      label: 'Audit Binder',
      icon: FolderKanban,
    },
    {
      href: '/dashboard/reporting',
      label: 'Compliance Reports',
      icon: FileBarChart,
    },
    {
      href: '/dashboard/integrations',
      label: 'Data Integrations',
      icon: Database,
    },
    {
      href: '/dashboard/340b',
      label: '340B Program',
      icon: Pill,
    },
    {
      href: '/dashboard/reconciliation',
      label: 'Reconciliation',
      icon: DollarSign,
    },
  ];

  const aiTools = [
    {
      href: '/dashboard/ai-parser',
      label: 'AI Document Parser',
      icon: FileScan,
    },
    {
      href: '/dashboard/tier-coach',
      label: 'Tier Coach',
      icon: Goal,
    },
  ];

  return (
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

          <SidebarGroup className="mt-4">
             <SidebarGroupLabel className="flex items-center gap-2">
                <Sparkles className="size-4" />
                <span>AI Tools</span>
             </SidebarGroupLabel>
             <SidebarMenu>
                {aiTools.map((item) => (
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
          </SidebarGroup>

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
                          <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-sidebar-foreground">
                            {userProfile.name}
                          </span>
                          <span className="text-xs text-sidebar-foreground/70">
                            {getRoleLabel(userProfile.role)}
                          </span>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{userProfile.name}</p>
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
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
