import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not configured in .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.users.findUnique({
    where: { email: 'darmfma@gmail.com' },
    include: { roles: true },
  });
  console.log('USER FROM DATABASE:', JSON.stringify(user, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
