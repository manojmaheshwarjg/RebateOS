# Migration Guide: Legacy → Enhanced Extraction System

## Overview

This guide helps you migrate from the legacy `process-contract-document.ts` to the new enterprise `process-contract-document-enhanced.ts`.

---

## Key Differences

| Feature | Legacy System | Enhanced System |
|---------|--------------|-----------------|
| **Table Extraction** | ❌ No (text-only) | ✅ Yes (pattern-based detection) |
| **Extraction Flows** | 2 (financial, products) | 5 (financial, products, facilities, bundles, general) |
| **Parallel Processing** | ❌ No (sequential) | ✅ Yes (Phase 2 runs 5 flows concurrently) |
| **Field Count** | ~5-10 fields | 40-70+ fields |
| **Tier Fields** | 9 fields per tier | 14 fields per tier |
| **Product Fields** | 13 fields | 14 fields (added `strength`) |
| **Facilities** | ❌ Not extracted | ✅ Full extraction |
| **Bundles** | ❌ Not extracted | ✅ Full extraction |
| **General Fields** | ❌ Not extracted | ✅ 70+ fields |
| **Amendment Detection** | ❌ No | ✅ Yes (automatic) |
| **Validation** | ❌ No | ✅ Yes (quality scoring) |
| **Field Categorization** | ❌ No | ✅ 4 UI categories |
| **Processing Time** | ~10-15s | ~20-40s (more comprehensive) |

---

## Migration Steps

### Step 1: Update Import

**Before:**
```typescript
import { processContractDocument } from '@/ai/flows/process-contract-document';
```

**After:**
```typescript
import { processContractDocumentEnhanced } from '@/ai/flows/process-contract-document-enhanced';
```

### Step 2: Update Input Format

The enhanced system needs a Buffer instead of DataURI:

**Before:**
```typescript
await processContractDocument({
  fileId: 'file-123',
  contractId: 'contract-456',
  documentDataUri: 'data:application/pdf;base64,...',
  fileName: 'Contract.pdf',
});
```

**After:**
```typescript
// Convert DataURI to Buffer
const base64Data = documentDataUri.split(',')[1];
const pdfBuffer = Buffer.from(base64Data, 'base64');

await processContractDocumentEnhanced({
  fileId: 'file-123',
  contractId: 'contract-456',
  pdfBuffer: pdfBuffer,  // Changed: Buffer instead of DataURI
  fileName: 'Contract.pdf',
});
```

### Step 3: Update Response Handling

**Before:**
```typescript
const result = await processContractDocument(input);

// Result has:
// - success, fileId, documentType, fieldsExtracted, confidence

console.log(`Extracted ${result.fieldsExtracted} fields`);
```

**After:**
```typescript
const result = await processContractDocumentEnhanced(input);

// Result has MUCH more:
// - All previous fields PLUS:
// - tables, financialFields, productList, facilitiesData, bundlesData, generalFields
// - categorizedFields, amendments, validation
// - totalFieldsExtracted, overallConfidence

console.log(`Extracted ${result.totalFieldsExtracted} fields`);
console.log(`Validation: ${result.validation?.passed ? 'PASSED' : 'FAILED'}`);
console.log(`Amendments: ${result.amendments.amendments.length}`);

// Access categorized data
const { financialTerms, products, termsAndConditions, importantDates } =
  result.categorizedFields;
```

### Step 4: Handle New Data Structures

**Accessing Tier Data:**

```typescript
// Legacy: Array of basic tiers
const tiers = legacyResult.rebateTiers;

// Enhanced: Rich tier objects
const tiers = enhancedResult.financialFields.rebateTiers;
tiers.forEach(tier => {
  console.log(`${tier.tierName}: ${tier.rebatePercentage}%`);
  if (tier.isRetroactive) {
    console.log('  → Retroactive to first dollar');
  }
  if (tier.specialTerms) {
    console.log(`  → ${tier.specialTerms}`);
  }
});
```

**Accessing Products:**

```typescript
// Legacy: Basic products
const products = legacyResult.products;

// Enhanced: Rich product objects with strength
const products = enhancedResult.productList.products;
products.forEach(product => {
  console.log(`${product.ndc}: ${product.productName} ${product.strength || ''}`);
});
```

**New: Accessing Facilities:**

```typescript
// Only available in enhanced system
const facilities = enhancedResult.facilitiesData.facilities;
facilities.forEach(facility => {
  console.log(`${facility.facilityName}`);
  console.log(`  Location: ${facility.city}, ${facility.state}`);
  console.log(`  340B ID: ${facility.facility340BId || 'N/A'}`);
});
```

**New: Accessing Bundles:**

```typescript
// Only available in enhanced system
const bundles = enhancedResult.bundlesData.bundles;
bundles.forEach(bundle => {
  console.log(`${bundle.categoryName}: Min $${bundle.minimumSpend?.toLocaleString()}`);
  console.log(`  Incentive: ${bundle.bundleIncentive}`);
});
```

**New: Accessing General Fields:**

```typescript
// Only available in enhanced system
const general = enhancedResult.generalFields;

console.log(`Contract Number: ${general.contractNumber}`);
console.log(`Manufacturer: ${general.manufacturerName}`);
console.log(`GPO: ${general.gpoAffiliation}`);
console.log(`Medicaid Carve-Out: ${general.medicaidCarveOut ? 'Yes' : 'No'}`);
console.log(`Governing Law: ${general.governingLawState}`);
```

### Step 5: Update UI to Use Categorized Fields

The enhanced system provides UI-ready categorized fields:

```typescript
// Get fields organized by UI category
const {
  financialTerms,    // Tiers, payment terms, bundles, incentives
  products,          // NDCs with names and details
  termsAndConditions, // Parties, exclusions, legal, facilities
  importantDates,    // Contract dates, amendments
  metadata,          // Total fields, confidence breakdown
} = result.categorizedFields;

// Each field has:
// - label: Display label
// - value: Display value (string/number/boolean)
// - rawValue: Original extracted object
// - source: Source quote from PDF
// - sourcePage: Page number (if available)
// - confidence: Extraction confidence
// - fieldKey: Unique identifier

// Example: Display financial terms
financialTerms.forEach(field => {
  console.log(`${field.label}: ${field.value}`);
  console.log(`  Source: ${field.source}`);
  console.log(`  Confidence: ${(field.confidence * 100).toFixed(0)}%`);
});
```

### Step 6: Handle Amendments

```typescript
// Check for amendments
if (result.amendments.hasAmendments) {
  console.log(`Found ${result.amendments.amendments.length} amendments`);

  result.amendments.amendments.forEach(amendment => {
    console.log(`Amendment ${amendment.amendmentNumber}:`);
    console.log(`  Type: ${amendment.amendmentType}`);
    console.log(`  Date: ${amendment.amendmentDate || 'Not specified'}`);
    console.log(`  Change: ${amendment.originalValue} → ${amendment.revisedValue}`);
    console.log(`  Description: ${amendment.description}`);
  });

  if (result.amendments.requiresReview) {
    console.warn('⚠ Amendments require manual review');
  }
}
```

### Step 7: Check Validation

```typescript
// Validation is automatic in enhanced system
const validation = result.validation;

if (validation) {
  console.log(`Validation Score: ${validation.overallScore.toFixed(1)}%`);
  console.log(`Status: ${validation.passed ? '✓ PASSED' : '✗ FAILED'}`);

  // Check for issues
  if (validation.issues.length > 0) {
    console.log('Issues found:');
    validation.issues.forEach(issue => {
      console.log(`  [${issue.severity}] ${issue.category}: ${issue.message}`);
    });
  }

  // Category breakdown
  console.log('\nCategory Scores:');
  Object.entries(validation.categories).forEach(([category, result]) => {
    console.log(`  ${category}: ${result.score.toFixed(0)}% (${result.actualCount}/${result.expectedCount})`);
  });
}
```

---

## Backward Compatibility

The enhanced system is **not** a drop-in replacement due to different input/output formats. However, you can create a compatibility wrapper:

```typescript
// compatibility-wrapper.ts
import { processContractDocumentEnhanced } from '@/ai/flows/process-contract-document-enhanced';

export async function processContractDocumentLegacyCompatible(input: {
  fileId: string;
  contractId: string;
  documentDataUri: string;
  fileName: string;
}) {
  // Convert DataURI to Buffer
  const base64Data = input.documentDataUri.split(',')[1];
  const pdfBuffer = Buffer.from(base64Data, 'base64');

  // Call enhanced system
  const enhancedResult = await processContractDocumentEnhanced({
    fileId: input.fileId,
    contractId: input.contractId,
    pdfBuffer,
    fileName: input.fileName,
  });

  // Return legacy-compatible format
  return {
    success: enhancedResult.success,
    fileId: enhancedResult.fileId,
    documentType: 'rebate_schedule', // Legacy field
    fieldsExtracted: enhancedResult.totalFieldsExtracted,
    confidence: enhancedResult.overallConfidence,
  };
}
```

---

## Gradual Migration Strategy

### Option 1: Parallel Deployment

Run both systems side-by-side and compare results:

```typescript
// Run both extractors
const [legacyResult, enhancedResult] = await Promise.all([
  processContractDocument(legacyInput),
  processContractDocumentEnhanced(enhancedInput),
]);

// Compare field counts
console.log(`Legacy: ${legacyResult.fieldsExtracted} fields`);
console.log(`Enhanced: ${enhancedResult.totalFieldsExtracted} fields`);
console.log(`Improvement: +${enhancedResult.totalFieldsExtracted - legacyResult.fieldsExtracted} fields`);
```

### Option 2: Feature Flag

Use a feature flag to control which system is used:

```typescript
import { useFeatureFlag } from '@/lib/feature-flags';

const useEnhancedExtraction = useFeatureFlag('enhanced-extraction');

const result = useEnhancedExtraction
  ? await processContractDocumentEnhanced(enhancedInput)
  : await processContractDocument(legacyInput);
```

### Option 3: Per-Contract Migration

Migrate contracts one at a time:

```typescript
// Check if contract has already been processed with enhanced system
const hasEnhancedData = await checkEnhancedProcessing(contractId);

if (!hasEnhancedData) {
  // Re-process with enhanced system
  await processContractDocumentEnhanced(input);
}
```

---

## Testing Checklist

Before fully migrating, test the enhanced system:

- [ ] Extract from Contract_1.pdf - expect 42+ fields
- [ ] Extract from Contract_2.pdf - expect 25+ fields
- [ ] Extract from Contract_3.pdf - expect 30+ fields
- [ ] Verify tier extraction with all 14 fields
- [ ] Verify product extraction with NDCs and strengths
- [ ] Verify facility extraction (if applicable)
- [ ] Verify bundle extraction (if applicable)
- [ ] Check amendment detection
- [ ] Check validation scores (should be 70%+ for known contracts)
- [ ] Verify database persistence in `extracted_fields` table
- [ ] Check UI display with categorized fields
- [ ] Test error handling with malformed PDF
- [ ] Verify processing time is acceptable (<1 minute)

---

## Rollback Plan

If issues arise, you can quickly rollback:

1. **Code Rollback**: Switch imports back to legacy system
2. **Database**: Legacy and enhanced systems use same `extracted_fields` table
3. **Data**: Enhanced system only adds more fields, doesn't break existing data

---

## Performance Considerations

The enhanced system is slower due to comprehensive extraction:

| System | Average Time | Fields Extracted |
|--------|-------------|------------------|
| Legacy | 10-15s | 5-10 fields |
| Enhanced | 20-40s | 40-70 fields |

**Optimization tips:**
1. Run extraction asynchronously (already designed for background processing)
2. Show progress updates to user during extraction
3. Cache results to avoid re-processing
4. Use enhanced system only for new uploads, legacy for existing

---

## Support

If you encounter issues during migration:

1. Check `docs/EXTRACTION-SYSTEM-IMPLEMENTATION.md` for detailed documentation
2. Review console logs - enhanced system has comprehensive phase-by-phase logging
3. Check validation reports for quality insights
4. Review `extraction_validation.ts` for expected outputs

---

## Summary

✅ Enhanced system extracts 4-7x more fields
✅ Higher accuracy with table-aware extraction
✅ Automatic amendment detection
✅ Built-in validation framework
✅ UI-ready categorized fields
✅ Production-grade error handling

Migration requires updating input format (DataURI → Buffer) and handling richer output structure, but provides significantly better extraction results.
