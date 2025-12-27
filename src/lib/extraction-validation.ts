/**
 * Enterprise Extraction Validation Framework
 *
 * Validates extraction quality against expected outputs.
 * Provides quality metrics and identifies extraction failures.
 */

import type { AllExtractedData } from './field-categorization';

export interface ExpectedExtractionData {
  contractName: string;
  products: {
    expectedCount: number;
    sampleNDCs?: string[];
    sampleProductNames?: string[];
  };
  tiers: {
    expectedCount: number;
    tierNames?: string[];
    sampleRates?: number[];
  };
  facilities: {
    expectedCount: number;
    sample340BIds?: string[];
  };
  bundles: {
    expectedCount: number;
  };
  importantFields: {
    contractNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
    manufacturerName?: string;
    purchaserName?: string;
    gpoAffiliation?: string;
  };
}

export interface ValidationResult {
  contractName: string;
  overallScore: number; // 0-100
  passed: boolean;
  categories: {
    products: CategoryValidationResult;
    tiers: CategoryValidationResult;
    facilities: CategoryValidationResult;
    bundles: CategoryValidationResult;
    importantFields: CategoryValidationResult;
  };
  issues: ValidationIssue[];
  summary: string;
}

export interface CategoryValidationResult {
  score: number; // 0-100
  passed: boolean;
  expectedCount: number;
  actualCount: number;
  matchRate?: number; // 0-1 for field matching
  issues: string[];
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  expectedValue?: any;
  actualValue?: any;
}

/**
 * Expected extraction data for test contracts
 */
export const EXPECTED_EXTRACTIONS: Record<string, ExpectedExtractionData> = {
  'Contract_1.pdf': {
    contractName: 'Contract_1.pdf',
    products: {
      expectedCount: 12,
      sampleNDCs: ['12345-678-90', '12345-678-91', '54321-111-22'],
      sampleProductNames: ['CardioCare', 'Lisinopril', 'Atorvastatin'],
    },
    tiers: {
      expectedCount: 5,
      tierNames: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      sampleRates: [4.5, 7.25, 10.5, 13.75, 16.5],
    },
    facilities: {
      expectedCount: 7,
      sample340BIds: ['340B-AA-12345-MH', '340B-AA-12346-CH'],
    },
    bundles: {
      expectedCount: 2, // Cardiovascular and Diabetes bundles
    },
    importantFields: {
      contractNumber: 'PHR-2024-8856-REV3',
      effectiveDate: '2024-02-01',
      expirationDate: '2027-01-31',
      manufacturerName: 'PharmaCorp',
      purchaserName: 'Premier',
      gpoAffiliation: 'Premier Healthcare Alliance',
    },
  },

  'Contract_2.pdf': {
    contractName: 'Contract_2.pdf',
    products: {
      expectedCount: 8,
      sampleNDCs: [],
    },
    tiers: {
      expectedCount: 4,
      tierNames: ['Base', 'Standard', 'Preferred', 'Elite'],
      sampleRates: [3.0, 6.0, 9.0, 12.0],
    },
    facilities: {
      expectedCount: 3,
      sample340BIds: [],
    },
    bundles: {
      expectedCount: 1,
    },
    importantFields: {
      contractNumber: undefined, // May not be present
      effectiveDate: undefined,
      expirationDate: undefined,
    },
  },

  'Contract_3.pdf': {
    contractName: 'Contract_3.pdf',
    products: {
      expectedCount: 15,
      sampleNDCs: [],
    },
    tiers: {
      expectedCount: 3,
      tierNames: ['Tier 1', 'Tier 2', 'Tier 3'],
      sampleRates: [5.0, 10.0, 15.0],
    },
    facilities: {
      expectedCount: 5,
      sample340BIds: [],
    },
    bundles: {
      expectedCount: 0,
    },
    importantFields: {
      contractNumber: undefined,
      effectiveDate: undefined,
      expirationDate: undefined,
    },
  },
};

/**
 * Validate extraction results against expected data
 */
export function validateExtraction(
  contractName: string,
  extractedData: AllExtractedData
): ValidationResult {
  console.log(`[Validation] Validating extraction for ${contractName}...`);

  const expected = EXPECTED_EXTRACTIONS[contractName];

  if (!expected) {
    console.warn(`[Validation] No expected data defined for ${contractName}, skipping validation`);
    return {
      contractName,
      overallScore: 0,
      passed: false,
      categories: {
        products: createEmptyResult('products'),
        tiers: createEmptyResult('tiers'),
        facilities: createEmptyResult('facilities'),
        bundles: createEmptyResult('bundles'),
        importantFields: createEmptyResult('importantFields'),
      },
      issues: [{
        severity: 'warning',
        category: 'validation',
        message: 'No expected data defined for this contract',
      }],
      summary: 'Validation skipped - no expected data',
    };
  }

  const issues: ValidationIssue[] = [];

  // Validate Products
  const productsResult = validateProducts(expected.products, extractedData, issues);

  // Validate Tiers
  const tiersResult = validateTiers(expected.tiers, extractedData, issues);

  // Validate Facilities
  const facilitiesResult = validateFacilities(expected.facilities, extractedData, issues);

  // Validate Bundles
  const bundlesResult = validateBundles(expected.bundles, extractedData, issues);

  // Validate Important Fields
  const importantFieldsResult = validateImportantFields(expected.importantFields, extractedData, issues);

  // Calculate overall score
  const categoryScores = [
    productsResult.score,
    tiersResult.score,
    facilitiesResult.score,
    bundlesResult.score,
    importantFieldsResult.score,
  ];

  const overallScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
  const passed = overallScore >= 70; // 70% threshold

  const summary = generateSummary({
    contractName,
    overallScore,
    passed,
    categories: {
      products: productsResult,
      tiers: tiersResult,
      facilities: facilitiesResult,
      bundles: bundlesResult,
      importantFields: importantFieldsResult,
    },
    issues,
  });

  console.log(`[Validation] ${contractName} - Score: ${overallScore.toFixed(0)}% - ${passed ? 'PASSED' : 'FAILED'}`);

  return {
    contractName,
    overallScore,
    passed,
    categories: {
      products: productsResult,
      tiers: tiersResult,
      facilities: facilitiesResult,
      bundles: bundlesResult,
      importantFields: importantFieldsResult,
    },
    issues,
    summary,
  };
}

function validateProducts(
  expected: ExpectedExtractionData['products'],
  extracted: AllExtractedData,
  issues: ValidationIssue[]
): CategoryValidationResult {
  const actualCount = extracted.productList?.products.length || 0;
  const expectedCount = expected.expectedCount;

  const countDiff = Math.abs(actualCount - expectedCount);
  const countScore = Math.max(0, 100 - (countDiff / expectedCount) * 100);

  let matchScore = 100;

  // Check sample NDCs if provided
  if (expected.sampleNDCs && expected.sampleNDCs.length > 0 && extracted.productList) {
    const extractedNDCs = extracted.productList.products.map(p => p.ndc).filter(Boolean);
    const matchedNDCs = expected.sampleNDCs.filter(ndc =>
      extractedNDCs.some(extractedNDC => extractedNDC?.includes(ndc) || ndc.includes(extractedNDC || ''))
    );

    matchScore = (matchedNDCs.length / expected.sampleNDCs.length) * 100;

    if (matchedNDCs.length < expected.sampleNDCs.length) {
      issues.push({
        severity: 'warning',
        category: 'products',
        message: `Only ${matchedNDCs.length}/${expected.sampleNDCs.length} sample NDCs matched`,
        expectedValue: expected.sampleNDCs,
        actualValue: matchedNDCs,
      });
    }
  }

  const score = (countScore + matchScore) / 2;
  const passed = score >= 70;

  const categoryIssues: string[] = [];
  if (actualCount < expectedCount * 0.9) {
    categoryIssues.push(`Low product count: expected ${expectedCount}, got ${actualCount}`);
    issues.push({
      severity: 'critical',
      category: 'products',
      message: `Extracted only ${actualCount}/${expectedCount} products (${((actualCount / expectedCount) * 100).toFixed(0)}%)`,
      expectedValue: expectedCount,
      actualValue: actualCount,
    });
  }

  return {
    score,
    passed,
    expectedCount,
    actualCount,
    matchRate: matchScore / 100,
    issues: categoryIssues,
  };
}

function validateTiers(
  expected: ExpectedExtractionData['tiers'],
  extracted: AllExtractedData,
  issues: ValidationIssue[]
): CategoryValidationResult {
  const actualCount = extracted.financialFields?.rebateTiers.length || 0;
  const expectedCount = expected.expectedCount;

  const countDiff = Math.abs(actualCount - expectedCount);
  const countScore = Math.max(0, 100 - (countDiff / expectedCount) * 100);

  let matchScore = 100;

  // Check tier names if provided
  if (expected.tierNames && expected.tierNames.length > 0 && extracted.financialFields) {
    const extractedTierNames = extracted.financialFields.rebateTiers.map(t => t.tierName.toLowerCase());
    const matchedNames = expected.tierNames.filter(name =>
      extractedTierNames.some(extracted => extracted.includes(name.toLowerCase()))
    );

    matchScore = (matchedNames.length / expected.tierNames.length) * 100;

    if (matchedNames.length < expected.tierNames.length) {
      issues.push({
        severity: 'warning',
        category: 'tiers',
        message: `Only ${matchedNames.length}/${expected.tierNames.length} tier names matched`,
        expectedValue: expected.tierNames,
        actualValue: matchedNames,
      });
    }
  }

  const score = (countScore + matchScore) / 2;
  const passed = score >= 70;

  const categoryIssues: string[] = [];
  if (actualCount !== expectedCount) {
    categoryIssues.push(`Tier count mismatch: expected ${expectedCount}, got ${actualCount}`);
    issues.push({
      severity: actualCount === 0 ? 'critical' : 'warning',
      category: 'tiers',
      message: `Extracted ${actualCount}/${expectedCount} tiers`,
      expectedValue: expectedCount,
      actualValue: actualCount,
    });
  }

  return {
    score,
    passed,
    expectedCount,
    actualCount,
    matchRate: matchScore / 100,
    issues: categoryIssues,
  };
}

function validateFacilities(
  expected: ExpectedExtractionData['facilities'],
  extracted: AllExtractedData,
  issues: ValidationIssue[]
): CategoryValidationResult {
  const actualCount = extracted.facilitiesData?.facilities.length || 0;
  const expectedCount = expected.expectedCount;

  const countDiff = Math.abs(actualCount - expectedCount);
  const countScore = expectedCount > 0
    ? Math.max(0, 100 - (countDiff / expectedCount) * 100)
    : (actualCount === 0 ? 100 : 0);

  const score = countScore;
  const passed = score >= 70;

  const categoryIssues: string[] = [];
  if (actualCount < expectedCount * 0.9) {
    categoryIssues.push(`Low facility count: expected ${expectedCount}, got ${actualCount}`);
    if (expectedCount > 0) {
      issues.push({
        severity: actualCount === 0 ? 'critical' : 'warning',
        category: 'facilities',
        message: `Extracted only ${actualCount}/${expectedCount} facilities`,
        expectedValue: expectedCount,
        actualValue: actualCount,
      });
    }
  }

  return {
    score,
    passed,
    expectedCount,
    actualCount,
    issues: categoryIssues,
  };
}

function validateBundles(
  expected: ExpectedExtractionData['bundles'],
  extracted: AllExtractedData,
  issues: ValidationIssue[]
): CategoryValidationResult {
  const actualCount = extracted.bundlesData?.bundles.length || 0;
  const expectedCount = expected.expectedCount;

  const countDiff = Math.abs(actualCount - expectedCount);
  const countScore = expectedCount > 0
    ? Math.max(0, 100 - (countDiff / expectedCount) * 100)
    : (actualCount === 0 ? 100 : 0);

  const score = countScore;
  const passed = score >= 70;

  const categoryIssues: string[] = [];
  if (actualCount < expectedCount) {
    categoryIssues.push(`Bundle count mismatch: expected ${expectedCount}, got ${actualCount}`);
    if (expectedCount > 0) {
      issues.push({
        severity: 'warning',
        category: 'bundles',
        message: `Extracted only ${actualCount}/${expectedCount} bundles`,
        expectedValue: expectedCount,
        actualValue: actualCount,
      });
    }
  }

  return {
    score,
    passed,
    expectedCount,
    actualCount,
    issues: categoryIssues,
  };
}

function validateImportantFields(
  expected: ExpectedExtractionData['importantFields'],
  extracted: AllExtractedData,
  issues: ValidationIssue[]
): CategoryValidationResult {
  const general = extracted.generalFields;

  let matchCount = 0;
  let totalCount = 0;
  const categoryIssues: string[] = [];

  Object.entries(expected).forEach(([key, expectedValue]) => {
    if (expectedValue !== undefined) {
      totalCount++;
      const actualValue = general?.[key as keyof typeof general];

      if (actualValue && String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase())) {
        matchCount++;
      } else {
        categoryIssues.push(`${key}: expected "${expectedValue}", got "${actualValue || 'null'}"`);
        issues.push({
          severity: 'warning',
          category: 'importantFields',
          message: `Field "${key}" mismatch`,
          expectedValue,
          actualValue,
        });
      }
    }
  });

  const score = totalCount > 0 ? (matchCount / totalCount) * 100 : 100;
  const passed = score >= 70;

  return {
    score,
    passed,
    expectedCount: totalCount,
    actualCount: matchCount,
    matchRate: score / 100,
    issues: categoryIssues,
  };
}

function createEmptyResult(category: string): CategoryValidationResult {
  return {
    score: 0,
    passed: false,
    expectedCount: 0,
    actualCount: 0,
    issues: [`No validation data for ${category}`],
  };
}

function generateSummary(result: Omit<ValidationResult, 'summary'>): string {
  const lines: string[] = [];

  lines.push(`=== EXTRACTION VALIDATION REPORT ===`);
  lines.push(`Contract: ${result.contractName}`);
  lines.push(`Overall Score: ${result.overallScore.toFixed(1)}% - ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push('');

  lines.push('Category Scores:');
  Object.entries(result.categories).forEach(([category, catResult]) => {
    const status = catResult.passed ? '✓' : '✗';
    lines.push(`  ${status} ${category}: ${catResult.score.toFixed(0)}% (${catResult.actualCount}/${catResult.expectedCount})`);
  });

  lines.push('');
  lines.push(`Issues: ${result.issues.length}`);

  const critical = result.issues.filter(i => i.severity === 'critical').length;
  const warnings = result.issues.filter(i => i.severity === 'warning').length;

  if (critical > 0) lines.push(`  - Critical: ${critical}`);
  if (warnings > 0) lines.push(`  - Warnings: ${warnings}`);

  return lines.join('\n');
}
