/**
 * Enterprise-Grade PDF Table Extraction and Classification
 *
 * Provides comprehensive table detection, extraction, and classification
 * for healthcare rebate contract documents.
 */

import * as pdfParse from 'pdf-parse-fork';

export interface TableCell {
  row: number;
  col: number;
  text: string;
  x?: number;
  y?: number;
}

export interface ExtractedTable {
  tableIndex: number;
  page: number;
  headers: string[];
  rows: string[][];
  rawData: string[][];
  type: TableType;
  confidence: number;
  columnCount: number;
  rowCount: number;
  context: {
    beforeText: string;
    afterText: string;
    pageText: string;
  };
}

export type TableType =
  | 'products'
  | 'tiers'
  | 'facilities'
  | 'bundles'
  | 'payment_schedule'
  | 'exclusions'
  | 'pricing'
  | 'volume_commitments'
  | 'unknown';

export interface PDFTableExtractionResult {
  tables: ExtractedTable[];
  fullText: string;
  pageCount: number;
  extractionMethod: 'pattern_based' | 'layout_based' | 'hybrid';
  processingTime: number;
}

/**
 * Extract tables from PDF buffer
 */
export async function extractTablesFromPDF(pdfBuffer: Buffer): Promise<PDFTableExtractionResult> {
  const startTime = Date.now();

  try {
    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);
    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;

    console.log(`[Table-Utils] Parsing PDF: ${pageCount} pages, ${fullText.length} characters`);

    // Split into pages (approximate)
    const pages = splitIntoPages(fullText);

    // Extract tables from each page
    const allTables: ExtractedTable[] = [];
    let tableIndex = 0;

    for (let pageNum = 0; pageNum < pages.length; pageNum++) {
      const pageText = pages[pageNum];
      const pageTables = detectTablesInText(pageText, pageNum + 1, tableIndex);

      allTables.push(...pageTables);
      tableIndex += pageTables.length;
    }

    // Classify each table
    const classifiedTables = allTables.map(table => ({
      ...table,
      ...classifyTable(table)
    }));

    const processingTime = Date.now() - startTime;

    console.log(`[Table-Utils] Extracted ${classifiedTables.length} tables in ${processingTime}ms`);
    classifiedTables.forEach(t =>
      console.log(`  - Table ${t.tableIndex}: ${t.type} (${t.rowCount} rows, confidence: ${(t.confidence * 100).toFixed(0)}%)`)
    );

    return {
      tables: classifiedTables,
      fullText,
      pageCount,
      extractionMethod: 'pattern_based',
      processingTime
    };

  } catch (error: any) {
    console.error('[Table-Utils] PDF table extraction failed:', error.message);
    throw error;
  }
}

/**
 * Split text into pages (heuristic-based)
 */
function splitIntoPages(text: string): string[] {
  // Try common page break indicators
  const pageBreakPatterns = [
    /\n\s*Page\s+\d+\s*\n/gi,
    /\n\s*-\s*\d+\s*-\s*\n/gi,
    /\f/g, // Form feed
  ];

  let pages: string[] = [text];

  for (const pattern of pageBreakPatterns) {
    if (pattern.test(text)) {
      pages = text.split(pattern);
      break;
    }
  }

  // If no page breaks found, split by length (approximate)
  if (pages.length === 1 && text.length > 5000) {
    const chunkSize = Math.ceil(text.length / Math.ceil(text.length / 4000));
    pages = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      pages.push(text.slice(i, i + chunkSize));
    }
  }

  return pages;
}

/**
 * Detect tables in text using pattern recognition
 */
function detectTablesInText(pageText: string, pageNum: number, startIndex: number): ExtractedTable[] {
  const tables: ExtractedTable[] = [];

  // Method 1: Detect tables by repeated delimiters
  const delimiterTables = detectDelimiterBasedTables(pageText);

  // Method 2: Detect tables by alignment patterns
  const alignmentTables = detectAlignmentBasedTables(pageText);

  // Method 3: Detect tables by keywords
  const keywordTables = detectKeywordBasedTables(pageText);

  // Merge and deduplicate
  const allDetections = [...delimiterTables, ...alignmentTables, ...keywordTables];
  const uniqueTables = deduplicateTables(allDetections);

  // Convert to ExtractedTable format
  uniqueTables.forEach((detection, idx) => {
    const beforeText = pageText.slice(Math.max(0, detection.startPos - 200), detection.startPos);
    const afterText = pageText.slice(detection.endPos, Math.min(pageText.length, detection.endPos + 200));

    tables.push({
      tableIndex: startIndex + idx,
      page: pageNum,
      headers: detection.data[0] || [],
      rows: detection.data.slice(1),
      rawData: detection.data,
      type: 'unknown',
      confidence: detection.confidence,
      columnCount: detection.data[0]?.length || 0,
      rowCount: detection.data.length - 1,
      context: {
        beforeText: beforeText.trim(),
        afterText: afterText.trim(),
        pageText
      }
    });
  });

  return tables;
}

interface TableDetection {
  data: string[][];
  startPos: number;
  endPos: number;
  confidence: number;
}

/**
 * Detect tables with delimiters (|, \t, multiple spaces)
 */
function detectDelimiterBasedTables(text: string): TableDetection[] {
  const tables: TableDetection[] = [];
  const lines = text.split('\n');

  let currentTable: string[][] = [];
  let tableStartLine = -1;
  let delimiter: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentTable.length > 0) {
        // End of table
        const startPos = text.indexOf(lines[tableStartLine]);
        const endPos = text.indexOf(lines[i - 1]) + lines[i - 1].length;

        tables.push({
          data: currentTable,
          startPos,
          endPos,
          confidence: currentTable.length >= 3 ? 0.8 : 0.5
        });

        currentTable = [];
        tableStartLine = -1;
        delimiter = null;
      }
      continue;
    }

    // Detect delimiter
    const detectedDelimiter = detectLineDelimiter(line);

    if (detectedDelimiter) {
      if (!delimiter) {
        delimiter = detectedDelimiter;
        tableStartLine = i;
      }

      if (delimiter === detectedDelimiter) {
        const cells = line.split(delimiter).map(cell => cell.trim()).filter(cell => cell !== '');
        if (cells.length >= 2) {
          currentTable.push(cells);
        }
      }
    } else if (currentTable.length > 0) {
      // End of table
      const startPos = text.indexOf(lines[tableStartLine]);
      const endPos = text.indexOf(lines[i - 1]) + lines[i - 1].length;

      tables.push({
        data: currentTable,
        startPos,
        endPos,
        confidence: currentTable.length >= 3 ? 0.8 : 0.5
      });

      currentTable = [];
      tableStartLine = -1;
      delimiter = null;
    }
  }

  // Catch last table
  if (currentTable.length > 0) {
    const startPos = text.indexOf(lines[tableStartLine]);
    const endPos = text.length;

    tables.push({
      data: currentTable,
      startPos,
      endPos,
      confidence: currentTable.length >= 3 ? 0.8 : 0.5
    });
  }

  return tables;
}

function detectLineDelimiter(line: string): string | null {
  if (line.includes('|') && line.split('|').length >= 3) return '|';
  if (line.includes('\t') && line.split('\t').length >= 2) return '\t';
  if (/\s{3,}/.test(line)) return /\s{3,}/; // Multiple spaces
  return null;
}

/**
 * Detect tables by alignment patterns
 */
function detectAlignmentBasedTables(text: string): TableDetection[] {
  // This is a simplified version - in production you'd analyze character positions
  return [];
}

/**
 * Detect tables by keywords in surrounding context
 */
function detectKeywordBasedTables(text: string): TableDetection[] {
  const tables: TableDetection[] = [];

  // Table indicators
  const tableKeywords = [
    /product\s+list/i,
    /rebate\s+tier/i,
    /tier\s+structure/i,
    /facility\s+list/i,
    /eligible\s+products/i,
    /pricing\s+schedule/i,
    /payment\s+schedule/i
  ];

  // Find sections with table keywords
  tableKeywords.forEach(pattern => {
    const matches = [...text.matchAll(new RegExp(pattern.source, 'gi'))];

    matches.forEach(match => {
      if (match.index === undefined) return;

      // Extract ~500 chars after keyword
      const sectionStart = match.index;
      const sectionEnd = Math.min(text.length, sectionStart + 1000);
      const section = text.slice(sectionStart, sectionEnd);

      // Try to find table structure in this section
      const sectionTables = detectDelimiterBasedTables(section);

      sectionTables.forEach(table => {
        tables.push({
          ...table,
          startPos: sectionStart + table.startPos,
          endPos: sectionStart + table.endPos,
          confidence: Math.min(1.0, table.confidence + 0.1) // Boost confidence
        });
      });
    });
  });

  return tables;
}

/**
 * Remove duplicate table detections
 */
function deduplicateTables(tables: TableDetection[]): TableDetection[] {
  const unique: TableDetection[] = [];

  for (const table of tables) {
    const isDuplicate = unique.some(existing => {
      // Check if ranges overlap significantly
      const overlapStart = Math.max(existing.startPos, table.startPos);
      const overlapEnd = Math.min(existing.endPos, table.endPos);
      const overlapLength = Math.max(0, overlapEnd - overlapStart);

      const existingLength = existing.endPos - existing.startPos;
      const tableLength = table.endPos - table.startPos;

      const overlapRatio = overlapLength / Math.min(existingLength, tableLength);

      return overlapRatio > 0.7; // 70% overlap = duplicate
    });

    if (!isDuplicate) {
      unique.push(table);
    }
  }

  return unique;
}

/**
 * Classify table type based on headers and content
 */
function classifyTable(table: ExtractedTable): { type: TableType; confidence: number } {
  const headers = table.headers.map(h => h.toLowerCase());
  const allContent = [...headers, ...table.rows.flat()].join(' ').toLowerCase();
  const context = `${table.context.beforeText} ${table.context.afterText}`.toLowerCase();

  let type: TableType = 'unknown';
  let confidence = 0.5;

  // Products table
  if (matchesPattern(headers, allContent, context, {
    headerKeywords: ['ndc', 'product', 'sku', 'item', 'drug', 'name', 'strength', 'package'],
    contentKeywords: ['ndc', 'mg', 'ml', 'tablet', 'capsule', 'injection'],
    contextKeywords: ['product list', 'eligible products', 'covered products'],
    ndcPattern: /\d{5}-\d{3,4}-\d{2}/
  })) {
    type = 'products';
    confidence = 0.9;
  }

  // Tiers table
  else if (matchesPattern(headers, allContent, context, {
    headerKeywords: ['tier', 'level', 'threshold', 'rebate', 'volume', 'percentage', '%'],
    contentKeywords: ['tier', '%', 'rebate', 'volume', 'purchase'],
    contextKeywords: ['rebate tier', 'tier structure', 'volume tier', 'pricing tier'],
    numberPatterns: [/\$[\d,]+/, /\d+\.\d+%/]
  })) {
    type = 'tiers';
    confidence = 0.9;
  }

  // Facilities table
  else if (matchesPattern(headers, allContent, context, {
    headerKeywords: ['facility', 'location', 'site', '340b', 'address', 'id'],
    contentKeywords: ['340b', 'hospital', 'clinic', 'medical center', 'health'],
    contextKeywords: ['facility list', '340b', 'eligible facilities', 'covered entities']
  })) {
    type = 'facilities';
    confidence = 0.85;
  }

  // Bundles/Categories table
  else if (matchesPattern(headers, allContent, context, {
    headerKeywords: ['category', 'class', 'therapeutic', 'minimum', 'requirement', 'bundle'],
    contentKeywords: ['cardiovascular', 'diabetes', 'oncology', 'minimum spend', 'category'],
    contextKeywords: ['category requirement', 'bundle', 'cross-category', 'therapeutic class']
  })) {
    type = 'bundles';
    confidence = 0.85;
  }

  // Payment schedule
  else if (matchesPattern(headers, allContent, context, {
    headerKeywords: ['date', 'payment', 'quarter', 'period', 'due'],
    contentKeywords: ['payment', 'quarter', 'q1', 'q2', 'q3', 'q4', 'due'],
    contextKeywords: ['payment schedule', 'payment terms', 'due dates']
  })) {
    type = 'payment_schedule';
    confidence = 0.8;
  }

  // Exclusions table
  else if (matchesPattern(headers, allContent, context, {
    headerKeywords: ['exclusion', 'excluded', 'carve-out', 'not eligible'],
    contentKeywords: ['medicaid', 'medicare', 'exclude', 'not eligible', 'carve-out'],
    contextKeywords: ['exclusion', 'excluded', 'not eligible', 'carve-out']
  })) {
    type = 'exclusions';
    confidence = 0.8;
  }

  return { type, confidence };
}

interface PatternMatchConfig {
  headerKeywords: string[];
  contentKeywords: string[];
  contextKeywords: string[];
  ndcPattern?: RegExp;
  numberPatterns?: RegExp[];
}

function matchesPattern(
  headers: string[],
  content: string,
  context: string,
  config: PatternMatchConfig
): boolean {
  let score = 0;

  // Check headers
  const headerMatches = config.headerKeywords.filter(keyword =>
    headers.some(h => h.includes(keyword))
  ).length;
  score += headerMatches * 2; // Headers weighted more heavily

  // Check content
  const contentMatches = config.contentKeywords.filter(keyword =>
    content.includes(keyword)
  ).length;
  score += contentMatches;

  // Check context
  const contextMatches = config.contextKeywords.filter(keyword =>
    context.includes(keyword)
  ).length;
  score += contextMatches * 1.5;

  // Check special patterns
  if (config.ndcPattern && config.ndcPattern.test(content)) {
    score += 3;
  }

  if (config.numberPatterns) {
    const patternMatches = config.numberPatterns.filter(p => p.test(content)).length;
    score += patternMatches * 1.5;
  }

  // Threshold for match
  return score >= 3;
}

/**
 * Format table as text for AI consumption
 */
export function formatTableForAI(table: ExtractedTable): string {
  const lines: string[] = [];

  // Add context
  if (table.context.beforeText) {
    lines.push(`Context before table: "${table.context.beforeText.slice(-100)}"`);
  }

  lines.push('');
  lines.push(`Table ${table.tableIndex} (Page ${table.page}, Type: ${table.type})`);
  lines.push('='.repeat(80));

  // Add headers
  if (table.headers.length > 0) {
    lines.push(table.headers.join(' | '));
    lines.push('-'.repeat(80));
  }

  // Add rows
  table.rows.forEach(row => {
    lines.push(row.join(' | '));
  });

  lines.push('='.repeat(80));

  if (table.context.afterText) {
    lines.push(`Context after table: "${table.context.afterText.slice(0, 100)}"`);
  }

  return lines.join('\n');
}
