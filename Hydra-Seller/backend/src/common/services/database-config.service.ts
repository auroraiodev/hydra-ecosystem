import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class DatabaseConfigService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseConfigService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.configureConnectionPool();
    await this.optimizeDatabaseSettings();
    await this.validateIndexes();
  }

  private async configureConnectionPool() {
    // Pool settings are configured via DATABASE_URL connection string parameters
    // e.g., postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
  }

  private async optimizeDatabaseSettings() {
    try {
      if (process.env.NODE_ENV === 'development') {
        await this.prisma.$executeRaw`SET log_statement = 'all';`;
        await this.prisma.$executeRaw`SET log_duration = on;`;
      }

      await this.prisma.$executeRaw`SET jit = off;`;
      await this.prisma.$executeRaw`SET work_mem = '4MB';`;
      await this.prisma.$executeRaw`SET shared_preload_libraries = 'pg_stat_statements';`;
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`;
    } catch (error) {
      this.logger.warn(`Could not apply all database optimizations: ${error.message}`);
    }
  }

  private async validateIndexes() {
    try {
      const criticalIndexes = [
        'users_email_idx',
        'users_username_idx',
        'singles_owner_id_idx',
        'singles_category_id_idx',
        'orders_user_id_idx',
        'orders_status_idx',
        'cart_items_cart_id_idx',
      ];

      for (const indexName of criticalIndexes) {
        const result = await this.prisma.$queryRaw`
          SELECT indexname FROM pg_indexes WHERE indexname = ${indexName}
        `;

        if (Array.isArray(result) && result.length === 0) {
          this.logger.warn(`Missing critical index: ${indexName}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not validate indexes: ${error.message}`);
    }
  }

  async getDatabaseStats() {
    try {
      return await this.prisma.$queryRaw`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;
    } catch (error) {
      this.logger.error('Could not fetch database stats', error);
      return null;
    }
  }

  async analyzeSlowQueries(thresholdMs = 1000) {
    try {
      return await this.prisma.$queryRaw`
        SELECT
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > ${thresholdMs}
        ORDER BY mean_time DESC
        LIMIT 10
      `;
    } catch (error) {
      this.logger.error('Could not analyze slow queries', error);
      return null;
    }
  }
}
