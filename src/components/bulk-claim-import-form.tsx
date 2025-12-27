'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Input } from './ui/input';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const formSchema = z.object({
  claimsFile: z.any().refine((files) => files?.length === 1, 'CSV file is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkClaimImportForm({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { db, userId } = useLocalStorage();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const processCsv = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        const headers = lines.shift()?.trim().split(',') || [];

        if (headers[0] !== 'contractId' || headers[1] !== 'claimAmount' || headers[2] !== 'details') {
          return reject(new Error('Invalid CSV headers. Must be: contractId,claimAmount,details'));
        }

        const claims = lines.map(line => {
          const values = line.split(',');
          return {
            contractId: values[0]?.trim(),
            claimAmount: parseFloat(values[1]?.trim()),
            details: values[2]?.trim(),
          };
        });
        resolve(claims);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      const file = data.claimsFile[0];
      const claimsData = await processCsv(file);

      const claimsToInsert = claimsData.map(claimData => {
        if (!claimData.contractId || isNaN(claimData.claimAmount) || !claimData.details) {
          console.warn('Skipping invalid claim record:', claimData);
          return null;
        }

        return {
          id: generateId(),
          vendor_id: userId,
          contract_id: claimData.contractId,
          claim_date: getCurrentTimestamp(),
          status: 'pending-review' as const,
          amount: claimData.claimAmount,
          details: claimData.details,
          created_at: getCurrentTimestamp(),
          updated_at: getCurrentTimestamp(),
        };
      }).filter(c => c !== null);

      if (claimsToInsert.length > 0) {
        await db.claims.bulkAdd(claimsToInsert as any);
      }

      toast({
        title: 'Success',
        description: `Successfully imported ${claimsToInsert.length} claims.`,
      });
      form.reset();
      onImportComplete?.();
    } catch (error: any) {
      console.error('Error importing claims:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to import claims. Please check the file and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Alert className="mb-4">
        <AlertTitle>CSV Format</AlertTitle>
        <AlertDescription>
          Ensure your CSV file has the headers: `contractId`, `claimAmount`, `details`.
        </AlertDescription>
      </Alert>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="claimsFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Claims CSV File</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Claims
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
