import fs from 'fs';

const src = 'C:/Users/demis/OneDrive/Documents/Hydra/apps/hydra-admin/proxy_debug.log';
try {
  if (fs.existsSync(src)) {
    const raw = fs.readFileSync(src);
    const content = raw.toString('utf8');
    const lines = content.split('\n');
    console.log('Total proxy lines:', lines.length);
    const matches = lines.filter(l => l.includes('settings') && l.includes('POST'));
    console.log('--- SETTINGS POST REQUESTS ---');
    console.log(matches.join('\n'));
  } else {
    console.error('Source does not exist:', src);
  }
} catch (err: any) {
  console.error('Error:', err.message);
}
