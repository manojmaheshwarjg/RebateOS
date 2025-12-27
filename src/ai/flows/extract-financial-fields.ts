'use server';

/**
 * @fileOverview AI flow for extracting financial fields from rebate contracts
 *
 * Enhanced with table-aware extraction for rebate tiers.
 * Extracts from both tables and full text for comprehensive coverage.
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';
import { enhanceSystemPromptForOCR } from '@/ai/ocr-prompt-utils';
import { TIERS_TABLE_PROMPT } from '@/ai/prompts/table-prompts';
import type { PDFExtractionResult } from '@/lib/pdf-utils';
import type { ExtractedTable } from '@/lib/table-utils';
import { formatTableForAI } from '@/lib/table-utils';

const ExtractFinancialFieldsInputSchema = z.object({
  documentText: z.string().describe("Pre-extracted text from the document"),
  documentType: z.string().optional().describe('Known document type for context'),
  extractionMetadata: z.any().optional().describe('OCR/extraction metadata if available'),
  tables: z.array(z.any()).optional().describe('Extracted tables from document'),
});

export type ExtractFinancialFieldsInput = z.infer<typeof ExtractFinancialFieldsInputSchema>;

// Enhanced rebate tier schema with all fields from guide
const RebateTierSchema = z.object({
  tierName: z.string().describe('Tier identifier (e.g., "Tier 1", "Gold", "Base")'),
  tierLevel: z.number().nullable().describe('Numeric level (1, 2, 3, etc.)'),
  minThreshold: z.number().nullable().describe('Minimum purchase threshold in dollars'),
  maxThreshold: z.number().nullable().describe('Maximum threshold, null if unlimited'),
  rebatePercentage: z.number().nullable().describe('Rebate percentage (e.g., 5.5 for 5.5%)'),
  rebateAmount: z.number().nullable().describe('Fixed rebate amount if applicable'),
  calculationMethod: z.string().describe('How rebate is calculated'),
  applicableProducts: z.string().describe('Products this tier applies to (string, not array)'),
  isRetroactive: z.boolean().nullable().describe('Whether rebate is retroactive to first dollar'),
  marketShareRequired: z.number().nullable().describe('Required market share percentage'),
  minimumCompliancePercent: z.number().nullable().describe('Minimum compliance percentage required'),
  specialTerms: z.string().nullable().describe('Special conditions, growth bonuses, bundle requirements'),
  sourceQuote: z.string().describe('Exact text from document'),
  sourcePage: z.number().nullable().describe('Page number where found'),
});

// Payment terms schema
const PaymentTermsSchema = z.object({
  frequency: z.string().nullable().describe('Payment frequency'),
  dueDate: z.string().nullable().describe('When payment is due'),
  submissionDeadline: z.string().nullable().describe('Deadline to submit claims'),
  paymentMethod: z.string().nullable().describe('How payment is made'),
  minimumPayment: z.number().nullable().describe('Minimum payment threshold'),
  sourceQuote: z.string().describe('Exact text from document'),
});

// Exclusions schema
const ExclusionSchema = z.object({
  exclusionType: z.string().describe('Type of exclusion'),
  description: z.string().describe('What is excluded'),
  impact: z.string().describe('Financial impact'),
  sourceQuote: z.string().describe('Exact text from document'),
});

// Vendor info schema
const VendorInfoSchema = z.object({
  vendorName: z.string().nullable().describe('Vendor name'),
  vendorAddress: z.string().nullable().describe('Vendor address'),
  contactName: z.string().nullable().describe('Contact person'),
  contactEmail: z.string().nullable().describe('Contact email'),
  contactPhone: z.string().nullable().describe('Contact phone'),
});

// Obligation schema
const ObligationSchema = z.object({
  title: z.string().describe('Short title of obligation'),
  description: z.string().nullable().describe('Detailed description'),
  dueDate: z.string().nullable().describe('Due date (YYYY-MM-DD or relative like "End of Quarter")'),
  type: z.enum(['report', 'payment', 'review', 'compliance', 'other']).describe('Type of obligation'),
  priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
  recurrence: z.string().nullable().describe('e.g. Monthly, Quarterly, Annual'),
  sourceQuote: z.string().describe('Exact text'),
});

const FinancialFieldsSchema = z.object({
  vendorInfo: VendorInfoSchema.nullable().describe('Vendor information'),
  contractNumber: z.string().nullable().describe('Contract reference number'),
  contractType: z.string().nullable().describe('Type of contract'),
  rebateTiers: z.array(RebateTierSchema).describe('All rebate tiers found'),
  tierStructureType: z.enum(['stepped', 'marginal', 'unknown']).nullable().describe('Stepped (all purchases) vs Marginal (incremental)'),
  paymentTerms: PaymentTermsSchema.nullable().describe('Payment terms'),
  minimumPurchaseRequirement: z.number().nullable().describe('Minimum purchase required'),
  maximumRebateCap: z.number().nullable().describe('Maximum rebate cap'),
  exclusions: z.array(ExclusionSchema).describe('Exclusions from rebates'),
  effectiveDate: z.string().nullable().describe('Effective date (YYYY-MM-DD)'),
  expirationDate: z.string().nullable().describe('Expiration date (YYYY-MM-DD)'),
  retroactiveProvisions: z.string().nullable().describe('Retroactive provisions'),
  volumeCommitments: z.string().nullable().describe('Volume commitments'),
  autoRenewal: z.string().nullable().describe('Auto-renewal terms'),
  obligations: z.array(ObligationSchema).describe('Reporting requirements, deadlines, compliance checks'),
  overallConfidence: z.number().min(0).max(1).describe('Extraction confidence (0-1)'),
  missingFields: z.array(z.string()).describe('Fields not found'),
  ambiguousFields: z.array(z.string()).describe('Unclear fields'),
});

export type FinancialFields = z.infer<typeof FinancialFieldsSchema>;

const extractFinancialFieldsPrompt = `
You are an expert healthcare contract analyst. Extract ALL financial terms from this contract.

**EXTRACT:**
1. REBATE TIERS - Every tier with name, thresholds, percentages
2. PAYMENT TERMS - Frequency, due dates, submission deadlines
3. DATES - Effective date, expiration date (format: YYYY-MM-DD)
4. OBLIGATIONS - Reporting requirements, compliance checks, mandatory reviews
5. EXCLUSIONS - Products or conditions excluded from rebates
6. VENDOR INFO - Company name, contact information

**RULES:**
- Use null for missing fields
- Dates must be YYYY-MM-DD format
- Confidence is 0-1 (e.g., 0.85 not 85)
- rebateTiers must be an array, even if empty: []
- exclusions must be an array, even if empty: []

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "vendorInfo": {"vendorName": "PharmaCorp", "vendorAddress": null, "contactName": null, "contactEmail": null, "contactPhone": null},
  "contractNumber": "PC-2024-001",
  "contractType": "GPO",
  "rebateTiers": [
    {"tierName": "Tier 1", "minThreshold": 0, "maxThreshold": 50000, "rebatePercentage": 5.0, "rebateAmount": null, "calculationMethod": "percentage", "applicableProducts": ["All products"], "sourceQuote": "Tier 1: 5%", "sourcePage": 1}
  ],
  "paymentTerms": {"frequency": "quarterly", "dueDate": "30 days after quarter end", "submissionDeadline": null, "paymentMethod": "ACH", "minimumPayment": 100, "sourceQuote": "Paid quarterly"},
  "minimumPurchaseRequirement": null,
  "maximumRebateCap": null,
  "exclusions": [],
  "effectiveDate": "2024-01-01",
  "expirationDate": "2025-12-31",
  "retroactiveProvisions": null,
  "volumeCommitments": null,
  "autoRenewal": null,
  "overallConfidence": 0.85,
  "missingFields": ["contactEmail"],
  "ambiguousFields": [],
  "obligations": [
    {"title": "Submit Utilization Report", "description": "Quarterly report of all purchases", "dueDate": "2024-04-15", "type": "report", "priority": "high", "recurrence": "quarterly", "sourceQuote": "Must submit report by 15th"}
  ]
}
`;

export async function extractFinancialFields(input: ExtractFinancialFieldsInput): Promise<FinancialFields> {
  console.log('[Financial] Starting table-aware extraction...');
  console.log('[Financial] Text length:', input.documentText.length);
  console.log('[Financial] Tables available:', input.tables?.length || 0);

  let rebateTiers: any[] = [];
  let tierConfidence = 0.5;

  // PHASE 1: Extract tiers from tables if available
  if (input.tables && input.tables.length > 0) {
    const tierTables = input.tables.filter((t: any) => t.type === 'tiers');

    if (tierTables.length > 0) {
      console.log(`[Financial] Found ${tierTables.length} tier table(s), using table-based extraction`);

      for (const table of tierTables) {
        const tableText = formatTableForAI(table);
        const tierPrompt = `${TIERS_TABLE_PROMPT}\n\n${tableText}`;

        const { output } = await generateWithGroq({
          prompt: tierPrompt,
          config: {
            temperature: 0,
            maxOutputTokens: 8192,
          },
          output: {
            schema: z.object({
              tiers: z.array(RebateTierSchema),
              totalTiers: z.number(),
              tierStructureType: z.enum(['stepped', 'marginal', 'unknown']).nullable(),
              extractionConfidence: z.number(),
              extractionNotes: z.string(),
            }),
          },
        });

        const tierData = output as any;
        rebateTiers.push(...tierData.tiers);
        tierConfidence = Math.max(tierConfidence, tierData.extractionConfidence);

        console.log(`[Financial] Extracted ${tierData.tiers.length} tiers from table with ${(tierData.extractionConfidence * 100).toFixed(0)}% confidence`);
      }
    }
  }

  // PHASE 2: Extract other financial fields from full text
  console.log('[Financial] Extracting other financial fields from text...');

  let enhancedPrompt = `${extractFinancialFieldsPrompt}\n\nDocument type: ${input.documentType || 'unknown'}`;

  if (input.extractionMetadata) {
    const metadata = input.extractionMetadata as PDFExtractionResult;
    enhancedPrompt = enhanceSystemPromptForOCR(enhancedPrompt, metadata);
    console.log(`[Financial] Using OCR-enhanced prompt (confidence: ${(metadata.confidence * 100).toFixed(0)}%)`);
  }

  const { output } = await generateWithGroq({
    prompt: enhancedPrompt,
    documentText: input.documentText.substring(0, 30000),
    config: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
    output: {
      schema: FinancialFieldsSchema,
    },
  });

  const financialFields = output as FinancialFields;

  // PHASE 3: Merge table-extracted tiers with text-extracted data
  if (rebateTiers.length > 0) {
    console.log(`[Financial] Using ${rebateTiers.length} tiers from table extraction (overriding text extraction)`);
    financialFields.rebateTiers = rebateTiers;
    financialFields.overallConfidence = Math.max(financialFields.overallConfidence, tierConfidence);
  }

  console.log(`[Financial] Extraction complete: ${financialFields.rebateTiers.length} tiers, confidence ${(financialFields.overallConfidence * 100).toFixed(0)}%`);

  return financialFields;
}
