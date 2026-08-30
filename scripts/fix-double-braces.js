const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

function fixDoubleBracesInDocx(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        
        let modified = false;

        // Iterate over all files in the docx zip
        for (const relativePath in zip.files) {
            // We only need to check XML files (document content, headers, footers)
            if (relativePath.endsWith('.xml')) {
                const file = zip.files[relativePath];
                let xmlText = file.asText();
                const originalText = xmlText;
                
                // Replace strict double braces
                xmlText = xmlText.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
                
                // Handle cases where MS Word splits the brace across XML tags 
                // e.g., {</w:t></w:r><w:r><w:t>{
                // This regex finds a brace, any number of XML tags, and another brace, replacing with a single brace
                xmlText = xmlText.replace(/\{((?:<[^>]+>)+)\{/g, '{$1');
                xmlText = xmlText.replace(/\}((?:<[^>]+>)+)\}/g, '}$1');

                if (xmlText !== originalText) {
                    zip.file(relativePath, xmlText);
                    modified = true;
                }
            }
        }

        if (modified) {
            // Generate the updated zip buffer
            const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
            fs.writeFileSync(filePath, buf);
            console.log(`✅ Fixed braces in: ${path.basename(filePath)}`);
        } else {
            console.log(`ℹ️ No double braces found in: ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    }
}

// Get the target path from command line arguments
const targetPath = process.argv[2];

if (!targetPath) {
    console.log("Usage: node fix-double-braces.js <path-to-docx-or-directory>");
    console.log("Example: node scripts/fix-double-braces.js format/md-24/01_Cover_Letter_MD24.docx");
    console.log("Example: node scripts/fix-double-braces.js format/md-24");
    process.exit(1);
}

const absolutePath = path.resolve(targetPath);

if (fs.existsSync(absolutePath)) {
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
        console.log(`Scanning directory: ${absolutePath}`);
        const scanDir = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    scanDir(fullPath);
                } else if (fullPath.endsWith('.docx') && !file.startsWith('~$')) {
                    fixDoubleBracesInDocx(fullPath);
                }
            });
        };
        scanDir(absolutePath);
        console.log("Done scanning directory.");
    } else if (absolutePath.endsWith('.docx')) {
        fixDoubleBracesInDocx(absolutePath);
    } else {
        console.error("Please provide a .docx file or a directory containing .docx files.");
    }
} else {
    console.error("Path does not exist:", absolutePath);
}
