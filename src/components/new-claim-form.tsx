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
  const { firestore, user } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
  }, [firestore, user]);

  const { data: contracts, isLoading: isLoadingContracts } = useCollection<Contract>(contractsQuery);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'Cannot save claim. Firebase not available or user not signed in.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const claimsCollection = collection(firestore, 'claims');
      const newClaim = {
        id: uuidv4(),
        vendorId: user.uid,
        claimDate: new Date().toISOString(),
        status: 'pending-review',
        ...data
      };
      
      addDocumentNonBlocking(claimsCollection, newClaim);

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
            render={({field}) => (
                <FormItem>
                    <FormLabel>Claim Amount</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Enter the amount" {...field} />
                    </FormControl>
                    <FormMessage/>
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
                Create Claim
            </Button>
        </div>
      </form>
    </Form>
  );
}
