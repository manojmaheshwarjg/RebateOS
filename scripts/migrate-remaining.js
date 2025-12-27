const fs = require('fs');
const path = require('path');

// Files to migrate
const files = [
  'src/components/disputes-table.tsx',
  'src/components/new-dispute-form.tsx',
  'src/components/rules-table.tsx',
  'src/components/rule-builder-form.tsx',
  'src/components/accruals-table.tsx',
  'src/components/bulk-claim-import-form.tsx',
  'src/components/eligibility-queue-table.tsx',
  'src/components/dashboard-layout.tsx',
  'src/components/dashboard-page-content.tsx',
  'src/components/ai-parser-form.tsx',
];

// Migration replacements
const replacements = [
  // Import changes
  {
    from: /import\s+{\s*useSupabase\s*}\s+from\s+['"]@\/components\/supabase-provider['"]/g,
    to: "import { useLocalStorage } from '@/components/local-storage-provider'"
  },
  {
    from: /from\s+['"]@\/components\/supabase-provider['"]/g,
    to: "from '@/components/local-storage-provider'"
  },
  // Hook usage
  {
    from: /const\s+{\s*supabase,\s*user\s*}\s*=\s*useSupabase\(\)/g,
    to: "const { db, userId } = useLocalStorage()"
  },
  {
    from: /const\s+{\s*supabase\s*}\s*=\s*useSupabase\(\)/g,
    to: "const { db } = useLocalStorage()"
  },
  {
    from: /const\s+{\s*user\s*}\s*=\s*useSupabase\(\)/g,
    to: "const { userId } = useLocalStorage()"
  },
  // Common Supabase operations
  {
    from: /supabase\.from\(['"]([^'"]+)['"]\)\.select\(\)/g,
    to: "db.$1.toArray()"
  },
  {
    from: /supabase\.from\(['"]([^'"]+)['"]\)\.select\([^)]+\)/g,
    to: "db.$1.toArray()"
  },
  {
    from: /user\.id/g,
    to: "userId"
  },
  {
    from: /user\?\.id/g,
    to: "userId"
  },
];

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  for (const { from, to } of replacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  }

  if (modified) {
    // Add imports if needed
    if (content.includes('useLocalStorage') && !content.includes('generateId')) {
      const importLine = "import { generateId, getCurrentTimestamp } from '@/lib/local-storage/db';";
      if (!content.includes(importLine)) {
        content = content.replace(
          "import { useLocalStorage",
          `${importLine}\nimport { useLocalStorage`
        );
      }
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

console.log('🚀 Starting migration of remaining files...\n');

let migratedCount = 0;
for (const file of files) {
  if (migrateFile(file)) {
    migratedCount++;
  }
}

console.log(`\n✨ Migration complete! Updated ${migratedCount} files.`);
console.log('\n⚠️  Note: You may need to manually update complex database operations.');
console.log('Please review the changes and test the application.\n');
