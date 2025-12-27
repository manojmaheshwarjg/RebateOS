'use server';

/**
 * LOCAL-ONLY Enhanced Contract Processing
 * 
 * Same 6-phase extraction as processContractDocumentEnhanced, but:
 * - NO Supabase database operations
 * - Returns results for client to save to IndexedDB
 * - Perfect for local-first applications
 */

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
import { detectAmendments } from '@/lib/amendment-detection';
import type { AmendmentDetectionResult } from '@/lib/amendment-detection';
import { validateExtraction } from '@/lib/extraction-validation';
import type { ValidationResult } from '@/lib/extraction-validation';

export interface ProcessDocumentLocalInput {
  pdfBuffer: Buffer;
  fileName: string;
}

export interface ProcessDocumentLocalResult {
  success: boolean;
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
 * LOCAL-ONLY enhanced contract processing (no database operations)
 */
export async function processContractDocumentLocal(
  input: ProcessDocumentLocalInput
): Promise<ProcessDocumentLocalResult> {
  const startTime = Date.now();

  console.log(`\n========================================`);
  console.log(`[Local Enhanced] Processing: ${input.fileName}`);
  console.log(`[Local Enhanced] NO DATABASE - Results only`);
  console.log(`========================================\n`);

  try {
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

    // ============================================================
    // PHASE 4: AMENDMENT DETECTION
    // ============================================================
    console.log(`\n[Phase 4] AMENDMENT DETECTION`);
    console.log(`─────────────────────────────────────────`);

    const amendments = detectAmendments(fullText);

    console.log(`[Phase 4] ✓ Amendment detection complete`);
    console.log(`  - Amendments found: ${amendments.amendments.length}`);
    console.log(`  - Conflicts: ${amendments.conflictCount}`);

    // ============================================================
    // PHASE 5: VALIDATION
    // ============================================================
    console.log(`\n[Phase 5] VALIDATION`);
    console.log(`─────────────────────────────────────────`);

    const validation = validateExtraction(input.fileName, allExtractedData);

    console.log(`[Phase 5] ✓ Validation complete`);
    console.log(`  - Overall Score: ${validation.overallScore.toFixed(1)}%`);
    console.log(`  - Status: ${validation.passed ? '✓ PASSED' : '✗ FAILED'}`);

    // Calculate overall confidence
    const confidences = [
      generalFields?.extractionConfidence || 0,
      financialFields?.overallConfidence || 0,
      (productList as any)?.extractionConfidence || (productList as any)?.overallConfidence || 0,
      facilitiesData?.extractionConfidence || 0,
      bundlesData?.extractionConfidence || 0,
    ].filter(c => c > 0);

    const overallConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

    const processingTime = Date.now() - startTime;

    // ============================================================
    // COMPLETION (NO DATABASE - JUST RETURN RESULTS)
    // ============================================================
    console.log(`\n========================================`);
    console.log(`[Local Enhanced] ✓ PROCESSING COMPLETE`);
    console.log(`========================================`);
    console.log(`  File: ${input.fileName}`);
    console.log(`  Time: ${processingTime}ms`);
    console.log(`  Fields: ${categorizedFields.metadata.totalFields}`);
    console.log(`  Products: ${productList?.totalProducts || 0}`);
    console.log(`  Confidence: ${(overallConfidence * 100).toFixed(1)}%`);
    console.log(`  Validation: ${validation.passed ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`========================================\n`);

    return {
      success: true,
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
    console.error(`\n[Local Enhanced] ✗ PROCESSING FAILED`);
    console.error(`Error: ${error.message}`);
    console.error(error.stack);

    throw error;
  }
}
