import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProcessingStatus() {
  console.log('--- Checking Processing Status ---\n');

  // Get the most recent contract
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!contracts || contracts.length === 0) {
    console.log('No contracts found');
    return;
  }

  const contract = contracts[0];
  console.log(`Contract: ${contract.name || contract.id}`);
  console.log(`Parsing Status: ${contract.parsing_status}`);
  console.log(`Review Status: ${contract.review_status}\n`);

  // Get files for this contract
  const { data: files } = await supabase
    .from('contract_files')
    .select('*')
    .eq('contract_id', contract.id);

  console.log(`--- Files (${files?.length || 0}) ---`);
  files?.forEach(f => {
    console.log(`File: ${f.file_name}`);
    console.log(`  Parsing Status: ${f.parsing_status}`);
    console.log(`  Started: ${f.parsing_started_at || 'N/A'}`);
    console.log(`  Completed: ${f.parsing_completed_at || 'N/A'}`);
    console.log(`  Errors: ${f.extraction_errors ? JSON.stringify(f.extraction_errors) : 'None'}`);
    console.log('');
  });

  // Get extracted fields
  const { data: fields } = await supabase
    .from('extracted_fields')
    .select('*')
    .eq('contract_id', contract.id);

  console.log(`--- Extracted Fields (${fields?.length || 0}) ---`);
  if (fields && fields.length > 0) {
    fields.forEach(f => {
      console.log(`${f.field_category}.${f.field_name}: ${f.value_text || f.value_numeric || 'N/A'}`);
    });
  } else {
    console.log('No extracted fields found!');
  }
}

checkProcessingStatus();
