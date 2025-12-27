/**
 * Simple migration runner for Supabase
 * 
 * This script reads the migration SQL file and provides instructions
 * for running it in your Supabase project.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.join(__dirname, '../supabase/migrations/20241120_enterprise_parser.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     ENTERPRISE MULTI-DOCUMENT PARSER - DATABASE MIGRATION    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📋 Migration file loaded successfully!\n');
console.log(`📁 File: ${migrationPath}`);
console.log(`📏 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

console.log('🔧 TO RUN THIS MIGRATION:\n');
console.log('Option 1: Supabase Dashboard (RECOMMENDED)');
console.log('  1. Go to: https://supabase.com/dashboard/project/gdzxnghnlyjskdbzcpth/sql');
console.log('  2. Click "New Query"');
console.log('  3. Copy the entire migration file content');
console.log('  4. Paste into the SQL editor');
console.log('  5. Click "Run"\n');

console.log('Option 2: Supabase CLI (with access token)');
console.log('  1. Get your access token from: https://supabase.com/dashboard/account/tokens');
console.log('  2. Run: npx supabase link --project-ref gdzxnghnlyjskdbzcpth');
console.log('  3. Run: npx supabase db push\n');

console.log('Option 3: Copy SQL to clipboard');
console.log('  The migration SQL is ready below. Copy it and paste into Supabase SQL Editor:\n');
console.log('─'.repeat(70));
console.log(migrationSQL);
console.log('─'.repeat(70));

console.log('\n✅ After running the migration, you will have:');
console.log('   • 3 new tables (extracted_fields, contract_insights, parsing_audit_log)');
console.log('   • Enhanced contracts & contract_files tables');
console.log('   • Automated triggers for document counting');
console.log('   • Complete RLS policies');
console.log('   • Helper views for queries\n');
