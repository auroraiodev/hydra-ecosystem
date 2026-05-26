import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Prisma client with adapter for Supabase
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

// Configure SSL based on DB_SSL environment variable or sslmode in URL
const hasSslDisabledInUrl = connectionString.includes('sslmode=disable');
const sslConfig =
  process.env.DB_SSL === 'false' || hasSslDisabledInUrl
    ? false
    : { rejectUnauthorized: false };

const pool = new pg.Pool({
  connectionString: connectionString,
  ssl: sslConfig,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool as any);
// TypeScript should infer the correct type from the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Seed roles
  console.log('Seeding roles...');

  const roles = [
    {
      name: 'ADMIN' as const,
      display_name: 'Administrator',
    },
    {
      name: 'CLIENT' as const,
      display_name: 'Client',
    },
    {
      name: 'SELLER' as const,
      display_name: 'Seller',
    },
  ];

  for (const role of roles) {
    const existingRole = await prisma.roles.findUnique({
      where: { name: role.name },
    });

    if (existingRole) {
      console.log(`Role ${role.name} already exists, skipping...`);
    } else {
      const created = await prisma.roles.create({
        data: role,
      });
      console.log(`Created role: ${created.display_name} (${created.name})`);
    }
  }

  // Seed languages
  console.log('Seeding languages...');

  const languages = [
    {
      code: 'JP',
      name: 'Japonés',
      display_name: 'Japonés',
    },
    {
      code: 'EN',
      name: 'Inglés',
      display_name: 'Inglés',
    },
    {
      code: 'CS',
      name: 'Chino Simplificado',
      display_name: 'Chino Simplificado',
    },
    {
      code: 'CT',
      name: 'Chino Tradicional',
      display_name: 'Chino Tradicional',
    },
    {
      code: 'FR',
      name: 'Francés',
      display_name: 'Francés',
    },
    {
      code: 'DE',
      name: 'Alemán',
      display_name: 'Alemán',
    },
    {
      code: 'IT',
      name: 'Italiano',
      display_name: 'Italiano',
    },
    {
      code: 'KO',
      name: 'Coreano',
      display_name: 'Coreano',
    },
    {
      code: 'PT',
      name: 'Portugués',
      display_name: 'Portugués',
    },
    {
      code: 'RU',
      name: 'Ruso',
      display_name: 'Ruso',
    },
    {
      code: 'ES',
      name: 'Español',
      display_name: 'Español',
    },
    {
      code: 'AG',
      name: 'Antiguo',
      display_name: 'Antiguo',
    },
  ];

  for (const language of languages) {
    const existingLanguage = await prisma.languages.findFirst({
      where: { code: language.code },
    } as Parameters<typeof prisma.languages.findFirst>[0]);

    if (existingLanguage) {
      console.log(
        `Language ${language.code} (${language.name}) already exists, skipping...`,
      );
    } else {
      await prisma.languages.create({
        data: language,
      });
      console.log(
        `Created language: ${language.display_name} (${language.code})`,
      );
    }
  }

  // Seed categories
  console.log('Seeding categories...');

  const categories = [
    {
      name: 'SINGLES',
      display_name: 'Singles',
      description: 'Una carta individual',
      is_active: true,
      order: 1,
    },
    {
      name: 'BUNDLE',
      display_name: 'Bundle',
      description: 'Paquete/Bundle',
      is_active: true,
      order: 2,
    },
    {
      name: 'BOOSTER_BOX',
      display_name: 'Booster Box',
      description: 'Caja de sobres',
      is_active: true,
      order: 3,
    },
    {
      name: 'MICAS',
      display_name: 'Micas',
      description: 'Micas/Sleeves',
      is_active: true,
      order: 4,
    },
    {
      name: 'BOOSTER',
      display_name: 'Booster',
      description: 'Sobre individual',
      is_active: true,
      order: 5,
    },
    {
      name: 'CONSTRUCTED_DECK',
      display_name: 'Constructed Deck',
      description: 'Mazo construido',
      is_active: true,
      order: 6,
    },
    {
      name: 'PRECON_DECK',
      display_name: 'Precon Deck',
      description: 'Mazo preconstruido',
      is_active: true,
      order: 7,
    },
  ];

  for (const category of categories) {
    const existingCategory = await prisma.categories.findUnique({
      where: { name: category.name },
    });

    if (existingCategory) {
      console.log(
        `Category ${category.name} (${category.display_name}) already exists, skipping...`,
      );
    } else {
      await prisma.categories.create({
        data: category,
      });
      console.log(
        `Created category: ${category.display_name} (${category.name})`,
      );
    }
  }

  // Seed TCGs
  console.log('Seeding TCGs...');

  const tcgs = [
    {
      name: 'Magic',
      display_name: 'Magic: The Gathering',
      is_active: true,
    },
    {
      name: 'Pokemon',
      display_name: 'Pokémon',
      is_active: true,
    },
    {
      name: 'Yugi',
      display_name: 'Yu-Gi-Oh!',
      is_active: true,
    },
    {
      name: 'One piece',
      display_name: 'One Piece',
      is_active: true,
    },
  ];

  for (const tcg of tcgs) {
    // @ts-ignore - PrismaClient with adapter has correct types at runtime
    const existingTcg = await prisma.tcgs.findUnique({
      where: { name: tcg.name },
    });

    if (existingTcg) {
      console.log(
        `TCG ${tcg.name} (${tcg.display_name}) already exists, skipping...`,
      );
    } else {
      // @ts-ignore - PrismaClient with adapter has correct types at runtime
      await prisma.tcgs.create({
        data: tcg,
      });
      console.log(`Created TCG: ${tcg.display_name} (${tcg.name})`);
    }
  }

  // Seed conditions
  console.log('Seeding conditions...');

  const conditions = [
    {
      code: 'NM',
      name: 'Cerca de Mint',
      display_name: 'Cerca de Mint',
      discount: 0,
    },
    {
      code: 'SP',
      name: 'Ligeramente Jugada',
      display_name: 'Ligeramente Jugada',
      discount: 10,
    },
    {
      code: 'MP',
      name: 'Moderadamente Jugada',
      display_name: 'Moderadamente Jugada',
      discount: 20,
    },
    {
      code: 'HP',
      name: 'Muy Jugada',
      display_name: 'Muy Jugada',
      discount: 30,
    },
    {
      code: 'DM',
      name: 'Dañada',
      display_name: 'Dañada',
      discount: 50,
    },
  ];

  for (const condition of conditions) {
    const existingCondition = await prisma.conditions.findFirst({
      where: { code: condition.code },
    } as Parameters<typeof prisma.conditions.findFirst>[0]);

    if (existingCondition) {
      console.log(
        `Condition ${condition.code} (${condition.name}) already exists, skipping...`,
      );
    } else {
      await prisma.conditions.create({
        data: condition,
      });
      console.log(
        `Created condition: ${condition.display_name} (${condition.code})`,
      );
    }
  }

  // Seed admin settings
  console.log('Seeding admin settings...');

  const settings = [
    { key: 'site_name', value: 'Hydra Collect' },
    { key: 'admin_email', value: 'admin@hydracollect.com' },
    { key: 'support_email', value: 'support@hydracollect.com' },
    { key: 'contact_phone', value: '+123456789' },
    { key: 'marketplace_name', value: 'Hydracollect Marketplace' },
    { key: 'site_logo', value: '/cat.png' },
    { key: 'site_loader', value: '/cat.png' },
    { key: 'max_products_per_page', value: '20' },
    { key: 'tax_rate', value: '8' },
    { key: 'shipping_cost', value: '10' },
    { key: 'enable_notifications', value: 'true' },
    { key: 'importTaxRate', value: '0.191' },
    { key: 'profitRate', value: '0.20' },
    { key: 'importation_fixed_fee', value: '0' },
  ];

  for (const setting of settings) {
    const existingSetting = await prisma.admin_settings.findUnique({
      where: { key: setting.key },
    });

    if (existingSetting) {
      console.log(`Setting ${setting.key} already exists, skipping...`);
    } else {
      await prisma.admin_settings.create({
        data: setting,
      });
      console.log(`Created setting: ${setting.key} = ${setting.value}`);
    }
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
