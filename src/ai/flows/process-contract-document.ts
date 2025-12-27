'use server';

/**
 * @fileOverview Main orchestrator for processing contract documents
 * 
 * This coordinates the entire AI processing pipeline:
 * 1. Classify document type
 * 2. Extract type-specific data
 * 3. Save to database with field-level tracking
 * 4. Detect conflicts across documents
 */

import { createClient } from '@/lib/supabase/server';
import { classifyDocument } from './classify-document';
import { extractFinancialFields } from './extract-financial-fields';
import { extractProductList } from './extract-product-list';

export interface ProcessDocumentInput {
  fileId: string;
  contractId: string;
  documentDataUri: string;
  fileName: string;
}

export interface ProcessDocumentResult {
  success: boolean;
  fileId: string;
  documentType: string;
  fieldsExtracted: number;
  confidence: number;
  error?: string;
}

export async function processContractDocument(
  input: ProcessDocumentInput
): Promise<ProcessDocumentResult> {
  const supabase = await createClient();

  const startTime = Date.now();
  console.log(`[AI-${input.fileName}] Starting processing...`);

  try {
    // Update file status to processing
    console.log(`[AI-${input.fileName}] Updating file status to processing...`);
    const { error: updateError } = await supabase
      .from('contract_files')
      .update({
        parsing_status: 'processing',
        parsing_started_at: new Date().toISOString(),
      })
      .eq('id', input.fileId);

    if (updateError) {
      console.error(`[AI-${input.fileName}] Failed to update file status:`, updateError);
      throw new Error(`Failed to update file status: ${updateError.message}`);
    }

    // Step 1: Classify document
    console.log(`[AI-${input.fileName}] Classifying document...`);
    const classification = await classifyDocument({
      documentDataUri: input.documentDataUri,
      fileName: input.fileName,
    });

    console.log(`[AI-${input.fileName}] Classified as: ${classification.documentType} (confidence: ${classification.confidence})`);

    // Update file with classification
    const { error: classError } = await supabase
      .from('contract_files')
      .update({
        document_type: classification.documentType,
        document_subtype: classification.documentSubtype,
      })
      .eq('id', input.fileId);

    if (classError) {
      console.error(`[AI-${input.fileName}] Failed to save classification:`, classError);
    }

    // Step 2: Extract data based on document type
    let extractedFields: any[] = [];
    let overallConfidence = classification.confidence;

    console.log(`[AI-${input.fileName}] Document type: ${classification.documentType}, starting extraction...`);

    if (classification.documentType === 'rebate_schedule' || classification.documentType === 'msa') {
      // Extract financial fields
      console.log(`[AI-${input.fileName}] Extracting financial fields...`);
      try {
        const financialData = await extractFinancialFields({
          documentDataUri: input.documentDataUri,
          documentType: classification.documentType,
        });
        console.log(`[AI-${input.fileName}] Financial extraction complete:`, {
          rebateTiers: financialData.rebateTiers.length,
          hasPaymentTerms: !!financialData.paymentTerms,
          exclusions: financialData.exclusions.length,
          confidence: financialData.overallConfidence
        });

        overallConfidence = (classification.confidence + financialData.overallConfidence) / 2;

        // Save rebate tiers
        console.log(`[AI-${input.fileName}] Processing ${financialData.rebateTiers.length} rebate tiers...`);
        for (const tier of financialData.rebateTiers) {
        extractedFields.push({
          contract_id: input.contractId,
          source_file_id: input.fileId,
          field_category: 'financial',
          field_name: `rebate_tier_${tier.tierName.toLowerCase().replace(/\s+/g, '_')}`,
          field_label: `Rebate Tier: ${tier.tierName}`,
          value_json: tier,
          value_numeric: tier.rebatePercentage || tier.rebateAmount,
          source_quote: tier.sourceQuote,
          source_page: tier.sourcePage,
          confidence_score: overallConfidence,
          extraction_method: 'ai',
          ai_model: 'googleai/gemini-2.0-flash-exp',
          priority: 1, // High priority for financial data
        });
      }

      // Save payment terms
      if (financialData.paymentTerms) {
        extractedFields.push({
          contract_id: input.contractId,
          source_file_id: input.fileId,
          field_category: 'financial',
          field_name: 'payment_terms',
          field_label: 'Payment Terms',
          value_json: financialData.paymentTerms,
          value_text: JSON.stringify(financialData.paymentTerms),
          source_quote: financialData.paymentTerms.sourceQuote,
          confidence_score: overallConfidence,
          extraction_method: 'ai',
          ai_model: 'googleai/gemini-2.0-flash-exp',
          priority: 1,
        });
      }

      // Save dates
      if (financialData.effectiveDate) {
        extractedFields.push({
          contract_id: input.contractId,
          source_file_id: input.fileId,
          field_category: 'dates',
          field_name: 'effective_date',
          field_label: 'Effective Date',
          value_text: financialData.effectiveDate,
          value_date: financialData.effectiveDate,
          confidence_score: overallConfidence,
          extraction_method: 'ai',
          ai_model: 'googleai/gemini-2.0-flash-exp',
          priority: 2,
        });
      }

      if (financialData.expirationDate) {
        extractedFields.push({
          contract_id: input.contractId,
          source_file_id: input.fileId,
          field_category: 'dates',
          field_name: 'expiration_date',
          field_label: 'Expiration Date',
          value_text: financialData.expirationDate,
          value_date: financialData.expirationDate,
          confidence_score: overallConfidence,
          extraction_method: 'ai',
          ai_model: 'googleai/gemini-2.0-flash-exp',
          priority: 2,
        });
      }

      // Save exclusions
      for (const exclusion of financialData.exclusions) {
        extractedFields.push({
          contract_id: input.contractId,
          source_file_id: input.fileId,
          field_category: 'compliance',
          field_name: `exclusion_${exclusion.exclusionType.toLowerCase().replace(/\s+/g, '_')}`,
          field_label: `Exclusion: ${exclusion.exclusionType}`,
          value_json: exclusion,
          value_text: exclusion.description,
          source_quote: exclusion.sourceQuote,
          confidence_score: overallConfidence,
          extraction_method: 'ai',
          ai_model: 'googleai/gemini-2.0-flash-exp',
          priority: 1,
        });
        }
        console.log(`[AI-${input.fileName}] Added ${financialData.rebateTiers.length} rebate tier fields`);
      } catch (error: any) {
        console.error(`[AI-${input.fileName}] Error extracting financial fields:`, error);
        throw new Error(`Financial extraction failed: ${error.message}`);
      }
    }

    if (classification.documentType === 'product_list') {
      // Extract product list
      console.log(`[${input.fileName}] Extracting product list...`);
      const productData = await extractProductList({
        documentDataUri: input.documentDataUri,
      });

      overallConfidence = (classification.confidence + productData.overallConfidence) / 2;

      // Save products
      extractedFields.push({
        contract_id: input.contractId,
        source_file_id: input.fileId,
        field_category: 'product',
        field_name: 'product_list',
        field_label: 'Product List',
        value_json: productData.products,
        value_numeric: productData.totalProducts,
        confidence_score: overallConfidence,
        extraction_method: 'ai',
        ai_model: 'gemini-2.0-flash',
        priority: 2,
      });
    }

    // Step 3: Save all extracted fields to database
    console.log(`[AI-${input.fileName}] Total fields extracted: ${extractedFields.length}`);
    if (extractedFields.length > 0) {
      console.log(`[AI-${input.fileName}] Saving ${extractedFields.length} fields to database...`);
      console.log(`[AI-${input.fileName}] Sample field:`, JSON.stringify(extractedFields[0], null, 2));
      
      const { data: insertedData, error: fieldsError } = await supabase
        .from('extracted_fields')
        .insert(extractedFields)
        .select();

      if (fieldsError) {
        console.error(`[AI-${input.fileName}] Error saving extracted fields:`, fieldsError);
        console.error(`[AI-${input.fileName}] Failed field sample:`, JSON.stringify(extractedFields[0], null, 2));
        throw fieldsError;
      }
      
      console.log(`[AI-${input.fileName}] Successfully saved ${insertedData?.length || 0} fields to database`);
    } else {
      console.warn(`[AI-${input.fileName}] No fields were extracted! Document type was: ${classification.documentType}`);
    }

    // Step 4: Update file status to completed
    const parsingDuration = Date.now() - new Date(input.fileName).getTime();
    await supabase
      .from('contract_files')
      .update({
        parsing_status: 'completed',
        parsing_completed_at: new Date().toISOString(),
        parsing_duration_ms: parsingDuration,
        extraction_confidence: overallConfidence,
        extracted_data: {
          classification,
          fieldsCount: extractedFields.length,
        },
      })
      .eq('id', input.fileId);

    // Step 5: Log to audit trail
    await supabase.from('parsing_audit_log').insert({
      contract_id: input.contractId,
      file_id: input.fileId,
      event_type: 'parse_complete',
      event_category: 'document',
      event_data: {
        document_type: classification.documentType,
        fields_extracted: extractedFields.length,
        confidence: overallConfidence,
      },
    });

    console.log(`[${input.fileName}] Processing complete! Extracted ${extractedFields.length} fields.`);

    return {
      success: true,
      fileId: input.fileId,
      documentType: classification.documentType,
      fieldsExtracted: extractedFields.length,
      confidence: overallConfidence,
    };

  } catch (error: any) {
    console.error(`[${input.fileName}] Processing failed:`, error);

    // Update file status to failed
    await supabase
      .from('contract_files')
      .update({
        parsing_status: 'failed',
        parsing_completed_at: new Date().toISOString(),
        extraction_errors: {
          message: error.message,
          stack: error.stack,
        },
      })
      .eq('id', input.fileId);

    // Log error to audit trail
    await supabase.from('parsing_audit_log').insert({
      contract_id: input.contractId,
      file_id: input.fileId,
      event_type: 'parse_error',
      event_category: 'document',
      event_data: {
        error: error.message,
      },
    });

    return {
      success: false,
      fileId: input.fileId,
      documentType: 'unknown',
      fieldsExtracted: 0,
      confidence: 0,
      error: error.message,
    };
  }
}
