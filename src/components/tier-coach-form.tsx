'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestTierOptimizations, SuggestTierOptimizationsOutput } from '@/ai/flows/suggest-tier-optimizations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const formSchema = z.object({
  historicalSalesData: z.string().min(1, 'Historical sales data is required.'),
  marketTrends: z.string().min(1, 'Market trends data is required.'),
  contractTerms: z.string().min(1, 'Contract terms are required.'),
  currentTiers: z.string().min(1, 'Current tiers are required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function TierCoachForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestTierOptimizationsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalSalesData: '{"productA": 1200, "productB": 3400}',
      marketTrends: '{"productA": "stable", "productB": "growing"}',
      contractTerms: '{"minVolume": 1000, "rebatePercentage": 0.05}',
      currentTiers: '[{"tier": 1, "volume": 1000, "rebate": 0.05}, {"tier": 2, "volume": 5000, "rebate": 0.07}]',
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await suggestTierOptimizations(data);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to get suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="historicalSalesData"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Historical Sales Data (JSON)</FormLabel>
                        <FormControl>
                        <Textarea placeholder='e.g., {"productA": 1200, "productB": 3400}' {...field} rows={5}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="marketTrends"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Market Trends (JSON)</FormLabel>
                        <FormControl>
                        <Textarea placeholder='e.g., {"productA": "stable", "productB": "growing"}' {...field} rows={5}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="contractTerms"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contract Terms (JSON)</FormLabel>
                        <FormControl>
                        <Textarea placeholder='e.g., {"minVolume": 1000, "rebatePercentage": 0.05}' {...field} rows={5}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="currentTiers"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Current Tiers (JSON)</FormLabel>
                        <FormControl>
                        <Textarea placeholder='e.g., [{"tier": 1, "volume": 1000, "rebate": 0.05}]' {...field} rows={5}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Suggestions
          </Button>
        </form>
      </Form>
      
      {isLoading && (
        <div className="flex items-center justify-center p-10">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <p>Analyzing your data to coach your tiers...</p>
        </div>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Optimized Tiers</h3>
              <pre className="mt-2 w-full rounded-md bg-secondary p-4">
                <code className="text-secondary-foreground">
                    {JSON.stringify(JSON.parse(result.optimizedTiers), null, 2)}
                </code>
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">Explanation</h3>
              <p className="text-muted-foreground mt-2">{result.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
