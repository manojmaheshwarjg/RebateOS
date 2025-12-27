/**
 * Enterprise Amendment Detection System
 *
 * Detects amendments and modifications in contract documents.
 * Identifies changes to tier rates, dates, terms, and flags conflicts.
 */

export interface Amendment {
  amendmentNumber: number;
  amendmentDate: string | null;
  amendmentType: AmendmentType;
  affectedField: string;
  originalValue: any;
  revisedValue: any;
  description: string;
  sourceQuote: string;
  sourcePage?: number;
  confidence: number;
}

export type AmendmentType =
  | 'tier_rate_change'
  | 'date_change'
  | 'facility_addition'
  | 'facility_removal'
  | 'product_addition'
  | 'product_removal'
  | 'term_modification'
  | 'payment_term_change'
  | 'other';

export interface AmendmentDetectionResult {
  hasAmendments: boolean;
  amendments: Amendment[];
  conflictCount: number;
  requiresReview: boolean;
  detectionConfidence: number;
}

/**
 * Detect amendments in contract text
 */
export function detectAmendments(fullText: string): AmendmentDetectionResult {
  console.log('[Amendment] Detecting amendments in contract text...');

  const amendments: Amendment[] = [];
  let amendmentNumber = 0;

  // Phase 1: Look for amendment keywords
  const amendmentKeywords = [
    /amendment\s+(?:no\.|number|#)?\s*(\d+)/gi,
    /addendum\s+(?:no\.|number|#)?\s*(\d+)/gi,
    /revision\s+(?:no\.|number|#)?\s*(\d+)/gi,
    /modification\s+(?:no\.|number|#)?\s*(\d+)/gi,
  ];

  const amendmentSections = extractAmendmentSections(fullText, amendmentKeywords);

  console.log(`[Amendment] Found ${amendmentSections.length} amendment section(s)`);

  // Phase 2: Analyze each amendment section
  amendmentSections.forEach(section => {
    amendmentNumber++;

    // Detect amendment date
    const dateMatch = section.text.match(/date[d:]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i) ||
                       section.text.match(/effective\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    const amendmentDate = dateMatch ? normalizeDate(dateMatch[1]) : null;

    // Detect type of amendment
    const detectedAmendments = analyzeAmendmentContent(section.text, section.startPos, amendmentNumber, amendmentDate);
    amendments.push(...detectedAmendments);
  });

  // Phase 3: Look for inline changes (crossed-out text, "revised to", etc.)
  const inlineChanges = detectInlineChanges(fullText);
  amendments.push(...inlineChanges);

  // Calculate overall confidence
  const avgConfidence = amendments.length > 0
    ? amendments.reduce((sum, a) => sum + a.confidence, 0) / amendments.length
    : 0;

  const conflictCount = amendments.filter(a =>
    a.amendmentType === 'tier_rate_change' ||
    a.amendmentType === 'date_change' ||
    a.amendmentType === 'payment_term_change'
  ).length;

  console.log(`[Amendment] Detection complete: ${amendments.length} amendments, ${conflictCount} conflicts`);

  return {
    hasAmendments: amendments.length > 0,
    amendments,
    conflictCount,
    requiresReview: conflictCount > 0 || avgConfidence < 0.7,
    detectionConfidence: avgConfidence,
  };
}

interface AmendmentSection {
  text: string;
  startPos: number;
  endPos: number;
  number: number;
}

/**
 * Extract amendment sections from full text
 */
function extractAmendmentSections(fullText: string, patterns: RegExp[]): AmendmentSection[] {
  const sections: AmendmentSection[] = [];

  patterns.forEach(pattern => {
    const matches = [...fullText.matchAll(pattern)];

    matches.forEach((match, idx) => {
      if (match.index === undefined) return;

      const startPos = match.index;
      const number = parseInt(match[1]) || idx + 1;

      // Extract ~2000 chars after amendment keyword
      const endPos = Math.min(fullText.length, startPos + 2000);

      // Try to find next amendment or end of document
      const nextAmendmentMatch = fullText.slice(startPos + 50).search(/amendment|addendum|revision/i);
      const actualEndPos = nextAmendmentMatch > 0
        ? startPos + 50 + nextAmendmentMatch
        : endPos;

      sections.push({
        text: fullText.slice(startPos, actualEndPos),
        startPos,
        endPos: actualEndPos,
        number,
      });
    });
  });

  // Deduplicate overlapping sections
  return deduplicateSections(sections);
}

function deduplicateSections(sections: AmendmentSection[]): AmendmentSection[] {
  const unique: AmendmentSection[] = [];

  sections.forEach(section => {
    const overlaps = unique.some(existing => {
      const overlapStart = Math.max(existing.startPos, section.startPos);
      const overlapEnd = Math.min(existing.endPos, section.endPos);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      const minLength = Math.min(existing.endPos - existing.startPos, section.endPos - section.startPos);
      return overlap / minLength > 0.5;
    });

    if (!overlaps) {
      unique.push(section);
    }
  });

  return unique;
}

/**
 * Analyze amendment content to determine type and extract values
 */
function analyzeAmendmentContent(
  text: string,
  startPos: number,
  amendmentNumber: number,
  amendmentDate: string | null
): Amendment[] {
  const amendments: Amendment[] = [];

  // Pattern 1: Tier rate changes
  const tierChangePatterns = [
    /tier\s+(\d+|[a-z]+)\s+(?:increased|changed|revised)\s+(?:from|to)\s+([\d.]+)%?\s+to\s+([\d.]+)%?/gi,
    /([\d.]+)%\s+(?:changed to|revised to|increased to)\s+([\d.]+)%/gi,
    /rebate\s+(?:rate|percentage)\s+(?:of|for)\s+tier\s+(\d+|[a-z]+).*?([\d.]+)%\s+to\s+([\d.]+)%/gi,
  ];

  tierChangePatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      amendments.push({
        amendmentNumber,
        amendmentDate,
        amendmentType: 'tier_rate_change',
        affectedField: 'rebate_tier_rate',
        originalValue: parseFloat(match[match.length - 2]),
        revisedValue: parseFloat(match[match.length - 1]),
        description: `Tier rebate rate changed from ${match[match.length - 2]}% to ${match[match.length - 1]}%`,
        sourceQuote: match[0],
        confidence: 0.9,
      });
    });
  });

  // Pattern 2: Date changes
  const dateChangePatterns = [
    /(?:effective|expiration|termination)\s+date\s+(?:changed|revised|extended)\s+(?:from|to)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+to\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
    /extend(?:ed|s)?\s+(?:through|to|until)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
  ];

  dateChangePatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const originalDate = match.length > 2 ? normalizeDate(match[1]) : null;
      const revisedDate = normalizeDate(match[match.length - 1]);

      amendments.push({
        amendmentNumber,
        amendmentDate,
        amendmentType: 'date_change',
        affectedField: 'contract_dates',
        originalValue: originalDate,
        revisedValue: revisedDate,
        description: `Contract date ${originalDate ? `changed from ${originalDate} to` : 'extended to'} ${revisedDate}`,
        sourceQuote: match[0],
        confidence: 0.85,
      });
    });
  });

  // Pattern 3: Facility additions/removals
  const facilityPatterns = [
    /(?:add|include|append)\s+(?:the following )?facilit(?:y|ies):\s*([^\n.]+)/gi,
    /(?:remove|delete|exclude)\s+facilit(?:y|ies):\s*([^\n.]+)/gi,
  ];

  facilityPatterns.forEach((pattern, idx) => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      amendments.push({
        amendmentNumber,
        amendmentDate,
        amendmentType: idx === 0 ? 'facility_addition' : 'facility_removal',
        affectedField: 'facilities',
        originalValue: null,
        revisedValue: match[1].trim(),
        description: `Facility ${idx === 0 ? 'added' : 'removed'}: ${match[1].trim()}`,
        sourceQuote: match[0],
        confidence: 0.8,
      });
    });
  });

  // Pattern 4: Product additions/removals
  const productPatterns = [
    /(?:add|include|append)\s+(?:the following )?product(?:s)?.*?(?:ndc|sku).*?([0-9-]+)/gi,
    /(?:remove|delete|exclude)\s+product(?:s)?.*?(?:ndc|sku).*?([0-9-]+)/gi,
  ];

  productPatterns.forEach((pattern, idx) => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      amendments.push({
        amendmentNumber,
        amendmentDate,
        amendmentType: idx === 0 ? 'product_addition' : 'product_removal',
        affectedField: 'products',
        originalValue: null,
        revisedValue: match[1].trim(),
        description: `Product ${idx === 0 ? 'added' : 'removed'}: ${match[1].trim()}`,
        sourceQuote: match[0],
        confidence: 0.8,
      });
    });
  });

  // Pattern 5: Payment term changes
  const paymentPatterns = [
    /payment\s+(?:due|terms)\s+(?:changed|revised)\s+(?:from|to)\s+([^\n]+?)\s+to\s+([^\n.]+)/gi,
    /(?:net|due)\s+(\d+)\s+days\s+(?:changed to|revised to)\s+(\d+)\s+days/gi,
  ];

  paymentPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      amendments.push({
        amendmentNumber,
        amendmentDate,
        amendmentType: 'payment_term_change',
        affectedField: 'payment_terms',
        originalValue: match[1].trim(),
        revisedValue: match[2].trim(),
        description: `Payment terms changed from "${match[1].trim()}" to "${match[2].trim()}"`,
        sourceQuote: match[0],
        confidence: 0.85,
      });
    });
  });

  return amendments;
}

/**
 * Detect inline changes (strikethrough, "revised to", etc.)
 */
function detectInlineChanges(fullText: string): Amendment[] {
  const amendments: Amendment[] = [];

  // Pattern: "X revised to Y" or "X changed to Y"
  const revisionPatterns = [
    /(\d+(?:\.\d+)?%?)\s+(?:revised|changed|amended|modified)\s+to\s+(\d+(?:\.\d+)?%?)/gi,
    /from\s+([^\s]+)\s+to\s+([^\s]+)/gi,
  ];

  revisionPatterns.forEach(pattern => {
    const matches = [...fullText.matchAll(pattern)];
    matches.forEach(match => {
      amendments.push({
        amendmentNumber: 0,
        amendmentDate: null,
        amendmentType: 'other',
        affectedField: 'unknown',
        originalValue: match[1],
        revisedValue: match[2],
        description: `Inline change: ${match[1]} → ${match[2]}`,
        sourceQuote: match[0],
        confidence: 0.6,
      });
    });
  });

  return amendments;
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string {
  // Try to parse common date formats
  const formats = [
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,  // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,  // YYYY/MM/DD
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/,  // MM/DD/YY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (match[1].length === 4) {
        // YYYY-MM-DD format
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else if (match[3].length === 4) {
        // MM/DD/YYYY format (assuming US format)
        return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      } else {
        // MM/DD/YY format
        const year = parseInt(match[3]) + 2000;
        return `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      }
    }
  }

  return dateStr; // Return as-is if can't parse
}

/**
 * Check if amendments conflict with extracted data
 */
export function checkAmendmentConflicts(
  amendments: Amendment[],
  extractedData: any
): Array<{ amendment: Amendment; conflict: string }> {
  const conflicts: Array<{ amendment: Amendment; conflict: string }> = [];

  amendments.forEach(amendment => {
    if (amendment.amendmentType === 'tier_rate_change' && extractedData.financialFields) {
      // Check if extracted tiers match amended values
      const tiers = extractedData.financialFields.rebateTiers || [];
      const hasOriginalValue = tiers.some((t: any) => t.rebatePercentage === amendment.originalValue);
      const hasRevisedValue = tiers.some((t: any) => t.rebatePercentage === amendment.revisedValue);

      if (hasOriginalValue && !hasRevisedValue) {
        conflicts.push({
          amendment,
          conflict: `Extracted data contains original tier rate (${amendment.originalValue}%), but amendment revises it to ${amendment.revisedValue}%. Extracted data may be from pre-amendment version.`,
        });
      }
    }

    if (amendment.amendmentType === 'date_change' && extractedData.generalFields) {
      // Check if extracted dates match amended values
      const dates = [
        extractedData.generalFields.effectiveDate,
        extractedData.generalFields.expirationDate,
        extractedData.generalFields.executionDate,
      ];

      if (dates.includes(amendment.originalValue) && !dates.includes(amendment.revisedValue)) {
        conflicts.push({
          amendment,
          conflict: `Extracted data contains original date (${amendment.originalValue}), but amendment changes it to ${amendment.revisedValue}. Extracted data may be from pre-amendment version.`,
        });
      }
    }
  });

  return conflicts;
}
