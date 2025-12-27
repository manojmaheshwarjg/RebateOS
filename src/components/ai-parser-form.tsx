'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { extractContractDetails } from '@/ai/flows/extract-contract-details';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';
import { useLocalStorage } from '@/components/local-storage-provider';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from './ui/progress';

const formSchema = z.object({
  contractFiles: z.any().refine((files) => files?.length > 0, 'At least one contract file is required.'),
});

type FormValues = z.infer<typeof formSchema>;

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function AIParserForm({ onContractAdded }: { onContractAdded?: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { db, userId } = useLocalStorage();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const processAndSaveFile = async (file: File) => {
    // 1. Parse with AI
    const contractDataUri = await fileToDataURL(file);
    const result = await extractContractDetails({ contractDataUri });

    // 2. Upload file to IndexedDB blob storage
    const fileId = generateId();
    await db.file_blobs.add({
      id: fileId,
      blob: file,
      created_at: getCurrentTimestamp(),
    });

    const fileUrl = URL.createObjectURL(file);

    // 3. Save structured details to IndexedDB
    const contractId = generateId();
    await db.contracts.add({
      id: contractId,
      vendor_id: userId,
      name: result.vendorName || file.name.replace(/\.[^/.]+$/, ""),
      contract_number: result.contractNumber || undefined,
      contract_type: result.contractType,
      start_date: result.startDate,
      end_date: result.endDate,
      status: result.confidence.overall >= 70 ? 'active' : 'pending-review',
      description: `${result.contractType} Contract with ${result.vendorName || 'Unknown Vendor'}`,
      contract_file_url: fileUrl,
      rebate_tiers: result.rebateTiers,
      products: result.products,
      vendor_contact: result.vendorContact,
      payment_terms: result.paymentTerms,
      renewal_terms: result.renewalTerms || undefined,
      special_conditions: result.specialConditions || undefined,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    });

    // 4. Save file metadata
    await db.contract_files.add({
      id: generateId(),
      contract_id: contractId,
      file_path: fileId,
      file_name: file.name,
      file_size: file.size,
      // mime_type removed as it's not in schema
      file_url: fileUrl,
      uploaded_by: userId,
      created_at: getCurrentTimestamp(),
    });

    return { id: contractId, name: result.vendorName || file.name };
  };


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const files: FileList = data.contractFiles;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setTotalCount(files.length);
    setProcessedCount(0);
    setProgress(0);

    let successfulUploads = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await processAndSaveFile(file);
        successfulUploads++;
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        toast({
          title: `Error processing ${file.name}`,
          description: 'Could not parse or save this contract. Please try it individually.',
          variant: 'destructive'
        })
      } finally {
        const newProcessedCount = i + 1;
        setProcessedCount(newProcessedCount);
        setProgress((newProcessedCount / files.length) * 100);
      }
    }

    setIsProcessing(false);

    toast({
      title: 'Bulk Import Complete',
      description: `${successfulUploads} of ${files.length} contracts were successfully imported.`,
    });

    form.reset();
    onContractAdded?.();
  };

  return (
    <div className="space-y-6">
      {isProcessing ? (
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="font-semibold">Processing contracts...</p>
          <p className="text-sm text-muted-foreground">{`Processed ${processedCount} of ${totalCount}`}</p>
          <Progress value={progress} className="w-full" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contractFiles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Documents</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Parse Contracts
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
