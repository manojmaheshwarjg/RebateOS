'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowUpRight, DollarSign, FileText, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/components/local-storage-provider';

export default function DashboardPage() {
  const router = useRouter();
  const { db } = useLocalStorage();

  // In a real app, we'd fetch aggregate stats here.
  // Using static placeholders for the V3 Design demo to show layout structure.

  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Executive Overview</h1>
            <p className="text-sm text-slate-500">High-level insights across all contracts.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Last updated: Just now</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* KPI ROW */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="rounded-md shadow-none border border-slate-200 bg-white">
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex justify-between">Total Spend <DollarSign className="h-4 w-4 text-slate-400" /></CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-slate-900">$2.4M</div>
              <div className="text-xs text-emerald-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-0.5" /> 12% vs last month</div>
            </CardContent>
          </Card>
          <Card className="rounded-md shadow-none border border-slate-200 bg-white">
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex justify-between">Rebates Captured <TrendingUp className="h-4 w-4 text-slate-400" /></CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-emerald-700">$142k</div>
              <div className="text-xs text-slate-500 mt-1">5.9% Effective Rate</div>
            </CardContent>
          </Card>
          <Card className="rounded-md shadow-none border border-slate-200 bg-white">
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex justify-between">Active Contracts <FileText className="h-4 w-4 text-slate-400" /></CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-slate-900">18</div>
              <div className="text-xs text-slate-500 mt-1">3 Expiring Soon</div>
            </CardContent>
          </Card>
          <Card className="rounded-md shadow-none border border-slate-200 bg-white">
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider flex justify-between">Vendors <Users className="h-4 w-4 text-slate-400" /></CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-slate-900">7</div>
              <div className="text-xs text-slate-500 mt-1">Across 4 Categories</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* ACTIVITY FEED */}
          <div className="col-span-8 space-y-6">
            <Card className="rounded-md shadow-none border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3">
                <CardTitle className="text-sm font-bold text-slate-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Contract #4092 analyzed for optimization</p>
                      <p className="text-xs text-slate-500">2 hours ago • AI Agent</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500">View</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* QUICK ACTIONS */}
          <div className="col-span-4 space-y-6">
            <Card className="rounded-md shadow-none border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3">
                <CardTitle className="text-sm font-bold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start border-slate-200 bg-white hover:bg-slate-50 text-slate-700" onClick={() => router.push('/dashboard/contracts')}>
                  <FileText className="h-4 w-4 mr-2 text-slate-400" />
                  View All Contracts
                </Button>
                <Button variant="outline" className="w-full justify-start border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
                  <DollarSign className="h-4 w-4 mr-2 text-slate-400" />
                  Upload Purchase Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
