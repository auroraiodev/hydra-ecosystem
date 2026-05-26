import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    try {
      const url = new URL(connectionString);
      console.log(`[PrismaService] Connecting to DB at ${url.hostname}:${url.port}`);
    } catch {
      console.error('[PrismaService] Failed to parse connection string for logging');
    }

    const hasSslDisabledInUrl =
      connectionString.includes('sslmode=disable') || connectionString.includes('ssl=false');
    const dbSslEnv = configService.get<string>('DB_SSL');

    const sslConfig =
      dbSslEnv === 'false' || hasSslDisabledInUrl ? false : { rejectUnauthorized: false };

    const pool = new pg.Pool({
      connectionString,
      ssl: sslConfig === false ? undefined : sslConfig,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 20000,
      options: '-c client_encoding=UTF8',
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[PrismaService] ✅ Database connection established successfully');
    } catch (error) {
      console.error('[PrismaService] ❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
