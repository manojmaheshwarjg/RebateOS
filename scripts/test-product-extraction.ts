/**
 * Standalone Product Extraction Test
 *
 * Usage:
 *   npx tsx scripts/test-product-extraction.ts [contract-file.pdf]
 *
 * Tests bulletproof product extraction on a PDF file
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractTablesFromPDF } from '../src/lib/table-utils';
import { extractProductsBulletproof } from '../src/ai/flows/extract-products-bulletproof';

async function testProductExtraction(pdfPath: string) {
  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  PRODUCT EXTRACTION TEST                                  ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  console.log(`File: ${pdfPath}`);

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found: ${pdfPath}`);
    process.exit(1);
  }

  // Read PDF
  console.log(`Reading PDF...`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`✓ PDF loaded (${pdfBuffer.length} bytes)\n`);

  // Extract tables and text
  console.log(`Extracting tables and text...`);
  const pdfData = await extractTablesFromPDF(pdfBuffer);

  console.log(`✓ PDF parsed:`);
  console.log(`  - Pages: ${pdfData.pageCount}`);
  console.log(`  - Text length: ${pdfData.fullText.length} characters`);
  console.log(`  - Tables found: ${pdfData.tables.length}`);

  if (pdfData.tables.length > 0) {
    console.log(`\n  Tables:`);
    pdfData.tables.forEach(t => {
      console.log(`    • Table ${t.tableIndex}: ${t.type} (${t.rowCount} rows, ${t.columnCount} cols, confidence: ${(t.confidence * 100).toFixed(0)}%)`);
    });
  }

  console.log(``);

  // Extract products
  console.log(`Extracting products with bulletproof extraction...`);

  const result = await extractProductsBulletproof({
    fullText: pdfData.fullText,
    tables: pdfData.tables,
    fileName: path.basename(pdfPath),
  });

  // Display results
  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  RESULTS                                                  ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  console.log(`Extraction Method: ${result.extractionMethod}`);
  console.log(`Products Found: ${result.totalProducts}`);
  console.log(`Confidence: ${(result.extractionConfidence * 100).toFixed(0)}%`);
  console.log(`Notes: ${result.extractionNotes}`);

  if (result.totalProducts > 0) {
    console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║  PRODUCTS                                                 ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

    result.products.forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.productName}`);
      if (product.ndc) console.log(`   NDC: ${product.ndc}`);
      if (product.strength) console.log(`   Strength: ${product.strength}`);
      if (product.packageSize) console.log(`   Package: ${product.packageSize}`);
      if (product.manufacturer) console.log(`   Manufacturer: ${product.manufacturer}`);
      if (product.category) console.log(`   Category: ${product.category}`);
      console.log(`   Source: "${product.sourceQuote.slice(0, 100)}..."`);
      console.log(``);
    });

    // Summary by NDC
    const withNDC = result.products.filter(p => p.ndc).length;
    const withStrength = result.products.filter(p => p.strength).length;
    const withPackage = result.products.filter(p => p.packageSize).length;

    console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║  SUMMARY                                                  ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

    console.log(`Total Products: ${result.totalProducts}`);
    console.log(`  - With NDC: ${withNDC} (${((withNDC / result.totalProducts) * 100).toFixed(0)}%)`);
    console.log(`  - With Strength: ${withStrength} (${((withStrength / result.totalProducts) * 100).toFixed(0)}%)`);
    console.log(`  - With Package Size: ${withPackage} (${((withPackage / result.totalProducts) * 100).toFixed(0)}%)`);

    console.log(`\n✅ Product extraction successful!\n`);
  } else {
    console.log(`\n⚠️  No products found!`);
    console.log(`\nDebugging suggestions:`);
    console.log(`  1. Check if PDF contains product information`);
    console.log(`  2. Review table detection (tables found: ${pdfData.tables.length})`);
    console.log(`  3. Search for NDC patterns in text manually`);
    console.log(`  4. Check if products are in a separate exhibit/attachment`);
    console.log(``);
  }

  // Save results to JSON
  const outputPath = pdfPath.replace('.pdf', '-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Results saved to: ${outputPath}\n`);
}

// Run test
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`\nUsage: npx tsx scripts/test-product-extraction.ts <path-to-contract.pdf>`);
  console.log(`\nExample:`);
  console.log(`  npx tsx scripts/test-product-extraction.ts contract_samples/Contract_1.pdf\n`);
  process.exit(1);
}

const pdfPath = args[0];

testProductExtraction(pdfPath)
  .then(() => {
    console.log(`Test complete!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Test failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  });
