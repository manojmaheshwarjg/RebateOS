/**
 * Test script to check if contract extraction is working
 * Run this in browser console on a contract review page
 */

(async () => {
    console.log('=== Contract Extraction Test ===');

    // Check if we have extracted fields
    const fields = await db.extracted_fields.toArray();
    console.log(`Total extracted fields: ${fields.length}`);

    if (fields.length > 0) {
        console.log('Sample fields:', fields.slice(0, 5).map(f => ({
            name: f.field_name,
            value: f.value_text || f.value_json,
            confidence: f.confidence_score
        })));
    }

    // Check contract files
    const files = await db.contract_files.toArray();
    console.log(`\nTotal contract files: ${files.length}`);

    files.forEach(f => {
        console.log(`\nFile: ${f.file_name}`);
        console.log(`  Status: ${f.parsing_status}`);
        console.log(`  Type: ${f.document_type || 'unknown'}`);
        console.log(`  Confidence: ${f.extraction_confidence || 'N/A'}`);
        if (f.extraction_errors) {
            console.error(`  Error:`, f.extraction_errors);
        }
    });

    // Check if Groq API key is set
    console.log('\n=== Environment Check ===');
    console.log('Groq API Key exists:', !!process.env.GROQ_API_KEY || !!process.env.NEXT_PUBLIC_GROQ_API_KEY);
})();
