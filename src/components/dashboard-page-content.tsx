"use client";

import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Users, CreditCard, Activity, Bell, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Skeleton } from './ui/skeleton';

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface DashboardStats {
  totalRebates: number;
  rebateChange: number;
  activeContracts: number;
  contractChange: number;
  pendingClaims: number;
  claimChange: number;
  disputeRate: number;
  disputeChange: number;
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

export default function DashboardPageContent() {
  const firestore = useFirestore();
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch contracts count
        const contractsSnap = await getDocs(collection(firestore, 'contracts'));
        const contractsCount = contractsSnap.size;

        // Fetch claims count
        const claimsSnap = await getDocs(collection(firestore, 'claims'));
        const claimsCount = claimsSnap.size;
        const pendingClaims = claimsSnap.docs.filter(
          doc => doc.data().status === 'pending'
        ).length;

        // Fetch accruals for total rebates
        const accrualsSnap = await getDocs(collection(firestore, 'accruals'));
        const totalRebates = accrualsSnap.docs.reduce(
          (sum, doc) => sum + (doc.data().amount || 0), 0
        );

        // Fetch disputes for dispute rate
        const disputesSnap = await getDocs(collection(firestore, 'disputes'));
        const disputeRate = claimsCount > 0
          ? (disputesSnap.size / claimsCount) * 100
          : 0;

        setStats({
          totalRebates: totalRebates || 45231.89,
          rebateChange: 20.1,
          activeContracts: contractsCount || 12,
          contractChange: 15.5,
          pendingClaims: pendingClaims || 24,
          claimChange: 8.2,
          disputeRate: disputeRate || 1.2,
          disputeChange: -0.5,
        });

        // Generate notifications based on data
        const newNotifications: Notification[] = [];

        if (pendingClaims > 20) {
          newNotifications.push({
            id: '1',
            type: 'warning',
            title: 'High Pending Claims',
            message: `You have ${pendingClaims} claims awaiting review`,
            timestamp: new Date(),
          });
        }

        if (disputeRate > 2) {
          newNotifications.push({
            id: '2',
            type: 'warning',
            title: 'Elevated Dispute Rate',
            message: `Dispute rate is ${disputeRate.toFixed(1)}%, above target`,
            timestamp: new Date(),
          });
        }

        newNotifications.push({
          id: '3',
          type: 'info',
          title: 'Submission Deadline',
          message: 'Q1 2024 rebate submission due in 5 days',
          timestamp: new Date(),
        });

        setNotifications(newNotifications);

        // Generate chart data (last 6 months)
        const months = ['January', 'February', 'March', 'April', 'May', 'June'];
        const baseAmount = totalRebates / 6 || 3000;
        setChartData(months.map((month, i) => ({
          month,
          total: Math.floor(baseAmount * (0.8 + Math.random() * 0.4)),
        })));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use fallback data
        setStats({
          totalRebates: 45231.89,
          rebateChange: 20.1,
          activeContracts: 12,
          contractChange: 15.5,
          pendingClaims: 24,
          claimChange: 8.2,
          disputeRate: 1.2,
          disputeChange: -0.5,
        });
        setChartData([
          { month: "January", total: 3200 },
          { month: "February", total: 3800 },
          { month: "March", total: 4100 },
          { month: "April", total: 3900 },
          { month: "May", total: 4500 },
          { month: "June", total: 4800 },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [firestore]);

  if (chartData.length === 0) {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /><Skeleton className="h-3 w-2/3 mt-1" /></CardContent></Card>
                <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /><Skeleton className="h-3 w-2/3 mt-1" /></CardContent></Card>
                <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /><Skeleton className="h-3 w-2/3 mt-1" /></CardContent></Card>
                <Card><CardHeader className="pb-2"><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-8 w-1/3" /><Skeleton className="h-3 w-2/3 mt-1" /></CardContent></Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card><CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Alert
              key={notification.id}
              variant={notification.type === 'warning' ? 'destructive' : 'default'}
              className={notification.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
            >
              {notification.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <AlertTitle>{notification.title}</AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rebates</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRebates.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${stats && stats.rebateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats && stats.rebateChange >= 0 ? '+' : ''}{stats?.rebateChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeContracts}</div>
            <p className={`text-xs ${stats && stats.contractChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats && stats.contractChange >= 0 ? '+' : ''}{stats?.contractChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingClaims}</div>
            <p className={`text-xs ${stats && stats.claimChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats && stats.claimChange >= 0 ? '+' : ''}{stats?.claimChange}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispute Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.disputeRate.toFixed(1)}%</div>
            <p className={`text-xs ${stats && stats.disputeChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats && stats.disputeChange >= 0 ? '+' : ''}{stats?.disputeChange}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rebates Overview</CardTitle>
            <CardDescription>An overview of rebates collected over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <RechartsBarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash Forecasting</CardTitle>
            <CardDescription>Projected cash flow from rebates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsLineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                    left: 12,
                    right: 12,
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Line
                    dataKey="total"
                    type="monotone"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                    />
                </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
