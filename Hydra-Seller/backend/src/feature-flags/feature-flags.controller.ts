import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service.js';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto.js';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all feature flags',
    description:
      'Returns all feature flags and their current enabled/disabled state. ' +
      'Public endpoint used by frontends to conditionally enable/disable features.',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flags list.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'chat_enabled' },
          enabled: { type: 'boolean', example: true },
          label: { type: 'string', example: 'Chat de soporte (Marketplace)' },
        },
      },
    },
  })
  getAll() {
    return this.service.getAll();
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Toggle a feature flag (admin)',
    description: 'Enables or disables a specific feature flag by key.',
  })
  @ApiParam({ name: 'key', type: String, description: 'Feature flag key', example: 'chat_enabled' })
  @ApiResponse({
    status: 200,
    description: 'Feature flag updated.',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', example: 'chat_enabled' },
        enabled: { type: 'boolean', example: true },
        label: { type: 'string', example: 'Chat de soporte (Marketplace)' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  @ApiResponse({ status: 403, description: 'User is not an admin.' })
  update(@Param('key') key: string, @Body() body: UpdateFeatureFlagDto) {
    return this.service.set(key, body.enabled);
  }
}
