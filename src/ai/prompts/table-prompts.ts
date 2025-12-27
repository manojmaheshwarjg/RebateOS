/**
 * Enterprise-Grade AI Extraction Prompts
 *
 * Multi-level, exhaustive prompts for each contract data type.
 * Designed for maximum extraction accuracy with zero hallucination.
 */

export const PRODUCTS_TABLE_PROMPT = `
You are an expert pharmaceutical product data analyst extracting product information from a healthcare rebate contract table.

**YOUR TASK:**
Extract EVERY product from the table below. Do not skip any rows. Each row represents one product.

**EXTRACTION RULES:**

1. **NDC Codes:**
   - Format: XXXXX-XXXX-XX or XXXXX-XXX-XX (with hyphens)
   - 11 digits total: 5-4-2 or 5-3-2 pattern
   - If NDC is missing hyphens, add them (e.g., 12345678901 → 12345-6789-01)
   - If no NDC found, set to null

2. **Product Names:**
   - Extract full product name exactly as written
   - Include brand names and generic names if both present
   - Preserve capitalization

3. **Strength/Dosage:**
   - Look for: mg, mcg, g, ml, %, IU, mEq
   - Examples: "25mg", "0.5%", "100mg/ml"
   - Include per-unit strength (e.g., "5mg/tablet")

4. **Package Size:**
   - Look for quantity descriptors: "100 tablets", "30-day supply", "1 vial"
   - Include bottle/box counts: "Box of 10", "1 carton (100 vials)"

5. **Unit of Measure:**
   - Standard units: bottle, vial, box, carton, kit, tube, patch, syringe
   - If unclear, set to null

6. **Manufacturer:**
   - Extract if present in table
   - Common manufacturers: Pfizer, Merck, Novartis, etc.

7. **Category/Therapeutic Class:**
   - Look for: Cardiovascular, Diabetes, Oncology, etc.
   - If not in table, set to null

**VALIDATION RULES:**
- Each product MUST have at minimum: productName
- NDC codes must be valid format or null
- Strength must include units (mg, ml, etc.) or be null
- Do NOT invent data - use null if field not present
- Do NOT combine multiple rows into one product

**OUTPUT FORMAT (JSON only, no markdown, no preamble):**
{
  "products": [
    {
      "productName": "CardioCare Tablets",
      "ndc": "12345-6789-01",
      "sku": "CC-025-100",
      "strength": "25mg",
      "packageSize": "100 tablets",
      "unitOfMeasure": "bottle",
      "manufacturer": "PharmaCorp Inc.",
      "category": "Cardiovascular",
      "rebateEligible": true,
      "specialConditions": null,
      "sourceQuote": "CardioCare Tablets 25mg | 12345-6789-01 | 100ct",
      "sourcePage": 1
    }
  ],
  "totalProducts": 1,
  "extractionConfidence": 0.95,
  "extractionNotes": "All NDCs validated, 1 product missing strength data"
}

**TABLE DATA:**
`;

export const TIERS_TABLE_PROMPT = `
You are an expert healthcare contract financial analyst extracting rebate tier structures.

**YOUR TASK:**
Extract EVERY tier level from the table. Rebate tiers define volume-based discounts.

**TIER COMPONENTS TO EXTRACT:**

1. **Tier Name/Level:**
   - Common patterns: "Tier 1", "Bronze", "Base", "Level A"
   - Extract exactly as written
   - If unnamed, use "Tier 1", "Tier 2", etc.

2. **Volume Thresholds:**
   - minThreshold: Minimum purchase amount (dollars) to qualify
   - maxThreshold: Maximum amount (or null for unlimited top tier)
   - Look for: "$0 - $750,000", "Up to $1M", "$500K+"
   - Convert to numbers: remove $ and commas

3. **Rebate Rate:**
   - Percentage: "5.5%" → 5.5
   - Fixed amount: "$10,000" → 10000 (mark as rebateAmount, not percentage)
   - Per-unit: "$2 per unit" → extract in specialTerms

4. **Calculation Method:**
   - "Percentage of total purchases"
   - "Fixed amount per quarter"
   - "Per unit rebate"
   - "Retroactive to dollar one"
   - Extract exact language

5. **Applicability:**
   - Products: "All products", "Cardiovascular line only", "See Exhibit A"
   - Time period: "Quarterly", "Annual", "Per invoice"
   - Conditions: "Minimum 80% compliance required"

6. **Tier Qualifiers:**
   - Retroactive provisions: "Retroactive to first dollar"
   - Market share requirements: "Requires 75% market share"
   - Growth bonuses: "Additional 2% for 20% YoY growth"
   - Bundle requirements: "Across all therapeutic categories"

**SPECIAL CASES:**

- **Stepped vs Marginal:** Identify if rebate applies to ALL purchases (stepped) or only increment (marginal)
- **Tier Progression:** Tiers should ascend in volume and rebate percentage
- **Amendment Changes:** If tier rates are crossed out or amended, extract BOTH original and revised

**VALIDATION RULES:**
- Tiers must have: tierName, rebatePercentage OR rebateAmount
- Thresholds must be logical: tier2.min > tier1.max
- Percentages must be 0-100 (not 0.0-1.0)
- maxThreshold = null for highest tier

**OUTPUT FORMAT (JSON only):**
{
  "tiers": [
    {
      "tierName": "Tier 1: Bronze",
      "tierLevel": 1,
      "minThreshold": 0,
      "maxThreshold": 750000,
      "rebatePercentage": 4.5,
      "rebateAmount": null,
      "calculationMethod": "Percentage of total quarterly purchases",
      "applicableProducts": "All eligible products",
      "isRetroactive": false,
      "marketShareRequired": null,
      "minimumCompliancePercent": null,
      "specialTerms": null,
      "sourceQuote": "Bronze Tier: $0-$750K at 4.5% rebate",
      "sourcePage": 2
    },
    {
      "tierName": "Tier 2: Silver",
      "tierLevel": 2,
      "minThreshold": 750000,
      "maxThreshold": 1500000,
      "rebatePercentage": 7.25,
      "rebateAmount": null,
      "calculationMethod": "Percentage of total quarterly purchases",
      "applicableProducts": "All eligible products",
      "isRetroactive": true,
      "marketShareRequired": null,
      "minimumCompliancePercent": 80,
      "specialTerms": "Retroactive to first dollar upon achievement",
      "sourceQuote": "Silver Tier: $750K-$1.5M at 7.25% rebate, retroactive",
      "sourcePage": 2
    }
  ],
  "totalTiers": 2,
  "tierStructureType": "stepped",
  "extractionConfidence": 0.95,
  "extractionNotes": "All tiers have complete data"
}

**TABLE DATA:**
`;

export const FACILITIES_TABLE_PROMPT = `
You are an expert healthcare compliance analyst extracting facility information from a contract.

**YOUR TASK:**
Extract EVERY facility from the table. Facilities are locations eligible for rebates.

**FACILITY FIELDS TO EXTRACT:**

1. **Facility Name:**
   - Full official name: "Ann Arbor Medical Center"
   - Include "dba" if present: "University Hospital dba UM Health"

2. **Location:**
   - City and State: "Ann Arbor, MI"
   - Full address if present: "123 Medical Dr, Ann Arbor, MI 48104"

3. **340B ID:**
   - Format: "340B-XX-XXXXX-XX" or similar
   - Common prefixes: "340B", "HIN", "DSH"
   - Extract exactly as written

4. **Facility Type:**
   - Common types: "340B Covered Entity", "Disproportionate Share Hospital (DSH)", "Federal Qualified Health Center (FQHC)"
   - "Contract Pharmacy", "In-house Pharmacy"
   - Extract from table or infer from ID

5. **DEA Number:**
   - Format: 2 letters + 7 digits (e.g., "AB1234563")
   - Extract if present

6. **Status:**
   - "Active", "Pending", "Terminated"
   - Effective/termination dates if present

**VALIDATION RULES:**
- Minimum required: facilityName, location
- 340B IDs must follow pattern if present
- Do NOT invent facility data

**OUTPUT FORMAT (JSON only):**
{
  "facilities": [
    {
      "facilityName": "Ann Arbor Medical Center",
      "facilityDBA": null,
      "streetAddress": "1500 E Medical Center Dr",
      "city": "Ann Arbor",
      "state": "MI",
      "zipCode": "48109",
      "facility340BId": "340B-AA-12345-MH",
      "facilityType": "340B Covered Entity - Disproportionate Share Hospital",
      "deaNumber": null,
      "hin": null,
      "status": "Active",
      "effectiveDate": null,
      "terminationDate": null,
      "specialConditions": null,
      "sourceQuote": "Ann Arbor Medical Center | 1500 E Medical Center Dr, Ann Arbor MI | 340B-AA-12345-MH",
      "sourcePage": 3
    }
  ],
  "totalFacilities": 1,
  "has340BEntities": true,
  "extractionConfidence": 0.9,
  "extractionNotes": "All facilities have 340B IDs"
}

**TABLE DATA:**
`;

export const BUNDLES_TABLE_PROMPT = `
You are an expert pharmaceutical contract analyst extracting cross-category bundle requirements.

**YOUR TASK:**
Extract EVERY category requirement or bundle condition. Bundles are minimum spend requirements across therapeutic categories.

**BUNDLE FIELDS TO EXTRACT:**

1. **Category/Bundle Name:**
   - Therapeutic categories: "Cardiovascular", "Diabetes Care", "Oncology"
   - Product families: "CardioCare Line", "Generic Antibiotics"
   - Extract exact names

2. **Minimum Spend Requirement:**
   - Dollar amount: "$400,000 annually" → 400000
   - Percentage: "25% of total volume"
   - Unit count: "1,000 units per quarter"

3. **Measurement Period:**
   - "Annually", "Quarterly", "Per contract year"
   - "Cumulative", "Per invoice"

4. **Qualifying Products:**
   - "All products in Cardiovascular category"
   - "NDCs listed in Exhibit B"
   - "See attached product list"
   - Specific NDCs if listed

5. **Bundle Incentive:**
   - Additional rebate: "Additional 2% rebate upon achievement"
   - Bonus payment: "One-time $50,000 bonus"
   - Tier advancement: "Automatically qualify for Platinum tier"

6. **Required Compliance:**
   - "Minimum 90% compliance across all categories"
   - "Must meet both Cardio and Diabetes minimums"

**VALIDATION RULES:**
- Minimum required: categoryName, minimumSpend OR minimumPercentage
- Amounts must be numbers
- Incentives must be specific

**OUTPUT FORMAT (JSON only):**
{
  "bundles": [
    {
      "categoryName": "Cardiovascular Products",
      "bundleType": "therapeutic_category",
      "minimumSpend": 400000,
      "minimumPercentage": null,
      "minimumUnits": null,
      "measurementPeriod": "Annual",
      "qualifyingProducts": "All NDCs in Cardiovascular category (see Exhibit A)",
      "bundleIncentive": "Additional 2.0% rebate on total purchases",
      "requiredCompliance": "Must achieve minimum in at least 3 of 4 quarters",
      "stacksWithTiers": true,
      "sourceQuote": "Cardiovascular Bundle: $400K annual minimum for additional 2% rebate",
      "sourcePage": 4
    }
  ],
  "totalBundles": 1,
  "bundlesAreRequired": false,
  "extractionConfidence": 0.9,
  "extractionNotes": "All bundle requirements clearly defined"
}

**TABLE DATA:**
`;

export const GENERAL_FIELDS_PROMPT = `
You are an expert healthcare contract analyst extracting key contract fields from the FULL document text.

**YOUR TASK:**
Extract ALL general contract fields from the document. These are fields NOT in tables.

**CRITICAL EXTRACTION AREAS:**

**1. CONTRACT IDENTIFICATION**
- contractNumber: Contract reference number (e.g., "PHR-2024-8856-REV3")
- contractTitle: Official name
- contractType: "GPO", "Direct", "340B", "Medicaid", "Medicare Part D"
- executionDate: Date contract was signed (YYYY-MM-DD)
- effectiveDate: When contract becomes active (YYYY-MM-DD)
- expirationDate: When contract ends (YYYY-MM-DD)
- contractTerm: Duration (e.g., "36 months", "3 years")
- autoRenewal: Auto-renewal terms or null

**2. PARTIES**
- manufacturerName: Pharmaceutical manufacturer
- manufacturerAddress: Full address
- manufacturerContact: Contact person name
- manufacturerEmail: Email
- manufacturerPhone: Phone

- purchaserName: Buying organization (GPO, hospital, etc.)
- purchaserAddress: Full address
- purchaserContact: Contact person
- purchaserEmail: Email
- purchaserPhone: Phone
- purchaser340BId: 340B ID if applicable
- gpoAffiliation: GPO name if mentioned

**3. FINANCIAL TERMS (Non-Table)**
- paymentTerms: "Net 45 days", "Due within 30 days of invoice"
- claimsDueDays: Number of days to submit claims (integer)
- paymentDueDays: Number of days for manufacturer to pay (integer)
- paymentMethod: "ACH", "Wire Transfer", "Check"
- minimumPayment: Minimum rebate amount to trigger payment
- paymentFrequency: "Quarterly", "Monthly", "Annual"

- growthIncentivePercentage: % bonus for growth (e.g., 2.5)
- growthIncentiveThreshold: Required growth % to qualify (e.g., 20)
- growthMeasurementPeriod: "Year-over-year", "Quarter-over-quarter"

- lateClaimPenalty: Penalty for late submission
- earlyPaymentDiscount: Discount for early payment

**4. COMPLIANCE & EXCLUSIONS**
- medicaidCarveOut: true/false
- medicaidCarveOutStates: Array of states excluded
- medicaidExclusionDescription: Details

- medicarePartDExcluded: true/false
- medicareExclusionDescription: Details

- managedCareExcluded: true/false
- managedCareDetails: Which plans excluded

- governmentProgramsExcluded: Other programs excluded
- chargebacksAllowed: true/false
- chargebackDetails: Details

**5. LEGAL TERMS**
- governingLawState: Which state's laws apply
- disputeResolution: "Binding arbitration", "Mediation", "Court litigation"
- disputeLocation: Venue for disputes
- confidentialityTerms: Summary of confidentiality requirements
- auditRights: Audit rights summary
- terminationNoticeDays: Days notice required for termination
- terminationForCause: Conditions allowing immediate termination

**6. VOLUME & COMPLIANCE**
- minimumPurchaseRequirement: Required annual/quarterly volume
- volumeCommitments: Specific volume commitments
- complianceRequirements: Minimum compliance % required
- reportingRequirements: Reporting frequency and format
- dataSubmissionDeadline: When to submit purchase data

**7. SPECIAL PROVISIONS**
- retroactiveProvisions: Details on retroactive rebates
- mostFavoredCustomer: MFC clause details
- priceProtection: Price protection terms
- formularyRequirements: Formulary placement requirements
- marketShareRequirements: Required market share %

**8. AMENDMENTS**
- hasAmendments: true/false
- amendmentDates: Array of amendment dates
- amendmentSummaries: What each amendment changed

**EXTRACTION RULES:**
- Use YYYY-MM-DD format for all dates
- Percentages as numbers (5.5 not "5.5%")
- Dollar amounts as numbers without $ or commas
- Booleans as true/false, NOT "yes"/"no"
- Use null for missing fields
- DO NOT invent data
- Flag ambiguous fields in extractionNotes

**OUTPUT FORMAT (JSON only):**
{
  "contractNumber": "PHR-2024-8856-REV3",
  "contractTitle": "Pharmaceutical Rebate Agreement",
  "contractType": "GPO",
  "executionDate": "2024-01-15",
  "effectiveDate": "2024-02-01",
  "expirationDate": "2027-01-31",
  "contractTerm": "36 months",
  "autoRenewal": "Automatically renews for successive 12-month periods unless 90 days notice",

  "manufacturerName": "PharmaCorp Industries Inc.",
  "manufacturerAddress": "123 Pharma Plaza, Indianapolis, IN 46204",
  "manufacturerContact": "John Smith, VP Contracts",
  "manufacturerEmail": "jsmith@pharmacorp.com",
  "manufacturerPhone": "(317) 555-0100",

  "purchaserName": "Premier Healthcare Alliance",
  "purchaserAddress": "456 GPO Way, Charlotte, NC 28202",
  "purchaserContact": "Jane Doe, Director of Contracting",
  "purchaserEmail": "jdoe@premier.com",
  "purchaserPhone": "(704) 555-0200",
  "purchaser340BId": null,
  "gpoAffiliation": "Premier Healthcare Alliance",

  "paymentTerms": "Net 45 days from receipt of valid rebate claim",
  "claimsDueDays": 90,
  "paymentDueDays": 45,
  "paymentMethod": "ACH",
  "minimumPayment": 100,
  "paymentFrequency": "Quarterly",

  "growthIncentivePercentage": 2.5,
  "growthIncentiveThreshold": 20,
  "growthMeasurementPeriod": "Year-over-year comparison of total purchases",

  "lateClaimPenalty": "Claims submitted after 90 days are not eligible for rebate",
  "earlyPaymentDiscount": null,

  "medicaidCarveOut": true,
  "medicaidCarveOutStates": ["Michigan", "Ohio"],
  "medicaidExclusionDescription": "Rebates do not apply to Medicaid purchases in MI and OH",

  "medicarePartDExcluded": true,
  "medicareExclusionDescription": "Medicare Part D purchases are excluded from rebate calculation",

  "managedCareExcluded": false,
  "managedCareDetails": null,

  "governmentProgramsExcluded": "Federal 340B purchases excluded",
  "chargebacksAllowed": false,
  "chargebackDetails": null,

  "governingLawState": "Indiana",
  "disputeResolution": "Binding arbitration under AAA Commercial Arbitration Rules",
  "disputeLocation": "Indianapolis, Indiana",
  "confidentialityTerms": "All rebate terms confidential for 5 years post-termination",
  "auditRights": "Manufacturer may audit purchaser records with 30 days notice",
  "terminationNoticeDays": 90,
  "terminationForCause": "Material breach, bankruptcy, or regulatory violation",

  "minimumPurchaseRequirement": null,
  "volumeCommitments": "No minimum volume required",
  "complianceRequirements": "Minimum 80% compliance with formulary placement",
  "reportingRequirements": "Quarterly purchase reports due 30 days after quarter end",
  "dataSubmissionDeadline": "30 days after quarter end",

  "retroactiveProvisions": "Tier achievement is retroactive to first dollar of quarter",
  "mostFavoredCustomer": null,
  "priceProtection": "WAC increases limited to 5% annually",
  "formularyRequirements": "Preferred formulary status required",
  "marketShareRequirements": null,

  "hasAmendments": true,
  "amendmentDates": ["2024-06-15", "2024-09-20"],
  "amendmentSummaries": [
    "Amendment 1: Increased Tier 3 rebate from 10.5% to 11.0%",
    "Amendment 2: Added 3 new facilities to covered entity list"
  ],

  "extractionConfidence": 0.92,
  "extractionNotes": "Growth incentive threshold unclear - marked as 20% based on context",
  "ambiguousFields": ["growthIncentiveThreshold"],
  "missingFields": ["mostFavoredCustomer", "minimumPurchaseRequirement"]
}

**DOCUMENT TEXT:**
`;

export const PAYMENT_SCHEDULE_PROMPT = `
You are extracting payment schedule and timeline information.

**EXTRACT:**
- Payment due dates
- Claim submission deadlines
- Reporting periods
- Quarter/period definitions

**OUTPUT FORMAT (JSON only):**
{
  "paymentSchedule": [
    {
      "period": "Q1 2024",
      "periodStart": "2024-01-01",
      "periodEnd": "2024-03-31",
      "claimDeadline": "2024-04-30",
      "paymentDueDate": "2024-06-14",
      "reportingDeadline": "2024-04-30"
    }
  ],
  "extractionConfidence": 0.9
}

**TABLE DATA:**
`;

export const EXCLUSIONS_PROMPT = `
You are extracting exclusions and carve-outs from a contract.

**EXTRACT:**
- Excluded programs (Medicaid, Medicare, etc.)
- Excluded products
- Excluded states/regions
- Excluded customer types

**OUTPUT FORMAT (JSON only):**
{
  "exclusions": [
    {
      "exclusionType": "Program Exclusion",
      "excludedEntity": "Medicaid",
      "excludedStates": ["Michigan", "Ohio"],
      "description": "All Medicaid purchases in MI and OH are excluded from rebate calculations",
      "financialImpact": "Rebates not applicable",
      "effectiveDate": "2024-02-01",
      "sourceQuote": "Medicaid Carve-Out: MI and OH excluded",
      "sourcePage": 5
    }
  ],
  "extractionConfidence": 0.9
}

**TABLE DATA:**
`;
