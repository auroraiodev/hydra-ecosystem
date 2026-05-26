import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.js';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the current health status of the auth service.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'hydra-auth' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'hydra-auth',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check (alternate route)',
    description: 'Alias for GET / — returns the same health status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
  })
  getHealthAlt() {
    return this.getHealth();
  }
}
