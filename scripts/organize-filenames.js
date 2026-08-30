const fs = require('fs');
const path = require('path');

const formatDir = path.join(__dirname, '..', 'format');

function standardizeFileName(fileName) {
    let baseName = fileName.replace(/\.docx$/i, '');
    
    // Replace non-alphanumeric chars (excluding hyphens) with spaces to split words easily
    let newName = baseName.replace(/[^a-zA-Z0-9\-]/g, ' ');
    
    // Split into words
    let words = newName.split(/\s+/).filter(w => w.length > 0);
    
    // Format leading numbers (e.g. "3 2" -> "03_02_")
    let leadingNumbers = [];
    while (words.length > 0 && /^\d+$/.test(words[0])) {
        let numStr = words.shift();
        // pad with 0 if single digit
        if (numStr.length === 1) {
            numStr = '0' + numStr;
        }
        leadingNumbers.push(numStr);
    }
    
    let prefix = leadingNumbers.join('_');
    if (prefix) {
        prefix += '_';
    }
    
    // Capitalize words properly
    let titleCasedWords = words.map(w => {
        // Keep uppercase acronyms (e.g., IVD, QMS, SOP, CMDTL)
        if (/^[A-Z0-9\-]+$/.test(w)) return w;
        
        // Capitalize first letter, keep the rest as is
        return w.charAt(0).toUpperCase() + w.slice(1);
    });
    
    let body = titleCasedWords.join('_');
    
    // Most files have _Template, add it if missing for consistency
    if (!body.toLowerCase().includes('template')) {
        body += '_Template';
    }
    
    return prefix + body + '.docx';
}

function processDirectory(directory, applyChanges = false) {
    if (!fs.existsSync(directory)) {
        console.error(`Directory not found: ${directory}`);
        return;
    }

    const items = fs.readdirSync(directory);
    
    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath, applyChanges);
        } else if (item.toLowerCase().endsWith('.docx')) {
            const newName = standardizeFileName(item);
            if (newName !== item) {
                const newFullPath = path.join(directory, newName);
                console.log(`Renaming in [${path.basename(directory)}]:\n  From: ${item}\n  To:   ${newName}\n`);
                if (applyChanges) {
                    fs.renameSync(fullPath, newFullPath);
                }
            }
        }
    }
}

const applyChanges = process.argv.includes('--apply');

console.log(`\n=== Form Organizer Script (${applyChanges ? 'APPLY MODE' : 'DRY RUN'}) ===\n`);
if (!applyChanges) {
    console.log("ℹ️  Running in Dry-Run mode. No files will actually be renamed.");
    console.log("ℹ️  To apply changes, run: node scripts/organize-filenames.js --apply\n");
}

processDirectory(formatDir, applyChanges);

if (applyChanges) {
    console.log("✅ Successfully renamed all non-standard files.");
} else {
    console.log("✅ Dry run complete.");
}
