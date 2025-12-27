const fs = require('fs');
const path = require('path');

// Dashboard pages to migrate
const files = [
  'src/app/dashboard/contracts/[contractId]/page.tsx',
  'src/app/dashboard/contracts/[contractId]/review/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/users/page.tsx',
  'src/app/dashboard/calendar/page.tsx',
  'src/app/dashboard/audits/page.tsx',
  'src/app/dashboard/ledger/page.tsx',
];

function migratePage(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Check if it's a server component (async function or createClient import)
  const isServerComponent = content.includes('createClient') || /export\s+default\s+async\s+function/.test(content);

  if (isServerComponent) {
    // Convert to client component
    if (!content.startsWith("'use client'")) {
      content = "'use client';\n\n" + content;
      modified = true;
    }

    // Remove server-side imports
    content = content.replace(/import\s+{\s*createClient\s*}\s+from\s+['"]@\/lib\/supabase\/server['"]\s*;?\n?/g, '');

    // Add client-side imports
    if (!content.includes('useLocalStorage')) {
      content = content.replace(
        /(^['"]use client['"];\n\n)/,
        "$1import { useLocalStorage } from '@/components/local-storage-provider';\nimport { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';\nimport { useState, useEffect } from 'react';\n"
      );
      modified = true;
    }

    // Convert async function to regular function with hooks
    content = content.replace(
      /export\s+default\s+async\s+function\s+(\w+)\s*\(\s*\)\s*{/g,
      'export default function $1() {\n  const { db, userId } = useLocalStorage();\n  const [data, setData] = useState(null);\n  const [isLoading, setIsLoading] = useState(true);\n\n  useEffect(() => {\n    async function fetchData() {'
    );

    // Add effect cleanup
    if (content.includes('async function fetchData()')) {
      content = content.replace(
        /(\s+)(return\s*\()/,
        '$1    }\n    fetchData();\n  }, [db, userId]);\n\n  if (isLoading) return <div>Loading...</div>;\n\n$1$2'
      );
    }

    modified = true;
  }

  // Standard replacements
  const replacements = [
    { from: /import\s+{\s*useSupabase\s*}\s+from\s+['"]@\/components\/supabase-provider['"]/g, to: "import { useLocalStorage } from '@/components/local-storage-provider'" },
    { from: /const\s+{\s*supabase,\s*user\s*}\s*=\s*useSupabase\(\)/g, to: "const { db, userId } = useLocalStorage()" },
    { from: /const\s+{\s*supabase\s*}\s*=\s*useSupabase\(\)/g, to: "const { db } = useLocalStorage()" },
    { from: /const\s+supabase\s*=\s*await\s+createClient\(\)/g, to: "const { db, userId } = useLocalStorage()" },
    { from: /user\.id/g, to: "userId" },
  ];

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

console.log('🚀 Starting migration of dashboard pages...\n');

let migratedCount = 0;
for (const file of files) {
  if (migratePage(file)) {
    migratedCount++;
  }
}

console.log(`\n✨ Migration complete! Updated ${migratedCount} pages.`);
console.log('\n⚠️  Note: Server components converted to client components.');
console.log('Please review the changes and update data fetching logic as needed.\n');
