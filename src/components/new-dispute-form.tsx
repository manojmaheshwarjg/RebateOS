'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { v4 as uuidv4 } from 'uuid';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  const { firestore, user } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const claimsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'claims'), where('vendorId', '==', user.uid), where('status', '==', 'rejected'));
  }, [firestore, user]);

  const { data: claims, isLoading: isLoadingClaims } = useCollection<Claim>(claimsQuery);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'Cannot create dispute. Firebase not available or user not signed in.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const disputesCollection = collection(firestore, 'disputes');
      const newDispute = {
        id: uuidv4(),
        vendorId: user.uid,
        disputeDate: new Date().toISOString(),
        status: 'open',
        resolutionDetails: '',
        ...data
      };
      
      addDocumentNonBlocking(disputesCollection, newDispute);

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
                      {claim.details}
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
                Create Dispute
            </Button>
        </div>
      </form>
    </Form>
  );
}
