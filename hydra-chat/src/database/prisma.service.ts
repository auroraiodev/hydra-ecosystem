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
    if (!connectionString) throw new Error('DATABASE_URL is not configured');

    const hasSslDisabled =
      connectionString.includes('sslmode=disable') || connectionString.includes('ssl=false');
    const dbSslEnv = configService.get<string>('DB_SSL');
    const sslConfig =
      dbSslEnv === 'false' || hasSslDisabled ? false : { rejectUnauthorized: false };

    const pool = new pg.Pool({
      connectionString,
      ssl: sslConfig === false ? undefined : sslConfig,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 20000,
    });

    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.error('Database connection failed', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
