/**
 * Enterprise Field Categorization System
 *
 * Maps all extracted contract fields to UI display categories:
 * - Financial Terms
 * - Products
 * - Terms & Conditions
 * - Important Dates
 */

import type { FinancialFields } from '@/ai/flows/extract-financial-fields';
import type { ProductList } from '@/ai/flows/extract-product-list';
import type { FacilitiesData } from '@/ai/flows/extract-facilities';
import type { BundlesData } from '@/ai/flows/extract-bundles';
import type { GeneralFields } from '@/ai/flows/extract-general-fields';

export interface CategorizedField {
  label: string;
  value: string | number | boolean | null;
  rawValue?: any;
  source: string;
  sourcePage?: number;
  confidence?: number;
  fieldKey: string;
}

export interface CategorizedFields {
  financialTerms: CategorizedField[];
  products: CategorizedField[];
  termsAndConditions: CategorizedField[];
  importantDates: CategorizedField[];
  metadata: {
    totalFields: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    extractionSummary: string;
  };
}

export interface AllExtractedData {
  generalFields?: GeneralFields;
  financialFields?: FinancialFields;
  productList?: ProductList;
  facilitiesData?: FacilitiesData;
  bundlesData?: BundlesData;
}

/**
 * Categorize all extracted fields for UI display
 */
export function categorizeFieldsForUI(data: AllExtractedData): CategorizedFields {
  const categorized: CategorizedFields = {
    financialTerms: [],
    products: [],
    termsAndConditions: [],
    importantDates: [],
    metadata: {
      totalFields: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      extractionSummary: '',
    },
  };

  // CATEGORY 1: FINANCIAL TERMS
  if (data.financialFields) {
    categorized.financialTerms.push(...categorizeFinancialTerms(data.financialFields));
  }

  if (data.generalFields) {
    categorized.financialTerms.push(...categorizeGeneralFinancialFields(data.generalFields));
  }

  if (data.bundlesData) {
    categorized.financialTerms.push(...categorizeBundles(data.bundlesData));
  }

  // CATEGORY 2: PRODUCTS
  if (data.productList) {
    categorized.products.push(...categorizeProducts(data.productList));
  }

  // CATEGORY 3: TERMS & CONDITIONS
  if (data.generalFields) {
    categorized.termsAndConditions.push(...categorizeTermsAndConditions(data.generalFields));
  }

  if (data.facilitiesData) {
    categorized.termsAndConditions.push(...categorizeFacilities(data.facilitiesData));
  }

  if (data.financialFields) {
    categorized.termsAndConditions.push(...categorizeExclusions(data.financialFields));
  }

  // CATEGORY 4: IMPORTANT DATES
  if (data.generalFields) {
    categorized.importantDates.push(...categorizeImportantDates(data.generalFields));
  }

  if (data.financialFields) {
    categorized.importantDates.push(...categorizeDatesFromFinancial(data.financialFields));
  }

  // Calculate metadata
  categorized.metadata = calculateMetadata(categorized, data);

  return categorized;
}

/**
 * Categorize financial fields (tiers, payment terms)
 */
function categorizeFinancialTerms(financial: FinancialFields): CategorizedField[] {
  const fields: CategorizedField[] = [];

  // Rebate Tiers
  financial.rebateTiers.forEach((tier, idx) => {
    const thresholdText = tier.maxThreshold
      ? `$${tier.minThreshold?.toLocaleString()} - $${tier.maxThreshold.toLocaleString()}`
      : `$${tier.minThreshold?.toLocaleString()}+`;

    const rebateText = tier.rebatePercentage
      ? `${tier.rebatePercentage}%`
      : tier.rebateAmount
      ? `$${tier.rebateAmount.toLocaleString()}`
      : 'Unknown';

    fields.push({
      label: `${tier.tierName}`,
      value: `${rebateText} rebate on purchases ${thresholdText}`,
      rawValue: tier,
      source: tier.sourceQuote,
      sourcePage: tier.sourcePage || undefined,
      confidence: financial.overallConfidence,
      fieldKey: `rebate_tier_${idx}`,
    });

    // Add retroactive info if applicable
    if (tier.isRetroactive) {
      fields.push({
        label: `${tier.tierName} - Retroactive`,
        value: 'Rebate is retroactive to first dollar upon achievement',
        source: tier.sourceQuote,
        sourcePage: tier.sourcePage || undefined,
        confidence: financial.overallConfidence,
        fieldKey: `rebate_tier_${idx}_retroactive`,
      });
    }

    // Add special terms if present
    if (tier.specialTerms) {
      fields.push({
        label: `${tier.tierName} - Special Terms`,
        value: tier.specialTerms,
        source: tier.sourceQuote,
        sourcePage: tier.sourcePage || undefined,
        confidence: financial.overallConfidence,
        fieldKey: `rebate_tier_${idx}_special`,
      });
    }
  });

  // Tier Structure Type
  if (financial.tierStructureType && financial.tierStructureType !== 'unknown') {
    fields.push({
      label: 'Tier Calculation Method',
      value: financial.tierStructureType === 'stepped'
        ? 'Stepped (rebate applies to all purchases)'
        : 'Marginal (rebate applies only to incremental volume)',
      source: 'Tier structure analysis',
      confidence: financial.overallConfidence,
      fieldKey: 'tier_structure_type',
    });
  }

  // Payment Terms
  if (financial.paymentTerms) {
    if (financial.paymentTerms.frequency) {
      fields.push({
        label: 'Payment Frequency',
        value: financial.paymentTerms.frequency,
        source: financial.paymentTerms.sourceQuote,
        confidence: financial.overallConfidence,
        fieldKey: 'payment_frequency',
      });
    }

    if (financial.paymentTerms.dueDate) {
      fields.push({
        label: 'Payment Due Date',
        value: financial.paymentTerms.dueDate,
        source: financial.paymentTerms.sourceQuote,
        confidence: financial.overallConfidence,
        fieldKey: 'payment_due_date',
      });
    }

    if (financial.paymentTerms.submissionDeadline) {
      fields.push({
        label: 'Claim Submission Deadline',
        value: financial.paymentTerms.submissionDeadline,
        source: financial.paymentTerms.sourceQuote,
        confidence: financial.overallConfidence,
        fieldKey: 'submission_deadline',
      });
    }

    if (financial.paymentTerms.paymentMethod) {
      fields.push({
        label: 'Payment Method',
        value: financial.paymentTerms.paymentMethod,
        source: financial.paymentTerms.sourceQuote,
        confidence: financial.overallConfidence,
        fieldKey: 'payment_method',
      });
    }

    if (financial.paymentTerms.minimumPayment !== null) {
      fields.push({
        label: 'Minimum Payment Threshold',
        value: `$${financial.paymentTerms.minimumPayment.toLocaleString()}`,
        source: financial.paymentTerms.sourceQuote,
        confidence: financial.overallConfidence,
        fieldKey: 'minimum_payment',
      });
    }
  }

  // Minimums and Caps
  if (financial.minimumPurchaseRequirement !== null) {
    fields.push({
      label: 'Minimum Purchase Requirement',
      value: `$${financial.minimumPurchaseRequirement.toLocaleString()}`,
      source: 'Contract terms',
      confidence: financial.overallConfidence,
      fieldKey: 'minimum_purchase',
    });
  }

  if (financial.maximumRebateCap !== null) {
    fields.push({
      label: 'Maximum Rebate Cap',
      value: `$${financial.maximumRebateCap.toLocaleString()}`,
      source: 'Contract terms',
      confidence: financial.overallConfidence,
      fieldKey: 'maximum_rebate_cap',
    });
  }

  return fields;
}

/**
 * Categorize general financial fields (growth incentives, payment terms)
 */
function categorizeGeneralFinancialFields(general: GeneralFields): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = general.extractionConfidence;

  // Payment Terms
  if (general.paymentTerms) {
    fields.push({
      label: 'Payment Terms',
      value: general.paymentTerms,
      source: 'Contract',
      confidence,
      fieldKey: 'gen_payment_terms',
    });
  }

  if (general.claimsDueDays !== null) {
    fields.push({
      label: 'Claims Submission Deadline',
      value: `${general.claimsDueDays} days after quarter end`,
      source: 'Contract',
      confidence,
      fieldKey: 'gen_claims_due',
    });
  }

  if (general.paymentDueDays !== null) {
    fields.push({
      label: 'Payment Due',
      value: `${general.paymentDueDays} days after claim receipt`,
      source: 'Contract',
      confidence,
      fieldKey: 'gen_payment_due',
    });
  }

  // Growth Incentive
  if (general.growthIncentivePercentage !== null) {
    const threshold = general.growthIncentiveThreshold || 'unspecified';
    fields.push({
      label: 'Growth Incentive',
      value: `${general.growthIncentivePercentage}% additional rebate for ${threshold}% year-over-year growth`,
      source: 'Contract',
      confidence,
      fieldKey: 'growth_incentive',
    });
  }

  // Penalties
  if (general.lateClaimPenalty) {
    fields.push({
      label: 'Late Claim Penalty',
      value: general.lateClaimPenalty,
      source: 'Contract',
      confidence,
      fieldKey: 'late_penalty',
    });
  }

  if (general.earlyPaymentDiscount) {
    fields.push({
      label: 'Early Payment Discount',
      value: general.earlyPaymentDiscount,
      source: 'Contract',
      confidence,
      fieldKey: 'early_discount',
    });
  }

  return fields;
}

/**
 * Categorize bundle requirements
 */
function categorizeBundles(bundles: BundlesData): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = bundles.extractionConfidence;

  bundles.bundles.forEach((bundle, idx) => {
    const minSpend = bundle.minimumSpend
      ? `$${bundle.minimumSpend.toLocaleString()}`
      : bundle.minimumPercentage
      ? `${bundle.minimumPercentage}%`
      : 'Unspecified';

    fields.push({
      label: `Bundle: ${bundle.categoryName}`,
      value: `Minimum ${minSpend} ${bundle.measurementPeriod.toLowerCase()} | ${bundle.bundleIncentive || 'No incentive specified'}`,
      rawValue: bundle,
      source: bundle.sourceQuote,
      sourcePage: bundle.sourcePage || undefined,
      confidence,
      fieldKey: `bundle_${idx}`,
    });
  });

  return fields;
}

/**
 * Categorize products
 */
function categorizeProducts(productList: ProductList): CategorizedField[] {
  const fields: CategorizedField[] = [];
  // Handle both old and new product list schema
  const confidence = (productList as any).overallConfidence || (productList as any).extractionConfidence || 0.85;

  productList.products.forEach((product, idx) => {
    const ndc = product.ndc || 'No NDC';
    const strength = product.strength || '';
    const packageSize = product.packageSize || '';
    const details = [strength, packageSize].filter(Boolean).join(', ');

    fields.push({
      label: ndc,
      value: `${product.productName}${details ? ` (${details})` : ''}`,
      rawValue: product,
      source: product.sourceQuote,
      sourcePage: (product as any).sourcePage || undefined,
      confidence,
      fieldKey: `product_${idx}`,
    });
  });

  // Summary field
  fields.push({
    label: 'Total Products',
    value: productList.totalProducts,
    source: 'Product extraction summary',
    confidence,
    fieldKey: 'total_products',
  });

  // Handle optional fields
  if ((productList as any).hasMoreProducts) {
    fields.push({
      label: 'Additional Products',
      value: (productList as any).externalReference || 'See external product list',
      source: 'Product extraction summary',
      confidence,
      fieldKey: 'external_products',
    });
  }

  return fields;
}

/**
 * Categorize terms and conditions
 */
function categorizeTermsAndConditions(general: GeneralFields): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = general.extractionConfidence;

  // Contract Parties
  if (general.manufacturerName) {
    fields.push({
      label: 'Manufacturer',
      value: general.manufacturerName,
      source: 'Contract',
      confidence,
      fieldKey: 'manufacturer',
    });
  }

  if (general.purchaserName) {
    fields.push({
      label: 'Purchaser',
      value: general.purchaserName,
      source: 'Contract',
      confidence,
      fieldKey: 'purchaser',
    });
  }

  if (general.gpoAffiliation) {
    fields.push({
      label: 'GPO Affiliation',
      value: general.gpoAffiliation,
      source: 'Contract',
      confidence,
      fieldKey: 'gpo',
    });
  }

  // Exclusions
  if (general.medicaidCarveOut !== null) {
    const states = general.medicaidCarveOutStates?.join(', ') || 'all states';
    fields.push({
      label: 'Medicaid Carve-Out',
      value: general.medicaidCarveOut
        ? `Excluded in ${states}`
        : 'Medicaid purchases eligible',
      source: 'Contract',
      confidence,
      fieldKey: 'medicaid_carveout',
    });
  }

  if (general.medicarePartDExcluded !== null) {
    fields.push({
      label: 'Medicare Part D',
      value: general.medicarePartDExcluded ? 'Excluded' : 'Eligible',
      source: 'Contract',
      confidence,
      fieldKey: 'medicare_excluded',
    });
  }

  if (general.governmentProgramsExcluded) {
    fields.push({
      label: 'Government Program Exclusions',
      value: general.governmentProgramsExcluded,
      source: 'Contract',
      confidence,
      fieldKey: 'govt_exclusions',
    });
  }

  // Legal Terms
  if (general.governingLawState) {
    fields.push({
      label: 'Governing Law',
      value: general.governingLawState,
      source: 'Contract',
      confidence,
      fieldKey: 'governing_law',
    });
  }

  if (general.disputeResolution) {
    fields.push({
      label: 'Dispute Resolution',
      value: general.disputeResolution,
      source: 'Contract',
      confidence,
      fieldKey: 'dispute_resolution',
    });
  }

  if (general.terminationNoticeDays !== null) {
    fields.push({
      label: 'Termination Notice',
      value: `${general.terminationNoticeDays} days notice required`,
      source: 'Contract',
      confidence,
      fieldKey: 'termination_notice',
    });
  }

  // Compliance
  if (general.complianceRequirements) {
    fields.push({
      label: 'Compliance Requirements',
      value: general.complianceRequirements,
      source: 'Contract',
      confidence,
      fieldKey: 'compliance_req',
    });
  }

  if (general.auditRights) {
    fields.push({
      label: 'Audit Rights',
      value: general.auditRights,
      source: 'Contract',
      confidence,
      fieldKey: 'audit_rights',
    });
  }

  // Special Provisions
  if (general.retroactiveProvisions) {
    fields.push({
      label: 'Retroactive Provisions',
      value: general.retroactiveProvisions,
      source: 'Contract',
      confidence,
      fieldKey: 'retroactive',
    });
  }

  if (general.priceProtection) {
    fields.push({
      label: 'Price Protection',
      value: general.priceProtection,
      source: 'Contract',
      confidence,
      fieldKey: 'price_protection',
    });
  }

  if (general.formularyRequirements) {
    fields.push({
      label: 'Formulary Requirements',
      value: general.formularyRequirements,
      source: 'Contract',
      confidence,
      fieldKey: 'formulary',
    });
  }

  return fields;
}

/**
 * Categorize facilities
 */
function categorizeFacilities(facilities: FacilitiesData): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = facilities.extractionConfidence;

  facilities.facilities.forEach((facility, idx) => {
    const location = facility.city && facility.state
      ? `${facility.city}, ${facility.state}`
      : facility.streetAddress || 'Location not specified';

    const id340B = facility.facility340BId || 'Non-340B';

    fields.push({
      label: facility.facilityName,
      value: `${location} | ${id340B}`,
      rawValue: facility,
      source: facility.sourceQuote,
      sourcePage: facility.sourcePage || undefined,
      confidence,
      fieldKey: `facility_${idx}`,
    });
  });

  // Summary
  fields.push({
    label: 'Total Facilities',
    value: facilities.totalFacilities,
    source: 'Facilities extraction summary',
    confidence,
    fieldKey: 'total_facilities',
  });

  if (facilities.has340BEntities) {
    fields.push({
      label: '340B Status',
      value: 'Contract includes 340B covered entities',
      source: 'Facilities extraction summary',
      confidence,
      fieldKey: '340b_status',
    });
  }

  return fields;
}

/**
 * Categorize exclusions from financial fields
 */
function categorizeExclusions(financial: FinancialFields): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = financial.overallConfidence;

  financial.exclusions.forEach((exclusion, idx) => {
    fields.push({
      label: `Exclusion: ${exclusion.exclusionType}`,
      value: `${exclusion.description} | Impact: ${exclusion.impact}`,
      rawValue: exclusion,
      source: exclusion.sourceQuote,
      confidence,
      fieldKey: `exclusion_${idx}`,
    });
  });

  return fields;
}

/**
 * Categorize important dates
 */
function categorizeImportantDates(general: GeneralFields): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = general.extractionConfidence;

  if (general.contractNumber) {
    fields.push({
      label: 'Contract Number',
      value: general.contractNumber,
      source: 'Contract',
      confidence,
      fieldKey: 'contract_number',
    });
  }

  if (general.executionDate) {
    fields.push({
      label: 'Execution Date',
      value: general.executionDate,
      source: 'Contract',
      confidence,
      fieldKey: 'execution_date',
    });
  }

  if (general.effectiveDate) {
    fields.push({
      label: 'Effective Date',
      value: general.effectiveDate,
      source: 'Contract',
      confidence,
      fieldKey: 'effective_date',
    });
  }

  if (general.expirationDate) {
    fields.push({
      label: 'Expiration Date',
      value: general.expirationDate,
      source: 'Contract',
      confidence,
      fieldKey: 'expiration_date',
    });
  }

  if (general.contractTerm) {
    fields.push({
      label: 'Contract Term',
      value: general.contractTerm,
      source: 'Contract',
      confidence,
      fieldKey: 'contract_term',
    });
  }

  if (general.autoRenewal) {
    fields.push({
      label: 'Auto-Renewal Terms',
      value: general.autoRenewal,
      source: 'Contract',
      confidence,
      fieldKey: 'auto_renewal',
    });
  }

  // Amendments
  if (general.hasAmendments && general.amendmentDates) {
    general.amendmentDates.forEach((date, idx) => {
      const summary = general.amendmentSummaries?.[idx] || 'No details';
      fields.push({
        label: `Amendment ${idx + 1}`,
        value: `${date}: ${summary}`,
        source: 'Contract',
        confidence,
        fieldKey: `amendment_${idx}`,
      });
    });
  }

  return fields;
}

/**
 * Categorize dates from financial fields
 */
function categorizeDatesFromFinancial(financial: FinancialFields): CategorizedField[] {
  const fields: CategorizedField[] = [];
  const confidence = financial.overallConfidence;

  if (financial.effectiveDate) {
    fields.push({
      label: 'Rebate Schedule Effective',
      value: financial.effectiveDate,
      source: 'Rebate schedule',
      confidence,
      fieldKey: 'fin_effective_date',
    });
  }

  if (financial.expirationDate) {
    fields.push({
      label: 'Rebate Schedule Expiration',
      value: financial.expirationDate,
      source: 'Rebate schedule',
      confidence,
      fieldKey: 'fin_expiration_date',
    });
  }

  return fields;
}

/**
 * Calculate metadata
 */
function calculateMetadata(categorized: CategorizedFields, data: AllExtractedData): typeof categorized.metadata {
  const allFields = [
    ...categorized.financialTerms,
    ...categorized.products,
    ...categorized.termsAndConditions,
    ...categorized.importantDates,
  ];

  const totalFields = allFields.length;
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;
  let lowConfidenceCount = 0;

  allFields.forEach(field => {
    const conf = field.confidence || 0.5;
    if (conf >= 0.9) highConfidenceCount++;
    else if (conf >= 0.7) mediumConfidenceCount++;
    else lowConfidenceCount++;
  });

  const summary = [
    `Total Fields: ${totalFields}`,
    `Financial Terms: ${categorized.financialTerms.length}`,
    `Products: ${categorized.products.length}`,
    `Terms & Conditions: ${categorized.termsAndConditions.length}`,
    `Important Dates: ${categorized.importantDates.length}`,
    `Confidence: ${highConfidenceCount} high, ${mediumConfidenceCount} medium, ${lowConfidenceCount} low`,
  ].join(' | ');

  return {
    totalFields,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    extractionSummary: summary,
  };
}
