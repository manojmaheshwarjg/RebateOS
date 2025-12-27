'use server';

/**
 * DIRECT SIMPLE PRODUCT EXTRACTION
 *
 * No table detection, no complex logic.
 * Just send the PDF text to AI and ask for products in JSON format.
 *
 * This is the simplest, most reliable approach.
 */

import { generateWithGroq } from '@/ai/ai-fallback';
import { z } from 'zod';

export interface DirectProductExtractionInput {
  pdfText: string;
  fileName?: string;
}

const SimpleProductSchema = z.object({
  productName: z.string(),
  ndc: z.string().nullable(),
  strength: z.string().nullable(),
  packageSize: z.string().nullable(),
  manufacturer: z.string().nullable(),
  category: z.string().nullable(),
  sourceQuote: z.string(),
});

const SimpleProductListSchema = z.object({
  products: z.array(SimpleProductSchema),
  totalProducts: z.number(),
  extractionNotes: z.string(),
});

export type SimpleProduct = z.infer<typeof SimpleProductSchema>;
export type SimpleProductList = z.infer<typeof SimpleProductListSchema>;

/**
 * DIRECT extraction - send full text to AI and ask for products
 */
export async function extractProductsDirect(
  input: DirectProductExtractionInput
): Promise<SimpleProductList> {

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  DIRECT SIMPLE PRODUCT EXTRACTION                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`[Direct] Input text length: ${input.pdfText.length} characters`);
  console.log(`[Direct] File: ${input.fileName || 'unknown'}\n`);

  // Truncate if too long (Groq has token limits)
  const maxChars = 50000; // ~12k tokens
  const textToAnalyze = input.pdfText.length > maxChars
    ? input.pdfText.slice(0, maxChars)
    : input.pdfText;

  if (input.pdfText.length > maxChars) {
    console.log(`[Direct] ⚠️  Text truncated to ${maxChars} characters`);
  }

  console.log(`[Direct] Sending to Groq...`);

  const prompt = `You are extracting pharmaceutical products from a contract document.

**YOUR TASK:**
Extract EVERY product mentioned in this contract. Look for:
- Product names (drugs, medications, medical supplies)
- NDC codes (National Drug Codes - usually 11 digits like 12345-6789-01)
- Strengths (like 25mg, 100ml, 5%)
- Package sizes (like "100 tablets", "30-day supply")
- Manufacturers (pharmaceutical companies)
- Categories (therapeutic categories like "Cardiovascular", "Diabetes")

**CRITICAL RULES:**
1. Extract EVERY product you find - don't skip any
2. NDC codes: Look for 11-digit codes with or without hyphens (12345-6789-01 or 12345678901)
3. If you find a product name but no NDC, still include it
4. If you find an NDC but no product name, include it with NDC as the name
5. Extract products from tables, lists, or anywhere in the text
6. For sourceQuote: Copy the exact text where you found the product

**OUTPUT FORMAT:**
Return ONLY valid JSON (no markdown, no code blocks, no explanation):

{
  "products": [
    {
      "productName": "CardioCare Tablets",
      "ndc": "12345-6789-01",
      "strength": "25mg",
      "packageSize": "100 tablets",
      "manufacturer": "PharmaCorp",
      "category": "Cardiovascular",
      "sourceQuote": "CardioCare Tablets 25mg, NDC 12345-6789-01, 100 count"
    }
  ],
  "totalProducts": 1,
  "extractionNotes": "Found products in product list table"
}

**IMPORTANT:**
- Return JSON only, no markdown formatting
- If no products found, return empty array: {"products": [], "totalProducts": 0, "extractionNotes": "No products found"}
- Extract as many products as possible

**CONTRACT TEXT:**

${textToAnalyze}

**NOW EXTRACT ALL PRODUCTS AND RETURN JSON:**`;

  try {
    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
      output: {
        schema: SimpleProductListSchema,
      },
    });

    const result = output as SimpleProductList;

    console.log(`\n[Direct] ✅ Extraction complete!`);
    console.log(`[Direct] Products found: ${result.totalProducts}`);
    console.log(`[Direct] Notes: ${result.extractionNotes}\n`);

    if (result.totalProducts > 0) {
      console.log(`[Direct] Sample products:`);
      result.products.slice(0, 5).forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.productName}${p.ndc ? ` (NDC: ${p.ndc})` : ''}${p.strength ? ` - ${p.strength}` : ''}`);
      });
      console.log('');
    }

    return result;

  } catch (error: any) {
    console.error(`[Direct] ❌ Extraction failed:`, error.message);
    console.error(error.stack);

    // Return empty result instead of crashing
    return {
      products: [],
      totalProducts: 0,
      extractionNotes: `Extraction failed: ${error.message}`,
    };
  }
}

/**
 * ULTRA-AGGRESSIVE extraction - asks AI to be very aggressive
 */
export async function extractProductsUltraAggressive(
  input: DirectProductExtractionInput
): Promise<SimpleProductList> {

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ULTRA-AGGRESSIVE PRODUCT EXTRACTION                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const maxChars = 50000;
  const textToAnalyze = input.pdfText.length > maxChars
    ? input.pdfText.slice(0, maxChars)
    : input.pdfText;

  const prompt = `EXTRACT ALL PHARMACEUTICAL PRODUCTS FROM THIS CONTRACT.

Be VERY AGGRESSIVE - extract ANYTHING that could be a product:
- Drug names
- Medical supplies
- Any mention of NDC codes
- Any mention of medications
- Product codes, SKUs
- Brand names, generic names

Look in:
- Tables
- Lists
- Paragraphs
- Exhibits
- Appendices
- ANYWHERE

For each product, find:
- Name (REQUIRED - extract even if just a code)
- NDC if present (11 digits, may have hyphens)
- Strength if present (mg, ml, %, etc.)
- Package size if present
- Anything else

Return JSON only:
{
  "products": [
    {"productName": "...", "ndc": "...", "strength": "...", "packageSize": "...", "manufacturer": null, "category": null, "sourceQuote": "..."}
  ],
  "totalProducts": <count>,
  "extractionNotes": "..."
}

CONTRACT:

${textToAnalyze}

EXTRACT NOW - BE AGGRESSIVE, GET EVERYTHING:`;

  try {
    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0.3, // Slightly higher for aggressive extraction
        maxOutputTokens: 8192,
      },
      output: {
        schema: SimpleProductListSchema,
      },
    });

    const result = output as SimpleProductList;

    console.log(`[Ultra-Aggressive] ✅ Found ${result.totalProducts} products\n`);

    return result;

  } catch (error: any) {
    console.error(`[Ultra-Aggressive] ❌ Failed:`, error.message);
    return {
      products: [],
      totalProducts: 0,
      extractionNotes: `Failed: ${error.message}`,
    };
  }
}
