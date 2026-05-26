import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/guards/jwt-auth.guard.js';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      details?: any;
    };
  };
  metrics?: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
    database?: {
      connections: number;
      maxConnections: number;
      responseTime: number;
    };
  };
}

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if the service is ready to handle traffic',
  })
  @HealthCheck()
  async readinessCheck(): Promise<HealthResponse> {
    const checks = await this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
    ]);

    return this.formatHealthResponse('ready', checks);
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Checks if the service is alive',
  })
  @HealthCheck()
  async livenessCheck(): Promise<HealthResponse> {
    const checks = await this.health.check([
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: '/' }),
    ]);

    return this.formatHealthResponse('live', checks);
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Comprehensive health check with metrics',
  })
  async detailedHealthCheck(): Promise<HealthResponse> {
    const [basicChecks, detailedMetrics] = await Promise.all([
      this.health.check([
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: '/' }),
      ]),
      this.getDetailedMetrics(),
    ]);

    const response = this.formatHealthResponse('detailed', basicChecks);
    response.metrics = detailedMetrics;

    return response;
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Application metrics',
    description: 'Returns detailed application metrics',
  })
  async getMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      application: {
        version: this.configService.get('APP_VERSION', '1.0.0'),
        environment: this.configService.get('NODE_ENV', 'development'),
      },
    };
  }

  private async getDetailedMetrics() {
    const memUsage = process.memoryUsage();
    const dbStats = await this.getDatabaseMetrics();

    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      disk: {
        // This would need implementation based on your hosting environment
        used: 0,
        total: 0,
        percentage: 0,
      },
      database: dbStats,
    };
  }

  private async getDatabaseMetrics() {
    try {
      const startTime = Date.now();
      await this.prismaService.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      // Get connection info (this might need adjustment based on your DB)
      const connectionInfo = await this.prismaService.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;

      return {
        connections: Array.isArray(connectionInfo) ? connectionInfo[0]?.active_connections || 0 : 0,
        maxConnections: parseInt(process.env.DB_POOL_MAX || '20'),
        responseTime,
      };
    } catch (error) {
      return {
        connections: 0,
        maxConnections: 20,
        responseTime: -1,
        error: error.message,
      };
    }
  }

  private formatHealthResponse(type: string, checks: any): HealthResponse {
    const isHealthy = Object.values(checks).every((check: any) => check.status === 'up');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.configService.get('APP_VERSION', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      checks: checks,
    };
  }
}
