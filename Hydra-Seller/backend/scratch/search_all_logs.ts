import fs from 'fs';
import path from 'path';

const files = [
  '../../../admin_svc.log',
  '../../../admin_svc_err.log',
  '../../../backend.log',
  '../../../backend_error.log',
  '../../../be_svc.log',
  '../../../be_svc_err.log'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;

  console.log(`\n=== File: ${file} ===`);
  const raw = fs.readFileSync(filePath);
  
  let content = '';
  if (raw[1] === 0 && raw[3] === 0) {
    content = raw.toString('utf16le');
  } else {
    content = raw.toString('utf8');
  }

  const lines = content.split('\n');
  const matched = lines.filter(l => l.includes('settings') || l.includes('settings') || l.includes('error') || l.includes('Exception') || l.includes('validation'));
  console.log(`Found ${matched.length} matches:`);
  console.log(matched.slice(-20).join('\n'));
}
