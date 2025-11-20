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
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, setDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { v4 as uuidv4 } from 'uuid';

interface Contract {
  id: string;
  name: string;
}

interface RebateRule {
    id: string;
    contractId: string;
    ruleType: string;
    ruleDescription: string;
    eligibilityCriteria: string;
}

const formSchema = z.object({
  contractId: z.string().min(1, 'Contract is required.'),
  ruleType: z.string().min(1, 'Rule type is required.'),
  ruleDescription: z.string().min(1, 'Rule description is required.'),
  eligibilityCriteria: z.string().min(1, 'Eligibility criteria are required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function RuleBuilderForm({ onRuleAdded, existingRule }: { onRuleAdded?: () => void; existingRule?: RebateRule | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (existingRule) {
      form.reset(existingRule);
    } else {
        form.reset({
            contractId: '',
            ruleType: '',
            ruleDescription: '',
            eligibilityCriteria: '',
        });
    }
  }, [existingRule, form]);

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
  }, [firestore, user]);

  const { data: contracts, isLoading: isLoadingContracts } = useCollection<Contract>(contractsQuery);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!firestore || !user) {
      toast({
        title: 'Error',
        description: 'Cannot save rule. Firebase not available or user not signed in.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
        if (existingRule) {
            // Update existing rule
            const ruleRef = doc(firestore, 'rebate_rules', existingRule.id);
            await setDoc(ruleRef, data, { merge: true });
             toast({
                title: 'Success',
                description: 'Rebate rule updated successfully!',
             });
        } else {
            // Create new rule
            const rulesCollection = collection(firestore, 'rebate_rules');
            const newRule = {
                id: uuidv4(),
                ...data
            };
            
            await addDoc(rulesCollection, newRule)
                .catch(async (serverError) => {
                    const { FirestorePermissionError } = await import('@/firebase/errors');
                    const { errorEmitter } = await import('@/firebase/error-emitter');
                    const permissionError = new FirestorePermissionError({
                        path: rulesCollection.path,
                        operation: 'create',
                        requestResourceData: newRule,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
            toast({
                title: 'Success',
                description: 'New rebate rule created successfully!',
            });
        }

      form.reset();
      onRuleAdded?.();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save the rule. Please try again.',
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
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingContracts}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contract to apply the rule to" />
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
          name="ruleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rule type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="tier">Tier Rule</SelectItem>
                  <SelectItem value="bundle">Bundle Rule</SelectItem>
                  <SelectItem value="eligibility">Eligibility Rule</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ruleDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter a detailed description of the rule" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="eligibilityCriteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eligibility Criteria</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the criteria for this rule to be met" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
