import fs from 'fs';
import path from 'path';

const searchDir = path.join(process.cwd(), '.next/static/chunks');

function deleteMaps(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      deleteMaps(fullPath);
    } else if (file.endsWith('.map')) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${file}`);
    }
  }
}

console.log('Cleaning up source maps from .next/static/chunks...');
deleteMaps(searchDir);
console.log('Post-build cleanup complete.');
