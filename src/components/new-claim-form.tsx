'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '@/components/local-storage-provider';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { Input } from './ui/input';

interface Contract {
  id: string;
  name: string;
}

const formSchema = z.object({
  contractId: z.string().min(1, 'Contract is required.'),
  claimAmount: z.coerce.number().positive('Amount must be positive.'),
  details: z.string().min(1, 'Claim details are required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewClaimForm({ onClaimAdded }: { onClaimAdded?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { db, userId } = useLocalStorage();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    async function fetchContracts() {
      setIsLoadingContracts(true);
      try {
        const data = await db.contracts
          .where('vendor_id')
          .equals(userId)
          .toArray();
        setContracts(data.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
      setIsLoadingContracts(false);
    }
    fetchContracts();
  }, [db, userId]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      await db.claims.add({
        id: generateId(),
        vendor_id: userId,
        contract_id: data.contractId,
        claim_date: getCurrentTimestamp(),
        amount: data.claimAmount,
        status: 'pending-review',
        details: data.details,
        created_at: getCurrentTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'New claim created successfully!',
      });
      form.reset();
      onClaimAdded?.();
    } catch (error) {
      console.error('Error creating claim:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contractId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingContracts}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contract for the claim" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contracts?.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="claimAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter the amount" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Claim Details</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter details about the claim" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating...' : 'Create Claim'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
