/**
 * PDF Processing Utilities with OCR Support
 * 
 * Provides hybrid PDF text extraction that handles both:
 * - Text-based PDFs (standard extraction)
 * - Image-based/scanned PDFs (OCR with Tesseract)
 */

import { createWorker } from 'tesseract.js';

export interface PDFExtractionResult {
  text: string;
  extractionMethod: 'text' | 'ocr' | 'hybrid';
  confidence: number;
  pageCount: number;
  processingTime: number;
  requiresReview: boolean;
}

export interface OCRProgress {
  currentPage: number;
  totalPages: number;
  status: string;
}

/**
 * Detect if a PDF is text-based or image-based
 * Returns true if OCR is needed
 * This function is now handled by extractTextFromPDF automatically
 */
export async function detectPDFNeedsOCR(dataUri: string): Promise<boolean> {
  try {
    // Use pdfjs to check text content
    const pdfjsLib = await import('pdfjs-dist');
    
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    const base64Match = dataUri.match(/^data:application\/pdf;base64,(.+)$/);
    if (!base64Match) {
      return false; // Not a PDF
    }
    
    const pdfData = Uint8Array.from(atob(base64Match[1]), c => c.charCodeAt(0));
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    
    // Check first page for text content
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const textLength = textContent.items.map((item: any) => item.str).join('').trim().length;
    
    console.log(`[PDF-Utils] Found ${textLength} characters on first page of ${pdf.numPages} pages`);
    
    // If very little text, needs OCR
    const needsOCR = textLength < 50;
    
    if (needsOCR) {
      console.log('[PDF-Utils] PDF appears to be image-based, OCR required');
    } else {
      console.log('[PDF-Utils] PDF contains selectable text, standard extraction sufficient');
    }
    
    return needsOCR;
  } catch (error: any) {
    console.error('[PDF-Utils] Error detecting PDF type:', error.message);
    // If detection fails, assume OCR is needed to be safe
    return true;
  }
}

/**
 * Clean OCR text to fix common recognition errors
 */
export function cleanOCRText(text: string): string {
  let cleaned = text;
  
  // Fix common OCR character errors
  // Note: Be careful with replacements to avoid breaking valid text
  
  // Fix standalone zeros that should be letter O (in words)
  cleaned = cleaned.replace(/\b0(?=[a-zA-Z])/g, 'O');
  cleaned = cleaned.replace(/(?<=[a-zA-Z])0\b/g, 'O');
  
  // Fix pipe character misread as I or l
  cleaned = cleaned.replace(/\|(?=[a-zA-Z])/g, 'I');
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Normalize currency spacing
  cleaned = cleaned.replace(/\$\s+/g, '$');
  
  // Fix comma spacing in numbers
  cleaned = cleaned.replace(/(\d)\s*,\s*(\d)/g, '$1,$2');
  
  // Fix percentage spacing
  cleaned = cleaned.replace(/(\d)\s*%/g, '$1%');
  
  // Normalize common ligatures that OCR might misread
  cleaned = cleaned.replace(/ﬁ/g, 'fi');
  cleaned = cleaned.replace(/ﬂ/g, 'fl');
  
  return cleaned.trim();
}

/**
 * Extract text from PDF using OCR (Tesseract)
 */
export async function extractTextWithOCR(
  dataUri: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<PDFExtractionResult> {
  const startTime = Date.now();

  try {
    // Only works in browser
    if (typeof window === 'undefined') {
      throw new Error('OCR extraction requires browser environment');
    }

    console.log('[OCR] Starting OCR processing...');

    // Dynamic import of pdfjs
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker path for pdfjs - with proper checks
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    } else if (pdfjsLib.default?.GlobalWorkerOptions) {
      pdfjsLib.default.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
    // Extract base64 data
    const base64Match = dataUri.match(/^data:application\/pdf;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid PDF data URI');
    }
    
    // Convert base64 to Uint8Array
    const pdfData = Uint8Array.from(atob(base64Match[1]), c => c.charCodeAt(0));

    // Get the getDocument function - handle both default and named exports
    const getDocumentFunc = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
    if (!getDocumentFunc) {
      throw new Error('pdfjs-dist getDocument function not found');
    }

    // Load PDF
    const loadingTask = getDocumentFunc({ data: pdfData });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log(`[OCR] Processing ${numPages} pages...`);
    
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    let fullText = '';
    const confidenceScores: number[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        currentPage: pageNum,
        totalPages: numPages,
        status: `Processing page ${pageNum} of ${numPages}...`
      });
      
      console.log(`[OCR] Processing page ${pageNum}/${numPages}...`);
      
      const page = await pdf.getPage(pageNum);
      
      // Render page to canvas at high resolution for better OCR
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context as any,
        viewport: viewport,
        canvas: canvas as any,
      }).promise;
      
      // Perform OCR on the canvas
      const { data } = await worker.recognize(canvas);
      
      console.log(`[OCR] Page ${pageNum} confidence: ${data.confidence.toFixed(1)}%`);
      
      fullText += data.text + '\n\n';
      confidenceScores.push(data.confidence);
    }
    
    // Cleanup
    await worker.terminate();
    
    // Calculate average confidence
    const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length / 100;
    
    // Clean OCR text
    const cleanedText = cleanOCRText(fullText);
    
    const processingTime = Date.now() - startTime;
    console.log(`[OCR] Complete! Processed ${numPages} pages in ${processingTime}ms with ${(avgConfidence * 100).toFixed(1)}% confidence`);
    
    return {
      text: cleanedText,
      extractionMethod: 'ocr',
      confidence: avgConfidence,
      pageCount: numPages,
      processingTime,
      requiresReview: avgConfidence < 0.7 // Flag for review if confidence is low
    };
    
  } catch (error: any) {
    console.error('[OCR] OCR processing failed:', error.message);
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Extract text from PDF using pdfjs (browser-compatible)
 * This is client-side safe version without pdf-parse-fork
 */
async function extractTextStandard(dataUri: string): Promise<PDFExtractionResult> {
  const startTime = Date.now();

  try {
    // Only works in browser
    if (typeof window === 'undefined') {
      throw new Error('PDF extraction requires browser environment');
    }

    // Dynamic import of pdfjs
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker path for pdfjs - with proper checks
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    } else if (pdfjsLib.default?.GlobalWorkerOptions) {
      pdfjsLib.default.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    } else {
      console.warn('[PDF-Utils] Could not set worker path - GlobalWorkerOptions not found');
    }

    const base64Match = dataUri.match(/^data:application\/pdf;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid PDF data URI');
    }

    // Convert base64 to Uint8Array
    const pdfData = Uint8Array.from(atob(base64Match[1]), c => c.charCodeAt(0));

    // Get the getDocument function - handle both default and named exports
    const getDocumentFunc = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;
    if (!getDocumentFunc) {
      throw new Error('pdfjs-dist getDocument function not found');
    }

    // Load PDF
    const loadingTask = getDocumentFunc({ data: pdfData });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    const processingTime = Date.now() - startTime;

    return {
      text: fullText,
      extractionMethod: 'text',
      confidence: 1.0,
      pageCount: numPages,
      processingTime,
      requiresReview: false
    };
  } catch (error: any) {
    console.error('[PDF-Utils] Standard extraction failed:', error.message);
    console.error('[PDF-Utils] Error details:', error);
    throw error;
  }
}

/**
 * Hybrid PDF text extraction
 * Automatically detects if OCR is needed and uses the appropriate method
 */
export async function extractTextFromPDF(
  dataUri: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<PDFExtractionResult> {
  console.log('[PDF-Utils] Starting hybrid PDF text extraction...');

  // Check environment
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction requires browser environment');
  }

  // First, try standard extraction
  try {
    const standardResult = await extractTextStandard(dataUri);

    // Check if we got enough text
    if (standardResult.text.trim().length > 100) {
      console.log('[PDF-Utils] Standard extraction successful, using text-based result');
      return standardResult;
    }

    console.log('[PDF-Utils] Standard extraction returned minimal text, trying OCR...');

    // If we got minimal text, try OCR
    try {
      const ocrResult = await extractTextWithOCR(dataUri, onProgress);

      // If OCR found significantly more text, use it
      if (ocrResult.text.trim().length > standardResult.text.trim().length * 2) {
        console.log('[PDF-Utils] OCR found significantly more text, using OCR result');
        return {
          ...ocrResult,
          extractionMethod: 'hybrid'
        };
      }
    } catch (ocrError: any) {
      console.warn('[PDF-Utils] OCR failed:', ocrError.message);
      // Continue with standard result even if OCR fails
    }

    // Use standard result (even if minimal)
    console.log('[PDF-Utils] Using standard extraction result');
    return standardResult;

  } catch (standardError: any) {
    console.error('[PDF-Utils] Standard extraction failed:', standardError.message);

    // Try OCR as last resort
    try {
      console.log('[PDF-Utils] Falling back to OCR...');
      return await extractTextWithOCR(dataUri, onProgress);
    } catch (ocrError: any) {
      console.error('[PDF-Utils] OCR also failed:', ocrError.message);
      // Return empty result rather than crashing
      return {
        text: '',
        extractionMethod: 'text',
        confidence: 0,
        pageCount: 0,
        processingTime: 0,
        requiresReview: true
      };
    }
  }
}
