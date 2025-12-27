'use server';

/**
 * Server-side PDF text extraction
 * More reliable than browser-based extraction
 */

export async function extractPDFTextServer(base64Data: string) {
  console.log('[Server] Extracting PDF text...');

  try {
    // Try using pdf-parse-fork for server-side extraction
    try {
      const pdfParse = require('pdf-parse-fork');
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const data = await pdfParse(pdfBuffer);

      console.log(`[Server] Extracted ${data.numpages} pages, ${data.text.length} characters`);

      return {
        success: true,
        text: data.text,
        pageCount: data.numpages,
        extractionMethod: 'text',
      };
    } catch (parseError: any) {
      console.warn('[Server] pdf-parse-fork failed, trying alternative method:', parseError.message);

      // Fallback: Return a message indicating we need the client to handle it
      // or use a simpler extraction method
      return {
        success: false,
        error: 'PDF parsing failed on server',
        text: '',
        pageCount: 0,
      };
    }
  } catch (error: any) {
    console.error('[Server] PDF extraction failed:', error);
    return {
      success: false,
      error: error.message,
      text: '',
      pageCount: 0,
    };
  }
}
