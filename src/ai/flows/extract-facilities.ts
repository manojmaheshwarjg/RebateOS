'use server';

/**
 * @fileOverview AI flow for extracting facility information from contracts
 *
 * Extracts 340B facilities, covered entities, and eligible locations
 */

import { z } from 'genkit';
import { generateWithGroq } from '@/ai/ai-fallback';
import { FACILITIES_TABLE_PROMPT } from '@/ai/prompts/table-prompts';
import type { ExtractedTable } from '@/lib/table-utils';
import { formatTableForAI } from '@/lib/table-utils';

const FacilitySchema = z.object({
  facilityName: z.string().describe('Full facility name'),
  facilityDBA: z.string().nullable().describe('Doing Business As name'),
  streetAddress: z.string().nullable().describe('Street address'),
  city: z.string().nullable().describe('City'),
  state: z.string().nullable().describe('State abbreviation'),
  zipCode: z.string().nullable().describe('ZIP code'),
  facility340BId: z.string().nullable().describe('340B identification number'),
  facilityType: z.string().nullable().describe('Type of facility (340B, DSH, FQHC, etc.)'),
  deaNumber: z.string().nullable().describe('DEA registration number'),
  hin: z.string().nullable().describe('Health Industry Number'),
  status: z.string().nullable().describe('Active, Pending, Terminated'),
  effectiveDate: z.string().nullable().describe('Date facility became eligible'),
  terminationDate: z.string().nullable().describe('Date facility was removed'),
  specialConditions: z.string().nullable().describe('Special conditions or restrictions'),
  sourceQuote: z.string().describe('Exact text from document'),
  sourcePage: z.number().nullable().describe('Page number where found'),
});

const FacilitiesDataSchema = z.object({
  facilities: z.array(FacilitySchema).describe('All facilities extracted'),
  totalFacilities: z.number().describe('Total count of facilities'),
  has340BEntities: z.boolean().describe('Whether any 340B entities present'),
  extractionConfidence: z.number().min(0).max(1).describe('Confidence score'),
  extractionNotes: z.string().describe('Notes about extraction quality'),
});

export type FacilityData = z.infer<typeof FacilitySchema>;
export type FacilitiesData = z.infer<typeof FacilitiesDataSchema>;

export interface ExtractFacilitiesInput {
  tables: ExtractedTable[];
  fullText: string;
}

/**
 * Extract facilities from tables
 */
export async function extractFacilities(input: ExtractFacilitiesInput): Promise<FacilitiesData> {
  console.log('[Facilities] Starting extraction from tables...');

  // Find facility tables
  const facilityTables = input.tables.filter(t => t.type === 'facilities');

  if (facilityTables.length === 0) {
    console.log('[Facilities] No facility tables found, checking full text...');

    // Try extracting from full text
    return await extractFacilitiesFromText(input.fullText);
  }

  // Process each facility table
  const allFacilities: FacilityData[] = [];

  for (const table of facilityTables) {
    console.log(`[Facilities] Processing table ${table.tableIndex} (${table.rowCount} rows)...`);

    const tableText = formatTableForAI(table);
    const prompt = `${FACILITIES_TABLE_PROMPT}\n\n${tableText}`;

    const { output } = await generateWithGroq({
      prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
      output: {
        schema: FacilitiesDataSchema,
      },
    });

    const facilitiesData = output as FacilitiesData;
    allFacilities.push(...facilitiesData.facilities);

    console.log(`[Facilities] Extracted ${facilitiesData.facilities.length} facilities from table ${table.tableIndex}`);
  }

  return {
    facilities: allFacilities,
    totalFacilities: allFacilities.length,
    has340BEntities: allFacilities.some(f => f.facility340BId !== null),
    extractionConfidence: facilityTables.length > 0 ? 0.9 : 0.6,
    extractionNotes: `Extracted from ${facilityTables.length} facility table(s)`,
  };
}

/**
 * Fallback: Extract facilities from full text if no tables found
 */
async function extractFacilitiesFromText(fullText: string): Promise<FacilitiesData> {
  console.log('[Facilities] Attempting text-based extraction...');

  // Look for facility-related sections
  const facilityKeywords = ['facility', 'covered entity', '340b', 'location', 'site'];
  const sections: string[] = [];

  for (const keyword of facilityKeywords) {
    const regex = new RegExp(`(${keyword}[\\s\\S]{0,1000})`, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      sections.push(...matches);
    }
  }

  if (sections.length === 0) {
    console.log('[Facilities] No facility mentions found in text');
    return {
      facilities: [],
      totalFacilities: 0,
      has340BEntities: false,
      extractionConfidence: 0,
      extractionNotes: 'No facility information found in document',
    };
  }

  // Extract from sections
  const combinedSections = sections.join('\n\n');
  const prompt = `${FACILITIES_TABLE_PROMPT}\n\nDocument sections mentioning facilities:\n\n${combinedSections.slice(0, 15000)}`;

  const { output } = await generateWithGroq({
    prompt,
    config: {
      temperature: 0,
      maxOutputTokens: 8192,
    },
    output: {
      schema: FacilitiesDataSchema,
    },
  });

  const facilitiesData = output as FacilitiesData;

  console.log(`[Facilities] Text-based extraction found ${facilitiesData.facilities.length} facilities`);

  return {
    ...facilitiesData,
    extractionConfidence: Math.min(facilitiesData.extractionConfidence, 0.7), // Lower confidence for text-based
  };
}
