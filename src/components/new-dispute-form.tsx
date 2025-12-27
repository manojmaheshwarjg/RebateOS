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
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useLocalStorage } from '@/components/local-storage-provider';

interface Claim {
  id: string;
  details: string;
}

const formSchema = z.object({
  claimId: z.string().min(1, 'Claim is required.'),
  reason: z.string().min(1, 'Reason for dispute is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewDisputeForm({ onDisputeAdded }: { onDisputeAdded?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { db, userId } = useLocalStorage();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    async function fetchClaims() {
      setIsLoadingClaims(true);
      try {
        const data = await db.claims
          .where('vendor_id')
          .equals(userId)
          .and(claim => claim.status === 'rejected')
          .toArray();
        setClaims(data.map(c => ({ id: c.id, details: c.details })));
      } catch (error) {
        console.error('Error fetching claims:', error);
      } finally {
        setIsLoadingClaims(false);
      }
    }
    fetchClaims();
  }, [db, userId]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      const newDispute = {
        id: generateId(),
        vendor_id: userId,
        claim_id: data.claimId,
        dispute_date: getCurrentTimestamp(),
        status: 'open' as const,
        resolution_details: '',
        reason: data.reason,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      await db.disputes.add(newDispute);

      toast({
        title: 'Success',
        description: 'New dispute created successfully!',
      });
      form.reset();
      onDisputeAdded?.();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the dispute. Please try again.',
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
          name="claimId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rejected Claim</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingClaims}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rejected claim to dispute" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {claims && claims.length > 0 ? claims.map(claim => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claim.details || `Claim #${claim.id.substring(0, 8)}`}
                    </SelectItem>
                  )) : <SelectItem value="none" disabled>No rejected claims found</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Dispute</FormLabel>
              <FormControl>
                <Textarea placeholder="Explain why you are disputing this claim" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !claims || claims.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating...' : 'Create Dispute'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
