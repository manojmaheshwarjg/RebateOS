'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body text-slate-900">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-600 text-white mb-4 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">RebateOS</h1>
          <p className="text-slate-500">Enterprise Contract Compliance Platform</p>
        </div>

        {/* Login Card */}
        <Card className="rounded-lg border-slate-200 shadow-sm bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center">Enter your email to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                <Input id="email" type="email" placeholder="name@company.com" required className="border-slate-300 focus-visible:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                  <a href="#" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Forgot password?</a>
                </div>
                <Input id="password" type="password" required className="border-slate-300 focus-visible:ring-indigo-500" />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 shadow-sm" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-0 pb-6 justify-center border-t border-slate-100 mt-4 pt-4">
            <div className="text-sm text-slate-500">
              Don't have an account? <a href="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium font-semibold">Contact Sales</a>
            </div>
          </CardFooter>
        </Card>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> SOC2 Compliant</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> 256-bit Encryption</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> HIPAA Ready</div>
        </div>
      </div>
    </div>
  );
}
