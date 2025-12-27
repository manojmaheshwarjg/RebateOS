'use server';

/**
 * @fileOverview AI flow for extracting product lists from contracts
 *
 * Enhanced with table-aware extraction for maximum accuracy.
 * Extracts from product tables with specialized prompts.
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';
import { PRODUCTS_TABLE_PROMPT } from '@/ai/prompts/table-prompts';
import type { ExtractedTable } from '@/lib/table-utils';
import { formatTableForAI } from '@/lib/table-utils';

const ExtractProductListInputSchema = z.object({
  documentText: z.string().describe("Pre-extracted text from the document"),
  tables: z.array(z.any()).optional().describe('Extracted tables from document'),
});

export type ExtractProductListInput = z.infer<typeof ExtractProductListInputSchema>;

const ProductSchema = z.object({
  productName: z.string().describe('Product name'),
  ndc: z.string().nullable().describe('National Drug Code (NDC) in XXXXX-XXXX-XX format'),
  sku: z.string().nullable().describe('SKU or item number'),
  strength: z.string().nullable().describe('Strength/dosage (e.g., 25mg, 100mg/ml)'),
  manufacturer: z.string().nullable().describe('Manufacturer name'),
  category: z.string().nullable().describe('Therapeutic category'),
  packageSize: z.string().nullable().describe('Package size (e.g., 100 tablets, 30-day supply)'),
  unitOfMeasure: z.string().nullable().describe('Unit of measure (bottle, vial, box, etc.)'),
  unitPrice: z.number().nullable().describe('Unit price'),
  rebateEligible: z.boolean().describe('Whether eligible for rebates'),
  rebatePercentage: z.number().nullable().describe('Product-specific rebate'),
  specialConditions: z.string().nullable().describe('Special conditions'),
  sourceQuote: z.string().describe('Exact text from document'),
  sourcePage: z.number().nullable().describe('Page number'),
});

const ProductListSchema = z.object({
  products: z.array(ProductSchema).describe('All products found'),
  totalProducts: z.number().describe('Total number of products'),
  hasMoreProducts: z.boolean().describe('Whether more products exist elsewhere'),
  externalReference: z.string().nullable().describe('External product list reference'),
  productCategories: z.array(z.string()).describe('Unique categories'),
  overallConfidence: z.number().min(0).max(1).describe('Extraction confidence'),
});

export type ProductList = z.infer<typeof ProductListSchema>;

const extractProductListPrompt = `
You are an expert pharmaceutical product data analyst. Extract ALL products from this document.

**EXTRACT FOR EACH PRODUCT:**
- productName (required)
- ndc - National Drug Code, format: XXXXX-XXXX-XX
- sku - SKU or item number
- manufacturer
- category - Therapeutic category
- packageSize
- unitOfMeasure
- unitPrice
- rebateEligible - true/false
- rebatePercentage
- specialConditions
- sourceQuote (required) - Exact text from document
- sourcePage

**RULES:**
- products must be an array, even if empty: []
- rebateEligible is boolean (true/false), NOT "yes"/"no"
- Confidence is 0-1 (e.g., 0.95 not 95)
- NDC format: XXXXX-XXXX-XX with dashes
- totalProducts must match products.length

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "products": [
    {"productName": "Lisinopril 10mg", "ndc": "12345-6789-01", "sku": "LIS-10", "manufacturer": "Generic Pharma", "category": "Cardiovascular", "packageSize": "100 tablets", "unitOfMeasure": "bottle", "unitPrice": 12.50, "rebateEligible": true, "rebatePercentage": null, "specialConditions": null, "sourceQuote": "Lisinopril 10mg, NDC 12345-6789-01", "sourcePage": 1}
  ],
  "totalProducts": 1,
  "hasMoreProducts": false,
  "externalReference": null,
  "productCategories": ["Cardiovascular"],
  "overallConfidence": 0.9
}
`;

export async function extractProductList(input: ExtractProductListInput): Promise<ProductList> {
  console.log('[Products] Starting table-aware extraction...');
  console.log('[Products] Text length:', input.documentText.length);
  console.log('[Products] Tables available:', input.tables?.length || 0);

  let allProducts: any[] = [];
  let highestConfidence = 0.5;

  // PHASE 1: Extract from product tables if available
  if (input.tables && input.tables.length > 0) {
    const productTables = input.tables.filter((t: any) => t.type === 'products');

    if (productTables.length > 0) {
      console.log(`[Products] Found ${productTables.length} product table(s), using table-based extraction`);

      for (const table of productTables) {
        const tableText = formatTableForAI(table);
        const productPrompt = `${PRODUCTS_TABLE_PROMPT}\n\n${tableText}`;

        const { output } = await generateWithGroq({
          prompt: productPrompt,
          config: {
            temperature: 0,
            maxOutputTokens: 8192,
          },
          output: {
            schema: z.object({
              products: z.array(ProductSchema),
              totalProducts: z.number(),
              extractionConfidence: z.number(),
              extractionNotes: z.string(),
            }),
          },
        });

        const productData = output as any;
        allProducts.push(...productData.products);
        highestConfidence = Math.max(highestConfidence, productData.extractionConfidence);

        console.log(`[Products] Extracted ${productData.products.length} products from table with ${(productData.extractionConfidence * 100).toFixed(0)}% confidence`);
      }

      // Return table-based results
      return {
        products: allProducts,
        totalProducts: allProducts.length,
        hasMoreProducts: false,
        externalReference: null,
        productCategories: [...new Set(allProducts.map(p => p.category).filter(Boolean))],
        overallConfidence: highestConfidence,
      };
    }
  }

  // PHASE 2: Fallback to text-based extraction if no tables found
  console.log('[Products] No product tables found, falling back to text extraction...');

  const { output } = await generateWithGroq({
    prompt: extractProductListPrompt,
    documentText: input.documentText.substring(0, 30000),
    config: {
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
    output: {
      schema: ProductListSchema,
    },
  });

  const productList = output as ProductList;

  console.log(`[Products] Text-based extraction found ${productList.products.length} products with ${(productList.overallConfidence * 100).toFixed(0)}% confidence`);

  return productList;
}
