'use server';

/**
 * @fileOverview AI flow for classifying contract documents by type
 *
 * Uses Groq LLaMA for document classification.
 * Text should be pre-extracted before calling this function.
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';

const ClassifyDocumentInputSchema = z.object({
  documentText: z
    .string()
    .describe("Pre-extracted text from the document"),
  fileName: z.string().optional().describe('Original filename for additional context'),
});

export type ClassifyDocumentInput = z.infer<typeof ClassifyDocumentInputSchema>;

const DocumentClassificationSchema = z.object({
  documentType: z
    .enum(['msa', 'rebate_schedule', 'amendment', 'product_list', 'terms', 'compliance', 'other'])
    .describe('Primary document type classification'),
  documentSubtype: z
    .string()
    .nullable()
    .describe('More specific classification'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score for the classification (0-1)'),
  reasoning: z
    .string()
    .describe('Brief explanation of why this classification was chosen'),
  keyIndicators: z
    .array(z.string())
    .describe('Key phrases or elements that led to this classification'),
  suggestedPriority: z
    .number()
    .min(1)
    .max(5)
    .describe('Processing priority (1=highest, 5=lowest)'),
  containsFinancialData: z
    .boolean()
    .describe('Whether the document contains rebate tiers, percentages, or financial terms'),
  containsProductData: z
    .boolean()
    .describe('Whether the document contains product lists, NDCs, or SKUs'),
});

export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;

const classifyDocumentPrompt = `
You are an expert healthcare contract document classifier.

Analyze the document text and classify it into one of these categories:

**Document Types:**
1. **msa** - Master Service Agreement: Main contract with parties, terms, signature blocks
2. **rebate_schedule** - Rebate percentages, tiers, thresholds, payment terms
3. **amendment** - Modifications to existing agreements
4. **product_list** - Catalog of products with NDCs, SKUs
5. **terms** - Legal terms and conditions
6. **compliance** - Regulatory requirements (340B, Medicaid)
7. **other** - Doesn't fit above categories

**Instructions:**
- Look for tier structures, percentages, thresholds → likely rebate_schedule
- Look for signature blocks, parties → likely msa
- Look for product names, NDC codes → likely product_list
- Set containsFinancialData=true if you see rebate %, tiers, payment terms
- Set containsProductData=true if you see product names, NDCs, SKUs

**Output Format (JSON only, no markdown):**
{
  "documentType": "rebate_schedule",
  "documentSubtype": "tier_schedule",
  "confidence": 0.9,
  "reasoning": "Document contains rebate tier structure with percentages",
  "keyIndicators": ["Tier 1", "5% rebate", "$100,000 threshold"],
  "suggestedPriority": 1,
  "containsFinancialData": true,
  "containsProductData": false
}
`;

export async function classifyDocument(input: ClassifyDocumentInput): Promise<DocumentClassification> {
  // Use pre-extracted text
  console.log('[Classify] Using pre-extracted text, length:', input.documentText.length);
  console.log('[Classify] Text sample:', input.documentText.substring(0, 500));

  // Classify using Groq
  console.log('[Classify] Sending to Groq for classification...');
  const { output } = await generateWithGroq({
    prompt: `${classifyDocumentPrompt}\n\nFilename: ${input.fileName || 'unknown'}`,
    documentText: input.documentText.substring(0, 15000), // Limit text to avoid token limits
    config: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
    output: {
      schema: DocumentClassificationSchema,
    },
  });

  return output as DocumentClassification;
}
