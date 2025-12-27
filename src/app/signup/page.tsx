'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate signup
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
          <p className="text-slate-500">Start optimizing your rebate compliance today</p>
        </div>

        {/* Signup Card */}
        <Card className="rounded-lg border-slate-200 shadow-sm bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">Create your workspace</CardTitle>
            <CardDescription className="text-center">Start your 14-day free trial. No credit card required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fname" className="text-sm font-semibold text-slate-700">First Name</Label>
                  <Input id="fname" placeholder="Jane" required className="border-slate-300 focus-visible:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname" className="text-sm font-semibold text-slate-700">Last Name</Label>
                  <Input id="lname" placeholder="Doe" required className="border-slate-300 focus-visible:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Work Email</Label>
                <Input id="email" type="email" placeholder="name@hospital.org" required className="border-slate-300 focus-visible:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-semibold text-slate-700">Organization Name</Label>
                <Input id="company" placeholder="Acme Healthcare" required className="border-slate-300 focus-visible:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <Input id="password" type="password" required className="border-slate-300 focus-visible:ring-indigo-500" />
                <p className="text-[10px] text-slate-500">Must be at least 8 characters with 1 special character.</p>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 shadow-sm mt-2" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workspace <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-0 pb-6 justify-center border-t border-slate-100 mt-4 pt-4">
            <div className="text-sm text-slate-500">
              Already have an account? <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium font-semibold">Sign In</a>
            </div>
          </CardFooter>
        </Card>

        {/* Trust Signals */}
        <div className="text-center">
          <p className="text-xs text-slate-400">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
