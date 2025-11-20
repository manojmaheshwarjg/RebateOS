'use server';

/**
 * @fileOverview An AI agent for extracting key information from rebate contracts.
 *
 * - extractContractDetails - A function that handles the contract information extraction process.
 * - ExtractContractDetailsInput - The input type for the extractContractDetails function.
 * - ExtractContractDetailsOutput - The return type for the extractContractDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractContractDetailsInputSchema = z.object({
  contractDataUri: z
    .string()
    .describe(
      "A rebate contract document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractContractDetailsInput = z.infer<typeof ExtractContractDetailsInputSchema>;

// Structured schema for rebate tiers
const RebateTierSchema = z.object({
  tierName: z.string().describe('Name or identifier for this tier (e.g., "Tier 1", "Gold", "Base")'),
  minThreshold: z.number().describe('Minimum purchase threshold in dollars or units to qualify for this tier'),
  maxThreshold: z.number().nullable().describe('Maximum threshold for this tier, null if unlimited'),
  rebatePercentage: z.number().describe('Rebate percentage for this tier (e.g., 5.5 for 5.5%)'),
  rebateType: z.enum(['percentage', 'fixed', 'per_unit']).describe('Type of rebate calculation'),
  applicableProducts: z.array(z.string()).describe('List of product names or categories this tier applies to'),
});

// Structured schema for products
const ProductSchema = z.object({
  productName: z.string().describe('Name of the product'),
  ndc: z.string().nullable().describe('National Drug Code (NDC) if available, format: XXXXX-XXXX-XX'),
  sku: z.string().nullable().describe('SKU or item number if available'),
  category: z.string().describe('Product category (e.g., "Cardiovascular", "Diabetes", "Generic")'),
  unitPrice: z.number().nullable().describe('Unit price if specified in contract'),
  unitOfMeasure: z.string().nullable().describe('Unit of measure (e.g., "each", "bottle", "vial")'),
});

// Vendor contact information
const VendorContactSchema = z.object({
  name: z.string().nullable().describe('Contact person name'),
  email: z.string().nullable().describe('Contact email address'),
  phone: z.string().nullable().describe('Contact phone number'),
  department: z.string().nullable().describe('Department (e.g., "Rebate Administration")'),
});

// Main output schema with confidence scores
const ExtractContractDetailsOutputSchema = z.object({
  // Vendor Information
  vendorName: z.string().describe('The official name of the vendor/manufacturer'),
  vendorContact: VendorContactSchema.describe('Primary contact information for the vendor'),

  // Contract Classification
  contractType: z.enum(['GPO', 'IDN', 'Direct', 'Wholesale', 'Other']).describe('Type of rebate contract'),
  contractNumber: z.string().nullable().describe('Contract reference number if available'),

  // Dates
  startDate: z.string().describe('Contract start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().describe('Contract end date in ISO format (YYYY-MM-DD)'),
  renewalTerms: z.string().nullable().describe('Auto-renewal or termination terms'),

  // Rebate Structure
  rebateTiers: z.array(RebateTierSchema).describe('Array of rebate tier structures'),

  // Products
  products: z.array(ProductSchema).describe('Array of products covered by the contract'),

  // Payment & Compliance
  paymentTerms: z.string().describe('Payment terms (e.g., "Net 30", "Quarterly", "Upon receipt")'),
  submissionDeadline: z.string().nullable().describe('Deadline for rebate submissions (e.g., "45 days after quarter end")'),
  requiredDocumentation: z.array(z.string()).describe('List of required documentation for claims'),

  // Eligibility
  eligibilityCriteria: z.array(z.string()).describe('List of eligibility requirements'),
  exclusions: z.array(z.string()).describe('List of exclusions or restrictions'),

  // Additional Terms
  specialConditions: z.array(z.string()).describe('Any special conditions or notes'),

  // Confidence Scores
  confidence: z.object({
    overall: z.number().min(0).max(100).describe('Overall confidence in extraction accuracy (0-100)'),
    vendorInfo: z.number().min(0).max(100).describe('Confidence in vendor information extraction'),
    dates: z.number().min(0).max(100).describe('Confidence in date extraction'),
    tiers: z.number().min(0).max(100).describe('Confidence in rebate tier extraction'),
    products: z.number().min(0).max(100).describe('Confidence in product list extraction'),
  }).describe('Confidence scores for different sections'),

  // Raw text for reference
  rawRebateRates: z.string().describe('Original rebate rates text from document'),
  rawProductList: z.string().describe('Original product list text from document'),
});

export type ExtractContractDetailsOutput = z.infer<typeof ExtractContractDetailsOutputSchema>;
export type RebateTier = z.infer<typeof RebateTierSchema>;
export type Product = z.infer<typeof ProductSchema>;

export async function extractContractDetails(
  input: ExtractContractDetailsInput
): Promise<ExtractContractDetailsOutput> {
  return extractContractDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractContractDetailsPrompt',
  input: {schema: ExtractContractDetailsInputSchema},
  output: {schema: ExtractContractDetailsOutputSchema},
  prompt: `You are an expert contract analyst specializing in extracting detailed, structured information from pharmaceutical and healthcare rebate contracts.

IMPORTANT: Extract ALL information with high precision. Use null for fields that cannot be found. Provide confidence scores based on how clearly the information was stated in the document.

## Extraction Guidelines:

### Vendor Information
- Extract the official company name (not abbreviations)
- Look for contact information in headers, footers, or signature blocks
- Identify the contract type based on terms used (GPO Agreement, Direct Contract, etc.)

### Dates
- Convert ALL dates to ISO format: YYYY-MM-DD
- If only month/year given, use first day of month
- Look for effective dates, termination dates, renewal clauses

### Rebate Tiers
- Extract EVERY tier mentioned with exact thresholds and percentages
- Identify if rebates are percentage-based, fixed amounts, or per-unit
- Note which products or categories each tier applies to
- If a single flat rate, create one tier with minThreshold: 0

### Products
- Extract ALL products listed, with NDC codes if available
- NDC format should be: XXXXX-XXXX-XX (with dashes)
- Categorize products logically (therapeutic class, generic/brand, etc.)
- Include unit pricing if specified

### Payment & Compliance
- Note exact payment terms and deadlines
- List ALL required documentation for claims
- Extract eligibility criteria as separate bullet points
- Note any exclusions or special conditions

### Confidence Scoring
Rate each section 0-100:
- 90-100: Information explicitly stated, clearly formatted
- 70-89: Information found but required some interpretation
- 50-69: Information partially available, some inference needed
- 0-49: Information not found or highly uncertain

## Contract Document to Analyze:

{{media url=contractDataUri}}

Extract all available information following the schema exactly. Be thorough and precise.`,
});

const extractContractDetailsFlow = ai.defineFlow(
  {
    name: 'extractContractDetailsFlow',
    inputSchema: ExtractContractDetailsInputSchema,
    outputSchema: ExtractContractDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
