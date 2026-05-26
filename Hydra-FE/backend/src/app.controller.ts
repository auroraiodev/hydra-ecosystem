import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './database/prisma.service.js';
import { Public } from './auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Hello world',
    description: 'Root endpoint — returns a simple greeting to confirm the API is running.',
  })
  @ApiResponse({ status: 200, description: 'Greeting returned.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @ApiOperation({
    summary: 'Database health check',
    description:
      'Checks database connectivity and returns the current number of registered roles. ' +
      'Used by load balancers and monitoring services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check result (may indicate DB status ok or error).',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        database: { type: 'string', example: 'connected' },
        roles: { type: 'number', example: 3 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const roleCount = await this.prisma.roles.count();

      return {
        status: 'ok',
        database: 'connected',
        roles: roleCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('settings/public')
  @Public()
  @ApiOperation({
    summary: 'Get public site settings',
    description:
      'Returns publicly accessible site configuration values ' +
      '(site name, support email, logo URL, etc.). No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public settings key-value map.',
    schema: {
      type: 'object',
      example: { site_name: 'HydraCollect', support_email: 'support@hydracollect.com' },
    },
  })
  async getPublicSettings() {
    try {
      const publicKeys = [
        'site_name',
        'support_email',
        'contact_phone',
        'marketplace_name',
        'site_logo',
        'site_loader',
      ];
      const settings = await this.prisma.admin_settings.findMany({
        where: {
          key: { in: publicKeys },
        },
      });
      return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    } catch (error) {
      console.error('[AppController] Error fetching public settings:', error);
      return {};
    }
  }
}
