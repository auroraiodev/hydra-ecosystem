import fs from 'fs';
import path from 'path';

const files = [
  '../../../catalog_stdout.log',
  '../../../catalog_stdout_new.log',
  '../../../catalog_stdout_v2.log',
  '../../../catalog_utf8.log',
  '../../../catalog_utf8_new.log',
  '../../../catalog_utf8_v2.log'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  console.log(`\n=== File: ${file} ===`);
  const raw = fs.readFileSync(filePath);
  
  // Try reading as UTF-8, fallback/check if it looks like UTF-16LE
  let content = '';
  if (raw[1] === 0 && raw[3] === 0) {
    content = raw.toString('utf16le');
  } else {
    content = raw.toString('utf8');
  }

  const lines = content.split('\n');
  const matched = lines.filter(l => l.includes('PricingSettings') || l.includes('Failed to refresh') || l.includes('Parsed settings'));
  console.log(`Found ${matched.length} matches:`);
  console.log(matched.slice(-15).join('\n'));
}
