/**
 * Simple Direct Product Extraction Test (JavaScript)
 * 
 * Usage: node scripts/test-simple-extraction.js contract_samples/Contract_1.pdf
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse-fork');
const Groq = require('groq-sdk').default;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

async function testSimpleExtraction(pdfPath) {
    console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║  SIMPLE DIRECT PRODUCT EXTRACTION TEST                    ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

    console.log(`File: ${pdfPath}\n`);

    // Check file exists
    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ File not found: ${pdfPath}`);
        process.exit(1);
    }

    // Read and extract text from PDF
    console.log(`Reading PDF...`);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    console.log(`✓ PDF loaded:`);
    console.log(`  - Pages: ${pdfData.numpages}`);
    console.log(`  - Characters: ${pdfText.length}\n`);

    // Show sample
    console.log(`Text sample (first 300 chars):`);
    console.log(`${'─'.repeat(60)}`);
    console.log(pdfText.slice(0, 300));
    console.log(`${'─'.repeat(60)}\n`);

    // Truncate if too long
    const maxChars = 50000;
    const textToAnalyze = pdfText.length > maxChars ? pdfText.slice(0, maxChars) : pdfText;

    if (pdfText.length > maxChars) {
        console.log(`⚠️  Text truncated to ${maxChars} characters\n`);
    }

    // Create prompt
    const prompt = `You are extracting pharmaceutical products from a contract document.

**YOUR TASK:**
Extract EVERY product mentioned in this contract. Look for:
- Product names (drugs, medications, medical supplies)
- NDC codes (National Drug Codes - usually 11 digits like 12345-6789-01)
- Strengths (like 25mg, 100ml, 5%)
- Package sizes (like "100 tablets", "30-day supply")
- Manufacturers (pharmaceutical companies)
- Categories (therapeutic categories)

**CRITICAL RULES:**
1. Extract EVERY product you find - don't skip any
2. NDC codes: Look for 11-digit codes with or without hyphens
3. If you find a product name but no NDC, still include it
4. Extract products from tables, lists, or anywhere in the text
5. For sourceQuote: Copy the exact text where you found the product

**OUTPUT FORMAT:**
Return ONLY valid JSON (no markdown, no code blocks):

{
  "products": [
    {
      "productName": "CardioCare Tablets",
      "ndc": "12345-6789-01",
      "strength": "25mg",
      "packageSize": "100 tablets",
      "manufacturer": "PharmaCorp",
      "category": "Cardiovascular",
      "sourceQuote": "CardioCare Tablets 25mg, NDC 12345-6789-01"
    }
  ],
  "totalProducts": 1,
  "extractionNotes": "Found products in product list table"
}

**CONTRACT TEXT:**

${textToAnalyze}

**NOW EXTRACT ALL PRODUCTS AND RETURN JSON:**`;

    // Call Groq
    console.log(`Sending to Groq LLaMA...`);
    console.log(`Model: llama-3.3-70b-versatile\n`);

    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert pharmaceutical contract analyst. Always respond with valid JSON when extracting structured data. Never include markdown formatting."
                },
                {
                    role: "user",
                    content: prompt,
                }
            ],
            temperature: 0,
            max_tokens: 8192,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content || '';

        console.log(`✅ Groq responded\n`);

        // Parse JSON
        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            console.error(`❌ Failed to parse JSON:`, parseError.message);
            console.log(`\nRaw response:`);
            console.log(content.substring(0, 500));
            process.exit(1);
        }

        // Display results
        console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
        console.log(`║  EXTRACTION RESULTS                                       ║`);
        console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

        console.log(`Products found: ${result.totalProducts || result.products?.length || 0}`);
        console.log(`Notes: ${result.extractionNotes || 'N/A'}\n`);

        if (result.products && result.products.length > 0) {
            console.log(`Products:\n`);
            result.products.forEach((p, idx) => {
                console.log(`${idx + 1}. ${p.productName}`);
                if (p.ndc) console.log(`   NDC: ${p.ndc}`);
                if (p.strength) console.log(`   Strength: ${p.strength}`);
                if (p.packageSize) console.log(`   Package: ${p.packageSize}`);
                if (p.manufacturer) console.log(`   Manufacturer: ${p.manufacturer}`);
                if (p.sourceQuote) console.log(`   Source: "${p.sourceQuote.substring(0, 60)}..."`);
                console.log('');
            });

            // Save results
            const outputPath = pdfPath.replace('.pdf', '-simple-extraction.json');
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            console.log(`✅ Results saved to: ${outputPath}\n`);
            console.log(`\n✅ SUCCESS!\n`);
        } else {
            console.log(`❌ No products found\n`);
            console.log(`Full response:`);
            console.log(JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error(`\n❌ Groq API error:`, error.message);
        if (error.status) console.error(`Status: ${error.status}`);
        process.exit(1);
    }
}

// Run test
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`\nUsage: node scripts/test-simple-extraction.js <path-to-contract.pdf>`);
    console.log(`\nExample:`);
    console.log(`  node scripts/test-simple-extraction.js contract_samples/Contract_1.pdf\n`);
    process.exit(1);
}

testSimpleExtraction(args[0])
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`\n❌ Test failed:`, error.message);
        console.error(error.stack);
        process.exit(1);
    });
