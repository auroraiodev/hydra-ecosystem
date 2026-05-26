/**
 * Seeds test users for Newman E2E tests.
 * Run with: bun run scripts/seed-test-users.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const hasSslDisabledInUrl = connectionString.includes('sslmode=disable');
const sslConfig =
  process.env.DB_SSL === 'false' || hasSslDisabledInUrl
    ? false
    : { rejectUnauthorized: false };

const pool = new pg.Pool({
  connectionString,
  ssl: sslConfig,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const TEST_USERS = [
  { email: 'cliente@hydracollect.com', username: 'cliente', password: 'password123', first_name: 'Test', last_name: 'Client', role: 'CLIENT' },
  { email: 'vendedor@hydracollect.com', username: 'vendedor', password: 'password123', first_name: 'Test', last_name: 'Seller', role: 'SELLER' },
  { email: 'admin@hydracollect.com', username: 'administrador', password: 'password123', first_name: 'Test', last_name: 'Admin', role: 'ADMIN' },
];

async function main() {
  console.log('=== Seeding test users ===\n');

  for (const u of TEST_USERS) {
    const existing = await prisma.users.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`→ ${u.email} already exists (id: ${existing.id})`);
      continue;
    }

    const role = await prisma.roles.findFirst({ where: { name: u.role as any } });
    if (!role) {
      console.error(`✗ Role ${u.role} not found! Run seed first.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await prisma.users.create({
      data: {
        email: u.email,
        username: u.username,
        password: hashedPassword,
        first_name: u.first_name,
        last_name: u.last_name,
        role_id: role.id,
        is_active: true,
      },
    });
    console.log(`✓ Created ${u.role}: ${u.email} (id: ${user.id})`);
  }

  await prisma.$disconnect();
  console.log('\n=== Done ===');
  console.log('\nTest users ready:');
  for (const u of TEST_USERS) {
    console.log(`  ${u.email} / ${u.password} (${u.role})`);
  }
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
