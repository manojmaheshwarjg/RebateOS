
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFiles() {
  console.log('--- Checking Contract Files ---');

  const { data: files, error } = await supabase
    .from('contract_files')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching files:', error);
    return;
  }

  console.log(`Found ${files.length} files in total (showing last 10):`);
  files.forEach(f => {
    console.log(`- ID: ${f.id}`);
    console.log(`  Name: ${f.file_name}`);
    console.log(`  Contract ID: ${f.contract_id}`);
    console.log(`  Path: ${f.file_path}`);
    console.log(`  Created: ${f.created_at}`);
    console.log('---');
  });
}

checkFiles();
