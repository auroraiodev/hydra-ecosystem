import { Injectable } from '@nestjs/common';
import { PrismaService } from '@hydra/database';
import { CacheService } from '@hydra/common';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  label: string;
}

// Default flags seeded if not present in DB
const DEFAULTS: FeatureFlag[] = [
  { key: 'chat_enabled', enabled: true, label: 'Chat de soporte (Marketplace)' },
  { key: 'maintenance_mode', enabled: false, label: 'Modo Mantenimiento (Global)' },
];

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getAll(): Promise<FeatureFlag[]> {
    await Promise.all(
      DEFAULTS.map((d) =>
        this.prisma.feature_flags.upsert({
          where: { key: d.key },
          create: { key: d.key, enabled: d.enabled, label: d.label },
          update: { label: d.label },
        }),
      ),
    );
    const rows = await this.prisma.feature_flags.findMany({ orderBy: { key: 'asc' } });
    return rows.map((r) => ({ key: r.key, enabled: r.enabled, label: r.label }));
  }

  async get(key: string): Promise<boolean> {
    const row = await this.prisma.feature_flags.findUnique({ where: { key } });
    if (row) return row.enabled;
    return DEFAULTS.find((d) => d.key === key)?.enabled ?? true;
  }

  async set(key: string, enabled: boolean): Promise<FeatureFlag> {
    const row = await this.prisma.feature_flags.upsert({
      where: { key },
      create: {
        key,
        enabled,
        label: DEFAULTS.find((d) => d.key === key)?.label ?? key,
      },
      update: { enabled },
    });
    return { key: row.key, enabled: row.enabled, label: row.label };
  }
}
