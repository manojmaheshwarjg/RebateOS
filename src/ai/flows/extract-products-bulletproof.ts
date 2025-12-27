'use server';

/**
 * @fileOverview BULLETPROOF Product Extraction
 *
 * Multi-strategy product extraction with comprehensive fallbacks.
 * This WILL extract products no matter what format they're in.
 *
 * Strategy cascade:
 * 1. Table-based extraction (if tables detected)
 * 2. NDC pattern matching in full text
 * 3. Product list section extraction
 * 4. Line-by-line product parsing
 * 5. Aggressive keyword-based extraction
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';
import type { ExtractedTable } from '@/lib/table-utils';

export interface BulletproofProductExtractionInput {
  fullText: string;
  tables?: ExtractedTable[];
  fileName?: string;
}

const ProductSchema = z.object({
  productName: z.string().describe('Product name'),
  ndc: z.string().nullable().describe('National Drug Code (NDC) in XXXXX-XXXX-XX format'),
  sku: z.string().nullable().describe('SKU or item number'),
  strength: z.string().nullable().describe('Strength/dosage (e.g., 25mg, 100mg/ml)'),
  packageSize: z.string().nullable().describe('Package size (e.g., 100 tablets, 30-day supply)'),
  unitOfMeasure: z.string().nullable().describe('Unit of measure (bottle, vial, box, etc.)'),
  manufacturer: z.string().nullable().describe('Manufacturer name'),
  category: z.string().nullable().describe('Therapeutic category'),
  rebateEligible: z.boolean().describe('Whether eligible for rebates'),
  sourceQuote: z.string().describe('Exact text from document'),
  sourcePage: z.number().nullable().describe('Page number'),
});

const ProductListSchema = z.object({
  products: z.array(ProductSchema).describe('All products found'),
  totalProducts: z.number().describe('Total number of products'),
  extractionMethod: z.string().describe('Which method was used'),
  extractionConfidence: z.number().min(0).max(1).describe('Confidence score'),
  extractionNotes: z.string().describe('Notes about extraction'),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;

/**
 * BULLETPROOF product extraction with multiple fallback strategies
 */
export async function extractProductsBulletproof(
  input: BulletproofProductExtractionInput
): Promise<ProductList> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  BULLETPROOF PRODUCT EXTRACTION - MULTI-STRATEGY APPROACH  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`[Products] Input:`, {
    textLength: input.fullText.length,
    tablesCount: input.tables?.length || 0,
    fileName: input.fileName || 'unknown',
  });

  let allProducts: Product[] = [];
  let successfulMethod = 'none';
  let extractionNotes: string[] = [];

  // ═══════════════════════════════════════════════════════════
  // STRATEGY 1: TABLE-BASED EXTRACTION
  // ═══════════════════════════════════════════════════════════
  if (input.tables && input.tables.length > 0) {
    console.log(`\n[Strategy 1] TABLE-BASED EXTRACTION`);
    console.log(`────────────────────────────────────────────────────────────`);

    const productTables = input.tables.filter(t => t.type === 'products');
    console.log(`[Strategy 1] Product tables found: ${productTables.length}`);

    if (productTables.length > 0) {
      for (const table of productTables) {
        console.log(`[Strategy 1] Processing table ${table.tableIndex} (${table.rowCount} rows)...`);

        const tableProducts = await extractFromTable(table);
        allProducts.push(...tableProducts);

        console.log(`[Strategy 1] ✓ Extracted ${tableProducts.length} products from table ${table.tableIndex}`);
      }

      if (allProducts.length > 0) {
        successfulMethod = 'table-based';
        extractionNotes.push(`Found ${allProducts.length} products in ${productTables.length} table(s)`);
      }
    }

    // Also check tables that might not be classified as 'products' but contain NDCs
    if (allProducts.length === 0) {
      console.log(`[Strategy 1] Checking ALL tables for NDC patterns...`);

      for (const table of input.tables) {
        const tableText = JSON.stringify(table.rawData);
        const ndcMatches = findNDCPatterns(tableText);

        if (ndcMatches.length > 0) {
          console.log(`[Strategy 1] Found ${ndcMatches.length} NDCs in table ${table.tableIndex} (type: ${table.type})`);

          const tableProducts = await extractFromTable(table);
          allProducts.push(...tableProducts);

          if (tableProducts.length > 0) {
            successfulMethod = 'table-ndc-scan';
            extractionNotes.push(`Found products in table classified as '${table.type}'`);
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY 2: NDC PATTERN MATCHING IN FULL TEXT
  // ═══════════════════════════════════════════════════════════
  if (allProducts.length === 0) {
    console.log(`\n[Strategy 2] NDC PATTERN MATCHING`);
    console.log(`────────────────────────────────────────────────────────────`);

    const ndcMatches = findNDCPatterns(input.fullText);
    console.log(`[Strategy 2] Found ${ndcMatches.length} NDC patterns in text`);

    if (ndcMatches.length > 0) {
      const ndcProducts = await extractFromNDCPatterns(input.fullText, ndcMatches);
      allProducts.push(...ndcProducts);

      if (ndcProducts.length > 0) {
        successfulMethod = 'ndc-pattern-matching';
        extractionNotes.push(`Extracted ${ndcProducts.length} products from NDC patterns`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY 3: PRODUCT LIST SECTION EXTRACTION
  // ═══════════════════════════════════════════════════════════
  if (allProducts.length === 0) {
    console.log(`\n[Strategy 3] PRODUCT LIST SECTION EXTRACTION`);
    console.log(`────────────────────────────────────────────────────────────`);

    const productSections = findProductSections(input.fullText);
    console.log(`[Strategy 3] Found ${productSections.length} product section(s)`);

    if (productSections.length > 0) {
      for (const section of productSections) {
        const sectionProducts = await extractFromSection(section);
        allProducts.push(...sectionProducts);
      }

      if (allProducts.length > 0) {
        successfulMethod = 'section-based';
        extractionNotes.push(`Extracted from ${productSections.length} product section(s)`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY 4: LINE-BY-LINE PRODUCT PARSING
  // ═══════════════════════════════════════════════════════════
  if (allProducts.length === 0) {
    console.log(`\n[Strategy 4] LINE-BY-LINE PRODUCT PARSING`);
    console.log(`────────────────────────────────────────────────────────────`);

    const lineProducts = await extractFromLines(input.fullText);
    console.log(`[Strategy 4] Extracted ${lineProducts.length} products from line parsing`);

    if (lineProducts.length > 0) {
      allProducts.push(...lineProducts);
      successfulMethod = 'line-by-line';
      extractionNotes.push(`Parsed ${lineProducts.length} products line-by-line`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STRATEGY 5: AGGRESSIVE AI EXTRACTION (LAST RESORT)
  // ═══════════════════════════════════════════════════════════
  if (allProducts.length === 0) {
    console.log(`\n[Strategy 5] AGGRESSIVE AI EXTRACTION (LAST RESORT)`);
    console.log(`────────────────────────────────────────────────────────────`);

    const aiProducts = await aggressiveAIExtraction(input.fullText);
    console.log(`[Strategy 5] AI extracted ${aiProducts.length} products`);

    if (aiProducts.length > 0) {
      allProducts.push(...aiProducts);
      successfulMethod = 'aggressive-ai';
      extractionNotes.push(`AI extracted ${aiProducts.length} products from unstructured text`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DEDUPLICATION & CLEANUP
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[Cleanup] Deduplicating products...`);
  const uniqueProducts = deduplicateProducts(allProducts);
  console.log(`[Cleanup] ${allProducts.length} → ${uniqueProducts.length} products after deduplication`);

  // Calculate confidence
  const confidence = successfulMethod === 'table-based' ? 0.95 :
                    successfulMethod === 'table-ndc-scan' ? 0.9 :
                    successfulMethod === 'ndc-pattern-matching' ? 0.85 :
                    successfulMethod === 'section-based' ? 0.8 :
                    successfulMethod === 'line-by-line' ? 0.7 :
                    successfulMethod === 'aggressive-ai' ? 0.6 : 0.5;

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  EXTRACTION COMPLETE                                       ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`  Method: ${successfulMethod}`);
  console.log(`  Products: ${uniqueProducts.length}`);
  console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`);
  console.log(`  Notes: ${extractionNotes.join('; ')}\n`);

  return {
    products: uniqueProducts,
    totalProducts: uniqueProducts.length,
    extractionMethod: successfulMethod,
    extractionConfidence: confidence,
    extractionNotes: extractionNotes.join('; '),
  };
}

/**
 * Extract products from a table
 */
async function extractFromTable(table: ExtractedTable): Promise<Product[]> {
  try {
    const tableText = formatTableForPrompt(table);

    const prompt = `Extract ALL products from this table. Each row is one product.

RULES:
- Extract EVERY row as a product
- NDC format: XXXXX-XXXX-XX or XXXXX-XXX-XX (add hyphens if missing)
- Return JSON array only, no markdown

Output format:
[
  {
    "productName": "Product Name",
    "ndc": "12345-6789-01",
    "strength": "25mg",
    "packageSize": "100 tablets",
    "sourceQuote": "exact text from row"
  }
]

TABLE:
${tableText}

Return JSON array only:`;

    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
      output: {
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      },
    });

    return (output as any).products || [];
  } catch (error: any) {
    console.error(`[extractFromTable] Error:`, error.message);
    return [];
  }
}

/**
 * Find NDC patterns in text
 */
function findNDCPatterns(text: string): string[] {
  const patterns = [
    // Standard NDC with hyphens: 12345-6789-01
    /\b\d{5}-\d{4}-\d{2}\b/g,
    /\b\d{5}-\d{3}-\d{2}\b/g,
    // NDC without hyphens: 12345678901
    /\b\d{11}\b/g,
    /\b\d{10}\b/g,
  ];

  const matches = new Set<string>();

  patterns.forEach(pattern => {
    const found = text.match(pattern) || [];
    found.forEach(match => matches.add(match));
  });

  return Array.from(matches);
}

/**
 * Extract products from NDC patterns found in text
 */
async function extractFromNDCPatterns(fullText: string, ndcPatterns: string[]): Promise<Product[]> {
  const products: Product[] = [];

  console.log(`[NDC Extraction] Processing ${ndcPatterns.length} NDC patterns...`);

  for (const ndc of ndcPatterns.slice(0, 50)) { // Limit to 50 to avoid overwhelming AI
    // Find context around NDC
    const ndcIndex = fullText.indexOf(ndc);
    const contextStart = Math.max(0, ndcIndex - 200);
    const contextEnd = Math.min(fullText.length, ndcIndex + 200);
    const context = fullText.slice(contextStart, contextEnd);

    try {
      const prompt = `Extract product info from this text containing NDC ${ndc}:

"${context}"

Return JSON with product details:
{
  "productName": "name from text",
  "ndc": "${ndc}",
  "strength": "if found (e.g., 25mg)",
  "packageSize": "if found (e.g., 100 tablets)",
  "sourceQuote": "exact quote from text"
}`;

      const { output } = await generateWithGroq({
        prompt,
        config: {
          temperature: 0,
          maxOutputTokens: 512,
        },
        output: {
          schema: ProductSchema,
        },
      });

      const product = output as Product;
      if (product.productName && product.productName.length > 2) {
        products.push(product);
      }
    } catch (error: any) {
      console.error(`[NDC Extraction] Error for ${ndc}:`, error.message);
    }
  }

  return products;
}

/**
 * Find product list sections in text
 */
function findProductSections(text: string): string[] {
  const sectionPatterns = [
    /product\s+list[\s\S]{0,2000}/gi,
    /eligible\s+products[\s\S]{0,2000}/gi,
    /covered\s+products[\s\S]{0,2000}/gi,
    /ndc\s+list[\s\S]{0,2000}/gi,
    /exhibit\s+a[\s\S]{0,2000}/gi,
  ];

  const sections: string[] = [];

  sectionPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    sections.push(...matches);
  });

  return sections;
}

/**
 * Extract products from a section
 */
async function extractFromSection(section: string): Promise<Product[]> {
  try {
    const prompt = `Extract ALL products from this product list section:

"${section.slice(0, 15000)}"

Return JSON array of products. Each product should have:
- productName (required)
- ndc (if present)
- strength (if present)

[{"productName": "...", "ndc": "...", "strength": "..."}]`;

    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
      output: {
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      },
    });

    return (output as any).products || [];
  } catch (error: any) {
    console.error(`[extractFromSection] Error:`, error.message);
    return [];
  }
}

/**
 * Extract products by parsing lines
 */
async function extractFromLines(fullText: string): Promise<Product[]> {
  // Find lines that look like product entries
  const lines = fullText.split('\n');
  const productLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Line looks like a product if it has:
    // - An NDC pattern
    // - OR product-related keywords + numbers
    if (
      /\d{5}-\d{3,4}-\d{2}/.test(trimmed) ||
      (/\d+mg|\d+ml|tablet|capsule|vial|bottle/.test(trimmed.toLowerCase()) && trimmed.length > 20)
    ) {
      productLines.push(trimmed);
    }
  }

  console.log(`[Line Parsing] Found ${productLines.length} product-like lines`);

  if (productLines.length === 0) return [];

  // Send to AI for parsing
  try {
    const prompt = `Parse these product lines into structured data:

${productLines.slice(0, 100).join('\n')}

Extract product name, NDC (if present), strength (if present).
Return JSON array: [{"productName": "...", "ndc": "...", "strength": "..."}]`;

    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
      output: {
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      },
    });

    return (output as any).products || [];
  } catch (error: any) {
    console.error(`[Line Parsing] Error:`, error.message);
    return [];
  }
}

/**
 * Aggressive AI extraction as last resort
 */
async function aggressiveAIExtraction(fullText: string): Promise<Product[]> {
  try {
    const prompt = `AGGRESSIVELY extract ANY and ALL products mentioned in this contract, even if formatting is poor:

${fullText.slice(0, 30000)}

Look for:
- Product names (drugs, medications, supplies)
- NDC codes (11 digits, with or without hyphens)
- Strengths (mg, ml, %, etc.)
- ANY pharmaceutical product mentions

Return JSON array with as many products as you can find:
[{"productName": "...", "ndc": "...", "strength": "..."}]

Be aggressive - extract everything that looks like a product!`;

    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0.2, // Slightly higher for aggressive extraction
        maxOutputTokens: 8192,
      },
      output: {
        schema: z.object({
          products: z.array(ProductSchema),
        }),
      },
    });

    return (output as any).products || [];
  } catch (error: any) {
    console.error(`[Aggressive AI] Error:`, error.message);
    return [];
  }
}

/**
 * Deduplicate products
 */
function deduplicateProducts(products: Product[]): Product[] {
  const seen = new Map<string, Product>();

  for (const product of products) {
    // Create key from NDC or product name
    const key = product.ndc || product.productName.toLowerCase().trim();

    if (!seen.has(key)) {
      seen.set(key, product);
    } else {
      // Keep the one with more complete data
      const existing = seen.get(key)!;
      const existingFields = countFields(existing);
      const newFields = countFields(product);

      if (newFields > existingFields) {
        seen.set(key, product);
      }
    }
  }

  return Array.from(seen.values());
}

function countFields(product: Product): number {
  let count = 0;
  if (product.productName) count++;
  if (product.ndc) count++;
  if (product.strength) count++;
  if (product.packageSize) count++;
  if (product.manufacturer) count++;
  if (product.category) count++;
  return count;
}

function formatTableForPrompt(table: ExtractedTable): string {
  const lines: string[] = [];

  if (table.headers.length > 0) {
    lines.push(table.headers.join(' | '));
    lines.push('-'.repeat(80));
  }

  table.rows.forEach(row => {
    lines.push(row.join(' | '));
  });

  return lines.join('\n');
}
