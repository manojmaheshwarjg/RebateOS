# Product Extraction - Bulletproof & Debug Guide

## Overview

The **bulletproof product extraction system** uses **5 fallback strategies** to ensure products are extracted no matter what format they're in.

---

## 🎯 Quick Test

### Test Product Extraction on Your Contract

```bash
npx tsx scripts/test-product-extraction.ts contract_samples/Contract_1.pdf
```

This will:
1. Extract tables and text from the PDF
2. Try all 5 extraction strategies
3. Show you exactly what products were found
4. Save results to JSON file

---

## 🔍 Debug What's in Your PDF

If products aren't being extracted, first check what's in the PDF:

```bash
npx tsx scripts/debug-pdf-content.ts contract_samples/Contract_1.pdf
```

This will show you:
- How many tables were detected
- What's in each table
- NDC patterns found in text
- Product-related keywords
- Sample text from PDF
- Full text saved to file

---

## 🛡️ 5-Strategy Extraction Cascade

The bulletproof extractor tries these strategies in order until products are found:

### Strategy 1: Table-Based Extraction (Confidence: 95%)
- **What it does**: Looks for tables classified as "products"
- **When it works**: PDF has product tables with clear structure
- **Output**: Extracts all rows from product tables

### Strategy 2: NDC Pattern Matching (Confidence: 90%)
- **What it does**: Scans ALL tables for NDC codes (even if not classified as product tables)
- **When it works**: Product data is in a table but wasn't classified correctly
- **Output**: Extracts from any table containing NDC patterns

### Strategy 3: Text-Based NDC Search (Confidence: 85%)
- **What it does**: Finds NDC codes anywhere in the text and extracts context around them
- **Patterns matched**:
  - `12345-6789-01` (standard with hyphens)
  - `12345-678-90` (alternative format)
  - `12345678901` (11 digits without hyphens)
  - `1234567890` (10 digits without hyphens)
- **When it works**: Products listed in text, not tables
- **Output**: Product info from text surrounding each NDC

### Strategy 4: Product Section Extraction (Confidence: 80%)
- **What it does**: Looks for sections with keywords like "Product List", "Eligible Products", "NDC List", "Exhibit A"
- **When it works**: Products are in a dedicated section
- **Output**: All products from identified sections

### Strategy 5: Line-by-Line Parsing (Confidence: 70%)
- **What it does**: Parses each line looking for product-like patterns
- **Patterns**: Lines containing NDCs, strengths (mg/ml), product keywords
- **When it works**: Products listed line-by-line without table structure
- **Output**: Products from matching lines

### Strategy 6: Aggressive AI Extraction (Confidence: 60%)
- **What it does**: Asks AI to aggressively extract anything that looks like a product
- **When it works**: Last resort for poorly formatted documents
- **Output**: All product mentions found by AI

---

## 📊 Understanding Output

### Successful Extraction

```
╔════════════════════════════════════════════════════════════╗
║  EXTRACTION COMPLETE                                       ║
╚════════════════════════════════════════════════════════════╝
  Method: table-based
  Products: 12
  Confidence: 95%
  Notes: Found 12 products in 1 table(s)
```

**This is what you want to see!** Products were found using the most reliable method.

### Method Indicators

- **table-based**: ✅ Best - Found in product tables
- **table-ndc-scan**: ✅ Good - Found in tables via NDC search
- **ndc-pattern-matching**: ⚠️ OK - Found via text NDC search
- **section-based**: ⚠️ OK - Found in product sections
- **line-by-line**: ⚠️ Fallback - Parsed from lines
- **aggressive-ai**: ⚠️ Last resort - AI extracted from unstructured text
- **none**: ❌ Failed - No products found

---

## 🔧 Troubleshooting

### Issue: "0 products extracted"

**Step 1: Debug PDF content**

```bash
npx tsx scripts/debug-pdf-content.ts your-contract.pdf
```

Look for:
- **Tables count**: Should be > 0 if products are in tables
- **NDC patterns**: Should show NDC codes if present
- **Keywords**: Should find "product", "NDC", "drug", etc.

**Step 2: Check what was found**

The debug script shows:
```
NDC PATTERN SEARCH
Standard NDC (XXXXX-XXXX-XX): 12 found
  Examples: 12345-6789-01, 54321-1111-22, ...
```

If NDCs are found but products aren't extracted → **File a bug report**

**Step 3: Manual inspection**

Check the saved files:
- `your-contract-fulltext.txt` - Full extracted text
- `your-contract-debug.json` - Debug info with all tables

Look for:
- Are products actually in the text?
- Are they in a table or free text?
- What format are they in?

---

### Issue: "Products extracted but missing data"

**Example:**
```json
{
  "productName": "Lisinopril",
  "ndc": null,        // ← Missing
  "strength": null    // ← Missing
}
```

**Causes:**
1. **Table doesn't have columns for NDC/strength**
   - Solution: Products extracted correctly, data just isn't in source
2. **Data is in different columns**
   - Solution: AI should handle this, but may need prompt tuning
3. **OCR quality is poor** (scanned PDF)
   - Solution: See OCR troubleshooting below

**Fix:**
Check the `sourceQuote` field to see what text was used:
```json
{
  "sourceQuote": "Lisinopril 10mg 100 tablets"
}
```

If NDC/strength ARE in the quote but not extracted → **File a bug report with the quote**

---

### Issue: "Duplicate products"

The system automatically deduplicates, but if you see duplicates:

**Deduplication logic:**
- Products with same NDC → Keep one
- Products with same name (case-insensitive) → Keep one with more data

If duplicates persist → **File a bug report**

---

### Issue: "Wrong products extracted" (hallucination)

**Example:** AI invents products that aren't in the document

**Check:**
```bash
grep -i "ProductName" your-contract-fulltext.txt
```

If the product name doesn't appear in the text → **AI hallucination**

**Workaround:**
- Set `temperature: 0` in AI config (already done)
- Use table-based extraction only (highest confidence)
- Manually review low-confidence extractions

---

## 📈 Expected Results

### Contract 1 (Sample)

**Expected:**
- **Products**: 12
- **Method**: table-based or table-ndc-scan
- **Confidence**: 90%+
- **With NDC**: 12/12 (100%)
- **With Strength**: 10/12 (83%)

**Command:**
```bash
npx tsx scripts/test-product-extraction.ts contract_samples/Contract_1.pdf
```

---

## 🧪 Testing Strategy

### 1. Test All Samples

```bash
npx tsx scripts/test-product-extraction.ts contract_samples/Contract_1.pdf
npx tsx scripts/test-product-extraction.ts contract_samples/Contract_2.pdf
npx tsx scripts/test-product-extraction.ts contract_samples/Contract_3.pdf
```

### 2. Check Results

Each test creates a JSON file with results:
- `Contract_1-products.json`
- `Contract_2-products.json`
- `Contract_3-products.json`

### 3. Validate Extraction

For each contract, verify:
- [ ] Product count matches expected
- [ ] All products have names
- [ ] NDCs are present (if in source)
- [ ] Strengths are extracted (if in source)
- [ ] No hallucinated products
- [ ] No major duplicates

---

## 🔬 Advanced Debugging

### Enable Verbose Logging

The bulletproof extractor already has extensive logging. To see more:

```typescript
// In extract-products-bulletproof.ts, all console.log statements show:
// - Which strategy is running
// - What was found
// - Extraction results
```

### Test Individual Strategies

You can test a specific strategy by modifying the code:

```typescript
// Test only table-based extraction
const result = await extractFromTable(tables[0]);

// Test only NDC pattern matching
const ndcMatches = findNDCPatterns(fullText);
const result = await extractFromNDCPatterns(fullText, ndcMatches);
```

### Check AI Prompts

All prompts are in `extract-products-bulletproof.ts`. You can modify them to:
- Add more context
- Change extraction rules
- Adjust output format

---

## 📝 Logging Interpretation

### Success Indicators

```
[Strategy 1] Product tables found: 1
[Strategy 1] Processing table 0 (15 rows)...
[Strategy 1] ✓ Extracted 12 products from table 0
```
✅ **Table extraction worked**

```
[Strategy 2] Found 12 NDCs in table 3 (type: unknown)
[Strategy 2] ✓ Extracted 12 products via NDC scan
```
✅ **NDC scan found products in unclassified table**

### Warning Indicators

```
[Strategy 1] Product tables found: 0
[Strategy 2] Found 0 NDCs in tables
```
⚠️ **No tables with products - will try text-based extraction**

```
[Strategy 5] Found 0 product-like lines
```
⚠️ **Line parsing failed - document may not have products**

### Failure Indicators

```
[Strategy 1] TABLE-BASED EXTRACTION
────────────────────────────────────────────────────────────
[Strategy 1] Product tables found: 0

[Strategy 2] NDC PATTERN MATCHING
────────────────────────────────────────────────────────────
[Strategy 2] Found 0 NDC patterns in text

... (all strategies show 0 results)

Method: none
Products: 0
```
❌ **Complete failure - no products in document OR extraction bug**

---

## 🐛 Known Issues

### Issue: pdf-table-extractor fails on some PDFs

**Symptom:** Error during table extraction

**Workaround:** The system gracefully handles this and falls back to text-based extraction

**Fix:** Update to latest pdf-table-extractor version

### Issue: OCR PDFs have low accuracy

**Symptom:** Products found but with garbled text

**Solution:**
1. Check OCR confidence in debug output
2. Manual review required for low-confidence extractions
3. Consider pre-processing with better OCR tool

---

## 📞 Getting Help

### Before Filing a Bug Report

Run these commands and save the output:

```bash
# 1. Debug PDF content
npx tsx scripts/debug-pdf-content.ts your-contract.pdf > debug.txt

# 2. Test product extraction
npx tsx scripts/test-product-extraction.ts your-contract.pdf > test.txt
```

### Include in Bug Report

- PDF file (if possible) or sample text
- Output from debug script
- Output from test script
- Expected vs actual product count
- Any error messages

---

## ✅ Success Checklist

- [ ] Ran debug script on contract
- [ ] Confirmed NDC patterns are found
- [ ] Ran product extraction test
- [ ] Got products extracted
- [ ] Verified product count is reasonable
- [ ] Checked product data quality (NDCs, names, strengths)
- [ ] No hallucinated products
- [ ] Confidence score is acceptable (70%+)

---

## 🚀 Integration with Main System

The bulletproof extractor is **already integrated** in:
- `src/ai/flows/process-contract-document-enhanced.ts`

It's used automatically in Phase 2.3 of the extraction pipeline.

To use it standalone:

```typescript
import { extractProductsBulletproof } from '@/ai/flows/extract-products-bulletproof';

const result = await extractProductsBulletproof({
  fullText: pdfText,
  tables: extractedTables,
  fileName: 'contract.pdf',
});

console.log(`Found ${result.totalProducts} products via ${result.extractionMethod}`);
```

---

## 📚 See Also

- `docs/EXTRACTION-SYSTEM-IMPLEMENTATION.md` - Full system docs
- `docs/MIGRATION-GUIDE.md` - Migration guide
- `src/ai/flows/extract-products-bulletproof.ts` - Source code
- `scripts/test-product-extraction.ts` - Test script
- `scripts/debug-pdf-content.ts` - Debug script

---

**If products still aren't extracting after following this guide, please share the debug output and we'll investigate!**
