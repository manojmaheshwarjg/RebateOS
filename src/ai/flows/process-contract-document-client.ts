'use server';

/**
 * @fileOverview Server-side AI processor for contract documents
 *
 * Handles AI classification and extraction only.
 * Client handles PDF extraction and database operations.
 */
import { classifyDocument } from './classify-document';
import { extractFinancialFields } from './extract-financial-fields';
import { extractProductList } from './extract-product-list';
import { shouldFlagForReview } from '@/ai/ocr-prompt-utils';
import type { PDFExtractionResult } from '@/lib/pdf-utils';

export interface ProcessDocumentInput {
  fileName: string;
  extractedText: string;
  extractionMetadata?: PDFExtractionResult;
}

export interface ProcessDocumentResult {
  success: boolean;
  documentType: string;
  classification: any;
  extractedFields: any[];
  overallConfidence: number;
  error?: string;
}

export async function processContractDocumentServer(
  input: ProcessDocumentInput
): Promise<ProcessDocumentResult> {
  const startTime = Date.now();
  console.log(`[AI-${input.fileName}] Starting AI processing...`);

  try {
    // Step 1: Classify document with enhanced classification
    console.log(`[AI-${input.fileName}] Classifying document...`);
    const classification = await classifyDocument({
      documentText: input.extractedText,
      fileName: input.fileName,
    });

    console.log(`[AI-${input.fileName}] Classification result:`, {
      type: classification.documentType,
      subtype: classification.documentSubtype,
      confidence: classification.confidence,
      containsFinancialData: classification.containsFinancialData,
      containsProductData: classification.containsProductData,
      priority: classification.suggestedPriority,
      reasoning: classification.reasoning,
      keyIndicators: classification.keyIndicators,
    });

    // Update file with classification
    await db.contract_files.update(input.fileId, {
      document_type: (classification.documentType || undefined) as any,
      document_subtype: classification.documentSubtype || undefined,
    });

    // Initialize extraction results
    let extractedFields: any[] = [];
    let overallConfidence = classification.confidence;
    let financialExtractionDone = false;
    let productExtractionDone = false;
    
    // Determine if fields should be flagged for review based on OCR quality
    const requiresReview = shouldFlagForReview(extractionResult);
    console.log(`[AI-${input.fileName}] Fields will ${requiresReview ? 'REQUIRE' : 'not require'} review (OCR confidence: ${(extractionResult.confidence * 100).toFixed(0)}%)`);

    // Step 2: Extract data based on CONTENT FLAGS (not just document type)
    // This ensures we don't miss data due to misclassification

    // Run financial extraction if:
    // - Document is classified as msa, rebate_schedule, amendment, or terms
    // - OR document contains financial data (even if classified as something else)
    const shouldExtractFinancial = 
      classification.documentType === 'rebate_schedule' ||
      classification.documentType === 'msa' ||
      classification.documentType === 'amendment' ||
      classification.documentType === 'terms' ||
      classification.containsFinancialData === true;

    console.log(`[AI-${input.fileName}] Should extract financial: ${shouldExtractFinancial}`);

    if (shouldExtractFinancial) {
      console.log(`[AI-${input.fileName}] Extracting financial fields...`);
      try {
        const financialData = await extractFinancialFields({
          documentText: extractionResult.text,
          documentType: classification.documentType,
          extractionMetadata: extractionResult,
        });
        
        console.log(`[AI-${input.fileName}] Financial extraction complete:`, {
          rebateTiers: financialData.rebateTiers.length,
          hasPaymentTerms: !!financialData.paymentTerms,
          exclusions: financialData.exclusions.length,
          vendorName: financialData.vendorInfo?.vendorName,
          confidence: financialData.overallConfidence
        });

        overallConfidence = (classification.confidence + financialData.overallConfidence) / 2;
        financialExtractionDone = true;

        // Save vendor information
        if (financialData.vendorInfo?.vendorName) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'terms' as const,
            field_name: 'vendor_name',
            field_label: 'Vendor Name',
            value_text: financialData.vendorInfo.vendorName,
            value_json: financialData.vendorInfo,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'groq/llama-3.3-70b-versatile',
            priority: 1,
            is_active: true,
            requires_review: requiresReview,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save contract number
        if (financialData.contractNumber) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'terms' as const,
            field_name: 'contract_number',
            field_label: 'Contract Number',
            value_text: financialData.contractNumber,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 1,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save all rebate tiers as a single structured field
        if (financialData.rebateTiers.length > 0) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'financial' as const,
            field_name: 'rebateTiers',
            field_label: 'Rebate Tiers',
            value_json: financialData.rebateTiers,
            value_text: `${financialData.rebateTiers.length} tier(s) extracted`,
            source_page: financialData.rebateTiers[0]?.sourcePage,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 1,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save payment terms
        if (financialData.paymentTerms) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'financial' as const,
            field_name: 'payment_terms',
            field_label: 'Payment Terms',
            value_json: financialData.paymentTerms,
            value_text: `${financialData.paymentTerms.frequency || 'Not specified'} - ${financialData.paymentTerms.dueDate || 'No due date'}`,
            source_quote: financialData.paymentTerms.sourceQuote,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 1,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save effective date
        if (financialData.effectiveDate) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'dates' as const,
            field_name: 'effective_date',
            field_label: 'Effective Date',
            value_text: financialData.effectiveDate,
            value_date: financialData.effectiveDate,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 2,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save expiration date
        if (financialData.expirationDate) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'dates' as const,
            field_name: 'expiration_date',
            field_label: 'Expiration Date',
            value_text: financialData.expirationDate,
            value_date: financialData.expirationDate,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 2,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save exclusions
        if (financialData.exclusions.length > 0) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'terms' as const,
            field_name: 'exclusions',
            field_label: 'Exclusions',
            value_json: financialData.exclusions,
            value_text: `${financialData.exclusions.length} exclusion(s)`,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 1,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save volume commitments
        if (financialData.volumeCommitments) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'terms' as const,
            field_name: 'volume_commitments',
            field_label: 'Volume Commitments',
            value_text: financialData.volumeCommitments,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 2,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        // Save auto-renewal terms
        if (financialData.autoRenewal) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'terms' as const,
            field_name: 'auto_renewal',
            field_label: 'Auto-Renewal Terms',
            value_text: financialData.autoRenewal,
            confidence_score: overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 3,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }

        console.log(`[AI-${input.fileName}] Added ${extractedFields.length} fields from financial extraction`);
      } catch (error: any) {
        console.error(`[AI-${input.fileName}] Error extracting financial fields:`, error);
        // Don't throw - continue with other extractions
        console.log(`[AI-${input.fileName}] Continuing despite financial extraction error...`);
      }
    }

    // Run product extraction if:
    // - Document is classified as product_list
    // - OR document contains product data (even if classified as something else)
    const shouldExtractProducts = 
      classification.documentType === 'product_list' ||
      classification.containsProductData === true;

    if (shouldExtractProducts) {
      console.log(`[AI-${input.fileName}] Extracting product list...`);
      try {
        const productData = await extractProductList({
          documentText: extractionResult.text,
        });
        
        console.log(`[AI-${input.fileName}] Product extraction complete: ${productData.products.length} products`);
        productExtractionDone = true;

        // Save products as a single structured field
        if (productData.products.length > 0) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'product' as const,
            field_name: 'products',
            field_label: 'Products',
            value_json: productData.products,
            value_text: `${productData.products.length} product(s) extracted`,
            confidence_score: productData.overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 2,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });

          // Save product categories
          if (productData.productCategories.length > 0) {
            extractedFields.push({
              id: generateId(),
              contract_id: input.contractId,
              source_file_id: input.fileId,
              field_category: 'product' as const,
              field_name: 'product_categories',
              field_label: 'Product Categories',
              value_json: productData.productCategories,
              value_text: productData.productCategories.join(', '),
              confidence_score: productData.overallConfidence,
              extraction_method: 'ai' as const,
              ai_model: 'googleai/gemini-2.0-flash',
              priority: 3,
              is_active: true,
              review_status: 'pending' as const,
              created_at: getCurrentTimestamp(),
              updated_at: getCurrentTimestamp(),
            });
          }
        }

        // Note if there are more products elsewhere
        if (productData.hasMoreProducts && productData.externalReference) {
          extractedFields.push({
            id: generateId(),
            contract_id: input.contractId,
            source_file_id: input.fileId,
            field_category: 'product' as const,
            field_name: 'external_product_reference',
            field_label: 'External Product Reference',
            value_text: productData.externalReference,
            confidence_score: productData.overallConfidence,
            extraction_method: 'ai' as const,
            ai_model: 'googleai/gemini-2.0-flash',
            priority: 2,
            is_active: true,
            review_status: 'pending' as const,
            created_at: getCurrentTimestamp(),
            updated_at: getCurrentTimestamp(),
          });
        }
      } catch (error: any) {
        console.error(`[AI-${input.fileName}] Error extracting products:`, error);
        // Don't throw - continue with saving what we have
        console.log(`[AI-${input.fileName}] Continuing despite product extraction error...`);
      }
    }

    // Step 3: Save all extracted fields to IndexedDB
    console.log(`[AI-${input.fileName}] Saving ${extractedFields.length} fields to database...`);
    if (extractedFields.length > 0) {
      await db.extracted_fields.bulkAdd(extractedFields);
    }

    // Step 4: Update file parsing status
    const parsingDuration = Date.now() - startTime;
    await db.contract_files.update(input.fileId, {
      parsing_status: 'completed',
      parsing_completed_at: getCurrentTimestamp(),
      parsing_duration_ms: parsingDuration,
      extraction_confidence: overallConfidence,
      extracted_data: {
        classification,
        fieldsCount: extractedFields.length,
        financialExtractionDone,
        productExtractionDone,
      },
    });

    // Step 5: Update contract with extracted data if we have key fields
    try {
      const vendorField = extractedFields.find(f => f.field_name === 'vendor_name');
      const effectiveDateField = extractedFields.find(f => f.field_name === 'effective_date');
      const expirationDateField = extractedFields.find(f => f.field_name === 'expiration_date');
      const rebateTiersField = extractedFields.find(f => f.field_name === 'rebateTiers');

      const contractUpdate: any = {
        extraction_confidence: overallConfidence,
        last_parsed_at: getCurrentTimestamp(),
      };

      if (effectiveDateField?.value_date) {
        contractUpdate.start_date = effectiveDateField.value_date;
      }
      if (expirationDateField?.value_date) {
        contractUpdate.end_date = expirationDateField.value_date;
      }
      if (rebateTiersField?.value_json) {
        contractUpdate.rebate_tiers = rebateTiersField.value_json;
      }

      await db.contracts.update(input.contractId, contractUpdate);
      console.log(`[AI-${input.fileName}] Updated contract with extracted data`);
    } catch (updateError) {
      console.warn(`[AI-${input.fileName}] Could not update contract:`, updateError);
    }

    // Step 6: Log to audit trail
    await db.parsing_audit_log.add({
      id: generateId(),
      contract_id: input.contractId,
      file_id: input.fileId,
      event_type: 'parse_complete',
      event_category: 'document',
      event_data: {
        document_type: classification.documentType,
        document_subtype: classification.documentSubtype,
        fields_extracted: extractedFields.length,
        confidence: overallConfidence,
        financial_extraction: financialExtractionDone,
        product_extraction: productExtractionDone,
        processing_time_ms: parsingDuration,
      },
      user_id: MOCK_USER_ID,
      created_at: getCurrentTimestamp(),
    });

    console.log(`[AI-${input.fileName}] Processing complete! Extracted ${extractedFields.length} fields in ${parsingDuration}ms.`);

    return {
      success: true,
      fileId: input.fileId,
      documentType: classification.documentType,
      fieldsExtracted: extractedFields.length,
      confidence: overallConfidence,
    };

  } catch (error: any) {
    console.error(`[AI-${input.fileName}] Processing failed:`, error);

    // Update file status to failed
    await db.contract_files.update(input.fileId, {
      parsing_status: 'failed',
      parsing_completed_at: getCurrentTimestamp(),
      extraction_errors: {
        message: error.message,
        stack: error.stack,
      },
    });

    // Log error to audit trail
    await db.parsing_audit_log.add({
      id: generateId(),
      contract_id: input.contractId,
      file_id: input.fileId,
      event_type: 'parse_error',
      event_category: 'document',
      event_data: {
        error: error.message,
      },
      user_id: MOCK_USER_ID,
      created_at: getCurrentTimestamp(),
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
