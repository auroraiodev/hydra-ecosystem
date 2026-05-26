import fs from 'fs';
import path from 'path';

const src = path.join(process.cwd(), '../../catalog_stdout_new.log');
const dest = path.join(process.cwd(), '../../catalog_utf8_new.log');

try {
  if (fs.existsSync(src)) {
    const raw = fs.readFileSync(src);
    // Convert UTF-16LE to UTF-8
    const content = raw.toString('utf16le');
    fs.writeFileSync(dest, content, 'utf8');
    console.log('New logs successfully converted and saved to catalog_utf8_new.log!');
  } else {
    console.error('Source log file does not exist:', src);
  }
} catch (err: any) {
  console.error('Error converting logs:', err.message);
}
