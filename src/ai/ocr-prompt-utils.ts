/**
 * OCR-Aware Prompting Utilities
 * 
 * Helps Groq handle text extracted via OCR by providing context about
 * potential character recognition errors and fuzzy matching needs.
 */

import type { PDFExtractionResult } from '@/lib/pdf-utils';

/**
 * Generate OCR context section for prompts
 */
export function getOCRContextForPrompt(metadata: PDFExtractionResult): string {
  if (metadata.extractionMethod === 'text') {
    return ''; // No OCR context needed for text-based PDFs
  }

  const confidencePercent = (metadata.confidence * 100).toFixed(0);
  
  return `
**IMPORTANT - OCR EXTRACTION NOTICE:**
This text was extracted via OCR (Optical Character Recognition) with ${confidencePercent}% confidence.
Some characters may be misread. Common OCR errors to account for:
- Digits vs Letters: 0↔O, 1↔l↔I, 5↔S, 8↔B, 6↔G
- Similar shapes: rn↔m, cl↔d, vv↔w
- Punctuation: ,↔. (comma vs period)

**OCR Handling Instructions:**
- Use context clues to infer correct values when characters are ambiguous
- For dollar amounts: verify digits make sense in context (e.g., $1OO,OOO should be $100,000)
- For percentages: ensure values are reasonable (e.g., 5% not S%)
- For dates: validate format and check if dates are logical
- For product codes/NDCs: verify digit patterns match expected formats
- If a field value seems nonsensical, flag it in ambiguousFields array
${metadata.confidence < 0.7 ? '\n⚠️ CONFIDENCE IS LOW (<70%) - Exercise extra caution and flag uncertain fields for review.' : ''}
`;
}

/**
 * Enhance system prompt with OCR awareness
 */
export function enhanceSystemPromptForOCR(
  basePrompt: string,
  metadata: PDFExtractionResult
): string {
  const ocrContext = getOCRContextForPrompt(metadata);
  
  if (!ocrContext) {
    return basePrompt;
  }
  
  return `${basePrompt}\n\n${ocrContext}`;
}

/**
 * Determine if extracted data requires manual review based on OCR metadata
 */
export function shouldFlagForReview(metadata: PDFExtractionResult): boolean {
  // Flag for review if:
  // 1. OCR was used and confidence is low
  // 2. Extraction method is hybrid (uncertain quality)
  return metadata.extractionMethod !== 'text' && metadata.confidence < 0.7;
}

/**
 * Get review reason text for low-confidence extractions
 */
export function getReviewReason(metadata: PDFExtractionResult): string | null {
  if (!shouldFlagForReview(metadata)) {
    return null;
  }
  
  const confidencePercent = (metadata.confidence * 100).toFixed(0);
  
  if (metadata.extractionMethod === 'ocr') {
    return `Document was scanned/image-based. OCR confidence is ${confidencePercent}%. Please verify extracted values.`;
  }
  
  if (metadata.extractionMethod === 'hybrid') {
    return `Mixed text and OCR extraction with ${confidencePercent}% confidence. Please review for accuracy.`;
  }
  
  return null;
}
