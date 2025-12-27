/**
 * AI Generation with Groq Only
 *
 * Uses Groq LLaMA exclusively for all AI tasks.
 * For document processing, text must be extracted from PDFs first.
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

interface GenerateOptions {
  prompt: string;
  config?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
  output?: {
    schema?: any;
  };
  documentText?: string;
}

/**
 * Generate content with Groq LLaMA
 */
export async function generateWithGroq(options: GenerateOptions) {
  console.log('[AI] Using Groq LLaMA (llama-3.3-70b-versatile)...');
  
  let fullPrompt = options.prompt;
  if (options.documentText) {
    fullPrompt = `${options.prompt}\n\n--- DOCUMENT CONTENT ---\n\n${options.documentText}`;
  }
  
  if (options.output?.schema) {
    fullPrompt += '\n\n**CRITICAL: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, explanations, or text outside the JSON object. Return a raw JSON object matching the schema.**';
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert contract analyst. Always respond with valid JSON when asked to extract structured data. Never include markdown formatting or code blocks in your response."
        },
        {
          role: "user",
          content: fullPrompt,
        }
      ],
      temperature: options.config?.temperature || 0.1,
      max_tokens: options.config?.maxOutputTokens || 8192,
      top_p: options.config?.topP || 0.95,
      stream: false,
      response_format: options.output?.schema ? { type: "json_object" } : undefined,
    });

    const content = completion.choices[0]?.message?.content || '';

    let parsedOutput: any = content;
    if (options.output?.schema) {
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsedOutput = JSON.parse(jsonMatch[1].trim());
        } else {
          parsedOutput = JSON.parse(content.trim());
        }
      } catch (parseError: any) {
        console.error('[AI] Groq JSON parse error:', parseError.message);
        console.error('[AI] Raw response:', content.substring(0, 1000));
        throw new Error(`Groq returned invalid JSON: ${parseError.message}`);
      }
    }

    console.log('[AI] Groq succeeded');
    return { output: parsedOutput };
  } catch (error: any) {
    console.error('[AI] Groq failed:', error.message);
    throw error;
  }
}

/**
 * Legacy compatibility function
 */
export async function generateWithFallback(options: any) {
  if (options.media?.url) {
    console.warn('[AI] Media URL provided but Groq cannot process images. Text extraction required.');
  }
  
  return generateWithGroq({
    prompt: options.prompt,
    config: options.config,
    output: options.output,
    documentText: options.documentText,
  });
}

export interface PDFExtractionMetadata {
  text: string;
  extractionMethod: 'text' | 'ocr' | 'hybrid';
  confidence: number;
  pageCount: number;
  processingTime: number;
  requiresReview: boolean;
}

/**
 * Extract text from a PDF data URI using pdf-parse-fork
 * Legacy method - use extractTextWithMetadata for OCR support
 * SERVER-SIDE ONLY
 */
export async function extractTextFromDataUri(dataUri: string): Promise<string> {
  // Only works server-side
  if (typeof window !== 'undefined') {
    console.warn('[AI] extractTextFromDataUri called on client - this is a server-side only function');
    return '[PDF text extraction requires server-side processing]';
  }
  
  try {
    // Dynamic import to avoid bundling in client
    const pdfParse = require('pdf-parse-fork');
    
    // Extract base64 data from data URI
    const base64Match = dataUri.match(/^data:application\/pdf;base64,(.+)$/);
    if (!base64Match) {
      console.warn('[AI] Document is not a PDF, cannot extract text automatically');
      return '[Document content could not be extracted - appears to be an image file]';
    }
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(base64Match[1], 'base64');
    
    // Parse PDF
    const data = await pdfParse(pdfBuffer);
    
    console.log(`[AI] Extracted ${data.numpages} pages, ${data.text.length} characters`);
    
    return data.text;
  } catch (error: any) {
    console.error('[AI] PDF extraction failed:', error.message);
    
    // Return a fallback message instead of throwing
    console.warn('[AI] Continuing with limited extraction capabilities');
    return '[PDF text extraction failed - document may be image-based or corrupted. Please ensure the PDF contains selectable text.]';
  }
}

/**
 * Extract text from PDF with OCR support and metadata
 * Uses hybrid approach: tries text extraction first, falls back to OCR if needed
 */
export async function extractTextWithMetadata(
  dataUri: string,
  onProgress?: (progress: { currentPage: number; totalPages: number; status: string }) => void
): Promise<PDFExtractionMetadata> {
  // For server-side, use standard extraction
  if (typeof window === 'undefined') {
    console.log('[AI] Server-side extraction, using standard method');
    const startTime = Date.now();
    const text = await extractTextFromDataUri(dataUri);
    
    return {
      text,
      extractionMethod: 'text',
      confidence: 1.0,
      pageCount: 1,
      processingTime: Date.now() - startTime,
      requiresReview: false
    };
  }
  
  // For client-side, use hybrid extraction with OCR support
  try {
    const { extractTextFromPDF } = await import('@/lib/pdf-utils');
    return await extractTextFromPDF(dataUri, onProgress);
  } catch (error: any) {
    console.error('[AI] Hybrid extraction failed:', error.message);
    
    // Fall back to standard extraction
    const startTime = Date.now();
    const text = await extractTextFromDataUri(dataUri);
    
    return {
      text,
      extractionMethod: 'text',
      confidence: text.includes('[PDF text extraction failed]') ? 0 : 1.0,
      pageCount: 1,
      processingTime: Date.now() - startTime,
      requiresReview: text.includes('[PDF text extraction failed]')
    };
  }
}
