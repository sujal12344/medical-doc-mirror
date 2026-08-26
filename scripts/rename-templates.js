/**
 * rename-templates.js
 *
 * Renames all .docx template files under format/ by removing
 * the "MD-{number}_" segment from their filenames.
 *
 * Examples:
 *   01_MD-3_Covering_Letter_Template.docx  →  01_Covering_Letter_Template.docx
 *   02_Official_Form_MD-3_Template.docx    →  02_Official_Form_Template.docx
 *
 * Usage:
 *   node scripts/rename-templates.js          (dry-run, shows what would change)
 *   node scripts/rename-templates.js --apply  (actually renames the files)
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--apply');

if (DRY_RUN) {
  console.log('DRY RUN — no files will be renamed. Pass --apply to commit changes.\n');
}

// Pattern: one or more occurrences of "MD-<digits>_" anywhere in the filename
const MD_PATTERN = /MD-\d+_/gi;

const formatDir = path.join(__dirname, '..', 'format');

if (!fs.existsSync(formatDir)) {
  console.error(`format/ directory not found at: ${formatDir}`);
  process.exit(1);
}

let totalRenamed = 0;
let totalSkipped = 0;

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDir(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.docx')) continue;

    const newName = entry.name.replace(MD_PATTERN, '');

    if (newName === entry.name) {
      totalSkipped++;
      continue; // Nothing to change
    }

    const newPath = path.join(dir, newName);
    const relOld = path.relative(process.cwd(), fullPath);
    const relNew = path.relative(process.cwd(), newPath);

    if (fs.existsSync(newPath)) {
      console.warn(`  ⚠  SKIP (target already exists): ${relOld}  →  ${relNew}`);
      totalSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  →  ${relOld}`);
      console.log(`     ${relNew}\n`);
    } else {
      fs.renameSync(fullPath, newPath);
      console.log(`  ✓  Renamed: ${relOld}  →  ${relNew}`);
    }

    totalRenamed++;
  }
}

processDir(formatDir);

console.log('\n--- Summary ---');
console.log(`  Files to rename : ${totalRenamed}`);
console.log(`  Files skipped   : ${totalSkipped}`);
if (DRY_RUN && totalRenamed > 0) {
  console.log('\nRun with --apply to apply all renames.');
}
