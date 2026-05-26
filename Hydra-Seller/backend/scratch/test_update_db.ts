import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const pool = new pg.Pool({
  connectionString,
  ssl: false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateGeneralSettings(settings: Record<string, any>): Promise<void> {
  const ops = Object.entries(settings).map(([key, value]) =>
    prisma.admin_settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    }),
  );

  await prisma.$transaction(ops);
}

async function main() {
  const payload = {
    site_name: 'Hydra Collectables Test',
    admin_email: 'darmfma_test@gmail.com',
    support_email: 'darmfma_test@gmail.com',
    max_products_per_page: '12',
    tax_rate: 'undefined',
  };

  await updateGeneralSettings(payload);
  console.log('Update completed.');

  const settings = await prisma.admin_settings.findMany();
  console.log('After update settings:');
  console.log(JSON.stringify(settings, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
