import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, '../../../be_svc.log');
if (fs.existsSync(filePath)) {
  const raw = fs.readFileSync(filePath);
  let content = '';
  if (raw[1] === 0 && raw[3] === 0) {
    content = raw.toString('utf16le');
  } else {
    content = raw.toString('utf8');
  }

  const lines = content.split('\n');
  console.log('Total backend log lines:', lines.length);
  const matches = lines.filter(l => l.includes('05/20/2026') && (l.includes('settings') || l.includes('admin')));
  console.log('--- TODAY\'S SETTINGS/ADMIN REQUESTS ---');
  console.log(matches.slice(-30).join('\n'));
} else {
  console.error('File not found:', filePath);
}
