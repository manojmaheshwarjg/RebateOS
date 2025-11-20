'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestSubstitutions, SuggestSubstitutionsOutput } from '@/ai/flows/suggest-substitutions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const formSchema = z.object({
  productUsageData: z.string().min(1, 'Product usage data is required.'),
  contractTerms: z.string().min(1, 'Contract terms are required.'),
  clinicalEquivalents: z.string().min(1, 'Clinical equivalents data is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubstitutionAdvisorForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestSubstitutionsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productUsageData: '{\n  "Aspirin 81mg": 10000,\n  "Lisinopril 20mg": 5000\n}',
      contractTerms: '[\n  {"product": "Aspirin 81mg", "rebate": 0.05},\n  {"product": "Ecosprin 81mg", "rebate": 0.12},\n  {"product": "Lisinopril 20mg", "rebate": 0.10},\n  {"product": "Zestril 20mg", "rebate": 0.10}\n]',
      clinicalEquivalents: '{\n  "Aspirin 81mg": ["Ecosprin 81mg"],\n  "Lisinopril 20mg": ["Zestril 20mg"]\n}',
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await suggestSubstitutions(data);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="productUsageData"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Product Usage Data (JSON)</FormLabel>
                        <FormControl>
                        <Textarea placeholder='e.g., {"productX": 1000}' {...field} rows={8}/>
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
                        <Textarea placeholder='e.g., [{"product": "productX", "rebate": 0.10}]' {...field} rows={8}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="clinicalEquivalents"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Clinical Equivalents (JSON)</FormLabel>
                        <FormControl>
                        <Textarea placeholder='e.g., {"productX": ["productY"]}' {...field} rows={8}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Substitution Advice
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="flex items-center justify-center p-10">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <p>Analyzing data for substitution opportunities...</p>
        </div>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Substitution Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {result.suggestions.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Current Product</TableHead>
                            <TableHead>Suggested Substitute</TableHead>
                            <TableHead>Reasoning</TableHead>
                            <TableHead>Estimated Savings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {result.suggestions.map((suggestion, index) => (
                            <TableRow key={index}>
                                <TableCell>{suggestion.originalProduct}</TableCell>
                                <TableCell className="font-medium">{suggestion.suggestedSubstitute}</TableCell>
                                <TableCell>{suggestion.reasoning}</TableCell>
                                <TableCell className="text-green-600 font-semibold">{suggestion.estimatedSavings}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No Suggestions Available</h3>
                    <p className="text-muted-foreground mt-2">
                        Based on the data provided, no substitution opportunities were found.
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
