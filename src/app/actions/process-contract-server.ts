'use server';

/**
 * Server action for AI processing of contract documents
 * Simplified version that works with Next.js App Router
 */

import Groq from 'groq-sdk';
import { processContractDocumentLocal } from '@/ai/flows/process-contract-document-local';
import type { ProcessDocumentLocalInput } from '@/ai/flows/process-contract-document-local';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ProcessInput {
  fileName: string;
  extractedText: string;
}

export async function processContractAI(input: ProcessInput) {
  console.log('[Server] Processing contract with AI...');

  try {
    // Step 1: Classify document
    const classificationPrompt = `You are an expert healthcare contract document classifier.

Analyze the document text and classify it into one of these categories:
1. **msa** - Master Service Agreement
2. **rebate_schedule** - Rebate percentages, tiers, thresholds
3. **amendment** - Modifications to existing agreements
4. **product_list** - Catalog of products with NDCs
5. **terms** - Legal terms and conditions
6. **compliance** - Regulatory requirements
7. **other** - Doesn't fit above categories

Also determine:
- containsFinancialData: true if you see rebate %, tiers, payment terms
- containsProductData: true if you see product names, NDCs, SKUs

Output JSON only:
{
  "documentType": "rebate_schedule",
  "confidence": 0.9,
  "containsFinancialData": true,
  "containsProductData": false
}

Filename: ${input.fileName}

Document text (first 15000 chars):
${input.extractedText.substring(0, 15000)}`;

    const classificationResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert contract analyst. Always respond with valid JSON." },
        { role: "user", content: classificationPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const classification = JSON.parse(classificationResponse.choices[0]?.message?.content || '{}');
    console.log('[Server] Classification:', classification);

    // Step 2: Extract financial data if needed
    let extractedFields: any[] = [];

    if (classification.containsFinancialData) {
      const extractionPrompt = `Extract ALL financial terms from this contract.

**EXTRACT:**
1. Rebate tiers with thresholds and percentages
2. Payment terms
3. Dates (effective, expiration) in YYYY-MM-DD format
4. Vendor name
5. Exclusions

**OUTPUT (JSON only):**
{
  "vendorName": "PharmaCorp",
  "contractNumber": "PC-2024-001",
  "rebateTiers": [{"tierName": "Tier 1", "rebatePercentage": 5.0}],
  "effectiveDate": "2024-01-01",
  "expirationDate": "2025-12-31",
  "overallConfidence": 0.85
}

Document text:
${input.extractedText.substring(0, 30000)}`;

      const extractionResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert contract analyst. Always respond with valid JSON." },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      });

      const financialData = JSON.parse(extractionResponse.choices[0]?.message?.content || '{}');
      console.log('[Server] Extracted data:', financialData);

      // Convert to field format
      if (financialData.vendorName) {
        extractedFields.push({
          field_category: 'terms',
          field_name: 'vendor_name',
          field_label: 'Vendor Name',
          value_text: financialData.vendorName,
          confidence_score: financialData.overallConfidence || 0.8,
        });
      }

      if (financialData.contractNumber) {
        extractedFields.push({
          field_category: 'terms',
          field_name: 'contract_number',
          field_label: 'Contract Number',
          value_text: financialData.contractNumber,
          confidence_score: financialData.overallConfidence || 0.8,
        });
      }

      if (financialData.rebateTiers && financialData.rebateTiers.length > 0) {
        extractedFields.push({
          field_category: 'financial',
          field_name: 'rebateTiers',
          field_label: 'Rebate Tiers',
          value_json: financialData.rebateTiers,
          value_text: `${financialData.rebateTiers.length} tier(s) extracted`,
          confidence_score: financialData.overallConfidence || 0.8,
        });
      }

      if (financialData.effectiveDate) {
        extractedFields.push({
          field_category: 'dates',
          field_name: 'effective_date',
          field_label: 'Effective Date',
          value_text: financialData.effectiveDate,
          value_date: financialData.effectiveDate,
          confidence_score: financialData.overallConfidence || 0.8,
        });
      }

      if (financialData.expirationDate) {
        extractedFields.push({
          field_category: 'dates',
          field_name: 'expiration_date',
          field_label: 'Expiration Date',
          value_text: financialData.expirationDate,
          value_date: financialData.expirationDate,
          confidence_score: financialData.overallConfidence || 0.8,
        });
      }
    }

    return {
      success: true,
      documentType: classification.documentType || 'other',
      classification,
      extractedFields,
      overallConfidence: classification.confidence || 0.7,
    };

  } catch (error: any) {
    console.error('[Server] Processing failed:', error);
    return {
      success: false,
      error: error.message,
      documentType: 'unknown',
      extractedFields: [],
      overallConfidence: 0,
    };
  }
}

/**
 * Enhanced server wrapper - Uses the LOCAL-ONLY processing pipeline
 * with direct product extraction (NO Supabase database operations)
 */
export async function processContractDocumentEnhancedServer(input: {
  fileId: string;
  contractId: string;
  pdfBase64: string;
  fileName: string;
}) {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  LOCAL ENHANCED PROCESSING (NO DATABASE)                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`[Server] File: ${input.fileName}`);
  console.log(`[Server] Using: processContractDocumentLocal`);
  console.log(`[Server] All extractions performed, results returned to client\n`);

  try {
    // Convert base64 to Buffer on the server side
    console.log(`[Server] Converting base64 to Buffer (${(input.pdfBase64.length / 1024).toFixed(0)} KB)...`);
    const pdfBuffer = Buffer.from(input.pdfBase64, 'base64');
    console.log(`✓ [Server] Buffer created (${(pdfBuffer.length / 1024).toFixed(0)} KB)\n`);

    // Call LOCAL-ONLY processing (no database)
    const result = await processContractDocumentLocal({
      pdfBuffer,
      fileName: input.fileName,
    });
    
    console.log('\n✅ [Server] Local processing completed successfully!');
    console.log(`   Fields: ${result.totalFieldsExtracted}`);
    console.log(`   Products: ${result.productList?.totalProducts || 0}`);
    console.log(`   Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   Client will save to IndexedDB\n`);
    
    return result;
  } catch (error: any) {
    console.error('\n❌ [Server] Local processing failed:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
}
