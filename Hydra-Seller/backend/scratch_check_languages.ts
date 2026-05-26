import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dbLanguages = await prisma.languages.findMany();
  console.log('Database Languages:', JSON.stringify(dbLanguages, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
