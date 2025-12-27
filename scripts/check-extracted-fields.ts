import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExtractedFields() {
    console.log('\n🔍 Checking Extracted Fields...\n');

    // Get all contract files
    const { data: files, error: filesError } = await supabase
        .from('contract_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (filesError) {
        console.error('Error fetching files:', filesError);
        return;
    }

    console.log(`Found ${files?.length || 0} recent contract files:`);
    console.log('');

    for (const file of files || []) {
        console.log(`📄 File: ${file.file_name}`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Status: ${file.parsing_status}`);
        console.log(`   Document Type: ${file.document_type || 'Not classified'}`);
        console.log(`   Confidence: ${file.extraction_confidence || 'N/A'}`);

        // Get extracted fields for this file
        const { data: fields, error: fieldsError } = await supabase
            .from('extracted_fields')
            .select('*')
            .eq('source_file_id', file.id);

        if (fieldsError) {
            console.log(`   ❌ Error fetching fields: ${fieldsError.message}`);
        } else {
            console.log(`   ✅ Extracted Fields: ${fields?.length || 0}`);
            
            if (fields && fields.length > 0) {
                const categories = fields.reduce((acc, f) => {
                    acc[f.field_category] = (acc[f.field_category] || 0) + 1;
                    return acc;
                }, {} as Record<string,number>);
                
                console.log(`   Categories:`, categories);
                console.log(`   Sample field:`, {
                    name: fields[0].field_name,
                    label: fields[0].field_label,
                    value: fields[0].value_text || fields[0].value_numeric
                });
            }
        }
        console.log('');
    }

    // Overall stats
    const { count: totalFields } = await supabase
        .from('extracted_fields')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total Extracted Fields in Database: ${totalFields || 0}\n`);
}

checkExtractedFields().catch(console.error);
