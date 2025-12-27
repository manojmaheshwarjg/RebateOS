'use server';

/**
 * @fileOverview AI flow for extracting bundle/category requirements from contracts
 *
 * Extracts cross-category minimums, therapeutic class requirements, and bundle incentives
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';
import { BUNDLES_TABLE_PROMPT } from '@/ai/prompts/table-prompts';
import type { ExtractedTable } from '@/lib/table-utils';
import { formatTableForAI } from '@/lib/table-utils';

const BundleSchema = z.object({
  categoryName: z.string().describe('Category or bundle name'),
  bundleType: z
    .enum(['therapeutic_category', 'product_family', 'cross_category', 'volume_based', 'other'])
    .describe('Type of bundle requirement'),
  minimumSpend: z.number().nullable().describe('Minimum dollar amount required'),
  minimumPercentage: z.number().nullable().describe('Minimum percentage of total volume'),
  minimumUnits: z.number().nullable().describe('Minimum unit count'),
  measurementPeriod: z.string().describe('Annual, Quarterly, etc.'),
  qualifyingProducts: z.string().describe('Which products count toward bundle'),
  bundleIncentive: z.string().nullable().describe('Reward for achieving bundle (rebate, bonus, etc.)'),
  requiredCompliance: z.string().nullable().describe('Compliance requirements'),
  stacksWithTiers: z.boolean().describe('Whether bundle incentive combines with tier rebates'),
  sourceQuote: z.string().describe('Exact text from document'),
  sourcePage: z.number().nullable().describe('Page number'),
});

const BundlesDataSchema = z.object({
  bundles: z.array(BundleSchema).describe('All bundle requirements'),
  totalBundles: z.number().describe('Total count'),
  bundlesAreRequired: z.boolean().describe('Whether bundles are mandatory or optional'),
  extractionConfidence: z.number().min(0).max(1).describe('Confidence score'),
  extractionNotes: z.string().describe('Extraction quality notes'),
});

export type BundleData = z.infer<typeof BundleSchema>;
export type BundlesData = z.infer<typeof BundlesDataSchema>;

export interface ExtractBundlesInput {
  tables: ExtractedTable[];
  fullText: string;
}

/**
 * Extract bundle requirements from tables
 */
export async function extractBundles(input: ExtractBundlesInput): Promise<BundlesData> {
  console.log('[Bundles] Starting extraction from tables...');

  // Find bundle tables
  const bundleTables = input.tables.filter(t => t.type === 'bundles' || t.type === 'volume_commitments');

  if (bundleTables.length === 0) {
    console.log('[Bundles] No bundle tables found, checking full text...');
    return await extractBundlesFromText(input.fullText);
  }

  // Process each bundle table
  const allBundles: BundleData[] = [];

  for (const table of bundleTables) {
    console.log(`[Bundles] Processing table ${table.tableIndex} (${table.rowCount} rows)...`);

    const tableText = formatTableForAI(table);
    const prompt = `${BUNDLES_TABLE_PROMPT}\n\n${tableText}`;

    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
      output: {
        schema: BundlesDataSchema,
      },
    });

    const bundlesData = output as BundlesData;
    allBundles.push(...bundlesData.bundles);

    console.log(`[Bundles] Extracted ${bundlesData.bundles.length} bundles from table ${table.tableIndex}`);
  }

  return {
    bundles: allBundles,
    totalBundles: allBundles.length,
    bundlesAreRequired: allBundles.some(b => b.requiredCompliance !== null),
    extractionConfidence: bundleTables.length > 0 ? 0.85 : 0.6,
    extractionNotes: `Extracted from ${bundleTables.length} bundle/category table(s)`,
  };
}

/**
 * Fallback: Extract bundles from full text
 */
async function extractBundlesFromText(fullText: string): Promise<BundlesData> {
  console.log('[Bundles] Attempting text-based extraction...');

  // Look for bundle-related sections
  const bundleKeywords = [
    'category requirement',
    'minimum spend',
    'therapeutic class',
    'cross-category',
    'bundle bonus',
    'category minimum',
    'product mix',
  ];

  const sections: string[] = [];

  for (const keyword of bundleKeywords) {
    const regex = new RegExp(`(${keyword}[\\s\\S]{0,800})`, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      sections.push(...matches);
    }
  }

  if (sections.length === 0) {
    console.log('[Bundles] No bundle requirements found in text');
    return {
      bundles: [],
      totalBundles: 0,
      bundlesAreRequired: false,
      extractionConfidence: 0,
      extractionNotes: 'No bundle requirements found in document',
    };
  }

  // Extract from sections
  const combinedSections = sections.join('\n\n');
  const prompt = `${BUNDLES_TABLE_PROMPT}\n\nDocument sections mentioning bundles/categories:\n\n${combinedSections.slice(0, 15000)}`;

  const { output } = await generateWithGroq({
    prompt,
    config: {
      temperature: 0,
      maxOutputTokens: 8192,
    },
    output: {
      schema: BundlesDataSchema,
    },
  });

  const bundlesData = output as BundlesData;

  console.log(`[Bundles] Text-based extraction found ${bundlesData.bundles.length} bundles`);

  return {
    ...bundlesData,
    extractionConfidence: Math.min(bundlesData.extractionConfidence, 0.7),
  };
}
