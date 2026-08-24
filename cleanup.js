const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app', 'api', 'documents', '[id]');
console.log('Cleaning up', dir);

const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.startsWith('generate-md')) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      console.log('Deleting', fullPath);
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}
console.log('Cleanup complete');
