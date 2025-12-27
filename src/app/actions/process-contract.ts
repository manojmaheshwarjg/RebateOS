// Client-side contract processing orchestrator
import { processContractDocumentEnhancedServer } from './process-contract-server';

export async function triggerContractProcessing(
  fileId: string,
  contractId: string,
  fileName: string,
  fileDataUri: string
) {
  console.log('[ProcessContract] Starting processing for file:', fileId);
  console.log('[ProcessContract] Using ENHANCED processing with direct product extraction');

  try {
    // Extract base64 data from data URI
    const base64Match = fileDataUri.match(/^data:application\/pdf;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid PDF data URI');
    }
    const base64Data = base64Match[1];
    console.log(`✓ [ProcessContract] PDF base64 extracted (${(base64Data.length / 1024).toFixed(0)} KB)\n`);

    // Call enhanced server processing with ALL phases
    // NOTE: We pass base64 string, not Buffer, because Server Actions can't serialize Buffer
    console.log('[ProcessContract] Calling enhanced server processing...');
    console.log('[ProcessContract] This includes:');
    console.log('  - Phase 1: Table extraction');
    console.log('  - Phase 2: Parallel AI extraction (general, financial, products, facilities, bundles)');
    console.log('  - Phase 3: Field categorization');
    console.log('  - Phase 4: Amendment detection');
    console.log('  - Phase 5: Validation');
    console.log('  - Phase 6: Database persistence\n');

    const result = await processContractDocumentEnhancedServer({
      fileId,
      contractId,
      pdfBase64: base64Data, // Pass base64 string instead of Buffer
      fileName,
    });

    if (!result.success) {
      throw new Error(result.error || 'Processing failed');
    }

    console.log('\n✅ [ProcessContract] Enhanced processing complete!');
    console.log(`   Total fields extracted: ${result.totalFieldsExtracted}`);
    console.log(`   Overall confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
    console.log(`   Validation: ${result.validation?.passed ? '✓ PASSED' : '✗ FAILED'}`);

    // Transform result to match expected format for client
    const extractedFields = [
      ...result.categorizedFields.financialTerms,
      ...result.categorizedFields.products,
      ...result.categorizedFields.termsAndConditions,
      ...result.categorizedFields.importantDates,
    ];

    console.log(`   Returning ${extractedFields.length} categorized fields to client\n`);

    return {
      success: true,
      result: {
        documentType: result.generalFields?.contractType || 'unknown',
        classification: {
          documentType: result.generalFields?.contractType || 'unknown',
          confidence: result.overallConfidence,
          containsFinancialData: result.financialFields !== null,
          containsProductData: result.productList !== null && result.productList.totalProducts > 0,
        },
        extractedFields: extractedFields.map(field => ({
          field_category: field.fieldKey.startsWith('rebate_tier') ? 'financial' :
                         field.fieldKey.startsWith('product_') ? 'product' :
                         field.fieldKey.includes('date') ? 'dates' : 'terms',
          field_name: field.fieldKey,
          field_label: field.label,
          value_text: typeof field.value === 'string' ? field.value : JSON.stringify(field.value),
          value_json: field.rawValue,
          confidence_score: field.confidence || 0.8,
          source_quote: field.source,
          source_page: field.sourcePage,
        })),
        overallConfidence: result.overallConfidence,
        
        // Additional metadata
        totalProducts: result.productList?.totalProducts || 0,
        totalTiers: result.financialFields?.rebateTiers?.length || 0,
        totalFacilities: result.facilitiesData?.facilities?.length || 0,
        validationPassed: result.validation?.passed || false,
        validationScore: result.validation?.overallScore || 0,

        // Return structured data for direct DB updates
        structuredData: {
          financial: result.financialFields,
          general: result.generalFields,
          products: result.productList,
        }
      },
      fieldsExtracted: extractedFields.length
    };
  } catch (error: any) {
    console.error('\n❌ [ProcessContract] Error:', error.message);
    console.error('   Stack:', error.stack);
    return { success: false, error: error.message };
  }
}
