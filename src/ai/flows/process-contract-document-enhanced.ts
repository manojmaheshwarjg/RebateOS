'use server';

/**
 * @fileOverview Enterprise Contract Document Processing Orchestrator
 *
 * Multi-stage, parallel extraction system with:
 * - Phase 1: PDF table extraction
 * - Phase 2: Parallel AI extraction (products, tiers, facilities, bundles, general fields)
 * - Phase 3: Field categorization for UI
 * - Phase 4: Amendment detection
 * - Phase 5: Conflict detection
 * - Phase 6: Validation
 * - Phase 7: Database persistence
 */

import { createClient } from '@/lib/supabase/server';
import { extractTablesFromPDF } from '@/lib/table-utils';
import type { ExtractedTable } from '@/lib/table-utils';

// Import extraction flows
import { extractFinancialFields } from './extract-financial-fields';
import type { FinancialFields } from './extract-financial-fields';
import { extractProductsDirect } from './extract-products-direct';
import type { SimpleProductList as ProductList } from './extract-products-direct';
import { extractFacilities } from './extract-facilities';
import type { FacilitiesData } from './extract-facilities';
import { extractBundles } from './extract-bundles';
import type { BundlesData } from './extract-bundles';
import { extractGeneralFields } from './extract-general-fields';
import type { GeneralFields } from './extract-general-fields';

// Import utilities
import { categorizeFieldsForUI } from '@/lib/field-categorization';
import type { AllExtractedData, CategorizedFields } from '@/lib/field-categorization';
import { detectAmendments, checkAmendmentConflicts } from '@/lib/amendment-detection';
import type { AmendmentDetectionResult } from '@/lib/amendment-detection';
import { validateExtraction } from '@/lib/extraction-validation';
import type { ValidationResult } from '@/lib/extraction-validation';

export interface ProcessDocumentEnhancedInput {
  fileId: string;
  contractId: string;
  pdfBuffer: Buffer;
  fileName: string;
}

export interface ProcessDocumentEnhancedResult {
  success: boolean;
  fileId: string;
  processingTime: number;

  // Extraction results
  tables: ExtractedTable[];
  financialFields: FinancialFields | null;
  productList: ProductList | null;
  facilitiesData: FacilitiesData | null;
  bundlesData: BundlesData | null;
  generalFields: GeneralFields | null;

  // Analysis results
  categorizedFields: CategorizedFields;
  amendments: AmendmentDetectionResult;
  validation: ValidationResult | null;

  // Metadata
  totalFieldsExtracted: number;
  overallConfidence: number;

  error?: string;
}

/**
 * Enhanced contract processing with multi-stage parallel extraction
 */
export async function processContractDocumentEnhanced(
  input: ProcessDocumentEnhancedInput
): Promise<ProcessDocumentEnhancedResult> {
  const startTime = Date.now();
  const supabase = await createClient();

  console.log(`\n========================================`);
  console.log(`[Enhanced] Processing: ${input.fileName}`);
  console.log(`========================================\n`);

  try {
    // Update status to processing
    console.log(`[Enhanced] Updating file status to processing...`);
    await supabase
      .from('contract_files')
      .update({
        parsing_status: 'processing',
        parsing_started_at: new Date().toISOString(),
      })
      .eq('id', input.fileId);

    // ============================================================
    // PHASE 1: TABLE EXTRACTION
    // ============================================================
    console.log(`\n[Phase 1] TABLE EXTRACTION`);
    console.log(`─────────────────────────────────────────`);

    const pdfExtractionResult = await extractTablesFromPDF(input.pdfBuffer);
    const { tables, fullText, pageCount } = pdfExtractionResult;

    console.log(`[Phase 1] ✓ Complete`);
    console.log(`  - Pages: ${pageCount}`);
    console.log(`  - Text length: ${fullText.length} characters`);
    console.log(`  - Tables found: ${tables.length}`);

    tables.forEach(t => {
      console.log(`    • Table ${t.tableIndex}: ${t.type} (${t.rowCount} rows, confidence: ${(t.confidence * 100).toFixed(0)}%)`);
    });

    // ============================================================
    // PHASE 2: PARALLEL AI EXTRACTION
    // ============================================================
    console.log(`\n[Phase 2] PARALLEL AI EXTRACTION`);
    console.log(`─────────────────────────────────────────`);

    const extractionPromises = [
      // Extract general fields (parties, dates, legal terms)
      (async () => {
        console.log(`[Phase 2.1] Starting general fields extraction...`);
        try {
          const result = await extractGeneralFields({ fullText });
          console.log(`[Phase 2.1] ✓ General fields extracted`);
          return { type: 'general' as const, data: result };
        } catch (error: any) {
          console.error(`[Phase 2.1] ✗ General fields extraction failed:`, error.message);
          return { type: 'general' as const, data: null, error: error.message };
        }
      })(),

      // Extract financial fields and tiers
      (async () => {
        console.log(`[Phase 2.2] Starting financial fields extraction...`);
        try {
          const result = await extractFinancialFields({
            documentText: fullText,
            tables: tables,
          });
          console.log(`[Phase 2.2] ✓ Financial fields extracted (${result.rebateTiers.length} tiers)`);
          return { type: 'financial' as const, data: result };
        } catch (error: any) {
          console.error(`[Phase 2.2] ✗ Financial extraction failed:`, error.message);
          return { type: 'financial' as const, data: null, error: error.message };
        }
      })(),

      // Extract products (DIRECT - Simple & Reliable)
      (async () => {
        console.log(`[Phase 2.3] Starting DIRECT product extraction...`);
        try {
          const result = await extractProductsDirect({
            pdfText: fullText,
            fileName: input.fileName,
          });
          console.log(`[Phase 2.3] ✓ Products extracted (${result.totalProducts} products)`);
          return { type: 'products' as const, data: result };
        } catch (error: any) {
          console.error(`[Phase 2.3] ✗ Product extraction failed:`, error.message);
          return { type: 'products' as const, data: null, error: error.message };
        }
      })(),

      // Extract facilities
      (async () => {
        console.log(`[Phase 2.4] Starting facilities extraction...`);
        try {
          const result = await extractFacilities({ tables, fullText });
          console.log(`[Phase 2.4] ✓ Facilities extracted (${result.facilities.length} facilities)`);
          return { type: 'facilities' as const, data: result };
        } catch (error: any) {
          console.error(`[Phase 2.4] ✗ Facilities extraction failed:`, error.message);
          return { type: 'facilities' as const, data: null, error: error.message };
        }
      })(),

      // Extract bundles
      (async () => {
        console.log(`[Phase 2.5] Starting bundles extraction...`);
        try {
          const result = await extractBundles({ tables, fullText });
          console.log(`[Phase 2.5] ✓ Bundles extracted (${result.bundles.length} bundles)`);
          return { type: 'bundles' as const, data: result };
        } catch (error: any) {
          console.error(`[Phase 2.5] ✗ Bundles extraction failed:`, error.message);
          return { type: 'bundles' as const, data: null, error: error.message };
        }
      })(),
    ];

    const extractionResults = await Promise.all(extractionPromises);

    // Aggregate results
    const generalFields = extractionResults.find(r => r.type === 'general')?.data as GeneralFields | null;
    const financialFields = extractionResults.find(r => r.type === 'financial')?.data as FinancialFields | null;
    const productList = extractionResults.find(r => r.type === 'products')?.data as ProductList | null;
    const facilitiesData = extractionResults.find(r => r.type === 'facilities')?.data as FacilitiesData | null;
    const bundlesData = extractionResults.find(r => r.type === 'bundles')?.data as BundlesData | null;

    console.log(`[Phase 2] ✓ Parallel extraction complete`);

    // ============================================================
    // PHASE 3: FIELD CATEGORIZATION
    // ============================================================
    console.log(`\n[Phase 3] FIELD CATEGORIZATION`);
    console.log(`─────────────────────────────────────────`);

    const allExtractedData: AllExtractedData = {
      generalFields: generalFields || undefined,
      financialFields: financialFields || undefined,
      productList: productList || undefined,
      facilitiesData: facilitiesData || undefined,
      bundlesData: bundlesData || undefined,
    };

    const categorizedFields = categorizeFieldsForUI(allExtractedData);

    console.log(`[Phase 3] ✓ Fields categorized`);
    console.log(`  - Financial Terms: ${categorizedFields.financialTerms.length}`);
    console.log(`  - Products: ${categorizedFields.products.length}`);
    console.log(`  - Terms & Conditions: ${categorizedFields.termsAndConditions.length}`);
    console.log(`  - Important Dates: ${categorizedFields.importantDates.length}`);
    console.log(`  - Total Fields: ${categorizedFields.metadata.totalFields}`);
    console.log(`  - High Confidence: ${categorizedFields.metadata.highConfidenceCount}`);
    console.log(`  - Medium Confidence: ${categorizedFields.metadata.mediumConfidenceCount}`);
    console.log(`  - Low Confidence: ${categorizedFields.metadata.lowConfidenceCount}`);

    // ============================================================
    // PHASE 4: AMENDMENT DETECTION
    // ============================================================
    console.log(`\n[Phase 4] AMENDMENT DETECTION`);
    console.log(`─────────────────────────────────────────`);

    const amendments = detectAmendments(fullText);

    console.log(`[Phase 4] ✓ Amendment detection complete`);
    console.log(`  - Amendments found: ${amendments.amendments.length}`);
    console.log(`  - Conflicts: ${amendments.conflictCount}`);
    console.log(`  - Requires review: ${amendments.requiresReview ? 'YES' : 'NO'}`);

    if (amendments.amendments.length > 0) {
      amendments.amendments.forEach((amendment, idx) => {
        console.log(`    ${idx + 1}. ${amendment.amendmentType}: ${amendment.description}`);
      });

      // Check for conflicts with extracted data
      const amendmentConflicts = checkAmendmentConflicts(amendments.amendments, allExtractedData);
      if (amendmentConflicts.length > 0) {
        console.log(`  - Amendment conflicts with extracted data:`);
        amendmentConflicts.forEach(conflict => {
          console.log(`    ⚠ ${conflict.conflict}`);
        });
      }
    }

    // ============================================================
    // PHASE 5: VALIDATION
    // ============================================================
    console.log(`\n[Phase 5] VALIDATION`);
    console.log(`─────────────────────────────────────────`);

    const validation = validateExtraction(input.fileName, allExtractedData);

    console.log(`[Phase 5] ✓ Validation complete`);
    console.log(`  - Overall Score: ${validation.overallScore.toFixed(1)}%`);
    console.log(`  - Status: ${validation.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`  - Critical Issues: ${validation.issues.filter(i => i.severity === 'critical').length}`);
    console.log(`  - Warnings: ${validation.issues.filter(i => i.severity === 'warning').length}`);

    // ============================================================
    // PHASE 6: DATABASE PERSISTENCE
    // ============================================================
    console.log(`\n[Phase 6] DATABASE PERSISTENCE`);
    console.log(`─────────────────────────────────────────`);

    // Save categorized fields to database
    const fieldsToInsert = [
      ...categorizedFields.financialTerms,
      ...categorizedFields.products,
      ...categorizedFields.termsAndConditions,
      ...categorizedFields.importantDates,
    ].map((field, idx) => ({
      contract_id: input.contractId,
      source_file_id: input.fileId,
      field_category: field.fieldKey.startsWith('rebate_tier') ? 'financial' :
                      field.fieldKey.startsWith('product_') ? 'product' :
                      field.fieldKey.startsWith('facility_') || field.fieldKey.startsWith('gen_') || field.fieldKey.includes('exclusion') ? 'compliance' :
                      field.fieldKey.includes('date') || field.fieldKey.includes('amendment') ? 'dates' : 'other',
      field_name: field.fieldKey,
      field_label: field.label,
      value_text: typeof field.value === 'string' ? field.value : null,
      value_numeric: typeof field.value === 'number' ? field.value : null,
      value_boolean: typeof field.value === 'boolean' ? field.value : null,
      value_json: field.rawValue || null,
      source_quote: field.source,
      source_page: field.sourcePage,
      confidence_score: field.confidence || 0.8,
      extraction_method: 'ai',
      ai_model: 'groq/llama-3.3-70b-versatile',
      priority: field.fieldKey.includes('tier') || field.fieldKey.includes('date') ? 1 : 2,
    }));

    if (fieldsToInsert.length > 0) {
      console.log(`[Phase 6] Saving ${fieldsToInsert.length} fields to database...`);

      const { error: fieldsError } = await supabase
        .from('extracted_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error(`[Phase 6] ✗ Error saving fields:`, fieldsError);
        throw fieldsError;
      }

      console.log(`[Phase 6] ✓ Fields saved successfully`);
    } else {
      console.warn(`[Phase 6] ⚠ No fields to save!`);
    }

    // Calculate overall confidence
    const confidences = [
      generalFields?.extractionConfidence || 0,
      financialFields?.overallConfidence || 0,
      productList?.overallConfidence || 0,
      facilitiesData?.extractionConfidence || 0,
      bundlesData?.extractionConfidence || 0,
    ].filter(c => c > 0);

    const overallConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

    // Update file status
    const processingTime = Date.now() - startTime;

    await supabase
      .from('contract_files')
      .update({
        parsing_status: 'completed',
        parsing_completed_at: new Date().toISOString(),
        parsing_duration_ms: processingTime,
        extraction_confidence: overallConfidence,
        extracted_data: {
          tables: tables.length,
          fields: categorizedFields.metadata.totalFields,
          amendments: amendments.amendments.length,
          validationScore: validation.overallScore,
          validationPassed: validation.passed,
        },
      })
      .eq('id', input.fileId);

    // Log to audit trail
    await supabase.from('parsing_audit_log').insert({
      contract_id: input.contractId,
      file_id: input.fileId,
      event_type: 'parse_complete_enhanced',
      event_category: 'document',
      event_data: {
        tables: tables.length,
        fields_extracted: categorizedFields.metadata.totalFields,
        amendments: amendments.amendments.length,
        validation_score: validation.overallScore,
        validation_passed: validation.passed,
        processing_time_ms: processingTime,
      },
    });

    // ============================================================
    // COMPLETION
    // ============================================================
    console.log(`\n========================================`);
    console.log(`[Enhanced] ✓ PROCESSING COMPLETE`);
    console.log(`========================================`);
    console.log(`  File: ${input.fileName}`);
    console.log(`  Time: ${processingTime}ms`);
    console.log(`  Fields: ${categorizedFields.metadata.totalFields}`);
    console.log(`  Confidence: ${(overallConfidence * 100).toFixed(1)}%`);
    console.log(`  Validation: ${validation.passed ? '✓ PASSED' : '✗ FAILED'} (${validation.overallScore.toFixed(1)}%)`);
    console.log(`========================================\n`);

    return {
      success: true,
      fileId: input.fileId,
      processingTime,
      tables,
      financialFields,
      productList,
      facilitiesData,
      bundlesData,
      generalFields,
      categorizedFields,
      amendments,
      validation,
      totalFieldsExtracted: categorizedFields.metadata.totalFields,
      overallConfidence,
    };

  } catch (error: any) {
    console.error(`\n[Enhanced] ✗ PROCESSING FAILED`);
    console.error(`Error: ${error.message}`);
    console.error(error.stack);

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

    // Log error
    await supabase.from('parsing_audit_log').insert({
      contract_id: input.contractId,
      file_id: input.fileId,
      event_type: 'parse_error',
      event_category: 'document',
      event_data: {
        error: error.message,
      },
    });

    throw error;
  }
}
