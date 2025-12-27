'use server';

/**
 * @fileOverview AI flow for extracting general contract fields
 *
 * Extracts all non-table fields: parties, dates, legal terms, compliance, etc.
 * This is the comprehensive "catch-all" extractor for contract metadata.
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';
import { GENERAL_FIELDS_PROMPT } from '@/ai/prompts/table-prompts';

const GeneralFieldsSchema = z.object({
  // Contract Identification
  contractNumber: z.string().nullable(),
  contractTitle: z.string().nullable(),
  contractType: z.string().nullable(),
  executionDate: z.string().nullable(),
  effectiveDate: z.string().nullable(),
  expirationDate: z.string().nullable(),
  contractTerm: z.string().nullable(),
  autoRenewal: z.string().nullable(),

  // Manufacturer (Supplier)
  manufacturerName: z.string().nullable(),
  manufacturerAddress: z.string().nullable(),
  manufacturerContact: z.string().nullable(),
  manufacturerEmail: z.string().nullable(),
  manufacturerPhone: z.string().nullable(),

  // Purchaser (Buyer)
  purchaserName: z.string().nullable(),
  purchaserAddress: z.string().nullable(),
  purchaserContact: z.string().nullable(),
  purchaserEmail: z.string().nullable(),
  purchaserPhone: z.string().nullable(),
  purchaser340BId: z.string().nullable(),
  gpoAffiliation: z.string().nullable(),

  // Payment Terms
  paymentTerms: z.string().nullable(),
  claimsDueDays: z.number().nullable(),
  paymentDueDays: z.number().nullable(),
  paymentMethod: z.string().nullable(),
  minimumPayment: z.number().nullable(),
  paymentFrequency: z.string().nullable(),

  // Growth Incentives
  growthIncentivePercentage: z.number().nullable(),
  growthIncentiveThreshold: z.number().nullable(),
  growthMeasurementPeriod: z.string().nullable(),

  // Penalties & Discounts
  lateClaimPenalty: z.string().nullable(),
  earlyPaymentDiscount: z.string().nullable(),

  // Medicaid
  medicaidCarveOut: z.boolean().nullable(),
  medicaidCarveOutStates: z.array(z.string()).nullable(),
  medicaidExclusionDescription: z.string().nullable(),

  // Medicare
  medicarePartDExcluded: z.boolean().nullable(),
  medicareExclusionDescription: z.string().nullable(),

  // Other Exclusions
  managedCareExcluded: z.boolean().nullable(),
  managedCareDetails: z.string().nullable(),
  governmentProgramsExcluded: z.string().nullable(),
  chargebacksAllowed: z.boolean().nullable(),
  chargebackDetails: z.string().nullable(),

  // Legal Terms
  governingLawState: z.string().nullable(),
  disputeResolution: z.string().nullable(),
  disputeLocation: z.string().nullable(),
  confidentialityTerms: z.string().nullable(),
  auditRights: z.string().nullable(),
  terminationNoticeDays: z.number().nullable(),
  terminationForCause: z.string().nullable(),

  // Volume & Compliance
  minimumPurchaseRequirement: z.number().nullable(),
  volumeCommitments: z.string().nullable(),
  complianceRequirements: z.string().nullable(),
  reportingRequirements: z.string().nullable(),
  dataSubmissionDeadline: z.string().nullable(),

  // Special Provisions
  retroactiveProvisions: z.string().nullable(),
  mostFavoredCustomer: z.string().nullable(),
  priceProtection: z.string().nullable(),
  formularyRequirements: z.string().nullable(),
  marketShareRequirements: z.string().nullable(),

  // Amendments
  hasAmendments: z.boolean().nullable(),
  amendmentDates: z.array(z.string()).nullable(),
  amendmentSummaries: z.array(z.string()).nullable(),

  // Extraction Metadata
  extractionConfidence: z.number().min(0).max(1),
  extractionNotes: z.string(),
  ambiguousFields: z.array(z.string()),
  missingFields: z.array(z.string()),
});

export type GeneralFields = z.infer<typeof GeneralFieldsSchema>;

export interface ExtractGeneralFieldsInput {
  fullText: string;
  documentType?: string;
}

/**
 * Extract general contract fields from full text
 */
export async function extractGeneralFields(input: ExtractGeneralFieldsInput): Promise<GeneralFields> {
  console.log('[General] Starting comprehensive field extraction...');
  console.log(`[General] Document length: ${input.fullText.length} characters`);

  // Truncate to avoid token limits (keep first 30K chars which should cover contract metadata)
  const textToAnalyze = input.fullText.slice(0, 30000);

  const prompt = `${GENERAL_FIELDS_PROMPT}\n\n${textToAnalyze}`;

  console.log('[General] Sending to Groq for extraction...');

  const { output } = await generateWithGroq({
    prompt,
    config: {
      temperature: 0,
      maxOutputTokens: 8192,
    },
    output: {
      schema: GeneralFieldsSchema,
    },
  });

  const generalFields = output as GeneralFields;

  console.log('[General] Extraction complete:');
  console.log(`  - Contract Number: ${generalFields.contractNumber || 'not found'}`);
  console.log(`  - Effective Date: ${generalFields.effectiveDate || 'not found'}`);
  console.log(`  - Expiration Date: ${generalFields.expirationDate || 'not found'}`);
  console.log(`  - Manufacturer: ${generalFields.manufacturerName || 'not found'}`);
  console.log(`  - Purchaser: ${generalFields.purchaserName || 'not found'}`);
  console.log(`  - GPO: ${generalFields.gpoAffiliation || 'not found'}`);
  console.log(`  - Medicaid Carve-Out: ${generalFields.medicaidCarveOut !== null ? generalFields.medicaidCarveOut : 'not found'}`);
  console.log(`  - Has Amendments: ${generalFields.hasAmendments !== null ? generalFields.hasAmendments : 'not found'}`);
  console.log(`  - Confidence: ${(generalFields.extractionConfidence * 100).toFixed(0)}%`);
  console.log(`  - Ambiguous Fields: ${generalFields.ambiguousFields.length}`);
  console.log(`  - Missing Fields: ${generalFields.missingFields.length}`);

  return generalFields;
}
