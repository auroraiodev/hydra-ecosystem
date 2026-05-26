import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

console.log('--- DIR DEBUG ---');
console.log('process.cwd():', process.cwd());

const paths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), 'apps/catalog/.env'),
];

for (const p of paths) {
  console.log(`Checking path: ${p}`);
  if (fs.existsSync(p)) {
    console.log(`-> EXISTS!`);
    const content = fs.readFileSync(p, 'utf8');
    const parsed = dotenv.parse(content);
    console.log(`-> JWT_SECRET: ${parsed.JWT_SECRET}`);
    console.log(`-> DATABASE_URL: ${parsed.DATABASE_URL}`);
  } else {
    console.log(`-> DOES NOT EXIST`);
  }
}
