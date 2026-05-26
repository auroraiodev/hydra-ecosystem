const fs = require('fs');
const path = require('path');

const possibleLocations = [
  path.join(__dirname, '../src/generated/client'),
  path.join(__dirname, '../prisma/client'),
  path.join(__dirname, '../node_modules/.prisma/client'),
  path.join(__dirname, '../../node_modules/.prisma/client'),
];

// Try to find the prisma client using require.resolve
try {
  const prismaClientPath = require.resolve('.prisma/client/index.js');
  possibleLocations.push(path.dirname(prismaClientPath));
} catch (e) {
  // Ignore
}

try {
  const prismaClientPath = require.resolve('@prisma/client/index.js');
  possibleLocations.push(path.dirname(prismaClientPath));
} catch (e) {
  // Ignore
}

function fixImportMetaInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Replace import.meta.url with __filename (CommonJS compatible)
  // This is a workaround for Prisma 7 ES module syntax in CommonJS builds
  
  // First, replace the specific pattern with __dirname
  content = content.replace(
    /globalThis\['__dirname'\]\s*=\s*path\.dirname\(\(0,\s*node_url_1\.fileURLToPath\)\(import\.meta\.url\)\);/g,
    "globalThis['__dirname'] = __dirname;"
  );
  
  // Also replace any remaining import.meta.url references
  content = content.replace(/import\.meta\.url/g, '__filename');
  
  // Replace any other import.meta usage
  content = content.replace(/import\.meta/g, '{ url: __filename }');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[FIX] Fixed import.meta in ${path.relative(process.cwd(), filePath)}`);
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  console.log(`[INFO] Scanning directory: ${dir}`);
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportMetaInFile(filePath);
    }
  }
}

let fixed = false;
// Deduplicate locations
const uniqueLocations = [...new Set(possibleLocations)];

for (const dir of uniqueLocations) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
    console.log(`[SUCCESS] Processed Prisma files at: ${dir}`);
    fixed = true;
  }
}

if (!fixed) {
  console.log('[WARN] Prisma generated files not found in any expected location');
  console.log('[INFO] Search locations were:');
  uniqueLocations.forEach(loc => console.log(`  - ${loc}`));
}

