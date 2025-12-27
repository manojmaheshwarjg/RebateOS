/**
 * PDF Content Debugger
 *
 * Usage:
 *   npx tsx scripts/debug-pdf-content.ts [contract-file.pdf]
 *
 * Shows what's extracted from the PDF to help debug extraction issues
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractTablesFromPDF } from '../src/lib/table-utils';

async function debugPDFContent(pdfPath: string) {
  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  PDF CONTENT DEBUGGER                                     ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  console.log(`File: ${pdfPath}\n`);

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found: ${pdfPath}`);
    process.exit(1);
  }

  // Read PDF
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`PDF size: ${pdfBuffer.length} bytes\n`);

  // Extract content
  console.log(`Extracting content...\n`);
  const pdfData = await extractTablesFromPDF(pdfBuffer);

  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  BASIC INFO                                               ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  console.log(`Pages: ${pdfData.pageCount}`);
  console.log(`Text Length: ${pdfData.fullText.length} characters`);
  console.log(`Tables Found: ${pdfData.tables.length}`);
  console.log(`Extraction Method: ${pdfData.extractionMethod}\n`);

  // Show tables
  if (pdfData.tables.length > 0) {
    console.log(`╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║  TABLES                                                   ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

    pdfData.tables.forEach(table => {
      console.log(`Table ${table.tableIndex}:`);
      console.log(`  Type: ${table.type}`);
      console.log(`  Rows: ${table.rowCount}`);
      console.log(`  Columns: ${table.columnCount}`);
      console.log(`  Confidence: ${(table.confidence * 100).toFixed(0)}%`);
      console.log(`  Page: ${table.page}`);

      if (table.headers.length > 0) {
        console.log(`  Headers: ${table.headers.join(' | ')}`);
      }

      console.log(`  Sample rows (first 3):`);
      table.rows.slice(0, 3).forEach((row, idx) => {
        console.log(`    ${idx + 1}. ${row.join(' | ')}`);
      });

      if (table.context.beforeText) {
        console.log(`  Context before: "${table.context.beforeText.slice(-80)}"`);
      }
      if (table.context.afterText) {
        console.log(`  Context after: "${table.context.afterText.slice(0, 80)}"`);
      }

      console.log(``);
    });
  } else {
    console.log(`⚠️  No tables detected\n`);
  }

  // Search for product-related keywords
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  KEYWORD SEARCH                                           ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  const keywords = [
    { keyword: 'NDC', pattern: /NDC/gi },
    { keyword: 'Product', pattern: /product/gi },
    { keyword: 'Drug', pattern: /drug/gi },
    { keyword: 'Item', pattern: /item/gi },
    { keyword: 'SKU', pattern: /SKU/gi },
    { keyword: 'Strength (mg)', pattern: /\d+\s*mg/gi },
    { keyword: 'Strength (ml)', pattern: /\d+\s*ml/gi },
    { keyword: 'Tablet', pattern: /tablet/gi },
    { keyword: 'Capsule', pattern: /capsule/gi },
    { keyword: 'Vial', pattern: /vial/gi },
  ];

  keywords.forEach(({ keyword, pattern }) => {
    const matches = pdfData.fullText.match(pattern) || [];
    console.log(`${keyword}: ${matches.length} occurrences`);
    if (matches.length > 0 && matches.length <= 5) {
      console.log(`  Examples: ${matches.slice(0, 5).join(', ')}`);
    }
  });

  console.log(``);

  // Search for NDC patterns
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  NDC PATTERN SEARCH                                       ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  const ndcPatterns = [
    { name: 'Standard NDC (XXXXX-XXXX-XX)', pattern: /\b\d{5}-\d{4}-\d{2}\b/g },
    { name: 'Alternative NDC (XXXXX-XXX-XX)', pattern: /\b\d{5}-\d{3}-\d{2}\b/g },
    { name: '11-digit without hyphens', pattern: /\b\d{11}\b/g },
    { name: '10-digit without hyphens', pattern: /\b\d{10}\b/g },
  ];

  let totalNDCs = 0;
  const allNDCs: string[] = [];

  ndcPatterns.forEach(({ name, pattern }) => {
    const matches = pdfData.fullText.match(pattern) || [];
    totalNDCs += matches.length;
    allNDCs.push(...matches);

    console.log(`${name}: ${matches.length} found`);
    if (matches.length > 0 && matches.length <= 10) {
      console.log(`  Examples: ${matches.slice(0, 5).join(', ')}`);
    }
  });

  console.log(`\nTotal NDC-like patterns: ${totalNDCs}`);

  if (totalNDCs > 0) {
    console.log(`✅ NDCs found in document - product extraction should work!`);
  } else {
    console.log(`⚠️  No NDC patterns found - document may not contain product codes`);
  }

  console.log(``);

  // Show text sample
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  TEXT SAMPLE (first 2000 characters)                      ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  console.log(pdfData.fullText.slice(0, 2000));
  console.log(`\n... (${pdfData.fullText.length - 2000} more characters)\n`);

  // Search for product sections
  console.log(`╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  PRODUCT SECTION DETECTION                                ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  const sectionKeywords = [
    'product list',
    'eligible products',
    'covered products',
    'ndc list',
    'exhibit a',
    'schedule a',
    'appendix',
  ];

  sectionKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = pdfData.fullText.match(regex) || [];
    if (matches.length > 0) {
      console.log(`✓ "${keyword}": ${matches.length} occurrence(s)`);

      // Find context
      const index = pdfData.fullText.toLowerCase().indexOf(keyword.toLowerCase());
      if (index !== -1) {
        const context = pdfData.fullText.slice(index, index + 200);
        console.log(`  Context: "${context}..."`);
      }
    }
  });

  console.log(``);

  // Save full text to file
  const outputPath = pdfPath.replace('.pdf', '-fulltext.txt');
  fs.writeFileSync(outputPath, pdfData.fullText);
  console.log(`Full text saved to: ${outputPath}`);

  // Save debug info to JSON
  const debugPath = pdfPath.replace('.pdf', '-debug.json');
  fs.writeFileSync(debugPath, JSON.stringify({
    pageCount: pdfData.pageCount,
    textLength: pdfData.fullText.length,
    tablesCount: pdfData.tables.length,
    tables: pdfData.tables.map(t => ({
      tableIndex: t.tableIndex,
      type: t.type,
      rows: t.rowCount,
      columns: t.columnCount,
      confidence: t.confidence,
      headers: t.headers,
      sampleRows: t.rows.slice(0, 3),
    })),
    ndcPatterns: allNDCs,
    totalNDCs: totalNDCs,
  }, null, 2));
  console.log(`Debug info saved to: ${debugPath}\n`);
}

// Run debugger
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`\nUsage: npx tsx scripts/debug-pdf-content.ts <path-to-contract.pdf>`);
  console.log(`\nExample:`);
  console.log(`  npx tsx scripts/debug-pdf-content.ts contract_samples/Contract_1.pdf\n`);
  process.exit(1);
}

const pdfPath = args[0];

debugPDFContent(pdfPath)
  .then(() => {
    console.log(`Debug complete!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Debug failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  });
