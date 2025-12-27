/**
 * Test Direct Product Extraction
 *
 * Usage:
 *   npx tsx scripts/test-direct-extraction.ts contract_samples/Contract_1.pdf
 *
 * Sends PDF text directly to AI with no complex processing
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse-fork';
import { extractProductsDirect, extractProductsUltraAggressive } from '../src/ai/flows/extract-products-direct';

async function testDirectExtraction(pdfPath: string) {
  console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  DIRECT PRODUCT EXTRACTION TEST                           ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

  console.log(`File: ${pdfPath}\n`);

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found: ${pdfPath}`);
    process.exit(1);
  }

  // Read PDF
  console.log(`Reading PDF...`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`✓ PDF loaded (${pdfBuffer.length} bytes)\n`);

  // Extract text (simple, no tables)
  console.log(`Extracting text...`);
  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text;

  console.log(`✓ Text extracted:`);
  console.log(`  - Pages: ${pdfData.numpages}`);
  console.log(`  - Characters: ${pdfText.length}\n`);

  // Show text sample
  console.log(`Text sample (first 500 chars):`);
  console.log(`${'─'.repeat(60)}`);
  console.log(pdfText.slice(0, 500));
  console.log(`${'─'.repeat(60)}\n`);

  // Try DIRECT extraction first
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  STRATEGY 1: DIRECT EXTRACTION`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  const result1 = await extractProductsDirect({
    pdfText,
    fileName: path.basename(pdfPath),
  });

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  RESULTS - DIRECT EXTRACTION`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  console.log(`Products: ${result1.totalProducts}`);
  console.log(`Notes: ${result1.extractionNotes}\n`);

  if (result1.totalProducts > 0) {
    console.log(`Products found:\n`);
    result1.products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.productName}`);
      if (p.ndc) console.log(`   NDC: ${p.ndc}`);
      if (p.strength) console.log(`   Strength: ${p.strength}`);
      if (p.packageSize) console.log(`   Package: ${p.packageSize}`);
      console.log(`   Source: "${p.sourceQuote.slice(0, 80)}..."`);
      console.log('');
    });

    // Save results
    const outputPath = pdfPath.replace('.pdf', '-direct-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(result1, null, 2));
    console.log(`✅ Results saved to: ${outputPath}\n`);

    console.log(`\n✅ SUCCESS! Products extracted with direct method.\n`);
    return;
  }

  // If no products found, try ULTRA-AGGRESSIVE
  console.log(`\n⚠️  No products found with direct method. Trying ultra-aggressive...\n`);

  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`  STRATEGY 2: ULTRA-AGGRESSIVE EXTRACTION`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  const result2 = await extractProductsUltraAggressive({
    pdfText,
    fileName: path.basename(pdfPath),
  });

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  RESULTS - ULTRA-AGGRESSIVE`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  console.log(`Products: ${result2.totalProducts}`);
  console.log(`Notes: ${result2.extractionNotes}\n`);

  if (result2.totalProducts > 0) {
    console.log(`Products found:\n`);
    result2.products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.productName}`);
      if (p.ndc) console.log(`   NDC: ${p.ndc}`);
      if (p.strength) console.log(`   Strength: ${p.strength}`);
      console.log('');
    });

    const outputPath = pdfPath.replace('.pdf', '-aggressive-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(result2, null, 2));
    console.log(`✅ Results saved to: ${outputPath}\n`);

    console.log(`\n✅ SUCCESS! Products extracted with ultra-aggressive method.\n`);
    return;
  }

  // Still no products
  console.log(`\n❌ NO PRODUCTS FOUND WITH EITHER METHOD\n`);
  console.log(`Possible reasons:`);
  console.log(`  1. PDF contains no product information`);
  console.log(`  2. Products are in images (not extractable text)`);
  console.log(`  3. PDF is encrypted or corrupted`);
  console.log(`  4. Products are referenced externally (e.g., "See Exhibit B")\n`);

  console.log(`Debug info:`);
  console.log(`  - Check if text contains "product", "NDC", "drug": ${/product|ndc|drug/i.test(pdfText) ? 'YES' : 'NO'}`);
  console.log(`  - Check if text contains numbers: ${/\d{5,}/.test(pdfText) ? 'YES' : 'NO'}`);
  console.log(`  - Text length: ${pdfText.length} characters\n`);

  // Save text for manual inspection
  const textPath = pdfPath.replace('.pdf', '-extracted-text.txt');
  fs.writeFileSync(textPath, pdfText);
  console.log(`Full text saved to: ${textPath}`);
  console.log(`Please review the text file to see if products are present.\n`);
}

// Run
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`\nUsage: npx tsx scripts/test-direct-extraction.ts <path-to-contract.pdf>`);
  console.log(`\nExample:`);
  console.log(`  npx tsx scripts/test-direct-extraction.ts contract_samples/Contract_1.pdf\n`);
  process.exit(1);
}

testDirectExtraction(args[0])
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n❌ Test failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  });
