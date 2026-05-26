import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    // Configure SSL based on DB_SSL environment variable or sslmode in URL
    const hasSslDisabledInUrl =
      connectionString.includes('sslmode=disable') || connectionString.includes('ssl=false');
    const dbSslEnv = configService.get<string>('DB_SSL');

    const sslConfig =
      dbSslEnv === 'false' || hasSslDisabledInUrl ? false : { rejectUnauthorized: false };

    // Configure pg.Pool
    const pool = new pg.Pool({
      connectionString,
      ssl: sslConfig === false ? undefined : sslConfig,
      max: 25,
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
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
